# @rs3/api

NestJS + Prisma API behind [rs3groupiron.men](https://rs3groupiron.men). Serves
the React site and receives pushes from the in-game RS3 plugin.

## Running it

```bash
pnpm dev:db        # Postgres on 127.0.0.1:5432
pnpm db:migrate
pnpm dev:api       # :3000
```

Copy `.env.example` to `.env` first. Every key is documented there.

```bash
pnpm --filter @rs3/api test
pnpm --filter @rs3/api lint
```

## Shape

| Path | What |
|---|---|
| `src/groups/` | groups, members, inventories, skills, quests, achievements |
| `src/groups/group-events.service.ts` | SSE fan-out to connected browsers |
| `src/gamevals/` | RS3 cache dumps (item/quest/var names) |
| `src/uploads/` | presigned R2 URLs for achievement screenshots |
| `prisma/` | schema and migrations |

## Auth

A group's token is its only credential. It is created with the group and never
rotates, and travels verbatim in the `Authorization` header.

| Routes | Demo group | Public group | Any other group |
|---|---|---|---|
| `am-i-logged-in`, `get-group-data`, `xp-history` | no token needed | no token needed, filtered | token required |
| everything else | rejected | token required | token required |

Plugin pushes (`update-group-member`, `player-moved`, `set-member-online`,
`update-member-quests`) carry the character's display name and only update
names already on the roster; anything else is a 404. The token is shared by the
whole group, so this is what stops a member logged into another account from
adding it. Members are added through `add-group-member`.

`update-group-member` accepts full inventory snapshots (`inventory`,
`equipment`, `bank`, `shared_bank`, `inventories`) and, for everything except
the positional backpack, `inventory_changes`: per-item `[itemId, newTotal, ...]`
deltas the plugin sends while a bank is open. A snapshot and deltas for the
same inventory in one request resolve to the snapshot. The response lists the
fields it `applied` and whether the heavy data actually changed.

`update-member-achievements` stores completed RS3 achievements and diaries by
gameval, and `GET achievement-progress` reads them back. A member's first sync
establishes a baseline without posting to the feed; later completions are
posted. Achievements that mirror a quest (`quest_*`) are stored but kept out of
the feed, since the quest sync already posts those.

`update-member-quests` skips quests the server's gameval dump does not know
and reports them as `skipped`, so a quest newer than the dump never blocks the
rest of the sync.

A member is reported `online` only while the plugin has been heard from in
the last 12 minutes (it heartbeats every 5 while idle), so a crashed client
does not stay online forever.

The seeded demo group is public sample data and read-only.

## Visibility

A group is `private` by default: an unknown name and a wrong token give the
same 401, so the endpoints cannot be used to find out whether a group exists.

A group that sets `visibility: public` is readable with no token at all and is
listed by `GET /public-groups?q=<name>`, which only ever sees public rows. What
a tokenless viewer gets is decided by five flags — `map`, `skills`, `items`,
`quests`, `achievements` — set through `create-group` or `update-group-settings`
as `shares`. All default on except `map`: every other flag covers a record of
what a member has done, while the map is where they are standing right now, so
that one is opted into. Writes always need the token.

Every read carries the caller's `scope`, so the two things stay separate:
`GET am-i-logged-in` reports `shares` (what the group publishes) alongside
`visible` (what this request may read — everything, for the token holder).
Withheld member fields come back empty rather than absent, because a delta
client reads an absent field as unchanged; an endpoint whose entire payload is
withheld answers 403.

## Reading group data

`GET /group/:name/get-group-data` returns every member in full.

With `?from_time=<ISO>` it returns a delta: unchanged members collapse to
`{ name }`. Adding `&split=1` also collapses members whose position or vitals
changed but whose inventories and skills did not, marking them `partial: true`
for the client to merge. That is what stops a single step re-sending a 4000-item
bank.

`GET /group/:name/events` is the same data over SSE — a snapshot on connect,
then `split`-style deltas pushed as the group changes. The website uses it; the
plugin does not need to.

## Export

`GET /group/:name/export` returns the group's current state as one JSON
document — settings, members, skills, inventories, bank contents, quest and
achievement progress, kill counts, drop rules, view days.

`GET /group/:name/export.zip` adds the three append-only series as NDJSON
(`bank-ledger`, `achievement-feed`, `xp-samples`), with a `README.txt`
explaining the layout. Any achievement screenshots are added under
`screenshots/<kind>/` — nothing uploads one today, so in practice that folder
and its section of the README are absent.

Both need the token and are throttled — 6/min and 5/5min — which is the only
place the authed controller opts into the throttler.

Neither export contains the group token.

The archive is streamed by `common/zip.ts`, a dependency-free ZIP writer:
entries go out as they are added and only the central directory is retained, so
a group with hundreds of screenshots never has to be buffered. It emits no
ZIP64, so it refuses past 2 GB. The series are read in pages of 5000 by id
cursor; screenshots are pulled from R2 one at a time and stored uncompressed,
PNG being compressed already.

## Erasure

`POST /group/:name/request-deletion` schedules the group and everything
cascading from it for deletion. It takes the group name and token *again* in the
body — `confirm_name` and `confirm_token` — on top of the `Authorization`
header, so a saved browser session cannot start it on its own. Re-requesting
never pushes the date back.

```
POST /api/group/<name>/request-deletion
  Authorization: <group token>
  { "confirm_name": "<name>", "confirm_token": "<group token>" }
->
  { "ok": true, "pending": true, "requested_at": "...",
    "delete_after": "...", "grace_days": 5 }
```

`POST /group/:name/cancel-deletion` clears it, and needs only the token: it is
the safe direction. `am-i-logged-in` carries the same block as `deletion` for
token-holding callers, so a client learns the date without a second request.

`GroupPurgeService` sweeps hourly and once on boot, deleting the group's R2
objects and then the row. `GROUP_PURGE_DISABLED=1` turns it off and
`GROUP_PURGE_SWEEP_MS` changes the interval; it never runs under
`NODE_ENV=test`. The demo group is rejected like any other write.

Retention, the published policies and the Jagex submission checklist are in
[`docs/data-protection.md`](../../docs/data-protection.md).

## Deploying

See [`deploy/README.md`](../../deploy/README.md).
