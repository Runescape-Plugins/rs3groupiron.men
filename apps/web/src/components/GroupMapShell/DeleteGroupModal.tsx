import { useState } from 'react';
import { DELETION_GRACE_DAYS } from '../../lib/constants';
import { Modal } from '../Modal';
import { RemoveIcon } from './icons';

type DeleteGroupModalProps = {
  groupName: string;
  busy: boolean;
  onClose: () => void;
  onConfirm: (confirm: { confirm_name: string; confirm_token: string }) => void;
};

const WIPED = [
  'Every member, nickname, colour and Discord id',
  'All skills and the whole experience history behind the graphs',
  'Every inventory, bank and shared-bank snapshot, and the bank ledger',
  'Quest and achievement progress, kill counts and the achievement feed',
  'The group name and its token, which cannot be recovered afterwards',
];

export function DeleteGroupModal({
  groupName,
  busy,
  onClose,
  onConfirm,
}: DeleteGroupModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState('');
  const [token, setToken] = useState('');

  const nameMatches = name.trim().toLowerCase() === groupName.trim().toLowerCase();
  const ready = nameMatches && token.trim().length > 0;

  return (
    <Modal
      open
      onClose={onClose}
      titleId="gms-delete-group-title"
      title={step === 1 ? 'Delete group data' : 'Confirm deletion'}
      className="gms-modal--danger"
      closeDisabled={busy}
    >
      {step === 1 ? (
        <div className="gms-modal-body">
          <p className="gms-modal-copy">
            This erases everything <strong>{groupName}</strong> has stored on our servers.
            It cannot be undone once the date passes.
          </p>
          <ul className="gms-danger-list">
            {WIPED.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p className="gms-modal-copy">
            The group keeps working for <strong>{DELETION_GRACE_DAYS} days</strong>, then
            everything is purged. You can cancel from this screen at any point before then.
            Backups age out within 30 days of the purge.
          </p>
          <div className="gms-modal-actions">
            <button type="button" className="gms-modal-cancel" onClick={onClose}>
              Keep my data
            </button>
            <button
              type="button"
              className="gms-settings-text-btn gms-settings-danger"
              onClick={() => setStep(2)}
            >
              I understand, continue
            </button>
          </div>
        </div>
      ) : (
        <form
          className="gms-modal-body"
          onSubmit={(e) => {
            e.preventDefault();
            if (!ready) return;
            onConfirm({ confirm_name: name.trim(), confirm_token: token.trim() });
          }}
        >
          <p className="gms-modal-copy">
            Second and final confirmation. Retype the group name and paste the group token
            to prove this is deliberate.
          </p>
          <label>
            Group name — type “{groupName}”
            <input
              value={name}
              required
              autoComplete="off"
              spellCheck={false}
              disabled={busy}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label>
            Group token
            <input
              value={token}
              type="password"
              required
              autoComplete="off"
              spellCheck={false}
              disabled={busy}
              onChange={(e) => setToken(e.target.value)}
            />
          </label>
          {name.trim().length > 0 && !nameMatches && (
            <p className="gms-danger-note">The group name does not match.</p>
          )}
          <div className="gms-modal-actions">
            <button
              type="button"
              className="gms-modal-cancel"
              disabled={busy}
              onClick={() => setStep(1)}
            >
              ← Back
            </button>
            <button
              type="submit"
              className="gms-settings-text-btn gms-settings-danger"
              disabled={busy || !ready}
            >
              <RemoveIcon />
              {busy ? 'Scheduling…' : 'Delete everything'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
