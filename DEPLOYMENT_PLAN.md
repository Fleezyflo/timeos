# MOH TIME OS v2.0 RESTRUCTURING PLAN

## PROJECT OVERVIEW
Complete restructuring of monolithic 19,326-line Google Apps Script into modular, maintainable clasp project.

## PROJECT STRUCTURE
```
moh-time-os-v2/
├── .clasp.json          # Clasp configuration
├── .claspignore         # Ignore patterns
├── appsscript.json      # GAS manifest
├── DEPLOYMENT_PLAN.md   # This document
├── package.json         # Node dependencies
├── .gitignore          # Git ignore patterns
│
├── src/                 # Source code directory
│   ├── 0_bootstrap/     # Critical initialization (loads first)
│   │   ├── Preload.gs
│   │   ├── ErrorBoundary.gs
│   │   └── SheetHealer.gs
│   │
│   ├── 1_globals/       # Constants, enums, utilities
│   │   ├── Constants.gs
│   │   ├── Enums.gs
│   │   ├── TimeZoneUtils.gs
│   │   ├── Container.gs
│   │   └── Utilities.gs
│   │
│   ├── 2_models/        # Data models
│   │   ├── MohTask.gs
│   │   ├── TimeBlock.gs
│   │   └── FoundationBlock.gs
│   │
│   ├── 3_core/          # Core infrastructure
│   │   ├── PersistentStore.gs
│   │   ├── CrossExecutionCache.gs
│   │   ├── BatchOperations.gs
│   │   ├── ErrorHandler.gs
│   │   ├── SmartLogger.gs
│   │   ├── ConfigManager.gs
│   │   └── CustomErrors.gs
│   │
│   ├── 4_services/      # Application services
│   │   ├── IntelligentScheduler.gs
│   │   ├── EmailIngestionEngine.gs
│   │   ├── CalendarSyncManager.gs
│   │   ├── FoundationBlocksManager.gs
│   │   ├── HumanStateManager.gs
│   │   ├── ArchiveManager.gs
│   │   ├── DynamicLaneManager.gs
│   │   ├── SenderReputationManager.gs
│   │   └── SystemManager.gs
│   │
│   ├── 5_webapp/        # Web interface
│   │   ├── WebAppManager.gs
│   │   ├── ChatEngine.gs
│   │   └── AppSheetBridge.gs
│   │
│   ├── 6_triggers/      # Trigger handlers
│   │   ├── TriggerOrchestrator.gs
│   │   └── TriggerEntryPoints.gs
│   │
│   ├── 7_setup/         # Setup & initialization
│   │   ├── ServiceRegistration.gs
│   │   ├── Setup.gs
│   │   └── Bootstrap.gs
│   │
│   └── 8_tests/         # Test functions (BUILD:REMOVE)
│       ├── TestCore.gs
│       ├── TestServices.gs
│       ├── TestIntegration.gs
│       └── TestChaos.gs
│
├── build/               # Production builds
└── docs/               # Documentation
```

## FILE EXTRACTION MAPPING

| Original Lines | Target File | Description |
|----------------|------------|-------------|
| 1-13 | 0_bootstrap/Preload.gs | Critical initialization |
| 14-140 | 1_globals/Constants.gs | Constants and enums |
| 141-270 | 1_globals/TimeZoneUtils.gs | Timezone utilities |
| 271-435 | 1_globals/Container.gs | Dependency container |
| 436-1080 | 2_models/MohTask.gs | Task model class |
| 1081-1250 | 2_models/TimeBlock.gs | Time block model |
| 1251-1450 | 3_core/PersistentStore.gs | Persistence layer |
| 1451-1650 | 3_core/CrossExecutionCache.gs | Caching system |
| 1651-2300 | 3_core/BatchOperations.gs | Batch operations |
| 2301-2650 | 3_core/ErrorHandler.gs | Error handling |
| 2851-3200 | 3_core/SmartLogger.gs | Logging system |
| 3201-3500 | 3_core/ConfigManager.gs | Configuration |
| 3501-3650 | 3_core/CustomErrors.gs | Error classes |
| 3651-5500 | 4_services/IntelligentScheduler.gs | Scheduling engine |
| 5501-6800 | 4_services/EmailIngestionEngine.gs | Email processing |
| 6801-7500 | 4_services/CalendarSyncManager.gs | Calendar sync |
| 7501-8200 | 4_services/FoundationBlocksManager.gs | Time blocks |
| 8201-8800 | 4_services/HumanStateManager.gs | Human state |
| 8801-9500 | 4_services/SystemManager.gs | System management |
| 9501-10200 | 5_webapp/WebAppManager.gs | Web interface |
| 10201-11000 | 5_webapp/ChatEngine.gs | Chat commands |
| 11001-11500 | 5_webapp/AppSheetBridge.gs | AppSheet API |
| 11501-12000 | 6_triggers/TriggerOrchestrator.gs | Trigger control |
| 12001-12200 | 6_triggers/TriggerEntryPoints.gs | Entry points |
| 12201-12500 | 7_setup/ServiceRegistration.gs | Service setup |
| 12501-13000 | 7_setup/Setup.gs | System setup |
| 16968-17176 | 7_setup/Bootstrap.gs | Bootstrap |
| 13001-18525 | 8_tests/* | Test functions |
| 18070-18525 | 1_globals/Utilities.gs | Utility functions |

## OPTIMIZATION FEATURES

### Performance Optimizations
- **Lazy Loading**: Services initialize only when first accessed
- **Two-Tier Caching**: Memory cache + persistent cache
- **Batch Processing**: Grouped API calls for efficiency
- **Code Splitting**: Load order optimization

### Robustness Features
- **Circuit Breakers**: Prevent cascade failures
- **Atomic Operations**: Temp sheet swapping for data integrity
- **Self-Healing**: Automatic sheet/config recovery
- **Error Boundaries**: Global error catching

### Monitoring
- Service initialization times
- Cache hit rates
- Error frequencies
- Circuit breaker states
- API call counts
- Performance metrics

## DEPLOYMENT STEPS

1. **Create Structure**: Done ✓
2. **Initialize Clasp**: `npx clasp create --type sheets`
3. **Extract Code**: Systematic file extraction
4. **Test Locally**: Validate each component
5. **Deploy**: `npx clasp push`
6. **Validate**: Run bootstrap tests

## PERFORMANCE TARGETS

- **Cold Start**: < 1.5 seconds (from ~5 seconds)
- **API Call Reduction**: 85% via caching
- **Memory Usage**: < 30MB with cache limits
- **Error Recovery**: < 500ms for self-healing

## CRITICAL DEPENDENCIES

```
1. ErrorBoundary (global error handler)
2. Constants & Enums
3. Container initialization
4. PersistentStore
5. CrossExecutionCache (depends on PersistentStore)
6. ErrorHandler & SmartLogger
7. ConfigManager (self-healing)
8. BatchOperations (depends on Cache)
9. All other services (lazy loaded)
```

## SELF-HEALING MECHANISMS

1. **Missing Sheets**: Auto-created with correct headers
2. **Corrupted Config**: Falls back to hardcoded defaults
3. **API Failures**: Circuit breaker with graceful degradation
4. **Cache Overflow**: Automatic eviction of old entries
5. **Invalid Data**: Auto-correction with logging
6. **Script Timeout**: Batch operations with checkpoints

## ROLLBACK PLAN

If issues occur:
1. Keep original scriptA.js as backup
2. Can revert via: `npx clasp deployments`
3. All data operations are atomic (no partial updates)
4. Config has self-healing fallbacks

## BUILD SYSTEM

Production builds remove test code:
```bash
# Create production build
node build.js --production
# Output: build/production.gs (40% smaller)
```

This plan transforms the monolithic script into a maintainable, robust, and performant modular system.