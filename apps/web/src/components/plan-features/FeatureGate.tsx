'use client';

import { ReactNode } from 'react';
import { usePlanFeatures, FeatureCode } from '@/hooks/use-plan-features';
import { FeatureLocked } from './FeatureLocked';
import { Skeleton } from '@/components/ui/skeleton';

interface FeatureGateProps {
  feature: FeatureCode;
  children: ReactNode;
  fallback?: ReactNode;
  featureName?: string;
  planRequired?: string;
}

export function FeatureGate({
  feature,
  children,
  fallback,
  featureName,
  planRequired,
}: FeatureGateProps) {
  const { hasFeature, loading } = usePlanFeatures();

  if (loading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!hasFeature(feature)) {
    return (
      <>
        {fallback ?? (
          <FeatureLocked featureName={featureName} planRequired={planRequired} />
        )}
      </>
    );
  }

  return <>{children}</>;
}
