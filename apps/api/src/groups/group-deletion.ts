import { timingSafeEqual } from 'node:crypto';
import { groupNameKey } from './group-access.service';

export const DELETION_GRACE_DAYS = 5;

const DAY_MS = 24 * 60 * 60 * 1000;

export type DeletionColumns = {
  deletionRequestedAt: Date | null;
  deleteAfter: Date | null;
};

export type DeletionStatus = {
  pending: boolean;
  requested_at: string | null;
  delete_after: string | null;
  grace_days: number;
};

export function deletionDueAt(from: Date): Date {
  return new Date(from.getTime() + DELETION_GRACE_DAYS * DAY_MS);
}

export function deletionStatus(group: DeletionColumns): DeletionStatus {
  return {
    pending: group.deleteAfter != null,
    requested_at: group.deletionRequestedAt?.toISOString() ?? null,
    delete_after: group.deleteAfter?.toISOString() ?? null,
    grace_days: DELETION_GRACE_DAYS,
  };
}

function constantTimeEqual(expected: string, provided: string): boolean {
  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(provided, 'utf8');
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function confirmationMatches(
  group: { name: string; token: string },
  confirm: { confirm_name?: string; confirm_token?: string },
): boolean {
  const name = confirm.confirm_name?.trim() ?? '';
  const token = confirm.confirm_token?.trim() ?? '';
  if (!name || !token) return false;
  if (groupNameKey(name) !== groupNameKey(group.name)) return false;
  return constantTimeEqual(group.token, token);
}
