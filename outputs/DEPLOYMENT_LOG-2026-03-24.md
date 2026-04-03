# Deployment Log - Phase 1 Pricing Restructuring
**Date:** 2026-03-24
**Executed by:** Claude Code (automated)

---

## Pre-Deployment Investigation

| Item | Status |
|------|--------|
| Staging exists | **NO** — single production environment |
| Production DB | `facturador-rc-sql.database.windows.net` / `facturadordb` |
| Resource Group | `facturador-sv-rg` |
| Azure SQL backups | Enabled, Local redundancy |
| Earliest restore point | 2026-03-17T16:21:17Z |
| API status pre-deploy | Healthy (verified via /health) |
| Deployment slots | None |

## Schema Migration

| Step | Status | Timestamp |
|------|--------|-----------|
| Add firewall rule (190.150.168.210) | COMPLETED | 2026-03-24 ~16:20 UTC |
| `prisma db push --skip-generate` | COMPLETED | 2026-03-24 ~16:22 UTC (1.81s) |
| Schema changes applied | All additive columns with defaults |

**Columns added:**
- `Plan.maxBranches` (Int, default -1)
- `Plan.maxCatalogItems` (Int, default 100)
- `PlanSupportConfig.resolutionSLAHours` (Int, default 0)
- `PlanSupportConfig.hasLiveChat` (Boolean, default false)
- `PlanSupportConfig.chatSchedule` (String?, nullable)
- `PlanSupportConfig.priority` (String, default "BAJA")
- `SupportTicket.resolutionDeadline` (DateTime?, nullable)
- `SupportTicket.planAtCreation` (String?, nullable)

## Data Seed

| Step | Status |
|------|--------|
| Plan FREE created | $0/mo, 10 DTEs, 1 branch, 50 catalog |
| Plan STARTER updated | $19/mo (was $15), 300 DTEs, 1 branch, 300 catalog |
| Plan PROFESSIONAL updated | $65/mo, 2000 DTEs, 5 branches, 1000 catalog |
| Plan ENTERPRISE updated | $199/mo, unlimited everything |
| PlanSupportConfig FREE | 0h response, 0h resolution, BAJA |
| PlanSupportConfig STARTER | 24h response, 48h resolution, NORMAL |
| PlanSupportConfig PROFESSIONAL | 12h response, 24h resolution, ALTA |
| PlanSupportConfig ENTERPRISE | 2h response, 8h resolution, CRITICA, chat+phone |
| PlanFeature rows for FREE | 13 features seeded (3 enabled, 10 disabled) |

## Data Integrity Verification

| Check | Result |
|-------|--------|
| Tenant count | 13 (unchanged) |
| Support ticket count | 6 (unchanged) |
| Plans count | 4 (was 3, added FREE) |
| All 4 plans verified | Correct pricing, limits, features |

## Cleanup

| Step | Status |
|------|--------|
| Remove firewall rule | COMPLETED |

## Rollback Procedure (if needed)

Azure SQL has automatic point-in-time restore. To rollback:

1. Azure Portal → SQL Database → facturadordb → Restore
2. Select point-in-time before 2026-03-24 16:20 UTC
3. Restore to new database name (e.g., `facturadordb-rollback`)
4. Swap connection strings
5. Delete the corrupted database

**Note:** Schema changes are additive (new columns with defaults). Existing data is untouched. Rollback should only be needed if seed data is incorrect.

## Next Steps

1. **Deploy API code** — `docker build` + push to Azure Container Registry + restart App Service
2. **Deploy Web code** — build + push + restart
3. Verify `/admin/plans` returns 4 plans on live API
4. Verify sidebar badges and plan config page

## Sign-Off

- **Status:** DATABASE MIGRATION + SEED COMPLETE
- **API Code:** Not yet deployed (commit 151e213 on main, needs build+push)
- **Web Code:** Not yet deployed
