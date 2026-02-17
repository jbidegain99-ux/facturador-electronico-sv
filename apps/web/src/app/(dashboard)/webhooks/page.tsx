'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import {
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Plus,
  Settings,
  BarChart3,
  RefreshCw,
  Copy,
  Eye,
  Trash2,
  Loader2,
  Webhook,
  Send,
  RotateCcw,
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { useTranslations } from 'next-intl';
import { formatDateTime } from '@/lib/utils';

// ─── Types ───────────────────────────────────────────────────────────────────

interface WebhookEndpoint {
  id: string;
  name: string;
  url: string;
  isActive: boolean;
  timeoutMs: number;
  maxRetries: number;
  retryDelayMs: number;
  lastUsedAt: string | null;
  createdAt: string;
  events: Array<{ eventType: string; description: string }>;
  deliveryCount: number;
}

interface WebhookStats {
  totalDeliveries: number;
  successfulDeliveries: number;
  failedDeliveries: number;
  deadLetterDeliveries: number;
  successRate: number;
  period: string;
}

interface WebhookDelivery {
  id: string;
  endpointName: string;
  endpointUrl: string;
  eventType: string;
  eventDescription: string;
  status: string;
  attemptCount: number;
  maxAttempts: number;
  responseStatus: number | null;
  errorMessage: string | null;
  sentAt: string | null;
  completedAt: string | null;
  nextRetryAt: string | null;
  createdAt: string;
}

interface WebhookEventOption {
  eventType: string;
  description: string;
}

// ─── API helpers ─────────────────────────────────────────────────────────────

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

function authHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...authHeaders(), ...options?.headers },
  });
  const json = await res.json().catch(() => ({ status: res.status, message: 'Error de red' }));
  if (!res.ok) throw new Error(json.message || `HTTP ${res.status}`);
  return json as T;
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function WebhooksPage() {
  const [endpoints, setEndpoints] = useState<WebhookEndpoint[]>([]);
  const [stats, setStats] = useState<WebhookStats | null>(null);
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
  const [availableEvents, setAvailableEvents] = useState<WebhookEventOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('endpoints');

  const toastCtx = useToast();
  const toastRef = useRef(toastCtx);
  toastRef.current = toastCtx;

  const t = useTranslations('webhooks');
  const tCommon = useTranslations('common');

  const loadEndpoints = useCallback(async () => {
    try {
      const res = await api<{ data: WebhookEndpoint[] }>('/api/v1/webhooks/endpoints');
      setEndpoints(res.data);
    } catch {
      toastRef.current.error(t('errorLoadingEndpoints'));
    }
  }, [t]);

  const loadStats = useCallback(async () => {
    try {
      const res = await api<{ data: WebhookStats }>('/api/v1/webhooks/stats?days=7');
      setStats(res.data);
    } catch {
      // Stats are optional
    }
  }, []);

  const loadDeliveries = useCallback(async () => {
    try {
      const res = await api<{ data: WebhookDelivery[] }>('/api/v1/webhooks/deliveries?limit=50');
      setDeliveries(res.data);
    } catch {
      toastRef.current.error(t('errorLoadingDeliveries'));
    }
  }, [t]);

  const loadEvents = useCallback(async () => {
    try {
      const res = await api<{ data: WebhookEventOption[] }>('/api/v1/webhooks/events');
      setAvailableEvents(res.data);
    } catch {
      // Events are optional
    }
  }, []);

  useEffect(() => {
    Promise.all([loadEndpoints(), loadStats(), loadDeliveries(), loadEvents()]).finally(() =>
      setLoading(false),
    );
  }, [loadEndpoints, loadStats, loadDeliveries, loadEvents]);

  const toggleEndpoint = async (endpointId: string, currentActive: boolean) => {
    try {
      await api(`/api/v1/webhooks/endpoints/${endpointId}`, {
        method: 'PUT',
        body: JSON.stringify({ isActive: !currentActive }),
      });
      await loadEndpoints();
      toastRef.current.success(!currentActive ? t('endpointActivated') : t('endpointDeactivated'));
    } catch {
      toastRef.current.error(t('errorUpdating'));
    }
  };

  const deleteEndpoint = async (endpointId: string) => {
    try {
      await api(`/api/v1/webhooks/endpoints/${endpointId}`, { method: 'DELETE' });
      await loadEndpoints();
      toastRef.current.success(t('endpointDeleted'));
    } catch {
      toastRef.current.error(t('errorDeleting'));
    }
  };

  const testEndpoint = async (endpointId: string) => {
    try {
      await api(`/api/v1/webhooks/test/${endpointId}`, { method: 'POST' });
      toastRef.current.success(t('testSent'));
      setTimeout(() => loadDeliveries(), 2000);
    } catch {
      toastRef.current.error(t('errorTestSending'));
    }
  };

  const retryDelivery = async (deliveryId: string) => {
    try {
      await api(`/api/v1/webhooks/deliveries/${deliveryId}/retry`, { method: 'POST' });
      toastRef.current.success(t('retryQueued'));
      setTimeout(() => loadDeliveries(), 2000);
    } catch {
      toastRef.current.error(t('errorRetrying'));
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Webhook className="h-8 w-8" />
            {t('title')}
          </h1>
          <p className="text-muted-foreground">{t('subtitle')}</p>
        </div>
        <CreateEndpointDialog
          availableEvents={availableEvents}
          onSuccess={() => { loadEndpoints(); loadStats(); }}
          t={t}
          tCommon={tCommon}
        />
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('totalDeliveries')}</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalDeliveries}</div>
              <p className="text-xs text-muted-foreground">{t('last7days')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('successful')}</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.successfulDeliveries}</div>
              <p className="text-xs text-muted-foreground">{stats.successRate}% {t('successRate')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('failed')}</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.failedDeliveries}</div>
              <p className="text-xs text-muted-foreground">{t('pendingRetries')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('deadLetter')}</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.deadLetterDeliveries}</div>
              <p className="text-xs text-muted-foreground">{t('requireAttention')}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs: Endpoints / Deliveries */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="endpoints">{t('endpointsTab')}</TabsTrigger>
          <TabsTrigger value="deliveries">{t('deliveriesTab')}</TabsTrigger>
        </TabsList>

        <TabsContent value="endpoints">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{t('configuredEndpoints')}</CardTitle>
                <CardDescription>{t('endpointsDescription')}</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => loadEndpoints()}>
                <RefreshCw className="h-4 w-4 mr-1" />
                {tCommon('refresh')}
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{tCommon('name')}</TableHead>
                    <TableHead>URL</TableHead>
                    <TableHead>{tCommon('status')}</TableHead>
                    <TableHead>{t('events')}</TableHead>
                    <TableHead>{t('lastUsed')}</TableHead>
                    <TableHead>{tCommon('actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {endpoints.map((ep) => (
                    <TableRow key={ep.id}>
                      <TableCell className="font-medium">{ep.name}</TableCell>
                      <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                        {ep.url}
                      </TableCell>
                      <TableCell>
                        <StatusBadge isActive={ep.isActive} lastUsedAt={ep.lastUsedAt} t={t} />
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {ep.events.slice(0, 2).map((evt) => (
                            <Badge key={evt.eventType} variant="outline" className="text-xs">
                              {evt.eventType}
                            </Badge>
                          ))}
                          {ep.events.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{ep.events.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {ep.lastUsedAt ? formatDateTime(ep.lastUsedAt) : t('never')}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => testEndpoint(ep.id)}
                            title={t('sendTest')}
                          >
                            <Send className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant={ep.isActive ? 'destructive' : 'default'}
                            onClick={() => toggleEndpoint(ep.id, ep.isActive)}
                          >
                            {ep.isActive ? t('deactivate') : t('activate')}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteEndpoint(ep.id)}
                            title={tCommon('delete')}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {endpoints.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <div className="flex flex-col items-center gap-2">
                          <Webhook className="h-8 w-8 text-muted-foreground" />
                          <p className="text-muted-foreground">{t('noEndpoints')}</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deliveries">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{t('deliveryLog')}</CardTitle>
                <CardDescription>{t('deliveryLogDescription')}</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => loadDeliveries()}>
                <RefreshCw className="h-4 w-4 mr-1" />
                {tCommon('refresh')}
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('event')}</TableHead>
                    <TableHead>{t('endpoint')}</TableHead>
                    <TableHead>{tCommon('status')}</TableHead>
                    <TableHead>{t('attempts')}</TableHead>
                    <TableHead>{t('response')}</TableHead>
                    <TableHead>{tCommon('date')}</TableHead>
                    <TableHead>{tCommon('actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deliveries.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {d.eventType}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{d.endpointName}</TableCell>
                      <TableCell>
                        <DeliveryStatusBadge status={d.status} t={t} />
                      </TableCell>
                      <TableCell className="text-sm">
                        {d.attemptCount}/{d.maxAttempts}
                      </TableCell>
                      <TableCell className="text-sm">
                        {d.responseStatus ? (
                          <span className={d.responseStatus < 300 ? 'text-green-600' : 'text-red-600'}>
                            {d.responseStatus}
                          </span>
                        ) : d.errorMessage ? (
                          <span className="text-red-600 text-xs truncate max-w-[120px] inline-block">
                            {d.errorMessage}
                          </span>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDateTime(d.createdAt)}
                      </TableCell>
                      <TableCell>
                        {(d.status === 'FAILED' || d.status === 'DEAD_LETTER') && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => retryDelivery(d.id)}
                            title={tCommon('retry')}
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {deliveries.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <p className="text-muted-foreground">{t('noDeliveries')}</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatusBadge({
  isActive,
  lastUsedAt,
  t,
}: {
  isActive: boolean;
  lastUsedAt: string | null;
  t: ReturnType<typeof useTranslations>;
}) {
  if (!isActive) {
    return <Badge variant="secondary">{t('inactive')}</Badge>;
  }
  if (!lastUsedAt) {
    return <Badge variant="outline">{t('unused')}</Badge>;
  }
  const daysSince = Math.floor(
    (Date.now() - new Date(lastUsedAt).getTime()) / (1000 * 60 * 60 * 24),
  );
  if (daysSince <= 1) {
    return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">{t('active')}</Badge>;
  }
  if (daysSince <= 7) {
    return <Badge variant="outline" className="border-yellow-300 text-yellow-700 dark:text-yellow-400">{t('lowUsage')}</Badge>;
  }
  return <Badge variant="outline" className="border-red-300 text-red-700 dark:text-red-400">{t('noActivity')}</Badge>;
}

function DeliveryStatusBadge({
  status,
  t,
}: {
  status: string;
  t: ReturnType<typeof useTranslations>;
}) {
  switch (status) {
    case 'DELIVERED':
      return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"><CheckCircle2 className="h-3 w-3 mr-1" />{t('delivered')}</Badge>;
    case 'FAILED':
      return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />{t('failedStatus')}</Badge>;
    case 'DEAD_LETTER':
      return <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400"><AlertTriangle className="h-3 w-3 mr-1" />{t('deadLetterStatus')}</Badge>;
    case 'PENDING':
      return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />{t('pending')}</Badge>;
    case 'SENDING':
      return <Badge variant="outline"><Loader2 className="h-3 w-3 mr-1 animate-spin" />{t('sending')}</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

function CreateEndpointDialog({
  availableEvents,
  onSuccess,
  t,
  tCommon,
}: {
  availableEvents: WebhookEventOption[];
  onSuccess: () => void;
  t: ReturnType<typeof useTranslations>;
  tCommon: ReturnType<typeof useTranslations>;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [createdSecret, setCreatedSecret] = useState<string | null>(null);

  const toastCtx = useToast();
  const toastRef = useRef(toastCtx);
  toastRef.current = toastCtx;

  const toggleEvent = (eventType: string) => {
    setSelectedEvents((prev) =>
      prev.includes(eventType)
        ? prev.filter((e) => e !== eventType)
        : [...prev, eventType],
    );
  };

  const handleCreate = async () => {
    if (!name || !url || selectedEvents.length === 0) {
      toastRef.current.error(t('fillAllFields'));
      return;
    }

    setSaving(true);
    try {
      const res = await api<{ data: { secretKey: string } }>('/api/v1/webhooks/endpoints', {
        method: 'POST',
        body: JSON.stringify({ name, url, events: selectedEvents }),
      });
      setCreatedSecret(res.data.secretKey);
      toastRef.current.success(t('endpointCreated'));
      onSuccess();
    } catch (err) {
      toastRef.current.error(err instanceof Error ? err.message : t('errorCreating'));
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setName('');
    setUrl('');
    setSelectedEvents([]);
    setCreatedSecret(null);
  };

  const copySecret = () => {
    if (createdSecret) {
      navigator.clipboard.writeText(createdSecret);
      toastRef.current.success(t('secretCopied'));
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : handleClose())}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          {t('newEndpoint')}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('createEndpoint')}</DialogTitle>
          <DialogDescription>{t('createEndpointDescription')}</DialogDescription>
        </DialogHeader>

        {createdSecret ? (
          <div className="space-y-4">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <p className="text-sm font-medium text-green-800 dark:text-green-400 mb-2">
                {t('secretKeyWarning')}
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs bg-background p-2 rounded border overflow-x-auto">
                  {createdSecret}
                </code>
                <Button size="sm" variant="outline" onClick={copySecret}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Button onClick={handleClose} className="w-full">
              {tCommon('close')}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <Label>{tCommon('name')}</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('endpointNamePlaceholder')}
              />
            </div>
            <div>
              <Label>URL</Label>
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/api/webhooks"
              />
            </div>
            <div>
              <Label>{t('subscribeEvents')}</Label>
              <div className="mt-2 space-y-2 max-h-48 overflow-y-auto border rounded-lg p-3">
                {availableEvents.map((evt) => (
                  <label
                    key={evt.eventType}
                    className="flex items-start gap-2 cursor-pointer hover:bg-muted/50 rounded p-1"
                  >
                    <Checkbox
                      checked={selectedEvents.includes(evt.eventType)}
                      onCheckedChange={() => toggleEvent(evt.eventType)}
                      className="mt-0.5"
                    />
                    <div>
                      <p className="text-sm font-medium">{evt.eventType}</p>
                      <p className="text-xs text-muted-foreground">{evt.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            <Button onClick={handleCreate} disabled={saving} className="w-full">
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {saving ? tCommon('saving') : tCommon('create')}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
