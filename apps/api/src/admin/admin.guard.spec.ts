import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import {
  AdminGuard,
  adminTokenMatches,
  presentedAdminToken,
} from './admin.guard';

const TOKEN = 'a'.repeat(32);

function contextWith(headers: Record<string, string | string[]>) {
  return {
    switchToHttp: () => ({ getRequest: () => ({ headers }) }),
  } as unknown as ExecutionContext;
}

describe('presentedAdminToken', () => {
  it('reads the dedicated header first', () => {
    expect(
      presentedAdminToken({ 'x-admin-token': TOKEN, authorization: 'other' }),
    ).toBe(TOKEN);
  });

  it('accepts Authorization bare or as a bearer', () => {
    expect(presentedAdminToken({ authorization: TOKEN })).toBe(TOKEN);
    expect(presentedAdminToken({ authorization: `Bearer ${TOKEN}` })).toBe(
      TOKEN,
    );
    expect(presentedAdminToken({ authorization: `bearer  ${TOKEN} ` })).toBe(
      TOKEN,
    );
  });

  it('takes the first value when a header is repeated', () => {
    expect(presentedAdminToken({ 'x-admin-token': [TOKEN, 'second'] })).toBe(
      TOKEN,
    );
  });

  it('is empty when nothing was sent', () => {
    expect(presentedAdminToken({})).toBe('');
    expect(presentedAdminToken({ authorization: '   ' })).toBe('');
  });
});

describe('adminTokenMatches', () => {
  it('only accepts the exact token', () => {
    expect(adminTokenMatches(TOKEN, TOKEN)).toBe(true);
    expect(adminTokenMatches(TOKEN, `${TOKEN}x`)).toBe(false);
    expect(adminTokenMatches(TOKEN, TOKEN.slice(0, -1))).toBe(false);
    expect(adminTokenMatches(TOKEN, '')).toBe(false);
  });
});

describe('AdminGuard', () => {
  const guard = new AdminGuard();

  afterEach(() => {
    delete process.env.ADMIN_TOKEN;
  });

  it('hides the routes entirely when no token is configured', () => {
    expect(() => guard.canActivate(contextWith({}))).toThrow(NotFoundException);
    expect(() =>
      guard.canActivate(contextWith({ 'x-admin-token': TOKEN })),
    ).toThrow(NotFoundException);
  });

  it('treats a too-short ADMIN_TOKEN as unconfigured', () => {
    process.env.ADMIN_TOKEN = 'short';
    expect(() =>
      guard.canActivate(contextWith({ 'x-admin-token': 'short' })),
    ).toThrow(NotFoundException);
  });

  it('rejects a missing or wrong token once configured', () => {
    process.env.ADMIN_TOKEN = TOKEN;
    expect(() => guard.canActivate(contextWith({}))).toThrow(
      UnauthorizedException,
    );
    expect(() =>
      guard.canActivate(contextWith({ 'x-admin-token': 'b'.repeat(32) })),
    ).toThrow(UnauthorizedException);
  });

  it('lets the right token through', () => {
    process.env.ADMIN_TOKEN = TOKEN;
    expect(guard.canActivate(contextWith({ 'x-admin-token': TOKEN }))).toBe(
      true,
    );
    expect(
      guard.canActivate(contextWith({ authorization: `Bearer ${TOKEN}` })),
    ).toBe(true);
  });
});
