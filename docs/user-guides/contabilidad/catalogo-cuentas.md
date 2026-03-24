# Catalogo de Cuentas

## Que es el catalogo de cuentas

El catalogo de cuentas es la estructura base de toda la contabilidad. Organiza todas las cuentas contables de la empresa en una jerarquia ordenada por codigos numericos. Cada transaccion financiera se registra en una o mas cuentas de este catalogo.

Facturosv incluye un catalogo predeterminado basado en las **NIIF PYMES** (Normas Internacionales de Informacion Financiera para Pequenas y Medianas Empresas), adaptado para El Salvador, con aproximadamente 150 cuentas predefinidas.

---

## Inicializar el catalogo predeterminado

Al activar el modulo de contabilidad por primera vez, el catalogo estara vacio. Para cargarlo con las cuentas estandar NIIF PYMES:

1. Navegue a **Contabilidad > Catalogo de Cuentas**.
2. Haga clic en el boton **Inicializar Catalogo** (o **Sembrar Catalogo**).
3. El sistema creara automaticamente la estructura completa con ~150 cuentas organizadas en 4 niveles.

> **Nota:** Esta operacion solo se puede ejecutar una vez. Si ya existen cuentas en el catalogo, el boton no estara disponible. La semilla crea el catalogo estandar de El Salvador conforme a NIIF PYMES.

---

## Jerarquia y niveles

El catalogo utiliza una jerarquia de **4 niveles**. Los codigos siguen un esquema numerico que refleja la posicion de cada cuenta:

| Nivel | Ejemplo de codigo | Descripcion | Permite movimientos |
|---|---|---|---|
| 1 | `1` | Clase (ej: Activo) | No |
| 2 | `11` | Grupo (ej: Activo Corriente) | No |
| 3 | `1101` | Subgrupo (ej: Efectivo y Equivalentes) | No |
| 4 | `110101` | Cuenta de detalle (ej: Caja General) | Si |

### Reglas de jerarquia

- Las cuentas de **nivel 1, 2 y 3** son cuentas sumarias (de agrupacion). No permiten registrar movimientos directamente.
- Solo las cuentas de **nivel 4** permiten movimientos contables (`allowsPosting = true`).
- Cada cuenta (excepto las de nivel 1) tiene una cuenta padre (`parent`) que define a que grupo pertenece.
- Los saldos de las cuentas padre se calculan automaticamente sumando los saldos de sus cuentas hijas.

### Ejemplo de estructura

```
1 - Activo (Nivel 1)
  11 - Activo Corriente (Nivel 2)
    1101 - Efectivo y Equivalentes de Efectivo (Nivel 3)
      110101 - Caja General (Nivel 4) ← permite movimientos
      110102 - Bancos (Nivel 4) ← permite movimientos
    1102 - Cuentas por Cobrar Comerciales (Nivel 3)
      110201 - Clientes Nacionales (Nivel 4) ← permite movimientos
```

---

## Tipos de cuenta y saldos normales

Cada cuenta tiene un **tipo** que determina su comportamiento contable:

| Tipo de cuenta | Codigo interno | Saldo normal | Efecto del debito | Efecto del credito |
|---|---|---|---|---|
| **Activo** | `ASSET` | Deudor (DEBIT) | Aumenta | Disminuye |
| **Pasivo** | `LIABILITY` | Acreedor (CREDIT) | Disminuye | Aumenta |
| **Patrimonio** | `EQUITY` | Acreedor (CREDIT) | Disminuye | Aumenta |
| **Ingreso** | `INCOME` | Acreedor (CREDIT) | Disminuye | Aumenta |
| **Gasto** | `EXPENSE` | Deudor (DEBIT) | Aumenta | Disminuye |

### Que significa el saldo normal

El saldo normal indica en que lado de la partida (debe o haber) se espera que crezca una cuenta:

- **Saldo deudor (DEBIT):** Las cuentas de Activo y Gasto normalmente tienen saldo deudor. Un debito las incrementa y un credito las reduce.
- **Saldo acreedor (CREDIT):** Las cuentas de Pasivo, Patrimonio e Ingreso normalmente tienen saldo acreedor. Un credito las incrementa y un debito las reduce.

> **Ejemplo practico:** Cuando un cliente paga una factura en efectivo:
> - Se **debita** la cuenta de Caja (Activo, saldo deudor) — el efectivo aumenta.
> - Se **acredita** la cuenta de Ingresos por Ventas (Ingreso, saldo acreedor) — los ingresos aumentan.

---

## Crear una cuenta nueva

Si necesita agregar cuentas que no estan en el catalogo predeterminado:

1. Navegue a **Contabilidad > Catalogo de Cuentas**.
2. Haga clic en **Crear Cuenta**.
3. Complete los campos requeridos:

| Campo | Descripcion | Ejemplo |
|---|---|---|
| **Codigo** | Codigo numerico unico que sigue la convencion del nivel | `110103` |
| **Nombre** | Nombre descriptivo de la cuenta | `Caja Chica` |
| **Cuenta padre** | Cuenta de nivel superior a la que pertenece | `1101 - Efectivo y Equivalentes` |
| **Nivel** | Se asigna automaticamente segun la cuenta padre | `4` |
| **Tipo de cuenta** | Hereda el tipo de la cuenta padre | `ASSET` |
| **Saldo normal** | Se determina automaticamente segun el tipo | `DEBIT` |
| **Permite movimientos** | Indica si se pueden registrar partidas en esta cuenta | `Si` (solo nivel 4) |

4. Haga clic en **Guardar**.

### Recomendaciones al crear cuentas

- Mantenga la coherencia en la codificacion. Si las cuentas de nivel 4 bajo `1101` usan el patron `1101XX`, continue con el siguiente numero disponible.
- Asigne nombres claros y descriptivos.
- Solo cree cuentas de nivel 4 como cuentas de movimiento.
- Si necesita un nuevo grupo o subgrupo (niveles 2-3), creelos primero antes de agregar las cuentas de detalle.

---

## Editar una cuenta

1. Navegue a **Contabilidad > Catalogo de Cuentas**.
2. Localice la cuenta que desea modificar.
3. Haga clic en la cuenta o en el icono de edicion.
4. Modifique los campos permitidos:
   - **Nombre**: Se puede cambiar en cualquier momento.
   - **Permite movimientos**: Se puede cambiar si la cuenta no tiene movimientos registrados.
   - **Cuenta padre**: No se recomienda cambiar si ya tiene movimientos.

> **Importante:** El codigo de la cuenta, el tipo y el saldo normal no se pueden modificar una vez creada la cuenta. Si necesita cambiar estos valores, desactive la cuenta y cree una nueva.

---

## Desactivar una cuenta

Si una cuenta ya no se utiliza, puede desactivarla en lugar de eliminarla (las cuentas contables nunca se eliminan para preservar el historial):

1. Navegue a **Contabilidad > Catalogo de Cuentas**.
2. Localice la cuenta que desea desactivar.
3. Haga clic en el icono de edicion.
4. Desmarque la opcion **Activa** (`isActive`).
5. Haga clic en **Guardar**.

### Efectos de desactivar una cuenta

- La cuenta **no aparecera** en los selectores al crear nuevas partidas.
- Las partidas historicas que usaron esta cuenta **se mantienen intactas**.
- Los reportes historicos seguiran mostrando los movimientos de la cuenta.
- La cuenta se puede reactivar en cualquier momento.

> **Restriccion:** No puede desactivar una cuenta que tenga cuentas hijas activas. Desactive primero las cuentas hijas.

---

## Propiedades de una cuenta

Resumen de todos los campos que componen una cuenta contable:

| Propiedad | Descripcion |
|---|---|
| `code` | Codigo numerico unico de la cuenta |
| `name` | Nombre descriptivo |
| `parent` | Referencia a la cuenta padre (null para nivel 1) |
| `level` | Nivel en la jerarquia (1 a 4) |
| `accountType` | Tipo: ASSET, LIABILITY, EQUITY, INCOME, EXPENSE |
| `normalBalance` | Saldo normal: DEBIT o CREDIT |
| `allowsPosting` | Si permite registrar movimientos (true/false) |
| `isActive` | Si la cuenta esta activa (true/false) |
