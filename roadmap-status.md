# 🗺️ Roadmap Status — Facturador Electrónico SV
## Updated: 2026-02-09

---

## Overview

The project follows a phased approach with two parallel tracks:

**Track A — Feature Development** (FASE 0-3): Building new functionality
**Track B — UX Improvements** (Phase 1-5): Enhancing existing experience

---

## TRACK A: Feature Development

### ✅ FASE 0: QA Issues (14 bugs from PDF audit)
**Status: COMPLETED**
- 8/14 issues resolved via Playwright automated testing
- Bug API route duplicada fixed
- Remaining low-priority items (T&C, hints, mobile responsive) deferred

### ⚠️ FASE 1: Catálogo de Inventarios + Migración de Datos
**Status: NOT STARTED**
- [ ] Product/service catalog management
- [ ] Fuzzy search with Fuse.js
- [ ] Multi-level pricing
- [ ] Favorite and recent items
- [ ] CSV/Excel import wizard (8 steps)
- [ ] Salvadoran validators (NIT, DUI, NRC)
- [ ] 4-layer deduplication
**Estimated**: 5-7 days

### ⚠️ FASE 2: Facturación Recurrente + Módulo Contable Básico
**Status: PARTIALLY STARTED**
- [x] Database schema (RecurringInvoiceTemplate, RecurringInvoiceHistory) — created
- [x] API endpoints registered (GET, POST, PATCH, DELETE, pause/resume/cancel/trigger)
- [x] Frontend pages (list, detail, history, create form) — created
- [x] BullMQ processor and scheduler — code exists
- [ ] **API NOT DEPLOYED** — recurring-invoices module exists in code but API v17 doesn't include it (needs Redis/BullMQ setup)
- [ ] Módulo contable básico (double-entry bookkeeping)
- [ ] Accounting journal entries
- [ ] Chart of accounts
**Estimated**: 5-7 days (needs Redis on Azure + API rebuild)

### ⚠️ FASE 3: Cotizaciones + Webhooks
**Status: NOT STARTED**
- [ ] Quote/estimate creation
- [ ] Quote → Invoice conversion
- [ ] Webhook system for events (dte.created, dte.processed, etc.)
- [ ] API pública documentada
**Estimated**: 5-7 days

---

## TRACK B: UX Improvements (5 Phases)

### ⚠️ Phase 1: Redesign Invoice Wizard
**Status: NOT STARTED**
- [ ] Single-page invoice creation (replace multi-step wizard)
- [ ] Intelligent client search (autocomplete)
- [ ] Real-time calculations
- [ ] Target: reduce invoice creation from ~3 min to <30 sec

### ⚠️ Phase 2: Guided Onboarding
**Status: PARTIALLY IMPLEMENTED**
- [x] Onboarding status endpoint exists
- [x] Basic onboarding wizard component exists
- [ ] Full guided setup for new tenants
- [ ] Hacienda registration assistant

### ⚠️ Phase 3: Productivity Features
**Status: PARTIALLY IMPLEMENTED**
- [x] Recurring invoices — UI built, API needs deployment
- [ ] Invoice templates (save and reuse)
- [ ] Command palette (Cmd+K)
- [ ] Quick actions

### ⚠️ Phase 4: Reporting & Analytics
**Status: NOT STARTED**
- [ ] Dashboard with real-time stats
- [ ] Monthly sales reports
- [ ] PDF/Excel export
- [ ] Libro de IVA automático
- [ ] Configurable notifications

### ⚠️ Phase 5: Infrastructure & Performance
**Status: NOT STARTED**
- [ ] PWA functionality (offline mode)
- [ ] Performance optimizations
- [ ] Mobile responsive improvements

---

## Sprint History

| Sprint | Scope | Status | Date |
|--------|-------|--------|------|
| FASE 0 Sprint 1 | QA Issues — Alta prioridad | ✅ Done | 2026-02-08 |
| FASE 0 Sprint 2 | QA Issues — Media prioridad | ✅ Done | 2026-02-08 |
| FASE 2 Sprint 1 | Pagination (clientes, facturas) | ✅ Done | 2026-02-09 |
| FASE 2 Sprint 2 | Recurring Invoices (UI + partial API) | ⚠️ Partial | 2026-02-09 |
| Production Fixes | Auth, crashes, infinite loops, forms | ✅ Done | 2026-02-09 |

---

## Current Production State

**What Works:**
- ✅ User authentication (login, register, profile)
- ✅ Tenant management with name display
- ✅ Client management with pagination (355 clients)
- ✅ Client CRUD with form validations (NIT, DUI, NRC, phone, email)
- ✅ Invoice creation wizard (5-step)
- ✅ DTE digital signing and MH transmission
- ✅ Recurring invoices UI (graceful degradation when API unavailable)
- ✅ Configuration pages (Hacienda, email, profile)
- ✅ Dark theme with Republicode branding

**What's Partially Working:**
- ⚠️ Recurring invoices — UI exists but API endpoints not deployed (needs Redis)
- ⚠️ Dashboard — loads but some stats endpoints return 404 (handled gracefully)
- ⚠️ Notifications — bell icon exists but backend may not be fully operational

**What's Not Working / Not Built:**
- ❌ Product/service catalog
- ❌ CSV/Excel import
- ❌ Accounting module
- ❌ Quotes/estimates
- ❌ Webhooks
- ❌ Reports/analytics
- ❌ PWA / offline mode

---

## 🎯 Recommended Next Steps (Priority Order)

### Immediate (Next Session)
1. **Clean up repo** — .gitignore for coverage/, remove temp .md files, push to GitHub
2. **Deploy API with recurring-invoices** — Setup Redis on Azure, rebuild API v18 with BullMQ module
3. **Test all pages end-to-end** — Dashboard, Facturas, Reportes, Configuración

### Short Term (This Week)
4. **FASE 1: Catálogo** — Product/service catalog is foundation for faster invoicing
5. **Phase 1: Invoice Wizard Redesign** — Single-page experience for core UX improvement

### Medium Term (Next 2-3 Weeks)
6. **FASE 2 Complete**: Finish recurring invoices + basic accounting
7. **Phase 4: Reporting** — Dashboard analytics, sales reports

### Long Term (Month+)
8. **FASE 3**: Quotes, webhooks, public API
9. **Phase 5**: PWA, performance, mobile
