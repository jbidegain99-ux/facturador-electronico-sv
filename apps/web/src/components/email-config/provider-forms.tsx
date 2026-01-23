'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, HelpCircle } from 'lucide-react';
import { EmailProvider, EmailConfigForm, EMAIL_PROVIDERS } from '@/types/email-config';
import { ProviderDocsLink } from './provider-selector';

interface ProviderFormProps {
  provider: EmailProvider;
  formData: Partial<EmailConfigForm>;
  onChange: (field: keyof EmailConfigForm, value: string | number | boolean) => void;
  disabled?: boolean;
}

export function ProviderForm({
  provider,
  formData,
  onChange,
  disabled = false,
}: ProviderFormProps) {
  const providerInfo = EMAIL_PROVIDERS.find((p) => p.id === provider);

  if (!providerInfo) return null;

  return (
    <div className="space-y-6">
      {/* Provider-specific fields */}
      {providerInfo.authMethods.includes('API_KEY') && (
        <ApiKeyForm
          provider={provider}
          formData={formData}
          onChange={onChange}
          disabled={disabled}
        />
      )}

      {providerInfo.authMethods.includes('SMTP_BASIC') && (
        <SmtpForm
          formData={formData}
          onChange={onChange}
          disabled={disabled}
        />
      )}

      {providerInfo.authMethods.includes('OAUTH2') && (
        <OAuth2Form
          provider={provider}
          formData={formData}
          onChange={onChange}
          disabled={disabled}
        />
      )}

      {/* Common sender configuration */}
      <SenderConfigForm
        formData={formData}
        onChange={onChange}
        disabled={disabled}
      />

      {/* Advanced settings (collapsible) */}
      <AdvancedSettings
        formData={formData}
        onChange={onChange}
        disabled={disabled}
      />
    </div>
  );
}

// API Key form for SendGrid, Mailgun, Postmark, Brevo, Mailtrap
function ApiKeyForm({
  provider,
  formData,
  onChange,
  disabled,
}: {
  provider: EmailProvider;
  formData: Partial<EmailConfigForm>;
  onChange: (field: keyof EmailConfigForm, value: string | number | boolean) => void;
  disabled: boolean;
}) {
  const [showKey, setShowKey] = React.useState(false);

  const labels: Record<string, { label: string; placeholder: string; hint: string }> = {
    SENDGRID: {
      label: 'API Key',
      placeholder: 'SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      hint: 'Comienza con "SG." - Obtener en Settings > API Keys',
    },
    MAILGUN: {
      label: 'API Key',
      placeholder: 'key-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      hint: 'Obtener en Settings > API Keys',
    },
    POSTMARK: {
      label: 'Server API Token',
      placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
      hint: 'Obtener en Servers > [Server] > API Tokens',
    },
    BREVO: {
      label: 'API Key',
      placeholder: 'xkeysib-xxxxxxxx',
      hint: 'Obtener en SMTP & API > API Keys',
    },
    MAILTRAP: {
      label: 'API Token',
      placeholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      hint: 'Obtener en API Tokens',
    },
  };

  const config = labels[provider] || labels.SENDGRID;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-foreground">Credenciales de API</h4>
        <ProviderDocsLink provider={provider} />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          {config.label} <span className="text-destructive">*</span>
        </label>
        <div className="relative">
          <Input
            type={showKey ? 'text' : 'password'}
            placeholder={config.placeholder}
            value={formData.apiKey || ''}
            onChange={(e) => onChange('apiKey', e.target.value)}
            disabled={disabled}
            className="pr-10 font-mono text-sm"
          />
          <button
            type="button"
            onClick={() => setShowKey(!showKey)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <HelpCircle className="w-3 h-3" />
          {config.hint}
        </p>
      </div>

      {provider === 'MAILGUN' && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Dominio <span className="text-destructive">*</span>
          </label>
          <Input
            type="text"
            placeholder="mg.tudominio.com"
            value={formData.apiEndpoint || ''}
            onChange={(e) => onChange('apiEndpoint', e.target.value)}
            disabled={disabled}
          />
          <p className="text-xs text-muted-foreground">
            El dominio verificado en Mailgun
          </p>
        </div>
      )}
    </div>
  );
}

// SMTP form for generic SMTP and Amazon SES
function SmtpForm({
  formData,
  onChange,
  disabled,
}: {
  formData: Partial<EmailConfigForm>;
  onChange: (field: keyof EmailConfigForm, value: string | number | boolean) => void;
  disabled: boolean;
}) {
  const [showPassword, setShowPassword] = React.useState(false);

  return (
    <div className="space-y-4">
      <h4 className="font-medium text-foreground">Configuración SMTP</h4>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Servidor SMTP <span className="text-destructive">*</span>
          </label>
          <Input
            type="text"
            placeholder="smtp.ejemplo.com"
            value={formData.smtpHost || ''}
            onChange={(e) => onChange('smtpHost', e.target.value)}
            disabled={disabled}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Puerto <span className="text-destructive">*</span>
          </label>
          <Input
            type="number"
            placeholder="587"
            value={formData.smtpPort || ''}
            onChange={(e) => onChange('smtpPort', parseInt(e.target.value) || 587)}
            disabled={disabled}
          />
          <p className="text-xs text-muted-foreground">
            Común: 587 (TLS), 465 (SSL), 25 (sin cifrado)
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Usuario <span className="text-destructive">*</span>
          </label>
          <Input
            type="text"
            placeholder="usuario@ejemplo.com"
            value={formData.smtpUser || ''}
            onChange={(e) => onChange('smtpUser', e.target.value)}
            disabled={disabled}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Contraseña <span className="text-destructive">*</span>
          </label>
          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={formData.smtpPassword || ''}
              onChange={(e) => onChange('smtpPassword', e.target.value)}
              disabled={disabled}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="smtpSecure"
          checked={formData.smtpSecure ?? true}
          onChange={(e) => onChange('smtpSecure', e.target.checked)}
          disabled={disabled}
          className="rounded border-border"
        />
        <label htmlFor="smtpSecure" className="text-sm text-foreground">
          Usar conexión segura (TLS/SSL)
        </label>
      </div>
    </div>
  );
}

// OAuth2 form for Microsoft 365 and Google Workspace
function OAuth2Form({
  provider,
  formData,
  onChange,
  disabled,
}: {
  provider: EmailProvider;
  formData: Partial<EmailConfigForm>;
  onChange: (field: keyof EmailConfigForm, value: string | number | boolean) => void;
  disabled: boolean;
}) {
  const [showSecret, setShowSecret] = React.useState(false);

  const isMicrosoft = provider === 'MICROSOFT_365';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-foreground">Configuración OAuth2</h4>
        <ProviderDocsLink provider={provider} />
      </div>

      <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
        <p className="text-sm text-amber-600 dark:text-amber-400">
          {isMicrosoft
            ? 'Necesita registrar una aplicación en Azure Active Directory con permisos Mail.Send'
            : 'Necesita crear un proyecto en Google Cloud Console con la API de Gmail habilitada'}
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          Client ID <span className="text-destructive">*</span>
        </label>
        <Input
          type="text"
          placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
          value={formData.oauth2ClientId || ''}
          onChange={(e) => onChange('oauth2ClientId', e.target.value)}
          disabled={disabled}
          className="font-mono text-sm"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          Client Secret <span className="text-destructive">*</span>
        </label>
        <div className="relative">
          <Input
            type={showSecret ? 'text' : 'password'}
            placeholder="••••••••••••••••"
            value={formData.oauth2ClientSecret || ''}
            onChange={(e) => onChange('oauth2ClientSecret', e.target.value)}
            disabled={disabled}
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowSecret(!showSecret)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isMicrosoft && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Tenant ID <span className="text-destructive">*</span>
          </label>
          <Input
            type="text"
            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            value={formData.oauth2TenantId || ''}
            onChange={(e) => onChange('oauth2TenantId', e.target.value)}
            disabled={disabled}
            className="font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">
            El ID de directorio (tenant) de Azure AD
          </p>
        </div>
      )}

      <Button type="button" variant="outline" className="w-full" disabled={disabled}>
        {isMicrosoft ? 'Conectar con Microsoft' : 'Conectar con Google'}
      </Button>
    </div>
  );
}

// Sender configuration (common to all providers)
function SenderConfigForm({
  formData,
  onChange,
  disabled,
}: {
  formData: Partial<EmailConfigForm>;
  onChange: (field: keyof EmailConfigForm, value: string | number | boolean) => void;
  disabled: boolean;
}) {
  return (
    <div className="space-y-4 pt-4 border-t">
      <h4 className="font-medium text-foreground">Configuración del Remitente</h4>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Email de Envío <span className="text-destructive">*</span>
          </label>
          <Input
            type="email"
            placeholder="facturas@miempresa.com"
            value={formData.fromEmail || ''}
            onChange={(e) => onChange('fromEmail', e.target.value)}
            disabled={disabled}
          />
          <p className="text-xs text-muted-foreground">
            Debe estar verificado en el proveedor
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Nombre del Remitente <span className="text-destructive">*</span>
          </label>
          <Input
            type="text"
            placeholder="Mi Empresa S.A. de C.V."
            value={formData.fromName || ''}
            onChange={(e) => onChange('fromName', e.target.value)}
            disabled={disabled}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          Email de Respuesta (opcional)
        </label>
        <Input
          type="email"
          placeholder="soporte@miempresa.com"
          value={formData.replyToEmail || ''}
          onChange={(e) => onChange('replyToEmail', e.target.value)}
          disabled={disabled}
        />
        <p className="text-xs text-muted-foreground">
          Si no se especifica, se usará el email de envío
        </p>
      </div>
    </div>
  );
}

// Advanced settings
function AdvancedSettings({
  formData,
  onChange,
  disabled,
}: {
  formData: Partial<EmailConfigForm>;
  onChange: (field: keyof EmailConfigForm, value: string | number | boolean) => void;
  disabled: boolean;
}) {
  const [expanded, setExpanded] = React.useState(false);

  return (
    <div className="pt-4 border-t">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <span>{expanded ? '▼' : '▶'}</span>
        Configuración Avanzada
      </button>

      {expanded && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Límite por hora
            </label>
            <Input
              type="number"
              placeholder="100"
              value={formData.rateLimitPerHour || ''}
              onChange={(e) => onChange('rateLimitPerHour', parseInt(e.target.value) || 100)}
              disabled={disabled}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Reintentos
            </label>
            <Input
              type="number"
              placeholder="3"
              value={formData.retryAttempts || ''}
              onChange={(e) => onChange('retryAttempts', parseInt(e.target.value) || 3)}
              disabled={disabled}
              min={0}
              max={10}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Timeout (seg)
            </label>
            <Input
              type="number"
              placeholder="30"
              value={formData.timeoutSeconds || ''}
              onChange={(e) => onChange('timeoutSeconds', parseInt(e.target.value) || 30)}
              disabled={disabled}
              min={5}
              max={120}
            />
          </div>
        </div>
      )}
    </div>
  );
}
