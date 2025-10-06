#!/usr/bin/env python3

import os
import re
FILES = [
    "appsscript.json",
    "src/0_bootstrap/Preload.gs",
    "src/0_bootstrap/SheetHealer.gs",
    "src/1_globals/Constants.gs",
    "src/1_globals/Container.gs",
    "src/1_globals/Enums.gs",
    "src/1_globals/TimeZoneAwareDate.gs",
    "src/1_globals/TimeZoneUtils.gs",
    "src/1_globals/Utilities.gs",
    "src/2_models/MohTask.gs",
    "src/2_models/TimeBlock.gs",
    "src/3_core/BatchOperations.gs",
    "src/3_core/ConfigManager.gs",
    "src/3_core/CrossExecutionCache.gs",
    "src/3_core/CustomErrors.gs",
    "src/3_core/ErrorHandler.gs",
    "src/3_core/PersistentStore.gs",
    "src/3_core/SmartLogger.gs",
    "src/4_services/ArchiveManager.gs",
    "src/4_services/CalendarSyncManager.gs",
    "src/4_services/DynamicLaneManager.gs",
    "src/4_services/EmailIngestionEngine.gs",
    "src/4_services/FoundationBlocksManager.gs",
    "src/4_services/HumanStateManager.gs",
    "src/4_services/IntelligentScheduler.gs",
    "src/4_services/SenderReputationManager.gs",
    "src/4_services/SystemManager.gs",
    "src/4_services/ZeroTrustTriageEngine.gs",
    "src/5_web/AppSheetBridge.gs",
    "src/5_web/ChatEngine.gs",
    "src/5_web/SecureWebAppAuth.gs",
    "src/5_web/TriggerOrchestrator.gs",
    "src/5_web/WebAppManager.gs",
    "src/6_errors/ApiError.gs",
    "src/6_errors/BaseSystemError.gs",
    "src/6_errors/BusinessLogicError.gs",
    "src/6_errors/DatabaseError.gs",
    "src/6_errors/ValidationError.gs",
    "src/7_support/MockBatchOperations.gs",
    "src/7_support/MockService.gs",
    "src/7_support/SafeColumnAccess.gs",
    "src/7_support/TestSeeder.gs",
    "src/8_setup/ServiceRegistration.gs",
    "src/8_setup/SystemBootstrap.gs",
    "src/8_setup/TriggerSetup.gs",
    "src/9_tests/ComprehensiveTests.gs",
    "src/9_tests/DeepUnitTestHarness.gs",
    "src/9_tests/DeploymentValidation.gs",
    "src/9_tests/MasterTestOrchestrator.gs",
]

class_re = re.compile(r"\bclass\s+([A-Z][A-Za-z0-9_]*)")
extends_re = re.compile(r"\bclass\s+[A-Z][A-Za-z0-9_]*\s+extends\s+([A-Z][A-Za-z0-9_]*)")
new_re = re.compile(r"\bnew\s+([A-Z][A-Za-z0-9_]*)")
static_re = re.compile(r"\b([A-Z][A-Za-z0-9_]*)\s*\.")
service_re = re.compile(r"\bgetService\(\s*['\"]([A-Za-z0-9_]+)['\"]")
services_enum_re = re.compile(r"SERVICES\.([A-Za-z0-9_]+)")

class_to_file, file_to_classes = {}, {}
for path in FILES:
    if not os.path.exists(path):
        continue
    text = open(path, encoding="utf-8").read()
    classes = set(class_re.findall(text))
    file_to_classes[path] = classes
    for cls in classes:
        class_to_file.setdefault(cls, path)

edges = {path: set() for path in FILES}
for path in FILES:
    if not os.path.exists(path):
        continue
    text = open(path, encoding="utf-8").read()
    tokens = set()
    tokens |= set(new_re.findall(text))
    tokens |= set(static_re.findall(text))
    tokens |= set(service_re.findall(text))
    tokens |= set(services_enum_re.findall(text))
    tokens |= set(extends_re.findall(text))
    for token in tokens:
        if token in file_to_classes.get(path, set()):
            continue
        target = class_to_file.get(token)
        if target and target != path:
            edges[path].add((target, token))

print("digraph dependency_map {")
for src, deps in edges.items():
    for dst, label in sorted(deps):
        print(f'  "{src}" -> "{dst}" [label="{label}"];')
print("}")
