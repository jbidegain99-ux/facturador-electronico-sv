# Análisis del Plan Agent Nimo - Claude Code Review (v2)

**Autor:** Claude Code
**Fecha:** 25 de marzo de 2026
**Contexto:** Agent Nimo (FacturoBot) ya está operativo con data ingestada. Solo necesitamos embeber el widget en Facturosv.

---

## 1. Viabilidad Técnica

**✅ Implementable en 1-2 semanas — no 6**

Agent Nimo es un servicio externo ya funcional. El scope real es:
- Embeber un `<script>` tag en el layout del dashboard
- Sincronizar tema dark/light
- Pasar contexto de usuario al widget
- Lazy-load para no impactar performance
- Manejar fallback si el script falla

No se necesita:
- ~~Tablas Prisma nuevas~~
- ~~NestJS AI services/controllers~~
- ~~FAISS, RAG, vector stores~~
- ~~Azure AI Search~~
- ~~Endpoints de sugerencias/búsqueda~~
- ~~HMAC token generation server-side~~

### Dependencias:
| Dependencia | Estado |
|------------|--------|
| Script URL prod de Agent Nimo | ✅ Confirmado |
| Dashboard layout existente | ✅ Listo |
| Theme system (dark/light) | ✅ Zustand store |

### Riesgos:
- **Script falla en cargar:** Bajo impacto, el resto del app funciona normal. Mostrar fallback a email soporte.
- **Performance:** El script se carga lazy (on-click o intersection observer), impacto ~0 en LCP.

---

## 2. Arquitectura

### Lo que se necesita (simple):

```
apps/web/src/
├── components/
│   ├── layout/header.tsx          ← Agregar botón de chat
│   └── chat/
│       ├── chat-widget.tsx        ← Wrapper del script Agent Nimo
│       └── chat-trigger.tsx       ← Botón/icono que abre el widget
└── lib/
    └── widget-loader.ts           ← Carga lazy del script
```

### Flujo:
1. Usuario hace click en icono de chat en header
2. Se carga el script de Agent Nimo (lazy, primera vez)
3. Widget se abre con tema sincronizado
4. Agent Nimo maneja toda la conversación con su propia data

### Integración con tema:
```typescript
// Escuchar cambios de tema en Zustand store
// Comunicar al widget via postMessage o atributo data-theme
```

---

## 3. Seguridad

### Multi-tenant isolation: ✅ No aplica a nivel de widget

Agent Nimo maneja su propia data ingestada. No accede a datos de tenants individuales de Facturosv — es un bot de soporte/documentación general del producto.

Si en el futuro se quiere pasar contexto del tenant al widget, se haría via postMessage con datos no-sensibles (nombre del plan, tipo de DTE activo, etc.).

---

## 4. Timeline Realista

| Día | Entregable |
|-----|-----------|
| **1** | Componente `ChatWidget` + `ChatTrigger` + lazy loader |
| **2** | Integración en header + sincronización de tema + fallback |
| **3** | Testing manual + ajustes de posición/z-index/responsive |
| **4** | Feature flag `AGENT_NIMO_ENABLED` + deploy a staging |
| **5** | QA + deploy a prod |

---

## 5. Próximos Pasos

1. **Aprobar este scope simplificado** — embeber widget, no construir AI stack
2. **Implementar** — ~5 días de trabajo real
3. **Deploy** — feature flag para rollout gradual

---

## 6. Preguntas Menores

1. **Posición del widget:** ¿Icono en el header (junto a notificaciones/tema) o burbuja flotante abajo-derecha? El screenshot muestra un panel que se abre — ¿fullscreen o sidebar?
2. **¿En qué páginas se muestra?** ¿Solo dashboard o también en páginas públicas (login, registro)?
3. **¿Restricción por plan?** ¿Todos los planes tienen acceso al chatbot o solo PRO/Enterprise?

---

*El plan original de 6 semanas con RAG/FAISS/AI services es innecesario. Agent Nimo ya resuelve todo eso. Nuestro trabajo es solo conectarlo.*
