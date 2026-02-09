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
exports.DteTypeCard = DteTypeCard;
const React = __importStar(require("react"));
const lucide_react_1 = require("lucide-react");
const button_1 = require("@/components/ui/button");
const card_1 = require("@/components/ui/card");
const progress_1 = require("@/components/ui/progress");
const badge_1 = require("@/components/ui/badge");
function DteTypeCard({ progress, onExecuteTest }) {
    const totalRequired = progress.emissionRequired + progress.cancellationRequired;
    const totalCompleted = progress.emissionCompleted + progress.cancellationCompleted;
    const percentComplete = Math.round((totalCompleted / totalRequired) * 100);
    const emissionComplete = progress.emissionCompleted >= progress.emissionRequired;
    const cancellationComplete = progress.cancellationCompleted >= progress.cancellationRequired;
    const canCancelTest = progress.emissionCompleted > progress.cancellationCompleted;
    return (<card_1.Card className={progress.isComplete ? 'border-emerald-500/30 bg-emerald-500/5' : ''}>
      <card_1.CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <card_1.CardTitle className="text-base flex items-center gap-2">
            {progress.isComplete ? (<lucide_react_1.CheckCircle2 className="h-5 w-5 text-emerald-600"/>) : (<lucide_react_1.PlayCircle className="h-5 w-5 text-amber-600"/>)}
            {progress.dteName}
          </card_1.CardTitle>
          <badge_1.Badge variant="outline" className="text-xs">
            {progress.dteType}
          </badge_1.Badge>
        </div>
      </card_1.CardHeader>
      <card_1.CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progreso</span>
            <span className="font-medium">{percentComplete}%</span>
          </div>
          <progress_1.Progress value={percentComplete} className="h-2"/>
        </div>

        {/* Emission Progress */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <lucide_react_1.Send className={`h-4 w-4 ${emissionComplete ? 'text-emerald-600' : 'text-muted-foreground'}`}/>
            <span className="text-sm">Emisiones</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              {progress.emissionCompleted} / {progress.emissionRequired}
            </span>
            {emissionComplete ? (<lucide_react_1.CheckCircle2 className="h-4 w-4 text-emerald-600"/>) : (<button_1.Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => onExecuteTest(progress.dteType, 'EMISSION')}>
                <lucide_react_1.PlayCircle className="h-3 w-3 mr-1"/>
                Ejecutar
              </button_1.Button>)}
          </div>
        </div>

        {/* Cancellation Progress */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <lucide_react_1.Ban className={`h-4 w-4 ${cancellationComplete ? 'text-emerald-600' : 'text-muted-foreground'}`}/>
            <span className="text-sm">Anulaciones</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              {progress.cancellationCompleted} / {progress.cancellationRequired}
            </span>
            {cancellationComplete ? (<lucide_react_1.CheckCircle2 className="h-4 w-4 text-emerald-600"/>) : canCancelTest ? (<button_1.Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => onExecuteTest(progress.dteType, 'CANCELLATION')}>
                <lucide_react_1.PlayCircle className="h-3 w-3 mr-1"/>
                Ejecutar
              </button_1.Button>) : (<span className="text-xs text-muted-foreground">
                Requiere emisión
              </span>)}
          </div>
        </div>

        {/* Status Badge */}
        {progress.isComplete && (<badge_1.Badge className="w-full justify-center bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
            <lucide_react_1.CheckCircle2 className="h-3 w-3 mr-1"/>
            Completado
          </badge_1.Badge>)}
      </card_1.CardContent>
    </card_1.Card>);
}
