import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchGroupInfo, isAccessDenied, recordGroupView } from '../api/groupClient';
import { GroupLocked } from '../components/GroupLocked';
import { GroupMapShell } from '../components/GroupMapShell';
import { PageLoading } from '../components/PageLoading';
import { errorMessage } from '../lib/errors';

const counted = new Set<string>();

type Access =
  | { state: 'checking' }
  | { state: 'open' }
  | { state: 'denied' }
  | { state: 'failed'; message: string };

export function PublicGroupPage() {
  const { groupName = '' } = useParams();
  const [access, setAccess] = useState<Access>({ state: 'checking' });
  const [attempt, setAttempt] = useState(0);

  const retry = useCallback(() => {
    setAccess({ state: 'checking' });
    setAttempt((n) => n + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void (async () => {
      try {
        await fetchGroupInfo(groupName, '', { signal: controller.signal });
        if (controller.signal.aborted) return;
        setAccess({ state: 'open' });
      } catch (err) {
        if (controller.signal.aborted) return;
        setAccess(
          isAccessDenied(err)
            ? { state: 'denied' }
            : { state: 'failed', message: errorMessage(err, 'Could not reach the server') },
        );
      }
    })();
    return () => controller.abort();
  }, [groupName, attempt]);

  useEffect(() => {
    if (access.state !== 'open') return;
    const key = groupName.toLowerCase();
    if (!key || counted.has(key)) return;
    counted.add(key);
    void recordGroupView(groupName);
  }, [groupName, access.state]);

  if (access.state === 'checking') return <PageLoading />;
  if (access.state === 'open') {
    return <GroupMapShell groupName={groupName} groupToken="" initialTab="map" />;
  }
  return (
    <GroupLocked
      groupName={groupName}
      loadError={access.state === 'failed' ? access.message : null}
      onRetry={retry}
    />
  );
}
