import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  AdminAuthError,
  cancelAdminGroupDeletion,
  deleteAdminGroup,
  fetchAdminGroups,
  fetchAdminOverview,
  pingAdmin,
  scheduleAdminGroupDeletion,
  type AdminDailyPoint,
  type AdminGroup,
  type AdminGroupFilter,
  type AdminGroupSort,
  type AdminGroupsPage,
  type AdminOverview,
  type AdminSortDir,
} from '../api/adminClient';
import { ThemeToggle } from '../components/ThemeToggle';
import { clearAdminToken, readAdminToken, writeAdminToken } from '../lib/adminSession';
import { DELETION_GRACE_DAYS } from '../lib/constants';
import { errorMessage } from '../lib/errors';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useLatestRequest } from '../hooks/useLatestRequest';
import { useResolvedTheme, useUiPrefs } from '../hooks/useUiPrefs';
import '../styles/admin.css';

const CHART_RANGES = [14, 30, 90] as const;
const PAGE_SIZE = 25;
const SEARCH_DEBOUNCE_MS = 250;

const formatNumber = (value: number) => value.toLocaleString('en-GB');

function formatDate(iso: string | null) {
  if (!iso) return '—';
  const at = new Date(iso);
  return Number.isNaN(at.getTime())
    ? '—'
    : at.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatDateTime(iso: string | null) {
  if (!iso) return '—';
  const at = new Date(iso);
  return Number.isNaN(at.getTime()) ? '—' : at.toLocaleString('en-GB');
}

function shortDay(day: string) {
  const at = new Date(`${day}T00:00:00Z`);
  return Number.isNaN(at.getTime())
    ? day
    : at.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', timeZone: 'UTC' });
}

export function AdminPage() {
  useDocumentTitle('Admin', { noindex: true });
  const { prefs } = useUiPrefs();
  const theme = useResolvedTheme(prefs.themePref) === 'light' ? 'theme-light' : 'theme-dark';
  const [token, setToken] = useState(readAdminToken);

  function signOut() {
    clearAdminToken();
    setToken('');
  }

  return (
    <div className={`adm ${theme}`}>
      {token ? (
        <Dashboard token={token} onSignOut={signOut} />
      ) : (
        <TokenGate
          onToken={(value) => {
            writeAdminToken(value);
            setToken(value);
          }}
        />
      )}
    </div>
  );
}

function TokenGate({ onToken }: { onToken: (token: string) => void }) {
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const candidate = value.trim();
    if (!candidate) return;
    setBusy(true);
    setError(null);
    try {
      await pingAdmin(candidate);
      onToken(candidate);
    } catch (err) {
      setError(errorMessage(err, 'Could not reach the admin API'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="adm-gate">
      <form className="adm-gate-card" onSubmit={(e) => void onSubmit(e)}>
        <span className="adm-eyebrow">RESTRICTED</span>
        <h1>Admin</h1>
        <p className="adm-note">This area is for the site operator. It needs the admin token.</p>

        <label className="adm-field">
          ADMIN TOKEN
          <input
            type="password"
            value={value}
            autoFocus
            autoComplete="off"
            spellCheck={false}
            placeholder="Paste the admin token"
            disabled={busy}
            onChange={(e) => setValue(e.target.value)}
          />
        </label>

        {error && <p className="adm-error">{error}</p>}

        <button
          type="submit"
          className="adm-btn adm-btn--primary"
          disabled={busy || !value.trim()}
        >
          {busy ? 'Checking…' : 'Unlock'}
        </button>

        <Link className="adm-note" to="/">
          ← Back to the site
        </Link>
      </form>
    </div>
  );
}

type DashboardProps = {
  token: string;
  onSignOut: () => void;
};

function Dashboard({ token, onSignOut }: DashboardProps) {
  const [days, setDays] = useState<number>(30);
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [overviewError, setOverviewError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<AdminGroupFilter>('all');
  const [sort, setSort] = useState<AdminGroupSort>('created_at');
  const [dir, setDir] = useState<AdminSortDir>('desc');
  const [page, setPage] = useState(1);
  const [table, setTable] = useState<AdminGroupsPage | null>(null);
  const [tableError, setTableError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<AdminGroup | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const tableRequest = useLatestRequest();
  const reload = useCallback(() => setReloadKey((key) => key + 1), []);

  const onFailure = useCallback(
    (err: unknown, fallback: string, setter: (message: string) => void) => {
      if (err instanceof AdminAuthError) {
        clearAdminToken();
        onSignOut();
        return;
      }
      setter(errorMessage(err, fallback));
    },
    [onSignOut],
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(search.trim());
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const controller = new AbortController();
    void (async () => {
      try {
        setOverview(await fetchAdminOverview(token, days, controller.signal));
        setOverviewError(null);
      } catch (err) {
        if (controller.signal.aborted) return;
        onFailure(err, 'Could not load the overview', setOverviewError);
      }
    })();
    return () => controller.abort();
  }, [token, days, reloadKey, onFailure]);

  useEffect(() => {
    let live = true;
    setLoading(true);
    void (async () => {
      const settled = await tableRequest((signal) =>
        fetchAdminGroups(token, {
          q: query,
          page,
          pageSize: PAGE_SIZE,
          sort,
          dir,
          filter,
          signal,
        }),
      );
      if (!settled || !live) return;
      setLoading(false);
      if (settled.ok) {
        setTable(settled.value);
        setTableError(null);
      } else {
        onFailure(settled.error, 'Could not load groups', setTableError);
      }
    })();
    return () => {
      live = false;
    };
  }, [token, query, page, sort, dir, filter, reloadKey, tableRequest, onFailure]);

  async function runAction(group: AdminGroup, action: () => Promise<unknown>, done: string) {
    setPendingId(group.id);
    setActionError(null);
    setNotice(null);
    try {
      await action();
      setNotice(done);
      reload();
    } catch (err) {
      onFailure(err, 'That action failed', setActionError);
    } finally {
      setPendingId(null);
    }
  }

  function onSort(next: AdminGroupSort) {
    if (next === sort) {
      setDir((current) => (current === 'desc' ? 'asc' : 'desc'));
    } else {
      setSort(next);
      setDir(next === 'name' ? 'asc' : 'desc');
    }
    setPage(1);
  }

  const total = table?.total ?? 0;
  const pages = table?.pages ?? 1;

  return (
    <div className="adm-shell">
      <header className="adm-head">
        <div className="adm-head-text">
          <span className="adm-eyebrow">RS3 GROUP IRONMAN</span>
          <h1 className="adm-h1">Admin</h1>
        </div>
        <div className="adm-head-actions">
          <span className="adm-stamp">Updated {formatDateTime(overview?.at ?? null)}</span>
          <ThemeToggle />
          <button type="button" className="adm-btn" onClick={reload}>
            Refresh
          </button>
          <button type="button" className="adm-btn" onClick={onSignOut}>
            Lock
          </button>
        </div>
      </header>

      {overviewError && <p className="adm-error">{overviewError}</p>}

      <section className="adm-tiles">
        <Tile label="Total groups" value={overview?.groups_total} />
        <Tile label="Created today" value={overview?.created_today} sub="UTC day" />
        <Tile label="Last 7 days" value={overview?.created_7d} />
        <Tile label="Last 30 days" value={overview?.created_30d} />
        <Tile
          label="Public groups"
          value={overview?.groups_public}
          sub={overview ? `${formatNumber(overview.groups_private)} private` : undefined}
        />
        <Tile label="Members" value={overview?.members_total} />
        <Tile
          label="Pending deletion"
          value={overview?.pending_deletion}
          sub={`${DELETION_GRACE_DAYS}-day grace`}
        />
      </section>

      <section className="adm-panel">
        <div className="adm-panel-head">
          <h2>Groups created per day</h2>
          <div className="adm-segs" role="group" aria-label="Chart range">
            {CHART_RANGES.map((range) => (
              <button
                key={range}
                type="button"
                className="adm-seg"
                aria-pressed={days === range}
                onClick={() => setDays(range)}
              >
                {range}d
              </button>
            ))}
          </div>
        </div>
        <DailyChart daily={overview?.daily ?? []} />
      </section>

      <section className="adm-panel">
        <div className="adm-panel-head">
          <h2>Groups</h2>
          <span className="adm-stamp">{formatNumber(total)} matching</span>
        </div>

        <div className="adm-controls">
          <div className="adm-search">
            <input
              type="search"
              value={search}
              placeholder="Search by group name"
              aria-label="Search by group name"
              autoComplete="off"
              spellCheck={false}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="adm-segs" role="group" aria-label="Filter groups">
            <FilterButton current={filter} value="all" label="All" onPick={setFilter} onPage={setPage} />
            <FilterButton
              current={filter}
              value="public"
              label="Public"
              onPick={setFilter}
              onPage={setPage}
            />
            <FilterButton
              current={filter}
              value="private"
              label="Private"
              onPick={setFilter}
              onPage={setPage}
            />
            <FilterButton
              current={filter}
              value="pending_deletion"
              label="Pending deletion"
              onPick={setFilter}
              onPage={setPage}
            />
          </div>
        </div>

        {actionError && <p className="adm-error">{actionError}</p>}
        {notice && <p className="adm-ok">{notice}</p>}
        {tableError && <p className="adm-error">{tableError}</p>}

        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <SortHeader label="Group" value="name" sort={sort} dir={dir} onSort={onSort} />
                <th>Visibility</th>
                <th>Mode</th>
                <SortHeader
                  label="Members"
                  value="members"
                  sort={sort}
                  dir={dir}
                  onSort={onSort}
                  numeric
                />
                <SortHeader
                  label="Views"
                  value="views"
                  sort={sort}
                  dir={dir}
                  onSort={onSort}
                  numeric
                />
                <SortHeader label="Created" value="created_at" sort={sort} dir={dir} onSort={onSort} />
                <th>Last activity</th>
                <th>Deletion</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {table?.groups.map((group) => (
                <GroupRow
                  key={group.id}
                  group={group}
                  busy={pendingId === group.id}
                  onSchedule={() =>
                    void runAction(
                      group,
                      () => scheduleAdminGroupDeletion(token, group.id),
                      `“${group.name}” is scheduled for erasure in ${DELETION_GRACE_DAYS} days.`,
                    )
                  }
                  onCancel={() =>
                    void runAction(
                      group,
                      () => cancelAdminGroupDeletion(token, group.id),
                      `Erasure of “${group.name}” called off.`,
                    )
                  }
                  onDelete={() => setConfirming(group)}
                />
              ))}
            </tbody>
          </table>
        </div>

        {!loading && table?.groups.length === 0 && (
          <p className="adm-empty">
            {query ? `No group matches “${query}”.` : 'No groups match this filter.'}
          </p>
        )}
        {loading && !table && <p className="adm-empty">Loading groups…</p>}

        <div className="adm-foot">
          <span className="adm-stamp">
            {total > 0
              ? `Showing ${formatNumber((page - 1) * PAGE_SIZE + 1)}–${formatNumber(
                  Math.min(page * PAGE_SIZE, total),
                )} of ${formatNumber(total)}`
              : 'Nothing to show'}
          </span>
          <div className="adm-pager">
            <button
              type="button"
              className="adm-btn adm-btn--sm"
              disabled={page <= 1}
              onClick={() => setPage(1)}
            >
              First
            </button>
            <button
              type="button"
              className="adm-btn adm-btn--sm"
              disabled={page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              Prev
            </button>
            <span>
              Page {formatNumber(page)} of {formatNumber(pages)}
            </span>
            <button
              type="button"
              className="adm-btn adm-btn--sm"
              disabled={page >= pages}
              onClick={() => setPage((current) => Math.min(pages, current + 1))}
            >
              Next
            </button>
            <button
              type="button"
              className="adm-btn adm-btn--sm"
              disabled={page >= pages}
              onClick={() => setPage(pages)}
            >
              Last
            </button>
          </div>
        </div>
      </section>

      {confirming && (
        <DeleteDialog
          group={confirming}
          busy={pendingId === confirming.id}
          onClose={() => setConfirming(null)}
          onConfirm={async () => {
            const group = confirming;
            setConfirming(null);
            await runAction(
              group,
              () => deleteAdminGroup(token, group.id),
              `“${group.name}” and everything it held have been erased.`,
            );
          }}
          onSchedule={async () => {
            const group = confirming;
            setConfirming(null);
            await runAction(
              group,
              () => scheduleAdminGroupDeletion(token, group.id),
              `“${group.name}” is scheduled for erasure in ${DELETION_GRACE_DAYS} days.`,
            );
          }}
        />
      )}
    </div>
  );
}

function FilterButton({
  current,
  value,
  label,
  onPick,
  onPage,
}: {
  current: AdminGroupFilter;
  value: AdminGroupFilter;
  label: string;
  onPick: (value: AdminGroupFilter) => void;
  onPage: (page: number) => void;
}) {
  return (
    <button
      type="button"
      className="adm-seg"
      aria-pressed={current === value}
      onClick={() => {
        onPick(value);
        onPage(1);
      }}
    >
      {label}
    </button>
  );
}

function Tile({ label, value, sub }: { label: string; value?: number; sub?: string }) {
  return (
    <div className="adm-tile">
      <span className="adm-tile-label">{label}</span>
      <span className="adm-tile-value">{value == null ? '—' : formatNumber(value)}</span>
      {sub && <span className="adm-tile-sub">{sub}</span>}
    </div>
  );
}

function DailyChart({ daily }: { daily: AdminDailyPoint[] }) {
  const peak = useMemo(() => Math.max(1, ...daily.map((point) => point.groups)), [daily]);
  const made = useMemo(() => daily.reduce((sum, point) => sum + point.groups, 0), [daily]);

  if (daily.length === 0) {
    return <p className="adm-empty">No data yet.</p>;
  }

  const first = daily[0]!;
  const last = daily[daily.length - 1]!;

  return (
    <>
      <div
        className="adm-chart"
        role="img"
        aria-label={`${formatNumber(made)} groups created between ${first.day} and ${last.day}, peaking at ${formatNumber(peak)} in a day`}
      >
        {daily.map((point) => (
          <div
            key={point.day}
            className="adm-chart-col"
            title={`${shortDay(point.day)} · ${formatNumber(point.groups)} ${
              point.groups === 1 ? 'group' : 'groups'
            }`}
          >
            <div
              className={point.groups === 0 ? 'adm-chart-bar adm-chart-bar--zero' : 'adm-chart-bar'}
              style={{ height: `${Math.max(2, (point.groups / peak) * 100)}%` }}
            />
          </div>
        ))}
      </div>
      <div className="adm-chart-axis">
        <span>{shortDay(first.day)}</span>
        <span>
          {formatNumber(made)} total · peak {formatNumber(peak)}/day
        </span>
        <span>{shortDay(last.day)}</span>
      </div>
    </>
  );
}

function SortHeader({
  label,
  value,
  sort,
  dir,
  onSort,
  numeric,
}: {
  label: string;
  value: AdminGroupSort;
  sort: AdminGroupSort;
  dir: AdminSortDir;
  onSort: (value: AdminGroupSort) => void;
  numeric?: boolean;
}) {
  const active = sort === value;
  return (
    <th
      className={numeric ? 'adm-num' : undefined}
      aria-sort={active ? (dir === 'asc' ? 'ascending' : 'descending') : undefined}
    >
      <button type="button" className="adm-sort" onClick={() => onSort(value)}>
        {label}
        <span aria-hidden>{active ? (dir === 'asc' ? '▲' : '▼') : '·'}</span>
      </button>
    </th>
  );
}

type GroupRowProps = {
  group: AdminGroup;
  busy: boolean;
  onSchedule: () => void;
  onCancel: () => void;
  onDelete: () => void;
};

function GroupRow({ group, busy, onSchedule, onCancel, onDelete }: GroupRowProps) {
  const isPublic = group.visibility === 'public';
  return (
    <tr>
      <td>
        <span className="adm-name">
          <Link to={`/g/${encodeURIComponent(group.name)}`} target="_blank" rel="noreferrer">
            {group.name}
          </Link>
          <span className="adm-name-sub">
            {group.member_names.join(', ') || 'no members yet'}
          </span>
        </span>
      </td>
      <td>
        <span className={isPublic ? 'adm-pill adm-pill--public' : 'adm-pill'}>
          {isPublic ? 'Public' : 'Private'}
        </span>
      </td>
      <td>{group.mode === 'competitive' ? 'Competitive' : 'Normal'}</td>
      <td className="adm-num">
        {group.member_count}/{group.member_slots}
      </td>
      <td className="adm-num">{formatNumber(group.views_total)}</td>
      <td>{formatDate(group.created_at)}</td>
      <td>{formatDate(group.last_activity)}</td>
      <td>
        {group.deletion.pending ? (
          <span className="adm-pill adm-pill--pending" title={formatDateTime(group.deletion.delete_after)}>
            {formatDate(group.deletion.delete_after)}
          </span>
        ) : (
          '—'
        )}
      </td>
      <td>
        <span className="adm-row-actions">
          {group.deletion.pending ? (
            <button type="button" className="adm-btn adm-btn--sm" disabled={busy} onClick={onCancel}>
              Keep
            </button>
          ) : (
            <button
              type="button"
              className="adm-btn adm-btn--sm"
              disabled={busy}
              onClick={onSchedule}
              title={`Erase in ${DELETION_GRACE_DAYS} days, cancellable`}
            >
              Schedule
            </button>
          )}
          <button
            type="button"
            className="adm-btn adm-btn--sm adm-btn--danger"
            disabled={busy}
            onClick={onDelete}
            title="Erases everything immediately — no grace period, no undo"
          >
            Delete
          </button>
        </span>
      </td>
    </tr>
  );
}

type DeleteDialogProps = {
  group: AdminGroup;
  busy: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onSchedule: () => void;
};

function DeleteDialog({ group, busy, onClose, onConfirm, onSchedule }: DeleteDialogProps) {
  const [typed, setTyped] = useState('');
  const ready = typed.trim().toLowerCase() === group.name.toLowerCase();

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !busy) onClose();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose, busy]);

  return (
    <div
      className="adm-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onClose();
      }}
    >
      <div
        className="adm-dialog adm-dialog--danger"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="adm-delete-title"
        aria-describedby="adm-delete-warning"
      >
        <h2 id="adm-delete-title">
          <span className="adm-warn-glyph" aria-hidden>
            !
          </span>
          Delete “{group.name}” for good?
        </h2>

        <div className="adm-warn" id="adm-delete-warning">
          <strong>This happens immediately and cannot be undone.</strong>
          <span>There is no grace period and no recycle bin. It erases:</span>
          <ul>
            <li>
              the group and all {group.member_count} member
              {group.member_count === 1 ? '' : 's'}
              {group.member_names.length > 0 ? ` (${group.member_names.join(', ')})` : ''}
            </li>
            <li>every inventory, bank and shared-bank ledger entry</li>
            <li>the full XP history behind the graphs</li>
            <li>the achievement feed, quest progress and kill counts</li>
            <li>any uploaded screenshots, deleted from storage too</li>
          </ul>
          <span>
            Their group token stops working the moment you confirm. Nightly backups are the only
            remaining copy, and they age out within 30 days.
          </span>
        </div>

        {group.deletion.pending ? (
          <p>
            This group is already scheduled for{' '}
            <strong>{formatDate(group.deletion.delete_after)}</strong>. Deleting now skips the rest
            of that notice period.
          </p>
        ) : (
          <p>
            Prefer the reversible option? <strong>Schedule instead</strong> — the group keeps working
            for {DELETION_GRACE_DAYS} days, the members can see the date, and either of you can call
            it off.
          </p>
        )}

        <label className="adm-field">
          TYPE “{group.name}” TO CONFIRM
          <input
            value={typed}
            autoFocus
            autoComplete="off"
            spellCheck={false}
            placeholder={group.name}
            disabled={busy}
            onChange={(e) => setTyped(e.target.value)}
          />
        </label>

        <div className="adm-dialog-actions">
          <button type="button" className="adm-btn" disabled={busy} onClick={onClose}>
            Cancel
          </button>
          {!group.deletion.pending && (
            <button type="button" className="adm-btn" disabled={busy} onClick={onSchedule}>
              Schedule instead
            </button>
          )}
          <button
            type="button"
            className="adm-btn adm-btn--danger adm-btn--solid"
            disabled={busy || !ready}
            onClick={onConfirm}
          >
            {busy ? 'Deleting…' : 'Delete permanently'}
          </button>
        </div>
      </div>
    </div>
  );
}
