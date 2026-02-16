'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EnvironmentConfig {
  environment: string;
  isConfigured: boolean;
  isValidated: boolean;
  tokenExpiry?: string;
  certificateInfo?: {
    fileName: string;
    validUntil: string;
    nit: string | null;
    subject: string;
  };
  lastValidationAt?: string;
  lastValidationError?: string;
}

interface HaciendaConfig {
  activeEnvironment: string;
  testingStatus: string;
  testingStartedAt?: string;
  testingCompletedAt?: string;
  productionAuthorizedAt?: string;
  testConfig?: EnvironmentConfig;
  prodConfig?: EnvironmentConfig;
}

interface TenantHaciendaConfigProps {
  tenantId: string;
  tenantName: string;
}

export function TenantHaciendaConfig({ tenantId, tenantName }: TenantHaciendaConfigProps) {
  const t = useTranslations('admin');
  const tSettings = useTranslations('settings');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const [config, setConfig] = useState<HaciendaConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const testingStatusLabels: Record<string, string> = {
    NOT_STARTED: t('testingNotStarted'),
    IN_PROGRESS: t('testingInProgress'),
    PENDING_AUTHORIZATION: t('testingPendingAuth'),
    AUTHORIZED: t('testingAuthorized'),
  };

  useEffect(() => {
    fetchConfig();
  }, [tenantId]);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/hacienda/${tenantId}/config`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.ok) {
        const data = await res.json();
        setConfig(data);
      }
    } catch (err) {
      console.error('Error fetching hacienda config:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchConfig();
    setRefreshing(false);
  };

  const getActiveEnvConfig = (): EnvironmentConfig | undefined => {
    if (!config) return undefined;
    return config.activeEnvironment === 'PRODUCTION'
      ? config.prodConfig
      : config.testConfig;
  };

  const isConfigured = (): boolean => {
    const envConfig = getActiveEnvConfig();
    return envConfig?.isConfigured ?? false;
  };

  const isTokenValid = (): boolean => {
    const envConfig = getActiveEnvConfig();
    if (!envConfig?.tokenExpiry) return false;
    return new Date(envConfig.tokenExpiry) > new Date();
  };

  if (loading) {
    return (
      <div className="glass-card p-6">
        <div className="flex items-center justify-center h-24">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  const envConfig = getActiveEnvConfig();
  const configured = isConfigured();
  const tokenValid = isTokenValid();

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-white">{t('haciendaConfig')}</h3>
        </div>
        <div className="flex items-center gap-2">
          {configured ? (
            tokenValid ? (
              <span className="flex items-center gap-1 text-xs text-green-400">
                <CheckCircle className="w-3 h-3" />
                {t('connected')}
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs text-yellow-400">
                <AlertTriangle className="w-3 h-3" />
                {t('tokenExpired')}
              </span>
            )
          ) : (
            <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-500/20 text-yellow-400">
              {t('notConfigured')}
            </span>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="h-7 w-7 p-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {configured && config ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">{t('environment')}:</span>
              <span className={`ml-2 font-medium ${
                config.activeEnvironment === 'PRODUCTION' ? 'text-green-400' : 'text-yellow-400'
              }`}>
                {config.activeEnvironment === 'PRODUCTION' ? tSettings('envProd') : tSettings('envTest')}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">{t('testingStatus')}:</span>
              <span className="ml-2 text-white">
                {testingStatusLabels[config.testingStatus] || config.testingStatus}
              </span>
            </div>
            {envConfig?.certificateInfo && (
              <>
                <div>
                  <span className="text-muted-foreground">{t('certificate')}:</span>
                  <span className="ml-2 text-white">{envConfig.certificateInfo.fileName}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">{t('expires')}:</span>
                  <span className="ml-2 text-white">
                    {new Date(envConfig.certificateInfo.validUntil).toLocaleDateString('es')}
                  </span>
                </div>
              </>
            )}
            {envConfig?.tokenExpiry && (
              <div>
                <span className="text-muted-foreground">{t('tokenExpires')}:</span>
                <span className={`ml-2 ${tokenValid ? 'text-green-400' : 'text-red-400'}`}>
                  {new Date(envConfig.tokenExpiry).toLocaleString('es')}
                </span>
              </div>
            )}
            {envConfig?.isValidated && (
              <div>
                <span className="text-muted-foreground">{t('validated')}:</span>
                <span className="flex items-center gap-1 ml-2 text-green-400">
                  <CheckCircle className="w-3 h-3" />
                  {tCommon('yes')}
                </span>
              </div>
            )}
          </div>

          {envConfig?.lastValidationError && (
            <div className="p-3 rounded-lg text-sm bg-red-500/20 text-red-400">
              <XCircle className="w-4 h-4 inline mr-2" />
              {envConfig.lastValidationError}
            </div>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/admin/tenants/${tenantId}/hacienda`)}
            >
              <ExternalLink className="w-4 h-4 mr-1" />
              {t('configure')}
            </Button>
          </div>
        </div>
      ) : (
        <div className="text-center py-4">
          <p className="text-sm text-muted-foreground mb-4">
            {t('noHaciendaConfig')}
          </p>
          <Button onClick={() => router.push(`/admin/tenants/${tenantId}/hacienda`)}>
            <Shield className="w-4 h-4 mr-2" />
            {t('configureHacienda')}
          </Button>
        </div>
      )}
    </div>
  );
}
