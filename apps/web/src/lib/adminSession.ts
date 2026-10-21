const SESSION_KEY = 'rs3.adminToken';

export function readAdminToken(): string {
  try {
    return sessionStorage.getItem(SESSION_KEY)?.trim() ?? '';
  } catch {
    return '';
  }
}

export function writeAdminToken(token: string) {
  try {
    sessionStorage.setItem(SESSION_KEY, token.trim());
  } catch {
    /* ignore a storage-less browser */
  }
}

export function clearAdminToken() {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore a storage-less browser */
  }
}
