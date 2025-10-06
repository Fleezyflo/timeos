
## AUDIT SUMMARY

| Metric | Count |
|--------|-------|
| **Total Files Audited** | 58 |
| **Total Functions Analyzed** | 847 |
| **Orphaned Functions** | 0 (0.0%) |
| **Functions with Health Flags** | 118 (13.9%) |

**NOTE:** This automated audit provides high-level analysis. Manual code review recommended for critical functions.


## 1_GLOBALS FOLDER


### FILE: src/1_globals/TimeZoneUtils.gs
**LINES:** 461
**FUNCTIONS:** 34


#### FUNCTION: TimeZoneAwareDate.toISOString
**LINES:** 14+
**SIGNATURE:** `static toISOString(date) {`
**WIRED-UP:** 86 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: TimeZoneAwareDate.parseISO
**LINES:** 76+
**SIGNATURE:** `static parseISO(dateString) {`
**WIRED-UP:** 13 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: TimeZoneAwareDate.now
**LINES:** 134+
**SIGNATURE:** `static now() {`
**WIRED-UP:** 202 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: TimeZoneAwareDate.startOfDay
**LINES:** 141+
**SIGNATURE:** `static startOfDay(date = new Date()) {`
**WIRED-UP:** 4 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: TimeZoneAwareDate.endOfDay
**LINES:** 150+
**SIGNATURE:** `static endOfDay(date = new Date()) {`
**WIRED-UP:** 3 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: TimeZoneAwareDate.addDays
**LINES:** 159+
**SIGNATURE:** `static addDays(date, days) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: TimeZoneAwareDate.isTimeForTrigger
**LINES:** 172+
**SIGNATURE:** `static isTimeForTrigger(targetHour, targetMinute = 0) {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: TimeZoneAwareDate.compare
**LINES:** 182+
**SIGNATURE:** `static compare(date1, date2) {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: TimeZoneAwareDate.addHours
**LINES:** 197+
**SIGNATURE:** `static addHours(date, hours) {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: TimeZoneAwareDate.addMinutes
**LINES:** 210+
**SIGNATURE:** `static addMinutes(date, minutes) {`
**WIRED-UP:** 7 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: TimeZoneAwareDate.daysBetween
**LINES:** 223+
**SIGNATURE:** `static daysBetween(date1, date2) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: TimeZoneAwareDate.hoursBetween
**LINES:** 233+
**SIGNATURE:** `static hoursBetween(date1, date2) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: TimeZoneAwareDate.minutesBetween
**LINES:** 241+
**SIGNATURE:** `static minutesBetween(date1, date2) {`
**WIRED-UP:** 3 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: TimeZoneAwareDate.isSameDay
**LINES:** 249+
**SIGNATURE:** `static isSameDay(date1, date2) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: TimeZoneAwareDate.isToday
**LINES:** 260+
**SIGNATURE:** `static isToday(date) {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: TimeZoneAwareDate.isPast
**LINES:** 267+
**SIGNATURE:** `static isPast(date) {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: TimeZoneAwareDate.isFuture
**LINES:** 274+
**SIGNATURE:** `static isFuture(date) {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: TimeZoneAwareDate.formatForDisplay
**LINES:** 281+
**SIGNATURE:** `static formatForDisplay(date, format = 'yyyy-MM-dd HH:mm') {`
**WIRED-UP:** 4 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: TimeZoneAwareDate.formatTime
**LINES:** 298+
**SIGNATURE:** `static formatTime(date) {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: TimeZoneAwareDate.formatDate
**LINES:** 305+
**SIGNATURE:** `static formatDate(date) {`
**WIRED-UP:** 16 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: TimeZoneAwareDate.combineDateTime
**LINES:** 312+
**SIGNATURE:** `static combineDateTime(date, timeString) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: TimeZoneAwareDate._getTimezoneOffset
**LINES:** 332+
**SIGNATURE:** `static _getTimezoneOffset() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: TimeZoneAwareDate._addToCache
**LINES:** 340+
**SIGNATURE:** `static _addToCache(key, value) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: TimeZoneAwareDate.getCacheStats
**LINES:** 354+
**SIGNATURE:** `static getCacheStats() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: TimeZoneAwareDate.clearCache
**LINES:** 367+
**SIGNATURE:** `static clearCache() {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: TimeZoneAwareDate.getWeekBoundaries
**LINES:** 376+
**SIGNATURE:** `static getWeekBoundaries(date = new Date()) {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: TimeZoneAwareDate.getMonthBoundaries
**LINES:** 391+
**SIGNATURE:** `static getMonthBoundaries(date = new Date()) {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: TimeZoneAwareDate.isBusinessHours
**LINES:** 401+
**SIGNATURE:** `static isBusinessHours(date) {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: TimeZoneAwareDate.getNextBusinessDay
**LINES:** 409+
**SIGNATURE:** `static getNextBusinessDay(date = new Date()) {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: TimeZoneAwareDate.createDate
**LINES:** 423+
**SIGNATURE:** `static createDate(year, month, day, hour = 0, minute = 0, second = 0) {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: getCurrentTimestamp
**LINES:** 451+
**SIGNATURE:** `function getCurrentTimestamp() {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: formatTimestamp
**LINES:** 455+
**SIGNATURE:** `function formatTimestamp(date) {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: parseTimestamp
**LINES:** 459+
**SIGNATURE:** `function parseTimestamp(dateString) {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


### FILE: src/1_globals/Utilities.gs
**LINES:** 697
**FUNCTIONS:** 26


#### FUNCTION: generateId
**LINES:** 14+
**SIGNATURE:** `function generateId() {`
**WIRED-UP:** 3 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: safeJsonParse
**LINES:** 24+
**SIGNATURE:** `function safeJsonParse(jsonString, defaultValue = null) {`
**WIRED-UP:** 3 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: ensureArray
**LINES:** 38+
**SIGNATURE:** `function ensureArray(value) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: calculateConfigurableAgingMultiplier
**LINES:** 51+
**SIGNATURE:** `function calculateConfigurableAgingMultiplier(rolloverCount, config) {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: sanitizeString
**LINES:** 91+
**SIGNATURE:** `function sanitizeString(input) {`
**WIRED-UP:** 4 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: calculateConfigurablePriorityDecay
**LINES:** 125+
**SIGNATURE:** `function calculateConfigurablePriorityDecay(daysSinceCreation, basePriority, config) {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: calculateConfigurableUrgencyScore
**LINES:** 175+
**SIGNATURE:** `function calculateConfigurableUrgencyScore(deadline, scheduledTime, currentTime, config) {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: triggerCascadeRecalculation
**LINES:** 225+
**SIGNATURE:** `function triggerCascadeRecalculation(delayedTask, currentTime, headers, updates) {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** LARGE FUNCTION - 185 lines


#### FUNCTION: isValidEmail
**LINES:** 414+
**SIGNATURE:** `function isValidEmail(email) {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: isValidISODate
**LINES:** 421+
**SIGNATURE:** `function isValidISODate(dateString) {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: isValidPositiveInteger
**LINES:** 428+
**SIGNATURE:** `function isValidPositiveInteger(value) {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: isValidDecimal
**LINES:** 435+
**SIGNATURE:** `function isValidDecimal(value) {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: isValidTime24H
**LINES:** 442+
**SIGNATURE:** `function isValidTime24H(timeString) {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: safeJSONParse
**LINES:** 449+
**SIGNATURE:** `function safeJSONParse(jsonString, fallback = null) {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: safeJSONStringify
**LINES:** 469+
**SIGNATURE:** `function safeJSONStringify(obj, fallback = '{}') {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: truncateString
**LINES:** 489+
**SIGNATURE:** `function truncateString(str, maxLength, suffix = '...') {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: generateRandomString
**LINES:** 504+
**SIGNATURE:** `function generateRandomString(length = 8, charset = 'abcdefghijklmnopqrstuvwxyz0123456789') {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: deepClone
**LINES:** 515+
**SIGNATURE:** `function deepClone(obj) {`
**WIRED-UP:** 7 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: safePercentage
**LINES:** 541+
**SIGNATURE:** `function safePercentage(numerator, denominator, decimals = 1) {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: formatDuration
**LINES:** 553+
**SIGNATURE:** `function formatDuration(minutes) {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: calculateMovingAverage
**LINES:** 571+
**SIGNATURE:** `function calculateMovingAverage(values, windowSize = 5) {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: retryWithBackoff
**LINES:** 590+
**SIGNATURE:** `function retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** BLOCKING SLEEP - blocks execution


#### FUNCTION: debounce
**LINES:** 621+
**SIGNATURE:** `function debounce(func, wait) {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: throttle
**LINES:** 636+
**SIGNATURE:** `function throttle(func, limit) {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: getPerformanceStatus
**LINES:** 650+
**SIGNATURE:** `function getPerformanceStatus(metric, value) {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: parseDateValue
**LINES:** 672+
**SIGNATURE:** `function parseDateValue(dateInput) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** SILENT ERROR HANDLING - catch without logging/rethrowing


## 2_MODELS FOLDER


### FILE: src/2_models/MohTask.gs
**LINES:** 800
**FUNCTIONS:** 32


#### FUNCTION: MohTask.constructor
**LINES:** 12+
**SIGNATURE:** `constructor(data = {}) {`
**WIRED-UP:** 45 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: MohTask._generateActionId
**LINES:** 70+
**SIGNATURE:** `_generateActionId() {`
**WIRED-UP:** 3 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: MohTask._getCacheKey
**LINES:** 79+
**SIGNATURE:** `_getCacheKey(data) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: MohTask._validateAndSetDefaults
**LINES:** 94+
**SIGNATURE:** `_validateAndSetDefaults() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: MohTask._validateDates
**LINES:** 184+
**SIGNATURE:** `_validateDates(errors) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** SILENT ERROR HANDLING - catch without logging/rethrowing


#### FUNCTION: MohTask._validateSchedulingMetadata
**LINES:** 236+
**SIGNATURE:** `_validateSchedulingMetadata() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** SILENT ERROR HANDLING - catch without logging/rethrowing


#### FUNCTION: MohTask.toSheetRow
**LINES:** 256+
**SIGNATURE:** `toSheetRow(headers) {`
**WIRED-UP:** 13 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: MohTask.fromSheetRow
**LINES:** 309+
**SIGNATURE:** `static fromSheetRow(row, headers) {`
**WIRED-UP:** 8 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: MohTask._convertNumericFields
**LINES:** 353+
**SIGNATURE:** `static _convertNumericFields(data) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: MohTask.calculatePriority
**LINES:** 382+
**SIGNATURE:** `calculatePriority(config = null) {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: MohTask._calculateAgingMultiplier
**LINES:** 442+
**SIGNATURE:** `_calculateAgingMultiplier(rolloverCount, config) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: MohTask._calculateUrgencyScore
**LINES:** 476+
**SIGNATURE:** `_calculateUrgencyScore(config) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: MohTask._getLaneBoost
**LINES:** 516+
**SIGNATURE:** `_getLaneBoost() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: MohTask._getContextBonus
**LINES:** 532+
**SIGNATURE:** `_getContextBonus() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: MohTask._calculatePriorityDecay
**LINES:** 552+
**SIGNATURE:** `_calculatePriorityDecay(daysSinceCreation, basePriority, config) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: MohTask.isOverdue
**LINES:** 588+
**SIGNATURE:** `isOverdue() {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** SILENT ERROR HANDLING - catch without logging/rethrowing


#### FUNCTION: MohTask.canTransitionTo
**LINES:** 605+
**SIGNATURE:** `canTransitionTo(newStatus) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: MohTask.updateStatus
**LINES:** 612+
**SIGNATURE:** `updateStatus(newStatus, metadata = {}) {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: MohTask.toJSON
**LINES:** 652+
**SIGNATURE:** `toJSON() {`
**WIRED-UP:** 8 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: MohTask.toDetailedJSON
**LINES:** 673+
**SIGNATURE:** `toDetailedJSON() {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: MohTask._cacheValidatedInstance
**LINES:** 693+
**SIGNATURE:** `_cacheValidatedInstance(cacheKey) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: MohTask._markCacheHit
**LINES:** 713+
**SIGNATURE:** `_markCacheHit() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: MohTask._trackCreationTime
**LINES:** 717+
**SIGNATURE:** `_trackCreationTime(duration) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: MohTask.isVersionCurrent
**LINES:** 728+
**SIGNATURE:** `isVersionCurrent(dbVersion) {`
**WIRED-UP:** 3 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: MohTask.prepareForUpdate
**LINES:** 747+
**SIGNATURE:** `prepareForUpdate() {`
**WIRED-UP:** 4 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: MohTask.fromObject
**LINES:** 757+
**SIGNATURE:** `static fromObject(obj) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: MohTask.isValid
**LINES:** 767+
**SIGNATURE:** `isValid() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: MohTask.getValidationErrors
**LINES:** 774+
**SIGNATURE:** `getValidationErrors() {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: MohTask.clearValidationCache
**LINES:** 781+
**SIGNATURE:** `static clearValidationCache() {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: MohTask.getInstanceCount
**LINES:** 785+
**SIGNATURE:** `static getInstanceCount() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: MohTask.getCacheStats
**LINES:** 789+
**SIGNATURE:** `static getCacheStats() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


### FILE: src/2_models/TimeBlock.gs
**LINES:** 538
**FUNCTIONS:** 24


#### FUNCTION: TimeBlock.constructor
**LINES:** 12+
**SIGNATURE:** `constructor(data = {}) {`
**WIRED-UP:** 45 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: TimeBlock._generateBlockId
**LINES:** 42+
**SIGNATURE:** `_generateBlockId() {`
**WIRED-UP:** 5 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: TimeBlock._parseTime
**LINES:** 51+
**SIGNATURE:** `_parseTime(timeInput) {`
**WIRED-UP:** 3 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: TimeBlock._calculateDuration
**LINES:** 74+
**SIGNATURE:** `_calculateDuration() {`
**WIRED-UP:** 3 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: TimeBlock._validate
**LINES:** 86+
**SIGNATURE:** `_validate() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: TimeBlock.overlaps
**LINES:** 129+
**SIGNATURE:** `overlaps(otherBlock) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: TimeBlock.contains
**LINES:** 141+
**SIGNATURE:** `contains(timestamp) {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: TimeBlock.getOverlapDuration
**LINES:** 151+
**SIGNATURE:** `getOverlapDuration(otherBlock) {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: TimeBlock.split
**LINES:** 165+
**SIGNATURE:** `split(durationMinutes) {`
**WIRED-UP:** 10 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: TimeBlock.merge
**LINES:** 192+
**SIGNATURE:** `merge(otherBlock) {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: TimeBlock.isAdjacent
**LINES:** 215+
**SIGNATURE:** `isAdjacent(otherBlock) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: TimeBlock.shrink
**LINES:** 226+
**SIGNATURE:** `shrink(minutes, fromStart = false, fromEnd = false) {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: TimeBlock.extend
**LINES:** 257+
**SIGNATURE:** `extend(minutes, toStart = false, toEnd = false) {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: TimeBlock.isSuitableFor
**LINES:** 284+
**SIGNATURE:** `isSuitableFor(task) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: TimeBlock.calculateSuitabilityScore
**LINES:** 313+
**SIGNATURE:** `calculateSuitabilityScore(task) {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: TimeBlock.toCalendarEvent
**LINES:** 350+
**SIGNATURE:** `toCalendarEvent() {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: TimeBlock.toSheetRow
**LINES:** 366+
**SIGNATURE:** `toSheetRow(headers) {`
**WIRED-UP:** 13 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: TimeBlock.fromSheetRow
**LINES:** 405+
**SIGNATURE:** `static fromSheetRow(row, headers) {`
**WIRED-UP:** 8 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: TimeBlock._getCloneData
**LINES:** 444+
**SIGNATURE:** `_getCloneData() {`
**WIRED-UP:** 6 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: TimeBlock.toJSON
**LINES:** 460+
**SIGNATURE:** `toJSON() {`
**WIRED-UP:** 8 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: TimeBlock.getInstanceCount
**LINES:** 479+
**SIGNATURE:** `static getInstanceCount() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: TimeBlock.fromTimeComponents
**LINES:** 486+
**SIGNATURE:** `static fromTimeComponents(date, startHour, startMinute, durationMinutes, options = {}) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: TimeBlock.createWorkDayBlocks
**LINES:** 504+
**SIGNATURE:** `static createWorkDayBlocks(date, schedule = null) {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


## 3_CORE FOLDER


### FILE: src/3_core/0_BaseError.gs
**LINES:** 74
**FUNCTIONS:** 5


#### FUNCTION: BaseError.constructor
**LINES:** 14+
**SIGNATURE:** `constructor(message, context = {}) {`
**WIRED-UP:** 45 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: BaseError.toObject
**LINES:** 37+
**SIGNATURE:** `toObject() {`
**WIRED-UP:** 3 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: BaseError.toJSON
**LINES:** 55+
**SIGNATURE:** `toJSON() {`
**WIRED-UP:** 8 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: BaseError.log
**LINES:** 62+
**SIGNATURE:** `log() {`
**WIRED-UP:** 627 call site(s) found
**HEALTH FLAGS:** None


### FILE: src/3_core/BatchOperations.gs
**LINES:** 1253
**FUNCTIONS:** 28


#### FUNCTION: BatchOperations.constructor
**LINES:** 16+
**SIGNATURE:** `constructor(cache, logger) {`
**WIRED-UP:** 45 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: BatchOperations.generateVersion
**LINES:** 30+
**SIGNATURE:** `generateVersion() {`
**WIRED-UP:** 6 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: BatchOperations.deepClone
**LINES:** 37+
**SIGNATURE:** `deepClone(value) {`
**WIRED-UP:** 7 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: BatchOperations.chunkArray
**LINES:** 44+
**SIGNATURE:** `chunkArray(array, chunkSize) {`
**WIRED-UP:** 3 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: BatchOperations.appendRows
**LINES:** 59+
**SIGNATURE:** `appendRows(sheetName, rows) {`
**WIRED-UP:** 14 call site(s) found
**HEALTH FLAGS:** LOOP WITH SHEETS API - quota risk


#### FUNCTION: BatchOperations.clearSheetData
**LINES:** 108+
**SIGNATURE:** `clearSheetData(sheetName) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** LOOP WITH SHEETS API - quota risk


#### FUNCTION: BatchOperations.appendRowsToExternalSheet
**LINES:** 133+
**SIGNATURE:** `appendRowsToExternalSheet(spreadsheetId, sheetName, rows) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** LOOP WITH SHEETS API - quota risk


#### FUNCTION: BatchOperations._getSpreadsheet
**LINES:** 170+
**SIGNATURE:** `_getSpreadsheet() {`
**WIRED-UP:** 7 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: BatchOperations._getSheet
**LINES:** 179+
**SIGNATURE:** `_getSheet(sheetName) {`
**WIRED-UP:** 15 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: BatchOperations.getHeaders
**LINES:** 200+
**SIGNATURE:** `getHeaders(sheetName) {`
**WIRED-UP:** 48 call site(s) found
**HEALTH FLAGS:** LOOP WITH SHEETS API - quota risk


#### FUNCTION: BatchOperations.getAllSheetData
**LINES:** 243+
**SIGNATURE:** `getAllSheetData(sheetName) {`
**WIRED-UP:** 9 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: BatchOperations.batchUpdate
**LINES:** 271+
**SIGNATURE:** `batchUpdate(sheetName, data) {`
**WIRED-UP:** 14 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: BatchOperations.getRowsByFilter
**LINES:** 343+
**SIGNATURE:** `getRowsByFilter(sheetName, filterObject = {}, options = {}) {`
**WIRED-UP:** 24 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: BatchOperations.getRowsByPredicate
**LINES:** 453+
**SIGNATURE:** `getRowsByPredicate(sheetName, predicate, options = {}) {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: BatchOperations.getRowsWithPosition
**LINES:** 500+
**SIGNATURE:** `getRowsWithPosition(sheetName, filterObject = {}) {`
**WIRED-UP:** 9 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: BatchOperations.updateActionWithOptimisticLocking
**LINES:** 581+
**SIGNATURE:** `updateActionWithOptimisticLocking(sheetName, actionId, updatedAction) {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** LOOP WITH SHEETS API - quota risk; SILENT ERROR HANDLING - catch without logging/rethrowing


#### FUNCTION: BatchOperations._handleVersionConflictWithRetry
**LINES:** 643+
**SIGNATURE:** `_handleVersionConflictWithRetry(sheetName, actionId, updatedAction, expectedDbVersion, attempt) {`
**WIRED-UP:** 3 call site(s) found
**HEALTH FLAGS:** BLOCKING SLEEP - blocks execution


#### FUNCTION: BatchOperations._attemptRetryUpdate
**LINES:** 706+
**SIGNATURE:** `_attemptRetryUpdate(sheetName, actionId, updatedAction, attempt) {`
**WIRED-UP:** 3 call site(s) found
**HEALTH FLAGS:** LOOP WITH SHEETS API - quota risk; SILENT ERROR HANDLING - catch without logging/rethrowing


#### FUNCTION: BatchOperations._attemptMergeResolution
**LINES:** 758+
**SIGNATURE:** `_attemptMergeResolution(sheetName, actionId, updatedAction) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** LOOP WITH SHEETS API - quota risk


#### FUNCTION: BatchOperations._intelligentMerge
**LINES:** 819+
**SIGNATURE:** `_intelligentMerge(currentTask, updatedTask) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: BatchOperations.transaction
**LINES:** 891+
**SIGNATURE:** `transaction(operations) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: BatchOperations.performAtomicSwapOrFallback
**LINES:** 995+
**SIGNATURE:** `performAtomicSwapOrFallback(originalSheetName, newData, configManager, logger) {`
**WIRED-UP:** 3 call site(s) found
**HEALTH FLAGS:** LOOP WITH SHEETS API - quota risk


#### FUNCTION: BatchOperations.rollback
**LINES:** 1052+
**SIGNATURE:** `rollback(transactionId) {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: BatchOperations._performRollback
**LINES:** 1088+
**SIGNATURE:** `_performRollback(rollbackData) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: BatchOperations.selfTest
**LINES:** 1122+
**SIGNATURE:** `selfTest() {`
**WIRED-UP:** 22 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: BatchOperations.batchWrite
**LINES:** 1187+
**SIGNATURE:** `batchWrite(sheetName, rows, options = {}) {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** LOOP WITH SHEETS API - quota risk


#### FUNCTION: BatchOperations.batchRead
**LINES:** 1220+
**SIGNATURE:** `batchRead(sheetName, options = {}) {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** LOOP WITH SHEETS API - quota risk


### FILE: src/3_core/ConfigManager.gs
**LINES:** 542
**FUNCTIONS:** 27


#### FUNCTION: HardenedConfigManager.constructor
**LINES:** 31+
**SIGNATURE:** `constructor(cache, persistentStore, batchOperations, logger) {`
**WIRED-UP:** 45 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: HardenedConfigManager._ensureConfigurationLoaded
**LINES:** 45+
**SIGNATURE:** `_ensureConfigurationLoaded() {`
**WIRED-UP:** 7 call site(s) found
**HEALTH FLAGS:** SILENT ERROR HANDLING - catch without logging/rethrowing


#### FUNCTION: HardenedConfigManager._getRawConfig
**LINES:** 61+
**SIGNATURE:** `_getRawConfig(key) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: HardenedConfigManager.get
**LINES:** 79+
**SIGNATURE:** `get(key, defaultValue = null) {`
**WIRED-UP:** 328 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: HardenedConfigManager.getString
**LINES:** 97+
**SIGNATURE:** `getString(key, defaultValue = '') {`
**WIRED-UP:** 14 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: HardenedConfigManager.getBoolean
**LINES:** 105+
**SIGNATURE:** `getBoolean(key, defaultValue = false) {`
**WIRED-UP:** 3 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: HardenedConfigManager.getArray
**LINES:** 113+
**SIGNATURE:** `getArray(key, defaultValue = []) {`
**WIRED-UP:** 4 call site(s) found
**HEALTH FLAGS:** SILENT ERROR HANDLING - catch without logging/rethrowing


#### FUNCTION: HardenedConfigManager.getNumber
**LINES:** 126+
**SIGNATURE:** `getNumber(key, defaultValue = 0, constraints = {}) {`
**WIRED-UP:** 54 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: HardenedConfigManager.getJSON
**LINES:** 156+
**SIGNATURE:** `getJSON(key, defaultValue = {}) {`
**WIRED-UP:** 9 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: HardenedConfigManager.setString
**LINES:** 169+
**SIGNATURE:** `setString(key, value) {`
**WIRED-UP:** 5 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: HardenedConfigManager.setBoolean
**LINES:** 181+
**SIGNATURE:** `setBoolean(key, value) {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: HardenedConfigManager.setNumber
**LINES:** 188+
**SIGNATURE:** `setNumber(key, value) {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: HardenedConfigManager.setArray
**LINES:** 195+
**SIGNATURE:** `setArray(key, value) {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: HardenedConfigManager.setJSON
**LINES:** 205+
**SIGNATURE:** `setJSON(key, value) {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: HardenedConfigManager._loadConfigurationFromSheet
**LINES:** 213+
**SIGNATURE:** `_loadConfigurationFromSheet() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: HardenedConfigManager._handleConfigurationFailure
**LINES:** 261+
**SIGNATURE:** `_handleConfigurationFailure(originalError) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: HardenedConfigManager.getConfigurationHealth
**LINES:** 283+
**SIGNATURE:** `getConfigurationHealth() {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: HardenedConfigManager.reloadConfiguration
**LINES:** 301+
**SIGNATURE:** `reloadConfiguration() {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: HardenedConfigManager.validateConfiguration
**LINES:** 320+
**SIGNATURE:** `validateConfiguration() {`
**WIRED-UP:** 3 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: HardenedConfigManager.setTestOverrides
**LINES:** 373+
**SIGNATURE:** `setTestOverrides(overrides) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: HardenedConfigManager.clearTestOverrides
**LINES:** 381+
**SIGNATURE:** `clearTestOverrides() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: HardenedConfigManager.getAllKeys
**LINES:** 390+
**SIGNATURE:** `getAllKeys() {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: HardenedConfigManager.deleteKey
**LINES:** 422+
**SIGNATURE:** `deleteKey(key) {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: HardenedConfigManager.selfTest
**LINES:** 458+
**SIGNATURE:** `selfTest() {`
**WIRED-UP:** 22 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: HardenedConfigManager.getConfig
**LINES:** 529+
**SIGNATURE:** `getConfig(key, defaultValue = null) {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: HardenedConfigManager.updateConfig
**LINES:** 539+
**SIGNATURE:** `updateConfig(key, value) {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


### FILE: src/3_core/CrossExecutionCache.gs
**LINES:** 569
**FUNCTIONS:** 24


#### FUNCTION: CrossExecutionCache.constructor
**LINES:** 11+
**SIGNATURE:** `constructor(persistentStore) {`
**WIRED-UP:** 45 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: CrossExecutionCache.get
**LINES:** 35+
**SIGNATURE:** `get(key) {`
**WIRED-UP:** 328 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: CrossExecutionCache._checkPersistent
**LINES:** 62+
**SIGNATURE:** `_checkPersistent(key) {`
**WIRED-UP:** 3 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: CrossExecutionCache.set
**LINES:** 89+
**SIGNATURE:** `set(key, value, ttl = null) {`
**WIRED-UP:** 74 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: CrossExecutionCache.getOrCompute
**LINES:** 113+
**SIGNATURE:** `getOrCompute(key, computeFn, ttl = null) {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: CrossExecutionCache._addToMemory
**LINES:** 142+
**SIGNATURE:** `_addToMemory(key, value, ttl = null) {`
**WIRED-UP:** 6 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: CrossExecutionCache._updateAccessOrder
**LINES:** 186+
**SIGNATURE:** `_updateAccessOrder(key) {`
**WIRED-UP:** 3 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: CrossExecutionCache._addToAccessOrder
**LINES:** 194+
**SIGNATURE:** `_addToAccessOrder(key) {`
**WIRED-UP:** 3 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: CrossExecutionCache._removeFromAccessOrder
**LINES:** 201+
**SIGNATURE:** `_removeFromAccessOrder(key) {`
**WIRED-UP:** 6 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: CrossExecutionCache._evictLRU
**LINES:** 208+
**SIGNATURE:** `_evictLRU() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: CrossExecutionCache.delete
**LINES:** 233+
**SIGNATURE:** `delete(key) {`
**WIRED-UP:** 38 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: CrossExecutionCache.has
**LINES:** 258+
**SIGNATURE:** `has(key) {`
**WIRED-UP:** 75 call site(s) found
**HEALTH FLAGS:** SILENT ERROR HANDLING - catch without logging/rethrowing


#### FUNCTION: CrossExecutionCache.clear
**LINES:** 276+
**SIGNATURE:** `clear() {`
**WIRED-UP:** 29 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: CrossExecutionCache.clearAll
**LINES:** 287+
**SIGNATURE:** `clearAll() {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: CrossExecutionCache.cleanup
**LINES:** 303+
**SIGNATURE:** `cleanup() {`
**WIRED-UP:** 4 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: CrossExecutionCache.warmUp
**LINES:** 325+
**SIGNATURE:** `warmUp(keyValuePairs, ttl = null) {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: CrossExecutionCache.getMultiple
**LINES:** 338+
**SIGNATURE:** `getMultiple(keys) {`
**WIRED-UP:** 3 call site(s) found
**HEALTH FLAGS:** SILENT ERROR HANDLING - catch without logging/rethrowing


#### FUNCTION: CrossExecutionCache.setMultiple
**LINES:** 389+
**SIGNATURE:** `setMultiple(keyValuePairs, ttl = null) {`
**WIRED-UP:** 3 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: CrossExecutionCache.getStats
**LINES:** 425+
**SIGNATURE:** `getStats() {`
**WIRED-UP:** 11 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: CrossExecutionCache.getCacheInfo
**LINES:** 443+
**SIGNATURE:** `getCacheInfo() {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: CrossExecutionCache.optimize
**LINES:** 466+
**SIGNATURE:** `optimize() {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: CrossExecutionCache.healthCheck
**LINES:** 507+
**SIGNATURE:** `healthCheck() {`
**WIRED-UP:** 5 call site(s) found
**HEALTH FLAGS:** SILENT ERROR HANDLING - catch without logging/rethrowing


#### FUNCTION: CrossExecutionCache.destroy
**LINES:** 558+
**SIGNATURE:** `destroy() {`
**WIRED-UP:** 4 call site(s) found
**HEALTH FLAGS:** None


### FILE: src/3_core/CustomErrors.gs
**LINES:** 945
**FUNCTIONS:** 80


#### FUNCTION: DatabaseError.constructor
**LINES:** 16+
**SIGNATURE:** `constructor(message, context = {}) {`
**WIRED-UP:** 45 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: DatabaseError.getErrorType
**LINES:** 24+
**SIGNATURE:** `getErrorType() {`
**WIRED-UP:** 7 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: DatabaseError.isRetryable
**LINES:** 28+
**SIGNATURE:** `isRetryable() {`
**WIRED-UP:** 4 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: DatabaseError.sheetNotFound
**LINES:** 32+
**SIGNATURE:** `static sheetNotFound(sheetName) {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: DatabaseError.columnNotFound
**LINES:** 40+
**SIGNATURE:** `static columnNotFound(columnName, sheetName) {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: DatabaseError.invalidData
**LINES:** 49+
**SIGNATURE:** `static invalidData(data, reason) {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: DatabaseError.atomicOperationFailed
**LINES:** 58+
**SIGNATURE:** `static atomicOperationFailed(operation, reason) {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: ValidationError.constructor
**LINES:** 72+
**SIGNATURE:** `constructor(message, context = {}) {`
**WIRED-UP:** 45 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: ValidationError.getErrorType
**LINES:** 84+
**SIGNATURE:** `getErrorType() {`
**WIRED-UP:** 7 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: ValidationError.required
**LINES:** 88+
**SIGNATURE:** `static required(field) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: ValidationError.invalid
**LINES:** 95+
**SIGNATURE:** `static invalid(field, value, constraint) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: ValidationError.outOfRange
**LINES:** 103+
**SIGNATURE:** `static outOfRange(field, value, min, max) {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: ValidationError.invalidEnum
**LINES:** 113+
**SIGNATURE:** `static invalidEnum(field, value, validValues) {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: ValidationError.invalidFormat
**LINES:** 122+
**SIGNATURE:** `static invalidFormat(field, value, expectedFormat) {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: ApiError.constructor
**LINES:** 136+
**SIGNATURE:** `constructor(message, context = {}) {`
**WIRED-UP:** 45 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: ApiError.getErrorType
**LINES:** 149+
**SIGNATURE:** `getErrorType() {`
**WIRED-UP:** 7 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: ApiError.isRetryable
**LINES:** 153+
**SIGNATURE:** `isRetryable() {`
**WIRED-UP:** 4 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: ApiError.quotaExceeded
**LINES:** 167+
**SIGNATURE:** `static quotaExceeded(service, quotaType) {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: ApiError.unauthorized
**LINES:** 177+
**SIGNATURE:** `static unauthorized(service, operation) {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: ApiError.serviceUnavailable
**LINES:** 186+
**SIGNATURE:** `static serviceUnavailable(service) {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: ApiError.timeout
**LINES:** 194+
**SIGNATURE:** `static timeout(service, operation, timeoutMs) {`
**WIRED-UP:** 4 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: ApiError.rateLimitExceeded
**LINES:** 203+
**SIGNATURE:** `static rateLimitExceeded(service, limit, window) {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: ConfigurationError.constructor
**LINES:** 218+
**SIGNATURE:** `constructor(message, context = {}) {`
**WIRED-UP:** 45 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: ConfigurationError.getErrorType
**LINES:** 230+
**SIGNATURE:** `getErrorType() {`
**WIRED-UP:** 7 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: ConfigurationError.missing
**LINES:** 234+
**SIGNATURE:** `static missing(key, source = 'unknown') {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: ConfigurationError.invalid
**LINES:** 242+
**SIGNATURE:** `static invalid(key, value, reason) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: ConfigurationError.parseError
**LINES:** 251+
**SIGNATURE:** `static parseError(key, value, format) {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: AuthenticationError.constructor
**LINES:** 265+
**SIGNATURE:** `constructor(message, context = {}) {`
**WIRED-UP:** 45 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: AuthenticationError.getErrorType
**LINES:** 277+
**SIGNATURE:** `getErrorType() {`
**WIRED-UP:** 7 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: AuthenticationError.accessDenied
**LINES:** 281+
**SIGNATURE:** `static accessDenied(user, resource) {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: AuthenticationError.sessionExpired
**LINES:** 289+
**SIGNATURE:** `static sessionExpired(user) {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: AuthenticationError.invalidCredentials
**LINES:** 296+
**SIGNATURE:** `static invalidCredentials(user) {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: NetworkError.constructor
**LINES:** 308+
**SIGNATURE:** `constructor(message, context = {}) {`
**WIRED-UP:** 45 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: NetworkError.getErrorType
**LINES:** 320+
**SIGNATURE:** `getErrorType() {`
**WIRED-UP:** 7 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: NetworkError.connectionFailed
**LINES:** 324+
**SIGNATURE:** `static connectionFailed(url, reason) {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: NetworkError.timeout
**LINES:** 332+
**SIGNATURE:** `static timeout(url, method, timeoutMs) {`
**WIRED-UP:** 4 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: TimeoutError.constructor
**LINES:** 346+
**SIGNATURE:** `constructor(message, context = {}) {`
**WIRED-UP:** 45 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: TimeoutError.getErrorType
**LINES:** 357+
**SIGNATURE:** `getErrorType() {`
**WIRED-UP:** 7 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: TimeoutError.operationTimeout
**LINES:** 361+
**SIGNATURE:** `static operationTimeout(operation, timeoutMs) {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: TimeoutError.executionTimeout
**LINES:** 368+
**SIGNATURE:** `static executionTimeout(timeoutMs) {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: ErrorFactory.fromError
**LINES:** 384+
**SIGNATURE:** `static fromError(error, context = {}) {`
**WIRED-UP:** 3 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: ErrorFactory.categorizeError
**LINES:** 415+
**SIGNATURE:** `static categorizeError(message) {`
**WIRED-UP:** 3 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: ErrorFactory.isRetryable
**LINES:** 452+
**SIGNATURE:** `static isRetryable(error) {`
**WIRED-UP:** 4 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: ErrorFactory.getRetryDelay
**LINES:** 466+
**SIGNATURE:** `static getRetryDelay(error, attempt = 1) {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: registerGlobalErrorHandlers
**LINES:** 484+
**SIGNATURE:** `function registerGlobalErrorHandlers() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: wrapWithErrorHandling
**LINES:** 525+
**SIGNATURE:** `function wrapWithErrorHandling(fn, errorHandler) {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: safeExecute
**LINES:** 544+
**SIGNATURE:** `function safeExecute(fn, fallback = null, context = {}) {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: BusinessLogicError.constructor
**LINES:** 577+
**SIGNATURE:** `constructor(message, details = {}) {`
**WIRED-UP:** 45 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: BusinessLogicError.validation
**LINES:** 590+
**SIGNATURE:** `static validation(errors, entity = 'entity') {`
**WIRED-UP:** 4 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: BusinessLogicError.invalidStateTransition
**LINES:** 604+
**SIGNATURE:** `static invalidStateTransition(currentState, targetState, entity = 'entity') {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: BusinessLogicError.constraintViolation
**LINES:** 620+
**SIGNATURE:** `static constraintViolation(constraint, value, entity = 'entity') {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: BusinessLogicError.toUserString
**LINES:** 635+
**SIGNATURE:** `toUserString() {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: BusinessLogicError.toJSON
**LINES:** 645+
**SIGNATURE:** `toJSON() {`
**WIRED-UP:** 8 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: SchedulingError.constructor
**LINES:** 662+
**SIGNATURE:** `constructor(message, details = {}) {`
**WIRED-UP:** 45 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: SchedulingError.timeConflict
**LINES:** 676+
**SIGNATURE:** `static timeConflict(task, conflictingTasks) {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: SchedulingError.resourceUnavailable
**LINES:** 692+
**SIGNATURE:** `static resourceUnavailable(resource, requestedTime) {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: SchedulingError.constraintViolation
**LINES:** 708+
**SIGNATURE:** `static constraintViolation(constraint, details) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: SchedulingError.capacityExceeded
**LINES:** 724+
**SIGNATURE:** `static capacityExceeded(date, currentLoad, maxCapacity) {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: SchedulingError.getSuggestions
**LINES:** 740+
**SIGNATURE:** `getSuggestions() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: SchedulingError.toJSON
**LINES:** 761+
**SIGNATURE:** `toJSON() {`
**WIRED-UP:** 8 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: TriageError.constructor
**LINES:** 780+
**SIGNATURE:** `constructor(message, details = {}) {`
**WIRED-UP:** 45 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: TriageError.parsingFailed
**LINES:** 795+
**SIGNATURE:** `static parsingFailed(email, reason) {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: TriageError.classificationFailed
**LINES:** 813+
**SIGNATURE:** `static classificationFailed(email, reason) {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: TriageError.suspiciousContent
**LINES:** 832+
**SIGNATURE:** `static suspiciousContent(email, suspicionReasons) {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: TriageError.lowSenderReputation
**LINES:** 852+
**SIGNATURE:** `static lowSenderReputation(email, reputationScore) {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: TriageError.processingTimeout
**LINES:** 872+
**SIGNATURE:** `static processingTimeout(email, timeoutMs) {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: TriageError.shouldRetry
**LINES:** 890+
**SIGNATURE:** `shouldRetry() {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: TriageError.getRecommendedAction
**LINES:** 897+
**SIGNATURE:** `getRecommendedAction() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: TriageError.toJSON
**LINES:** 910+
**SIGNATURE:** `toJSON() {`
**WIRED-UP:** 8 call site(s) found
**HEALTH FLAGS:** None


### FILE: src/3_core/DistributedLockManager.gs
**LINES:** 444
**FUNCTIONS:** 13


#### FUNCTION: DistributedLockManager.constructor
**LINES:** 16+
**SIGNATURE:** `constructor(persistentStore, logger) {`
**WIRED-UP:** 45 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: DistributedLockManager.tryAcquireLock
**LINES:** 38+
**SIGNATURE:** `tryAcquireLock(lockName, timeoutMs, holderId) {`
**WIRED-UP:** 8 call site(s) found
**HEALTH FLAGS:** BLOCKING SLEEP - blocks execution


#### FUNCTION: DistributedLockManager.releaseLock
**LINES:** 128+
**SIGNATURE:** `releaseLock(lockHandle) {`
**WIRED-UP:** 9 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: DistributedLockManager.isLocked
**LINES:** 172+
**SIGNATURE:** `isLocked(lockName) {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: DistributedLockManager.forceRelease
**LINES:** 194+
**SIGNATURE:** `forceRelease(lockName) {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: DistributedLockManager._getLockKey
**LINES:** 224+
**SIGNATURE:** `_getLockKey(lockName) {`
**WIRED-UP:** 6 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: DistributedLockManager._cleanupStaleLock
**LINES:** 234+
**SIGNATURE:** `_cleanupStaleLock(lockKey, lockName) {`
**WIRED-UP:** 3 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: DistributedLockManager.getActiveLocks
**LINES:** 262+
**SIGNATURE:** `getActiveLocks() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: DistributedLockManager.getMetrics
**LINES:** 298+
**SIGNATURE:** `getMetrics() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: DistributedLockManager.healthCheck
**LINES:** 317+
**SIGNATURE:** `healthCheck() {`
**WIRED-UP:** 5 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: DistributedLockManager.cleanupAllStaleLocks
**LINES:** 341+
**SIGNATURE:** `cleanupAllStaleLocks() {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: DistributedLockManager.selfTest
**LINES:** 380+
**SIGNATURE:** `selfTest() {`
**WIRED-UP:** 22 call site(s) found
**HEALTH FLAGS:** None


### FILE: src/3_core/ErrorHandler.gs
**LINES:** 706
**FUNCTIONS:** 31


#### FUNCTION: ErrorHandler.constructor
**LINES:** 12+
**SIGNATURE:** `constructor(logger) {`
**WIRED-UP:** 45 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: ErrorHandler.executeWithCircuitBreaker
**LINES:** 44+
**SIGNATURE:** `executeWithCircuitBreaker(serviceName, operation, options = {}) {`
**WIRED-UP:** 16 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: ErrorHandler.executeWithRetry
**LINES:** 89+
**SIGNATURE:** `executeWithRetry(operation, retryConfig = {}) {`
**WIRED-UP:** 3 call site(s) found
**HEALTH FLAGS:** BLOCKING SLEEP - blocks execution


#### FUNCTION: ErrorHandler.withRetry
**LINES:** 134+
**SIGNATURE:** `withRetry(operation, contextName = 'operation', retryConfig = {}) {`
**WIRED-UP:** 4 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: ErrorHandler.getServiceStatus
**LINES:** 151+
**SIGNATURE:** `getServiceStatus(serviceName) {`
**WIRED-UP:** 13 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: ErrorHandler.executeWithProtection
**LINES:** 173+
**SIGNATURE:** `executeWithProtection(serviceName, operation, options = {}) {`
**WIRED-UP:** 4 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: ErrorHandler._getOrCreateCircuitBreaker
**LINES:** 189+
**SIGNATURE:** `_getOrCreateCircuitBreaker(serviceName, config = {}) {`
**WIRED-UP:** 4 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: ErrorHandler._isRetryableError
**LINES:** 203+
**SIGNATURE:** `_isRetryableError(error) {`
**WIRED-UP:** 5 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: ErrorHandler._calculateRetryDelay
**LINES:** 237+
**SIGNATURE:** `_calculateRetryDelay(attempt, config) {`
**WIRED-UP:** 5 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: ErrorHandler.getCircuitBreakerStatus
**LINES:** 248+
**SIGNATURE:** `getCircuitBreakerStatus() {`
**WIRED-UP:** 5 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: ErrorHandler.resetCircuitBreaker
**LINES:** 267+
**SIGNATURE:** `resetCircuitBreaker(serviceName) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: ErrorHandler.resetAllCircuitBreakers
**LINES:** 278+
**SIGNATURE:** `resetAllCircuitBreakers() {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: ErrorHandler.executeWithAdaptiveRetry
**LINES:** 291+
**SIGNATURE:** `executeWithAdaptiveRetry(operation, options = {}) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** BLOCKING SLEEP - blocks execution


#### FUNCTION: ErrorHandler.executeWithFallback
**LINES:** 349+
**SIGNATURE:** `executeWithFallback(serviceName, primaryOperation, fallbackOperation, options = {}) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: ErrorHandler.executeBatchWithTolerance
**LINES:** 388+
**SIGNATURE:** `executeBatchWithTolerance(serviceName, items, operation, options = {}) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: ErrorHandler.executeWithGracefulDegradation
**LINES:** 444+
**SIGNATURE:** `executeWithGracefulDegradation(serviceName, operation, degradedOperation, options = {}) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: ErrorHandler.getServiceStatus
**LINES:** 476+
**SIGNATURE:** `getServiceStatus(serviceName) {`
**WIRED-UP:** 13 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: ErrorHandler.getHealth
**LINES:** 488+
**SIGNATURE:** `getHealth() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: ErrorHandler.recordMetric
**LINES:** 520+
**SIGNATURE:** `recordMetric(metric, value) {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: ErrorHandler.getCircuitState
**LINES:** 549+
**SIGNATURE:** `getCircuitState(service) {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: ErrorHandler.selfTest
**LINES:** 574+
**SIGNATURE:** `selfTest() {`
**WIRED-UP:** 22 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: CircuitBreaker.constructor
**LINES:** 604+
**SIGNATURE:** `constructor(serviceName, config, logger) {`
**WIRED-UP:** 45 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: CircuitBreaker.getState
**LINES:** 615+
**SIGNATURE:** `getState() {`
**WIRED-UP:** 8 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: CircuitBreaker.recordSuccess
**LINES:** 631+
**SIGNATURE:** `recordSuccess() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: CircuitBreaker.recordFailure
**LINES:** 644+
**SIGNATURE:** `recordFailure() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: CircuitBreaker.reset
**LINES:** 658+
**SIGNATURE:** `reset() {`
**WIRED-UP:** 6 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: CircuitBreaker._transitionToClosed
**LINES:** 669+
**SIGNATURE:** `_transitionToClosed() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: CircuitBreaker._transitionToOpen
**LINES:** 683+
**SIGNATURE:** `_transitionToOpen() {`
**WIRED-UP:** 3 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: CircuitBreaker._transitionToHalfOpen
**LINES:** 698+
**SIGNATURE:** `_transitionToHalfOpen() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


### FILE: src/3_core/PersistentStore.gs
**LINES:** 830
**FUNCTIONS:** 21


#### FUNCTION: PersistentStore.constructor
**LINES:** 11+
**SIGNATURE:** `constructor() {`
**WIRED-UP:** 45 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: PersistentStore.set
**LINES:** 32+
**SIGNATURE:** `set(key, value, ttl = null) {`
**WIRED-UP:** 74 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: PersistentStore.get
**LINES:** 117+
**SIGNATURE:** `get(key) {`
**WIRED-UP:** 328 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: PersistentStore.has
**LINES:** 194+
**SIGNATURE:** `has(key) {`
**WIRED-UP:** 75 call site(s) found
**HEALTH FLAGS:** SILENT ERROR HANDLING - catch without logging/rethrowing


#### FUNCTION: PersistentStore.delete
**LINES:** 225+
**SIGNATURE:** `delete(key) {`
**WIRED-UP:** 38 call site(s) found
**HEALTH FLAGS:** SILENT ERROR HANDLING - catch without logging/rethrowing


#### FUNCTION: PersistentStore.clear
**LINES:** 239+
**SIGNATURE:** `clear() {`
**WIRED-UP:** 29 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: PersistentStore.getMultiple
**LINES:** 271+
**SIGNATURE:** `getMultiple(keys) {`
**WIRED-UP:** 3 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: PersistentStore.setMultiple
**LINES:** 339+
**SIGNATURE:** `setMultiple(keyValuePairs, ttl = null) {`
**WIRED-UP:** 3 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: PersistentStore._sanitizeKey
**LINES:** 403+
**SIGNATURE:** `_sanitizeKey(key) {`
**WIRED-UP:** 8 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: PersistentStore._compress
**LINES:** 426+
**SIGNATURE:** `_compress(str) {`
**WIRED-UP:** 3 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: PersistentStore._decompress
**LINES:** 442+
**SIGNATURE:** `_decompress(compressedStr) {`
**WIRED-UP:** 3 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: PersistentStore._evictOldEntries
**LINES:** 458+
**SIGNATURE:** `_evictOldEntries() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: PersistentStore.getStats
**LINES:** 534+
**SIGNATURE:** `getStats() {`
**WIRED-UP:** 11 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: PersistentStore.getUsageInfo
**LINES:** 553+
**SIGNATURE:** `getUsageInfo() {`
**WIRED-UP:** 3 call site(s) found
**HEALTH FLAGS:** SILENT ERROR HANDLING - catch without logging/rethrowing


#### FUNCTION: PersistentStore.cleanup
**LINES:** 600+
**SIGNATURE:** `cleanup() {`
**WIRED-UP:** 4 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: PersistentStore.healthCheck
**LINES:** 645+
**SIGNATURE:** `healthCheck() {`
**WIRED-UP:** 5 call site(s) found
**HEALTH FLAGS:** SILENT ERROR HANDLING - catch without logging/rethrowing


#### FUNCTION: PersistentStore.expire
**LINES:** 679+
**SIGNATURE:** `expire(key, ttl) {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: PersistentStore.ttl
**LINES:** 717+
**SIGNATURE:** `ttl(key) {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** SILENT ERROR HANDLING - catch without logging/rethrowing


#### FUNCTION: PersistentStore.scan
**LINES:** 764+
**SIGNATURE:** `scan(pattern) {`
**WIRED-UP:** 3 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: PersistentStore.destroy
**LINES:** 827+
**SIGNATURE:** `destroy() {`
**WIRED-UP:** 4 call site(s) found
**HEALTH FLAGS:** None


### FILE: src/3_core/SmartLogger.gs
**LINES:** 507
**FUNCTIONS:** 26


#### FUNCTION: SmartLogger.constructor
**LINES:** 15+
**SIGNATURE:** `constructor(cache) {`
**WIRED-UP:** 45 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: SmartLogger.setLogLevel
**LINES:** 36+
**SIGNATURE:** `setLogLevel(level) {`
**WIRED-UP:** 4 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: SmartLogger._getSpreadsheet
**LINES:** 46+
**SIGNATURE:** `_getSpreadsheet() {`
**WIRED-UP:** 7 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: SmartLogger._log
**LINES:** 57+
**SIGNATURE:** `_log(severity, component, message, context) {`
**WIRED-UP:** 38 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: SmartLogger._writeToSheet
**LINES:** 144+
**SIGNATURE:** `_writeToSheet(sheet, logRow) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: SmartLogger._flushBatchedLogs
**LINES:** 162+
**SIGNATURE:** `_flushBatchedLogs() {`
**WIRED-UP:** 3 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: SmartLogger.info
**LINES:** 192+
**SIGNATURE:** `info(component, message, context = null) {`
**WIRED-UP:** 218 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: SmartLogger.warn
**LINES:** 202+
**SIGNATURE:** `warn(component, message, context = null) {`
**WIRED-UP:** 83 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: SmartLogger.error
**LINES:** 212+
**SIGNATURE:** `error(component, message, context = null) {`
**WIRED-UP:** 217 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: SmartLogger.debug
**LINES:** 222+
**SIGNATURE:** `debug(component, message, context = null) {`
**WIRED-UP:** 70 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: SmartLogger.log
**LINES:** 232+
**SIGNATURE:** `log(component, message, context = null) {`
**WIRED-UP:** 627 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: SmartLogger.logActivity
**LINES:** 242+
**SIGNATURE:** `logActivity(component, activity, details = {}) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: SmartLogger.performance
**LINES:** 256+
**SIGNATURE:** `performance(component, operation, durationMs, additionalContext = {}) {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: SmartLogger.userActivity
**LINES:** 274+
**SIGNATURE:** `userActivity(action, details = {}) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: SmartLogger.systemEvent
**LINES:** 287+
**SIGNATURE:** `systemEvent(event, details = {}) {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: SmartLogger.flush
**LINES:** 298+
**SIGNATURE:** `flush() {`
**WIRED-UP:** 3 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: SmartLogger.getStats
**LINES:** 306+
**SIGNATURE:** `getStats() {`
**WIRED-UP:** 11 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: SmartLogger.clearBatch
**LINES:** 321+
**SIGNATURE:** `clearBatch() {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: SmartLogger.setBatchSize
**LINES:** 329+
**SIGNATURE:** `setBatchSize(newSize) {`
**WIRED-UP:** 3 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: SmartLogger.setSuppressionWindow
**LINES:** 339+
**SIGNATURE:** `setSuppressionWindow(seconds) {`
**WIRED-UP:** 3 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: SmartLogger.healthCheck
**LINES:** 349+
**SIGNATURE:** `healthCheck() {`
**WIRED-UP:** 5 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: SmartLogger.metric
**LINES:** 398+
**SIGNATURE:** `metric(name, value, tags = {}) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: SmartLogger.audit
**LINES:** 414+
**SIGNATURE:** `audit(action, details = {}) {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: SmartLogger.batch
**LINES:** 429+
**SIGNATURE:** `batch(logs) {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: SmartLogger.selfTest
**LINES:** 451+
**SIGNATURE:** `selfTest() {`
**WIRED-UP:** 22 call site(s) found
**HEALTH FLAGS:** None


## 4_SERVICES FOLDER


### FILE: src/4_services/ArchiveManager.gs
**LINES:** 512
**FUNCTIONS:** 14


#### FUNCTION: ArchiveManager.constructor
**LINES:** 12+
**SIGNATURE:** `constructor(configManager, logger, batchOperations) {`
**WIRED-UP:** 45 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: ArchiveManager.getArchiveSpreadsheetId
**LINES:** 26+
**SIGNATURE:** `getArchiveSpreadsheetId() {`
**WIRED-UP:** 4 call site(s) found
**HEALTH FLAGS:** LOOP WITH SHEETS API - quota risk


#### FUNCTION: ArchiveManager.getArchiveStatus
**LINES:** 63+
**SIGNATURE:** `getArchiveStatus() {`
**WIRED-UP:** 3 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: ArchiveManager.getOrCreateArchiveSheet
**LINES:** 97+
**SIGNATURE:** `getOrCreateArchiveSheet(sheetName, headers) {`
**WIRED-UP:** 3 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: ArchiveManager.archiveCompletedTasks
**LINES:** 151+
**SIGNATURE:** `archiveCompletedTasks(tasks = []) {`
**WIRED-UP:** 3 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: ArchiveManager.archiveProcessedProposals
**LINES:** 208+
**SIGNATURE:** `archiveProcessedProposals(proposals = []) {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: ArchiveManager.appendToArchive
**LINES:** 265+
**SIGNATURE:** `appendToArchive(sheetName, rows) {`
**WIRED-UP:** 4 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: ArchiveManager._taskToArchiveRow
**LINES:** 325+
**SIGNATURE:** `_taskToArchiveRow(task, headers) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: ArchiveManager._proposalToArchiveRow
**LINES:** 344+
**SIGNATURE:** `_proposalToArchiveRow(proposal, headers) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: ArchiveManager.getArchiveStatistics
**LINES:** 360+
**SIGNATURE:** `getArchiveStatistics() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** LOOP WITH SHEETS API - quota risk


#### FUNCTION: ArchiveManager._getSheetLastModified
**LINES:** 418+
**SIGNATURE:** `_getSheetLastModified(sheet) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** SILENT ERROR HANDLING - catch without logging/rethrowing


#### FUNCTION: ArchiveManager.cleanupOldArchives
**LINES:** 432+
**SIGNATURE:** `cleanupOldArchives(retentionPolicy = {}) {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: ArchiveManager.selfTest
**LINES:** 471+
**SIGNATURE:** `selfTest() {`
**WIRED-UP:** 22 call site(s) found
**HEALTH FLAGS:** None


### FILE: src/4_services/AuditProtocol.gs
**LINES:** 193
**FUNCTIONS:** 8


#### FUNCTION: AuditProtocol.constructor
**LINES:** 9+
**SIGNATURE:** `constructor(batchOperations, logger, persistentStore) {`
**WIRED-UP:** 45 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: AuditProtocol.logAuditEvent
**LINES:** 23+
**SIGNATURE:** `logAuditEvent(eventType, details) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: AuditProtocol._flushAuditCache
**LINES:** 68+
**SIGNATURE:** `_flushAuditCache() {`
**WIRED-UP:** 3 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: AuditProtocol._determineSeverity
**LINES:** 86+
**SIGNATURE:** `_determineSeverity(eventType) {`
**WIRED-UP:** 3 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: AuditProtocol.getAuditTrail
**LINES:** 109+
**SIGNATURE:** `getAuditTrail(filters = {}) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: AuditProtocol.generateAuditReport
**LINES:** 137+
**SIGNATURE:** `generateAuditReport(startDate, endDate) {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: AuditProtocol.selfTest
**LINES:** 177+
**SIGNATURE:** `selfTest() {`
**WIRED-UP:** 22 call site(s) found
**HEALTH FLAGS:** None


### FILE: src/4_services/BusinessLogicValidation.gs
**LINES:** 164
**FUNCTIONS:** 7


#### FUNCTION: BusinessLogicValidation.constructor
**LINES:** 9+
**SIGNATURE:** `constructor(batchOperations, logger, errorHandler) {`
**WIRED-UP:** 45 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: BusinessLogicValidation.validateTaskCreation
**LINES:** 20+
**SIGNATURE:** `validateTaskCreation(taskData) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: BusinessLogicValidation.validateStateTransition
**LINES:** 70+
**SIGNATURE:** `validateStateTransition(currentStatus, newStatus) {`
**WIRED-UP:** 3 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: BusinessLogicValidation.validateScheduleConflict
**LINES:** 89+
**SIGNATURE:** `validateScheduleConflict(task, existingTasks) {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: BusinessLogicValidation.validatePriority
**LINES:** 118+
**SIGNATURE:** `validatePriority(task) {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: BusinessLogicValidation.selfTest
**LINES:** 143+
**SIGNATURE:** `selfTest() {`
**WIRED-UP:** 22 call site(s) found
**HEALTH FLAGS:** None


### FILE: src/4_services/CalendarSyncManager.gs
**LINES:** 581
**FUNCTIONS:** 17


#### FUNCTION: CalendarSyncManager.constructor
**LINES:** 12+
**SIGNATURE:** `constructor(batchOperations, configManager, errorHandler, logger) {`
**WIRED-UP:** 45 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: CalendarSyncManager.prepareSyncOperations
**LINES:** 27+
**SIGNATURE:** `prepareSyncOperations(actions = []) {`
**WIRED-UP:** 3 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: CalendarSyncManager.refreshCalendarProjection
**LINES:** 80+
**SIGNATURE:** `refreshCalendarProjection(daysAhead = 7) {`
**WIRED-UP:** 3 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: CalendarSyncManager._getCalendarEvents
**LINES:** 127+
**SIGNATURE:** `_getCalendarEvents(startDate, endDate) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: CalendarSyncManager._eventToProjectionRow
**LINES:** 160+
**SIGNATURE:** `_eventToProjectionRow(event, headers) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: CalendarSyncManager._categorizeEvent
**LINES:** 198+
**SIGNATURE:** `_categorizeEvent(event) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: CalendarSyncManager._getEventVisibility
**LINES:** 226+
**SIGNATURE:** `_getEventVisibility(event) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** SILENT ERROR HANDLING - catch without logging/rethrowing


#### FUNCTION: CalendarSyncManager.syncActionsToCalendar
**LINES:** 240+
**SIGNATURE:** `syncActionsToCalendar(actions = []) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: CalendarSyncManager._createCalendarEvent
**LINES:** 294+
**SIGNATURE:** `_createCalendarEvent(action) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: CalendarSyncManager._updateCalendarEvent
**LINES:** 333+
**SIGNATURE:** `_updateCalendarEvent(eventId, action) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: CalendarSyncManager._buildEventDescription
**LINES:** 374+
**SIGNATURE:** `_buildEventDescription(action) {`
**WIRED-UP:** 3 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: CalendarSyncManager._updateActionCalendarId
**LINES:** 408+
**SIGNATURE:** `_updateActionCalendarId(actionId, eventId) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: CalendarSyncManager.checkCalendarConflicts
**LINES:** 449+
**SIGNATURE:** `checkCalendarConflicts(startTime, endTime) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: CalendarSyncManager.findFreeTimeSlots
**LINES:** 475+
**SIGNATURE:** `findFreeTimeSlots(startDate, endDate, durationMinutes) {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: CalendarSyncManager._formatDate
**LINES:** 521+
**SIGNATURE:** `_formatDate(date) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: CalendarSyncManager.selfTest
**LINES:** 529+
**SIGNATURE:** `selfTest() {`
**WIRED-UP:** 22 call site(s) found
**HEALTH FLAGS:** None


### FILE: src/4_services/DynamicLaneManager.gs
**LINES:** 670
**FUNCTIONS:** 16


#### FUNCTION: DynamicLaneManager.constructor
**LINES:** 12+
**SIGNATURE:** `constructor(configManager, errorHandler, batchOperations, foundationBlocksManager, logger, crossExecutionCache) {`
**WIRED-UP:** 45 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: DynamicLaneManager.loadLanes
**LINES:** 26+
**SIGNATURE:** `loadLanes() {`
**WIRED-UP:** 3 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: DynamicLaneManager.parseRowToLane
**LINES:** 60+
**SIGNATURE:** `parseRowToLane(row, headers) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: DynamicLaneManager.validateLanes
**LINES:** 104+
**SIGNATURE:** `validateLanes(lanes) {`
**WIRED-UP:** 3 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: DynamicLaneManager.normalizeLaneWeights
**LINES:** 169+
**SIGNATURE:** `normalizeLaneWeights(lanes) {`
**WIRED-UP:** 3 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: DynamicLaneManager.allocateLaneBlocks
**LINES:** 200+
**SIGNATURE:** `allocateLaneBlocks(foundationBlocks, lanes) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: DynamicLaneManager.createLaneBlock
**LINES:** 240+
**SIGNATURE:** `createLaneBlock(lane, capacity, foundationBlocks) {`
**WIRED-UP:** 3 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: DynamicLaneManager.findSuitableFoundationBlocks
**LINES:** 288+
**SIGNATURE:** `findSuitableFoundationBlocks(lane, foundationBlocks) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: DynamicLaneManager.allocateTaskToLane
**LINES:** 327+
**SIGNATURE:** `allocateTaskToLane(laneBlock, task, estimatedMinutes) {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: DynamicLaneManager.getLaneUtilization
**LINES:** 387+
**SIGNATURE:** `getLaneUtilization(laneBlocks) {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: DynamicLaneManager.rebalanceLanes
**LINES:** 429+
**SIGNATURE:** `rebalanceLanes(laneBlocks, lanes) {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: DynamicLaneManager.getLaneRecommendations
**LINES:** 486+
**SIGNATURE:** `getLaneRecommendations(tasks, lanes) {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: DynamicLaneManager.selfTest
**LINES:** 570+
**SIGNATURE:** `selfTest() {`
**WIRED-UP:** 22 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: DynamicLaneManager.logEvent
**LINES:** 644+
**SIGNATURE:** `logEvent(event, message, details = null) {`
**WIRED-UP:** 11 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: DynamicLaneManager.getDefaultLaneMetrics
**LINES:** 659+
**SIGNATURE:** `getDefaultLaneMetrics(lane) {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


### FILE: src/4_services/EmailIngestionEngine.gs
**LINES:** 867
**FUNCTIONS:** 27


#### FUNCTION: EmailIngestionEngine.constructor
**LINES:** 12+
**SIGNATURE:** `constructor(configManager, errorHandler, batchOperations, logger, persistentStore) {`
**WIRED-UP:** 45 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: EmailIngestionEngine.processUnreadEmails
**LINES:** 42+
**SIGNATURE:** `processUnreadEmails() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: EmailIngestionEngine._processLabelBasedEmails
**LINES:** 68+
**SIGNATURE:** `_processLabelBasedEmails() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: EmailIngestionEngine._processMessage
**LINES:** 171+
**SIGNATURE:** `_processMessage(message) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: EmailIngestionEngine._quarantinePoisonPill
**LINES:** 226+
**SIGNATURE:** `_quarantinePoisonPill(message, error) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: EmailIngestionEngine._createTaskProposals
**LINES:** 260+
**SIGNATURE:** `_createTaskProposals(proposalDataArray, newCursorTimestamp) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: EmailIngestionEngine._getLastProcessedCursor
**LINES:** 290+
**SIGNATURE:** `_getLastProcessedCursor() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: EmailIngestionEngine._updateLastProcessedCursor
**LINES:** 304+
**SIGNATURE:** `_updateLastProcessedCursor(timestamp) {`
**WIRED-UP:** 3 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: EmailIngestionEngine._isSystemGeneratedContent
**LINES:** 321+
**SIGNATURE:** `_isSystemGeneratedContent(subject, body, senderEmail) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: EmailIngestionEngine._convertTriageResultsToLegacyFormat
**LINES:** 387+
**SIGNATURE:** `_convertTriageResultsToLegacyFormat(triageResults) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: EmailIngestionEngine.runProposalLearningCycle
**LINES:** 403+
**SIGNATURE:** `runProposalLearningCycle() {`
**WIRED-UP:** 5 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: EmailIngestionEngine._initializeLearningSystem
**LINES:** 435+
**SIGNATURE:** `_initializeLearningSystem() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: EmailIngestionEngine._persistLearningData
**LINES:** 509+
**SIGNATURE:** `_persistLearningData(patterns, confidence) {`
**WIRED-UP:** 3 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: EmailIngestionEngine._generateRecommendation
**LINES:** 520+
**SIGNATURE:** `_generateRecommendation(email, patterns, confidence) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: EmailIngestionEngine.recordUserFeedback
**LINES:** 553+
**SIGNATURE:** `recordUserFeedback(proposalId, action, originalProposal, correctedData = null) {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: EmailIngestionEngine._updateSenderReputationScore
**LINES:** 574+
**SIGNATURE:** `_updateSenderReputationScore(senderEmail) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: EmailIngestionEngine._learnKeywordLaneAssociation
**LINES:** 591+
**SIGNATURE:** `_learnKeywordLaneAssociation(content, originalLane, correctedLane, learningPatterns) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: EmailIngestionEngine._learnTimeEstimateCorrection
**LINES:** 608+
**SIGNATURE:** `_learnTimeEstimateCorrection(content, originalMinutes, correctedMinutes, learningPatterns) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: EmailIngestionEngine._calculateActionabilityScoreWithLearning
**LINES:** 624+
**SIGNATURE:** `_calculateActionabilityScoreWithLearning(emailData) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: EmailIngestionEngine.parseTaskFromEmailWithLearning
**LINES:** 673+
**SIGNATURE:** `parseTaskFromEmailWithLearning(emailData) {`
**WIRED-UP:** 3 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: EmailIngestionEngine._extractSignificantKeywords
**LINES:** 735+
**SIGNATURE:** `_extractSignificantKeywords(content) {`
**WIRED-UP:** 6 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: EmailIngestionEngine._extractDateEntities
**LINES:** 751+
**SIGNATURE:** `_extractDateEntities(text) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: EmailIngestionEngine._inferLane
**LINES:** 774+
**SIGNATURE:** `_inferLane(emailData) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: EmailIngestionEngine._estimateTimeRequirement
**LINES:** 809+
**SIGNATURE:** `_estimateTimeRequirement(emailData) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: EmailIngestionEngine._inferPriority
**LINES:** 839+
**SIGNATURE:** `_inferPriority(emailData) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: EmailIngestionEngine._generateTaskDescription
**LINES:** 858+
**SIGNATURE:** `_generateTaskDescription(emailData) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


### FILE: src/4_services/FoundationBlocksManager.gs
**LINES:** 743
**FUNCTIONS:** 22


#### FUNCTION: FoundationBlocksManager.constructor
**LINES:** 13+
**SIGNATURE:** `constructor(configManager, errorHandler, logger) {`
**WIRED-UP:** 45 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: FoundationBlocksManager.generateDailyBlocks
**LINES:** 23+
**SIGNATURE:** `generateDailyBlocks(date) {`
**WIRED-UP:** 5 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: FoundationBlocksManager.generateEnergyBlocks
**LINES:** 76+
**SIGNATURE:** `generateEnergyBlocks(date) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: FoundationBlocksManager.generateBufferBlocks
**LINES:** 127+
**SIGNATURE:** `generateBufferBlocks(date) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: FoundationBlocksManager.getEnergyWindows
**LINES:** 171+
**SIGNATURE:** `getEnergyWindows() {`
**WIRED-UP:** 3 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: FoundationBlocksManager.getBufferConfiguration
**LINES:** 227+
**SIGNATURE:** `getBufferConfiguration() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** SILENT ERROR HANDLING - catch without logging/rethrowing


#### FUNCTION: FoundationBlocksManager.getOptimalContextForEnergy
**LINES:** 260+
**SIGNATURE:** `getOptimalContextForEnergy(energyLevel) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: FoundationBlocksManager.validateBlocks
**LINES:** 273+
**SIGNATURE:** `validateBlocks(blocks) {`
**WIRED-UP:** 3 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: FoundationBlocksManager.isValidWorkDay
**LINES:** 341+
**SIGNATURE:** `isValidWorkDay(date) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: FoundationBlocksManager.parseTimeInDate
**LINES:** 357+
**SIGNATURE:** `parseTimeInDate(date, timeString) {`
**WIRED-UP:** 6 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: FoundationBlocksManager.formatDate
**LINES:** 385+
**SIGNATURE:** `formatDate(date) {`
**WIRED-UP:** 16 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: FoundationBlocksManager._generateBlockId
**LINES:** 393+
**SIGNATURE:** `_generateBlockId() {`
**WIRED-UP:** 5 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: FoundationBlocksManager.getBlocksForDate
**LINES:** 400+
**SIGNATURE:** `getBlocksForDate(date) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: FoundationBlocksManager.findAvailableCapacity
**LINES:** 434+
**SIGNATURE:** `findAvailableCapacity(blocks, requiredMinutes, energyLevel = null, contextType = null) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: FoundationBlocksManager.allocateTimeInBlock
**LINES:** 475+
**SIGNATURE:** `allocateTimeInBlock(block, minutes, taskId = null) {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: FoundationBlocksManager.getBlocksStatistics
**LINES:** 523+
**SIGNATURE:** `getBlocksStatistics(blocks) {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: FoundationBlocksManager.selfTest
**LINES:** 565+
**SIGNATURE:** `selfTest() {`
**WIRED-UP:** 22 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: FoundationBlocksManager.logEvent
**LINES:** 622+
**SIGNATURE:** `logEvent(event, message, details = null) {`
**WIRED-UP:** 11 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: FoundationBlocksManager.hasFoundationBlocksForDate
**LINES:** 659+
**SIGNATURE:** `hasFoundationBlocksForDate(date) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: FoundationBlocksManager.createDailyFoundationBlocks
**LINES:** 676+
**SIGNATURE:** `createDailyFoundationBlocks(date) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: FoundationBlocksManager._blockToRow
**LINES:** 721+
**SIGNATURE:** `_blockToRow(block, headers) {`
**WIRED-UP:** 4 call site(s) found
**HEALTH FLAGS:** None


### FILE: src/4_services/HumanStateManager.gs
**LINES:** 532
**FUNCTIONS:** 17


#### FUNCTION: HumanStateManager.constructor
**LINES:** 12+
**SIGNATURE:** `constructor(batchOperations, smartLogger, configManager) {`
**WIRED-UP:** 45 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: HumanStateManager.recordHumanState
**LINES:** 30+
**SIGNATURE:** `recordHumanState(state) {`
**WIRED-UP:** 3 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: HumanStateManager.getCurrentHumanState
**LINES:** 68+
**SIGNATURE:** `getCurrentHumanState() {`
**WIRED-UP:** 5 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: HumanStateManager._getDefaultHumanState
**LINES:** 125+
**SIGNATURE:** `_getDefaultHumanState() {`
**WIRED-UP:** 3 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: HumanStateManager._mapStateToNumber
**LINES:** 143+
**SIGNATURE:** `_mapStateToNumber(state, type) {`
**WIRED-UP:** 5 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: HumanStateManager._mapNumberToState
**LINES:** 175+
**SIGNATURE:** `_mapNumberToState(value, type) {`
**WIRED-UP:** 5 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: HumanStateManager._ensureHumanStateSheet
**LINES:** 211+
**SIGNATURE:** `_ensureHumanStateSheet() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: HumanStateManager.calculateTaskSuitability
**LINES:** 227+
**SIGNATURE:** `calculateTaskSuitability(task, humanState = null) {`
**WIRED-UP:** 3 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: HumanStateManager._calculateEnergyMatch
**LINES:** 284+
**SIGNATURE:** `_calculateEnergyMatch(currentEnergy, requiredEnergy) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: HumanStateManager._calculateFocusMatch
**LINES:** 305+
**SIGNATURE:** `_calculateFocusMatch(currentFocus, requiredFocus) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: HumanStateManager._calculateMoodImpact
**LINES:** 325+
**SIGNATURE:** `_calculateMoodImpact(currentMood, taskComplexity) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: HumanStateManager._getTaskRecommendation
**LINES:** 347+
**SIGNATURE:** `_getTaskRecommendation(score) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: HumanStateManager._getTaskSuitabilityReason
**LINES:** 363+
**SIGNATURE:** `_getTaskSuitabilityReason(task, humanState, score) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: HumanStateManager.getSchedulingRecommendations
**LINES:** 378+
**SIGNATURE:** `getSchedulingRecommendations(tasks) {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: HumanStateManager._getStateGuidance
**LINES:** 437+
**SIGNATURE:** `_getStateGuidance(state) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: HumanStateManager.selfTest
**LINES:** 474+
**SIGNATURE:** `selfTest() {`
**WIRED-UP:** 22 call site(s) found
**HEALTH FLAGS:** None


### FILE: src/4_services/IntelligentScheduler.gs
**LINES:** 740
**FUNCTIONS:** 28


#### FUNCTION: IntelligentScheduler.constructor
**LINES:** 20+
**SIGNATURE:** `constructor(foundationManager, calendarManager, errorHandler, logger, configManager, humanStateManager, batchOperations, crossExecutionCache, dynamicLaneManager) {`
**WIRED-UP:** 45 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: IntelligentScheduler.getScoringWeights
**LINES:** 48+
**SIGNATURE:** `getScoringWeights() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: IntelligentScheduler.runSchedulingCycle
**LINES:** 60+
**SIGNATURE:** `runSchedulingCycle(options = {}) {`
**WIRED-UP:** 10 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: IntelligentScheduler.scheduleActions
**LINES:** 124+
**SIGNATURE:** `scheduleActions(actions, timeBlocks) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: IntelligentScheduler._getLearnedEstimationFactors
**LINES:** 202+
**SIGNATURE:** `_getLearnedEstimationFactors() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: IntelligentScheduler._applyEstimationLearning
**LINES:** 270+
**SIGNATURE:** `_applyEstimationLearning(actions, learnedFactors) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: IntelligentScheduler._sortActionsBySchedulingPriority
**LINES:** 305+
**SIGNATURE:** `_sortActionsBySchedulingPriority(actions) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: IntelligentScheduler._findBestAvailableSlot
**LINES:** 321+
**SIGNATURE:** `_findBestAvailableSlot(action, availableBlocks, previousContext, contextMatchBonus, remainingActions) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: IntelligentScheduler.priorityToScore
**LINES:** 359+
**SIGNATURE:** `priorityToScore(priority) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: IntelligentScheduler._calculateSchedulingEfficiency
**LINES:** 375+
**SIGNATURE:** `_calculateSchedulingEfficiency() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: IntelligentScheduler._calculateActiveHours
**LINES:** 422+
**SIGNATURE:** `_calculateActiveHours() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: IntelligentScheduler._calculateTotalAvailableHours
**LINES:** 435+
**SIGNATURE:** `_calculateTotalAvailableHours() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: IntelligentScheduler.getLaneEnergyMapping
**LINES:** 439+
**SIGNATURE:** `getLaneEnergyMapping() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: IntelligentScheduler.getOptimalEnergyForLane
**LINES:** 455+
**SIGNATURE:** `getOptimalEnergyForLane(lane) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: IntelligentScheduler.getOptimalContextForLane
**LINES:** 460+
**SIGNATURE:** `getOptimalContextForLane(lane, effortMinutes) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: IntelligentScheduler.getLaneBlockPreferences
**LINES:** 480+
**SIGNATURE:** `getLaneBlockPreferences() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: IntelligentScheduler.getCompatibilityMatrix
**LINES:** 518+
**SIGNATURE:** `getCompatibilityMatrix() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: IntelligentScheduler.getLaneCompatibility
**LINES:** 532+
**SIGNATURE:** `getLaneCompatibility() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: IntelligentScheduler.calculateEnergyMatch
**LINES:** 541+
**SIGNATURE:** `calculateEnergyMatch(action, block) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: IntelligentScheduler._calculateEnergyDistance
**LINES:** 557+
**SIGNATURE:** `_calculateEnergyDistance(currentEnergy, requiredEnergy) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: IntelligentScheduler.calculateContextMatch
**LINES:** 568+
**SIGNATURE:** `calculateContextMatch(action, block) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: IntelligentScheduler.calculateDeadlineUrgency
**LINES:** 583+
**SIGNATURE:** `calculateDeadlineUrgency(action, slotTime) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: IntelligentScheduler.calculateLanePreference
**LINES:** 599+
**SIGNATURE:** `calculateLanePreference(action, block) {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: IntelligentScheduler._identifyDependencyChains
**LINES:** 615+
**SIGNATURE:** `_identifyDependencyChains(actions) {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: IntelligentScheduler._buildDependencyChain
**LINES:** 651+
**SIGNATURE:** `_buildDependencyChain(actionId, dependsOn, blocks, actionMap, visited, chain) {`
**WIRED-UP:** 4 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: IntelligentScheduler._persistTimeBlocks
**LINES:** 675+
**SIGNATURE:** `_persistTimeBlocks(blocks) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: IntelligentScheduler._blockToRow
**LINES:** 713+
**SIGNATURE:** `_blockToRow(block, headers) {`
**WIRED-UP:** 4 call site(s) found
**HEALTH FLAGS:** None


### FILE: src/4_services/SenderReputationManager.gs
**LINES:** 564
**FUNCTIONS:** 17


#### FUNCTION: SenderReputationManager.constructor
**LINES:** 12+
**SIGNATURE:** `constructor(batchOperations, logger, configManager, cache) {`
**WIRED-UP:** 45 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: SenderReputationManager.getSenderReputation
**LINES:** 37+
**SIGNATURE:** `getSenderReputation(senderEmail) {`
**WIRED-UP:** 11 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: SenderReputationManager.recordFeedback
**LINES:** 85+
**SIGNATURE:** `recordFeedback(senderEmail, feedbackType, additionalContext = {}) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: SenderReputationManager._getReputationTableFromCache
**LINES:** 148+
**SIGNATURE:** `_getReputationTableFromCache() {`
**WIRED-UP:** 3 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: SenderReputationManager._createNewSenderRecordInCache
**LINES:** 205+
**SIGNATURE:** `_createNewSenderRecordInCache(normalizedEmail, reputationTable) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: SenderReputationManager._calculateBayesianScore
**LINES:** 238+
**SIGNATURE:** `_calculateBayesianScore(approvedCount, rejectedCount) {`
**WIRED-UP:** 3 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: SenderReputationManager._getNeutralReputation
**LINES:** 256+
**SIGNATURE:** `_getNeutralReputation(senderEmail) {`
**WIRED-UP:** 3 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: SenderReputationManager._stagePendingUpdate
**LINES:** 276+
**SIGNATURE:** `_stagePendingUpdate(senderEmail, updatedData) {`
**WIRED-UP:** 5 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: SenderReputationManager.flushPendingUpdates
**LINES:** 289+
**SIGNATURE:** `flushPendingUpdates() {`
**WIRED-UP:** 5 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: SenderReputationManager._senderDataToRow
**LINES:** 365+
**SIGNATURE:** `_senderDataToRow(senderData, headers) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: SenderReputationManager.getReputationMultiplier
**LINES:** 382+
**SIGNATURE:** `getReputationMultiplier(senderEmail) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: SenderReputationManager.isSenderBlocked
**LINES:** 406+
**SIGNATURE:** `isSenderBlocked(senderEmail) {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** SILENT ERROR HANDLING - catch without logging/rethrowing


#### FUNCTION: SenderReputationManager.blockSender
**LINES:** 420+
**SIGNATURE:** `blockSender(senderEmail, reason = 'Manual block') {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: SenderReputationManager.unblockSender
**LINES:** 451+
**SIGNATURE:** `unblockSender(senderEmail) {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: SenderReputationManager.getReputationStats
**LINES:** 480+
**SIGNATURE:** `getReputationStats() {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** SILENT ERROR HANDLING - catch without logging/rethrowing


#### FUNCTION: SenderReputationManager.selfTest
**LINES:** 518+
**SIGNATURE:** `selfTest() {`
**WIRED-UP:** 22 call site(s) found
**HEALTH FLAGS:** None


### FILE: src/4_services/SystemManager.gs
**LINES:** 1045
**FUNCTIONS:** 27


#### FUNCTION: SystemManager.constructor
**LINES:** 12+
**SIGNATURE:** `constructor(batchOperations, smartLogger, configManager, errorHandler, archiveManager) {`
**WIRED-UP:** 45 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: SystemManager.checkSchemaStatus
**LINES:** 24+
**SIGNATURE:** `checkSchemaStatus() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: SystemManager.initializeSchema
**LINES:** 60+
**SIGNATURE:** `initializeSchema() {`
**WIRED-UP:** 5 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: SystemManager.runHealthCheck
**LINES:** 83+
**SIGNATURE:** `runHealthCheck() {`
**WIRED-UP:** 9 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: SystemManager.getSystemStatus
**LINES:** 159+
**SIGNATURE:** `getSystemStatus() {`
**WIRED-UP:** 3 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: SystemManager._checkDatabaseHealth
**LINES:** 195+
**SIGNATURE:** `_checkDatabaseHealth() {`
**WIRED-UP:** 3 call site(s) found
**HEALTH FLAGS:** SILENT ERROR HANDLING - catch without logging/rethrowing


#### FUNCTION: SystemManager._checkServiceHealth
**LINES:** 261+
**SIGNATURE:** `_checkServiceHealth() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: SystemManager._checkDataIntegrity
**LINES:** 323+
**SIGNATURE:** `_checkDataIntegrity() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** SILENT ERROR HANDLING - catch without logging/rethrowing


#### FUNCTION: SystemManager._checkConfigurationHealth
**LINES:** 388+
**SIGNATURE:** `_checkConfigurationHealth() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** SILENT ERROR HANDLING - catch without logging/rethrowing


#### FUNCTION: SystemManager._calculateOverallHealth
**LINES:** 458+
**SIGNATURE:** `_calculateOverallHealth(checks) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: SystemManager._writeHealthResults
**LINES:** 481+
**SIGNATURE:** `_writeHealthResults(healthResults) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: SystemManager.runSystemMaintenance
**LINES:** 518+
**SIGNATURE:** `runSystemMaintenance() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** LARGE FUNCTION - 101 lines


#### FUNCTION: SystemManager._basicSchemaHealthCheck
**LINES:** 623+
**SIGNATURE:** `_basicSchemaHealthCheck() {`
**WIRED-UP:** 3 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: SystemManager._basicSchemaRepair
**LINES:** 644+
**SIGNATURE:** `_basicSchemaRepair() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** LOOP WITH SHEETS API - quota risk


#### FUNCTION: SystemManager._getRequiredSheetDefinitions
**LINES:** 675+
**SIGNATURE:** `_getRequiredSheetDefinitions() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: SystemManager._getRequiredSheetNames
**LINES:** 687+
**SIGNATURE:** `_getRequiredSheetNames() {`
**WIRED-UP:** 3 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: SystemManager.getSystemMetrics
**LINES:** 704+
**SIGNATURE:** `getSystemMetrics() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: SystemManager.selfTest
**LINES:** 764+
**SIGNATURE:** `selfTest() {`
**WIRED-UP:** 22 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: SystemManager.createRequiredLabels
**LINES:** 809+
**SIGNATURE:** `createRequiredLabels() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: SystemManager.runCompleteSetup
**LINES:** 837+
**SIGNATURE:** `runCompleteSetup() {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: SystemManager.runScheduleReconciliation
**LINES:** 862+
**SIGNATURE:** `runScheduleReconciliation() {`
**WIRED-UP:** 5 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: SystemManager.archiveOldRecords
**LINES:** 871+
**SIGNATURE:** `archiveOldRecords() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: SystemManager._verifyDatabaseSchema
**LINES:** 890+
**SIGNATURE:** `_verifyDatabaseSchema() {`
**WIRED-UP:** 3 call site(s) found
**HEALTH FLAGS:** LOOP WITH SHEETS API - quota risk


#### FUNCTION: SystemManager.checkSheetHealth
**LINES:** 939+
**SIGNATURE:** `checkSheetHealth() {`
**WIRED-UP:** 4 call site(s) found
**HEALTH FLAGS:** LOOP WITH SHEETS API - quota risk


#### FUNCTION: SystemManager.healSheets
**LINES:** 983+
**SIGNATURE:** `healSheets() {`
**WIRED-UP:** 8 call site(s) found
**HEALTH FLAGS:** LOOP WITH SHEETS API - quota risk


#### FUNCTION: SystemManager.getActiveSystemSpreadsheet
**LINES:** 1027+
**SIGNATURE:** `getActiveSystemSpreadsheet() {`
**WIRED-UP:** 20 call site(s) found
**HEALTH FLAGS:** None


### FILE: src/4_services/ZeroTrustTriageEngine.gs
**LINES:** 659
**FUNCTIONS:** 18


#### FUNCTION: ZeroTrustTriageEngine.constructor
**LINES:** 12+
**SIGNATURE:** `constructor(senderReputationManager, batchOperations, logger, configManager, errorHandler) {`
**WIRED-UP:** 45 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: ZeroTrustTriageEngine.runInboxTriageCycle
**LINES:** 46+
**SIGNATURE:** `runInboxTriageCycle() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: ZeroTrustTriageEngine._executeSieveStage
**LINES:** 132+
**SIGNATURE:** `_executeSieveStage() {`
**WIRED-UP:** 3 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: ZeroTrustTriageEngine._buildSieveSearchQuery
**LINES:** 174+
**SIGNATURE:** `_buildSieveSearchQuery(maxDaysBack) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: ZeroTrustTriageEngine._processEmailThroughPipeline
**LINES:** 210+
**SIGNATURE:** `_processEmailThroughPipeline(email) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: ZeroTrustTriageEngine._executeTechnicalFilter
**LINES:** 246+
**SIGNATURE:** `_executeTechnicalFilter(email) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: ZeroTrustTriageEngine._isAutoGenerated
**LINES:** 284+
**SIGNATURE:** `_isAutoGenerated(email, subject, body, sender) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: ZeroTrustTriageEngine._hasSpamIndicators
**LINES:** 324+
**SIGNATURE:** `_hasSpamIndicators(subject, body) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: ZeroTrustTriageEngine._executeReputationCheck
**LINES:** 354+
**SIGNATURE:** `_executeReputationCheck(email) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: ZeroTrustTriageEngine._executeNLPAnalysis
**LINES:** 391+
**SIGNATURE:** `_executeNLPAnalysis(email) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: ZeroTrustTriageEngine._markEmailApproved
**LINES:** 466+
**SIGNATURE:** `_markEmailApproved(email) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: ZeroTrustTriageEngine._markEmailIgnored
**LINES:** 485+
**SIGNATURE:** `_markEmailIgnored(email, stage, reason) {`
**WIRED-UP:** 4 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: ZeroTrustTriageEngine._batchCreateProposals
**LINES:** 505+
**SIGNATURE:** `_batchCreateProposals(proposalsData) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: ZeroTrustTriageEngine.getEngineStats
**LINES:** 556+
**SIGNATURE:** `getEngineStats() {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** SILENT ERROR HANDLING - catch without logging/rethrowing


#### FUNCTION: ZeroTrustTriageEngine._countEmailsWithLabel
**LINES:** 585+
**SIGNATURE:** `_countEmailsWithLabel(labelName) {`
**WIRED-UP:** 3 call site(s) found
**HEALTH FLAGS:** SILENT ERROR HANDLING - catch without logging/rethrowing


#### FUNCTION: ZeroTrustTriageEngine._verifyLabelsExist
**LINES:** 599+
**SIGNATURE:** `_verifyLabelsExist() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: ZeroTrustTriageEngine.selfTest
**LINES:** 620+
**SIGNATURE:** `selfTest() {`
**WIRED-UP:** 22 call site(s) found
**HEALTH FLAGS:** None


## 5_WEB FOLDER


### FILE: src/5_web/AppSheetBridge.gs
**LINES:** 62
**FUNCTIONS:** 6


#### FUNCTION: AppSheetBridge.constructor
**LINES:** 12+
**SIGNATURE:** `constructor(configManager, systemManager) {`
**WIRED-UP:** 45 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: AppSheetBridge.doGet
**LINES:** 17+
**SIGNATURE:** `doGet(e) {`
**WIRED-UP:** 3 call site(s) found
**HEALTH FLAGS:** SILENT ERROR HANDLING - catch without logging/rethrowing


#### FUNCTION: AppSheetBridge._handleConfigRequest
**LINES:** 34+
**SIGNATURE:** `_handleConfigRequest() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: AppSheetBridge._handleStatusRequest
**LINES:** 46+
**SIGNATURE:** `_handleStatusRequest() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: AppSheetBridge._createResponse
**LINES:** 51+
**SIGNATURE:** `_createResponse(data, statusCode = 200) {`
**WIRED-UP:** 5 call site(s) found
**HEALTH FLAGS:** None


### FILE: src/5_web/ChatEngine.gs
**LINES:** 777
**FUNCTIONS:** 35


#### FUNCTION: ChatEngine.constructor
**LINES:** 12+
**SIGNATURE:** `constructor(configManager, batchOperations, logger, cache, errorHandler, archiveManager) {`
**WIRED-UP:** 45 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: ChatEngine._parseCommand
**LINES:** 34+
**SIGNATURE:** `_parseCommand(text, context) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: ChatEngine._handleCreateTask
**LINES:** 55+
**SIGNATURE:** `_handleCreateTask(match, context) {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: ChatEngine._handleStatusQuery
**LINES:** 89+
**SIGNATURE:** `_handleStatusQuery() {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: ChatEngine._handleHelp
**LINES:** 183+
**SIGNATURE:** `_handleHelp() {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: ChatEngine._parseTaskParameters
**LINES:** 190+
**SIGNATURE:** `_parseTaskParameters(text, context) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: ChatEngine._extractKeyValueParameters
**LINES:** 203+
**SIGNATURE:** `_extractKeyValueParameters(text) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: ChatEngine._handleFollowUpPriority
**LINES:** 213+
**SIGNATURE:** `_handleFollowUpPriority(match, context) {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: ChatEngine._handleFollowUpLane
**LINES:** 237+
**SIGNATURE:** `_handleFollowUpLane(match, context) {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: ChatEngine._handleFollowUpDuration
**LINES:** 261+
**SIGNATURE:** `_handleFollowUpDuration(match, context) {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: ChatEngine._handleCancelTask
**LINES:** 285+
**SIGNATURE:** `_handleCancelTask(match, context) {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: ChatEngine._handleCompleteTask
**LINES:** 316+
**SIGNATURE:** `_handleCompleteTask(match, context) {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: ChatEngine._handleStartTask
**LINES:** 351+
**SIGNATURE:** `_handleStartTask(match, context) {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: ChatEngine._handleCreateDependency
**LINES:** 367+
**SIGNATURE:** `_handleCreateDependency(match, context) {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: ChatEngine._handleExplainScheduling
**LINES:** 388+
**SIGNATURE:** `_handleExplainScheduling(match, context) {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: ChatEngine._createDisambiguationCard
**LINES:** 406+
**SIGNATURE:** `_createDisambiguationCard(matches, operation, identifier) {`
**WIRED-UP:** 3 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: ChatEngine._executeDisambiguationOperation
**LINES:** 452+
**SIGNATURE:** `_executeDisambiguationOperation(operation, actionId) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: ChatEngine._findTaskByTitle
**LINES:** 496+
**SIGNATURE:** `_findTaskByTitle(title) {`
**WIRED-UP:** 5 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: ChatEngine._updateTaskInSheet
**LINES:** 520+
**SIGNATURE:** `_updateTaskInSheet(actionId, updates) {`
**WIRED-UP:** 11 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: ChatEngine._storeRecentTaskContext
**LINES:** 557+
**SIGNATURE:** `_storeRecentTaskContext(task, context) {`
**WIRED-UP:** 5 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: ChatEngine._getRecentTaskContext
**LINES:** 562+
**SIGNATURE:** `_getRecentTaskContext(context) {`
**WIRED-UP:** 4 call site(s) found
**HEALTH FLAGS:** SILENT ERROR HANDLING - catch without logging/rethrowing


#### FUNCTION: ChatEngine._createSimpleResponse
**LINES:** 573+
**SIGNATURE:** `_createSimpleResponse(message) {`
**WIRED-UP:** 30 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: ChatEngine._createTaskCreatedResponse
**LINES:** 580+
**SIGNATURE:** `_createTaskCreatedResponse(task) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: ChatEngine._createHelpResponse
**LINES:** 588+
**SIGNATURE:** `_createHelpResponse() {`
**WIRED-UP:** 3 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: ChatEngine._calculateWorkloadPressure
**LINES:** 607+
**SIGNATURE:** `_calculateWorkloadPressure(highPriorityCount, urgentCount, pendingCount) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: ChatEngine._calculateAvailabilityInsight
**LINES:** 613+
**SIGNATURE:** `_calculateAvailabilityInsight() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: ChatEngine._createStrategicStatusResponse
**LINES:** 622+
**SIGNATURE:** `_createStrategicStatusResponse(data) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: ChatEngine.doPost
**LINES:** 651+
**SIGNATURE:** `doPost(e) {`
**WIRED-UP:** 3 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: processChatHumanStateCommand
**LINES:** 682+
**SIGNATURE:** `function processChatHumanStateCommand(command, parameters) {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: ChatEngine.if
**LINES:** 685+
**SIGNATURE:** `if (!humanStateManager) {`
**WIRED-UP:** 1290 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: ChatEngine.for
**LINES:** 692+
**SIGNATURE:** `for (const param of parameters) {`
**WIRED-UP:** 162 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: ChatEngine.if
**LINES:** 710+
**SIGNATURE:** `if (notes.length > 0) {`
**WIRED-UP:** 1290 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: ChatEngine.if
**LINES:** 716+
**SIGNATURE:** `if (success) {`
**WIRED-UP:** 1290 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: handleDisambiguation
**LINES:** 731+
**SIGNATURE:** `function handleDisambiguation(e) {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


### FILE: src/5_web/SecureWebAppAuth.gs
**LINES:** 181
**FUNCTIONS:** 6


#### FUNCTION: SecureWebAppAuth.constructor
**LINES:** 12+
**SIGNATURE:** `constructor(smartLogger) {`
**WIRED-UP:** 45 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: SecureWebAppAuth.verifyGoogleChatAuth
**LINES:** 21+
**SIGNATURE:** `verifyGoogleChatAuth(e) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: SecureWebAppAuth._checkRateLimit
**LINES:** 108+
**SIGNATURE:** `_checkRateLimit(remoteAddr) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: SecureWebAppAuth.createAuthErrorResponse
**LINES:** 135+
**SIGNATURE:** `createAuthErrorResponse(reason = 'Authentication failed') {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: SecureWebAppAuth.verifyWebAppToken
**LINES:** 150+
**SIGNATURE:** `verifyWebAppToken(e) {`
**WIRED-UP:** 3 call site(s) found
**HEALTH FLAGS:** None


### FILE: src/5_web/TriggerOrchestrator.gs
**LINES:** 140
**FUNCTIONS:** 13


#### FUNCTION: TriggerOrchestrator.constructor
**LINES:** 12+
**SIGNATURE:** `constructor(emailEngine, scheduler, archiveManager, foundationBlocksManager,`
**WIRED-UP:** 45 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: TriggerOrchestrator._runTrigger
**LINES:** 21+
**SIGNATURE:** `_runTrigger(triggerName, logicFunction, lockTimeout = 15000, context = this) {`
**WIRED-UP:** 10 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: TriggerOrchestrator.runEmailProcessing
**LINES:** 45+
**SIGNATURE:** `runEmailProcessing() {`
**WIRED-UP:** 4 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: TriggerOrchestrator.runSchedulingCycle
**LINES:** 57+
**SIGNATURE:** `runSchedulingCycle() {`
**WIRED-UP:** 10 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: TriggerOrchestrator.runCalendarSync
**LINES:** 60+
**SIGNATURE:** `runCalendarSync() {`
**WIRED-UP:** 4 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: TriggerOrchestrator.runCalendarProjection
**LINES:** 63+
**SIGNATURE:** `runCalendarProjection() {`
**WIRED-UP:** 4 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: TriggerOrchestrator.runFoundationBlocks
**LINES:** 66+
**SIGNATURE:** `runFoundationBlocks() {`
**WIRED-UP:** 7 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: TriggerOrchestrator.runScheduleReconciliation
**LINES:** 72+
**SIGNATURE:** `runScheduleReconciliation() {`
**WIRED-UP:** 5 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: TriggerOrchestrator.runHealthCheck
**LINES:** 75+
**SIGNATURE:** `runHealthCheck() {`
**WIRED-UP:** 9 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: TriggerOrchestrator.runDataArchiving
**LINES:** 78+
**SIGNATURE:** `runDataArchiving() {`
**WIRED-UP:** 3 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: TriggerOrchestrator.runProposalLearningCycle
**LINES:** 81+
**SIGNATURE:** `runProposalLearningCycle() {`
**WIRED-UP:** 5 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: TriggerOrchestrator.selfTest
**LINES:** 89+
**SIGNATURE:** `selfTest() {`
**WIRED-UP:** 22 call site(s) found
**HEALTH FLAGS:** None


### FILE: src/5_web/WebAppManager.gs
**LINES:** 106
**FUNCTIONS:** 5


#### FUNCTION: WebAppManager.constructor
**LINES:** 12+
**SIGNATURE:** `constructor(appSheetBridge, chatEngine, systemManager, secureAuth, logger) {`
**WIRED-UP:** 45 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: WebAppManager.handleDoGet
**LINES:** 17+
**SIGNATURE:** `handleDoGet(e) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: WebAppManager.handleDoPost
**LINES:** 39+
**SIGNATURE:** `handleDoPost(e) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: WebAppManager.selfTest
**LINES:** 68+
**SIGNATURE:** `selfTest() {`
**WIRED-UP:** 22 call site(s) found
**HEALTH FLAGS:** None


## 7_SUPPORT FOLDER


### FILE: src/7_support/MockBatchOperations.gs
**LINES:** 283
**FUNCTIONS:** 12


#### FUNCTION: MockBatchOperations.constructor
**LINES:** 12+
**SIGNATURE:** `constructor(cache, logger) {`
**WIRED-UP:** 45 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: MockBatchOperations.initializeMockSheets
**LINES:** 24+
**SIGNATURE:** `initializeMockSheets() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: MockBatchOperations.getHeaders
**LINES:** 67+
**SIGNATURE:** `getHeaders(sheetName) {`
**WIRED-UP:** 48 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: MockBatchOperations.getAllSheetData
**LINES:** 87+
**SIGNATURE:** `getAllSheetData(sheetName) {`
**WIRED-UP:** 9 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: MockBatchOperations.getRowsWithPosition
**LINES:** 101+
**SIGNATURE:** `getRowsWithPosition(sheetName, criteria = {}) {`
**WIRED-UP:** 9 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: MockBatchOperations.batchUpdate
**LINES:** 131+
**SIGNATURE:** `batchUpdate(sheetName, updates) {`
**WIRED-UP:** 14 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: MockBatchOperations.addTestData
**LINES:** 193+
**SIGNATURE:** `addTestData(sheetName, testData) {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: MockBatchOperations.clearTestData
**LINES:** 206+
**SIGNATURE:** `clearTestData() {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: MockBatchOperations._columnA1ToIndex
**LINES:** 221+
**SIGNATURE:** `_columnA1ToIndex(columnA1) {`
**WIRED-UP:** 3 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: MockBatchOperations.performAtomicSwapOrFallback
**LINES:** 233+
**SIGNATURE:** `performAtomicSwapOrFallback(originalSheetName, newData, configManager, logger) {`
**WIRED-UP:** 3 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: MockBatchOperations._performLegacyClearAndSet
**LINES:** 268+
**SIGNATURE:** `_performLegacyClearAndSet(sheetName, newData, logger) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


### FILE: src/7_support/MockService.gs
**LINES:** 265
**FUNCTIONS:** 8


#### FUNCTION: MockService.constructor
**LINES:** 12+
**SIGNATURE:** `constructor() {`
**WIRED-UP:** 45 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: MockService.createMockAction
**LINES:** 23+
**SIGNATURE:** `createMockAction(overrides = {}) {`
**WIRED-UP:** 9 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: MockService.createMockActionsForScenario
**LINES:** 51+
**SIGNATURE:** `createMockActionsForScenario(scenario) {`
**WIRED-UP:** 3 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: MockService.createMockCalendarEvents
**LINES:** 126+
**SIGNATURE:** `createMockCalendarEvents(count = 5) {`
**WIRED-UP:** 3 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: MockService.createMockProposedTasks
**LINES:** 153+
**SIGNATURE:** `createMockProposedTasks(count = 3) {`
**WIRED-UP:** 3 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: MockService.createMockTimeBlocks
**LINES:** 181+
**SIGNATURE:** `createMockTimeBlocks(scenario = 'work_hours') {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: MockService.reset
**LINES:** 260+
**SIGNATURE:** `reset() {`
**WIRED-UP:** 6 call site(s) found
**HEALTH FLAGS:** None


### FILE: src/7_support/SafeColumnAccess.gs
**LINES:** 73
**FUNCTIONS:** 10


#### FUNCTION: SafeColumnAccess.constructor
**LINES:** 12+
**SIGNATURE:** `constructor(headers) {`
**WIRED-UP:** 45 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: SafeColumnAccess.buildColumnMap
**LINES:** 18+
**SIGNATURE:** `buildColumnMap() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: SafeColumnAccess.getColumnIndex
**LINES:** 26+
**SIGNATURE:** `getColumnIndex(columnName) {`
**WIRED-UP:** 3 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: SafeColumnAccess.getValue
**LINES:** 31+
**SIGNATURE:** `getValue(row, columnName) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: SafeColumnAccess.setValue
**LINES:** 36+
**SIGNATURE:** `setValue(row, columnName, value) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: SafeColumnAccess.createEmptyRow
**LINES:** 47+
**SIGNATURE:** `createEmptyRow() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: SafeColumnAccess.validateRow
**LINES:** 51+
**SIGNATURE:** `validateRow(row) {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: SafeColumnAccess.mapRowToObject
**LINES:** 56+
**SIGNATURE:** `mapRowToObject(row) {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: SafeColumnAccess.mapObjectToRow
**LINES:** 66+
**SIGNATURE:** `mapObjectToRow(obj) {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


### FILE: src/7_support/TestSeeder.gs
**LINES:** 228
**FUNCTIONS:** 9


#### FUNCTION: TestSeeder.constructor
**LINES:** 12+
**SIGNATURE:** `constructor(batchOperations, logger) {`
**WIRED-UP:** 45 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: TestSeeder.seedTestData
**LINES:** 23+
**SIGNATURE:** `seedTestData(scenario, options = {}) {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: TestSeeder._cleanAllTestData
**LINES:** 88+
**SIGNATURE:** `_cleanAllTestData() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: TestSeeder._seedBasicWorkflowData
**LINES:** 117+
**SIGNATURE:** `_seedBasicWorkflowData(batchOps) {`
**WIRED-UP:** 3 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: TestSeeder._seedLargeBacklogData
**LINES:** 134+
**SIGNATURE:** `_seedLargeBacklogData(batchOps) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: TestSeeder._seedEmailIngestionData
**LINES:** 162+
**SIGNATURE:** `_seedEmailIngestionData(batchOps) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: TestSeeder._seedCalendarIntegrationData
**LINES:** 181+
**SIGNATURE:** `_seedCalendarIntegrationData(batchOps) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: TestSeeder._seedMixedScenarioData
**LINES:** 200+
**SIGNATURE:** `_seedMixedScenarioData(batchOps) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


## 8_SETUP FOLDER


### FILE: src/8_setup/ServiceRegistration.gs
**LINES:** 522
**FUNCTIONS:** 4


#### FUNCTION: registerAllServices
**LINES:** 15+
**SIGNATURE:** `function registerAllServices() {`
**WIRED-UP:** 4 call site(s) found
**HEALTH FLAGS:** LARGE FUNCTION - 245 lines; LOOP WITH SHEETS API - quota risk


#### FUNCTION: validateServiceRegistrations
**LINES:** 267+
**SIGNATURE:** `function validateServiceRegistrations() {`
**WIRED-UP:** 7 call site(s) found
**HEALTH FLAGS:** LARGE FUNCTION - 138 lines


#### FUNCTION: createServiceDependencyMap
**LINES:** 410+
**SIGNATURE:** `function createServiceDependencyMap() {`
**WIRED-UP:** 4 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: validateServiceCallPatterns
**LINES:** 470+
**SIGNATURE:** `function validateServiceCallPatterns() {`
**WIRED-UP:** 4 call site(s) found
**HEALTH FLAGS:** None


### FILE: src/8_setup/SystemBootstrap.gs
**LINES:** 691
**FUNCTIONS:** 11


#### FUNCTION: completeSetup
**LINES:** 13+
**SIGNATURE:** `function completeSetup() {`
**WIRED-UP:** 13 call site(s) found
**HEALTH FLAGS:** LARGE FUNCTION - 150 lines


#### FUNCTION: onOpen
**LINES:** 168+
**SIGNATURE:** `function onOpen(e) {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: validateEnvironment
**LINES:** 185+
**SIGNATURE:** `function validateEnvironment() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** LOOP WITH SHEETS API - quota risk


#### FUNCTION: ensureBootstrapServices
**LINES:** 227+
**SIGNATURE:** `function ensureBootstrapServices() {`
**WIRED-UP:** 5 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: verifyCriticalServices
**LINES:** 254+
**SIGNATURE:** `function verifyCriticalServices() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: initializeSchema
**LINES:** 280+
**SIGNATURE:** `function initializeSchema() {`
**WIRED-UP:** 5 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: seedInitialData
**LINES:** 321+
**SIGNATURE:** `function seedInitialData() {`
**WIRED-UP:** 3 call site(s) found
**HEALTH FLAGS:** LARGE FUNCTION - 167 lines


#### FUNCTION: runSystemHealthCheck
**LINES:** 492+
**SIGNATURE:** `function runSystemHealthCheck() {`
**WIRED-UP:** 6 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: doGet
**LINES:** 522+
**SIGNATURE:** `function doGet(e) {`
**WIRED-UP:** 3 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: doPost
**LINES:** 551+
**SIGNATURE:** `function doPost(e) {`
**WIRED-UP:** 3 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: seedDefaultLanes
**LINES:** 571+
**SIGNATURE:** `function seedDefaultLanes() {`
**WIRED-UP:** 6 call site(s) found
**HEALTH FLAGS:** LARGE FUNCTION - 121 lines


### FILE: src/8_setup/TriggerSetup.gs
**LINES:** 279
**FUNCTIONS:** 13


#### FUNCTION: ensureServicesRegistered
**LINES:** 9+
**SIGNATURE:** `function ensureServicesRegistered() {`
**WIRED-UP:** 13 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: installAllTriggers
**LINES:** 23+
**SIGNATURE:** `function installAllTriggers() {`
**WIRED-UP:** 4 call site(s) found
**HEALTH FLAGS:** LARGE FUNCTION - 122 lines


#### FUNCTION: removeAllTriggers
**LINES:** 149+
**SIGNATURE:** `function removeAllTriggers() {`
**WIRED-UP:** 3 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: listCurrentTriggers
**LINES:** 194+
**SIGNATURE:** `function listCurrentTriggers() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: runEmailProcessing
**LINES:** 227+
**SIGNATURE:** `function runEmailProcessing() {`
**WIRED-UP:** 4 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: runSchedulingCycle
**LINES:** 233+
**SIGNATURE:** `function runSchedulingCycle() {`
**WIRED-UP:** 10 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: runCalendarSync
**LINES:** 239+
**SIGNATURE:** `function runCalendarSync() {`
**WIRED-UP:** 4 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: runCalendarProjection
**LINES:** 245+
**SIGNATURE:** `function runCalendarProjection() {`
**WIRED-UP:** 4 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: runFoundationBlocks
**LINES:** 251+
**SIGNATURE:** `function runFoundationBlocks() {`
**WIRED-UP:** 7 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: runScheduleReconciliation
**LINES:** 257+
**SIGNATURE:** `function runScheduleReconciliation() {`
**WIRED-UP:** 5 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: runHealthCheck
**LINES:** 263+
**SIGNATURE:** `function runHealthCheck() {`
**WIRED-UP:** 9 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: runDataArchiving
**LINES:** 269+
**SIGNATURE:** `function runDataArchiving() {`
**WIRED-UP:** 3 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: runProposalLearningCycle
**LINES:** 275+
**SIGNATURE:** `function runProposalLearningCycle() {`
**WIRED-UP:** 5 call site(s) found
**HEALTH FLAGS:** None


## 9_TESTS FOLDER


### FILE: src/9_tests/ComprehensiveTests.gs
**LINES:** 367
**FUNCTIONS:** 6


#### FUNCTION: test_RedFlagFixes
**LINES:** 16+
**SIGNATURE:** `function test_RedFlagFixes() {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** LARGE FUNCTION - 119 lines


#### FUNCTION: test_PersistentStore
**LINES:** 140+
**SIGNATURE:** `function test_PersistentStore() {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: test_CrossExecutionCache
**LINES:** 185+
**SIGNATURE:** `function test_CrossExecutionCache() {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: test_ErrorHandler
**LINES:** 230+
**SIGNATURE:** `function test_ErrorHandler() {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: test_SmartLogger
**LINES:** 285+
**SIGNATURE:** `function test_SmartLogger() {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: runAllCoreTests
**LINES:** 324+
**SIGNATURE:** `function runAllCoreTests() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


### FILE: src/9_tests/ConsoleEliminationVerification.gs
**LINES:** 300
**FUNCTIONS:** 3


#### FUNCTION: verifyConsoleElimination
**LINES:** 13+
**SIGNATURE:** `function verifyConsoleElimination() {`
**WIRED-UP:** 3 call site(s) found
**HEALTH FLAGS:** LARGE FUNCTION - 199 lines


#### FUNCTION: runConsoleEliminationVerification
**LINES:** 216+
**SIGNATURE:** `function runConsoleEliminationVerification() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: getConsoleEliminationStatus
**LINES:** 256+
**SIGNATURE:** `function getConsoleEliminationStatus() {`
**WIRED-UP:** 7 call site(s) found
**HEALTH FLAGS:** None


### FILE: src/9_tests/DeepUnitTestHarness.gs
**LINES:** 814
**FUNCTIONS:** 42


#### FUNCTION: DeepUnitTestHarness.constructor
**LINES:** 19+
**SIGNATURE:** `constructor() {`
**WIRED-UP:** 45 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: DeepUnitTestHarness.runAllUnitTests
**LINES:** 28+
**SIGNATURE:** `runAllUnitTests() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: DeepUnitTestHarness.testErrorHandler
**LINES:** 72+
**SIGNATURE:** `testErrorHandler() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: DeepUnitTestHarness.testSmartLogger
**LINES:** 115+
**SIGNATURE:** `testSmartLogger() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: DeepUnitTestHarness.testBatchOperations
**LINES:** 152+
**SIGNATURE:** `testBatchOperations() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: DeepUnitTestHarness.testZeroTrustTriageEngine
**LINES:** 189+
**SIGNATURE:** `testZeroTrustTriageEngine() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: DeepUnitTestHarness.testCircuitBreakerStateTransitions
**LINES:** 226+
**SIGNATURE:** `testCircuitBreakerStateTransitions(errorHandler) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: DeepUnitTestHarness.testExponentialBackoffCalculation
**LINES:** 273+
**SIGNATURE:** `testExponentialBackoffCalculation(errorHandler) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** SILENT ERROR HANDLING - catch without logging/rethrowing


#### FUNCTION: DeepUnitTestHarness.testAdaptiveRetryLogic
**LINES:** 318+
**SIGNATURE:** `testAdaptiveRetryLogic(errorHandler) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: DeepUnitTestHarness.testFallbackChain
**LINES:** 358+
**SIGNATURE:** `testFallbackChain(errorHandler) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: DeepUnitTestHarness.testBatchFailureTolerance
**LINES:** 400+
**SIGNATURE:** `testBatchFailureTolerance(errorHandler) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: DeepUnitTestHarness.testGracefulDegradationPaths
**LINES:** 446+
**SIGNATURE:** `testGracefulDegradationPaths(errorHandler) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: DeepUnitTestHarness.testErrorTypeClassification
**LINES:** 500+
**SIGNATURE:** `testErrorTypeClassification(errorHandler) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** SILENT ERROR HANDLING - catch without logging/rethrowing


#### FUNCTION: DeepUnitTestHarness.testCircuitBreakerReset
**LINES:** 534+
**SIGNATURE:** `testCircuitBreakerReset(errorHandler) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: DeepUnitTestHarness.testLogLevelFiltering
**LINES:** 577+
**SIGNATURE:** `testLogLevelFiltering(logger) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: DeepUnitTestHarness.testLogSuppression
**LINES:** 582+
**SIGNATURE:** `testLogSuppression(logger) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: DeepUnitTestHarness.testContextSerialization
**LINES:** 587+
**SIGNATURE:** `testContextSerialization(logger) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: DeepUnitTestHarness.testBatchLogging
**LINES:** 592+
**SIGNATURE:** `testBatchLogging(logger) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: DeepUnitTestHarness.testPerformanceLogging
**LINES:** 597+
**SIGNATURE:** `testPerformanceLogging(logger) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: DeepUnitTestHarness.testErrorObjectHandling
**LINES:** 602+
**SIGNATURE:** `testErrorObjectHandling(logger) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: DeepUnitTestHarness.testHeaderCaching
**LINES:** 607+
**SIGNATURE:** `testHeaderCaching(batchOps) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: DeepUnitTestHarness.testVersionGeneration
**LINES:** 612+
**SIGNATURE:** `testVersionGeneration(batchOps) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** SILENT ERROR HANDLING - catch without logging/rethrowing


#### FUNCTION: DeepUnitTestHarness.testDeepCloning
**LINES:** 640+
**SIGNATURE:** `testDeepCloning(batchOps) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** SILENT ERROR HANDLING - catch without logging/rethrowing


#### FUNCTION: DeepUnitTestHarness.testArrayChunking
**LINES:** 673+
**SIGNATURE:** `testArrayChunking(batchOps) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** SILENT ERROR HANDLING - catch without logging/rethrowing


#### FUNCTION: DeepUnitTestHarness.testDataValidation
**LINES:** 703+
**SIGNATURE:** `testDataValidation(batchOps) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: DeepUnitTestHarness.testMergeConflictResolution
**LINES:** 708+
**SIGNATURE:** `testMergeConflictResolution(batchOps) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: DeepUnitTestHarness.testSieveQueryGeneration
**LINES:** 714+
**SIGNATURE:** `testSieveQueryGeneration(triageEngine) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: DeepUnitTestHarness.testTechnicalFilterAccuracy
**LINES:** 719+
**SIGNATURE:** `testTechnicalFilterAccuracy(triageEngine) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: DeepUnitTestHarness.testBayesianReputationScoring
**LINES:** 724+
**SIGNATURE:** `testBayesianReputationScoring(triageEngine) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: DeepUnitTestHarness.testNLPConfidenceAlgorithm
**LINES:** 729+
**SIGNATURE:** `testNLPConfidenceAlgorithm(triageEngine) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: DeepUnitTestHarness.testPipelineStageIndependence
**LINES:** 734+
**SIGNATURE:** `testPipelineStageIndependence(triageEngine) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: DeepUnitTestHarness.summarizeServiceTests
**LINES:** 747+
**SIGNATURE:** `summarizeServiceTests(serviceName, tests) {`
**WIRED-UP:** 5 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: DeepUnitTestHarness.createFailedServiceTest
**LINES:** 768+
**SIGNATURE:** `createFailedServiceTest(serviceName, error) {`
**WIRED-UP:** 5 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: DeepUnitTestHarness.testConfigManager
**LINES:** 782+
**SIGNATURE:** `testConfigManager() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: DeepUnitTestHarness.testCrossExecutionCache
**LINES:** 786+
**SIGNATURE:** `testCrossExecutionCache() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: DeepUnitTestHarness.testPersistentStore
**LINES:** 790+
**SIGNATURE:** `testPersistentStore() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: DeepUnitTestHarness.testSenderReputationManager
**LINES:** 794+
**SIGNATURE:** `testSenderReputationManager() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: DeepUnitTestHarness.testFoundationBlocksManager
**LINES:** 798+
**SIGNATURE:** `testFoundationBlocksManager() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: DeepUnitTestHarness.testCalendarSyncManager
**LINES:** 802+
**SIGNATURE:** `testCalendarSyncManager() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: DeepUnitTestHarness.testIntelligentScheduler
**LINES:** 806+
**SIGNATURE:** `testIntelligentScheduler() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: DeepUnitTestHarness.testSystemManager
**LINES:** 810+
**SIGNATURE:** `testSystemManager() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


### FILE: src/9_tests/DeploymentValidation.gs
**LINES:** 375
**FUNCTIONS:** 8


#### FUNCTION: validateSystemForDeployment
**LINES:** 14+
**SIGNATURE:** `function validateSystemForDeployment() {`
**WIRED-UP:** 3 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: validateEnvironmentForDeployment
**LINES:** 75+
**SIGNATURE:** `function validateEnvironmentForDeployment() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** LOOP WITH SHEETS API - quota risk


#### FUNCTION: validateAllServicesCanStart
**LINES:** 114+
**SIGNATURE:** `function validateAllServicesCanStart() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: validateSystemPerformance
**LINES:** 168+
**SIGNATURE:** `function validateSystemPerformance() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: validateSystemConfiguration
**LINES:** 230+
**SIGNATURE:** `function validateSystemConfiguration() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: validateDatabaseSchema
**LINES:** 278+
**SIGNATURE:** `function validateDatabaseSchema() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: validateSecurityConfiguration
**LINES:** 324+
**SIGNATURE:** `function validateSecurityConfiguration() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: isSystemReadyForDeployment
**LINES:** 365+
**SIGNATURE:** `function isSystemReadyForDeployment() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


### FILE: src/9_tests/FinalProductionTest.gs
**LINES:** 371
**FUNCTIONS:** 8


#### FUNCTION: runFinalProductionTest
**LINES:** 11+
**SIGNATURE:** `function runFinalProductionTest() {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** LARGE FUNCTION - 125 lines


#### FUNCTION: testBootstrapSystem
**LINES:** 140+
**SIGNATURE:** `function testBootstrapSystem() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** SILENT ERROR HANDLING - catch without logging/rethrowing


#### FUNCTION: testLoggingInfrastructure
**LINES:** 167+
**SIGNATURE:** `function testLoggingInfrastructure() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: testServiceRegistration
**LINES:** 202+
**SIGNATURE:** `function testServiceRegistration() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: testErrorHandling
**LINES:** 237+
**SIGNATURE:** `function testErrorHandling() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** SILENT ERROR HANDLING - catch without logging/rethrowing


#### FUNCTION: testEnumDefinitions
**LINES:** 265+
**SIGNATURE:** `function testEnumDefinitions() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: testCoreFunctions
**LINES:** 292+
**SIGNATURE:** `function testCoreFunctions() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** SILENT ERROR HANDLING - catch without logging/rethrowing


#### FUNCTION: testAllFunctions
**LINES:** 329+
**SIGNATURE:** `function testAllFunctions() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


### FILE: src/9_tests/FinalSystemValidation.gs
**LINES:** 655
**FUNCTIONS:** 12


#### FUNCTION: validateAllSystemFixes
**LINES:** 14+
**SIGNATURE:** `function validateAllSystemFixes() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: validateCriticalFixes
**LINES:** 53+
**SIGNATURE:** `function validateCriticalFixes() {`
**WIRED-UP:** 3 call site(s) found
**HEALTH FLAGS:** LARGE FUNCTION - 112 lines; SILENT ERROR HANDLING - catch without logging/rethrowing


#### FUNCTION: validateLoggingFixes
**LINES:** 170+
**SIGNATURE:** `function validateLoggingFixes() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: validateServiceWiring
**LINES:** 231+
**SIGNATURE:** `function validateServiceWiring() {`
**WIRED-UP:** 3 call site(s) found
**HEALTH FLAGS:** SILENT ERROR HANDLING - catch without logging/rethrowing


#### FUNCTION: validateSystemIntegration
**LINES:** 298+
**SIGNATURE:** `function validateSystemIntegration() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: validateEdgeCases
**LINES:** 403+
**SIGNATURE:** `function validateEdgeCases() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: validatePerformance
**LINES:** 451+
**SIGNATURE:** `function validatePerformance() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: validateSSRBehavior
**LINES:** 495+
**SIGNATURE:** `function validateSSRBehavior() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: validateMobileResponsiveness
**LINES:** 517+
**SIGNATURE:** `function validateMobileResponsiveness() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** SILENT ERROR HANDLING - catch without logging/rethrowing


#### FUNCTION: generateValidationSummary
**LINES:** 551+
**SIGNATURE:** `function generateValidationSummary(results, allPassed) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: quickValidation
**LINES:** 593+
**SIGNATURE:** `function quickValidation() {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** SILENT ERROR HANDLING - catch without logging/rethrowing


#### FUNCTION: exportValidationResults
**LINES:** 614+
**SIGNATURE:** `function exportValidationResults() {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** LOOP WITH SHEETS API - quota risk; SILENT ERROR HANDLING - catch without logging/rethrowing


### FILE: src/9_tests/MasterTestOrchestrator.gs
**LINES:** 909
**FUNCTIONS:** 34


#### FUNCTION: MasterTestOrchestrator.constructor
**LINES:** 20+
**SIGNATURE:** `constructor() {`
**WIRED-UP:** 45 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: MasterTestOrchestrator.runComprehensiveSuite
**LINES:** 37+
**SIGNATURE:** `runComprehensiveSuite(options = {}) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: MasterTestOrchestrator.runQuickValidation
**LINES:** 117+
**SIGNATURE:** `runQuickValidation() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: MasterTestOrchestrator.testService
**LINES:** 175+
**SIGNATURE:** `testService(serviceName) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: MasterTestOrchestrator._initializeTestSuites
**LINES:** 249+
**SIGNATURE:** `_initializeTestSuites(config) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: MasterTestOrchestrator._executeTestsWithTelemetry
**LINES:** 287+
**SIGNATURE:** `_executeTestsWithTelemetry(suites, config, testId) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: MasterTestOrchestrator._runExistingCoreTests
**LINES:** 346+
**SIGNATURE:** `_runExistingCoreTests() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** SILENT ERROR HANDLING - catch without logging/rethrowing


#### FUNCTION: MasterTestOrchestrator._runDeploymentValidation
**LINES:** 362+
**SIGNATURE:** `_runDeploymentValidation() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** SILENT ERROR HANDLING - catch without logging/rethrowing


#### FUNCTION: MasterTestOrchestrator._runAllServiceSelfTests
**LINES:** 382+
**SIGNATURE:** `_runAllServiceSelfTests() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: MasterTestOrchestrator._runSystemHealthCheck
**LINES:** 432+
**SIGNATURE:** `_runSystemHealthCheck() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** SILENT ERROR HANDLING - catch without logging/rethrowing


#### FUNCTION: MasterTestOrchestrator._captureMemorySnapshot
**LINES:** 448+
**SIGNATURE:** `_captureMemorySnapshot() {`
**WIRED-UP:** 3 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: MasterTestOrchestrator._analyzeMemoryDelta
**LINES:** 465+
**SIGNATURE:** `_analyzeMemoryDelta(initial, final) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: MasterTestOrchestrator._generateComprehensiveReport
**LINES:** 480+
**SIGNATURE:** `_generateComprehensiveReport(reportData) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: MasterTestOrchestrator._calculateSummaryStatistics
**LINES:** 511+
**SIGNATURE:** `_calculateSummaryStatistics(results) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: MasterTestOrchestrator._generateRecommendations
**LINES:** 553+
**SIGNATURE:** `_generateRecommendations(results, memoryDelta) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: MasterTestOrchestrator._calculateHealthScore
**LINES:** 596+
**SIGNATURE:** `_calculateHealthScore(summary, memoryDelta) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: MasterTestOrchestrator._initializePerformanceBaselines
**LINES:** 617+
**SIGNATURE:** `_initializePerformanceBaselines() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: MasterTestOrchestrator._estimateCacheSize
**LINES:** 630+
**SIGNATURE:** `_estimateCacheSize() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** SILENT ERROR HANDLING - catch without logging/rethrowing


#### FUNCTION: MasterTestOrchestrator._countServiceInstances
**LINES:** 644+
**SIGNATURE:** `_countServiceInstances() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** SILENT ERROR HANDLING - catch without logging/rethrowing


#### FUNCTION: MasterTestOrchestrator._estimateActiveLocks
**LINES:** 657+
**SIGNATURE:** `_estimateActiveLocks() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: MasterTestOrchestrator._generateQuickSummary
**LINES:** 668+
**SIGNATURE:** `_generateQuickSummary(quickTests) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: MasterTestOrchestrator._testServiceInstantiation
**LINES:** 693+
**SIGNATURE:** `_testServiceInstantiation(serviceName) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** SILENT ERROR HANDLING - catch without logging/rethrowing


#### FUNCTION: MasterTestOrchestrator._testServiceDependencies
**LINES:** 716+
**SIGNATURE:** `_testServiceDependencies(serviceName) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** SILENT ERROR HANDLING - catch without logging/rethrowing


#### FUNCTION: MasterTestOrchestrator._testServiceMemoryUsage
**LINES:** 738+
**SIGNATURE:** `_testServiceMemoryUsage(service) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** SILENT ERROR HANDLING - catch without logging/rethrowing


#### FUNCTION: MasterTestOrchestrator._testErrorHandlerSpecific
**LINES:** 761+
**SIGNATURE:** `_testErrorHandlerSpecific(errorHandler) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** SILENT ERROR HANDLING - catch without logging/rethrowing


#### FUNCTION: TestAuthenticator.generateTestSignature
**LINES:** 795+
**SIGNATURE:** `generateTestSignature(testId, testCode) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: TestAuthenticator.generateAuthenticityHash
**LINES:** 817+
**SIGNATURE:** `generateAuthenticityHash(results) {`
**WIRED-UP:** 3 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: TestAuthenticator.verifyTestAuthenticity
**LINES:** 832+
**SIGNATURE:** `verifyTestAuthenticity(testId, results) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** SILENT ERROR HANDLING - catch without logging/rethrowing


#### FUNCTION: runQuickSystemValidation
**LINES:** 855+
**SIGNATURE:** `function runQuickSystemValidation() {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: runComprehensiveTestSuite
**LINES:** 865+
**SIGNATURE:** `function runComprehensiveTestSuite(options = {}) {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: testSpecificService
**LINES:** 875+
**SIGNATURE:** `function testSpecificService(serviceName) {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: getSystemHealthDashboard
**LINES:** 884+
**SIGNATURE:** `function getSystemHealthDashboard() {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


### FILE: src/9_tests/Phase3ComprehensiveValidation.gs
**LINES:** 515
**FUNCTIONS:** 8


#### FUNCTION: validatePhase3Complete
**LINES:** 16+
**SIGNATURE:** `function validatePhase3Complete() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** SILENT ERROR HANDLING - catch without logging/rethrowing


#### FUNCTION: validateServiceRegistrationFunction
**LINES:** 94+
**SIGNATURE:** `function validateServiceRegistrationFunction() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** SILENT ERROR HANDLING - catch without logging/rethrowing


#### FUNCTION: validateCircularDependencyResolution
**LINES:** 142+
**SIGNATURE:** `function validateCircularDependencyResolution() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** SILENT ERROR HANDLING - catch without logging/rethrowing


#### FUNCTION: validateGetServiceErrorHandling
**LINES:** 215+
**SIGNATURE:** `function validateGetServiceErrorHandling() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: validateServiceHealthChecks
**LINES:** 288+
**SIGNATURE:** `function validateServiceHealthChecks() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** SILENT ERROR HANDLING - catch without logging/rethrowing


#### FUNCTION: validateServiceDependencyMapping
**LINES:** 349+
**SIGNATURE:** `function validateServiceDependencyMapping() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: validateFullServiceWiring
**LINES:** 420+
**SIGNATURE:** `function validateFullServiceWiring() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: quickPhase3Check
**LINES:** 498+
**SIGNATURE:** `function quickPhase3Check() {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** SILENT ERROR HANDLING - catch without logging/rethrowing


### FILE: src/9_tests/Phase3ValidationTest.gs
**LINES:** 408
**FUNCTIONS:** 8


#### FUNCTION: validatePhase3Implementation
**LINES:** 10+
**SIGNATURE:** `function validatePhase3Implementation() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** SILENT ERROR HANDLING - catch without logging/rethrowing


#### FUNCTION: testValidateServiceRegistrationsExists
**LINES:** 88+
**SIGNATURE:** `function testValidateServiceRegistrationsExists() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** SILENT ERROR HANDLING - catch without logging/rethrowing


#### FUNCTION: testServiceRegistrationValidation
**LINES:** 124+
**SIGNATURE:** `function testServiceRegistrationValidation() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** SILENT ERROR HANDLING - catch without logging/rethrowing


#### FUNCTION: testCircularDependencyResolution
**LINES:** 168+
**SIGNATURE:** `function testCircularDependencyResolution() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** SILENT ERROR HANDLING - catch without logging/rethrowing


#### FUNCTION: testGetServiceErrorHandling
**LINES:** 231+
**SIGNATURE:** `function testGetServiceErrorHandling() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: testServiceDependencyMap
**LINES:** 283+
**SIGNATURE:** `function testServiceDependencyMap() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: testServiceHealthChecks
**LINES:** 348+
**SIGNATURE:** `function testServiceHealthChecks() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** SILENT ERROR HANDLING - catch without logging/rethrowing


#### FUNCTION: quickPhase3Validation
**LINES:** 395+
**SIGNATURE:** `function quickPhase3Validation() {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


### FILE: src/9_tests/ValidationRunner.gs
**LINES:** 405
**FUNCTIONS:** 7


#### FUNCTION: mockValidationEnvironment
**LINES:** 12+
**SIGNATURE:** `function mockValidationEnvironment() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: runValidationTests
**LINES:** 100+
**SIGNATURE:** `function runValidationTests() {`
**WIRED-UP:** 3 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: runCriticalFixesValidation
**LINES:** 175+
**SIGNATURE:** `function runCriticalFixesValidation() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** SILENT ERROR HANDLING - catch without logging/rethrowing


#### FUNCTION: runLoggingValidation
**LINES:** 246+
**SIGNATURE:** `function runLoggingValidation() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: runServiceWiringValidation
**LINES:** 275+
**SIGNATURE:** `function runServiceWiringValidation(mockContainer, mockServices) {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** SILENT ERROR HANDLING - catch without logging/rethrowing


#### FUNCTION: generateValidationReport
**LINES:** 331+
**SIGNATURE:** `function generateValidationReport() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: executePhase4Validation
**LINES:** 373+
**SIGNATURE:** `function executePhase4Validation() {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** SILENT ERROR HANDLING - catch without logging/rethrowing


## ROOT FOLDER


### FILE: src/EXECUTE_ALL_TESTS_NOW.gs
**LINES:** 120
**FUNCTIONS:** 1


#### FUNCTION: EXECUTE_ALL_TESTS_IMMEDIATELY
**LINES:** 6+
**SIGNATURE:** `function EXECUTE_ALL_TESTS_IMMEDIATELY() {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** LARGE FUNCTION - 115 lines


### FILE: src/EXECUTE_FULL_INITIALIZATION.gs
**LINES:** 364
**FUNCTIONS:** 3


#### FUNCTION: initializeSystemComplete
**LINES:** 14+
**SIGNATURE:** `function initializeSystemComplete() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** LARGE FUNCTION - 142 lines


#### FUNCTION: executeFullInitialization
**LINES:** 160+
**SIGNATURE:** `function executeFullInitialization() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** LARGE FUNCTION - 164 lines


#### FUNCTION: verifySheetPopulation
**LINES:** 328+
**SIGNATURE:** `function verifySheetPopulation() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** LOOP WITH SHEETS API - quota risk


### FILE: src/ExecuteAllNow.gs
**LINES:** 41
**FUNCTIONS:** 2


#### FUNCTION: EXECUTE_ALL_FUNCTIONS_VIA_TRIGGER
**LINES:** 5+
**SIGNATURE:** `function EXECUTE_ALL_FUNCTIONS_VIA_TRIGGER() {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: INSTALL_IMMEDIATE_TRIGGER
**LINES:** 24+
**SIGNATURE:** `function INSTALL_IMMEDIATE_TRIGGER() {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


### FILE: src/RUN_EVERYTHING.gs
**LINES:** 85
**FUNCTIONS:** 1


#### FUNCTION: RUN_EVERYTHING_NOW
**LINES:** 5+
**SIGNATURE:** `function RUN_EVERYTHING_NOW() {`
**WIRED-UP:** 3 call site(s) found
**HEALTH FLAGS:** None


### FILE: src/RUN_SHEET_HEALER.gs
**LINES:** 32
**FUNCTIONS:** 1


#### FUNCTION: runSheetHealing
**LINES:** 5+
**SIGNATURE:** `function runSheetHealing() {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


### FILE: src/RemoteControl.gs
**LINES:** 184
**FUNCTIONS:** 17


#### FUNCTION: START
**LINES:** 10+
**SIGNATURE:** `function START() {`
**WIRED-UP:** 24 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: STOP
**LINES:** 23+
**SIGNATURE:** `function STOP() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** SILENT ERROR HANDLING - catch without logging/rethrowing


#### FUNCTION: RESET
**LINES:** 35+
**SIGNATURE:** `function RESET() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** SILENT ERROR HANDLING - catch without logging/rethrowing


#### FUNCTION: EMAIL
**LINES:** 45+
**SIGNATURE:** `function EMAIL() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** SILENT ERROR HANDLING - catch without logging/rethrowing


#### FUNCTION: SCHEDULE
**LINES:** 54+
**SIGNATURE:** `function SCHEDULE() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** SILENT ERROR HANDLING - catch without logging/rethrowing


#### FUNCTION: SYNC
**LINES:** 63+
**SIGNATURE:** `function SYNC() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** SILENT ERROR HANDLING - catch without logging/rethrowing


#### FUNCTION: FIX
**LINES:** 75+
**SIGNATURE:** `function FIX() {`
**WIRED-UP:** 15 call site(s) found
**HEALTH FLAGS:** SILENT ERROR HANDLING - catch without logging/rethrowing


#### FUNCTION: CHECK
**LINES:** 84+
**SIGNATURE:** `function CHECK() {`
**WIRED-UP:** 13 call site(s) found
**HEALTH FLAGS:** SILENT ERROR HANDLING - catch without logging/rethrowing


#### FUNCTION: TEST
**LINES:** 93+
**SIGNATURE:** `function TEST() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** SILENT ERROR HANDLING - catch without logging/rethrowing


#### FUNCTION: GET_STATUS
**LINES:** 103+
**SIGNATURE:** `function GET_STATUS() {`
**WIRED-UP:** 10 call site(s) found
**HEALTH FLAGS:** SILENT ERROR HANDLING - catch without logging/rethrowing


#### FUNCTION: CONFIG
**LINES:** 114+
**SIGNATURE:** `function CONFIG(key, value) {`
**WIRED-UP:** 12 call site(s) found
**HEALTH FLAGS:** SILENT ERROR HANDLING - catch without logging/rethrowing


#### FUNCTION: BACKUP
**LINES:** 128+
**SIGNATURE:** `function BACKUP() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** SILENT ERROR HANDLING - catch without logging/rethrowing


#### FUNCTION: INSTALL
**LINES:** 139+
**SIGNATURE:** `function INSTALL() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** SILENT ERROR HANDLING - catch without logging/rethrowing


#### FUNCTION: UNINSTALL
**LINES:** 148+
**SIGNATURE:** `function UNINSTALL() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** SILENT ERROR HANDLING - catch without logging/rethrowing


#### FUNCTION: LIST
**LINES:** 156+
**SIGNATURE:** `function LIST() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** SILENT ERROR HANDLING - catch without logging/rethrowing


#### FUNCTION: ensureInitialized
**LINES:** 165+
**SIGNATURE:** `function ensureInitialized() {`
**WIRED-UP:** 9 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: HELP
**LINES:** 175+
**SIGNATURE:** `function HELP() {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


### FILE: src/SYSTEM_PERFECTION_TEST.gs
**LINES:** 414
**FUNCTIONS:** 2


#### FUNCTION: SYSTEM_PERFECTION_TEST
**LINES:** 8+
**SIGNATURE:** `function SYSTEM_PERFECTION_TEST() {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** LARGE FUNCTION - 354 lines


#### FUNCTION: QUICK_PERFECTION_CHECK
**LINES:** 366+
**SIGNATURE:** `function QUICK_PERFECTION_CHECK() {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


### FILE: src/SYSTEM_TEST_FINAL.gs
**LINES:** 202
**FUNCTIONS:** 2


#### FUNCTION: SYSTEM_TEST_FINAL
**LINES:** 12+
**SIGNATURE:** `function SYSTEM_TEST_FINAL() {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** LARGE FUNCTION - 170 lines; LOOP WITH SHEETS API - quota risk


#### FUNCTION: QUICK_TEST
**LINES:** 184+
**SIGNATURE:** `function QUICK_TEST() {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


### FILE: src/TEST.gs
**LINES:** 118
**FUNCTIONS:** 4


#### FUNCTION: test
**LINES:** 10+
**SIGNATURE:** `function test() {`
**WIRED-UP:** 11 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: runTest
**LINES:** 108+
**SIGNATURE:** `function runTest() {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: testSystem
**LINES:** 112+
**SIGNATURE:** `function testSystem() {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


#### FUNCTION: RUN_ALL_TESTS_SIMPLE
**LINES:** 116+
**SIGNATURE:** `function RUN_ALL_TESTS_SIMPLE() {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


### FILE: src/TEST_RUNNER.gs
**LINES:** 165
**FUNCTIONS:** 2


#### FUNCTION: TEST_SYSTEM
**LINES:** 11+
**SIGNATURE:** `function TEST_SYSTEM() {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** LARGE FUNCTION - 120 lines


#### FUNCTION: QUICK_CHECK
**LINES:** 135+
**SIGNATURE:** `function QUICK_CHECK() {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None


### FILE: src/verify_sheet_creation.gs
**LINES:** 107
**FUNCTIONS:** 2


#### FUNCTION: VERIFY_SHEET_CREATION
**LINES:** 11+
**SIGNATURE:** `function VERIFY_SHEET_CREATION() {`
**WIRED-UP:** 2 call site(s) found
**HEALTH FLAGS:** LOOP WITH SHEETS API - quota risk


#### FUNCTION: RUN_VERIFICATION
**LINES:** 90+
**SIGNATURE:** `function RUN_VERIFICATION() {`
**WIRED-UP:** 1 call site(s) found
**HEALTH FLAGS:** None
