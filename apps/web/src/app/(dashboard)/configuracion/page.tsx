'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/store';
import { Building2, Key, Upload, CheckCircle, AlertCircle } from 'lucide-react';

export default function ConfiguracionPage() {
  const { tenant, setTenant } = useAppStore();
  const [certificateStatus, setCertificateStatus] = React.useState<'loaded' | 'not_loaded'>('not_loaded');

  const handleSave = () => {
    // Save configuration
    alert('Configuracion guardada');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configuracion</h1>
        <p className="text-muted-foreground">
          Configura los datos de tu empresa y credenciales del MH
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Datos Empresa */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Datos de la Empresa
            </CardTitle>
            <CardDescription>
              Informacion del emisor para los documentos tributarios
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nombre / Razon Social</label>
              <Input
                placeholder="Mi Empresa S.A. de C.V."
                defaultValue={tenant?.nombre || ''}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">NIT</label>
                <Input placeholder="0000-000000-000-0" defaultValue={tenant?.nit || ''} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">NRC</label>
                <Input placeholder="000000-0" defaultValue={tenant?.nrc || ''} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Correo Electronico</label>
              <Input
                type="email"
                placeholder="facturacion@empresa.com"
                defaultValue={tenant?.correo || ''}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Telefono</label>
              <Input placeholder="0000-0000" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Direccion</label>
              <Input placeholder="Direccion completa del establecimiento" />
            </div>
          </CardContent>
        </Card>

        {/* Credenciales MH */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Credenciales del MH
            </CardTitle>
            <CardDescription>
              Credenciales para autenticacion con el Ministerio de Hacienda
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">NIT (Usuario)</label>
              <Input placeholder="0000000000000" />
              <p className="text-xs text-muted-foreground">NIT sin guiones</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Password Privado</label>
              <Input type="password" placeholder="********" />
              <p className="text-xs text-muted-foreground">
                Contraseña proporcionada por el MH
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Ambiente</label>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1">
                  Pruebas
                </Button>
                <Button variant="default" className="flex-1">
                  Produccion
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Certificado Digital */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Certificado Digital
            </CardTitle>
            <CardDescription>
              Certificado .p12 para firma de documentos electronicos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-4">
                {certificateStatus === 'loaded' ? (
                  <>
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                      <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="font-medium">Certificado cargado</p>
                      <p className="text-sm text-muted-foreground">
                        certificado.p12 - Valido hasta: 31/12/2025
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900">
                      <AlertCircle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <div>
                      <p className="font-medium">Sin certificado</p>
                      <p className="text-sm text-muted-foreground">
                        Sube tu certificado .p12 para poder firmar documentos
                      </p>
                    </div>
                  </>
                )}
              </div>
              <div className="flex gap-2">
                <Input
                  type="file"
                  accept=".p12,.pfx"
                  className="hidden"
                  id="certificate-upload"
                  onChange={() => setCertificateStatus('loaded')}
                />
                <label htmlFor="certificate-upload">
                  <Button variant="outline" asChild>
                    <span>
                      <Upload className="mr-2 h-4 w-4" />
                      Subir Certificado
                    </span>
                  </Button>
                </label>
              </div>
            </div>
            {certificateStatus === 'not_loaded' && (
              <div className="mt-4 space-y-2">
                <label className="text-sm font-medium">Contraseña del Certificado</label>
                <Input type="password" placeholder="********" />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button size="lg" onClick={handleSave}>
          Guardar Configuracion
        </Button>
      </div>
    </div>
  );
}
