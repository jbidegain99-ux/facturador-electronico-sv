'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  Mail,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Settings,
  Trash2,
  TestTube,
  Send,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface EmailConfig {
  id: string;
  provider: string;
  authMethod: string;
  fromEmail: string;
  fromName: string;
  isActive: boolean;
  isVerified: boolean;
  configuredBy: string;
  lastTestAt: string | null;
  createdAt: string;
}

interface TenantEmailConfigProps {
  tenantId: string;
  tenantName: string;
}

const providerLabels: Record<string, string> = {
  SENDGRID: 'SendGrid',
  MAILGUN: 'Mailgun',
  AMAZON_SES: 'Amazon SES',
  MICROSOFT_365: 'Microsoft 365',
  GOOGLE_WORKSPACE: 'Google Workspace',
  POSTMARK: 'Postmark',
  BREVO: 'Brevo',
  MAILTRAP: 'Mailtrap',
  SMTP_GENERIC: 'SMTP',
};

const authMethodLabels: Record<string, string> = {
  API_KEY: 'API Key',
  SMTP_BASIC: 'SMTP',
  OAUTH2: 'OAuth 2.0',
  AWS_IAM: 'AWS IAM',
};

export function TenantEmailConfig({ tenantId, tenantName }: TenantEmailConfigProps) {
  const t = useTranslations('admin');
  const tCommon = useTranslations('common');
  const [config, setConfig] = useState<EmailConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Config form state
  const [provider, setProvider] = useState('SENDGRID');
  const [authMethod, setAuthMethod] = useState('API_KEY');
  const [apiKey, setApiKey] = useState('');
  const [fromEmail, setFromEmail] = useState('');
  const [fromName, setFromName] = useState('');
  const [testEmail, setTestEmail] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, [tenantId]);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/email-configs/${tenantId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.ok) {
        const data = await res.json();
        if (data.configured) {
          setConfig(data.config);
        } else {
          setConfig(null);
        }
      }
    } catch (err) {
      console.error('Error fetching email config:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    try {
      setTesting(true);
      setTestResult(null);
      const token = localStorage.getItem('token');
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/email-configs/${tenantId}/test-connection`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await res.json();
      setTestResult({
        success: data.success,
        message: data.success ? t('connectionSuccess') : data.error || t('connectionError'),
      });
      fetchConfig();
    } catch (err) {
      setTestResult({ success: false, message: t('testConnectionError') });
    } finally {
      setTesting(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!testEmail) {
      alert(t('enterTestEmail'));
      return;
    }

    try {
      setSendingTest(true);
      setTestResult(null);
      const token = localStorage.getItem('token');
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/email-configs/${tenantId}/send-test`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ recipientEmail: testEmail }),
        }
      );

      const data = await res.json();
      setTestResult({
        success: data.success,
        message: data.success ? t('testEmailSent') : data.error || t('testEmailError'),
      });
      fetchConfig();
    } catch (err) {
      setTestResult({ success: false, message: t('testEmailError') });
    } finally {
      setSendingTest(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      const token = localStorage.getItem('token');
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/email-configs/${tenantId}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.ok) {
        setConfig(null);
        setShowDeleteConfirm(false);
        alert(t('configDeleted'));
      } else {
        alert(t('configDeleteError'));
      }
    } catch (err) {
      alert(t('configDeleteError'));
    } finally {
      setDeleting(false);
    }
  };

  const handleSaveConfig = async () => {
    if (!apiKey || !fromEmail) {
      alert(t('completeRequired'));
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/email-configs/${tenantId}/configure`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            provider,
            authMethod,
            apiKey,
            fromEmail,
            fromName: fromName || tenantName,
          }),
        }
      );

      if (res.ok) {
        setShowConfigModal(false);
        fetchConfig();
        alert(t('configSaved'));
        // Reset form
        setApiKey('');
        setFromEmail('');
        setFromName('');
      } else {
        const data = await res.json();
        alert(data.message || t('configSaveError'));
      }
    } catch (err) {
      alert(t('configSaveError'));
    } finally {
      setSaving(false);
    }
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

  return (
    <>
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-white">{t('emailConfig')}</h3>
          </div>
          {config ? (
            <div className="flex items-center gap-2">
              {config.isVerified ? (
                <span className="flex items-center gap-1 text-xs text-green-400">
                  <CheckCircle className="w-3 h-3" />
                  {t('verified')}
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs text-yellow-400">
                  <AlertTriangle className="w-3 h-3" />
                  {t('notVerified')}
                </span>
              )}
            </div>
          ) : (
            <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-500/20 text-yellow-400">
              {t('notConfigured')}
            </span>
          )}
        </div>

        {config ? (
          <div className="space-y-4">
            {/* Config Info */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">{t('provider')}:</span>
                <span className="ml-2 text-white">{providerLabels[config.provider] || config.provider}</span>
              </div>
              <div>
                <span className="text-muted-foreground">{t('method')}:</span>
                <span className="ml-2 text-white">{authMethodLabels[config.authMethod] || config.authMethod}</span>
              </div>
              <div>
                <span className="text-muted-foreground">{t('sender')}:</span>
                <span className="ml-2 text-white">{config.fromEmail}</span>
              </div>
              <div>
                <span className="text-muted-foreground">{t('configuredBy')}:</span>
                <span className="ml-2 text-white">
                  {config.configuredBy === 'REPUBLICODE' ? t('adminBadge') : t('requester')}
                </span>
              </div>
            </div>

            {/* Test Result */}
            {testResult && (
              <div className={`p-3 rounded-lg text-sm ${
                testResult.success ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
              }`}>
                {testResult.success ? (
                  <CheckCircle className="w-4 h-4 inline mr-2" />
                ) : (
                  <XCircle className="w-4 h-4 inline mr-2" />
                )}
                {testResult.message}
              </div>
            )}

            {/* Test Email Input */}
            <div className="flex gap-2">
              <input
                type="email"
                placeholder={t('testEmailPlaceholder')}
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="input-rc flex-1"
              />
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleTestConnection}
                disabled={testing}
              >
                {testing ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <TestTube className="w-4 h-4 mr-1" />
                )}
                {t('testConnection')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSendTestEmail}
                disabled={sendingTest || !testEmail}
              >
                {sendingTest ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-1" />
                )}
                {t('sendTest')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowConfigModal(true)}
              >
                <Settings className="w-4 h-4 mr-1" />
                {t('modify')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="w-4 h-4 mr-1" />
                {tCommon('delete')}
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-4">
              {t('noEmailConfig')}
            </p>
            <Button onClick={() => setShowConfigModal(true)}>
              <Mail className="w-4 h-4 mr-2" />
              {t('configureEmail')}
            </Button>
          </div>
        )}
      </div>

      {/* Config Modal */}
      <Dialog open={showConfigModal} onOpenChange={setShowConfigModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t('configureEmailFor', { name: tenantName })}</DialogTitle>
            <DialogDescription>
              {t('configureEmailDesc')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium mb-2">{t('provider')}</label>
              <Select value={provider} onValueChange={setProvider}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SENDGRID">SendGrid</SelectItem>
                  <SelectItem value="MAILGUN">Mailgun</SelectItem>
                  <SelectItem value="AMAZON_SES">Amazon SES</SelectItem>
                  <SelectItem value="POSTMARK">Postmark</SelectItem>
                  <SelectItem value="BREVO">Brevo</SelectItem>
                  <SelectItem value="MAILTRAP">Mailtrap</SelectItem>
                  <SelectItem value="SMTP_GENERIC">SMTP</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">{t('authMethod')}</label>
              <Select value={authMethod} onValueChange={setAuthMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="API_KEY">API Key</SelectItem>
                  <SelectItem value="SMTP_BASIC">SMTP</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">{t('apiKeyCredentials')} *</label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="API Key / SMTP"
                className="input-rc"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">{t('senderEmail')} *</label>
              <input
                type="email"
                value={fromEmail}
                onChange={(e) => setFromEmail(e.target.value)}
                placeholder="noreply@empresa.com"
                className="input-rc"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">{t('senderName')}</label>
              <input
                type="text"
                value={fromName}
                onChange={(e) => setFromName(e.target.value)}
                placeholder={tenantName}
                className="input-rc"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfigModal(false)}>
              {tCommon('cancel')}
            </Button>
            <Button onClick={handleSaveConfig} disabled={saving}>
              {saving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              {tCommon('save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{t('deleteConfig')}</DialogTitle>
            <DialogDescription>
              {t('deleteConfigConfirm')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              {tCommon('cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              {tCommon('delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
