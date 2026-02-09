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
exports.ApiCredentialsStep = ApiCredentialsStep;
exports.WaitingStep = WaitingStep;
exports.CompletedStep = CompletedStep;
const React = __importStar(require("react"));
const button_1 = require("@/components/ui/button");
const input_1 = require("@/components/ui/input");
const label_1 = require("@/components/ui/label");
const card_1 = require("@/components/ui/card");
const lucide_react_1 = require("lucide-react");
const alert_1 = require("@/components/ui/alert");
function CertificateStep({ type, hasCertificate, onSubmit, onBack, loading, }) {
    const [uploadMode, setUploadMode] = React.useState('combined');
    const [formData, setFormData] = React.useState({
        certificate: '',
        password: '',
        expiryDate: '',
    });
    // For separate file upload
    const [privateKey, setPrivateKey] = React.useState('');
    const [privateKeyFileName, setPrivateKeyFileName] = React.useState('');
    const [fileName, setFileName] = React.useState('');
    const [showPassword, setShowPassword] = React.useState(false);
    const [error, setError] = React.useState('');
    const isTest = type === 'test';
    const title = isTest ? 'Certificado de Pruebas' : 'Certificado de Producción';
    const description = isTest
        ? 'Suba su certificado digital para el ambiente de pruebas'
        : 'Suba su certificado digital para el ambiente de producción';
    const handleCombinedFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file)
            return;
        const fileNameLower = file.name.toLowerCase();
        if (!fileNameLower.endsWith('.p12') && !fileNameLower.endsWith('.pfx')) {
            setError('Para el modo combinado, el archivo debe ser .p12 o .pfx');
            return;
        }
        setFileName(file.name);
        setError('');
        const reader = new FileReader();
        reader.onload = () => {
            const base64 = reader.result.split(',')[1];
            setFormData((prev) => ({ ...prev, certificate: base64 }));
        };
        reader.readAsDataURL(file);
    };
    const handleCertificateFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file)
            return;
        const fileNameLower = file.name.toLowerCase();
        const validExtensions = ['.crt', '.cer', '.pem'];
        const isValid = validExtensions.some(ext => fileNameLower.endsWith(ext));
        if (!isValid) {
            setError('El certificado debe ser .crt, .cer o .pem');
            return;
        }
        setFileName(file.name);
        setError('');
        const reader = new FileReader();
        reader.onload = () => {
            const base64 = reader.result.split(',')[1];
            setFormData((prev) => ({ ...prev, certificate: base64 }));
        };
        reader.readAsDataURL(file);
    };
    const handlePrivateKeyFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file)
            return;
        const fileNameLower = file.name.toLowerCase();
        const validExtensions = ['.key', '.pem'];
        const isValid = validExtensions.some(ext => fileNameLower.endsWith(ext));
        if (!isValid) {
            setError('La llave privada debe ser .key o .pem');
            return;
        }
        setPrivateKeyFileName(file.name);
        setError('');
        const reader = new FileReader();
        reader.onload = () => {
            const base64 = reader.result.split(',')[1];
            setPrivateKey(base64);
        };
        reader.readAsDataURL(file);
    };
    const handleModeChange = (mode) => {
        setUploadMode(mode);
        // Reset form when switching modes
        setFormData({ certificate: '', password: '', expiryDate: '' });
        setPrivateKey('');
        setFileName('');
        setPrivateKeyFileName('');
        setError('');
    };
    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.certificate) {
            setError('Debe seleccionar un archivo de certificado');
            return;
        }
        if (uploadMode === 'combined' && !formData.password) {
            setError('Debe ingresar la contraseña del certificado');
            return;
        }
        if (uploadMode === 'separate' && !privateKey) {
            setError('Debe seleccionar el archivo de llave privada');
            return;
        }
        // Include private key in the form data for separate mode
        const submitData = uploadMode === 'separate'
            ? { ...formData, privateKey, uploadMode: 'separate' }
            : { ...formData, uploadMode: 'combined' };
        onSubmit(submitData);
    };
    return (<div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-lg bg-primary/10">
          <lucide_react_1.ShieldCheck className="h-6 w-6 text-primary"/>
        </div>
        <div>
          <h2 className="text-2xl font-bold">{title}</h2>
          <p className="text-muted-foreground">{description}</p>
        </div>
      </div>

      {hasCertificate && (<alert_1.Alert className="border-green-500 bg-green-500/10">
          <lucide_react_1.CheckCircle2 className="h-4 w-4 text-green-500"/>
          <alert_1.AlertDescription className="text-green-700 dark:text-green-400">
            Ya tiene un certificado configurado. Puede actualizarlo si lo desea.
          </alert_1.AlertDescription>
        </alert_1.Alert>)}

      {/* Upload mode selector */}
      <card_1.Card>
        <card_1.CardHeader>
          <card_1.CardTitle>Tipo de Certificado</card_1.CardTitle>
          <card_1.CardDescription>
            Seleccione cómo desea cargar su certificado digital
          </card_1.CardDescription>
        </card_1.CardHeader>
        <card_1.CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button type="button" onClick={() => handleModeChange('combined')} className={`p-4 rounded-lg border-2 text-left transition-all ${uploadMode === 'combined'
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/50'}`}>
              <div className="font-medium mb-1">Archivo combinado (.p12 / .pfx)</div>
              <div className="text-sm text-muted-foreground">
                Contiene certificado y llave privada en un solo archivo
              </div>
            </button>
            <button type="button" onClick={() => handleModeChange('separate')} className={`p-4 rounded-lg border-2 text-left transition-all ${uploadMode === 'separate'
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/50'}`}>
              <div className="font-medium mb-1">Archivos separados</div>
              <div className="text-sm text-muted-foreground">
                Certificado (.crt/.cer/.pem) + Llave privada (.key/.pem)
              </div>
            </button>
          </div>
        </card_1.CardContent>
      </card_1.Card>

      <form onSubmit={handleSubmit} className="space-y-6">
        <card_1.Card>
          <card_1.CardHeader>
            <card_1.CardTitle>
              {uploadMode === 'combined' ? 'Archivo del Certificado' : 'Archivos del Certificado'}
            </card_1.CardTitle>
            <card_1.CardDescription>
              {uploadMode === 'combined'
            ? 'Seleccione el archivo .p12 o .pfx de su certificado digital'
            : 'Seleccione el certificado público y la llave privada'}
            </card_1.CardDescription>
          </card_1.CardHeader>
          <card_1.CardContent className="space-y-4">
            {uploadMode === 'combined' ? (<>
                <div className="space-y-2">
                  <label_1.Label htmlFor="certificate">
                    Certificado (.p12 / .pfx) <span className="text-red-500">*</span>
                  </label_1.Label>
                  <div className="flex items-center gap-2">
                    <input_1.Input id="certificate" type="file" accept=".p12,.pfx,application/x-pkcs12" onChange={handleCombinedFileChange} className="hidden"/>
                    <button_1.Button type="button" variant="outline" onClick={() => document.getElementById('certificate')?.click()} className="w-full justify-start">
                      <lucide_react_1.Upload className="mr-2 h-4 w-4"/>
                      {fileName || 'Seleccionar archivo...'}
                    </button_1.Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label_1.Label htmlFor="certPassword">
                    Contraseña del Certificado <span className="text-red-500">*</span>
                  </label_1.Label>
                  <div className="relative">
                    <input_1.Input id="certPassword" type={showPassword ? 'text' : 'password'} value={formData.password} onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))} placeholder="••••••••" className="pr-10"/>
                    <button_1.Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full px-3" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? (<lucide_react_1.EyeOff className="h-4 w-4"/>) : (<lucide_react_1.Eye className="h-4 w-4"/>)}
                    </button_1.Button>
                  </div>
                </div>
              </>) : (<>
                <div className="space-y-2">
                  <label_1.Label htmlFor="publicCert">
                    Certificado Público (.crt / .cer / .pem) <span className="text-red-500">*</span>
                  </label_1.Label>
                  <div className="flex items-center gap-2">
                    <input_1.Input id="publicCert" type="file" accept=".crt,.cer,.pem,application/x-x509-ca-cert,application/x-pem-file" onChange={handleCertificateFileChange} className="hidden"/>
                    <button_1.Button type="button" variant="outline" onClick={() => document.getElementById('publicCert')?.click()} className="w-full justify-start">
                      <lucide_react_1.Upload className="mr-2 h-4 w-4"/>
                      {fileName || 'Seleccionar certificado...'}
                    </button_1.Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label_1.Label htmlFor="privateKey">
                    Llave Privada (.key / .pem) <span className="text-red-500">*</span>
                  </label_1.Label>
                  <div className="flex items-center gap-2">
                    <input_1.Input id="privateKey" type="file" accept=".key,.pem" onChange={handlePrivateKeyFileChange} className="hidden"/>
                    <button_1.Button type="button" variant="outline" onClick={() => document.getElementById('privateKey')?.click()} className="w-full justify-start">
                      <lucide_react_1.KeyRound className="mr-2 h-4 w-4"/>
                      {privateKeyFileName || 'Seleccionar llave privada...'}
                    </button_1.Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label_1.Label htmlFor="keyPassword">
                    Contraseña de la Llave (si está encriptada)
                  </label_1.Label>
                  <div className="relative">
                    <input_1.Input id="keyPassword" type={showPassword ? 'text' : 'password'} value={formData.password} onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))} placeholder="Dejar vacío si no tiene contraseña" className="pr-10"/>
                    <button_1.Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full px-3" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? (<lucide_react_1.EyeOff className="h-4 w-4"/>) : (<lucide_react_1.Eye className="h-4 w-4"/>)}
                    </button_1.Button>
                  </div>
                </div>
              </>)}

            <div className="space-y-2">
              <label_1.Label htmlFor="expiryDate">Fecha de Expiración (opcional)</label_1.Label>
              <input_1.Input id="expiryDate" type="date" value={formData.expiryDate} onChange={(e) => setFormData((prev) => ({ ...prev, expiryDate: e.target.value }))}/>
            </div>
          </card_1.CardContent>
        </card_1.Card>

        {error && (<alert_1.Alert variant="destructive">
            <lucide_react_1.AlertCircle className="h-4 w-4"/>
            <alert_1.AlertDescription>{error}</alert_1.AlertDescription>
          </alert_1.Alert>)}

        <div className="flex justify-between pt-4">
          <button_1.Button type="button" variant="outline" onClick={onBack}>
            <lucide_react_1.ArrowLeft className="mr-2 h-4 w-4"/>
            Anterior
          </button_1.Button>
          <button_1.Button type="submit" disabled={loading}>
            {loading ? (<>
                <lucide_react_1.Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                Subiendo...
              </>) : (<>
                Continuar
                <lucide_react_1.ArrowRight className="ml-2 h-4 w-4"/>
              </>)}
          </button_1.Button>
        </div>
      </form>
    </div>);
}
function ApiCredentialsStep({ type, hasCredentials, onSubmit, onBack, loading, }) {
    const [formData, setFormData] = React.useState({
        apiPassword: '',
        environmentUrl: '',
    });
    const [showPassword, setShowPassword] = React.useState(false);
    const [error, setError] = React.useState('');
    const isTest = type === 'test';
    const title = isTest
        ? 'Credenciales API de Pruebas'
        : 'Credenciales API de Producción';
    const defaultUrl = isTest
        ? 'https://apitest.dtes.mh.gob.sv'
        : 'https://api.dtes.mh.gob.sv';
    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.apiPassword || formData.apiPassword.length < 8) {
            setError('La contraseña API debe tener al menos 8 caracteres');
            return;
        }
        onSubmit({
            ...formData,
            environmentUrl: formData.environmentUrl || defaultUrl,
        });
    };
    return (<div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-lg bg-primary/10">
          <lucide_react_1.KeyRound className="h-6 w-6 text-primary"/>
        </div>
        <div>
          <h2 className="text-2xl font-bold">{title}</h2>
          <p className="text-muted-foreground">
            Configure las credenciales para conectarse a la API del MH
          </p>
        </div>
      </div>

      {hasCredentials && (<alert_1.Alert className="border-green-500 bg-green-500/10">
          <lucide_react_1.CheckCircle2 className="h-4 w-4 text-green-500"/>
          <alert_1.AlertDescription className="text-green-700 dark:text-green-400">
            Ya tiene credenciales configuradas. Puede actualizarlas si lo desea.
          </alert_1.AlertDescription>
        </alert_1.Alert>)}

      <alert_1.Alert>
        <lucide_react_1.AlertCircle className="h-4 w-4"/>
        <alert_1.AlertDescription>
          La contraseña API es diferente a la contraseña de Servicios en Línea.
          Es proporcionada por Hacienda específicamente para la API de DTE.
        </alert_1.AlertDescription>
      </alert_1.Alert>

      <form onSubmit={handleSubmit} className="space-y-6">
        <card_1.Card>
          <card_1.CardHeader>
            <card_1.CardTitle>Credenciales de API</card_1.CardTitle>
            <card_1.CardDescription>
              Ingrese la contraseña API proporcionada por Hacienda
            </card_1.CardDescription>
          </card_1.CardHeader>
          <card_1.CardContent className="space-y-4">
            <div className="space-y-2">
              <label_1.Label htmlFor="apiPassword">
                Contraseña API <span className="text-red-500">*</span>
              </label_1.Label>
              <div className="relative">
                <input_1.Input id="apiPassword" type={showPassword ? 'text' : 'password'} value={formData.apiPassword} onChange={(e) => setFormData((prev) => ({
            ...prev,
            apiPassword: e.target.value,
        }))} placeholder="••••••••••••" className="pr-10"/>
                <button_1.Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full px-3" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? (<lucide_react_1.EyeOff className="h-4 w-4"/>) : (<lucide_react_1.Eye className="h-4 w-4"/>)}
                </button_1.Button>
              </div>
            </div>

            <div className="space-y-2">
              <label_1.Label htmlFor="environmentUrl">URL del Ambiente (opcional)</label_1.Label>
              <input_1.Input id="environmentUrl" type="url" value={formData.environmentUrl} onChange={(e) => setFormData((prev) => ({
            ...prev,
            environmentUrl: e.target.value,
        }))} placeholder={defaultUrl}/>
              <p className="text-xs text-muted-foreground">
                Dejar vacío para usar la URL por defecto: {defaultUrl}
              </p>
            </div>
          </card_1.CardContent>
        </card_1.Card>

        {error && (<alert_1.Alert variant="destructive">
            <lucide_react_1.AlertCircle className="h-4 w-4"/>
            <alert_1.AlertDescription>{error}</alert_1.AlertDescription>
          </alert_1.Alert>)}

        <div className="flex justify-between pt-4">
          <button_1.Button type="button" variant="outline" onClick={onBack}>
            <lucide_react_1.ArrowLeft className="mr-2 h-4 w-4"/>
            Anterior
          </button_1.Button>
          <button_1.Button type="submit" disabled={loading}>
            {loading ? (<>
                <lucide_react_1.Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                Guardando...
              </>) : (<>
                Continuar
                <lucide_react_1.ArrowRight className="ml-2 h-4 w-4"/>
              </>)}
          </button_1.Button>
        </div>
      </form>
    </div>);
}
function WaitingStep({ type, onProceed, onBack, loading, }) {
    const isTestEnv = type === 'test-environment';
    const title = isTestEnv
        ? 'Solicitar Ambiente de Pruebas'
        : 'Solicitar Autorización';
    const description = isTestEnv
        ? 'Solicite acceso al ambiente de pruebas del Ministerio de Hacienda'
        : 'Envíe su solicitud de autorización como emisor de DTE';
    const Icon = isTestEnv ? lucide_react_1.FlaskConical : lucide_react_1.Send;
    const steps = isTestEnv
        ? [
            'Ingrese a Servicios en Línea del MH',
            'Navegue a "Facturación Electrónica" > "Ambiente de Pruebas"',
            'Complete el formulario de solicitud',
            'Espere la aprobación (generalmente inmediata)',
        ]
        : [
            'Complete todas las pruebas técnicas requeridas',
            'Ingrese a Servicios en Línea del MH',
            'Navegue a "Facturación Electrónica" > "Solicitud de Autorización"',
            'Adjunte la documentación requerida',
            'Espere la aprobación de Hacienda',
        ];
    return (<div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-lg bg-primary/10">
          <Icon className="h-6 w-6 text-primary"/>
        </div>
        <div>
          <h2 className="text-2xl font-bold">{title}</h2>
          <p className="text-muted-foreground">{description}</p>
        </div>
      </div>

      <card_1.Card>
        <card_1.CardHeader>
          <card_1.CardTitle>Pasos a Seguir</card_1.CardTitle>
          <card_1.CardDescription>
            Siga estos pasos en el portal del Ministerio de Hacienda
          </card_1.CardDescription>
        </card_1.CardHeader>
        <card_1.CardContent>
          <ol className="space-y-4">
            {steps.map((step, index) => (<li key={index} className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-white text-sm font-medium">
                  {index + 1}
                </span>
                <span className="text-sm">{step}</span>
              </li>))}
          </ol>
        </card_1.CardContent>
      </card_1.Card>

      <alert_1.Alert>
        <lucide_react_1.AlertCircle className="h-4 w-4"/>
        <alert_1.AlertDescription>
          <div className="space-y-2">
            <p>
              Este paso requiere que realice acciones en el portal del Ministerio
              de Hacienda.
            </p>
            <a href="https://portaldgii.mh.gob.sv/ssc/login" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
              Ir a Servicios en Línea del MH
              <lucide_react_1.ExternalLink className="h-3 w-3"/>
            </a>
          </div>
        </alert_1.AlertDescription>
      </alert_1.Alert>

      <div className="flex justify-between pt-4">
        <button_1.Button variant="outline" onClick={onBack}>
          <lucide_react_1.ArrowLeft className="mr-2 h-4 w-4"/>
          Anterior
        </button_1.Button>
        <button_1.Button onClick={onProceed} disabled={loading}>
          {loading ? (<>
              <lucide_react_1.Loader2 className="mr-2 h-4 w-4 animate-spin"/>
              Procesando...
            </>) : (<>
              Ya lo completé, continuar
              <lucide_react_1.ArrowRight className="ml-2 h-4 w-4"/>
            </>)}
        </button_1.Button>
      </div>
    </div>);
}
function CompletedStep({ type, onFinish, onBack, loading, }) {
    const isValidation = type === 'validation';
    if (isValidation) {
        return (<div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-lg bg-primary/10">
            <lucide_react_1.CheckCircle2 className="h-6 w-6 text-primary"/>
          </div>
          <div>
            <h2 className="text-2xl font-bold">Validación Final</h2>
            <p className="text-muted-foreground">
              Verifique que toda la configuración esté correcta
            </p>
          </div>
        </div>

        <card_1.Card>
          <card_1.CardHeader>
            <card_1.CardTitle>Lista de Verificación</card_1.CardTitle>
          </card_1.CardHeader>
          <card_1.CardContent>
            <div className="space-y-3">
              {[
                'Datos de empresa correctos',
                'Credenciales de Hacienda configuradas',
                'Tipos de DTE seleccionados',
                'Certificado de producción cargado',
                'Credenciales API de producción configuradas',
                'Pruebas técnicas completadas',
                'Autorización aprobada por Hacienda',
            ].map((item, i) => (<div key={i} className="flex items-center gap-2">
                  <lucide_react_1.CheckCircle2 className="h-4 w-4 text-green-500"/>
                  <span className="text-sm">{item}</span>
                </div>))}
            </div>
          </card_1.CardContent>
        </card_1.Card>

        <div className="flex justify-between pt-4">
          <button_1.Button variant="outline" onClick={onBack}>
            <lucide_react_1.ArrowLeft className="mr-2 h-4 w-4"/>
            Anterior
          </button_1.Button>
          <button_1.Button onClick={onFinish} disabled={loading}>
            {loading ? (<>
                <lucide_react_1.Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                Finalizando...
              </>) : (<>
                Finalizar Proceso
                <lucide_react_1.ArrowRight className="ml-2 h-4 w-4"/>
              </>)}
          </button_1.Button>
        </div>
      </div>);
    }
    // Completed
    return (<div className="space-y-8 text-center">
      <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-green-500/10 mx-auto">
        <lucide_react_1.PartyPopper className="h-12 w-12 text-green-500"/>
      </div>

      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-green-600 dark:text-green-400">
          ¡Felicitaciones!
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          Ha completado exitosamente el proceso de habilitación como emisor de
          documentos tributarios electrónicos.
        </p>
      </div>

      <card_1.Card className="max-w-md mx-auto">
        <card_1.CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <lucide_react_1.CheckCircle2 className="h-5 w-5 text-green-500"/>
              <span>Emisor autorizado por Hacienda</span>
            </div>
            <div className="flex items-center gap-3">
              <lucide_react_1.CheckCircle2 className="h-5 w-5 text-green-500"/>
              <span>Ambiente de producción configurado</span>
            </div>
            <div className="flex items-center gap-3">
              <lucide_react_1.CheckCircle2 className="h-5 w-5 text-green-500"/>
              <span>Listo para emitir DTE</span>
            </div>
          </div>
        </card_1.CardContent>
      </card_1.Card>

      <button_1.Button size="lg" onClick={onFinish}>
        Ir al Dashboard
        <lucide_react_1.ArrowRight className="ml-2 h-5 w-5"/>
      </button_1.Button>
    </div>);
}
