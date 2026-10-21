import {
  DEFAULT_DAILY_DAYS,
  DEFAULT_PAGE_SIZE,
  MAX_DAILY_DAYS,
  MAX_PAGE_SIZE,
  parseAdminGroupsQuery,
  parseDailyDays,
} from './admin.types';

describe('parseAdminGroupsQuery', () => {
  it('falls back to newest-first page one', () => {
    expect(parseAdminGroupsQuery({})).toEqual({
      query: null,
      page: 1,
      pageSize: DEFAULT_PAGE_SIZE,
      sort: 'created_at',
      dir: 'desc',
      filter: 'all',
    });
  });

  it('lower-cases the search so it matches the stored name key', () => {
    expect(parseAdminGroupsQuery({ q: '  Iron Crew ' }).query).toBe(
      'iron crew',
    );
  });

  it('caps the page size and ignores junk paging', () => {
    expect(parseAdminGroupsQuery({ page_size: '5000' }).pageSize).toBe(
      MAX_PAGE_SIZE,
    );
    expect(parseAdminGroupsQuery({ page: '0' }).page).toBe(1);
    expect(parseAdminGroupsQuery({ page: '-3' }).page).toBe(1);
    expect(parseAdminGroupsQuery({ page: 'drop tables' }).page).toBe(1);
  });

  it('only accepts known sorts, directions and filters', () => {
    expect(parseAdminGroupsQuery({ sort: 'name', dir: 'asc' })).toMatchObject({
      sort: 'name',
      dir: 'asc',
    });
    expect(
      parseAdminGroupsQuery({ sort: 'token', dir: 'sideways' }),
    ).toMatchObject({ sort: 'created_at', dir: 'desc' });
    expect(parseAdminGroupsQuery({ filter: 'pending_deletion' }).filter).toBe(
      'pending_deletion',
    );
    expect(parseAdminGroupsQuery({ filter: 'everything' }).filter).toBe('all');
  });
});

describe('parseDailyDays', () => {
  it('defaults to a month and clamps to a year', () => {
    expect(parseDailyDays()).toBe(DEFAULT_DAILY_DAYS);
    expect(parseDailyDays('0')).toBe(DEFAULT_DAILY_DAYS);
    expect(parseDailyDays('nope')).toBe(DEFAULT_DAILY_DAYS);
    expect(parseDailyDays('14')).toBe(14);
    expect(parseDailyDays('100000')).toBe(MAX_DAILY_DAYS);
  });
});
