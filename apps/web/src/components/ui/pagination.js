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
exports.Pagination = Pagination;
const React = __importStar(require("react"));
const button_1 = require("@/components/ui/button");
const lucide_react_1 = require("lucide-react");
function Pagination({ page, totalPages, total, showing, onPageChange }) {
    const getVisiblePages = () => {
        const pages = [];
        const maxVisible = 5;
        let start = Math.max(1, page - Math.floor(maxVisible / 2));
        const end = Math.min(totalPages, start + maxVisible - 1);
        if (end - start + 1 < maxVisible) {
            start = Math.max(1, end - maxVisible + 1);
        }
        for (let i = start; i <= end; i++) {
            pages.push(i);
        }
        return pages;
    };
    const visiblePages = getVisiblePages();
    return (<div className="flex items-center justify-between px-4 py-3 border-t">
      <p className="text-sm text-muted-foreground">
        Mostrando {showing} de {total} registros
      </p>
      {totalPages > 1 && (<div className="flex items-center gap-1">
          <button_1.Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onPageChange(1)} disabled={page === 1} title="Primera pagina">
            <lucide_react_1.ChevronsLeft className="h-4 w-4"/>
          </button_1.Button>
          <button_1.Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onPageChange(page - 1)} disabled={page === 1} title="Pagina anterior">
            <lucide_react_1.ChevronLeft className="h-4 w-4"/>
          </button_1.Button>

          {visiblePages[0] > 1 && (<span className="px-1 text-sm text-muted-foreground">...</span>)}

          {visiblePages.map((p) => (<button_1.Button key={p} variant={p === page ? 'default' : 'outline'} size="icon" className="h-8 w-8" onClick={() => onPageChange(p)}>
              {p}
            </button_1.Button>))}

          {visiblePages[visiblePages.length - 1] < totalPages && (<span className="px-1 text-sm text-muted-foreground">...</span>)}

          <button_1.Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onPageChange(page + 1)} disabled={page === totalPages} title="Pagina siguiente">
            <lucide_react_1.ChevronRight className="h-4 w-4"/>
          </button_1.Button>
          <button_1.Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onPageChange(totalPages)} disabled={page === totalPages} title="Ultima pagina">
            <lucide_react_1.ChevronsRight className="h-4 w-4"/>
          </button_1.Button>
        </div>)}
    </div>);
}
