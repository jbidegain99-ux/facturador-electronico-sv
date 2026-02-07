'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MaskedInput } from '@/components/ui/masked-input';

// Catálogo de Departamentos de El Salvador
const DEPARTAMENTOS = [
  { codigo: '01', nombre: 'Ahuachapán' },
  { codigo: '02', nombre: 'Santa Ana' },
  { codigo: '03', nombre: 'Sonsonate' },
  { codigo: '04', nombre: 'Chalatenango' },
  { codigo: '05', nombre: 'La Libertad' },
  { codigo: '06', nombre: 'San Salvador' },
  { codigo: '07', nombre: 'Cuscatlán' },
  { codigo: '08', nombre: 'La Paz' },
  { codigo: '09', nombre: 'Cabañas' },
  { codigo: '10', nombre: 'San Vicente' },
  { codigo: '11', nombre: 'Usulután' },
  { codigo: '12', nombre: 'San Miguel' },
  { codigo: '13', nombre: 'Morazán' },
  { codigo: '14', nombre: 'La Unión' },
];

// Catálogo de Municipios por Departamento
const MUNICIPIOS: Record<string, { codigo: string; nombre: string }[]> = {
  '01': [ // Ahuachapán
    { codigo: '01', nombre: 'Ahuachapán' },
    { codigo: '02', nombre: 'Apaneca' },
    { codigo: '03', nombre: 'Atiquizaya' },
    { codigo: '04', nombre: 'Concepción de Ataco' },
    { codigo: '05', nombre: 'El Refugio' },
    { codigo: '06', nombre: 'Guaymango' },
    { codigo: '07', nombre: 'Jujutla' },
    { codigo: '08', nombre: 'San Francisco Menéndez' },
    { codigo: '09', nombre: 'San Lorenzo' },
    { codigo: '10', nombre: 'San Pedro Puxtla' },
    { codigo: '11', nombre: 'Tacuba' },
    { codigo: '12', nombre: 'Turín' },
  ],
  '02': [ // Santa Ana
    { codigo: '01', nombre: 'Candelaria de la Frontera' },
    { codigo: '02', nombre: 'Chalchuapa' },
    { codigo: '03', nombre: 'Coatepeque' },
    { codigo: '04', nombre: 'El Congo' },
    { codigo: '05', nombre: 'El Porvenir' },
    { codigo: '06', nombre: 'Masahuat' },
    { codigo: '07', nombre: 'Metapán' },
    { codigo: '08', nombre: 'San Antonio Pajonal' },
    { codigo: '09', nombre: 'San Sebastián Salitrillo' },
    { codigo: '10', nombre: 'Santa Ana' },
    { codigo: '11', nombre: 'Santa Rosa Guachipilín' },
    { codigo: '12', nombre: 'Santiago de la Frontera' },
    { codigo: '13', nombre: 'Texistepeque' },
  ],
  '03': [ // Sonsonate
    { codigo: '01', nombre: 'Acajutla' },
    { codigo: '02', nombre: 'Armenia' },
    { codigo: '03', nombre: 'Caluco' },
    { codigo: '04', nombre: 'Cuisnahuat' },
    { codigo: '05', nombre: 'Izalco' },
    { codigo: '06', nombre: 'Juayúa' },
    { codigo: '07', nombre: 'Nahuizalco' },
    { codigo: '08', nombre: 'Nahulingo' },
    { codigo: '09', nombre: 'Salcoatitán' },
    { codigo: '10', nombre: 'San Antonio del Monte' },
    { codigo: '11', nombre: 'San Julián' },
    { codigo: '12', nombre: 'Santa Catarina Masahuat' },
    { codigo: '13', nombre: 'Santa Isabel Ishuatán' },
    { codigo: '14', nombre: 'Santo Domingo de Guzmán' },
    { codigo: '15', nombre: 'Sonsonate' },
    { codigo: '16', nombre: 'Sonzacate' },
  ],
  '04': [ // Chalatenango
    { codigo: '01', nombre: 'Agua Caliente' },
    { codigo: '02', nombre: 'Arcatao' },
    { codigo: '03', nombre: 'Azacualpa' },
    { codigo: '04', nombre: 'Chalatenango' },
    { codigo: '05', nombre: 'Citalá' },
    { codigo: '06', nombre: 'Comalapa' },
    { codigo: '07', nombre: 'Concepción Quezaltepeque' },
    { codigo: '08', nombre: 'Dulce Nombre de María' },
    { codigo: '09', nombre: 'El Carrizal' },
    { codigo: '10', nombre: 'El Paraíso' },
    { codigo: '11', nombre: 'La Laguna' },
    { codigo: '12', nombre: 'La Palma' },
    { codigo: '13', nombre: 'La Reina' },
    { codigo: '14', nombre: 'Las Vueltas' },
    { codigo: '15', nombre: 'Nueva Concepción' },
    { codigo: '16', nombre: 'Nueva Trinidad' },
    { codigo: '17', nombre: 'Ojos de Agua' },
    { codigo: '18', nombre: 'Potonico' },
    { codigo: '19', nombre: 'San Antonio de la Cruz' },
    { codigo: '20', nombre: 'San Antonio Los Ranchos' },
    { codigo: '21', nombre: 'San Fernando' },
    { codigo: '22', nombre: 'San Francisco Lempa' },
    { codigo: '23', nombre: 'San Francisco Morazán' },
    { codigo: '24', nombre: 'San Ignacio' },
    { codigo: '25', nombre: 'San Isidro Labrador' },
    { codigo: '26', nombre: 'San José Cancasque' },
    { codigo: '27', nombre: 'San José Las Flores' },
    { codigo: '28', nombre: 'San Luis del Carmen' },
    { codigo: '29', nombre: 'San Miguel de Mercedes' },
    { codigo: '30', nombre: 'San Rafael' },
    { codigo: '31', nombre: 'Santa Rita' },
    { codigo: '32', nombre: 'Tejutla' },
  ],
  '05': [ // La Libertad
    { codigo: '01', nombre: 'Antiguo Cuscatlán' },
    { codigo: '02', nombre: 'Chiltiupán' },
    { codigo: '03', nombre: 'Ciudad Arce' },
    { codigo: '04', nombre: 'Colón' },
    { codigo: '05', nombre: 'Comasagua' },
    { codigo: '06', nombre: 'Huizúcar' },
    { codigo: '07', nombre: 'Jayaque' },
    { codigo: '08', nombre: 'Jicalapa' },
    { codigo: '09', nombre: 'La Libertad' },
    { codigo: '10', nombre: 'Santa Tecla' },
    { codigo: '11', nombre: 'Nuevo Cuscatlán' },
    { codigo: '12', nombre: 'San Juan Opico' },
    { codigo: '13', nombre: 'Quezaltepeque' },
    { codigo: '14', nombre: 'Sacacoyo' },
    { codigo: '15', nombre: 'San José Villanueva' },
    { codigo: '16', nombre: 'San Matías' },
    { codigo: '17', nombre: 'San Pablo Tacachico' },
    { codigo: '18', nombre: 'Talnique' },
    { codigo: '19', nombre: 'Tamanique' },
    { codigo: '20', nombre: 'Teotepeque' },
    { codigo: '21', nombre: 'Tepecoyo' },
    { codigo: '22', nombre: 'Zaragoza' },
  ],
  '06': [ // San Salvador
    { codigo: '01', nombre: 'Aguilares' },
    { codigo: '02', nombre: 'Apopa' },
    { codigo: '03', nombre: 'Ayutuxtepeque' },
    { codigo: '04', nombre: 'Cuscatancingo' },
    { codigo: '05', nombre: 'Delgado' },
    { codigo: '06', nombre: 'El Paisnal' },
    { codigo: '07', nombre: 'Guazapa' },
    { codigo: '08', nombre: 'Ilopango' },
    { codigo: '09', nombre: 'Mejicanos' },
    { codigo: '10', nombre: 'Nejapa' },
    { codigo: '11', nombre: 'Panchimalco' },
    { codigo: '12', nombre: 'Rosario de Mora' },
    { codigo: '13', nombre: 'San Marcos' },
    { codigo: '14', nombre: 'San Martín' },
    { codigo: '15', nombre: 'San Salvador' },
    { codigo: '16', nombre: 'Santiago Texacuangos' },
    { codigo: '17', nombre: 'Santo Tomás' },
    { codigo: '18', nombre: 'Soyapango' },
    { codigo: '19', nombre: 'Tonacatepeque' },
  ],
  '07': [ // Cuscatlán
    { codigo: '01', nombre: 'Candelaria' },
    { codigo: '02', nombre: 'Cojutepeque' },
    { codigo: '03', nombre: 'El Carmen' },
    { codigo: '04', nombre: 'El Rosario' },
    { codigo: '05', nombre: 'Monte San Juan' },
    { codigo: '06', nombre: 'Oratorio de Concepción' },
    { codigo: '07', nombre: 'San Bartolomé Perulapía' },
    { codigo: '08', nombre: 'San Cristóbal' },
    { codigo: '09', nombre: 'San José Guayabal' },
    { codigo: '10', nombre: 'San Pedro Perulapán' },
    { codigo: '11', nombre: 'San Rafael Cedros' },
    { codigo: '12', nombre: 'San Ramón' },
    { codigo: '13', nombre: 'Santa Cruz Analquito' },
    { codigo: '14', nombre: 'Santa Cruz Michapa' },
    { codigo: '15', nombre: 'Suchitoto' },
    { codigo: '16', nombre: 'Tenancingo' },
  ],
  '08': [ // La Paz
    { codigo: '01', nombre: 'Cuyultitán' },
    { codigo: '02', nombre: 'El Rosario' },
    { codigo: '03', nombre: 'Jerusalén' },
    { codigo: '04', nombre: 'Mercedes La Ceiba' },
    { codigo: '05', nombre: 'Olocuilta' },
    { codigo: '06', nombre: 'Paraíso de Osorio' },
    { codigo: '07', nombre: 'San Antonio Masahuat' },
    { codigo: '08', nombre: 'San Emigdio' },
    { codigo: '09', nombre: 'San Francisco Chinameca' },
    { codigo: '10', nombre: 'San Juan Nonualco' },
    { codigo: '11', nombre: 'San Juan Talpa' },
    { codigo: '12', nombre: 'San Juan Tepezontes' },
    { codigo: '13', nombre: 'San Luis La Herradura' },
    { codigo: '14', nombre: 'San Luis Talpa' },
    { codigo: '15', nombre: 'San Miguel Tepezontes' },
    { codigo: '16', nombre: 'San Pedro Masahuat' },
    { codigo: '17', nombre: 'San Pedro Nonualco' },
    { codigo: '18', nombre: 'San Rafael Obrajuelo' },
    { codigo: '19', nombre: 'Santa María Ostuma' },
    { codigo: '20', nombre: 'Santiago Nonualco' },
    { codigo: '21', nombre: 'Tapalhuaca' },
    { codigo: '22', nombre: 'Zacatecoluca' },
  ],
  '09': [ // Cabañas
    { codigo: '01', nombre: 'Cinquera' },
    { codigo: '02', nombre: 'Guacotecti' },
    { codigo: '03', nombre: 'Ilobasco' },
    { codigo: '04', nombre: 'Jutiapa' },
    { codigo: '05', nombre: 'San Isidro' },
    { codigo: '06', nombre: 'Sensuntepeque' },
    { codigo: '07', nombre: 'Tejutepeque' },
    { codigo: '08', nombre: 'Victoria' },
    { codigo: '09', nombre: 'Dolores' },
  ],
  '10': [ // San Vicente
    { codigo: '01', nombre: 'Apastepeque' },
    { codigo: '02', nombre: 'Guadalupe' },
    { codigo: '03', nombre: 'San Cayetano Istepeque' },
    { codigo: '04', nombre: 'San Esteban Catarina' },
    { codigo: '05', nombre: 'San Ildefonso' },
    { codigo: '06', nombre: 'San Lorenzo' },
    { codigo: '07', nombre: 'San Sebastián' },
    { codigo: '08', nombre: 'San Vicente' },
    { codigo: '09', nombre: 'Santa Clara' },
    { codigo: '10', nombre: 'Santo Domingo' },
    { codigo: '11', nombre: 'Tecoluca' },
    { codigo: '12', nombre: 'Tepetitán' },
    { codigo: '13', nombre: 'Verapaz' },
  ],
  '11': [ // Usulután
    { codigo: '01', nombre: 'Alegría' },
    { codigo: '02', nombre: 'Berlín' },
    { codigo: '03', nombre: 'California' },
    { codigo: '04', nombre: 'Concepción Batres' },
    { codigo: '05', nombre: 'El Triunfo' },
    { codigo: '06', nombre: 'Ereguayquín' },
    { codigo: '07', nombre: 'Estanzuelas' },
    { codigo: '08', nombre: 'Jiquilisco' },
    { codigo: '09', nombre: 'Jucuapa' },
    { codigo: '10', nombre: 'Jucuarán' },
    { codigo: '11', nombre: 'Mercedes Umaña' },
    { codigo: '12', nombre: 'Nueva Granada' },
    { codigo: '13', nombre: 'Ozatlán' },
    { codigo: '14', nombre: 'Puerto El Triunfo' },
    { codigo: '15', nombre: 'San Agustín' },
    { codigo: '16', nombre: 'San Buenaventura' },
    { codigo: '17', nombre: 'San Dionisio' },
    { codigo: '18', nombre: 'San Francisco Javier' },
    { codigo: '19', nombre: 'Santa Elena' },
    { codigo: '20', nombre: 'Santa María' },
    { codigo: '21', nombre: 'Santiago de María' },
    { codigo: '22', nombre: 'Tecapán' },
    { codigo: '23', nombre: 'Usulután' },
  ],
  '12': [ // San Miguel
    { codigo: '01', nombre: 'Carolina' },
    { codigo: '02', nombre: 'Chapeltique' },
    { codigo: '03', nombre: 'Chinameca' },
    { codigo: '04', nombre: 'Chirilagua' },
    { codigo: '05', nombre: 'Ciudad Barrios' },
    { codigo: '06', nombre: 'Comacarán' },
    { codigo: '07', nombre: 'El Tránsito' },
    { codigo: '08', nombre: 'Lolotique' },
    { codigo: '09', nombre: 'Moncagua' },
    { codigo: '10', nombre: 'Nueva Guadalupe' },
    { codigo: '11', nombre: 'Nuevo Edén de San Juan' },
    { codigo: '12', nombre: 'Quelepa' },
    { codigo: '13', nombre: 'San Antonio' },
    { codigo: '14', nombre: 'San Gerardo' },
    { codigo: '15', nombre: 'San Jorge' },
    { codigo: '16', nombre: 'San Luis de la Reina' },
    { codigo: '17', nombre: 'San Miguel' },
    { codigo: '18', nombre: 'San Rafael Oriente' },
    { codigo: '19', nombre: 'Sesori' },
    { codigo: '20', nombre: 'Uluazapa' },
  ],
  '13': [ // Morazán
    { codigo: '01', nombre: 'Arambala' },
    { codigo: '02', nombre: 'Cacaopera' },
    { codigo: '03', nombre: 'Chilanga' },
    { codigo: '04', nombre: 'Corinto' },
    { codigo: '05', nombre: 'Delicias de Concepción' },
    { codigo: '06', nombre: 'El Divisadero' },
    { codigo: '07', nombre: 'El Rosario' },
    { codigo: '08', nombre: 'Gualococti' },
    { codigo: '09', nombre: 'Guatajiagua' },
    { codigo: '10', nombre: 'Joateca' },
    { codigo: '11', nombre: 'Jocoaitique' },
    { codigo: '12', nombre: 'Jocoro' },
    { codigo: '13', nombre: 'Lolotiquillo' },
    { codigo: '14', nombre: 'Meanguera' },
    { codigo: '15', nombre: 'Osicala' },
    { codigo: '16', nombre: 'Perquín' },
    { codigo: '17', nombre: 'San Carlos' },
    { codigo: '18', nombre: 'San Fernando' },
    { codigo: '19', nombre: 'San Francisco Gotera' },
    { codigo: '20', nombre: 'San Isidro' },
    { codigo: '21', nombre: 'San Simón' },
    { codigo: '22', nombre: 'Sensembra' },
    { codigo: '23', nombre: 'Sociedad' },
    { codigo: '24', nombre: 'Torola' },
    { codigo: '25', nombre: 'Yamabal' },
    { codigo: '26', nombre: 'Yoloaiquín' },
  ],
  '14': [ // La Unión
    { codigo: '01', nombre: 'Anamorós' },
    { codigo: '02', nombre: 'Bolívar' },
    { codigo: '03', nombre: 'Concepción de Oriente' },
    { codigo: '04', nombre: 'Conchagua' },
    { codigo: '05', nombre: 'El Carmen' },
    { codigo: '06', nombre: 'El Sauce' },
    { codigo: '07', nombre: 'Intipucá' },
    { codigo: '08', nombre: 'La Unión' },
    { codigo: '09', nombre: 'Lilisque' },
    { codigo: '10', nombre: 'Meanguera del Golfo' },
    { codigo: '11', nombre: 'Nueva Esparta' },
    { codigo: '12', nombre: 'Pasaquina' },
    { codigo: '13', nombre: 'Polorós' },
    { codigo: '14', nombre: 'San Alejo' },
    { codigo: '15', nombre: 'San José' },
    { codigo: '16', nombre: 'Santa Rosa de Lima' },
    { codigo: '17', nombre: 'Yayantique' },
    { codigo: '18', nombre: 'Yucuaiquín' },
  ],
};

// Catálogo de Actividades Económicas (principales)
const ACTIVIDADES_ECONOMICAS = [
  { codigo: '01111', descripcion: 'Cultivo de cereales (excepto arroz), legumbres y semillas oleaginosas' },
  { codigo: '10101', descripcion: 'Elaboración y conservación de carne' },
  { codigo: '41001', descripcion: 'Construcción de edificios' },
  { codigo: '45101', descripcion: 'Venta de vehículos automotores' },
  { codigo: '46101', descripcion: 'Venta al por mayor a cambio de una comisión o por contrato' },
  { codigo: '46201', descripcion: 'Venta al por mayor de materias primas agropecuarias y animales vivos' },
  { codigo: '46311', descripcion: 'Venta al por mayor de frutas y verduras' },
  { codigo: '46321', descripcion: 'Venta al por mayor de carne y productos cárnicos' },
  { codigo: '46391', descripcion: 'Venta al por mayor de alimentos n.c.p.' },
  { codigo: '46411', descripcion: 'Venta al por mayor de productos textiles' },
  { codigo: '46491', descripcion: 'Venta al por mayor de otros enseres domésticos' },
  { codigo: '46511', descripcion: 'Venta al por mayor de computadoras y equipo periférico' },
  { codigo: '46521', descripcion: 'Venta al por mayor de equipo electrónico y de telecomunicaciones' },
  { codigo: '46591', descripcion: 'Venta al por mayor de maquinaria y equipo n.c.p.' },
  { codigo: '46901', descripcion: 'Venta al por mayor de otros productos' },
  { codigo: '47111', descripcion: 'Venta al por menor en almacenes no especializados' },
  { codigo: '47191', descripcion: 'Otras actividades de venta al por menor en almacenes no especializados' },
  { codigo: '47211', descripcion: 'Venta al por menor de frutas y verduras' },
  { codigo: '47221', descripcion: 'Venta al por menor de carne y productos cárnicos' },
  { codigo: '47301', descripcion: 'Venta al por menor de combustibles' },
  { codigo: '47411', descripcion: 'Venta al por menor de computadoras y equipo periférico' },
  { codigo: '47421', descripcion: 'Venta al por menor de equipo de sonido y video' },
  { codigo: '47511', descripcion: 'Venta al por menor de productos textiles' },
  { codigo: '47521', descripcion: 'Venta al por menor de artículos de ferretería' },
  { codigo: '47591', descripcion: 'Venta al por menor de muebles y equipo de iluminación' },
  { codigo: '47611', descripcion: 'Venta al por menor de libros' },
  { codigo: '47711', descripcion: 'Venta al por menor de prendas de vestir' },
  { codigo: '47721', descripcion: 'Venta al por menor de calzado' },
  { codigo: '47731', descripcion: 'Venta al por menor de productos farmacéuticos' },
  { codigo: '47741', descripcion: 'Venta al por menor de artículos médicos y ortopédicos' },
  { codigo: '47751', descripcion: 'Venta al por menor de cosméticos y artículos de tocador' },
  { codigo: '47911', descripcion: 'Venta al por menor por correo o por internet' },
  { codigo: '49111', descripcion: 'Transporte interurbano de pasajeros por ferrocarril' },
  { codigo: '49211', descripcion: 'Transporte urbano y suburbano de pasajeros' },
  { codigo: '49221', descripcion: 'Otras actividades de transporte de pasajeros' },
  { codigo: '49231', descripcion: 'Transporte de carga por carretera' },
  { codigo: '55101', descripcion: 'Actividades de alojamiento para estancias cortas' },
  { codigo: '56101', descripcion: 'Actividades de restaurantes y de servicio móvil de comidas' },
  { codigo: '56291', descripcion: 'Otras actividades de servicio de comidas' },
  { codigo: '56301', descripcion: 'Actividades de servicio de bebidas' },
  { codigo: '62011', descripcion: 'Actividades de programación informática' },
  { codigo: '62021', descripcion: 'Actividades de consultoría informática' },
  { codigo: '62091', descripcion: 'Otras actividades de tecnología de la información' },
  { codigo: '63111', descripcion: 'Procesamiento de datos, hospedaje y actividades conexas' },
  { codigo: '69101', descripcion: 'Actividades jurídicas' },
  { codigo: '69201', descripcion: 'Actividades de contabilidad, teneduría de libros y auditoría' },
  { codigo: '70101', descripcion: 'Actividades de oficinas principales' },
  { codigo: '70201', descripcion: 'Actividades de consultoría de gestión' },
  { codigo: '71101', descripcion: 'Actividades de arquitectura e ingeniería' },
  { codigo: '73111', descripcion: 'Agencias de publicidad' },
  { codigo: '74101', descripcion: 'Actividades especializadas de diseño' },
  { codigo: '74201', descripcion: 'Actividades de fotografía' },
  { codigo: '82111', descripcion: 'Actividades combinadas de servicios administrativos de oficina' },
  { codigo: '85101', descripcion: 'Enseñanza preescolar y primaria' },
  { codigo: '85211', descripcion: 'Enseñanza secundaria de formación general' },
  { codigo: '85301', descripcion: 'Enseñanza superior' },
  { codigo: '86101', descripcion: 'Actividades de hospitales' },
  { codigo: '86201', descripcion: 'Actividades de médicos y odontólogos' },
  { codigo: '86901', descripcion: 'Otras actividades de atención de la salud humana' },
  { codigo: '96011', descripcion: 'Lavado y limpieza de prendas de tela y de piel' },
  { codigo: '96021', descripcion: 'Peluquería y otros tratamientos de belleza' },
  { codigo: '96091', descripcion: 'Otras actividades de servicios personales n.c.p.' },
];

function CharCounter({ length, max }: { length: number; max: number }) {
  const isNearLimit = length > max * 0.9;
  return (
    <span className={`text-xs ${isNearLimit ? 'text-red-500' : 'text-gray-400'}`}>
      {length}/{max}
    </span>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [municipiosDisponibles, setMunicipiosDisponibles] = useState<{ codigo: string; nombre: string }[]>([]);

  const [formData, setFormData] = useState({
    // Datos de la empresa
    nombre: '',
    nit: '',
    nrc: '',
    actividadEcon: '',
    descActividad: '',
    telefono: '',
    correo: '',
    nombreComercial: '',
    // Direccion
    departamento: '',
    municipio: '',
    complemento: '',
    // Usuario administrador
    adminNombre: '',
    adminEmail: '',
    adminPassword: '',
    adminPasswordConfirm: '',
  });

  // Actualizar municipios cuando cambie el departamento
  useEffect(() => {
    if (formData.departamento) {
      setMunicipiosDisponibles(MUNICIPIOS[formData.departamento] || []);
      setFormData(prev => ({ ...prev, municipio: '' }));
    } else {
      setMunicipiosDisponibles([]);
    }
  }, [formData.departamento]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    // Si es actividad económica, también guardar la descripción
    if (name === 'actividadEcon') {
      const actividad = ACTIVIDADES_ECONOMICAS.find(a => a.codigo === value);
      setFormData(prev => ({
        ...prev,
        actividadEcon: value,
        descActividad: actividad?.descripcion || ''
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.adminPassword !== formData.adminPasswordConfirm) {
      setError('Las contrasenas no coinciden');
      setLoading(false);
      return;
    }

    // Validate empresa and admin emails are different
    if (formData.correo.toLowerCase().trim() === formData.adminEmail.toLowerCase().trim()) {
      setError('El correo de la empresa y el correo del administrador deben ser diferentes');
      setLoading(false);
      return;
    }

    // Obtener nombres de departamento y municipio
    const departamentoObj = DEPARTAMENTOS.find(d => d.codigo === formData.departamento);
    const municipioObj = municipiosDisponibles.find(m => m.codigo === formData.municipio);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant: {
            nombre: formData.nombre,
            nit: formData.nit,
            nrc: formData.nrc,
            actividadEcon: formData.actividadEcon,
            descActividad: formData.descActividad,
            telefono: formData.telefono,
            correo: formData.correo,
            nombreComercial: formData.nombreComercial || null,
            direccion: {
              departamento: departamentoObj?.codigo || formData.departamento,
              municipio: municipioObj?.codigo || formData.municipio,
              complemento: formData.complemento,
            },
          },
          user: {
            nombre: formData.adminNombre,
            email: formData.adminEmail,
            password: formData.adminPassword,
          },
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Error al registrar');
      }

      setSuccess(true);
      setTimeout(() => router.push('/login'), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrar');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen flex-col justify-center px-6 py-12 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="rounded-md bg-green-50 p-4">
            <p className="text-center text-green-700">
              Registro exitoso! Redirigiendo al login...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col justify-center px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl">
        <h2 className="mt-6 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
          Registrar Empresa
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Complete los datos de su empresa para comenzar a facturar
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-2xl">
        <form className="space-y-6 bg-white p-8 shadow rounded-lg" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Datos de la Empresa */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Datos de la Empresa</h3>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <div className="flex justify-between items-center">
                  <label htmlFor="nombre" className="block text-sm font-medium text-gray-700">
                    Razon Social *
                  </label>
                  <CharCounter length={formData.nombre.length} max={200} />
                </div>
                <input
                  type="text"
                  name="nombre"
                  id="nombre"
                  required
                  maxLength={200}
                  value={formData.nombre}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-3 py-2 border bg-white text-gray-900"
                />
              </div>
              <div>
                <label htmlFor="nombreComercial" className="block text-sm font-medium text-gray-700">
                  Nombre Comercial
                </label>
                <input
                  type="text"
                  name="nombreComercial"
                  id="nombreComercial"
                  maxLength={200}
                  value={formData.nombreComercial}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-3 py-2 border bg-white text-gray-900"
                />
              </div>
              <div>
                <label htmlFor="nit" className="block text-sm font-medium text-gray-700">
                  NIT *
                </label>
                <MaskedInput
                  mask="9999-999999-999-9"
                  id="nit"
                  name="nit"
                  required
                  placeholder="0000-000000-000-0"
                  value={formData.nit}
                  onValueChange={(masked) => setFormData(prev => ({ ...prev, nit: masked }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-3 py-2 border bg-white text-gray-900"
                />
              </div>
              <div>
                <label htmlFor="nrc" className="block text-sm font-medium text-gray-700">
                  NRC *
                </label>
                <MaskedInput
                  mask="999999-9"
                  id="nrc"
                  name="nrc"
                  required
                  placeholder="000000-0"
                  value={formData.nrc}
                  onValueChange={(masked) => setFormData(prev => ({ ...prev, nrc: masked }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-3 py-2 border bg-white text-gray-900"
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="actividadEcon" className="block text-sm font-medium text-gray-700">
                  Actividad Economica *
                </label>
                <select
                  name="actividadEcon"
                  id="actividadEcon"
                  required
                  value={formData.actividadEcon}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-3 py-2 border bg-white text-gray-900"
                >
                  <option value="">Seleccione una actividad</option>
                  {ACTIVIDADES_ECONOMICAS.map((act) => (
                    <option key={act.codigo} value={act.codigo}>
                      {act.codigo} - {act.descripcion}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="telefono" className="block text-sm font-medium text-gray-700">
                  Telefono *
                </label>
                <MaskedInput
                  mask="9999-9999"
                  id="telefono"
                  name="telefono"
                  required
                  placeholder="0000-0000"
                  value={formData.telefono}
                  onValueChange={(masked) => setFormData(prev => ({ ...prev, telefono: masked }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-3 py-2 border bg-white text-gray-900"
                />
              </div>
              <div>
                <label htmlFor="correo" className="block text-sm font-medium text-gray-700">
                  Correo de la Empresa *
                </label>
                <input
                  type="email"
                  name="correo"
                  id="correo"
                  required
                  maxLength={100}
                  value={formData.correo}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-3 py-2 border bg-white text-gray-900"
                />
              </div>
            </div>
          </div>

          {/* Direccion */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Direccion</h3>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="departamento" className="block text-sm font-medium text-gray-700">
                  Departamento *
                </label>
                <select
                  name="departamento"
                  id="departamento"
                  required
                  value={formData.departamento}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-3 py-2 border bg-white text-gray-900"
                >
                  <option value="">Seleccione un departamento</option>
                  {DEPARTAMENTOS.map((dep) => (
                    <option key={dep.codigo} value={dep.codigo}>
                      {dep.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="municipio" className="block text-sm font-medium text-gray-700">
                  Municipio *
                </label>
                <select
                  name="municipio"
                  id="municipio"
                  required
                  value={formData.municipio}
                  onChange={handleChange}
                  disabled={!formData.departamento}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-3 py-2 border bg-white text-gray-900 disabled:bg-gray-100"
                >
                  <option value="">
                    {formData.departamento ? 'Seleccione un municipio' : 'Primero seleccione departamento'}
                  </option>
                  {municipiosDisponibles.map((mun) => (
                    <option key={mun.codigo} value={mun.codigo}>
                      {mun.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <div className="flex justify-between items-center">
                  <label htmlFor="complemento" className="block text-sm font-medium text-gray-700">
                    Direccion Completa *
                  </label>
                  <CharCounter length={formData.complemento.length} max={500} />
                </div>
                <input
                  type="text"
                  name="complemento"
                  id="complemento"
                  required
                  maxLength={500}
                  placeholder="Calle, numero, colonia, etc."
                  value={formData.complemento}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-3 py-2 border bg-white text-gray-900"
                />
              </div>
            </div>
          </div>

          {/* Usuario Administrador */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Usuario Administrador</h3>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="adminNombre" className="block text-sm font-medium text-gray-700">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  name="adminNombre"
                  id="adminNombre"
                  required
                  maxLength={200}
                  value={formData.adminNombre}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-3 py-2 border bg-white text-gray-900"
                />
              </div>
              <div>
                <label htmlFor="adminEmail" className="block text-sm font-medium text-gray-700">
                  Correo Electronico *
                </label>
                <input
                  type="email"
                  name="adminEmail"
                  id="adminEmail"
                  required
                  maxLength={100}
                  value={formData.adminEmail}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-3 py-2 border bg-white text-gray-900"
                />
              </div>
              <div>
                <label htmlFor="adminPassword" className="block text-sm font-medium text-gray-700">
                  Contrasena *
                </label>
                <input
                  type="password"
                  name="adminPassword"
                  id="adminPassword"
                  required
                  minLength={8}
                  maxLength={128}
                  value={formData.adminPassword}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-3 py-2 border bg-white text-gray-900"
                />
              </div>
              <div>
                <label htmlFor="adminPasswordConfirm" className="block text-sm font-medium text-gray-700">
                  Confirmar Contrasena *
                </label>
                <input
                  type="password"
                  name="adminPasswordConfirm"
                  id="adminPasswordConfirm"
                  required
                  minLength={8}
                  maxLength={128}
                  value={formData.adminPasswordConfirm}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-3 py-2 border bg-white text-gray-900"
                />
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="flex w-full justify-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50"
            >
              {loading ? 'Registrando...' : 'Registrar Empresa'}
            </button>
          </div>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Ya tienes cuenta?{' '}
          <Link href="/login" className="font-semibold leading-6 text-primary hover:text-primary/80">
            Iniciar Sesion
          </Link>
        </p>
      </div>
    </div>
  );
}
