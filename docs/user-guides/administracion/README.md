# Guia de Administracion - Facturosv

Bienvenido a la guia de administracion de Facturosv. Esta documentacion esta dirigida a usuarios con rol **ADMIN** (administrador de empresa) y cubre todas las funciones de gestion de su cuenta.

## Contenido

| Seccion | Descripcion |
|---------|-------------|
| [Gestion de Usuarios](usuarios.md) | Crear, editar, asignar roles y desactivar usuarios |
| [Sucursales y Puntos de Venta](sucursales.md) | Configurar sucursales, codigos MH y puntos de venta |
| [Configuracion de Empresa](configuracion.md) | Datos fiscales, logo, periodo fiscal y personalizacion |
| [Seguridad](seguridad.md) | Politicas de contrasena, bloqueo de cuenta y sesiones |
| [Facturacion y Planes](billing.md) | Ver plan actual, uso, limites y proceso de upgrade |
| [Resolucion de Problemas](troubleshooting.md) | Problemas comunes de administracion y sus soluciones |

## Roles del Sistema

Facturosv maneja tres roles de usuario:

| Rol | Alcance | Descripcion |
|-----|---------|-------------|
| **SUPER_ADMIN** | Plataforma completa | Administrador de la plataforma Facturosv (solo equipo interno) |
| **ADMIN** | Tenant (empresa) | Administrador de la empresa. Gestiona usuarios, configuracion y facturacion |
| **FACTURADOR** | Tenant (empresa) | Usuario operativo. Emite DTEs, gestiona clientes y productos |

> **Nota:** Esta guia cubre las funciones disponibles para el rol ADMIN. Las funciones de SUPER_ADMIN son exclusivas del equipo de Facturosv.

## Primeros Pasos

1. **Completar datos de empresa** - Ir a [Configuracion](configuracion.md) y llenar datos fiscales (NIT, NRC, nombre comercial)
2. **Configurar sucursales** - Registrar al menos una sucursal con su codigo de establecimiento MH en [Sucursales](sucursales.md)
3. **Invitar usuarios** - Agregar a su equipo desde [Usuarios](usuarios.md)
4. **Revisar su plan** - Verificar limites y funciones disponibles en [Facturacion y Planes](billing.md)
5. **Configurar seguridad** - Revisar politicas de acceso en [Seguridad](seguridad.md)

## Soporte

Si necesita ayuda adicional, puede crear un ticket de soporte desde la seccion `/soporte` dentro de la plataforma. Los tiempos de respuesta dependen de su plan:

| Plan | Tiempo de Respuesta | Tiempo de Resolucion |
|------|---------------------|----------------------|
| Free | Mejor esfuerzo | Mejor esfuerzo |
| Starter | 24 horas | 48 horas |
| Professional | 12 horas | 24 horas |
| Enterprise | 2 horas | 8 horas |

Los tickets se identifican con formato `TKT-YYYYMMDD-XXXX`.
