'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

export default function VerifyEmailPage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations('auth');
  const token = params.token as string;

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [resendEmail, setResendEmail] = useState('');
  const [resending, setResending] = useState(false);
  const [resendDone, setResendDone] = useState(false);
  const verifiedRef = useRef(false);

  useEffect(() => {
    if (verifiedRef.current) return;
    verifiedRef.current = true;

    const verify = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/verify-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          setStatus('error');
          setErrorMessage(data.message || t('verifyEmailExpired'));
          return;
        }

        setStatus('success');
        setTimeout(() => router.push('/login'), 3000);
      } catch {
        setStatus('error');
        setErrorMessage(t('verifyEmailError'));
      }
    };

    verify();
  }, [token, router, t]);

  const handleResend = async () => {
    if (!resendEmail || resending) return;
    setResending(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resendEmail }),
      });

      await res.json().catch(() => ({}));
      setResendDone(true);
    } catch {
      // Still show success to avoid user enumeration
      setResendDone(true);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-center px-6 py-12 lg:px-8 bg-background">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {status === 'loading' && (
          <div className="rounded-lg bg-card p-8 shadow text-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-foreground font-medium">{t('verifyEmailTitle')}</p>
          </div>
        )}

        {status === 'success' && (
          <div className="rounded-lg bg-card p-8 shadow text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <p className="text-green-700 font-medium">{t('verifyEmailSuccess')}</p>
            <Link
              href="/login"
              className="mt-4 inline-block text-sm text-primary hover:text-primary/80 transition-colors"
            >
              {t('goToLogin')}
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="rounded-lg bg-card p-8 shadow">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="text-center text-red-700 font-medium mb-4">{errorMessage}</p>

            {!resendDone ? (
              <div className="mt-6 space-y-3">
                <p className="text-sm text-muted-foreground text-center">
                  {t('resendVerification')}
                </p>
                <input
                  type="email"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  placeholder="tu@email.com"
                  className="block w-full rounded-lg border border-input bg-background py-2.5 px-4 text-foreground shadow-sm placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm"
                />
                <button
                  onClick={handleResend}
                  disabled={resending || !resendEmail}
                  className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50"
                >
                  {resending ? '...' : t('resendVerification')}
                </button>
              </div>
            ) : (
              <div className="mt-4 rounded-md bg-green-50 p-3">
                <p className="text-sm text-green-700 text-center">{t('resendSuccess')}</p>
              </div>
            )}

            <div className="mt-4 text-center">
              <Link href="/login" className="text-sm text-primary hover:text-primary/80 transition-colors">
                {t('backToLogin')}
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
