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
exports.CompanyInfoStep = CompanyInfoStep;
const React = __importStar(require("react"));
const button_1 = require("@/components/ui/button");
const input_1 = require("@/components/ui/input");
const label_1 = require("@/components/ui/label");
const card_1 = require("@/components/ui/card");
const lucide_react_1 = require("lucide-react");
function CompanyInfoStep({ data, onSubmit, onBack, loading, }) {
    const [formData, setFormData] = React.useState({
        nit: data?.nit || '',
        nrc: data?.nrc || '',
        razonSocial: data?.razonSocial || '',
        nombreComercial: data?.nombreComercial || '',
        actividadEconomica: data?.actividadEconomica || '',
        emailHacienda: data?.emailHacienda || '',
        telefonoHacienda: data?.telefonoHacienda || '',
    });
    const [errors, setErrors] = React.useState({});
    const handleChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: '' }));
        }
    };
    const validate = () => {
        const newErrors = {};
        if (!formData.nit) {
            newErrors.nit = 'El NIT es requerido';
        }
        else if (!/^\d{4}-\d{6}-\d{3}-\d$/.test(formData.nit)) {
            newErrors.nit = 'Formato inválido. Use: 0000-000000-000-0';
        }
        if (formData.nrc && !/^\d{1,7}-\d$/.test(formData.nrc)) {
            newErrors.nrc = 'Formato inválido. Use: 0000000-0';
        }
        if (!formData.razonSocial) {
            newErrors.razonSocial = 'La razón social es requerida';
        }
        if (!formData.actividadEconomica) {
            newErrors.actividadEconomica = 'La actividad económica es requerida';
        }
        if (!formData.emailHacienda) {
            newErrors.emailHacienda = 'El email es requerido';
        }
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.emailHacienda)) {
            newErrors.emailHacienda = 'Email inválido';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    const handleSubmit = (e) => {
        e.preventDefault();
        if (validate()) {
            onSubmit(formData);
        }
    };
    return (<div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-lg bg-primary/10">
          <lucide_react_1.Building2 className="h-6 w-6 text-primary"/>
        </div>
        <div>
          <h2 className="text-2xl font-bold">Información de la Empresa</h2>
          <p className="text-muted-foreground">
            Datos del contribuyente para el registro en Hacienda
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <card_1.Card>
          <card_1.CardHeader>
            <card_1.CardTitle>Datos Fiscales</card_1.CardTitle>
            <card_1.CardDescription>
              Información de identificación tributaria
            </card_1.CardDescription>
          </card_1.CardHeader>
          <card_1.CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label_1.Label htmlFor="nit">
                  NIT <span className="text-red-500">*</span>
                </label_1.Label>
                <input_1.Input id="nit" placeholder="0000-000000-000-0" value={formData.nit} onChange={(e) => handleChange('nit', e.target.value)} className={errors.nit ? 'border-red-500' : ''}/>
                {errors.nit && (<p className="text-sm text-red-500">{errors.nit}</p>)}
              </div>

              <div className="space-y-2">
                <label_1.Label htmlFor="nrc">NRC</label_1.Label>
                <input_1.Input id="nrc" placeholder="0000000-0" value={formData.nrc} onChange={(e) => handleChange('nrc', e.target.value)} className={errors.nrc ? 'border-red-500' : ''}/>
                {errors.nrc && (<p className="text-sm text-red-500">{errors.nrc}</p>)}
              </div>
            </div>

            <div className="space-y-2">
              <label_1.Label htmlFor="razonSocial">
                Razón Social <span className="text-red-500">*</span>
              </label_1.Label>
              <input_1.Input id="razonSocial" placeholder="Mi Empresa S.A. de C.V." value={formData.razonSocial} onChange={(e) => handleChange('razonSocial', e.target.value)} className={errors.razonSocial ? 'border-red-500' : ''}/>
              {errors.razonSocial && (<p className="text-sm text-red-500">{errors.razonSocial}</p>)}
            </div>

            <div className="space-y-2">
              <label_1.Label htmlFor="nombreComercial">Nombre Comercial</label_1.Label>
              <input_1.Input id="nombreComercial" placeholder="Nombre comercial (opcional)" value={formData.nombreComercial} onChange={(e) => handleChange('nombreComercial', e.target.value)}/>
            </div>

            <div className="space-y-2">
              <label_1.Label htmlFor="actividadEconomica">
                Actividad Económica <span className="text-red-500">*</span>
              </label_1.Label>
              <input_1.Input id="actividadEconomica" placeholder="Código o descripción de actividad" value={formData.actividadEconomica} onChange={(e) => handleChange('actividadEconomica', e.target.value)} className={errors.actividadEconomica ? 'border-red-500' : ''}/>
              {errors.actividadEconomica && (<p className="text-sm text-red-500">
                  {errors.actividadEconomica}
                </p>)}
            </div>
          </card_1.CardContent>
        </card_1.Card>

        <card_1.Card>
          <card_1.CardHeader>
            <card_1.CardTitle>Contacto en Hacienda</card_1.CardTitle>
            <card_1.CardDescription>
              Información de contacto registrada en el Ministerio de Hacienda
            </card_1.CardDescription>
          </card_1.CardHeader>
          <card_1.CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label_1.Label htmlFor="emailHacienda">
                  Email en Hacienda <span className="text-red-500">*</span>
                </label_1.Label>
                <input_1.Input id="emailHacienda" type="email" placeholder="contacto@empresa.com" value={formData.emailHacienda} onChange={(e) => handleChange('emailHacienda', e.target.value)} className={errors.emailHacienda ? 'border-red-500' : ''}/>
                {errors.emailHacienda && (<p className="text-sm text-red-500">{errors.emailHacienda}</p>)}
                <p className="text-xs text-muted-foreground">
                  Email registrado en Servicios en Línea del MH
                </p>
              </div>

              <div className="space-y-2">
                <label_1.Label htmlFor="telefonoHacienda">Teléfono</label_1.Label>
                <input_1.Input id="telefonoHacienda" placeholder="0000-0000" value={formData.telefonoHacienda} onChange={(e) => handleChange('telefonoHacienda', e.target.value)}/>
              </div>
            </div>
          </card_1.CardContent>
        </card_1.Card>

        {/* Actions */}
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
