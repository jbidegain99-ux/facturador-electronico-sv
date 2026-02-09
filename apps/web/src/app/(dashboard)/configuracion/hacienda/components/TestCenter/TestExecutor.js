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
exports.TestExecutor = TestExecutor;
const React = __importStar(require("react"));
const lucide_react_1 = require("lucide-react");
const button_1 = require("@/components/ui/button");
const dialog_1 = require("@/components/ui/dialog");
const select_1 = require("@/components/ui/select");
const alert_1 = require("@/components/ui/alert");
const label_1 = require("@/components/ui/label");
const scroll_area_1 = require("@/components/ui/scroll-area");
const toast_1 = require("@/components/ui/toast");
const types_1 = require("../../types");
function TestExecutor({ dteType, testType, onClose, onComplete, }) {
    const toast = (0, toast_1.useToast)();
    const [executing, setExecuting] = React.useState(false);
    const [result, setResult] = React.useState(null);
    const [testData, setTestData] = React.useState(null);
    const [loadingData, setLoadingData] = React.useState(true);
    const [successfulEmissions, setSuccessfulEmissions] = React.useState([]);
    const [selectedEmission, setSelectedEmission] = React.useState('');
    const [loadingEmissions, setLoadingEmissions] = React.useState(testType === 'CANCELLATION');
    const dteName = types_1.DTE_TYPES[dteType];
    const testTypeName = testType === 'EMISSION' ? 'Emisión' : 'Anulación';
    // Load test data preview
    React.useEffect(() => {
        if (testType === 'EMISSION') {
            loadTestData();
        }
        else {
            setLoadingData(false);
        }
    }, [testType]);
    // Load successful emissions for cancellation
    React.useEffect(() => {
        if (testType === 'CANCELLATION') {
            loadSuccessfulEmissions();
        }
    }, [testType, dteType]);
    const loadTestData = async () => {
        setLoadingData(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/hacienda/tests/generate-data`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ dteType }),
            });
            if (res.ok) {
                const data = await res.json();
                setTestData(data);
            }
        }
        catch (error) {
            console.error('Error loading test data:', error);
        }
        finally {
            setLoadingData(false);
        }
    };
    const loadSuccessfulEmissions = async () => {
        setLoadingEmissions(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/hacienda/tests/successful-emissions?dteType=${dteType}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            if (res.ok) {
                const data = await res.json();
                setSuccessfulEmissions(data);
                if (data.length > 0) {
                    setSelectedEmission(data[0].codigoGeneracion);
                }
            }
        }
        catch (error) {
            console.error('Error loading emissions:', error);
        }
        finally {
            setLoadingEmissions(false);
        }
    };
    const executeTest = async () => {
        setExecuting(true);
        setResult(null);
        try {
            const token = localStorage.getItem('token');
            const body = {
                dteType,
                testType,
            };
            if (testType === 'CANCELLATION' && selectedEmission) {
                body.codigoGeneracionToCancel = selectedEmission;
            }
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/hacienda/tests/execute`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (res.ok) {
                setResult(data);
                if (data.success) {
                    toast.success('Prueba ejecutada exitosamente');
                }
                else {
                    toast.error(data.testRecord.errorMessage || 'La prueba falló');
                }
            }
            else {
                throw new Error(data.message || 'Error al ejecutar prueba');
            }
        }
        catch (error) {
            toast.error(error instanceof Error ? error.message : 'Error al ejecutar prueba');
        }
        finally {
            setExecuting(false);
        }
    };
    const handleClose = () => {
        if (result?.success) {
            onComplete();
        }
        onClose();
    };
    return (<dialog_1.Dialog open={true} onOpenChange={handleClose}>
      <dialog_1.DialogContent className="max-w-2xl">
        <dialog_1.DialogHeader>
          <dialog_1.DialogTitle className="flex items-center gap-2">
            {testType === 'EMISSION' ? (<lucide_react_1.Send className="h-5 w-5 text-primary"/>) : (<lucide_react_1.Ban className="h-5 w-5 text-amber-600"/>)}
            Prueba de {testTypeName} - {dteName}
          </dialog_1.DialogTitle>
          <dialog_1.DialogDescription>
            {testType === 'EMISSION'
            ? 'Se generará y enviará un DTE de prueba al Ministerio de Hacienda'
            : 'Seleccione un DTE emitido exitosamente para anular'}
          </dialog_1.DialogDescription>
        </dialog_1.DialogHeader>

        <div className="space-y-4 py-4">
          {/* Cancellation: Select DTE to cancel */}
          {testType === 'CANCELLATION' && (<div className="space-y-2">
              <label_1.Label>DTE a anular</label_1.Label>
              {loadingEmissions ? (<div className="flex items-center gap-2 text-muted-foreground">
                  <lucide_react_1.Loader2 className="h-4 w-4 animate-spin"/>
                  Cargando emisiones...
                </div>) : successfulEmissions.length === 0 ? (<alert_1.Alert>
                  <alert_1.AlertDescription>
                    No hay DTEs disponibles para anular. Primero ejecute una prueba de emisión.
                  </alert_1.AlertDescription>
                </alert_1.Alert>) : (<select_1.Select value={selectedEmission} onValueChange={setSelectedEmission}>
                  <select_1.SelectTrigger>
                    <select_1.SelectValue placeholder="Seleccione un DTE"/>
                  </select_1.SelectTrigger>
                  <select_1.SelectContent>
                    {successfulEmissions.map((emission) => (<select_1.SelectItem key={emission.id} value={emission.codigoGeneracion || ''}>
                        {emission.codigoGeneracion} -{' '}
                        {new Date(emission.executedAt).toLocaleString()}
                      </select_1.SelectItem>))}
                  </select_1.SelectContent>
                </select_1.Select>)}
            </div>)}

          {/* Emission: Show test data preview */}
          {testType === 'EMISSION' && (<div className="space-y-2">
              <label_1.Label>Vista previa de datos de prueba</label_1.Label>
              {loadingData ? (<div className="flex items-center gap-2 text-muted-foreground">
                  <lucide_react_1.Loader2 className="h-4 w-4 animate-spin"/>
                  Generando datos...
                </div>) : testData ? (<scroll_area_1.ScrollArea className="h-48 rounded-md border bg-muted/50 p-3">
                  <pre className="text-xs">
                    {JSON.stringify(testData, null, 2)}
                  </pre>
                </scroll_area_1.ScrollArea>) : (<alert_1.Alert>
                  <alert_1.AlertDescription>
                    No se pudo cargar la vista previa de datos
                  </alert_1.AlertDescription>
                </alert_1.Alert>)}
            </div>)}

          {/* Result */}
          {result && (<div className="space-y-3">
              <label_1.Label>Resultado de la prueba</label_1.Label>
              <alert_1.Alert className={result.success
                ? 'bg-emerald-500/10 border-emerald-500/20'
                : 'bg-red-500/10 border-red-500/20'}>
                <div className="flex items-start gap-3">
                  {result.success ? (<lucide_react_1.CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5"/>) : (<lucide_react_1.XCircle className="h-5 w-5 text-red-600 mt-0.5"/>)}
                  <div className="space-y-1">
                    <p className="font-medium">
                      {result.success ? 'Prueba exitosa' : 'Prueba fallida'}
                    </p>
                    {result.testRecord.codigoGeneracion && (<p className="text-sm text-muted-foreground">
                        Código: {result.testRecord.codigoGeneracion}
                      </p>)}
                    {result.testRecord.selloRecibido && (<p className="text-sm text-muted-foreground">
                        Sello: {result.testRecord.selloRecibido}
                      </p>)}
                    {result.testRecord.errorMessage && (<p className="text-sm text-red-600">
                        Error: {result.testRecord.errorMessage}
                      </p>)}
                  </div>
                </div>
              </alert_1.Alert>

              {/* Updated progress */}
              <div className="text-sm text-muted-foreground">
                Progreso actualizado: {result.progress.totalCompleted} de{' '}
                {result.progress.totalRequired} pruebas completadas (
                {result.progress.percentComplete}%)
              </div>
            </div>)}
        </div>

        <dialog_1.DialogFooter>
          <button_1.Button variant="outline" onClick={handleClose}>
            {result ? 'Cerrar' : 'Cancelar'}
          </button_1.Button>
          {!result && (<button_1.Button onClick={executeTest} disabled={executing ||
                (testType === 'CANCELLATION' && !selectedEmission)}>
              {executing ? (<>
                  <lucide_react_1.Loader2 className="h-4 w-4 mr-2 animate-spin"/>
                  Ejecutando...
                </>) : (<>
                  <lucide_react_1.Send className="h-4 w-4 mr-2"/>
                  Ejecutar prueba
                </>)}
            </button_1.Button>)}
        </dialog_1.DialogFooter>
      </dialog_1.DialogContent>
    </dialog_1.Dialog>);
}
