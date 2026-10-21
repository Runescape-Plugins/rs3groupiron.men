import { dayLabel, fillDays, startOfUtcDay } from './admin-days';

describe('startOfUtcDay', () => {
  it('drops the time of day in UTC, whatever the host timezone', () => {
    expect(
      startOfUtcDay(new Date('2026-10-21T23:45:12.500Z')).toISOString(),
    ).toBe('2026-10-21T00:00:00.000Z');
    expect(
      startOfUtcDay(new Date('2026-10-21T00:00:00.000Z')).toISOString(),
    ).toBe('2026-10-21T00:00:00.000Z');
  });
});

describe('dayLabel', () => {
  it('matches the YYYY-MM-DD the SQL side produces', () => {
    expect(dayLabel(new Date('2026-01-05T00:00:00.000Z'))).toBe('2026-01-05');
  });
});

describe('fillDays', () => {
  it('returns one entry per day with zeroes for the quiet ones', () => {
    const since = new Date('2026-10-19T00:00:00.000Z');
    const counts = new Map([
      ['2026-10-19', 3],
      ['2026-10-21', 1],
    ]);

    expect(fillDays(since, 4, counts)).toEqual([
      { day: '2026-10-19', groups: 3 },
      { day: '2026-10-20', groups: 0 },
      { day: '2026-10-21', groups: 1 },
      { day: '2026-10-22', groups: 0 },
    ]);
  });

  it('spans a month boundary without a gap', () => {
    const series = fillDays(
      new Date('2026-10-30T00:00:00.000Z'),
      3,
      new Map([['2026-11-01', 2]]),
    );

    expect(series.map((point) => point.day)).toEqual([
      '2026-10-30',
      '2026-10-31',
      '2026-11-01',
    ]);
    expect(series[2]).toEqual({ day: '2026-11-01', groups: 2 });
  });
});
