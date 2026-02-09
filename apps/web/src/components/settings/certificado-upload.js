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
exports.CertificadoUpload = CertificadoUpload;
const React = __importStar(require("react"));
const lucide_react_1 = require("lucide-react");
const button_1 = require("@/components/ui/button");
const input_1 = require("@/components/ui/input");
const utils_1 = require("@/lib/utils");
function CertificadoUpload({ currentCert, onUploadSuccess, className, }) {
    const [file, setFile] = React.useState(null);
    const [password, setPassword] = React.useState('');
    const [showPassword, setShowPassword] = React.useState(false);
    const [isUploading, setIsUploading] = React.useState(false);
    const [error, setError] = React.useState(null);
    const [uploadedCert, setUploadedCert] = React.useState(currentCert);
    const fileInputRef = React.useRef(null);
    // Check if certificate is expiring soon (within 30 days)
    const isExpiringSoon = React.useMemo(() => {
        if (!uploadedCert?.expiresAt)
            return false;
        const expiryDate = new Date(uploadedCert.expiresAt);
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        return expiryDate <= thirtyDaysFromNow;
    }, [uploadedCert?.expiresAt]);
    const handleFileChange = (e) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            const fileName = selectedFile.name.toLowerCase();
            if (!fileName.endsWith('.p12') && !fileName.endsWith('.pfx')) {
                if (fileName.endsWith('.cer') || fileName.endsWith('.crt') || fileName.endsWith('.pem')) {
                    setError('El archivo debe ser .p12 o .pfx (contiene clave privada). Los archivos .cer, .crt o .pem no incluyen la clave privada necesaria para firmar.');
                }
                else {
                    setError('Formato no soportado. El certificado debe ser .p12 o .pfx');
                }
                return;
            }
            setFile(selectedFile);
            setError(null);
        }
    };
    const handleDrop = (e) => {
        e.preventDefault();
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) {
            const fileName = droppedFile.name.toLowerCase();
            if (!fileName.endsWith('.p12') && !fileName.endsWith('.pfx')) {
                if (fileName.endsWith('.cer') || fileName.endsWith('.crt') || fileName.endsWith('.pem')) {
                    setError('El archivo debe ser .p12 o .pfx (contiene clave privada). Los archivos .cer, .crt o .pem no incluyen la clave privada necesaria para firmar.');
                }
                else {
                    setError('Formato no soportado. El certificado debe ser .p12 o .pfx');
                }
                return;
            }
            setFile(droppedFile);
            setError(null);
        }
    };
    const handleDragOver = (e) => {
        e.preventDefault();
    };
    const handleUpload = async () => {
        if (!file || !password) {
            setError('Selecciona el archivo y escribe la contrasena');
            return;
        }
        setIsUploading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            const formData = new FormData();
            formData.append('certificate', file);
            formData.append('password', password);
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tenants/me/certificate`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Error al subir certificado');
            }
            const result = await response.json();
            setUploadedCert({
                filename: file.name,
                uploadedAt: new Date().toISOString(),
                expiresAt: result.expiresAt,
                isValid: true,
                subject: result.subject,
            });
            setFile(null);
            setPassword('');
            onUploadSuccess?.();
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Error al subir certificado');
        }
        finally {
            setIsUploading(false);
        }
    };
    const handleRemove = async () => {
        if (!confirm('¿Estas seguro de eliminar el certificado? No podras emitir facturas hasta subir uno nuevo.')) {
            return;
        }
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tenants/me/certificate`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (!response.ok) {
                throw new Error('Error al eliminar certificado');
            }
            setUploadedCert(undefined);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Error al eliminar');
        }
    };
    return (<div className={(0, utils_1.cn)('glass-card p-6', className)}>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
          <lucide_react_1.KeyRound className="w-5 h-5 text-primary"/>
        </div>
        <div>
          <h3 className="font-semibold text-white">Certificado Digital</h3>
          <p className="text-sm text-muted-foreground">
            Certificado .p12 para firmar facturas electronicas
          </p>
        </div>
      </div>

      {/* Current certificate info */}
      {uploadedCert && (<div className={(0, utils_1.cn)('mb-6 p-4 rounded-lg border', uploadedCert.isValid && !isExpiringSoon
                ? 'bg-green-500/10 border-green-500/30'
                : isExpiringSoon
                    ? 'bg-warning/10 border-warning/30'
                    : 'bg-destructive/10 border-destructive/30')}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {uploadedCert.isValid && !isExpiringSoon ? (<lucide_react_1.CheckCircle2 className="w-5 h-5 text-green-500"/>) : isExpiringSoon ? (<lucide_react_1.AlertCircle className="w-5 h-5 text-warning"/>) : (<lucide_react_1.AlertCircle className="w-5 h-5 text-destructive"/>)}
              <div>
                <p className="font-medium text-white">{uploadedCert.filename}</p>
                {uploadedCert.subject && (<p className="text-sm text-muted-foreground">{uploadedCert.subject}</p>)}
              </div>
            </div>
            <button_1.Button variant="ghost" size="sm" onClick={handleRemove} className="text-muted-foreground hover:text-destructive">
              <lucide_react_1.Trash2 className="w-4 h-4"/>
            </button_1.Button>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Subido</p>
              <p className="text-white">{(0, utils_1.formatDate)(uploadedCert.uploadedAt)}</p>
            </div>
            {uploadedCert.expiresAt && (<div>
                <p className="text-muted-foreground">Expira</p>
                <p className={(0, utils_1.cn)(isExpiringSoon ? 'text-warning' : 'text-white')}>
                  {(0, utils_1.formatDate)(uploadedCert.expiresAt)}
                  {isExpiringSoon && ' (pronto)'}
                </p>
              </div>)}
          </div>

          {isExpiringSoon && (<div className="mt-3 flex items-center gap-2 text-sm text-warning">
              <lucide_react_1.Calendar className="w-4 h-4"/>
              <span>Tu certificado expirara pronto. Considera renovarlo.</span>
            </div>)}
        </div>)}

      {/* Upload section */}
      {!uploadedCert && (<>
          {/* Drop zone */}
          <div onDrop={handleDrop} onDragOver={handleDragOver} onClick={() => fileInputRef.current?.click()} className={(0, utils_1.cn)('border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all mb-4', file
                ? 'border-primary bg-primary/10'
                : 'border-border hover:border-primary/50 hover:bg-white/5')}>
            <input ref={fileInputRef} type="file" accept=".p12,.pfx,.cer,.crt,.pem,application/x-pkcs12" onChange={handleFileChange} className="hidden"/>
            {file ? (<>
                <lucide_react_1.KeyRound className="w-10 h-10 text-primary mx-auto mb-3"/>
                <p className="font-medium text-white">{file.name}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Click para cambiar archivo
                </p>
              </>) : (<>
                <lucide_react_1.Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3"/>
                <p className="font-medium text-white">
                  Arrastra tu archivo .p12 o .pfx aqui
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  o haz click para seleccionar (formatos: .p12, .pfx)
                </p>
              </>)}
          </div>

          {/* Password input */}
          <div className="space-y-2 mb-4">
            <label className="text-sm font-medium text-muted-foreground">
              Contrasena del certificado
            </label>
            <div className="relative">
              <input_1.Input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Ingresa la contrasena" className="input-rc pr-10"/>
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white">
                {showPassword ? (<lucide_react_1.EyeOff className="w-4 h-4"/>) : (<lucide_react_1.Eye className="w-4 h-4"/>)}
              </button>
            </div>
          </div>

          {/* Error message */}
          {error && (<div className="flex items-center gap-2 text-sm text-destructive mb-4">
              <lucide_react_1.AlertCircle className="w-4 h-4"/>
              <span>{error}</span>
            </div>)}

          {/* Upload button */}
          <button_1.Button onClick={handleUpload} disabled={!file || !password || isUploading} className="w-full btn-primary">
            {isUploading ? (<>
                <lucide_react_1.Loader2 className="w-4 h-4 mr-2 animate-spin"/>
                Validando y subiendo...
              </>) : (<>
                <lucide_react_1.Upload className="w-4 h-4 mr-2"/>
                Subir Certificado
              </>)}
          </button_1.Button>
        </>)}

      {/* Replace certificate */}
      {uploadedCert && (<div className="pt-4 border-t border-border">
          <button_1.Button variant="ghost" onClick={() => setUploadedCert(undefined)} className="w-full">
            <lucide_react_1.RefreshCw className="w-4 h-4 mr-2"/>
            Reemplazar certificado
          </button_1.Button>
        </div>)}

      {/* Help text */}
      <p className="text-xs text-muted-foreground mt-4 text-center">
        El certificado se usa para firmar digitalmente tus facturas.
        <br />
        Puedes obtenerlo en{' '}
        <a href="https://portaldgii.mh.gob.sv" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
          portaldgii.mh.gob.sv
        </a>
      </p>
    </div>);
}
