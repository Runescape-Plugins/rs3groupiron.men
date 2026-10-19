import { Link } from 'react-router-dom';
import type { GroupDeletion } from '../../api/groupClient';
import { DELETION_GRACE_DAYS } from '../../lib/constants';
import { timestamp } from '../../lib/time';
import { DownloadIcon, FileTextIcon, RemoveIcon } from './icons';

type DataSectionProps = {
  deletion: GroupDeletion | null;
  busy: boolean;
  readOnly: boolean;
  downloading: 'data' | 'archive' | null;
  onDownloadData: () => void;
  onDownloadArchive: () => void;
  onDelete: () => void;
  onCancelDelete: () => void;
};

export function DataSection({
  deletion,
  busy,
  readOnly,
  downloading,
  onDownloadData,
  onDownloadArchive,
  onDelete,
  onCancelDelete,
}: DataSectionProps) {
  const pending = deletion?.pending ? deletion : null;
  const due = pending?.delete_after ? timestamp(pending.delete_after) : null;

  return (
    <section className="gms-panel gms-settings-card">
      <div className="gms-settings-card-head">
        <h2 className="gms-section-title">Your data</h2>
        <span className="gms-settings-hint">
          What we store, and how to get rid of it. See the{' '}
          <Link to="/privacy">privacy notice</Link>,{' '}
          <Link to="/terms">terms of use</Link> and{' '}
          <Link to="/cookies">cookie notice</Link>.
        </span>
      </div>

      <div className="gms-settings-grid">
        <span className="gms-settings-label">Download a copy</span>
        <div className="gms-settings-stack">
          <span className="gms-settings-note">
            Everything we hold for this group, in machine-readable form. The archive
            adds the bank ledger, the achievement feed and the full experience history
            behind the graphs; neither includes your group token.
          </span>
          <div className="gms-danger-actions">
            <button
              type="button"
              className="gms-settings-text-btn gms-settings-save"
              disabled={busy || readOnly || downloading != null}
              onClick={onDownloadArchive}
            >
              <DownloadIcon />
              {downloading === 'archive' ? 'Building ZIP…' : 'Everything (.zip)'}
            </button>
            <button
              type="button"
              className="gms-settings-text-btn"
              disabled={busy || readOnly || downloading != null}
              onClick={onDownloadData}
            >
              <FileTextIcon />
              {downloading === 'data' ? 'Preparing…' : 'Data only (.json)'}
            </button>
          </div>
          {downloading === 'archive' && (
            <span className="gms-settings-note">
              Large groups can take a minute. Keep this tab open.
            </span>
          )}
        </div>

        <span className="gms-settings-label">Erase everything</span>
        <div className="gms-settings-stack">
          {pending ? (
            <>
              <p className="gms-danger-pending" role="status">
                <strong>Deletion scheduled.</strong> Everything this group holds is purged
                on <strong>{due?.stamp ?? 'the scheduled date'}</strong>
                {due ? ` (${due.absolute})` : ''}. The group keeps working until then, and
                cancelling now leaves all of it in place.
              </p>
              <div className="gms-danger-actions">
                <button
                  type="button"
                  className="gms-settings-text-btn gms-settings-save"
                  disabled={busy || readOnly}
                  onClick={onCancelDelete}
                >
                  Cancel deletion
                </button>
              </div>
            </>
          ) : (
            <>
              <span className="gms-settings-note">
                Deletes every member, skill, inventory, bank snapshot, quest and
                achievement, plus the group name and token. Takes two confirmations and
                your group name and token retyped, then runs {DELETION_GRACE_DAYS} days
                later so a mistake can be undone.
              </span>
              <div className="gms-danger-actions">
                <button
                  type="button"
                  className="gms-settings-text-btn gms-settings-danger"
                  disabled={busy || readOnly}
                  onClick={onDelete}
                >
                  <RemoveIcon />
                  Delete group data
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
