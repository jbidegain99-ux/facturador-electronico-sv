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
exports.MoneyInput = MoneyInput;
const React = __importStar(require("react"));
const input_1 = require("@/components/ui/input");
const utils_1 = require("@/lib/utils");
function MoneyInput({ value, onChange, currency = '$', className, ...props }) {
    const [displayValue, setDisplayValue] = React.useState(value.toFixed(2));
    React.useEffect(() => {
        setDisplayValue(value.toFixed(2));
    }, [value]);
    const handleChange = (e) => {
        const rawValue = e.target.value.replace(/[^0-9.]/g, '');
        setDisplayValue(rawValue);
        const numValue = parseFloat(rawValue);
        if (!isNaN(numValue)) {
            onChange(numValue);
        }
    };
    const handleBlur = () => {
        const numValue = parseFloat(displayValue);
        if (!isNaN(numValue)) {
            setDisplayValue(numValue.toFixed(2));
            onChange(numValue);
        }
        else {
            setDisplayValue('0.00');
            onChange(0);
        }
    };
    return (<div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
        {currency}
      </span>
      <input_1.Input type="text" inputMode="decimal" value={displayValue} onChange={handleChange} onBlur={handleBlur} className={(0, utils_1.cn)('pl-7 text-right', className)} {...props}/>
    </div>);
}
