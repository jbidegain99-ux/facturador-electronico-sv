'use client';

import * as React from 'react';
import { UserPlus, Loader2, AlertCircle, Info, Zap } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Alert,
  AlertDescription,
} from '@/components/ui/alert';
import type { Cliente } from '@/types';

interface NuevoClienteModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (cliente: Cliente) => void;
  tipoDte?: '01' | '03';
  subtotal?: number; // Subtotal de la factura para validar umbral de $25,000
}

// Tipos de documento segun MH (CAT-022)
const TIPOS_DOCUMENTO = [
  { value: '36', label: 'NIT' },
  { value: '13', label: 'DUI' },
  { value: '02', label: 'Carnet de Residente' },
  { value: '03', label: 'Pasaporte' },
  { value: '37', label: 'Otro' },
];

// Tipos de documento para Consumidor Final (sin NIT ya que generalmente no tienen)
const TIPOS_DOCUMENTO_CF = [
  { value: '13', label: 'DUI' },
  { value: '36', label: 'NIT' },
  { value: '02', label: 'Carnet de Residente' },
  { value: '03', label: 'Pasaporte' },
  { value: '37', label: 'Otro' },
];

// Departamentos de El Salvador (CAT-003)
const DEPARTAMENTOS = [
  { value: '01', label: 'Ahuachapan' },
  { value: '02', label: 'Santa Ana' },
  { value: '03', label: 'Sonsonate' },
  { value: '04', label: 'Chalatenango' },
  { value: '05', label: 'La Libertad' },
  { value: '06', label: 'San Salvador' },
  { value: '07', label: 'Cuscatlan' },
  { value: '08', label: 'La Paz' },
  { value: '09', label: 'Cabanas' },
  { value: '10', label: 'San Vicente' },
  { value: '11', label: 'Usulutan' },
  { value: '12', label: 'San Miguel' },
  { value: '13', label: 'Morazan' },
  { value: '14', label: 'La Union' },
];

// Municipios completos por departamento (CAT-004)
const MUNICIPIOS: Record<string, { value: string; label: string }[]> = {
  '01': [
    { value: '01', label: 'Ahuachapan' },
    { value: '02', label: 'Apaneca' },
    { value: '03', label: 'Atiquizaya' },
    { value: '04', label: 'Concepcion de Ataco' },
    { value: '05', label: 'El Refugio' },
    { value: '06', label: 'Guaymango' },
    { value: '07', label: 'Jujutla' },
    { value: '08', label: 'San Francisco Menendez' },
    { value: '09', label: 'San Lorenzo' },
    { value: '10', label: 'San Pedro Puxtla' },
    { value: '11', label: 'Tacuba' },
    { value: '12', label: 'Turin' },
  ],
  '02': [
    { value: '01', label: 'Santa Ana' },
    { value: '02', label: 'Candelaria de la Frontera' },
    { value: '03', label: 'Chalchuapa' },
    { value: '04', label: 'Coatepeque' },
    { value: '05', label: 'El Congo' },
    { value: '06', label: 'El Porvenir' },
    { value: '07', label: 'Masahuat' },
    { value: '08', label: 'Metapan' },
    { value: '09', label: 'San Antonio Pajonal' },
    { value: '10', label: 'San Sebastian Salitrillo' },
    { value: '11', label: 'Santa Rosa Guachipilin' },
    { value: '12', label: 'Santiago de la Frontera' },
    { value: '13', label: 'Texistepeque' },
  ],
  '03': [
    { value: '01', label: 'Sonsonate' },
    { value: '02', label: 'Acajutla' },
    { value: '03', label: 'Armenia' },
    { value: '04', label: 'Caluco' },
    { value: '05', label: 'Cuisnahuat' },
    { value: '06', label: 'Izalco' },
    { value: '07', label: 'Juayua' },
    { value: '08', label: 'Nahuizalco' },
    { value: '09', label: 'Nahulingo' },
    { value: '10', label: 'Salcoatitan' },
    { value: '11', label: 'San Antonio del Monte' },
    { value: '12', label: 'San Julian' },
    { value: '13', label: 'Santa Catarina Masahuat' },
    { value: '14', label: 'Santa Isabel Ishuatan' },
    { value: '15', label: 'Santo Domingo de Guzman' },
    { value: '16', label: 'Sonzacate' },
  ],
  '04': [
    { value: '01', label: 'Chalatenango' },
    { value: '02', label: 'Agua Caliente' },
    { value: '03', label: 'Arcatao' },
    { value: '04', label: 'Azacualpa' },
    { value: '05', label: 'Citala' },
    { value: '06', label: 'Comalapa' },
    { value: '07', label: 'Concepcion Quezaltepeque' },
    { value: '08', label: 'Dulce Nombre de Maria' },
    { value: '09', label: 'El Carrizal' },
    { value: '10', label: 'El Paraiso' },
    { value: '11', label: 'La Laguna' },
    { value: '12', label: 'La Palma' },
    { value: '13', label: 'La Reina' },
    { value: '14', label: 'Las Vueltas' },
    { value: '15', label: 'Nombre de Jesus' },
    { value: '16', label: 'Nueva Concepcion' },
    { value: '17', label: 'Nueva Trinidad' },
    { value: '18', label: 'Ojos de Agua' },
    { value: '19', label: 'Potonico' },
    { value: '20', label: 'San Antonio de la Cruz' },
    { value: '21', label: 'San Antonio Los Ranchos' },
    { value: '22', label: 'San Fernando' },
    { value: '23', label: 'San Francisco Lempa' },
    { value: '24', label: 'San Francisco Morazan' },
    { value: '25', label: 'San Ignacio' },
    { value: '26', label: 'San Isidro Labrador' },
    { value: '27', label: 'San Jose Cancasque' },
    { value: '28', label: 'San Jose Las Flores' },
    { value: '29', label: 'San Luis del Carmen' },
    { value: '30', label: 'San Miguel de Mercedes' },
    { value: '31', label: 'San Rafael' },
    { value: '32', label: 'Santa Rita' },
    { value: '33', label: 'Tejutla' },
  ],
  '05': [
    { value: '01', label: 'Antiguo Cuscatlan' },
    { value: '02', label: 'Ciudad Arce' },
    { value: '03', label: 'Colon' },
    { value: '04', label: 'Comasagua' },
    { value: '05', label: 'Chiltiupan' },
    { value: '06', label: 'Huizucar' },
    { value: '07', label: 'Jayaque' },
    { value: '08', label: 'Jicalapa' },
    { value: '09', label: 'La Libertad' },
    { value: '10', label: 'Santa Tecla' },
    { value: '11', label: 'Nuevo Cuscatlan' },
    { value: '12', label: 'San Juan Opico' },
    { value: '13', label: 'Quezaltepeque' },
    { value: '14', label: 'Sacacoyo' },
    { value: '15', label: 'San Jose Villanueva' },
    { value: '16', label: 'San Matias' },
    { value: '17', label: 'San Pablo Tacachico' },
    { value: '18', label: 'Talnique' },
    { value: '19', label: 'Tamanique' },
    { value: '20', label: 'Teotepeque' },
    { value: '21', label: 'Tepecoyo' },
    { value: '22', label: 'Zaragoza' },
  ],
  '06': [
    { value: '01', label: 'Aguilares' },
    { value: '02', label: 'Apopa' },
    { value: '03', label: 'Ayutuxtepeque' },
    { value: '04', label: 'Cuscatancingo' },
    { value: '05', label: 'Ciudad Delgado' },
    { value: '06', label: 'El Paisnal' },
    { value: '07', label: 'Guazapa' },
    { value: '08', label: 'Ilopango' },
    { value: '09', label: 'Mejicanos' },
    { value: '10', label: 'Nejapa' },
    { value: '11', label: 'Panchimalco' },
    { value: '12', label: 'Rosario de Mora' },
    { value: '13', label: 'San Marcos' },
    { value: '14', label: 'San Martin' },
    { value: '15', label: 'San Salvador' },
    { value: '16', label: 'Santiago Texacuangos' },
    { value: '17', label: 'Santo Tomas' },
    { value: '18', label: 'Soyapango' },
    { value: '19', label: 'Tonacatepeque' },
  ],
  '07': [
    { value: '01', label: 'Cojutepeque' },
    { value: '02', label: 'Candelaria' },
    { value: '03', label: 'El Carmen' },
    { value: '04', label: 'El Rosario' },
    { value: '05', label: 'Monte San Juan' },
    { value: '06', label: 'Oratorio de Concepcion' },
    { value: '07', label: 'San Bartolome Perulapia' },
    { value: '08', label: 'San Cristobal' },
    { value: '09', label: 'San Jose Guayabal' },
    { value: '10', label: 'San Pedro Perulapan' },
    { value: '11', label: 'San Rafael Cedros' },
    { value: '12', label: 'San Ramon' },
    { value: '13', label: 'Santa Cruz Analquito' },
    { value: '14', label: 'Santa Cruz Michapa' },
    { value: '15', label: 'Suchitoto' },
    { value: '16', label: 'Tenancingo' },
  ],
  '08': [
    { value: '01', label: 'Zacatecoluca' },
    { value: '02', label: 'Cuyultitan' },
    { value: '03', label: 'El Rosario' },
    { value: '04', label: 'Jerusalen' },
    { value: '05', label: 'Mercedes La Ceiba' },
    { value: '06', label: 'Olocuilta' },
    { value: '07', label: 'Paraiso de Osorio' },
    { value: '08', label: 'San Antonio Masahuat' },
    { value: '09', label: 'San Emigdio' },
    { value: '10', label: 'San Francisco Chinameca' },
    { value: '11', label: 'San Juan Nonualco' },
    { value: '12', label: 'San Juan Talpa' },
    { value: '13', label: 'San Juan Tepezontes' },
    { value: '14', label: 'San Luis Talpa' },
    { value: '15', label: 'San Miguel Tepezontes' },
    { value: '16', label: 'San Pedro Masahuat' },
    { value: '17', label: 'San Pedro Nonualco' },
    { value: '18', label: 'San Rafael Obrajuelo' },
    { value: '19', label: 'Santa Maria Ostuma' },
    { value: '20', label: 'Santiago Nonualco' },
    { value: '21', label: 'Tapalhuaca' },
  ],
  '09': [
    { value: '01', label: 'Sensuntepeque' },
    { value: '02', label: 'Cinquera' },
    { value: '03', label: 'Dolores' },
    { value: '04', label: 'Guacotecti' },
    { value: '05', label: 'Ilobasco' },
    { value: '06', label: 'Jutiapa' },
    { value: '07', label: 'San Isidro' },
    { value: '08', label: 'Tejutepeque' },
    { value: '09', label: 'Victoria' },
  ],
  '10': [
    { value: '01', label: 'San Vicente' },
    { value: '02', label: 'Apastepeque' },
    { value: '03', label: 'Guadalupe' },
    { value: '04', label: 'San Cayetano Istepeque' },
    { value: '05', label: 'San Esteban Catarina' },
    { value: '06', label: 'San Ildefonso' },
    { value: '07', label: 'San Lorenzo' },
    { value: '08', label: 'San Sebastian' },
    { value: '09', label: 'Santa Clara' },
    { value: '10', label: 'Santo Domingo' },
    { value: '11', label: 'Tecoluca' },
    { value: '12', label: 'Tepetitan' },
    { value: '13', label: 'Verapaz' },
  ],
  '11': [
    { value: '01', label: 'Usulutan' },
    { value: '02', label: 'Alegria' },
    { value: '03', label: 'Berlin' },
    { value: '04', label: 'California' },
    { value: '05', label: 'Concepcion Batres' },
    { value: '06', label: 'El Triunfo' },
    { value: '07', label: 'Ereguayquin' },
    { value: '08', label: 'Estanzuelas' },
    { value: '09', label: 'Jiquilisco' },
    { value: '10', label: 'Jucuapa' },
    { value: '11', label: 'Jucuaran' },
    { value: '12', label: 'Mercedes Umana' },
    { value: '13', label: 'Nueva Granada' },
    { value: '14', label: 'Ozatlan' },
    { value: '15', label: 'Puerto El Triunfo' },
    { value: '16', label: 'San Agustin' },
    { value: '17', label: 'San Buenaventura' },
    { value: '18', label: 'San Dionisio' },
    { value: '19', label: 'San Francisco Javier' },
    { value: '20', label: 'Santa Elena' },
    { value: '21', label: 'Santa Maria' },
    { value: '22', label: 'Santiago de Maria' },
    { value: '23', label: 'Tecapan' },
  ],
  '12': [
    { value: '01', label: 'San Miguel' },
    { value: '02', label: 'Carolina' },
    { value: '03', label: 'Chapeltique' },
    { value: '04', label: 'Chinameca' },
    { value: '05', label: 'Chirilagua' },
    { value: '06', label: 'Ciudad Barrios' },
    { value: '07', label: 'Comacaran' },
    { value: '08', label: 'El Transito' },
    { value: '09', label: 'Lolotique' },
    { value: '10', label: 'Moncagua' },
    { value: '11', label: 'Nueva Guadalupe' },
    { value: '12', label: 'Nuevo Eden de San Juan' },
    { value: '13', label: 'Quelepa' },
    { value: '14', label: 'San Antonio' },
    { value: '15', label: 'San Gerardo' },
    { value: '16', label: 'San Jorge' },
    { value: '17', label: 'San Luis de la Reina' },
    { value: '18', label: 'San Rafael Oriente' },
    { value: '19', label: 'Sesori' },
    { value: '20', label: 'Uluazapa' },
  ],
  '13': [
    { value: '01', label: 'San Francisco Gotera' },
    { value: '02', label: 'Arambala' },
    { value: '03', label: 'Cacaopera' },
    { value: '04', label: 'Chilanga' },
    { value: '05', label: 'Corinto' },
    { value: '06', label: 'Delicias de Concepcion' },
    { value: '07', label: 'El Divisadero' },
    { value: '08', label: 'El Rosario' },
    { value: '09', label: 'Gualococti' },
    { value: '10', label: 'Guatajiagua' },
    { value: '11', label: 'Joateca' },
    { value: '12', label: 'Jocoaitique' },
    { value: '13', label: 'Jocoro' },
    { value: '14', label: 'Lolotiquillo' },
    { value: '15', label: 'Meanguera' },
    { value: '16', label: 'Osicala' },
    { value: '17', label: 'Perquin' },
    { value: '18', label: 'San Carlos' },
    { value: '19', label: 'San Fernando' },
    { value: '20', label: 'San Isidro' },
    { value: '21', label: 'San Simon' },
    { value: '22', label: 'Sensembra' },
    { value: '23', label: 'Sociedad' },
    { value: '24', label: 'Torola' },
    { value: '25', label: 'Yamabal' },
    { value: '26', label: 'Yoloaiquin' },
  ],
  '14': [
    { value: '01', label: 'La Union' },
    { value: '02', label: 'Anamoros' },
    { value: '03', label: 'Bolivar' },
    { value: '04', label: 'Concepcion de Oriente' },
    { value: '05', label: 'Conchagua' },
    { value: '06', label: 'El Carmen' },
    { value: '07', label: 'El Sauce' },
    { value: '08', label: 'Intipuca' },
    { value: '09', label: 'Lislique' },
    { value: '10', label: 'Meanguera del Golfo' },
    { value: '11', label: 'Nueva Esparta' },
    { value: '12', label: 'Pasaquina' },
    { value: '13', label: 'Poloros' },
    { value: '14', label: 'San Alejo' },
    { value: '15', label: 'San Jose' },
    { value: '16', label: 'Santa Rosa de Lima' },
    { value: '17', label: 'Yayantique' },
    { value: '18', label: 'Yucuaiquin' },
  ],
};

// Umbral legal para datos obligatorios segun Decreto No.94
const UMBRAL_DATOS_OBLIGATORIOS = 25000;

interface FormData {
  tipoDocumento: string;
  numDocumento: string;
  nombre: string;
  nrc: string;
  telefono: string;
  correo: string;
  departamento: string;
  municipio: string;
  complemento: string;
}

interface FormErrors {
  tipoDocumento?: string;
  numDocumento?: string;
  nombre?: string;
  nrc?: string;
  correo?: string;
  general?: string;
}

export function NuevoClienteModal({
  open,
  onClose,
  onCreated,
  tipoDte = '01',
  subtotal = 0,
}: NuevoClienteModalProps) {
  const [formData, setFormData] = React.useState<FormData>({
    tipoDocumento: '13',
    numDocumento: '',
    nombre: '',
    nrc: '',
    telefono: '',
    correo: '',
    departamento: '06',
    municipio: '15',
    complemento: '',
  });
  const [errors, setErrors] = React.useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [requiereDeducciones, setRequiereDeducciones] = React.useState(false);

  // Determinar si es Consumidor Final (tipo 01) o Credito Fiscal (tipo 03)
  const esConsumidorFinal = tipoDte === '01';
  const esCreditoFiscal = tipoDte === '03';

  // Para Consumidor Final, los datos son opcionales excepto si:
  // 1. El monto >= $25,000
  // 2. El cliente requiere factura para deducciones fiscales
  const datosOpcionales = esConsumidorFinal && subtotal < UMBRAL_DATOS_OBLIGATORIOS && !requiereDeducciones;

  // Reset form when modal opens
  React.useEffect(() => {
    if (open) {
      setFormData({
        tipoDocumento: esCreditoFiscal ? '36' : '13', // NIT para CCF, DUI para CF
        numDocumento: '',
        nombre: '',
        nrc: '',
        telefono: '',
        correo: '',
        departamento: '06',
        municipio: '15',
        complemento: '',
      });
      setErrors({});
      setRequiereDeducciones(false);
    }
  }, [open, esCreditoFiscal]);

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error on change
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Para Consumidor Final con datos opcionales, solo validar lo que tenga valor
    if (datosOpcionales) {
      // Solo validar formato si hay datos
      if (formData.numDocumento.trim()) {
        if (formData.tipoDocumento === '36') {
          const nitClean = formData.numDocumento.replace(/[^0-9]/g, '');
          if (nitClean.length !== 14 && nitClean.length !== 9) {
            newErrors.numDocumento = 'NIT debe tener 9 o 14 digitos';
          }
        } else if (formData.tipoDocumento === '13') {
          const duiClean = formData.numDocumento.replace(/[^0-9]/g, '');
          if (duiClean.length !== 9) {
            newErrors.numDocumento = 'DUI debe tener 9 digitos';
          }
        }
      }

      // Validar email si se proporciona
      if (formData.correo.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.correo)) {
          newErrors.correo = 'Correo no valido';
        }
      }
    } else {
      // Validacion completa para CCF o CF con monto alto
      if (!formData.tipoDocumento) {
        newErrors.tipoDocumento = 'Selecciona el tipo de documento';
      }

      if (!formData.numDocumento.trim()) {
        newErrors.numDocumento = 'Numero de documento requerido';
      } else {
        if (formData.tipoDocumento === '36') {
          const nitClean = formData.numDocumento.replace(/[^0-9]/g, '');
          if (nitClean.length !== 14 && nitClean.length !== 9) {
            newErrors.numDocumento = 'NIT debe tener 9 o 14 digitos';
          }
        } else if (formData.tipoDocumento === '13') {
          const duiClean = formData.numDocumento.replace(/[^0-9]/g, '');
          if (duiClean.length !== 9) {
            newErrors.numDocumento = 'DUI debe tener 9 digitos';
          }
        }
      }

      if (!formData.nombre.trim()) {
        newErrors.nombre = 'Nombre o razon social requerido';
      } else if (formData.nombre.trim().length < 3) {
        newErrors.nombre = 'Nombre debe tener al menos 3 caracteres';
      }

      // NRC SOLO requerido para Credito Fiscal (CCF)
      if (esCreditoFiscal && !formData.nrc.trim()) {
        newErrors.nrc = 'NRC requerido para Credito Fiscal';
      }

      // Validar email si se proporciona
      if (formData.correo.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.correo)) {
          newErrors.correo = 'Correo no valido';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';

      // Si es Consumidor Final sin datos, usar "Clientes varios"
      const nombreFinal = formData.nombre.trim() || 'Clientes varios';
      const numDocFinal = formData.numDocumento.trim() || '00000000-0';

      const response = await fetch(`${apiUrl}/api/v1/clientes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          tipoDocumento: formData.tipoDocumento,
          numDocumento: numDocFinal,
          nombre: nombreFinal,
          // NRC solo para Credito Fiscal
          nrc: esCreditoFiscal ? formData.nrc.trim() : undefined,
          telefono: formData.telefono.trim() || undefined,
          correo: formData.correo.trim() || undefined,
          direccion: {
            departamento: formData.departamento,
            municipio: formData.municipio,
            complemento: formData.complemento.trim() || 'El Salvador',
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al crear cliente');
      }

      const cliente = await response.json();
      onCreated(cliente);
      onClose();
    } catch (error) {
      setErrors({
        general: error instanceof Error ? error.message : 'Error al crear cliente',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler para factura rapida sin identificar cliente
  const handleFacturaRapida = () => {
    const clienteGenerico: Cliente = {
      id: 'temp-' + Date.now(),
      nombre: 'Clientes varios',
      tipoDocumento: '13',
      numDocumento: '00000000-0',
      direccion: {
        departamento: '06',
        municipio: '15',
        complemento: 'El Salvador',
      },
      createdAt: new Date().toISOString(),
    };
    onCreated(clienteGenerico);
    onClose();
  };

  const municipiosDisponibles = MUNICIPIOS[formData.departamento] || MUNICIPIOS['06'];
  const tiposDocDisponibles = esConsumidorFinal ? TIPOS_DOCUMENTO_CF : TIPOS_DOCUMENTO;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-lg bg-background border-border">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-lg">Nuevo Cliente</DialogTitle>
              <DialogDescription>
                {esConsumidorFinal
                  ? 'Cliente para Factura de Consumidor Final'
                  : 'Cliente para Credito Fiscal (CCF)'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {errors.general && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errors.general}</AlertDescription>
            </Alert>
          )}

          {/* Nota informativa para Consumidor Final */}
          {esConsumidorFinal && datosOpcionales && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Segun Decreto No.94, para facturas de consumidor final menores a $25,000,
                los datos del cliente son <strong>opcionales</strong>. Puedes emitir la factura
                sin identificar al cliente.
              </AlertDescription>
            </Alert>
          )}

          {/* Boton Factura Rapida para Consumidor Final */}
          {esConsumidorFinal && datosOpcionales && (
            <Button
              type="button"
              variant="outline"
              className="w-full border-primary/50 text-primary hover:bg-primary/10"
              onClick={handleFacturaRapida}
            >
              <Zap className="w-4 h-4 mr-2" />
              Factura Rapida (sin identificar cliente)
            </Button>
          )}

          {/* Checkbox para deducciones fiscales (solo CF) */}
          {esConsumidorFinal && subtotal < UMBRAL_DATOS_OBLIGATORIOS && (
            <div className="flex items-center space-x-2 p-3 rounded-lg bg-muted/50">
              <Checkbox
                id="deducciones"
                checked={requiereDeducciones}
                onCheckedChange={(checked) => setRequiereDeducciones(checked === true)}
              />
              <Label htmlFor="deducciones" className="text-sm cursor-pointer">
                El cliente requiere esta factura para deducciones fiscales
              </Label>
            </div>
          )}

          {/* Tipo de documento y numero */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Tipo de Documento {!datosOpcionales && '*'}
              </label>
              <Select
                value={formData.tipoDocumento}
                onValueChange={(value) => handleChange('tipoDocumento', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {tiposDocDisponibles.map((tipo) => (
                    <SelectItem key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.tipoDocumento && (
                <p className="text-xs text-destructive">{errors.tipoDocumento}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Numero de Documento {!datosOpcionales && '*'}
              </label>
              <Input
                value={formData.numDocumento}
                onChange={(e) => handleChange('numDocumento', e.target.value)}
                placeholder={formData.tipoDocumento === '36' ? '0614-123456-101-2' : '01234567-8'}
              />
              {errors.numDocumento && (
                <p className="text-xs text-destructive">{errors.numDocumento}</p>
              )}
            </div>
          </div>

          {/* Nombre */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Nombre / Razon Social {!datosOpcionales && '*'}
            </label>
            <Input
              value={formData.nombre}
              onChange={(e) => handleChange('nombre', e.target.value)}
              placeholder={datosOpcionales ? 'Opcional - se usara "Clientes varios"' : 'Nombre completo o razon social'}
            />
            {errors.nombre && <p className="text-xs text-destructive">{errors.nombre}</p>}
          </div>

          {/* NRC - SOLO para Credito Fiscal */}
          {esCreditoFiscal && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  NRC *
                </label>
                <Input
                  value={formData.nrc}
                  onChange={(e) => handleChange('nrc', e.target.value)}
                  placeholder="1234567"
                />
                {errors.nrc && <p className="text-xs text-destructive">{errors.nrc}</p>}
                <p className="text-xs text-muted-foreground">
                  Numero de Registro de Contribuyente
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Telefono</label>
                <Input
                  value={formData.telefono}
                  onChange={(e) => handleChange('telefono', e.target.value)}
                  placeholder="2222-3333"
                />
              </div>
            </div>
          )}

          {/* Telefono para Consumidor Final */}
          {esConsumidorFinal && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Telefono</label>
              <Input
                value={formData.telefono}
                onChange={(e) => handleChange('telefono', e.target.value)}
                placeholder="2222-3333 (opcional)"
              />
            </div>
          )}

          {/* Email */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Correo Electronico</label>
            <Input
              type="email"
              value={formData.correo}
              onChange={(e) => handleChange('correo', e.target.value)}
              placeholder="correo@ejemplo.com (opcional)"
            />
            {errors.correo && <p className="text-xs text-destructive">{errors.correo}</p>}
          </div>

          {/* Direccion */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Departamento</label>
              <Select
                value={formData.departamento}
                onValueChange={(value) => {
                  handleChange('departamento', value);
                  // Reset municipio when department changes
                  const muns = MUNICIPIOS[value];
                  if (muns && muns.length > 0) {
                    setFormData((prev) => ({ ...prev, municipio: muns[0].value }));
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  {DEPARTAMENTOS.map((depto) => (
                    <SelectItem key={depto.value} value={depto.value}>
                      {depto.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Municipio</label>
              <Select
                value={formData.municipio}
                onValueChange={(value) => handleChange('municipio', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  {municipiosDisponibles.map((muni) => (
                    <SelectItem key={muni.value} value={muni.value}>
                      {muni.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Direccion Complementaria
            </label>
            <Input
              value={formData.complemento}
              onChange={(e) => handleChange('complemento', e.target.value)}
              placeholder="Colonia, calle, numero... (opcional)"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creando...
              </>
            ) : (
              'Crear Cliente'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
