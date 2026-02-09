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
exports.ProviderSelector = ProviderSelector;
exports.ProviderDocsLink = ProviderDocsLink;
const React = __importStar(require("react"));
const utils_1 = require("@/lib/utils");
const lucide_react_1 = require("lucide-react");
const email_config_1 = require("@/types/email-config");
function ProviderSelector({ selectedProvider, onSelect, disabled = false, }) {
    return (<div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Seleccione su Proveedor de Email
        </h3>
        <p className="text-sm text-muted-foreground">
          Elija el servicio que utilizará para enviar facturas y documentos tributarios
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {email_config_1.EMAIL_PROVIDERS.map((provider) => (<ProviderCard key={provider.id} provider={provider} isSelected={selectedProvider === provider.id} onSelect={() => !disabled && onSelect(provider.id)} disabled={disabled}/>))}
      </div>
    </div>);
}
function ProviderCard({ provider, isSelected, onSelect, disabled, }) {
    return (<button type="button" onClick={onSelect} disabled={disabled} className={(0, utils_1.cn)('relative p-4 rounded-xl border text-left transition-all', 'hover:border-primary/50 hover:bg-accent/50', 'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2', isSelected
            ? 'border-primary bg-primary/5 ring-2 ring-primary ring-offset-2'
            : 'border-border bg-card', disabled && 'opacity-50 cursor-not-allowed')}>
      {/* Selected indicator */}
      {isSelected && (<div className="absolute top-3 right-3">
          <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
            <lucide_react_1.Check className="w-3 h-3 text-primary-foreground"/>
          </div>
        </div>)}

      {/* Provider icon and name */}
      <div className="flex items-center gap-3 mb-2">
        <span className="text-2xl">{provider.icon}</span>
        <div>
          <h4 className="font-semibold text-foreground">{provider.name}</h4>
          {provider.requiresOAuth && (<span className="text-xs px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400">
              OAuth2
            </span>)}
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-muted-foreground mb-3">{provider.description}</p>

      {/* Features */}
      <div className="flex flex-wrap gap-1">
        {provider.features.slice(0, 2).map((feature, idx) => (<span key={idx} className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
            {feature}
          </span>))}
      </div>
    </button>);
}
// Helper component for showing provider docs link
function ProviderDocsLink({ provider }) {
    const docs = {
        SENDGRID: 'https://docs.sendgrid.com/ui/account-and-settings/api-keys',
        MAILGUN: 'https://documentation.mailgun.com/en/latest/api-intro.html',
        AMAZON_SES: 'https://docs.aws.amazon.com/ses/latest/dg/smtp-credentials.html',
        MICROSOFT_365: 'https://learn.microsoft.com/en-us/azure/active-directory/develop/quickstart-register-app',
        GOOGLE_WORKSPACE: 'https://developers.google.com/gmail/api/quickstart/js',
        POSTMARK: 'https://postmarkapp.com/developer/api/overview',
        BREVO: 'https://developers.brevo.com/docs/getting-started',
        MAILTRAP: 'https://mailtrap.io/api-tokens',
        SMTP_GENERIC: '',
    };
    const url = docs[provider];
    if (!url)
        return null;
    return (<a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
      Ver documentación
      <lucide_react_1.ExternalLink className="w-3 h-3"/>
    </a>);
}
