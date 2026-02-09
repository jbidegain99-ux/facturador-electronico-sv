"use strict";
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MigrationService = void 0;
const common_1 = require("@nestjs/common");
let MigrationService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var MigrationService = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            MigrationService = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        prisma;
        logger = new common_1.Logger(MigrationService.name);
        constructor(prisma) {
            this.prisma = prisma;
        }
        trimField(value) {
            if (value === null || value === undefined)
                return '';
            return String(value).trim();
        }
        async importClientes(tenantId, clientes, fileName) {
            this.logger.log(`=== IMPORT START === tenantId=${tenantId}, totalRows=${clientes.length}, fileName=${fileName || 'N/A'}`);
            // Detect duplicate numDocumento values in input
            const docValues = clientes.map(c => this.trimField(c.numDocumento)).filter(Boolean);
            const uniqueDocs = new Set(docValues);
            const duplicatesInFile = docValues.length - uniqueDocs.size;
            this.logger.log(`Input analysis: ${clientes.length} rows, ${uniqueDocs.size} unique numDocumento values, ${duplicatesInFile} duplicates in file`);
            if (uniqueDocs.size <= 3 && clientes.length > 3) {
                this.logger.warn(`POSSIBLE DATA ISSUE: Only ${uniqueDocs.size} unique numDocumento for ${clientes.length} rows. Values: ${[...uniqueDocs].slice(0, 5).join(', ')}`);
            }
            // Log sample of first 3 items for debugging
            const sample = clientes.slice(0, 3).map((c, i) => ({
                row: i + 1,
                tipoDocumento: c.tipoDocumento,
                numDocumento: c.numDocumento,
                nombre: c.nombre ? String(c.nombre).substring(0, 30) : '(empty)',
                direccion: c.direccion ? 'present' : '(empty)',
            }));
            this.logger.log(`Sample data (first 3): ${JSON.stringify(sample)}`);
            // Create import job
            const job = await this.prisma.importJob.create({
                data: {
                    tenantId,
                    tipo: 'clientes',
                    estado: 'PROCESANDO',
                    totalRows: clientes.length,
                    fileName: fileName || null,
                },
            });
            this.logger.log(`Import job created: ${job.id}`);
            const errors = [];
            let successful = 0;
            let created = 0;
            let updated = 0;
            let processed = 0;
            let validationFails = 0;
            let dbErrors = 0;
            for (let i = 0; i < clientes.length; i++) {
                const raw = clientes[i];
                processed++;
                // Trim all fields to avoid whitespace issues
                const cliente = {
                    tipoDocumento: this.trimField(raw.tipoDocumento),
                    numDocumento: this.trimField(raw.numDocumento),
                    nombre: this.trimField(raw.nombre),
                    nrc: this.trimField(raw.nrc),
                    correo: this.trimField(raw.correo),
                    telefono: this.trimField(raw.telefono),
                    direccion: this.trimField(raw.direccion),
                };
                try {
                    // Validate required fields
                    const missingFields = [];
                    if (!cliente.tipoDocumento)
                        missingFields.push('tipoDocumento');
                    if (!cliente.numDocumento)
                        missingFields.push('numDocumento');
                    if (!cliente.nombre)
                        missingFields.push('nombre');
                    if (!cliente.direccion)
                        missingFields.push('direccion');
                    if (missingFields.length > 0) {
                        validationFails++;
                        const msg = `Campos requeridos vacios: ${missingFields.join(', ')}`;
                        errors.push({ row: i + 1, field: missingFields[0], message: msg });
                        if (validationFails <= 5) {
                            this.logger.warn(`Row ${i + 1} VALIDATION FAIL: ${msg} | data=${JSON.stringify(cliente)}`);
                        }
                        continue;
                    }
                    // Check if the client already exists to track created vs updated
                    const existing = await this.prisma.cliente.findUnique({
                        where: {
                            tenantId_numDocumento: {
                                tenantId,
                                numDocumento: cliente.numDocumento,
                            },
                        },
                        select: { id: true },
                    });
                    const result = await this.prisma.cliente.upsert({
                        where: {
                            tenantId_numDocumento: {
                                tenantId,
                                numDocumento: cliente.numDocumento,
                            },
                        },
                        create: {
                            tenantId,
                            tipoDocumento: cliente.tipoDocumento,
                            numDocumento: cliente.numDocumento,
                            nombre: cliente.nombre,
                            nrc: cliente.nrc || null,
                            correo: cliente.correo || null,
                            telefono: cliente.telefono || null,
                            direccion: cliente.direccion,
                        },
                        update: {
                            tipoDocumento: cliente.tipoDocumento,
                            nombre: cliente.nombre,
                            nrc: cliente.nrc || null,
                            correo: cliente.correo || null,
                            telefono: cliente.telefono || null,
                            direccion: cliente.direccion,
                        },
                    });
                    successful++;
                    if (existing) {
                        updated++;
                    }
                    else {
                        created++;
                    }
                    if (successful <= 5 || successful % 100 === 0) {
                        this.logger.log(`Row ${i + 1} ${existing ? 'UPDATED' : 'CREATED'}: clienteId=${result.id}, doc=${cliente.numDocumento}`);
                    }
                }
                catch (err) {
                    dbErrors++;
                    const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
                    errors.push({ row: i + 1, field: 'database', message: errorMessage });
                    if (dbErrors <= 10) {
                        this.logger.warn(`Row ${i + 1} DB ERROR: ${errorMessage} | doc=${cliente.numDocumento}`);
                    }
                }
            }
            // Final summary log
            this.logger.log(`=== IMPORT COMPLETE === jobId=${job.id} | total=${clientes.length} | processed=${processed} | successful=${successful} (created=${created}, updated=${updated}) | validationFails=${validationFails} | dbErrors=${dbErrors} | duplicatesInFile=${duplicatesInFile}`);
            if (validationFails > 0) {
                this.logger.warn(`${validationFails} rows failed validation${validationFails > 5 ? ' (showing first 5 in logs above)' : ''}`);
            }
            if (dbErrors > 0) {
                this.logger.warn(`${dbErrors} rows failed with DB errors${dbErrors > 10 ? ' (showing first 10 in logs above)' : ''}`);
            }
            if (duplicatesInFile > 0) {
                this.logger.warn(`${duplicatesInFile} duplicate numDocumento values in the input file — these rows update the same record`);
            }
            // Update job status
            const estado = errors.length === 0
                ? 'COMPLETADO'
                : successful > 0
                    ? 'COMPLETADO'
                    : 'ERROR';
            await this.prisma.importJob.update({
                where: { id: job.id },
                data: {
                    estado,
                    processed,
                    successful,
                    failed: errors.length,
                    errors: errors.length > 0 ? JSON.stringify(errors) : null,
                },
            });
            return {
                jobId: job.id,
                totalRows: clientes.length,
                processed,
                successful,
                created,
                updated,
                failed: errors.length,
                duplicatesInFile,
                errors,
            };
        }
        async getJobs(tenantId) {
            return this.prisma.importJob.findMany({
                where: { tenantId },
                orderBy: { createdAt: 'desc' },
                take: 20,
            });
        }
        async getJob(tenantId, jobId) {
            const job = await this.prisma.importJob.findFirst({
                where: { id: jobId, tenantId },
            });
            if (!job) {
                throw new common_1.NotFoundException('Job de importacion no encontrado');
            }
            return {
                ...job,
                errors: job.errors ? JSON.parse(job.errors) : [],
            };
        }
    };
    return MigrationService = _classThis;
})();
exports.MigrationService = MigrationService;
