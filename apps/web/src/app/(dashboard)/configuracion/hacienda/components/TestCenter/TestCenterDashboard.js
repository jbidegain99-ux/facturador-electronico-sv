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
exports.TestCenterDashboard = TestCenterDashboard;
const React = __importStar(require("react"));
const lucide_react_1 = require("lucide-react");
const button_1 = require("@/components/ui/button");
const card_1 = require("@/components/ui/card");
const progress_1 = require("@/components/ui/progress");
const badge_1 = require("@/components/ui/badge");
const DteTypeCard_1 = require("./DteTypeCard");
const TestExecutor_1 = require("./TestExecutor");
const TestHistoryTable_1 = require("./TestHistoryTable");
function TestCenterDashboard({ progress, onTestExecuted, }) {
    const [selectedDteType, setSelectedDteType] = React.useState(null);
    const [selectedTestType, setSelectedTestType] = React.useState(null);
    const [showHistory, setShowHistory] = React.useState(false);
    const handleExecuteTest = (dteType, testType) => {
        setSelectedDteType(dteType);
        setSelectedTestType(testType);
    };
    const handleTestComplete = () => {
        setSelectedDteType(null);
        setSelectedTestType(null);
        onTestExecuted();
    };
    if (!progress) {
        return (<card_1.Card className="border-dashed">
        <card_1.CardContent className="flex flex-col items-center justify-center py-12">
          <lucide_react_1.AlertTriangle className="h-12 w-12 text-muted-foreground mb-4"/>
          <p className="text-center text-muted-foreground max-w-md">
            Configure el ambiente de pruebas antes de ejecutar las pruebas de acreditación
          </p>
        </card_1.CardContent>
      </card_1.Card>);
    }
    return (<div className="space-y-6">
      {/* Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <card_1.Card>
          <card_1.CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Progreso Total</p>
                <p className="text-2xl font-bold">{progress.percentComplete}%</p>
              </div>
              <lucide_react_1.TrendingUp className="h-8 w-8 text-primary"/>
            </div>
            <progress_1.Progress value={progress.percentComplete} className="mt-3"/>
          </card_1.CardContent>
        </card_1.Card>

        <card_1.Card>
          <card_1.CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pruebas Completadas</p>
                <p className="text-2xl font-bold">
                  {progress.totalCompleted} / {progress.totalRequired}
                </p>
              </div>
              <lucide_react_1.CheckCircle2 className="h-8 w-8 text-emerald-600"/>
            </div>
          </card_1.CardContent>
        </card_1.Card>

        <card_1.Card>
          <card_1.CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Días Restantes</p>
                <p className="text-2xl font-bold">
                  {progress.daysRemaining !== undefined ? progress.daysRemaining : '--'}
                </p>
              </div>
              <lucide_react_1.Clock className="h-8 w-8 text-amber-600"/>
            </div>
          </card_1.CardContent>
        </card_1.Card>

        <card_1.Card>
          <card_1.CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Estado</p>
                <badge_1.Badge className={progress.canRequestAuthorization
            ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
            : 'bg-amber-500/10 text-amber-600 border-amber-500/20'}>
                  {progress.canRequestAuthorization
            ? 'Listo para autorización'
            : 'En progreso'}
                </badge_1.Badge>
              </div>
              <lucide_react_1.Award className="h-8 w-8 text-primary"/>
            </div>
          </card_1.CardContent>
        </card_1.Card>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Tipos de DTE</h2>
        <div className="flex items-center gap-2">
          <button_1.Button variant="outline" size="sm" onClick={() => setShowHistory(!showHistory)}>
            <lucide_react_1.FileText className="h-4 w-4 mr-2"/>
            {showHistory ? 'Ver progreso' : 'Ver historial'}
          </button_1.Button>
          {progress.canRequestAuthorization && (<button_1.Button size="sm">
              <lucide_react_1.Award className="h-4 w-4 mr-2"/>
              Solicitar autorización
            </button_1.Button>)}
        </div>
      </div>

      {/* Main Content */}
      {showHistory ? (<TestHistoryTable_1.TestHistoryTable />) : (<>
          {/* DTE Type Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {progress.progress.map((item) => (<DteTypeCard_1.DteTypeCard key={item.dteType} progress={item} onExecuteTest={handleExecuteTest}/>))}
          </div>

          {/* Test Executor Modal */}
          {selectedDteType && selectedTestType && (<TestExecutor_1.TestExecutor dteType={selectedDteType} testType={selectedTestType} onClose={() => {
                    setSelectedDteType(null);
                    setSelectedTestType(null);
                }} onComplete={handleTestComplete}/>)}

          {/* Requirements Info */}
          <card_1.Card className="bg-muted/50">
            <card_1.CardHeader>
              <card_1.CardTitle className="text-base">Requisitos de Acreditación</card_1.CardTitle>
              <card_1.CardDescription>
                Hacienda requiere un mínimo de pruebas exitosas para cada tipo de DTE
              </card_1.CardDescription>
            </card_1.CardHeader>
            <card_1.CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 text-sm">
                <div className="text-center">
                  <p className="font-medium">Factura</p>
                  <p className="text-muted-foreground">5 emisiones + 1 anulación</p>
                </div>
                <div className="text-center">
                  <p className="font-medium">CCF</p>
                  <p className="text-muted-foreground">5 emisiones + 1 anulación</p>
                </div>
                <div className="text-center">
                  <p className="font-medium">N. Remisión</p>
                  <p className="text-muted-foreground">3 emisiones + 1 anulación</p>
                </div>
                <div className="text-center">
                  <p className="font-medium">N. Crédito</p>
                  <p className="text-muted-foreground">2 emisiones + 1 anulación</p>
                </div>
                <div className="text-center">
                  <p className="font-medium">N. Débito</p>
                  <p className="text-muted-foreground">2 emisiones + 1 anulación</p>
                </div>
                <div className="text-center">
                  <p className="font-medium">F. Exportación</p>
                  <p className="text-muted-foreground">3 emisiones + 1 anulación</p>
                </div>
                <div className="text-center">
                  <p className="font-medium">F. S. Excluido</p>
                  <p className="text-muted-foreground">3 emisiones + 1 anulación</p>
                </div>
              </div>
            </card_1.CardContent>
          </card_1.Card>
        </>)}
    </div>);
}
