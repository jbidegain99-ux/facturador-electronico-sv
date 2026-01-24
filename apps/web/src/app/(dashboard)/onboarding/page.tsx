'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { OnboardingWizard } from '@/components/onboarding/onboarding-wizard';
import { Loader2 } from 'lucide-react';

export default function OnboardingPage() {
  const router = useRouter();
  const [tenantData, setTenantData] = React.useState<{
    nombre: string;
    nit: string;
    nrc: string;
    actividadEcon: string;
    direccion?: {
      departamento: string;
      municipio: string;
      complemento: string;
    };
    telefono: string;
    correo: string;
    hasCertificate?: boolean;
  } | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    async function fetchTenantData() {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/login');
          return;
        }

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/tenants/me`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error('Error fetching tenant data');
        }

        const data = await response.json();

        // Parse direccion if it's a string
        let direccion = data.direccion;
        if (typeof direccion === 'string') {
          try {
            direccion = JSON.parse(direccion);
          } catch {
            direccion = undefined;
          }
        }

        setTenantData({
          nombre: data.nombre,
          nit: data.nit,
          nrc: data.nrc,
          actividadEcon: data.actividadEcon,
          direccion,
          telefono: data.telefono,
          correo: data.correo,
          hasCertificate: !!data.certificatePath,
        });
      } catch (error) {
        console.error('Error loading tenant data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchTenantData();
  }, [router]);

  const handleComplete = async () => {
    try {
      // Mark onboarding as complete
      const token = localStorage.getItem('token');
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/tenants/me/onboarding-complete`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
    } catch (error) {
      console.error('Error marking onboarding complete:', error);
    }

    router.push('/facturas');
  };

  const handleSkip = async () => {
    try {
      // Call API to skip onboarding and enable demo mode
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/tenants/me/onboarding-skip`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log('Demo mode activated:', data);
      }
    } catch (error) {
      console.error('Error skipping onboarding:', error);
    }

    router.push('/facturas');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-3" />
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <OnboardingWizard
      tenantData={tenantData || undefined}
      onComplete={handleComplete}
      onSkip={handleSkip}
    />
  );
}
