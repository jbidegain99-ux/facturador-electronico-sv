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
exports.UpdateTicketDto = exports.TicketStatus = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const create_ticket_dto_1 = require("./create-ticket.dto");
var TicketStatus;
(function (TicketStatus) {
    TicketStatus["PENDING"] = "PENDING";
    TicketStatus["ASSIGNED"] = "ASSIGNED";
    TicketStatus["IN_PROGRESS"] = "IN_PROGRESS";
    TicketStatus["WAITING_CUSTOMER"] = "WAITING_CUSTOMER";
    TicketStatus["RESOLVED"] = "RESOLVED";
    TicketStatus["CLOSED"] = "CLOSED";
})(TicketStatus || (exports.TicketStatus = TicketStatus = {}));
let UpdateTicketDto = (() => {
    let _status_decorators;
    let _status_initializers = [];
    let _status_extraInitializers = [];
    let _priority_decorators;
    let _priority_initializers = [];
    let _priority_extraInitializers = [];
    let _assignedToId_decorators;
    let _assignedToId_initializers = [];
    let _assignedToId_extraInitializers = [];
    let _resolution_decorators;
    let _resolution_initializers = [];
    let _resolution_extraInitializers = [];
    return class UpdateTicketDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _status_decorators = [(0, swagger_1.ApiPropertyOptional)({ enum: TicketStatus, description: 'Estado del ticket' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsEnum)(TicketStatus)];
            _priority_decorators = [(0, swagger_1.ApiPropertyOptional)({ enum: create_ticket_dto_1.TicketPriority, description: 'Prioridad del ticket' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsEnum)(create_ticket_dto_1.TicketPriority)];
            _assignedToId_decorators = [(0, swagger_1.ApiPropertyOptional)({ description: 'ID del usuario asignado' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _resolution_decorators = [(0, swagger_1.ApiPropertyOptional)({ description: 'Resolucion del ticket' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            __esDecorate(null, null, _status_decorators, { kind: "field", name: "status", static: false, private: false, access: { has: obj => "status" in obj, get: obj => obj.status, set: (obj, value) => { obj.status = value; } }, metadata: _metadata }, _status_initializers, _status_extraInitializers);
            __esDecorate(null, null, _priority_decorators, { kind: "field", name: "priority", static: false, private: false, access: { has: obj => "priority" in obj, get: obj => obj.priority, set: (obj, value) => { obj.priority = value; } }, metadata: _metadata }, _priority_initializers, _priority_extraInitializers);
            __esDecorate(null, null, _assignedToId_decorators, { kind: "field", name: "assignedToId", static: false, private: false, access: { has: obj => "assignedToId" in obj, get: obj => obj.assignedToId, set: (obj, value) => { obj.assignedToId = value; } }, metadata: _metadata }, _assignedToId_initializers, _assignedToId_extraInitializers);
            __esDecorate(null, null, _resolution_decorators, { kind: "field", name: "resolution", static: false, private: false, access: { has: obj => "resolution" in obj, get: obj => obj.resolution, set: (obj, value) => { obj.resolution = value; } }, metadata: _metadata }, _resolution_initializers, _resolution_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        status = __runInitializers(this, _status_initializers, void 0);
        priority = (__runInitializers(this, _status_extraInitializers), __runInitializers(this, _priority_initializers, void 0));
        assignedToId = (__runInitializers(this, _priority_extraInitializers), __runInitializers(this, _assignedToId_initializers, void 0));
        resolution = (__runInitializers(this, _assignedToId_extraInitializers), __runInitializers(this, _resolution_initializers, void 0));
        constructor() {
            __runInitializers(this, _resolution_extraInitializers);
        }
    };
})();
exports.UpdateTicketDto = UpdateTicketDto;
