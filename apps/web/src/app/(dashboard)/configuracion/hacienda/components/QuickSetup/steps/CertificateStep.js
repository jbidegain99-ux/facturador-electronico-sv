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
exports.CertificateStep = CertificateStep;
const React = __importStar(require("react"));
const lucide_react_1 = require("lucide-react");
const button_1 = require("@/components/ui/button");
const input_1 = require("@/components/ui/input");
const label_1 = require("@/components/ui/label");
const card_1 = require("@/components/ui/card");
const alert_1 = require("@/components/ui/alert");
const utils_1 = require("@/lib/utils");
function CertificateStep({ certificate: initialCertificate, certificatePassword: initialPassword, onSubmit, onBack, }) {
    const [certificate, setCertificate] = React.useState(initialCertificate);
    const [password, setPassword] = React.useState(initialPassword);
    const [showPassword, setShowPassword] = React.useState(false);
    const [error, setError] = React.useState(null);
    const [isDragging, setIsDragging] = React.useState(false);
    const fileInputRef = React.useRef(null);
    const validateFile = (file) => {
        const allowedExtensions = ['.p12', '.pfx', '.crt', '.cer', '.pem'];
        const fileExt = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
        if (!allowedExtensions.includes(fileExt)) {
            setError('El archivo debe ser un certificado .p12, .pfx, .crt, .cer o .pem');
            return false;
        }
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            setError('El archivo no puede exceder 5MB');
            return false;
        }
        setError(null);
        return true;
    };
    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file && validateFile(file)) {
            setCertificate(file);
        }
    };
    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file && validateFile(file)) {
            setCertificate(file);
        }
    };
    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };
    const handleDragLeave = () => {
        setIsDragging(false);
    };
    const handleSubmit = (e) => {
        e.preventDefault();
        if (!certificate) {
            setError('Debes seleccionar un archivo de certificado');
            return;
        }
        if (!password) {
            setError('Debes ingresar la contrasena del certificado');
            return;
        }
        if (password.length < 1) {
            setError('La contrasena no puede estar vacia');
            return;
        }
        onSubmit(certificate, password);
    };
    const removeCertificate = () => {
        setCertificate(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };
    return (<form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
      <div className="text-center space-y-2">
        <h3 className="text-xl font-semibold">Sube tu Certificado Digital</h3>
        <p className="text-muted-foreground">
          El certificado que recibiste del Ministerio de Hacienda (.p12, .pfx, .crt, .cer o .pem)
        </p>
      </div>

      {/* File Upload Area */}
      <div className={(0, utils_1.cn)('border-2 border-dashed rounded-xl p-8 transition-all cursor-pointer', 'bg-muted/30 border-border', isDragging && 'border-primary bg-primary/5', certificate && 'border-green-500/50 bg-green-500/5')} onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onClick={() => fileInputRef.current?.click()}>
        <input ref={fileInputRef} type="file" accept=".p12,.pfx,.crt,.cer,.pem" onChange={handleFileChange} className="hidden"/>

        {certificate ? (<div className="flex items-center justify-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center">
              <lucide_react_1.CheckCircle className="h-6 w-6 text-green-400"/>
            </div>
            <div className="text-left">
              <p className="font-medium text-green-400">{certificate.name}</p>
              <p className="text-sm text-muted-foreground">
                {(certificate.size / 1024).toFixed(1)} KB
              </p>
            </div>
            <button_1.Button type="button" variant="ghost" size="icon" className="ml-4" onClick={(e) => {
                e.stopPropagation();
                removeCertificate();
            }}>
              <lucide_react_1.X className="h-4 w-4"/>
            </button_1.Button>
          </div>) : (<div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-primary/20 flex items-center justify-center">
              <lucide_react_1.FileKey2 className="h-8 w-8 text-primary"/>
            </div>
            <div className="text-center">
              <p className="font-medium">
                Arrastra tu archivo aqui o{' '}
                <span className="text-primary">haz clic para seleccionar</span>
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Archivos .p12, .pfx, .crt, .cer o .pem (max 5MB)
              </p>
            </div>
          </div>)}
      </div>

      {/* Password Field */}
      <card_1.Card variant="glass">
        <card_1.CardContent className="p-6">
          <div className="space-y-2">
            <label_1.Label htmlFor="certificatePassword">Contrasena del Certificado</label_1.Label>
            <div className="relative">
              <input_1.Input id="certificatePassword" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Ingresa la contrasena de tu certificado" className="pr-10"/>
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                {showPassword ? <lucide_react_1.EyeOff className="h-4 w-4"/> : <lucide_react_1.Eye className="h-4 w-4"/>}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Esta es la contrasena que usaste al descargar el certificado desde el portal de Hacienda
            </p>
          </div>
        </card_1.CardContent>
      </card_1.Card>

      {/* Error Alert */}
      {error && (<alert_1.Alert variant="destructive" className="bg-red-500/10 border-red-500/20">
          <lucide_react_1.AlertCircle className="h-4 w-4"/>
          <alert_1.AlertDescription>{error}</alert_1.AlertDescription>
        </alert_1.Alert>)}

      {/* Info Alert */}
      <alert_1.Alert className="bg-muted/50 border-border">
        <lucide_react_1.FileKey2 className="h-4 w-4"/>
        <alert_1.AlertDescription>
          <strong>Importante:</strong> Tu certificado sera almacenado de forma segura y encriptada.
          La contrasena nunca se guarda en texto plano.
        </alert_1.AlertDescription>
      </alert_1.Alert>

      {/* Actions */}
      <div className="flex justify-between pt-4">
        <button_1.Button type="button" variant="ghost" onClick={onBack}>
          Atras
        </button_1.Button>
        <button_1.Button type="submit" disabled={!certificate || !password}>
          Continuar
        </button_1.Button>
      </div>
    </form>);
}
