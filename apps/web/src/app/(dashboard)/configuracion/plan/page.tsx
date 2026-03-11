'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  BarChart3,
  Users,
  FileText,
  Package,
  Phone,
  Mail,
  Shield,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { usePlanFeatures, FeatureCode } from '@/hooks/use-plan-features';
import { usePlanSupport } from '@/hooks/use-plan-support';

interface UsageData {
  planCode: string;
  enabledFeatures: FeatureCode[];
  limits: {
    maxDtesPerMonth: number;
    maxClients: number;
    maxCatalogItems: number;
  };
  usage: {
    dtesThisMonth: number;
    clientCount: number;
  };
  canCreateDte: boolean;
  canAddClient: boolean;
}

const planNames: Record<string, string> = {
  STARTER: 'Starter',
  PROFESSIONAL: 'Professional',
  ENTERPRISE: 'Enterprise',
};

const featureLabels: Record<string, { label: string; icon: typeof FileText }> = {
  invoicing: { label: 'Facturación electrónica', icon: FileText },
  accounting: { label: 'Módulo contable', icon: BarChart3 },
  catalog: { label: 'Catálogo de productos', icon: Package },
  recurring_invoices: { label: 'Facturas recurrentes', icon: Clock },
  quotes_b2b: { label: 'Cotizaciones B2B', icon: FileText },
  webhooks: { label: 'Webhooks', icon: Shield },
  api_full: { label: 'API completa', icon: Shield },
  advanced_reports: { label: 'Reportes avanzados', icon: BarChart3 },
  ticket_support: { label: 'Soporte por tickets', icon: Mail },
  phone_support: { label: 'Soporte telefónico', icon: Phone },
};

const allFeatures: FeatureCode[] = [
  'invoicing',
  'accounting',
  'catalog',
  'recurring_invoices',
  'quotes_b2b',
  'webhooks',
  'api_full',
  'advanced_reports',
  'ticket_support',
  'phone_support',
];

export default function PlanConfigPage() {
  const { features, featureCodes, loading: featuresLoading } = usePlanFeatures();
  const { config: supportConfig, loading: supportLoading } = usePlanSupport();
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loadingUsage, setLoadingUsage] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoadingUsage(false);
      return;
    }

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/plans/my-usage`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) return null;
        return res.json().catch(() => null) as Promise<UsageData | null>;
      })
      .then((data) => {
        if (data) setUsage(data);
      })
      .catch(() => {})
      .finally(() => setLoadingUsage(false));
  }, []);

  const loading = featuresLoading || supportLoading || loadingUsage;

  const getUsagePercent = (used: number, max: number): number => {
    if (max === -1) return 0;
    return Math.min(100, Math.round((used / max) * 100));
  };

  const getBarColor = (percent: number): string => {
    if (percent >= 90) return 'bg-red-500';
    if (percent >= 70) return 'bg-yellow-500';
    return 'bg-primary';
  };

  const formatLimit = (val: number): string => {
    if (val === -1) return 'Ilimitado';
    return val.toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const planCode = usage?.planCode || features.planCode;
  const planName = planNames[planCode] || planCode;

  const dtePercent = usage ? getUsagePercent(usage.usage.dtesThisMonth, usage.limits.maxDtesPerMonth) : 0;
  const clientPercent = usage ? getUsagePercent(usage.usage.clientCount, usage.limits.maxClients) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/configuracion" className="p-2 hover:bg-muted rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Mi Plan</h1>
          <p className="text-muted-foreground mt-1">Informacion de tu plan y consumo actual</p>
        </div>
      </div>

      {/* Plan Info Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">{planName}</CardTitle>
              <CardDescription>Plan {planCode}</CardDescription>
            </div>
            <div className="px-4 py-2 rounded-full bg-primary/10 text-primary font-semibold text-sm">
              Activo
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Usage Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* DTEs this month */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">DTEs este mes</div>
                <div className="text-2xl font-bold">
                  {usage?.usage.dtesThisMonth ?? 0}
                  <span className="text-sm font-normal text-muted-foreground">
                    {' '}/ {usage ? formatLimit(usage.limits.maxDtesPerMonth) : '—'}
                  </span>
                </div>
              </div>
            </div>
            {usage && usage.limits.maxDtesPerMonth !== -1 && (
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${getBarColor(dtePercent)}`}
                  style={{ width: `${dtePercent}%` }}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Clients */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Clientes</div>
                <div className="text-2xl font-bold">
                  {usage?.usage.clientCount ?? 0}
                  <span className="text-sm font-normal text-muted-foreground">
                    {' '}/ {usage ? formatLimit(usage.limits.maxClients) : '—'}
                  </span>
                </div>
              </div>
            </div>
            {usage && usage.limits.maxClients !== -1 && (
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${getBarColor(clientPercent)}`}
                  style={{ width: `${clientPercent}%` }}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Catalog Items */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <Package className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Items de catalogo</div>
                <div className="text-2xl font-bold">
                  {usage ? formatLimit(usage.limits.maxCatalogItems) : '—'}
                  <span className="text-sm font-normal text-muted-foreground"> max</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Features + SLA */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Features */}
        <Card>
          <CardHeader>
            <CardTitle>Funcionalidades incluidas</CardTitle>
            <CardDescription>Caracteristicas disponibles en tu plan actual</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {allFeatures.map((code) => {
                const enabled = featureCodes.includes(code);
                const info = featureLabels[code];
                const Icon = info?.icon || Shield;
                return (
                  <div key={code} className="flex items-center gap-3">
                    {enabled ? (
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-5 h-5 text-muted-foreground/40 flex-shrink-0" />
                    )}
                    <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <span className={enabled ? '' : 'text-muted-foreground/60 line-through'}>
                      {info?.label || code}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* SLA & Support */}
        <Card>
          <CardHeader>
            <CardTitle>Soporte y SLA</CardTitle>
            <CardDescription>Niveles de soporte incluidos en tu plan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span>Soporte por tickets</span>
                </div>
                {supportConfig.ticketSupportEnabled ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-muted-foreground/40" />
                )}
              </div>
              {supportConfig.ticketSupportEnabled && supportConfig.ticketResponseHours > 0 && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span>Tiempo de respuesta SLA</span>
                  </div>
                  <span className="font-semibold">{supportConfig.ticketResponseHours}h</span>
                </div>
              )}
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span>Soporte telefonico</span>
                </div>
                {supportConfig.phoneSupportEnabled ? (
                  <div className="text-right">
                    <CheckCircle className="w-5 h-5 text-green-500 inline" />
                    {supportConfig.phoneSupportHours && (
                      <div className="text-xs text-muted-foreground mt-1">{supportConfig.phoneSupportHours}</div>
                    )}
                  </div>
                ) : (
                  <XCircle className="w-5 h-5 text-muted-foreground/40" />
                )}
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span>Ejecutivo de cuenta</span>
                </div>
                {supportConfig.accountManagerEnabled ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-muted-foreground/40" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upgrade CTA */}
      {planCode !== 'ENTERPRISE' && (
        <Card className="border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Necesitas mas capacidad?</h3>
                <p className="text-sm text-muted-foreground">
                  Contacta a nuestro equipo de ventas para actualizar tu plan y desbloquear mas funcionalidades.
                </p>
              </div>
              <a href="mailto:ventas@republicode.com">
                <Button>Contactar ventas</Button>
              </a>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
