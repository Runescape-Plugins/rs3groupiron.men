export type AdminGroupSort = 'created_at' | 'name' | 'views' | 'members';
export type AdminSortDir = 'asc' | 'desc';
export type AdminGroupFilter = 'all' | 'public' | 'private' | 'pending_deletion';

export type AdminDeletion = {
  pending: boolean;
  requested_at: string | null;
  delete_after: string | null;
  grace_days: number;
};

export type AdminDailyPoint = {
  day: string;
  groups: number;
};

export type AdminOverview = {
  groups_total: number;
  groups_public: number;
  groups_private: number;
  members_total: number;
  pending_deletion: number;
  created_today: number;
  created_7d: number;
  created_30d: number;
  daily: AdminDailyPoint[];
  at: string;
};

export type AdminGroup = {
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
  deletion: AdminDeletion;
};

export type AdminGroupsPage = {
  groups: AdminGroup[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
  sort: AdminGroupSort;
  dir: AdminSortDir;
  filter: AdminGroupFilter;
  q: string | null;
};

export type AdminGroupsRequest = {
  q?: string;
  page?: number;
  pageSize?: number;
  sort?: AdminGroupSort;
  dir?: AdminSortDir;
  filter?: AdminGroupFilter;
  signal?: AbortSignal;
};

/** A token the server rejected, or an admin surface that is switched off. */
export class AdminAuthError extends Error {
  readonly disabled: boolean;

  constructor(message: string, disabled: boolean) {
    super(message);
    this.name = 'AdminAuthError';
    this.disabled = disabled;
  }
}

async function errorMessageFor(res: Response) {
  try {
    const body = (await res.json()) as { message?: string | string[] };
    if (typeof body.message === 'string') return body.message;
    if (Array.isArray(body.message)) return body.message.join(', ');
  } catch {
    /* ignore non-JSON bodies */
  }
  return `Request failed (${res.status})`;
}

type AdminInit = Omit<RequestInit, 'headers'> & { token: string };

async function adminApi<T>(path: string, { token, ...init }: AdminInit): Promise<T> {
  const res = await fetch(`/api/admin${path}`, {
    ...init,
    headers: {
      'X-Admin-Token': token,
      'Content-Type': 'application/json',
    },
  });

  if (res.status === 404 && !path.startsWith('/groups/')) {
    throw new AdminAuthError('Admin access is not enabled on this server', true);
  }
  if (res.status === 401 || res.status === 403) {
    throw new AdminAuthError('That admin token was rejected', false);
  }
  if (!res.ok) throw new Error(await errorMessageFor(res));
  return (await res.json()) as T;
}

export async function pingAdmin(token: string, signal?: AbortSignal) {
  return adminApi<{ ok: boolean }>('/ping', { token, signal });
}

export async function fetchAdminOverview(
  token: string,
  days: number,
  signal?: AbortSignal,
): Promise<AdminOverview> {
  const params = new URLSearchParams({ days: String(days) });
  return adminApi(`/overview?${params}`, { token, signal });
}

export async function fetchAdminGroups(
  token: string,
  request: AdminGroupsRequest = {},
): Promise<AdminGroupsPage> {
  const { q, page, pageSize, sort, dir, filter, signal } = request;
  const params = new URLSearchParams();
  if (q?.trim()) params.set('q', q.trim());
  if (page) params.set('page', String(page));
  if (pageSize) params.set('page_size', String(pageSize));
  if (sort) params.set('sort', sort);
  if (dir) params.set('dir', dir);
  if (filter && filter !== 'all') params.set('filter', filter);
  const query = params.toString();
  return adminApi(`/groups${query ? `?${query}` : ''}`, { token, signal });
}

export async function deleteAdminGroup(token: string, id: string) {
  return adminApi<{ ok: boolean; id: string; name: string }>(
    `/groups/${encodeURIComponent(id)}`,
    { token, method: 'DELETE' },
  );
}

export async function scheduleAdminGroupDeletion(token: string, id: string) {
  return adminApi<{ ok: boolean; id: string } & AdminDeletion>(
    `/groups/${encodeURIComponent(id)}/schedule-deletion`,
    { token, method: 'POST' },
  );
}

export async function cancelAdminGroupDeletion(token: string, id: string) {
  return adminApi<{ ok: boolean; id: string } & AdminDeletion>(
    `/groups/${encodeURIComponent(id)}/cancel-deletion`,
    { token, method: 'POST' },
  );
}
