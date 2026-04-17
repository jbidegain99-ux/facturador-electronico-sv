import { parseMhDate } from './parse-mh-date';

describe('parseMhDate', () => {
  it('returns null for null input', () => {
    expect(parseMhDate(null)).toBeNull();
  });

  it('returns null for undefined input', () => {
    expect(parseMhDate(undefined)).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(parseMhDate('')).toBeNull();
  });

  it('parses MH format DD/MM/YYYY HH:mm:ss', () => {
    const result = parseMhDate('15/03/2026 14:30:45');
    expect(result).not.toBeNull();
    expect(result!.getFullYear()).toBe(2026);
    expect(result!.getMonth()).toBe(2); // March = 2 (0-indexed)
    expect(result!.getDate()).toBe(15);
    expect(result!.getHours()).toBe(14);
    expect(result!.getMinutes()).toBe(30);
    expect(result!.getSeconds()).toBe(45);
  });

  it('parses ISO 8601 format as fallback', () => {
    const result = parseMhDate('2026-03-15T14:30:45.000Z');
    expect(result).not.toBeNull();
    expect(result!.toISOString()).toBe('2026-03-15T14:30:45.000Z');
  });

  it('prefers MH regex over Date constructor for ambiguous format', () => {
    const result = parseMhDate('15/03/2026 00:00:00');
    expect(result!.getMonth()).toBe(2);
    expect(result!.getDate()).toBe(15);
  });

  it('returns null on unparseable garbage', () => {
    expect(parseMhDate('not a date')).toBeNull();
    expect(parseMhDate('99/99/9999')).toBeNull();
    expect(parseMhDate('2026-13-40')).toBeNull();
  });

  it('rejects MH format with extra whitespace edge cases', () => {
    expect(parseMhDate(' 15/03/2026 14:30:45')).toBeNull();
    expect(parseMhDate('15/03/2026  14:30:45')).not.toBeNull();
  });
});
