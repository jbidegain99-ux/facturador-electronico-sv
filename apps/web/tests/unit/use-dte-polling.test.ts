import { describe, it, expect } from 'vitest';

describe('DTE Polling logic', () => {
  const shouldPoll = (status: string | undefined, elapsed: number = 0): number | false => {
    if (!status) return 5000;
    if (status === 'PROCESADO' || status === 'RECHAZADO' || status === 'ANULADO') return false;
    if (elapsed > 60000) return false;
    return 5000;
  };

  it('should poll when status is undefined', () => {
    expect(shouldPoll(undefined)).toBe(5000);
  });

  it('should poll when status is PENDIENTE', () => {
    expect(shouldPoll('PENDIENTE')).toBe(5000);
  });

  it('should stop polling when PROCESADO', () => {
    expect(shouldPoll('PROCESADO')).toBe(false);
  });

  it('should stop polling when RECHAZADO', () => {
    expect(shouldPoll('RECHAZADO')).toBe(false);
  });

  it('should stop polling after 60 seconds', () => {
    expect(shouldPoll('PENDIENTE', 61000)).toBe(false);
  });
});
