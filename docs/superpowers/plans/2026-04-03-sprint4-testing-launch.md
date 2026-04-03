# Sprint 4: Testing + Monitoring + Hardening + Launch

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement.

**Goal:** Production-ready PWA. Error tracking, SW updates, device testing, zero P0 bugs.

**Sprint dates:** 2026-05-19 → 2026-05-30

---

## Task 1: Vitest Expansion (8 more tests)
- Dexie migration test, sync edge cases (network drop), DTE normalization, IVA rounding

## Task 2: Playwright E2E — Full Offline Scenario
- Go offline → create invoice → come online → sync

## Task 3: Sentry Integration
- @sentry/nextjs setup, DSN config, custom sync failure events

## Task 4: PWA Analytics
- Track appinstalled event, standalone detection, offline usage

## Task 5: SW Update Strategy
- On updatefound → "Update available" toast → tap to reload

## Task 6: MH Outage Indicator
- Detect 503/timeout from DTE endpoints → show "Hacienda unavailable"

## Task 7: Final Test Run + Build Verification
- All tests pass, both apps build, tag release
