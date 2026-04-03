export function trackSyncFailure(operationType: string, error: string): void {
  if (typeof window === 'undefined') return;
  try {
    const Sentry = require('@sentry/nextjs');
    Sentry.captureEvent({
      message: `Sync failure: ${operationType}`,
      level: 'warning',
      tags: { 'sync.operation': operationType },
      extra: { error },
    });
  } catch {
    // Sentry not loaded — ignore
  }
}

export function trackPwaInstall(): void {
  if (typeof window === 'undefined') return;
  try {
    const Sentry = require('@sentry/nextjs');
    Sentry.captureEvent({
      message: 'PWA installed',
      level: 'info',
      tags: { 'pwa.event': 'install' },
    });
  } catch {
    // ignore
  }
}
