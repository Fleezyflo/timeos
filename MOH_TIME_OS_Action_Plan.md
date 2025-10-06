# MOH TIME OS v2.0 — Bulletproof Action Plan (Dubai TZ)
**Date:** 2025-10-01  |  **TZ:** Asia/Dubai

## Objective
Stabilize production by eliminating silent errors, enforcing Sheets API quota safety, hardening bootstrap/entry points, and protecting extreme-dependency paths. Deliver expanded tests and a proven release + rollback.

## Workstreams
| WorkstreamID   | Name                               | Objective                                                                    |
|:---------------|:-----------------------------------|:-----------------------------------------------------------------------------|
| WS1            | Observability & Error Handling     | Eliminate silent error handling with structured logging and error surfacing. |
| WS2            | Quota Safety & Batch Operations    | Remove Sheets API loops; enforce batching and quota guards.                  |
| WS3            | Bootstrap Hardening                | Stabilize container, preload, sheet healer, and test runner paths.           |
| WS4            | Dependency Risk & Circuit Breakers | Protect extreme-dependency functions with circuit breakers and caches.       |
| WS5            | Testing & Load Validation          | Expand unit/integration tests and run quota/load tests.                      |

## Tasks (CSV)
See: 
- [Tasks](sandbox:/mnt/data/MOH_TIME_OS_Action_Tasks.csv) 
- [Test Cases](sandbox:/mnt/data/MOH_TIME_OS_Test_Cases.csv) 
- [Risk Register](sandbox:/mnt/data/MOH_TIME_OS_Risk_Register.csv) 
- [Owner Roles](sandbox:/mnt/data/MOH_TIME_OS_Owner_Roles.csv)

### P0 (Fix Immediately) — Summary
- WS1: Logging on all silent handlers; expand global handler; raise history cap
- WS2: Batch API in SheetHealer & validations; QuotaGuard utility; verify headers caching
- WS5: Load test; Release checklist + rollback playbook

### Acceptance Criteria (Global)
- 0 silent error handlers remain in critical paths (cache/store/container)
- No quota breaches under 10‑minute peak load; batch ops verified
- BatchOperations.getHeaders cache hit ratio ≥ 80% under load
- All entry points authenticated; unauthenticated access denied
- RUN_ALL_TESTS split into sub-suites; no >100‑line functions
- Dashboards show errors/min, quota usage, p95 latency

## Rollout
1. Freeze window (staging->prod) and canary release to 10% traffic.
2. Monitor metrics (quota, error rate, latency) for 30 minutes.
3. Proceed to 100% if green; else execute rollback playbook.
