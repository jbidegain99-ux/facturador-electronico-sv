'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

/**
 * Old onboarding page - redirects to the new Hacienda wizard
 * This page is kept for backwards compatibility with any existing links/bookmarks
 */
export default function OnboardingPage() {
  const tCommon = useTranslations('common');
  const router = useRouter();

  React.useEffect(() => {
    // Redirect to the new Hacienda onboarding wizard
    router.replace('/onboarding-hacienda');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-3" />
        <p className="text-muted-foreground">{tCommon('loading')}</p>
      </div>
    </div>
  );
}
