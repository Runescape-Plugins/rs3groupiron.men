import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { PassThrough } from 'node:stream';
import { inflateRawSync } from 'node:zlib';
import { ZipTooLargeError, ZipWriter } from './zip';

async function build(
  fill: (zip: ZipWriter) => Promise<void>,
): Promise<{ bytes: Buffer; zip: ZipWriter }> {
  const out = new PassThrough();
  const chunks: Buffer[] = [];
  out.on('data', (chunk: Buffer) => chunks.push(chunk));
  const zip = new ZipWriter(out);
  await fill(zip);
  await zip.finish();
  out.end();
  return { bytes: Buffer.concat(chunks), zip };
}

const EOCD_SIG = 0x06054b50;
const LOCAL_SIG = 0x04034b50;

function readEocd(bytes: Buffer) {
  const at = bytes.length - 22;
  expect(bytes.readUInt32LE(at)).toBe(EOCD_SIG);
  return {
    entries: bytes.readUInt16LE(at + 10),
    centralSize: bytes.readUInt32LE(at + 12),
    centralOffset: bytes.readUInt32LE(at + 16),
  };
}

/** Reads one entry back out of the archive by walking its local header. */
function readLocalEntry(bytes: Buffer, offset: number) {
  expect(bytes.readUInt32LE(offset)).toBe(LOCAL_SIG);
  const flags = bytes.readUInt16LE(offset + 6);
  const method = bytes.readUInt16LE(offset + 8);
  const crc = bytes.readUInt32LE(offset + 14);
  const compressedSize = bytes.readUInt32LE(offset + 18);
  const size = bytes.readUInt32LE(offset + 22);
  const nameLength = bytes.readUInt16LE(offset + 26);
  const name = bytes
    .subarray(offset + 30, offset + 30 + nameLength)
    .toString('utf8');
  const start = offset + 30 + nameLength;
  const payload = bytes.subarray(start, start + compressedSize);
  return {
    name,
    method,
    crc,
    size,
    compressedSize,
    utf8: Boolean((flags >> 11) & 1),
    data: method === 8 ? inflateRawSync(payload) : payload,
    end: start + compressedSize,
  };
}

describe('ZipWriter', () => {
  it('writes an end-of-central-directory record that agrees with the body', async () => {
    const { bytes, zip } = await build(async (z) => {
      await z.addText('a.txt', 'alpha');
      await z.addText('b.txt', 'beta');
    });

    const eocd = readEocd(bytes);
    expect(eocd.entries).toBe(2);
    expect(zip.fileCount).toBe(2);
    expect(zip.bytesWritten).toBe(bytes.length);
    expect(eocd.centralOffset + eocd.centralSize).toBe(bytes.length - 22);
  });

  it('round-trips text, binary, nested paths and empty files', async () => {
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x00, 0xff, 0x10]);
    const { bytes } = await build(async (z) => {
      await z.addText('README.txt', 'hello\n');
      await z.add('screenshots/drops/x.png', png);
      await z.addText('empty.txt', '');
    });

    let offset = 0;
    const first = readLocalEntry(bytes, offset);
    expect(first.name).toBe('README.txt');
    expect(first.data.toString('utf8')).toBe('hello\n');

    offset = first.end;
    const second = readLocalEntry(bytes, offset);
    expect(second.name).toBe('screenshots/drops/x.png');
    expect(second.data.equals(png)).toBe(true);

    offset = second.end;
    const third = readLocalEntry(bytes, offset);
    expect(third.name).toBe('empty.txt');
    expect(third.size).toBe(0);
    expect(third.data.length).toBe(0);
  });

  it('deflates text that compresses and stores anything that would grow', async () => {
    const compressible = 'x'.repeat(5000);
    const { bytes } = await build(async (z) => {
      await z.addText('big.txt', compressible);
      await z.addText('tiny.txt', 'no');
    });

    const big = readLocalEntry(bytes, 0);
    expect(big.method).toBe(8);
    expect(big.compressedSize).toBeLessThan(big.size);
    expect(big.data.toString('utf8')).toBe(compressible);

    // Deflating two bytes produces more than two bytes, so it must fall back.
    const tiny = readLocalEntry(bytes, big.end);
    expect(tiny.method).toBe(0);
    expect(tiny.data.toString('utf8')).toBe('no');
  });

  it('flags names as UTF-8 so non-ASCII filenames survive', async () => {
    const { bytes } = await build(async (z) => {
      await z.addText('skärmbild-名前.txt', 'ok');
    });
    const entry = readLocalEntry(bytes, 0);
    expect(entry.utf8).toBe(true);
    expect(entry.name).toBe('skärmbild-名前.txt');
  });

  it('refuses to add an entry once finished', async () => {
    const out = new PassThrough();
    out.resume();
    const zip = new ZipWriter(out);
    await zip.addText('a.txt', 'a');
    await zip.finish();
    await expect(zip.addText('b.txt', 'b')).rejects.toThrow(
      'already finished',
    );
  });

  it('refuses to exceed the size a non-ZIP64 archive can address', async () => {
    const out = new PassThrough();
    out.resume();
    const zip = new ZipWriter(out);
    // Lie about the length rather than allocating 2 GB: `add` only reads
    // `.length` when deciding, and the throw happens before any write.
    const huge = { length: 3 * 1024 * 1024 * 1024 } as unknown as Buffer;
    await expect(zip.add('huge.bin', huge)).rejects.toThrow(ZipTooLargeError);
  });

  it('produces an archive the platform unzip agrees with', async () => {
    const { bytes } = await build(async (z) => {
      await z.addText('data.json', JSON.stringify({ ok: true, pad: 'y'.repeat(400) }));
      await z.add('screenshots/other/a.png', Buffer.from([1, 2, 3, 4, 5]));
    });

    const dir = mkdtempSync(join(tmpdir(), 'zipspec-'));
    try {
      const archive = join(dir, 'out.zip');
      writeFileSync(archive, bytes);
      // Python ships on the CI image and on the dev machine; its zipfile is an
      // independent implementation, so a CRC it accepts is a real CRC.
      const script =
        'import sys,zipfile;' +
        'z=zipfile.ZipFile(sys.argv[1]);' +
        'assert z.testzip() is None;' +
        "print(len(z.infolist()), z.read('screenshots/other/a.png').hex())";
      const out = execFileSync('python', [ '-c', script, archive ], {
        encoding: 'utf8',
      });
      expect(out.trim()).toBe('2 0102030405');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
