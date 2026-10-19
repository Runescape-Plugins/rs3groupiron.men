import {
  confirmationMatches,
  deletionDueAt,
  deletionStatus,
  DELETION_GRACE_DAYS,
} from './group-deletion';

const GROUP = { name: 'Iron Crew', token: 'tok-123' };

describe('deletionDueAt', () => {
  it('lands the grace period after the request', () => {
    const from = new Date('2026-10-19T12:00:00.000Z');
    expect(deletionDueAt(from).toISOString()).toBe('2026-10-24T12:00:00.000Z');
    expect(DELETION_GRACE_DAYS).toBe(5);
  });
});

describe('deletionStatus', () => {
  it('reports nothing pending when the columns are clear', () => {
    expect(
      deletionStatus({ deletionRequestedAt: null, deleteAfter: null }),
    ).toEqual({
      pending: false,
      requested_at: null,
      delete_after: null,
      grace_days: DELETION_GRACE_DAYS,
    });
  });

  it('reports the dates as ISO instants when one is scheduled', () => {
    const requested = new Date('2026-10-19T12:00:00.000Z');
    expect(
      deletionStatus({
        deletionRequestedAt: requested,
        deleteAfter: deletionDueAt(requested),
      }),
    ).toEqual({
      pending: true,
      requested_at: '2026-10-19T12:00:00.000Z',
      delete_after: '2026-10-24T12:00:00.000Z',
      grace_days: DELETION_GRACE_DAYS,
    });
  });
});

describe('confirmationMatches', () => {
  it('accepts the exact name and token', () => {
    expect(
      confirmationMatches(GROUP, {
        confirm_name: 'Iron Crew',
        confirm_token: 'tok-123',
      }),
    ).toBe(true);
  });

  it('accepts a differently cased name, and surrounding whitespace', () => {
    expect(
      confirmationMatches(GROUP, {
        confirm_name: '  iron crew ',
        confirm_token: ' tok-123 ',
      }),
    ).toBe(true);
  });

  it('rejects a wrong name', () => {
    expect(
      confirmationMatches(GROUP, {
        confirm_name: 'Iron Crew 2',
        confirm_token: 'tok-123',
      }),
    ).toBe(false);
  });

  it('rejects a wrong token, including one that is merely a prefix', () => {
    expect(
      confirmationMatches(GROUP, {
        confirm_name: 'Iron Crew',
        confirm_token: 'tok-124',
      }),
    ).toBe(false);
    expect(
      confirmationMatches(GROUP, {
        confirm_name: 'Iron Crew',
        confirm_token: 'tok-12',
      }),
    ).toBe(false);
  });

  it('rejects missing fields rather than treating them as a match', () => {
    expect(confirmationMatches(GROUP, {})).toBe(false);
    expect(
      confirmationMatches(GROUP, { confirm_name: 'Iron Crew' }),
    ).toBe(false);
    expect(
      confirmationMatches(GROUP, { confirm_token: 'tok-123' }),
    ).toBe(false);
    expect(
      confirmationMatches({ name: '', token: '' }, {
        confirm_name: '',
        confirm_token: '',
      }),
    ).toBe(false);
  });
});
