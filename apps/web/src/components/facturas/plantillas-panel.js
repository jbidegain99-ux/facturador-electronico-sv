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
exports.PlantillasPanel = PlantillasPanel;
exports.GuardarPlantillaModal = GuardarPlantillaModal;
const React = __importStar(require("react"));
const lucide_react_1 = require("lucide-react");
const button_1 = require("@/components/ui/button");
const input_1 = require("@/components/ui/input");
const dialog_1 = require("@/components/ui/dialog");
const templates_1 = require("@/store/templates");
const utils_1 = require("@/lib/utils");
function PlantillasPanel({ onSelectTemplate, className, }) {
    const { templates, deleteTemplate, getTopTemplates } = (0, templates_1.useTemplatesStore)();
    const [search, setSearch] = React.useState('');
    const [deleteConfirm, setDeleteConfirm] = React.useState(null);
    const filteredTemplates = React.useMemo(() => {
        if (!search)
            return templates;
        const lower = search.toLowerCase();
        return templates.filter((t) => t.name.toLowerCase().includes(lower) ||
            t.description?.toLowerCase().includes(lower));
    }, [templates, search]);
    const topTemplates = getTopTemplates(3);
    const handleSelect = (template) => {
        onSelectTemplate(template);
    };
    const handleDelete = (id) => {
        deleteTemplate(id);
        setDeleteConfirm(null);
    };
    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('es-SV', {
            day: '2-digit',
            month: 'short',
        });
    };
    if (templates.length === 0) {
        return (<div className={(0, utils_1.cn)('glass-card p-4', className)}>
        <div className="flex items-center gap-2 mb-3">
          <lucide_react_1.Files className="w-4 h-4 text-primary"/>
          <h3 className="font-medium text-sm">Plantillas</h3>
        </div>
        <div className="text-center py-6">
          <lucide_react_1.Files className="w-10 h-10 mx-auto text-muted-foreground/50 mb-2"/>
          <p className="text-sm text-muted-foreground">
            No tienes plantillas guardadas
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Crea una factura y guardala como plantilla para usarla despues
          </p>
        </div>
      </div>);
    }
    return (<div className={(0, utils_1.cn)('glass-card p-4', className)}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <lucide_react_1.Files className="w-4 h-4 text-primary"/>
          <h3 className="font-medium text-sm">Plantillas</h3>
          <span className="text-xs text-muted-foreground">
            ({templates.length})
          </span>
        </div>
      </div>

      {/* Top used templates */}
      {topTemplates.length > 0 && !search && (<div className="mb-3">
          <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
            <lucide_react_1.Star className="w-3 h-3"/> Mas usadas
          </p>
          <div className="space-y-1">
            {topTemplates.map((template) => (<button key={template.id} onClick={() => handleSelect(template)} className="w-full flex items-center justify-between p-2 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors text-left">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {template.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {template.items.length} items
                  </p>
                </div>
                <lucide_react_1.ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0"/>
              </button>))}
          </div>
        </div>)}

      {/* Search */}
      {templates.length > 3 && (<div className="relative mb-3">
          <lucide_react_1.Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/>
          <input_1.Input type="text" placeholder="Buscar plantilla..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-8 text-sm"/>
        </div>)}

      {/* All templates */}
      <div className="space-y-1 max-h-60 overflow-y-auto">
        {filteredTemplates.map((template) => (<div key={template.id} className="group flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors">
            <button onClick={() => handleSelect(template)} className="flex-1 min-w-0 text-left">
              <p className="text-sm text-white truncate">{template.name}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-2">
                <span>{template.items.length} items</span>
                <span className="flex items-center gap-1">
                  <lucide_react_1.Clock className="w-3 h-3"/>
                  {formatDate(template.updatedAt)}
                </span>
              </p>
            </button>
            <button_1.Button variant="ghost" size="sm" onClick={() => setDeleteConfirm(template.id)} className="opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive hover:bg-destructive/20 h-7 w-7 p-0">
              <lucide_react_1.Trash2 className="w-3.5 h-3.5"/>
            </button_1.Button>
          </div>))}

        {filteredTemplates.length === 0 && search && (<p className="text-sm text-muted-foreground text-center py-4">
            No se encontraron plantillas
          </p>)}
      </div>

      {/* Delete confirmation */}
      <dialog_1.Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <dialog_1.DialogContent className="sm:max-w-md">
          <dialog_1.DialogHeader>
            <dialog_1.DialogTitle>Eliminar plantilla</dialog_1.DialogTitle>
          </dialog_1.DialogHeader>
          <p className="text-muted-foreground">
            ¿Estas seguro que deseas eliminar esta plantilla? Esta accion no se
            puede deshacer.
          </p>
          <dialog_1.DialogFooter>
            <button_1.Button variant="ghost" onClick={() => setDeleteConfirm(null)}>
              Cancelar
            </button_1.Button>
            <button_1.Button variant="destructive" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>
              Eliminar
            </button_1.Button>
          </dialog_1.DialogFooter>
        </dialog_1.DialogContent>
      </dialog_1.Dialog>
    </div>);
}
function GuardarPlantillaModal({ open, onOpenChange, tipoDte, items, condicionPago, cliente, }) {
    const { addTemplate } = (0, templates_1.useTemplatesStore)();
    const [name, setName] = React.useState('');
    const [description, setDescription] = React.useState('');
    const [includeClient, setIncludeClient] = React.useState(false);
    const handleSave = () => {
        if (!name.trim())
            return;
        addTemplate({
            name: name.trim(),
            description: description.trim() || undefined,
            tipoDte,
            cliente: includeClient && cliente ? {
                nombre: cliente.nombre,
                numDocumento: cliente.numDocumento,
                tipoDocumento: cliente.tipoDocumento,
            } : undefined,
            items: items.map(({ codigo, descripcion, cantidad, precioUnitario, esGravado, esExento, descuento, subtotal, iva, total }) => ({
                codigo,
                descripcion,
                cantidad,
                precioUnitario,
                esGravado,
                esExento,
                descuento,
                subtotal,
                iva,
                total,
            })),
            condicionPago,
        });
        setName('');
        setDescription('');
        setIncludeClient(false);
        onOpenChange(false);
    };
    return (<dialog_1.Dialog open={open} onOpenChange={onOpenChange}>
      <dialog_1.DialogContent className="sm:max-w-md">
        <dialog_1.DialogHeader>
          <dialog_1.DialogTitle className="flex items-center gap-2">
            <lucide_react_1.Files className="w-5 h-5 text-primary"/>
            Guardar como plantilla
          </dialog_1.DialogTitle>
        </dialog_1.DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <label className="text-sm font-medium mb-1.5 block">
              Nombre de la plantilla *
            </label>
            <input_1.Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Factura mensual servicios" autoFocus/>
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">
              Descripcion (opcional)
            </label>
            <input_1.Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ej: Para clientes de mantenimiento"/>
          </div>

          {cliente && (<label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={includeClient} onChange={(e) => setIncludeClient(e.target.checked)} className="rounded border-muted-foreground/50"/>
              <span className="text-sm">
                Incluir cliente ({cliente.nombre})
              </span>
            </label>)}

          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-2">
              Esta plantilla incluira:
            </p>
            <ul className="text-xs space-y-1">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary"/>
                {items.length} producto(s)
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary"/>
                Tipo: {tipoDte === '01' ? 'Factura' : 'CCF'}
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary"/>
                Condicion: {condicionPago}
              </li>
            </ul>
          </div>
        </div>

        <dialog_1.DialogFooter>
          <button_1.Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </button_1.Button>
          <button_1.Button onClick={handleSave} disabled={!name.trim()}>
            <lucide_react_1.Plus className="w-4 h-4 mr-2"/>
            Guardar plantilla
          </button_1.Button>
        </dialog_1.DialogFooter>
      </dialog_1.DialogContent>
    </dialog_1.Dialog>);
}
