# Sucursales y Puntos de Venta

Esta seccion explica como configurar y administrar las sucursales de su empresa en Facturosv.

## Conceptos Clave

| Concepto | Descripcion |
|----------|-------------|
| **Sucursal** | Ubicacion fisica de su negocio registrada ante el Ministerio de Hacienda (MH) |
| **Codigo de Establecimiento MH** (`codEstableMH`) | Codigo unico asignado por MH a cada establecimiento |
| **Tipo de Establecimiento** | `01` = Sucursal, `02` = Casa Matriz |
| **Punto de Venta** | Identificador del punto de emision dentro de una sucursal (por defecto `P001`) |

## Limite de Sucursales por Plan

| Plan | Sucursales Permitidas |
|------|----------------------|
| Free | 1 |
| Starter | 1 |
| Professional | 5 |
| Enterprise | Ilimitadas |

> Si necesita mas sucursales de las que permite su plan, debe actualizar su plan desde la seccion de [Facturacion y Planes](billing.md).

## Crear una Sucursal

1. Navegar a **Configuracion > Sucursales**
2. Hacer clic en **Nueva Sucursal**
3. Completar los campos:
   - **Nombre de la sucursal** (ejemplo: "Sucursal Centro", "Casa Matriz")
   - **Codigo de Establecimiento MH** (`codEstableMH`): El codigo asignado por Hacienda a este establecimiento
   - **Tipo de Establecimiento**:
     - `01` - Sucursal
     - `02` - Casa Matriz
   - **Direccion** (departamento, municipio, complemento)
   - **Telefono** (opcional)
   - **Correo** (opcional)
4. Hacer clic en **Guardar**

### Punto de Venta por Defecto

Al crear una sucursal, el sistema genera automaticamente un Punto de Venta con codigo `P001`. Este es el punto de venta predeterminado que se usa en la emision de DTEs.

## Editar una Sucursal

1. Ir a **Configuracion > Sucursales**
2. Seleccionar la sucursal a modificar
3. Actualizar los campos necesarios
4. Guardar los cambios

> **Precaucion:** Modificar el `codEstableMH` puede afectar la correlatividad de sus DTEs. Solo cambie este valor si esta seguro de que es correcto.

## Gestionar Puntos de Venta

Cada sucursal puede tener multiples puntos de venta. Los puntos de venta se usan para diferenciar la emision de DTEs dentro de una misma sucursal.

### Agregar un Punto de Venta

1. Ir a **Configuracion > Sucursales**
2. Seleccionar la sucursal
3. En la seccion de Puntos de Venta, hacer clic en **Agregar Punto de Venta**
4. Asignar un codigo (ejemplo: `P002`, `P003`)
5. Guardar

### Formato del Codigo de Punto de Venta

El codigo de punto de venta sigue el formato `PXXX` donde `XXX` es un numero secuencial:
- `P001` - Primer punto de venta (creado automaticamente)
- `P002` - Segundo punto de venta
- `P003` - Tercer punto de venta

## Asignar Usuarios a Sucursales

Los usuarios pueden asignarse a sucursales especificas para controlar desde que ubicacion emiten DTEs:

1. Ir a **Configuracion > Usuarios**
2. Editar el usuario
3. Seleccionar la sucursal asignada
4. Guardar

> Un usuario ADMIN tiene acceso a todas las sucursales. Un usuario FACTURADOR solo puede emitir DTEs desde la sucursal asignada.

## Relacion con DTEs

Cada DTE emitido queda vinculado a:
- La **sucursal** donde se emitio
- El **punto de venta** utilizado
- El **codigo de establecimiento MH** correspondiente

Esta informacion se incluye en el JSON del DTE enviado a Hacienda y no puede modificarse despues de la emision.

## Consideraciones Importantes

- **El codigo de establecimiento MH debe coincidir** con el registrado en el portal de Hacienda para su contribuyente
- **No elimine sucursales** que tengan DTEs emitidos; en su lugar, desactivelas
- **La Casa Matriz** (tipo `02`) normalmente es la primera sucursal registrada
- Al migrar de plan, sus sucursales existentes se mantienen, pero no podra crear nuevas si excede el limite del nuevo plan
- Los correlativios de DTEs son independientes por sucursal y punto de venta
