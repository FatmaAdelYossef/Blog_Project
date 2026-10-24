import { describe, expect, it } from 'vitest';
import { jwtService } from './jwtService';

const base64url = (value) =>
  btoa(JSON.stringify(value)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

const makeToken = (payload) =>
  `${base64url({ alg: 'HS256', typ: 'JWT' })}.${base64url(payload)}.signature`;

const nowInSeconds = () => Math.floor(Date.now() / 1000);

describe('jwtService.decodeToken', () => {
  it('decodes the payload of a well-formed token', () => {
    const token = makeToken({ sub: 'user-1', email: 'a@example.test' });

    expect(jwtService.decodeToken(token)).toMatchObject({
      sub: 'user-1',
      email: 'a@example.test',
    });
  });

  it('returns null for a malformed token instead of throwing', () => {
    expect(jwtService.decodeToken('not-a-token')).toBeNull();
    expect(jwtService.decodeToken('')).toBeNull();
  });
});

describe('jwtService.isTokenExpired', () => {
  it('accepts a token whose expiry is in the future', () => {
    expect(jwtService.isTokenExpired(makeToken({ exp: nowInSeconds() + 60 }))).toBe(false);
  });

  it('rejects a token whose expiry has passed', () => {
    expect(jwtService.isTokenExpired(makeToken({ exp: nowInSeconds() - 60 }))).toBe(true);
  });

  it('treats a token without an exp claim as expired', () => {
    expect(jwtService.isTokenExpired(makeToken({ sub: 'user-1' }))).toBe(true);
  });

  it('treats a malformed token as expired', () => {
    expect(jwtService.isTokenExpired('not-a-token')).toBe(true);
    expect(jwtService.isTokenExpired('')).toBe(true);
  });
});
