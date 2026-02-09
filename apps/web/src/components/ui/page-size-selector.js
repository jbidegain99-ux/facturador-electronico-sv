'use client';
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
exports.PageSizeSelector = PageSizeSelector;
const React = __importStar(require("react"));
const select_1 = require("@/components/ui/select");
function PageSizeSelector({ value, onChange, options = [10, 20, 50, 100], }) {
    return (<div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground whitespace-nowrap">Mostrar</span>
      <select_1.Select value={value.toString()} onValueChange={(v) => onChange(parseInt(v, 10))}>
        <select_1.SelectTrigger className="w-[75px] h-9">
          <select_1.SelectValue />
        </select_1.SelectTrigger>
        <select_1.SelectContent>
          {options.map((opt) => (<select_1.SelectItem key={opt} value={opt.toString()}>
              {opt}
            </select_1.SelectItem>))}
        </select_1.SelectContent>
      </select_1.Select>
    </div>);
}
