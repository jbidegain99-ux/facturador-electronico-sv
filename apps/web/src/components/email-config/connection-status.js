'use client';
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConnectionStatus = ConnectionStatus;
exports.StatusBadge = StatusBadge;
const React = __importStar(require("react"));
const utils_1 = require("@/lib/utils");
const lucide_react_1 = require("lucide-react");
const button_1 = require("@/components/ui/button");
const card_1 = require("@/components/ui/card");
function ConnectionStatus({ config, onTestConnection, onSendTest, loading = false, }) {
    const [testing, setTesting] = React.useState(false);
    const [testResult, setTestResult] = React.useState(null);
    const [sendingTest, setSendingTest] = React.useState(false);
    const [testEmail, setTestEmail] = React.useState('');
    const [showTestForm, setShowTestForm] = React.useState(false);
    const handleTestConnection = async () => {
        setTesting(true);
        setTestResult(null);
        try {
            const result = await onTestConnection();
            setTestResult(result);
        }
        catch (error) {
            setTestResult({
                success: false,
                responseTimeMs: 0,
                message: error instanceof Error ? error.message : 'Error desconocido',
            });
        }
        finally {
            setTesting(false);
        }
    };
    const handleSendTest = async () => {
        if (!testEmail)
            return;
        setSendingTest(true);
        try {
            await onSendTest(testEmail);
            setShowTestForm(false);
            setTestEmail('');
        }
        finally {
            setSendingTest(false);
        }
    };
    if (!config) {
        return (<card_1.Card>
        <card_1.CardHeader>
          <card_1.CardTitle className="flex items-center gap-2">
            <lucide_react_1.Activity className="h-5 w-5"/>
            Estado de Conexión
          </card_1.CardTitle>
        </card_1.CardHeader>
        <card_1.CardContent>
          <div className="flex items-center gap-3 p-4 rounded-lg bg-muted">
            <lucide_react_1.AlertCircle className="h-5 w-5 text-muted-foreground"/>
            <p className="text-sm text-muted-foreground">
              No hay configuración de email. Configure un proveedor para comenzar.
            </p>
          </div>
        </card_1.CardContent>
      </card_1.Card>);
    }
    return (<card_1.Card>
      <card_1.CardHeader>
        <card_1.CardTitle className="flex items-center gap-2">
          <lucide_react_1.Activity className="h-5 w-5"/>
          Estado de Conexión
        </card_1.CardTitle>
        <card_1.CardDescription>
          Verifique que su configuración está funcionando correctamente
        </card_1.CardDescription>
      </card_1.CardHeader>
      <card_1.CardContent className="space-y-4">
        {/* Current status */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
          <div className="flex items-center gap-3">
            <StatusIcon isActive={config.isActive} isVerified={config.isVerified}/>
            <div>
              <p className="font-medium">
                {getStatusText(config.isActive, config.isVerified)}
              </p>
              <p className="text-sm text-muted-foreground">
                Proveedor: {config.provider.replace('_', ' ')}
              </p>
            </div>
          </div>

          {config.lastTestAt && (<div className="text-right text-sm text-muted-foreground">
              <p>Última prueba:</p>
              <p>{new Date(config.lastTestAt).toLocaleString('es-SV')}</p>
            </div>)}
        </div>

        {/* Test result */}
        {testResult && (<div className={(0, utils_1.cn)('p-4 rounded-lg border', testResult.success
                ? 'bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-400'
                : 'bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-400')}>
            <div className="flex items-start gap-3">
              {testResult.success ? (<lucide_react_1.CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5"/>) : (<lucide_react_1.XCircle className="h-5 w-5 shrink-0 mt-0.5"/>)}
              <div>
                <p className="font-medium">{testResult.message}</p>
                {testResult.responseTimeMs > 0 && (<p className="text-sm opacity-80">
                    Tiempo de respuesta: {testResult.responseTimeMs}ms
                  </p>)}
              </div>
            </div>
          </div>)}

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          <button_1.Button variant="outline" onClick={handleTestConnection} disabled={loading || testing}>
            <lucide_react_1.RefreshCw className={(0, utils_1.cn)('h-4 w-4 mr-2', testing && 'animate-spin')}/>
            {testing ? 'Probando...' : 'Probar Conexión'}
          </button_1.Button>

          <button_1.Button variant="outline" onClick={() => setShowTestForm(!showTestForm)} disabled={loading || !config.isVerified}>
            <lucide_react_1.Send className="h-4 w-4 mr-2"/>
            Enviar Correo de Prueba
          </button_1.Button>
        </div>

        {/* Test email form */}
        {showTestForm && (<div className="p-4 rounded-lg bg-muted space-y-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Email de destino
              </label>
              <input type="email" placeholder="prueba@ejemplo.com" value={testEmail} onChange={(e) => setTestEmail(e.target.value)} className="w-full px-3 py-2 rounded-md border bg-background"/>
            </div>
            <div className="flex gap-2">
              <button_1.Button size="sm" onClick={handleSendTest} disabled={!testEmail || sendingTest}>
                {sendingTest ? 'Enviando...' : 'Enviar'}
              </button_1.Button>
              <button_1.Button size="sm" variant="ghost" onClick={() => setShowTestForm(false)}>
                Cancelar
              </button_1.Button>
            </div>
          </div>)}

        {/* Verification status */}
        {config.isVerified && config.verifiedAt && (<p className="text-sm text-muted-foreground flex items-center gap-2">
            <lucide_react_1.CheckCircle2 className="h-4 w-4 text-green-500"/>
            Verificado el {new Date(config.verifiedAt).toLocaleDateString('es-SV')}
          </p>)}
      </card_1.CardContent>
    </card_1.Card>);
}
function StatusIcon({ isActive, isVerified }) {
    if (!isVerified) {
        return (<div className="p-2 rounded-full bg-amber-500/20">
        <lucide_react_1.Clock className="h-5 w-5 text-amber-500"/>
      </div>);
    }
    if (isActive) {
        return (<div className="p-2 rounded-full bg-green-500/20">
        <lucide_react_1.CheckCircle2 className="h-5 w-5 text-green-500"/>
      </div>);
    }
    return (<div className="p-2 rounded-full bg-muted">
      <lucide_react_1.AlertCircle className="h-5 w-5 text-muted-foreground"/>
    </div>);
}
function getStatusText(isActive, isVerified) {
    if (!isVerified) {
        return 'Pendiente de verificación';
    }
    if (isActive) {
        return 'Activo y funcionando';
    }
    return 'Verificado pero inactivo';
}
// Compact status badge for use in headers
function StatusBadge({ config }) {
    if (!config) {
        return (<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
        <span className="w-2 h-2 rounded-full bg-muted-foreground"/>
        No configurado
      </span>);
    }
    if (!config.isVerified) {
        return (<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/20 text-amber-600 dark:text-amber-400">
        <span className="w-2 h-2 rounded-full bg-amber-500"/>
        Pendiente
      </span>);
    }
    if (config.isActive) {
        return (<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-600 dark:text-green-400">
        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"/>
        Activo
      </span>);
    }
    return (<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
      <span className="w-2 h-2 rounded-full bg-muted-foreground"/>
      Inactivo
    </span>);
}
