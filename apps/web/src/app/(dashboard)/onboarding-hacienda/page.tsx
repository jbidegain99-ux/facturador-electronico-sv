'use client';

import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { HaciendaWizard } from '@/components/onboarding';
import { OnboardingState } from '@/types/onboarding';

export default function OnboardingHaciendaPage() {
  const [loading, setLoading] = React.useState(true);
  const [data, setData] = React.useState<OnboardingState | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    loadOnboardingData();
  }, []);

  const loadOnboardingData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No hay sesión activa');
        setLoading(false);
        return;
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/onboarding`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (res.ok) {
        const result = await res.json();
        // Only set data if onboarding exists (not null/404)
        if (result && result.id) {
          setData(result);
        }
      } else if (res.status !== 404) {
        // 404 means not started yet, which is fine
        const errorData = await res.json();
        console.warn('Onboarding not found or error:', errorData);
      }
    } catch (err) {
      console.error('Error loading onboarding:', err);
      setError('Error al cargar datos de onboarding');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="text-primary hover:underline"
          >
            Intentar de nuevo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl py-8">
      <HaciendaWizard initialData={data} />
    </div>
  );
}
