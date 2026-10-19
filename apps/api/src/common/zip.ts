import { once } from 'node:events';
import type { Writable } from 'node:stream';
import { crc32, deflateRawSync } from 'node:zlib';

const LOCAL_SIG = 0x04034b50;
const CENTRAL_SIG = 0x02014b50;
const EOCD_SIG = 0x06054b50;

/** Bit 11: names and comments are UTF-8 rather than CP437. */
const UTF8_FLAG = 0x0800;
const VERSION = 20;
const STORED = 0;
const DEFLATED = 8;

/**
 * Past this the archive would need ZIP64 headers, which this writer does not
 * emit. Screenshots are capped at 5 MB each on upload, so reaching it takes
 * hundreds of them.
 */
export const ZIP_MAX_BYTES = 2 * 1024 * 1024 * 1024;

type Entry = {
  name: Buffer;
  crc: number;
  compressedSize: number;
  size: number;
  method: number;
  offset: number;
  dosTime: number;
  dosDate: number;
};

/** ZIP keeps an MS-DOS stamp: no year before 1980, two-second resolution. */
function dosDateTime(at: Date) {
  const year = Math.max(1980, at.getFullYear());
  return {
    dosTime:
      (at.getHours() << 11) | (at.getMinutes() << 5) | (at.getSeconds() >> 1),
    dosDate: ((year - 1980) << 9) | ((at.getMonth() + 1) << 5) | at.getDate(),
  };
}

export class ZipTooLargeError extends Error {
  constructor() {
    super('The archive is too large to build');
    this.name = 'ZipTooLargeError';
  }
}

/**
 * Minimal streaming ZIP writer.
 *
 * Each entry is written to the output as soon as it is added and only its
 * central-directory record is kept, so peak memory is one entry rather than the
 * whole archive — which is what makes a group's screenshots exportable without
 * buffering all of them. Nothing here needs a dependency: `zlib` provides both
 * crc32 and raw deflate.
 */
export class ZipWriter {
  private readonly entries: Entry[] = [];
  private offset = 0;
  private closed = false;

  constructor(private readonly out: Writable) {}

  get bytesWritten(): number {
    return this.offset;
  }

  get fileCount(): number {
    return this.entries.length;
  }

  async add(
    name: string,
    data: Buffer,
    opts: { deflate?: boolean; at?: Date } = {},
  ): Promise<void> {
    if (this.closed) throw new Error('ZipWriter is already finished');

    const nameBuf = Buffer.from(name, 'utf8');
    // Checked before any deflate, so an oversized archive costs no CPU. The
    // stored size is the right bound: the fallback below guarantees the payload
    // is never larger than the input.
    if (this.offset + 30 + nameBuf.length + data.length > ZIP_MAX_BYTES) {
      throw new ZipTooLargeError();
    }

    // A deflate that grew the input — tiny files, and PNGs, which are already
    // compressed — is stored instead. Storing is always valid and never bigger.
    let method = STORED;
    let payload = data;
    if (opts.deflate) {
      const packed = deflateRawSync(data, { level: 9 });
      if (packed.length < data.length) {
        method = DEFLATED;
        payload = packed;
      }
    }

    const { dosTime, dosDate } = dosDateTime(opts.at ?? new Date());
    const entry: Entry = {
      name: nameBuf,
      crc: crc32(data),
      compressedSize: payload.length,
      size: data.length,
      method,
      offset: this.offset,
      dosTime,
      dosDate,
    };

    const header = Buffer.alloc(30);
    header.writeUInt32LE(LOCAL_SIG, 0);
    header.writeUInt16LE(VERSION, 4);
    header.writeUInt16LE(UTF8_FLAG, 6);
    header.writeUInt16LE(method, 8);
    header.writeUInt16LE(dosTime, 10);
    header.writeUInt16LE(dosDate, 12);
    header.writeUInt32LE(entry.crc, 14);
    header.writeUInt32LE(entry.compressedSize, 18);
    header.writeUInt32LE(entry.size, 22);
    header.writeUInt16LE(nameBuf.length, 26);
    header.writeUInt16LE(0, 28);

    await this.write(header);
    await this.write(nameBuf);
    await this.write(payload);
    this.entries.push(entry);
  }

  addText(
    name: string,
    text: string,
    opts: { at?: Date } = {},
  ): Promise<void> {
    return this.add(name, Buffer.from(text, 'utf8'), { ...opts, deflate: true });
  }

  async finish(): Promise<void> {
    if (this.closed) return;
    this.closed = true;

    const centralStart = this.offset;
    for (const entry of this.entries) {
      const record = Buffer.alloc(46);
      record.writeUInt32LE(CENTRAL_SIG, 0);
      record.writeUInt16LE(VERSION, 4);
      record.writeUInt16LE(VERSION, 6);
      record.writeUInt16LE(UTF8_FLAG, 8);
      record.writeUInt16LE(entry.method, 10);
      record.writeUInt16LE(entry.dosTime, 12);
      record.writeUInt16LE(entry.dosDate, 14);
      record.writeUInt32LE(entry.crc, 16);
      record.writeUInt32LE(entry.compressedSize, 20);
      record.writeUInt32LE(entry.size, 24);
      record.writeUInt16LE(entry.name.length, 28);
      record.writeUInt16LE(0, 30);
      record.writeUInt16LE(0, 32);
      record.writeUInt16LE(0, 34);
      record.writeUInt16LE(0, 36);
      record.writeUInt32LE(0, 38);
      record.writeUInt32LE(entry.offset, 42);
      await this.write(record);
      await this.write(entry.name);
    }

    const eocd = Buffer.alloc(22);
    eocd.writeUInt32LE(EOCD_SIG, 0);
    eocd.writeUInt16LE(0, 4);
    eocd.writeUInt16LE(0, 6);
    eocd.writeUInt16LE(this.entries.length, 8);
    eocd.writeUInt16LE(this.entries.length, 10);
    eocd.writeUInt32LE(this.offset - centralStart, 12);
    eocd.writeUInt32LE(centralStart, 16);
    eocd.writeUInt16LE(0, 20);
    await this.write(eocd);
  }

  private async write(chunk: Buffer): Promise<void> {
    this.offset += chunk.length;
    if (!this.out.write(chunk)) {
      // Without waiting for drain the whole archive would queue in memory,
      // which is the thing streaming it was meant to avoid.
      await once(this.out, 'drain');
    }
  }
}
