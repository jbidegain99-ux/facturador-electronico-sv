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
exports.WizardStepper = WizardStepper;
exports.WizardStepperCompact = WizardStepperCompact;
const React = __importStar(require("react"));
const utils_1 = require("@/lib/utils");
const lucide_react_1 = require("lucide-react");
const STEP_ICONS = {
    WELCOME: lucide_react_1.HandMetal,
    COMPANY_INFO: lucide_react_1.Building2,
    HACIENDA_CREDENTIALS: lucide_react_1.Key,
    DTE_TYPE_SELECTION: lucide_react_1.FileText,
    TEST_ENVIRONMENT_REQUEST: lucide_react_1.FlaskConical,
    TEST_CERTIFICATE: lucide_react_1.ShieldCheck,
    API_CREDENTIALS_TEST: lucide_react_1.KeyRound,
    EXECUTE_TESTS: lucide_react_1.PlayCircle,
    REQUEST_AUTHORIZATION: lucide_react_1.Send,
    PROD_CERTIFICATE: lucide_react_1.ShieldCheck,
    API_CREDENTIALS_PROD: lucide_react_1.KeyRound,
    FINAL_VALIDATION: lucide_react_1.CheckCircle2,
    COMPLETED: lucide_react_1.PartyPopper,
};
function WizardStepper({ steps, currentStep, onStepClick, }) {
    return (<nav aria-label="Progress" className="w-full">
      <ol className="flex flex-col gap-2">
        {steps.map((step, index) => {
            const Icon = STEP_ICONS[step.step];
            const isCompleted = step.status === 'COMPLETED';
            const isCurrent = step.isCurrentStep;
            const isBlocked = step.status === 'BLOCKED';
            const canNavigate = step.canNavigateTo && onStepClick;
            return (<li key={step.step}>
              <button onClick={() => canNavigate && onStepClick(step.step)} disabled={!canNavigate} className={(0, utils_1.cn)('flex items-center gap-3 w-full p-3 rounded-lg transition-all text-left', isCurrent && 'bg-primary/10 border border-primary', isCompleted && !isCurrent && 'bg-green-500/10', isBlocked && 'bg-red-500/10', canNavigate && 'hover:bg-muted cursor-pointer', !canNavigate && !isCurrent && 'opacity-60')}>
                {/* Step indicator */}
                <div className={(0, utils_1.cn)('flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2', isCompleted && 'border-green-500 bg-green-500 text-white', isCurrent && !isCompleted && 'border-primary bg-primary text-white', isBlocked && 'border-red-500 bg-red-500/20 text-red-500', !isCompleted && !isCurrent && !isBlocked && 'border-muted-foreground/30')}>
                  {isCompleted ? (<lucide_react_1.Check className="h-5 w-5"/>) : isBlocked ? (<lucide_react_1.AlertCircle className="h-5 w-5"/>) : !step.canNavigateTo ? (<lucide_react_1.Lock className="h-4 w-4"/>) : (<Icon className="h-5 w-5"/>)}
                </div>

                {/* Step info */}
                <div className="flex-1 min-w-0">
                  <p className={(0, utils_1.cn)('text-sm font-medium truncate', isCurrent && 'text-primary', isCompleted && 'text-green-600 dark:text-green-400', isBlocked && 'text-red-600 dark:text-red-400')}>
                    {step.name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {step.description}
                  </p>
                </div>

                {/* Status badge */}
                {isCompleted && (<span className="text-xs text-green-600 dark:text-green-400 font-medium">
                    Completado
                  </span>)}
                {isBlocked && (<span className="text-xs text-red-600 dark:text-red-400 font-medium">
                    Bloqueado
                  </span>)}
              </button>
            </li>);
        })}
      </ol>
    </nav>);
}
// Compact horizontal stepper for mobile
function WizardStepperCompact({ steps, currentStep, }) {
    const currentIndex = steps.findIndex((s) => s.step === currentStep);
    const completedCount = steps.filter((s) => s.status === 'COMPLETED').length;
    return (<div className="w-full">
      {/* Progress bar */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm font-medium">
          Paso {currentIndex + 1} de {steps.length}
        </span>
        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary transition-all duration-300" style={{
            width: `${(completedCount / steps.length) * 100}%`,
        }}/>
        </div>
        <span className="text-sm text-muted-foreground">
          {Math.round((completedCount / steps.length) * 100)}%
        </span>
      </div>

      {/* Current step info */}
      <div className="flex items-center gap-2">
        {(() => {
            const Icon = STEP_ICONS[currentStep];
            return <Icon className="h-5 w-5 text-primary"/>;
        })()}
        <span className="font-medium">
          {steps.find((s) => s.step === currentStep)?.name}
        </span>
      </div>
    </div>);
}
