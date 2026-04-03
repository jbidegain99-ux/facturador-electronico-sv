# Framework Upgrade Plan — Facturosv.com

## Current Versions
- Next.js: 14.1.0 → upgrading to 14.2.x (in progress)
- NestJS: 10.3.0 (latest: 11.x)
- Prisma: 5.10.0 (latest: 6.x)
- React: 18.x
- TypeScript: 5.4.0

## NestJS 10 → 11 (Evaluate — NOT safe for this session)

### Breaking Changes (v11):
- Minimum Node.js 20 (we already use 20 — OK)
- `@nestjs/platform-express` changes to middleware
- `@nestjs/swagger` API changes
- `@nestjs/passport` strategy registration changes
- ConfigService generic type parameter changes

### Migration Steps:
1. Create feature branch
2. Update all @nestjs/* packages to ^11.0.0
3. Update @nestjs/swagger decorators
4. Test all endpoints
5. Test auth flow (passport changes)
6. Test throttling (may have changes)
7. Run full e2e suite
8. Deploy to staging first

### Risk: HIGH — auth and middleware changes could break production
### Effort: 2-3 days including testing
### Recommendation: Schedule for dedicated sprint, not a refactor session

---

## Prisma 5 → 6 (Evaluate — NOT safe for this session)

### Breaking Changes (v6):
- New query engine architecture
- Changes to `$queryRaw` return types
- Deprecated methods removed
- Changes to client generation
- New migration format

### Migration Steps:
1. Create feature branch
2. `npm install prisma@6 @prisma/client@6`
3. Run `npx prisma generate` — check for errors
4. Test all database queries
5. Test raw SQL queries (we use $queryRawUnsafe in analytics)
6. Test transactions (we use interactive transactions)
7. Run full test suite
8. Deploy to staging first

### Risk: HIGH — query engine changes could affect all DB operations
### Effort: 2-3 days including testing
### Recommendation: Schedule for dedicated sprint after NestJS upgrade

---

## Recommended Upgrade Order:
1. Next.js 14.1 → 14.2.x (DOING NOW — patch only, low risk)
2. NestJS 10 → 11 (next sprint)
3. Prisma 5 → 6 (after NestJS)
4. Next.js 14 → 15 (after Prisma, requires React 19 evaluation)
