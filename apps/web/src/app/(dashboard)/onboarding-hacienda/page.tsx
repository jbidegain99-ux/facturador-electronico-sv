'use client';

import * as React from 'react';
import Link from 'next/link';
import { Loader2, AlertTriangle, Settings, Mail } from 'lucide-react';
import { HaciendaWizard } from '@/components/onboarding';
import { OnboardingState } from '@/types/onboarding';
import { Button } from '@/components/ui/button';

export default function OnboardingHaciendaPage() {
  const [loading, setLoading] = React.useState(true);
  const [data, setData] = React.useState<OnboardingState | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [demoMode, setDemoMode] = React.useState(false);

  React.useEffect(() => {
    loadOnboardingData();
  }, []);

  const loadOnboardingData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No hay sesion activa');
        setLoading(false);
        return;
      }

      // Fetch both onboarding status and data in parallel
      const [statusRes, onboardingRes] = await Promise.all([
        fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/tenants/me/onboarding-status`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        ),
        fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/onboarding`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        ),
      ]);

      // Check demo mode status
      if (statusRes.ok) {
        const statusData = await statusRes.json();
        if (statusData.demoMode) {
          setDemoMode(true);
          setLoading(false);
          return;
        }
      }

      // Process onboarding data
      if (onboardingRes.ok) {
        const result = await onboardingRes.json();
        // Only set data if onboarding exists (not null/404)
        if (result && result.id) {
          setData(result);
        }
      } else if (onboardingRes.status !== 404) {
        // 404 means not started yet, which is fine
        const errorData = await onboardingRes.json();
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

  // Demo mode message
  if (demoMode) {
    return (
      <div className="container max-w-2xl py-16">
        <div className="glass-card p-8 text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-yellow-500/20 flex items-center justify-center mb-6">
            <AlertTriangle className="h-8 w-8 text-yellow-500" />
          </div>

          <h1 className="text-2xl font-bold mb-3">Modo Demostracion Activo</h1>

          <p className="text-muted-foreground mb-6">
            El proceso de onboarding con el Ministerio de Hacienda no esta disponible
            mientras el modo demostracion esta activo.
          </p>

          <div className="bg-muted/50 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">¿Que es el modo demo?</strong>
              <br />
              En modo demo, puedes explorar todas las funcionalidades de la plataforma
              sin conectar con el Ministerio de Hacienda. Las facturas generadas son
              simuladas y no tienen validez legal.
            </p>
          </div>

          <p className="text-sm text-muted-foreground mb-8">
            Para completar el proceso de habilitacion con Hacienda, primero desactiva
            el modo demo desde la configuracion de tu empresa.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="outline" asChild>
              <Link href="/configuracion">
                <Settings className="w-4 h-4 mr-2" />
                Ir a Configuracion
              </Link>
            </Button>
            <Button asChild className="btn-primary">
              <Link href="mailto:soporte@republicode.io">
                <Mail className="w-4 h-4 mr-2" />
                Contactar Soporte
              </Link>
            </Button>
          </div>
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
