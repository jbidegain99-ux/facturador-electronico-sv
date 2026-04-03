# 📊 GUÍA DE MIGRACIÓN: CSV → Azure SQL (Tenant Republicode)

**Status:** ✅ Archivos CSV generados y listos  
**Fecha:** Marzo 10, 2026  
**Tenant:** Republicode S.A. de C.V.

---

## 📋 RESUMEN DE DATOS CONVERTIDOS

| Tabla | Filas | Archivo | Descripción |
|-------|-------|---------|-------------|
| ActividadesEconomicas | 771 | ActividadesEconomicas.csv | Catálogo de actividades económicas |
| Paises | 275 | Paises.csv | Catálogo de países |
| Empresas | 1 | Empresas.csv | Datos de empresa Republicode |
| Parametros | 1 | Parametros.csv | Parámetros de configuración |
| DocumentosElectronicos | 20 | DocumentosElectronicos.csv | DTEs emitidos |
| DocumentosElectronicosCancelados | 4 | DocumentosElectronicosCancelados.csv | DTEs cancelados |
| Clientes | 7 | Clientes.csv | Clientes de Republicode |
| Facturas | 20 | Facturas.csv | Facturas emitidas |
| FacturaDetalles | 0 | FacturaDetalles.csv | Detalles de facturas (vacío) |
| SecuenciasNumeroControl | 1 | SecuenciasNumeroControl.csv | Secuencias para # de control |

**Total:** 1,100+ registros listos para importar

---

## 🎯 PRÓXIMOS PASOS PARA MIGRACIÓN

### OPCIÓN 1: Manual via Azure Data Studio (Recomendado)

**Ventajas:**
- ✅ Visual
- ✅ Puedes revisar datos antes de importar
- ✅ Control total

**Pasos:**

1. **Conectar a Azure SQL Database**
   ```
   Server: facturador-sql-sv.database.windows.net
   Database: facturador_prod
   Username: [tu usuario]
   Password: [tu contraseña]
   ```

2. **Abrir Azure Data Studio**
   - File → Open Folder → ~/facturador-electronico-sv
   - Connect → Nueva conexión a SQL

3. **Importar cada CSV**
   - Botón derecho en tabla → Import Wizard
   - Seleccionar archivo .csv
   - Mapear columnas
   - Click Import

4. **Orden de importación (IMPORTANTE):**
   ```
   1. ActividadesEconomicas.csv    (catálogo base)
   2. Paises.csv                    (catálogo base)
   3. Empresas.csv                  (empresa Republicode)
   4. Parametros.csv                (parámetros)
   5. Clientes.csv                  (clientes)
   6. Facturas.csv                  (facturas)
   7. DocumentosElectronicos.csv    (DTEs)
   8. DocumentosElectronicosCancelados.csv (DTEs cancelados)
   ```

---

### OPCIÓN 2: T-SQL Bulk Insert (Más rápido)

**Si prefieres script SQL:**

```sql
-- Copiar CSV a servidor primero
-- Luego ejecutar BULK INSERT para cada tabla

BULK INSERT [Catalogos].[ActividadesEconomicas]
FROM '/var/opt/mssql/data/ActividadesEconomicas.csv'
WITH (
    FIELDTERMINATOR = ',',
    ROWTERMINATOR = '\n',
    FIRSTROW = 2  -- Saltar header
);

-- Repetir para otras tablas...
```

---

### OPCIÓN 3: Azure CLI (Automático)

**Para automatizar:**

```bash
# Script para importar todos los CSVs
for csv_file in /mnt/user-data/outputs/*.csv; do
    table_name=$(basename "$csv_file" .csv)
    
    # Usar bcp utility
    bcp [schema].[table] in "$csv_file" \
        -S facturador-sql-sv.database.windows.net \
        -U [usuario] \
        -P [contraseña] \
        -d facturador_prod \
        -c \
        -t ',' \
        -F 2
done
```

---

## ⚠️ CONSIDERACIONES IMPORTANTES

### 1. **Conflictos de IDs**

Los datos vienen con IDs específicos del sistema anterior. Considera:

**Opción A: Mantener IDs originales**
```sql
SET IDENTITY_INSERT [Catalogos].[ActividadesEconomicas] ON
-- Importar con IDs existentes
SET IDENTITY_INSERT [Catalogos].[ActividadesEconomicas] OFF
```

**Opción B: Dejar que SQL genere nuevos IDs**
- Remover columna ID del CSV antes de importar
- SQL genera nuevos secuenciales

**Recomendación:** Mantener IDs originales (Opción A) para consistencia

---

### 2. **Tenant ID**

**IMPORTANTE:** El sistema actual (Facturosv.com) usa Multi-Tenancy. 

Los datos deben asociarse al tenant **Republicode** en la BD:

```sql
-- Republicode tenant ID
SELECT id, nombre FROM Tenants WHERE nombre = 'Republicode';
-- Resultado: [tenant-id-republicode] | Republicode S.A. de C.V.

-- Verificar que facturas/clientes/documentos tengan el tenant correcto
SELECT * FROM Clientes WHERE tenantId = 'republicode-prod-sv';
```

**Columna faltante en CSV:** `tenantId`

Necesitarás agregar esta columna después de importar:

```sql
-- Actualizar todos los clientes con tenant Republicode
UPDATE Clientes 
SET tenantId = 'republicode-prod-sv' 
WHERE tenantId IS NULL;

-- Verificar
SELECT COUNT(*) FROM Clientes WHERE tenantId = 'republicode-prod-sv';
```

---

### 3. **Dates y Timestamps**

Algunos campos tienen CAST() en el SQL. Los CSVs tienen valores limpios:

```
FechaCreacion: 2025-12-16T05:22:51
FechaEmision: 2025-12-16
```

SQL Server parseará automáticamente estos formatos. Si hay errores:

```sql
-- Convertir si es necesario
SELECT CONVERT(DATETIME2, FechaCreacion) FROM ...
```

---

### 4. **Validación Post-Importación**

Después de importar, verifica:

```sql
-- 1. Contar filas
SELECT 'ActividadesEconomicas' as [Table], COUNT(*) as [Rows] FROM [Catalogos].[ActividadesEconomicas]
UNION ALL
SELECT 'Paises', COUNT(*) FROM [Catalogos].[Paises]
UNION ALL
SELECT 'Empresas', COUNT(*) FROM [Empresa].[Empresas]
-- etc.

-- 2. Revisar datos de Republicode
SELECT * FROM [Empresa].[Empresas] WHERE nombre LIKE '%Republicode%';
SELECT * FROM [Ventas].[Clientes] WHERE tenantId = 'republicode-prod-sv';

-- 3. Verificar integridad
SELECT * FROM [Ventas].[Facturas] WHERE ClienteId NOT IN (SELECT Id FROM [Ventas].[Clientes]);
```

---

## 📁 ARCHIVOS DISPONIBLES

Todos los CSV están listos en: `/mnt/user-data/outputs/`

```
ActividadesEconomicas.csv
Clientes.csv
DocumentosElectronicos.csv
DocumentosElectronicosCancelados.csv
DocumentosElectronicos.csv
Empresas.csv
FacturaDetalles.csv
Facturas.csv
Paises.csv
Parametros.csv
SecuenciasNumeroControl.csv
```

**Descargar:** Todos están disponibles en el navegador

---

## 🛠️ MIGRACIÓN PASO A PASO (Opción 1 - Recomendada)

### Paso 1: Abrir Azure Data Studio

```bash
# Si no lo tienes, descargar desde:
# https://docs.microsoft.com/en-us/sql/azure-data-studio/download-azure-data-studio

# Conexión:
Server: facturador-sql-sv.database.windows.net
Database: facturador_prod
Authentication: SQL Login
Username: [tu usuario]
```

### Paso 2: Importar ActividadesEconomicas

1. Click derecho en tabla `[Catalogos].[ActividadesEconomicas]`
2. "Import"
3. Seleccionar: `ActividadesEconomicas.csv`
4. Verificar mapeo de columnas
5. Click "Import"

**Verificar:**
```sql
SELECT COUNT(*) FROM [Catalogos].[ActividadesEconomicas];
-- Expected: 771
```

### Paso 3: Importar Paises

Repetir el proceso para `Paises.csv`

**Verificar:**
```sql
SELECT COUNT(*) FROM [Catalogos].[Paises];
-- Expected: 275
```

### Paso 4: Importar Empresas

```sql
-- Importante: Primero verificar que Republicode no existe
SELECT * FROM [Empresa].[Empresas];

-- Importar Empresas.csv
-- Si hay conflicto de IDs, usar SET IDENTITY_INSERT
```

### Paso 5: Importar Clientes

```sql
-- Después de importar Clientes.csv
-- IMPORTANTE: Agregar tenantId
UPDATE [Ventas].[Clientes]
SET tenantId = 'republicode-prod-sv'
WHERE tenantId IS NULL OR tenantId = '';

-- Verificar
SELECT COUNT(*) FROM [Ventas].[Clientes] WHERE tenantId = 'republicode-prod-sv';
```

### Paso 6: Importar Facturas

```sql
-- Importar Facturas.csv
-- Verificar que ClienteId exista
SELECT COUNT(*) FROM [Ventas].[Facturas] 
WHERE ClienteId NOT IN (SELECT Id FROM [Ventas].[Clientes]);
-- Expected: 0 (sin errores de FK)
```

### Paso 7: Importar DocumentosElectronicos

```sql
-- Verificar
SELECT COUNT(*) FROM [Hacienda].[DocumentosElectronicos];
-- Expected: 20
```

### Paso 8: Validación Final

```sql
-- Resumen de datos importados
SELECT 
    'ActividadesEconomicas' as [Tabla],
    COUNT(*) as [Registros]
FROM [Catalogos].[ActividadesEconomicas]
UNION ALL
SELECT 'Paises', COUNT(*) FROM [Catalogos].[Paises]
UNION ALL
SELECT 'Empresas', COUNT(*) FROM [Empresa].[Empresas]
UNION ALL
SELECT 'Clientes', COUNT(*) FROM [Ventas].[Clientes]
UNION ALL
SELECT 'Facturas', COUNT(*) FROM [Ventas].[Facturas]
UNION ALL
SELECT 'DocumentosElectronicos', COUNT(*) FROM [Hacienda].[DocumentosElectronicos]
ORDER BY [Tabla];
```

---

## ✅ CHECKLIST DE MIGRACIÓN

- [ ] Descargar todos los CSV
- [ ] Conectar a Azure SQL Database
- [ ] Importar ActividadesEconomicas (771 filas)
- [ ] Importar Paises (275 filas)
- [ ] Importar Empresas (1 fila)
- [ ] Importar Parametros (1 fila)
- [ ] Importar Clientes (7 filas) + Agregar tenantId
- [ ] Importar Facturas (20 filas)
- [ ] Importar DocumentosElectronicos (20 filas)
- [ ] Verificar integridad (sin FK errors)
- [ ] Ejecutar queries de validación
- [ ] Confirmar datos aparecen en dashboard Republicode

---

## 🚨 TROUBLESHOOTING

### Error: "Duplicate key value"

**Causa:** ID ya existe en tabla

**Solución:**
```sql
SET IDENTITY_INSERT [tabla] ON
-- Importar
SET IDENTITY_INSERT [tabla] OFF
```

---

### Error: "Foreign key constraint"

**Causa:** ClienteId no existe en tabla Clientes

**Solución:**
```sql
-- Verificar IDs
SELECT DISTINCT ClienteId FROM [Ventas].[Facturas];
SELECT Id FROM [Ventas].[Clientes];

-- Si faltan, importar primero la tabla padre
```

---

### Error: "File not found"

**Causa:** Ruta del CSV incorrecta

**Solución:**
```bash
# Verificar ubicación de CSVs
ls -la /mnt/user-data/outputs/*.csv

# Copiar a ubicación accesible por SQL Server si es necesario
```

---

## 📞 PRÓXIMOS PASOS

1. **Descargar CSVs** → Todo disponible en `/mnt/user-data/outputs/`
2. **Importar** → Seguir pasos arriba
3. **Validar** → Ejecutar queries de validación
4. **Testing** → Verificar que datos aparecen en Facturosv.com
5. **Go Live** → Republicode puede usar sus datos históricos

---

**¿NECESITAS AYUDA CON LA MIGRACIÓN?**

Puedo:
- ✅ Crear script SQL automático para importación
- ✅ Validar estructura de datos post-importación
- ✅ Resolver conflictos de integridad referencial
- ✅ Mapear datos viejos a nuevo schema Facturosv.com

---

**Archivos listos.** ¿Por cuál opción de migración prefieres empezar? 🚀
