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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const bcrypt = __importStar(require("bcryptjs"));
const dto_1 = require("../audit-logs/dto");
let AuthService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var AuthService = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            AuthService = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        prisma;
        jwtService;
        auditLogsService;
        constructor(prisma, jwtService, auditLogsService) {
            this.prisma = prisma;
            this.jwtService = jwtService;
            this.auditLogsService = auditLogsService;
        }
        async validateUser(email, password) {
            const user = await this.prisma.user.findUnique({
                where: { email },
                include: { tenant: true },
            });
            if (!user) {
                throw new common_1.UnauthorizedException('Credenciales invalidas');
            }
            // Check if account is locked
            if (user.accountLockedUntil && user.accountLockedUntil > new Date()) {
                const minutesRemaining = Math.ceil((user.accountLockedUntil.getTime() - Date.now()) / 60000);
                throw new common_1.UnauthorizedException(`Cuenta bloqueada. Intente nuevamente en ${minutesRemaining} minuto(s)`);
            }
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                const newFailedAttempts = user.failedLoginAttempts + 1;
                const MAX_ATTEMPTS = 5;
                const LOCKOUT_MINUTES = 15;
                const updateData = {
                    failedLoginAttempts: newFailedAttempts,
                    lastFailedLoginAt: new Date(),
                    accountLockedUntil: null,
                };
                if (newFailedAttempts >= MAX_ATTEMPTS) {
                    updateData.accountLockedUntil = new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000);
                }
                await this.prisma.user.update({
                    where: { id: user.id },
                    data: updateData,
                });
                if (newFailedAttempts >= MAX_ATTEMPTS) {
                    throw new common_1.UnauthorizedException(`Cuenta bloqueada por ${LOCKOUT_MINUTES} minutos debido a multiples intentos fallidos`);
                }
                throw new common_1.UnauthorizedException('Credenciales invalidas');
            }
            // Reset failed attempts on successful login
            if (user.failedLoginAttempts > 0) {
                await this.prisma.user.update({
                    where: { id: user.id },
                    data: {
                        failedLoginAttempts: 0,
                        accountLockedUntil: null,
                        lastFailedLoginAt: null,
                    },
                });
            }
            return user;
        }
        async login(email, password, ipAddress, userAgent) {
            let user;
            try {
                user = await this.validateUser(email, password);
            }
            catch (error) {
                // Log failed login attempt
                await this.auditLogsService.log({
                    action: dto_1.AuditAction.LOGIN,
                    module: dto_1.AuditModule.AUTH,
                    description: `Intento de inicio de sesión fallido para ${email}`,
                    userEmail: email,
                    ipAddress,
                    userAgent,
                    success: false,
                    errorMessage: error instanceof Error ? error.message : 'Credenciales inválidas',
                });
                throw error;
            }
            const payload = {
                sub: user.id,
                email: user.email,
                tenantId: user.tenantId,
                rol: user.rol,
            };
            const tenant = user.tenant;
            const tenantInfo = tenant ? {
                id: tenant.id,
                nombre: tenant.nombre,
            } : null;
            // Log successful login
            await this.auditLogsService.log({
                userId: user.id,
                userEmail: user.email,
                userName: user.nombre,
                userRole: user.rol,
                tenantId: user.tenantId || undefined,
                tenantNombre: tenant?.nombre,
                action: dto_1.AuditAction.LOGIN,
                module: dto_1.AuditModule.AUTH,
                description: `Usuario ${user.email} inició sesión exitosamente`,
                ipAddress,
                userAgent,
                success: true,
            });
            return {
                access_token: this.jwtService.sign(payload),
                user: {
                    id: user.id,
                    email: user.email,
                    nombre: user.nombre,
                    rol: user.rol,
                    tenant: tenantInfo,
                },
            };
        }
        async hashPassword(password) {
            return bcrypt.hash(password, 10);
        }
        async register(registerDto, ipAddress, userAgent) {
            const { tenant, user } = registerDto;
            // Check if empresa and admin emails are the same
            if (tenant.correo.toLowerCase().trim() === user.email.toLowerCase().trim()) {
                throw new common_1.ConflictException('El correo de la empresa y el correo del administrador deben ser diferentes');
            }
            // Check if NIT already exists
            const existingTenant = await this.prisma.tenant.findUnique({
                where: { nit: tenant.nit },
            });
            if (existingTenant) {
                throw new common_1.ConflictException('Ya existe una empresa con este NIT');
            }
            // Check if email already exists
            const existingUser = await this.prisma.user.findUnique({
                where: { email: user.email },
            });
            if (existingUser) {
                throw new common_1.ConflictException('Ya existe un usuario con este correo electronico');
            }
            // Hash password
            const hashedPassword = await this.hashPassword(user.password);
            // Create tenant and user in a transaction
            const result = await this.prisma.$transaction(async (tx) => {
                // Create tenant
                const newTenant = await tx.tenant.create({
                    data: {
                        nombre: tenant.nombre,
                        nit: tenant.nit,
                        nrc: tenant.nrc,
                        actividadEcon: tenant.actividadEcon,
                        telefono: tenant.telefono,
                        correo: tenant.correo,
                        nombreComercial: tenant.nombreComercial || null,
                        direccion: JSON.stringify({
                            departamento: tenant.direccion.departamento,
                            municipio: tenant.direccion.municipio,
                            complemento: tenant.direccion.complemento,
                        }),
                    },
                });
                // Create admin user
                const newUser = await tx.user.create({
                    data: {
                        nombre: user.nombre,
                        email: user.email,
                        password: hashedPassword,
                        rol: 'ADMIN',
                        tenantId: newTenant.id,
                    },
                });
                return { tenant: newTenant, user: newUser };
            });
            // Log registration
            await this.auditLogsService.log({
                userId: result.user.id,
                userEmail: result.user.email,
                userName: result.user.nombre,
                userRole: 'ADMIN',
                tenantId: result.tenant.id,
                tenantNombre: result.tenant.nombre,
                action: dto_1.AuditAction.CREATE,
                module: dto_1.AuditModule.TENANT,
                description: `Nueva empresa registrada: ${result.tenant.nombre} (NIT: ${result.tenant.nit})`,
                entityType: 'Tenant',
                entityId: result.tenant.id,
                ipAddress,
                userAgent,
                success: true,
            });
            return {
                message: 'Empresa registrada exitosamente',
                tenant: {
                    id: result.tenant.id,
                    nombre: result.tenant.nombre,
                    nit: result.tenant.nit,
                },
                user: {
                    id: result.user.id,
                    email: result.user.email,
                    nombre: result.user.nombre,
                },
            };
        }
        async getProfile(userId) {
            const user = await this.prisma.user.findUnique({
                where: { id: userId },
                include: { tenant: true },
            });
            if (!user) {
                throw new common_1.UnauthorizedException('Usuario no encontrado');
            }
            return {
                id: user.id,
                email: user.email,
                nombre: user.nombre,
                rol: user.rol,
                tenant: user.tenant ? {
                    id: user.tenant.id,
                    nombre: user.tenant.nombre,
                    nit: user.tenant.nit,
                } : null,
            };
        }
    };
    return AuthService = _classThis;
})();
exports.AuthService = AuthService;
