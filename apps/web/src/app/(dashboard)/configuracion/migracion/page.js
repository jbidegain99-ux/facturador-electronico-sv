'use client';
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = MigracionPage;
const react_1 = require("react");
const navigation_1 = require("next/navigation");
const lucide_react_1 = require("lucide-react");
const button_1 = require("@/components/ui/button");
const card_1 = require("@/components/ui/card");
const CLIENT_FIELDS = [
    { key: 'tipoDocumento', label: 'Tipo Documento', required: true },
    { key: 'numDocumento', label: 'Num. Documento', required: true },
    { key: 'nombre', label: 'Nombre / Razon Social', required: true },
    { key: 'direccion', label: 'Direccion', required: true },
    { key: 'nrc', label: 'NRC', required: false },
    { key: 'correo', label: 'Correo', required: false },
    { key: 'telefono', label: 'Telefono', required: false },
];
function splitCSVLine(line, separator) {
    const fields = [];
    let current = '';
    let inQuotes = false;
    let i = 0;
    while (i < line.length) {
        const char = line[i];
        if (inQuotes) {
            if (char === '"') {
                // Check for escaped quote ""
                if (i + 1 < line.length && line[i + 1] === '"') {
                    current += '"';
                    i += 2;
                    continue;
                }
                // End of quoted field
                inQuotes = false;
                i++;
                continue;
            }
            current += char;
            i++;
        }
        else {
            if (char === '"') {
                inQuotes = true;
                i++;
                continue;
            }
            if (char === separator) {
                fields.push(current.trim());
                current = '';
                i++;
                continue;
            }
            current += char;
            i++;
        }
    }
    fields.push(current.trim());
    return fields;
}
function parseCSV(text) {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2)
        return { headers: [], rows: [] };
    // Detect separator (comma, semicolon, tab) from header line
    const firstLine = lines[0];
    let separator = ',';
    if (firstLine.includes(';') && !firstLine.includes(','))
        separator = ';';
    if (firstLine.includes('\t') && !firstLine.includes(',') && !firstLine.includes(';'))
        separator = '\t';
    const headers = splitCSVLine(lines[0], separator);
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
        const values = splitCSVLine(lines[i], separator);
        const row = {};
        headers.forEach((header, idx) => {
            row[header] = values[idx] || '';
        });
        rows.push(row);
    }
    return { headers, rows };
}
function MigracionPage() {
    const router = (0, navigation_1.useRouter)();
    const fileInputRef = (0, react_1.useRef)(null);
    // Step: 'upload' | 'mapping' | 'preview' | 'importing' | 'result'
    const [step, setStep] = (0, react_1.useState)('upload');
    const [fileName, setFileName] = (0, react_1.useState)('');
    const [headers, setHeaders] = (0, react_1.useState)([]);
    const [rows, setRows] = (0, react_1.useState)([]);
    const [mappings, setMappings] = (0, react_1.useState)([]);
    const [result, setResult] = (0, react_1.useState)(null);
    const [error, setError] = (0, react_1.useState)('');
    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file)
            return;
        setError('');
        setFileName(file.name);
        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result;
            const parsed = parseCSV(text);
            if (parsed.headers.length === 0) {
                setError('No se pudieron leer las columnas del archivo');
                return;
            }
            if (parsed.rows.length === 0) {
                setError('El archivo no contiene datos');
                return;
            }
            setHeaders(parsed.headers);
            setRows(parsed.rows);
            // Auto-map columns by similarity (each header can only be used once)
            const usedHeaders = new Set();
            const autoMappings = CLIENT_FIELDS.map(field => {
                const match = parsed.headers.find(h => {
                    if (usedHeaders.has(h))
                        return false;
                    const lower = h.toLowerCase().replace(/[_\s.-]/g, '');
                    const fieldLower = field.key.toLowerCase();
                    const labelLower = field.label.toLowerCase().replace(/[_\s.-]/g, '');
                    return lower === fieldLower || lower.includes(fieldLower) || lower.includes(labelLower) ||
                        (field.key === 'numDocumento' && !lower.includes('tipo') && (lower.includes('documento') || lower.includes('nit') || lower.includes('dui') || lower.includes('numero'))) ||
                        (field.key === 'tipoDocumento' && lower.includes('tipo')) ||
                        (field.key === 'nombre' && (lower.includes('nombre') || lower.includes('razon'))) ||
                        (field.key === 'direccion' && lower.includes('direccion')) ||
                        (field.key === 'correo' && (lower.includes('correo') || lower.includes('email') || lower.includes('mail'))) ||
                        (field.key === 'telefono' && (lower.includes('telefono') || lower.includes('tel')));
                });
                if (match)
                    usedHeaders.add(match);
                return { source: match || '', target: field.key };
            });
            setMappings(autoMappings);
            setStep('mapping');
        };
        reader.readAsText(file);
    };
    const handleMapping = (targetField, sourceColumn) => {
        setMappings(prev => prev.map(m => m.target === targetField ? { ...m, source: sourceColumn } : m));
    };
    const getMappedData = () => {
        return rows.map(row => {
            const mapped = {};
            mappings.forEach(m => {
                if (m.source) {
                    mapped[m.target] = row[m.source] || '';
                }
            });
            return mapped;
        });
    };
    const handleImport = async () => {
        setStep('importing');
        setError('');
        try {
            const token = localStorage.getItem('token');
            const baseUrl = process.env.NEXT_PUBLIC_API_URL;
            const mappedData = getMappedData();
            const res = await fetch(`${baseUrl}/migration/clientes`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    clientes: mappedData,
                    fileName,
                }),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({ message: 'Error al importar' }));
                throw new Error(data.message || 'Error al importar');
            }
            const importResult = await res.json();
            setResult(importResult);
            setStep('result');
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Error al importar');
            setStep('preview');
        }
    };
    const handleReset = () => {
        setStep('upload');
        setFileName('');
        setHeaders([]);
        setRows([]);
        setMappings([]);
        setResult(null);
        setError('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };
    const requiredFieldsMapped = CLIENT_FIELDS
        .filter(f => f.required)
        .every(f => mappings.find(m => m.target === f.key)?.source);
    return (<div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => router.push('/configuracion')} className="p-2 hover:bg-muted rounded-lg transition-colors">
          <lucide_react_1.ArrowLeft className="w-5 h-5 text-muted-foreground"/>
        </button>
        <div>
          <h1 className="text-3xl font-bold">Migracion de Datos</h1>
          <p className="text-muted-foreground mt-1">Importa clientes desde archivos CSV</p>
        </div>
      </div>

      {/* Steps indicator */}
      <div className="flex items-center gap-2 text-sm">
        {['Archivo', 'Mapeo', 'Vista Previa', 'Resultado'].map((label, idx) => {
            const stepIndex = ['upload', 'mapping', 'preview', 'result'].indexOf(step);
            const isActive = idx <= stepIndex || (step === 'importing' && idx <= 2);
            return (<div key={label} className="flex items-center gap-2">
              {idx > 0 && <div className={`w-8 h-0.5 ${isActive ? 'bg-primary' : 'bg-muted'}`}/>}
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${isActive ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                <span>{idx + 1}</span>
                <span className="hidden sm:inline">{label}</span>
              </div>
            </div>);
        })}
      </div>

      {error && (<div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
          <p className="text-sm text-destructive">{error}</p>
        </div>)}

      {/* Step 1: Upload */}
      {step === 'upload' && (<card_1.Card>
          <card_1.CardHeader>
            <card_1.CardTitle>Selecciona un archivo CSV</card_1.CardTitle>
            <card_1.CardDescription>
              El archivo debe tener encabezados en la primera fila. Se soportan separadores de coma (,), punto y coma (;), y tabulacion.
            </card_1.CardDescription>
          </card_1.CardHeader>
          <card_1.CardContent>
            <div className="border-2 border-dashed rounded-lg p-12 text-center cursor-pointer hover:border-primary/50 transition-colors" onClick={() => fileInputRef.current?.click()}>
              <lucide_react_1.Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4"/>
              <p className="font-medium">Haz clic para seleccionar un archivo</p>
              <p className="text-sm text-muted-foreground mt-1">CSV (max 1000 registros)</p>
              <input ref={fileInputRef} type="file" accept=".csv,.txt" onChange={handleFileSelect} className="hidden"/>
            </div>

            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium text-sm mb-2">Formato esperado:</h4>
              <code className="text-xs text-muted-foreground block">
                tipoDocumento,numDocumento,nombre,direccion,nrc,correo,telefono<br />
                36,0614-070893-104-3,Empresa ABC,San Salvador...,123456-7,info@abc.com,2222-3333
              </code>
            </div>
          </card_1.CardContent>
        </card_1.Card>)}

      {/* Step 2: Mapping */}
      {step === 'mapping' && (<card_1.Card>
          <card_1.CardHeader>
            <card_1.CardTitle>Mapeo de Columnas</card_1.CardTitle>
            <card_1.CardDescription>
              Archivo: {fileName} ({rows.length} registros encontrados). Selecciona cual columna del CSV corresponde a cada campo.
            </card_1.CardDescription>
          </card_1.CardHeader>
          <card_1.CardContent>
            <div className="space-y-3">
              {CLIENT_FIELDS.map(field => {
                const mapping = mappings.find(m => m.target === field.key);
                return (<div key={field.key} className="flex items-center gap-4">
                    <div className="w-48 flex items-center gap-2">
                      <span className="text-sm font-medium">{field.label}</span>
                      {field.required && <span className="text-xs text-destructive">*</span>}
                    </div>
                    <select value={mapping?.source || ''} onChange={(e) => handleMapping(field.key, e.target.value)} className="flex-1 rounded-lg border border-input bg-background py-2 px-3 text-sm">
                      <option value="">-- No mapear --</option>
                      {headers.map(h => (<option key={h} value={h}>{h}</option>))}
                    </select>
                  </div>);
            })}
            </div>

            <div className="flex justify-between mt-6">
              <button_1.Button variant="outline" onClick={handleReset}>
                <lucide_react_1.Trash2 className="w-4 h-4 mr-2"/>
                Cancelar
              </button_1.Button>
              <button_1.Button onClick={() => setStep('preview')} disabled={!requiredFieldsMapped}>
                Vista Previa
              </button_1.Button>
            </div>
          </card_1.CardContent>
        </card_1.Card>)}

      {/* Step 3: Preview */}
      {step === 'preview' && (<card_1.Card>
          <card_1.CardHeader>
            <card_1.CardTitle>Vista Previa</card_1.CardTitle>
            <card_1.CardDescription>
              Se importaran {rows.length} registros. Aqui puedes verificar los primeros 5 registros.
            </card_1.CardDescription>
          </card_1.CardHeader>
          <card_1.CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium">#</th>
                    {CLIENT_FIELDS.filter(f => mappings.find(m => m.target === f.key)?.source).map(f => (<th key={f.key} className="text-left py-2 px-3 text-muted-foreground font-medium">{f.label}</th>))}
                  </tr>
                </thead>
                <tbody>
                  {getMappedData().slice(0, 5).map((row, idx) => (<tr key={idx} className="border-b">
                      <td className="py-2 px-3 text-muted-foreground">{idx + 1}</td>
                      {CLIENT_FIELDS.filter(f => mappings.find(m => m.target === f.key)?.source).map(f => (<td key={f.key} className="py-2 px-3 max-w-[200px] truncate">
                          {row[f.key] || <span className="text-muted-foreground">-</span>}
                        </td>))}
                    </tr>))}
                </tbody>
              </table>
            </div>
            {rows.length > 5 && (<p className="text-xs text-muted-foreground mt-2">
                ... y {rows.length - 5} registros mas
              </p>)}

            <div className="flex justify-between mt-6">
              <button_1.Button variant="outline" onClick={() => setStep('mapping')}>
                Volver al Mapeo
              </button_1.Button>
              <button_1.Button onClick={handleImport}>
                <lucide_react_1.Upload className="w-4 h-4 mr-2"/>
                Importar {rows.length} Clientes
              </button_1.Button>
            </div>
          </card_1.CardContent>
        </card_1.Card>)}

      {/* Step 3.5: Importing */}
      {step === 'importing' && (<card_1.Card>
          <card_1.CardContent className="py-12 text-center">
            <lucide_react_1.Loader2 className="w-12 h-12 text-primary mx-auto mb-4 animate-spin"/>
            <p className="text-lg font-medium">Importando {rows.length} registros...</p>
            <p className="text-sm text-muted-foreground mt-1">Esto puede tomar unos segundos</p>
          </card_1.CardContent>
        </card_1.Card>)}

      {/* Step 4: Result */}
      {step === 'result' && result && (<div className="space-y-6">
          <card_1.Card className={result.failed === 0 ? 'border-green-500/30' : 'border-yellow-500/30'}>
            <card_1.CardContent className="py-8 text-center">
              {result.failed === 0 ? (<lucide_react_1.CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4"/>) : (<lucide_react_1.AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4"/>)}
              <h2 className="text-2xl font-bold mb-2">
                {result.failed === 0 ? 'Importacion Exitosa' : 'Importacion Completada con Errores'}
              </h2>
              <div className="flex justify-center gap-6 mt-4 flex-wrap">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-500">{result.created}</div>
                  <div className="text-sm text-muted-foreground">Creados</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-500">{result.updated}</div>
                  <div className="text-sm text-muted-foreground">Actualizados</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-500">{result.failed}</div>
                  <div className="text-sm text-muted-foreground">Fallidos</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold">{result.totalRows}</div>
                  <div className="text-sm text-muted-foreground">Total</div>
                </div>
              </div>
              {result.duplicatesInFile > 0 && (<div className="mt-4 p-3 rounded-md bg-yellow-500/10 border border-yellow-500/20">
                  <p className="text-sm text-yellow-700">
                    Se detectaron {result.duplicatesInFile} filas con numDocumento duplicado en el archivo.
                    Las filas duplicadas actualizan el mismo registro en vez de crear uno nuevo.
                  </p>
                </div>)}
            </card_1.CardContent>
          </card_1.Card>

          {/* Errors Table */}
          {result.errors.length > 0 && (<card_1.Card>
              <card_1.CardHeader>
                <card_1.CardTitle className="flex items-center gap-2">
                  <lucide_react_1.AlertCircle className="w-5 h-5 text-red-500"/>
                  Errores ({result.errors.length})
                </card_1.CardTitle>
              </card_1.CardHeader>
              <card_1.CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-3 text-muted-foreground">Fila</th>
                        <th className="text-left py-2 px-3 text-muted-foreground">Campo</th>
                        <th className="text-left py-2 px-3 text-muted-foreground">Error</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.errors.slice(0, 50).map((err, idx) => (<tr key={idx} className="border-b">
                          <td className="py-2 px-3">{err.row}</td>
                          <td className="py-2 px-3">{err.field}</td>
                          <td className="py-2 px-3 text-destructive">{err.message}</td>
                        </tr>))}
                    </tbody>
                  </table>
                </div>
                {result.errors.length > 50 && (<p className="text-xs text-muted-foreground mt-2">
                    Mostrando primeros 50 errores de {result.errors.length} total
                  </p>)}
              </card_1.CardContent>
            </card_1.Card>)}

          <div className="flex justify-between">
            <button_1.Button variant="outline" onClick={handleReset}>
              Importar Mas Datos
            </button_1.Button>
            <button_1.Button onClick={() => router.push('/clientes')}>
              Ver Clientes
            </button_1.Button>
          </div>
        </div>)}
    </div>);
}
