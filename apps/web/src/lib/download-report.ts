/**
 * Error thrown by downloadReport when the response is not OK.
 * Caller can inspect `status` to show tier-appropriate toast.
 */
export class DownloadReportError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = 'DownloadReportError';
  }
}

/**
 * Fetches an xlsx/csv report from the backend and triggers a browser download.
 * Uses cookie-based auth (`credentials: 'include'`) — consistent with rest of dashboard.
 *
 * @param url Full URL including query params, e.g. `${API_URL}/reports/iva-declaracion?startDate=...&endDate=...`
 * @param filename Suggested filename for the downloaded file
 * @throws DownloadReportError when response is not OK (caller decides toast per status code)
 */
export async function downloadReport(url: string, filename: string): Promise<void> {
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new DownloadReportError(res.status, text || res.statusText);
  }
  const blob = await res.blob();
  const objUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(objUrl);
}
