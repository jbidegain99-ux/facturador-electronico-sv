#!/usr/bin/env node
/**
 * Extract DocumentosElectronicos and DocumentosElectronicosCancelados
 * INSERT data from the UTF-16LE encoded SQL dump.
 *
 * Handles nested JSON with commas, quotes, and escaped quotes inside SQL N'...' strings.
 */

const fs = require('fs');
const path = require('path');

const SQL_PATH = path.join(__dirname, '..', 'FacturadorRepublicode.sql');
const OUT_PATH = path.join(__dirname, 'migration-dte-data.json');

// Read and convert from UTF-16LE
const buf = fs.readFileSync(SQL_PATH);
const sql = buf.toString('utf16le');

// Split into lines
const lines = sql.split(/\r?\n/);

/**
 * Parse a SQL INSERT statement's VALUES clause, handling:
 * - N'...' strings with '' as escaped quotes
 * - Numbers, NULL, CAST(...)
 * - Nested parentheses in CAST expressions
 *
 * Returns an array of string values (with N'' wrappers removed).
 */
function parseValues(valuesStr) {
  const values = [];
  let i = 0;
  const len = valuesStr.length;

  function skipWhitespace() {
    while (i < len && (valuesStr[i] === ' ' || valuesStr[i] === '\t' || valuesStr[i] === '\r' || valuesStr[i] === '\n')) {
      i++;
    }
  }

  // Expect opening '('
  skipWhitespace();
  if (valuesStr[i] !== '(') {
    throw new Error(`Expected '(' at position ${i}, got '${valuesStr[i]}' in: ${valuesStr.substring(i, i + 50)}`);
  }
  i++; // skip '('

  while (i < len) {
    skipWhitespace();

    if (valuesStr[i] === ')') {
      break;
    }

    if (valuesStr[i] === ',') {
      i++; // skip comma between values
      skipWhitespace();
    }

    // Check what kind of value
    if (valuesStr[i] === 'N' && valuesStr[i + 1] === "'") {
      // N'...' string - need to handle '' escapes
      i += 2; // skip N'
      let str = '';
      while (i < len) {
        if (valuesStr[i] === "'") {
          if (valuesStr[i + 1] === "'") {
            // Escaped quote
            str += "'";
            i += 2;
          } else {
            // End of string
            i++; // skip closing '
            break;
          }
        } else {
          str += valuesStr[i];
          i++;
        }
      }
      values.push(str);
    } else if (valuesStr.substring(i, i + 4).toUpperCase() === 'NULL') {
      values.push(null);
      i += 4;
    } else if (valuesStr.substring(i, i + 4).toUpperCase() === 'CAST') {
      // CAST(...) - need to handle nested parens
      let depth = 0;
      let castStr = '';
      while (i < len) {
        if (valuesStr[i] === '(') depth++;
        if (valuesStr[i] === ')') {
          depth--;
          if (depth === 0) {
            castStr += valuesStr[i];
            i++;
            break;
          }
        }
        castStr += valuesStr[i];
        i++;
      }
      // Extract the value from CAST(N'...' AS ...)
      const castMatch = castStr.match(/CAST\(N'(.+?)'\s+AS/i);
      if (castMatch) {
        values.push(castMatch[1].replace(/''/g, "'"));
      } else {
        values.push(castStr);
      }
    } else {
      // Number or other literal
      let val = '';
      while (i < len && valuesStr[i] !== ',' && valuesStr[i] !== ')') {
        val += valuesStr[i];
        i++;
      }
      val = val.trim();
      values.push(val);
    }
  }

  return values;
}

/**
 * Find all INSERT lines for a given table and collect the full statement
 * (which may span multiple lines until we hit a standalone 'GO').
 */
function findInserts(tableName) {
  const results = [];
  const pattern = `INSERT [Hacienda].[${tableName}]`;

  for (let li = 0; li < lines.length; li++) {
    const line = lines[li].trim();
    if (!line.startsWith(pattern)) continue;

    // Collect the full statement - it might span multiple lines until GO or next INSERT
    let fullLine = line;
    let lj = li + 1;
    // Check if the VALUES clause is complete (balanced parentheses after VALUES keyword)
    while (lj < lines.length) {
      const nextLine = lines[lj].trim();
      if (nextLine === 'GO' || nextLine.startsWith('INSERT ') || nextLine.startsWith('SET ')) break;
      fullLine += ' ' + nextLine;
      lj++;
    }

    // Extract column names
    const colMatch = fullLine.match(/\((\[.*?\](?:\s*,\s*\[.*?\])*)\)\s*VALUES/i);
    if (!colMatch) {
      console.error(`Could not parse columns from line ${li + 1}: ${fullLine.substring(0, 100)}`);
      continue;
    }
    const columns = colMatch[1].split(/\]\s*,\s*\[/).map(c => c.replace(/[\[\]]/g, '').trim());

    // Find the VALUES part
    const valuesIdx = fullLine.indexOf('VALUES');
    if (valuesIdx === -1) continue;
    const valuesStr = fullLine.substring(valuesIdx + 6).trim();

    try {
      const vals = parseValues(valuesStr);
      const record = {};
      for (let ci = 0; ci < columns.length; ci++) {
        record[columns[ci]] = vals[ci] !== undefined ? vals[ci] : null;
      }
      results.push(record);
    } catch (err) {
      console.error(`Error parsing line ${li + 1}: ${err.message}`);
      console.error(`Values string starts with: ${valuesStr.substring(0, 200)}`);
    }
  }

  return results;
}

console.log('Parsing SQL file...');

const dteRecords = findInserts('DocumentosElectronicos');
console.log(`Found ${dteRecords.length} DocumentosElectronicos records`);

const canceladosRecords = findInserts('DocumentosElectronicosCancelados');
console.log(`Found ${canceladosRecords.length} DocumentosElectronicosCancelados records`);

// Map DTE records to desired output format
const dteOutput = dteRecords.map(r => ({
  id: r.Id ? parseInt(r.Id, 10) : null,
  facturaId: r.FacturaId ? parseInt(r.FacturaId, 10) : null,
  clienteId: r.ClienteId ? parseInt(r.ClienteId, 10) : null,
  fechaEmision: r.FechaEmision || null,
  codigoGeneracion: r.CodigoGeneracion || null,
  numeroControl: r.NumeroControl || null,
  selloRecibido: r.SelloRecibido || null,
  respuestaJson: r.RespuestaJson || null,
  jsonEnviado: r.JsonEnviado || null,
  tipoDocumento: r.TipoDocumento ? parseInt(r.TipoDocumento, 10) : null,
  estado: r.Estado ? parseInt(r.Estado, 10) : null,
  fechaCreacion: r.FechaCreacion || null,
}));

// Map Cancelados records - output all fields
const canceladosOutput = canceladosRecords.map(r => {
  const mapped = {};
  for (const [key, val] of Object.entries(r)) {
    // Convert numeric-looking strings
    if (val !== null && /^\d+$/.test(val)) {
      mapped[key] = parseInt(val, 10);
    } else {
      mapped[key] = val;
    }
  }
  return mapped;
});

const output = {
  documentosElectronicos: dteOutput,
  documentosElectronicosCancelados: canceladosOutput,
};

fs.writeFileSync(OUT_PATH, JSON.stringify(output, null, 2), 'utf8');
console.log(`Written to ${OUT_PATH}`);
console.log(`DTE records: ${dteOutput.length}`);
console.log(`Cancelados records: ${canceladosOutput.length}`);

// Quick validation: check that jsonEnviado fields parse as valid JSON
let jsonOk = 0;
let jsonFail = 0;
for (const rec of dteOutput) {
  if (rec.jsonEnviado) {
    try {
      JSON.parse(rec.jsonEnviado);
      jsonOk++;
    } catch {
      jsonFail++;
      console.error(`  JSON parse failed for DTE id=${rec.id}: ${rec.jsonEnviado.substring(0, 80)}...`);
    }
  }
}
console.log(`jsonEnviado validation: ${jsonOk} OK, ${jsonFail} failed`);

// Validate respuestaJson too
let respOk = 0;
let respFail = 0;
for (const rec of dteOutput) {
  if (rec.respuestaJson) {
    try {
      JSON.parse(rec.respuestaJson);
      respOk++;
    } catch {
      respFail++;
      console.error(`  respuestaJson parse failed for DTE id=${rec.id}: ${rec.respuestaJson.substring(0, 80)}...`);
    }
  }
}
console.log(`respuestaJson validation: ${respOk} OK, ${respFail} failed`);
