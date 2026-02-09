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
exports.ConfigurationStatus = ConfigurationStatus;
const React = __importStar(require("react"));
const lucide_react_1 = require("lucide-react");
const badge_1 = require("@/components/ui/badge");
const tooltip_1 = require("@/components/ui/tooltip");
function ConfigurationStatus({ config, testProgress, }) {
    if (!config) {
        return (<badge_1.Badge variant="outline" className="text-muted-foreground">
        <lucide_react_1.Clock className="h-3 w-3 mr-1"/>
        Sin configurar
      </badge_1.Badge>);
    }
    const getStatusBadge = () => {
        switch (config.testingStatus) {
            case 'NOT_STARTED':
                return (<badge_1.Badge variant="outline" className="text-muted-foreground">
            <lucide_react_1.Clock className="h-3 w-3 mr-1"/>
            Sin iniciar
          </badge_1.Badge>);
            case 'IN_PROGRESS':
                return (<tooltip_1.TooltipProvider>
            <tooltip_1.Tooltip>
              <tooltip_1.TooltipTrigger>
                <badge_1.Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">
                  <lucide_react_1.PlayCircle className="h-3 w-3 mr-1"/>
                  En pruebas ({testProgress?.percentComplete || 0}%)
                </badge_1.Badge>
              </tooltip_1.TooltipTrigger>
              <tooltip_1.TooltipContent>
                <p>
                  {testProgress?.totalCompleted || 0} de {testProgress?.totalRequired || 0} pruebas completadas
                </p>
                {testProgress?.daysRemaining !== undefined && (<p className="text-xs text-muted-foreground">
                    {testProgress.daysRemaining} días restantes
                  </p>)}
              </tooltip_1.TooltipContent>
            </tooltip_1.Tooltip>
          </tooltip_1.TooltipProvider>);
            case 'PENDING_AUTHORIZATION':
                return (<badge_1.Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">
            <lucide_react_1.AlertTriangle className="h-3 w-3 mr-1"/>
            Pendiente autorización
          </badge_1.Badge>);
            case 'AUTHORIZED':
                return (<badge_1.Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
            <lucide_react_1.ShieldCheck className="h-3 w-3 mr-1"/>
            Autorizado para producción
          </badge_1.Badge>);
            default:
                return null;
        }
    };
    const getEnvironmentBadge = () => {
        if (config.activeEnvironment === 'PRODUCTION') {
            return (<badge_1.Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
          <lucide_react_1.CheckCircle2 className="h-3 w-3 mr-1"/>
          Producción
        </badge_1.Badge>);
        }
        return (<badge_1.Badge variant="outline" className="text-amber-600">
        <lucide_react_1.AlertTriangle className="h-3 w-3 mr-1"/>
        Pruebas
      </badge_1.Badge>);
    };
    return (<div className="flex items-center gap-2">
      {getEnvironmentBadge()}
      {getStatusBadge()}
    </div>);
}
