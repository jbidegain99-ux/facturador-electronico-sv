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
exports.ExecuteTestsStep = ExecuteTestsStep;
const React = __importStar(require("react"));
const button_1 = require("@/components/ui/button");
const progress_1 = require("@/components/ui/progress");
const card_1 = require("@/components/ui/card");
const badge_1 = require("@/components/ui/badge");
const lucide_react_1 = require("lucide-react");
const alert_1 = require("@/components/ui/alert");
function ExecuteTestsStep({ testProgress, onExecuteTest, onExecuteEventTest, onRefresh, onNext, onBack, loading, executingTest, }) {
    const [runningTest, setRunningTest] = React.useState(null);
    const handleRunTest = async (dteType) => {
        setRunningTest(dteType);
        try {
            await onExecuteTest(dteType);
        }
        finally {
            setRunningTest(null);
        }
    };
    const handleRunEventTest = async (eventType) => {
        setRunningTest(eventType);
        try {
            await onExecuteEventTest(eventType);
        }
        finally {
            setRunningTest(null);
        }
    };
    if (!testProgress?.initialized) {
        return (<div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-lg bg-primary/10">
            <lucide_react_1.PlayCircle className="h-6 w-6 text-primary"/>
          </div>
          <div>
            <h2 className="text-2xl font-bold">Ejecutar Pruebas</h2>
            <p className="text-muted-foreground">
              Debe configurar los tipos de DTE primero
            </p>
          </div>
        </div>

        <alert_1.Alert>
          <lucide_react_1.Clock className="h-4 w-4"/>
          <alert_1.AlertDescription>
            Complete los pasos anteriores para habilitar las pruebas técnicas.
          </alert_1.AlertDescription>
        </alert_1.Alert>

        <div className="flex justify-between pt-4">
          <button_1.Button variant="outline" onClick={onBack}>
            <lucide_react_1.ArrowLeft className="mr-2 h-4 w-4"/>
            Anterior
          </button_1.Button>
        </div>
      </div>);
    }
    const canProceed = testProgress.canRequestAuthorization;
    return (<div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-lg bg-primary/10">
            <lucide_react_1.PlayCircle className="h-6 w-6 text-primary"/>
          </div>
          <div>
            <h2 className="text-2xl font-bold">Ejecutar Pruebas</h2>
            <p className="text-muted-foreground">
              Realice las pruebas técnicas requeridas
            </p>
          </div>
        </div>
        <button_1.Button variant="outline" size="sm" onClick={onRefresh}>
          <lucide_react_1.RefreshCw className="h-4 w-4 mr-2"/>
          Actualizar
        </button_1.Button>
      </div>

      {/* Overall progress */}
      <card_1.Card>
        <card_1.CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Progreso General</p>
                <p className="text-sm text-muted-foreground">
                  {testProgress.totalTestsCompleted} de{' '}
                  {testProgress.totalTestsRequired} pruebas completadas
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-primary">
                  {testProgress.percentComplete}%
                </p>
              </div>
            </div>
            <progress_1.Progress value={testProgress.percentComplete} className="h-3"/>
          </div>
        </card_1.CardContent>
      </card_1.Card>

      {/* DTE Tests */}
      <card_1.Card>
        <card_1.CardHeader>
          <card_1.CardTitle>Pruebas de Documentos</card_1.CardTitle>
          <card_1.CardDescription>
            Ejecute las pruebas para cada tipo de DTE seleccionado
          </card_1.CardDescription>
        </card_1.CardHeader>
        <card_1.CardContent>
          <div className="space-y-4">
            {testProgress.dteProgress.map((dte) => (<div key={dte.dteType} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  {dte.isComplete ? (<lucide_react_1.CheckCircle2 className="h-5 w-5 text-green-500"/>) : (<div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30"/>)}
                  <div>
                    <p className="font-medium">{dte.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {dte.completed} de {dte.required} pruebas
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <progress_1.Progress value={(dte.completed / dte.required) * 100} className="w-24 h-2"/>
                  {dte.isComplete ? (<badge_1.Badge variant="default" className="bg-green-500">
                      Completado
                    </badge_1.Badge>) : (<button_1.Button size="sm" onClick={() => handleRunTest(dte.dteType)} disabled={executingTest || runningTest !== null}>
                      {runningTest === dte.dteType ? (<>
                          <lucide_react_1.Loader2 className="h-4 w-4 mr-1 animate-spin"/>
                          Ejecutando...
                        </>) : (<>
                          <lucide_react_1.PlayCircle className="h-4 w-4 mr-1"/>
                          Ejecutar
                        </>)}
                    </button_1.Button>)}
                </div>
              </div>))}
          </div>
        </card_1.CardContent>
      </card_1.Card>

      {/* Event Tests */}
      <card_1.Card>
        <card_1.CardHeader>
          <card_1.CardTitle>Pruebas de Eventos</card_1.CardTitle>
          <card_1.CardDescription>
            Ejecute las pruebas de eventos especiales
          </card_1.CardDescription>
        </card_1.CardHeader>
        <card_1.CardContent>
          <div className="space-y-4">
            {testProgress.eventProgress.map((event) => (<div key={event.eventType} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  {event.isComplete ? (<lucide_react_1.CheckCircle2 className="h-5 w-5 text-green-500"/>) : (<div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30"/>)}
                  <div>
                    <p className="font-medium">{event.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {event.completed} de {event.required} pruebas
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <progress_1.Progress value={(event.completed / event.required) * 100} className="w-24 h-2"/>
                  {event.isComplete ? (<badge_1.Badge variant="default" className="bg-green-500">
                      Completado
                    </badge_1.Badge>) : (<button_1.Button size="sm" onClick={() => handleRunEventTest(event.eventType)} disabled={executingTest || runningTest !== null}>
                      {runningTest === event.eventType ? (<>
                          <lucide_react_1.Loader2 className="h-4 w-4 mr-1 animate-spin"/>
                          Ejecutando...
                        </>) : (<>
                          <lucide_react_1.PlayCircle className="h-4 w-4 mr-1"/>
                          Ejecutar
                        </>)}
                    </button_1.Button>)}
                </div>
              </div>))}
          </div>
        </card_1.CardContent>
      </card_1.Card>

      {/* Last test result */}
      {testProgress.lastTestAt && (<alert_1.Alert className={testProgress.lastTestResult === 'SUCCESS'
                ? 'border-green-500 bg-green-500/10'
                : 'border-red-500 bg-red-500/10'}>
          {testProgress.lastTestResult === 'SUCCESS' ? (<lucide_react_1.CheckCircle2 className="h-4 w-4 text-green-500"/>) : (<lucide_react_1.XCircle className="h-4 w-4 text-red-500"/>)}
          <alert_1.AlertDescription>
            <span className={testProgress.lastTestResult === 'SUCCESS'
                ? 'text-green-700 dark:text-green-400'
                : 'text-red-700 dark:text-red-400'}>
              Última prueba:{' '}
              {testProgress.lastTestResult === 'SUCCESS' ? 'Exitosa' : 'Fallida'}{' '}
              ({new Date(testProgress.lastTestAt).toLocaleTimeString()})
            </span>
          </alert_1.AlertDescription>
        </alert_1.Alert>)}

      {/* Actions */}
      <div className="flex justify-between pt-4">
        <button_1.Button variant="outline" onClick={onBack}>
          <lucide_react_1.ArrowLeft className="mr-2 h-4 w-4"/>
          Anterior
        </button_1.Button>
        <button_1.Button onClick={onNext} disabled={!canProceed || loading}>
          {loading ? (<>
              <lucide_react_1.Loader2 className="mr-2 h-4 w-4 animate-spin"/>
              Procesando...
            </>) : (<>
              Continuar
              <lucide_react_1.ArrowRight className="ml-2 h-4 w-4"/>
            </>)}
        </button_1.Button>
      </div>

      {!canProceed && (<p className="text-center text-sm text-muted-foreground">
          Complete todas las pruebas requeridas para continuar
        </p>)}
    </div>);
}
