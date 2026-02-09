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
exports.FavoritosPanel = FavoritosPanel;
exports.AgregarFavoritoModal = AgregarFavoritoModal;
exports.AddToFavoritesButton = AddToFavoritesButton;
const React = __importStar(require("react"));
const lucide_react_1 = require("lucide-react");
const button_1 = require("@/components/ui/button");
const input_1 = require("@/components/ui/input");
const dialog_1 = require("@/components/ui/dialog");
const templates_1 = require("@/store/templates");
const utils_1 = require("@/lib/utils");
const utils_2 = require("@/lib/utils");
function FavoritosPanel({ onSelectFavorite, className, }) {
    const { favorites, deleteFavorite, getTopFavorites } = (0, templates_1.useTemplatesStore)();
    const [editingId, setEditingId] = React.useState(null);
    const [showAddModal, setShowAddModal] = React.useState(false);
    const topFavorites = getTopFavorites(10);
    const handleSelect = (favorite) => {
        onSelectFavorite(favorite);
    };
    if (favorites.length === 0) {
        return (<div className={(0, utils_2.cn)('glass-card p-4', className)}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <lucide_react_1.Star className="w-4 h-4 text-yellow-500"/>
            <h3 className="font-medium text-sm">Productos Favoritos</h3>
          </div>
          <button_1.Button variant="ghost" size="sm" onClick={() => setShowAddModal(true)} className="h-7 px-2">
            <lucide_react_1.Plus className="w-4 h-4"/>
          </button_1.Button>
        </div>
        <div className="text-center py-4">
          <lucide_react_1.Star className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2"/>
          <p className="text-sm text-muted-foreground">
            Sin favoritos todavia
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Agrega productos frecuentes para acceso rapido
          </p>
          <button_1.Button variant="outline" size="sm" onClick={() => setShowAddModal(true)} className="mt-3">
            <lucide_react_1.Plus className="w-4 h-4 mr-1"/>
            Agregar favorito
          </button_1.Button>
        </div>

        <AgregarFavoritoModal open={showAddModal} onOpenChange={setShowAddModal}/>
      </div>);
    }
    return (<div className={(0, utils_2.cn)('glass-card p-4', className)}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <lucide_react_1.Star className="w-4 h-4 text-yellow-500"/>
          <h3 className="font-medium text-sm">Productos Favoritos</h3>
          <span className="text-xs text-muted-foreground">
            ({favorites.length})
          </span>
        </div>
        <button_1.Button variant="ghost" size="sm" onClick={() => setShowAddModal(true)} className="h-7 px-2">
          <lucide_react_1.Plus className="w-4 h-4"/>
        </button_1.Button>
      </div>

      {/* Quick tip */}
      <p className="text-xs text-muted-foreground mb-2">
        Click para agregar a la factura
      </p>

      {/* Favorites grid */}
      <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
        {topFavorites.map((favorite) => (<button key={favorite.id} onClick={() => handleSelect(favorite)} className="group relative p-2 rounded-lg bg-white/5 hover:bg-white/10 text-left transition-colors">
            <p className="text-sm font-medium text-white truncate pr-5">
              {favorite.descripcion}
            </p>
            <p className="text-xs text-primary">
              {(0, utils_1.formatCurrency)(favorite.precioUnitario)}
            </p>
            <button onClick={(e) => {
                e.stopPropagation();
                deleteFavorite(favorite.id);
            }} className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/20 text-destructive transition-opacity">
              <lucide_react_1.X className="w-3 h-3"/>
            </button>
          </button>))}
      </div>

      <AgregarFavoritoModal open={showAddModal} onOpenChange={setShowAddModal}/>
    </div>);
}
function AgregarFavoritoModal({ open, onOpenChange, initialData, }) {
    const { addFavorite } = (0, templates_1.useTemplatesStore)();
    const [descripcion, setDescripcion] = React.useState(initialData?.descripcion || '');
    const [precio, setPrecio] = React.useState(initialData?.precioUnitario?.toString() || '');
    const [codigo, setCodigo] = React.useState(initialData?.codigo || '');
    const [esGravado, setEsGravado] = React.useState(initialData?.esGravado ?? true);
    React.useEffect(() => {
        if (initialData) {
            setDescripcion(initialData.descripcion);
            setPrecio(initialData.precioUnitario.toString());
            setCodigo(initialData.codigo || '');
            setEsGravado(initialData.esGravado ?? true);
        }
    }, [initialData]);
    const handleSave = () => {
        if (!descripcion.trim() || !precio)
            return;
        addFavorite({
            descripcion: descripcion.trim(),
            precioUnitario: parseFloat(precio),
            codigo: codigo.trim() || undefined,
            esGravado,
        });
        setDescripcion('');
        setPrecio('');
        setCodigo('');
        setEsGravado(true);
        onOpenChange(false);
    };
    const handleClose = () => {
        setDescripcion('');
        setPrecio('');
        setCodigo('');
        setEsGravado(true);
        onOpenChange(false);
    };
    return (<dialog_1.Dialog open={open} onOpenChange={handleClose}>
      <dialog_1.DialogContent className="sm:max-w-md">
        <dialog_1.DialogHeader>
          <dialog_1.DialogTitle className="flex items-center gap-2">
            <lucide_react_1.Star className="w-5 h-5 text-yellow-500"/>
            Agregar producto favorito
          </dialog_1.DialogTitle>
        </dialog_1.DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <label className="text-sm font-medium mb-1.5 block">
              Descripcion *
            </label>
            <input_1.Input value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Ej: Servicio de consultoria" autoFocus/>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Precio unitario *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <input_1.Input type="number" step="0.01" value={precio} onChange={(e) => setPrecio(e.target.value)} placeholder="0.00" className="pl-7"/>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Codigo (opcional)
              </label>
              <input_1.Input value={codigo} onChange={(e) => setCodigo(e.target.value)} placeholder="SKU-001"/>
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={esGravado} onChange={(e) => setEsGravado(e.target.checked)} className="rounded border-muted-foreground/50"/>
            <span className="text-sm">Producto gravado (13% IVA)</span>
          </label>
        </div>

        <dialog_1.DialogFooter>
          <button_1.Button variant="ghost" onClick={handleClose}>
            Cancelar
          </button_1.Button>
          <button_1.Button onClick={handleSave} disabled={!descripcion.trim() || !precio}>
            <lucide_react_1.Star className="w-4 h-4 mr-2"/>
            Guardar favorito
          </button_1.Button>
        </dialog_1.DialogFooter>
      </dialog_1.DialogContent>
    </dialog_1.Dialog>);
}
function AddToFavoritesButton({ item }) {
    const { favorites, addFavorite } = (0, templates_1.useTemplatesStore)();
    const [added, setAdded] = React.useState(false);
    const isAlreadyFavorite = favorites.some((f) => f.descripcion.toLowerCase() === item.descripcion.toLowerCase() &&
        f.precioUnitario === item.precioUnitario);
    const handleAdd = () => {
        if (isAlreadyFavorite)
            return;
        addFavorite({
            descripcion: item.descripcion,
            precioUnitario: item.precioUnitario,
            codigo: item.codigo,
            esGravado: item.esGravado,
        });
        setAdded(true);
        setTimeout(() => setAdded(false), 2000);
    };
    if (isAlreadyFavorite || added) {
        return (<span className="text-yellow-500 text-xs flex items-center gap-1">
        <lucide_react_1.Star className="w-3 h-3 fill-yellow-500"/>
        {added ? 'Agregado!' : 'Favorito'}
      </span>);
    }
    return (<button onClick={handleAdd} className="text-muted-foreground hover:text-yellow-500 transition-colors" title="Agregar a favoritos">
      <lucide_react_1.Star className="w-4 h-4"/>
    </button>);
}
