import { parseSearchQuery } from '../groups/group-fields';
import type { DeletionStatus } from '../groups/group-deletion';

export const DEFAULT_PAGE_SIZE = 25;
export const MAX_PAGE_SIZE = 100;
export const DEFAULT_DAILY_DAYS = 30;
export const MAX_DAILY_DAYS = 365;

export const GROUP_SORTS = ['created_at', 'name', 'views', 'members'] as const;
export type GroupSort = (typeof GROUP_SORTS)[number];

export type SortDir = 'asc' | 'desc';

export type GroupFilter = 'all' | 'public' | 'private' | 'pending_deletion';

const FILTERS: readonly GroupFilter[] = [
  'all',
  'public',
  'private',
  'pending_deletion',
];

export type AdminGroupsQuery = {
  query: string | null;
  page: number;
  pageSize: number;
  sort: GroupSort;
  dir: SortDir;
  filter: GroupFilter;
};

function parsePositiveInt(raw: string | undefined, fallback: number): number {
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 1) return fallback;
  return Math.floor(value);
}

export function parseAdminGroupsQuery(raw: {
  q?: string;
  page?: string;
  page_size?: string;
  sort?: string;
  dir?: string;
  filter?: string;
}): AdminGroupsQuery {
  const sort = GROUP_SORTS.find((candidate) => candidate === raw.sort);
  const filter = FILTERS.find((candidate) => candidate === raw.filter);
  return {
    query: parseSearchQuery(raw.q),
    page: parsePositiveInt(raw.page, 1),
    pageSize: Math.min(
      parsePositiveInt(raw.page_size, DEFAULT_PAGE_SIZE),
      MAX_PAGE_SIZE,
    ),
    sort: sort ?? 'created_at',
    dir: raw.dir === 'asc' ? 'asc' : 'desc',
    filter: filter ?? 'all',
  };
}

export function parseDailyDays(raw?: string): number {
  return Math.min(parsePositiveInt(raw, DEFAULT_DAILY_DAYS), MAX_DAILY_DAYS);
}

export type AdminOverview = {
  groups_total: number;
  groups_public: number;
  groups_private: number;
  members_total: number;
  pending_deletion: number;
  created_today: number;
  created_7d: number;
  created_30d: number;
  daily: Array<{ day: string; groups: number }>;
  at: string;
};

export type AdminGroupRow = {
  id: string;
  name: string;
  mode: string;
  appearance: string;
  visibility: string;
  member_count: number;
  member_slots: number;
  member_names: string[];
  views_total: number;
  created_at: string;
  last_activity: string | null;
  deletion: DeletionStatus;
};

export type AdminGroupsPage = {
  groups: AdminGroupRow[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
  sort: GroupSort;
  dir: SortDir;
  filter: GroupFilter;
  q: string | null;
};
