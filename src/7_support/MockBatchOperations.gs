/**
 * MOH TIME OS v2.0 - MOCK BATCH OPERATIONS
 *
 * Hermetically sealed testing with in-memory sheet simulation.
 * Eliminates shared state pollution for isolated unit tests.
 * Provides atomic operations simulation with feature flag support.
 *
 * Original lines: 10154-10426 from scriptA.js
 */

class MockBatchOperations {
  constructor(cache, logger) {
    this.cache = cache;
    this.logger = logger;
    this.mockSheets = new Map(); // In-memory sheets
    this.headerCachePrefix = 'headers_';
    // Phase 6: Operation tracking for test assertions
    this.operationCounts = {
      optimisticLockCalls: 0,
      deletions: 0,
      appends: 0
    };
    this.initializeMockSheets();
  }

  /**
   * Initialize mock sheets with minimal required structure
   * @private
   */
  initializeMockSheets() {
    this.mockSheets.set(SHEET_NAMES.ACTIONS, {
      headers: [
        'action_id', 'status', 'priority', 'created_at', 'updated_at',
        'title', 'context', 'lane', 'estimated_minutes', 'scheduled_start',
        'scheduled_end', 'actual_minutes', 'completed_date', 'completion_notes',
        'source', 'source_id', 'description', 'calendar_event_id', 'rollover_count',
        'scheduling_metadata', 'score', 'deadline', 'energy_required',
        'focus_required', 'estimation_accuracy', 'created_by',
        'assigned_to', 'parent_id', 'dependencies', 'tags'
      ],
      data: []
    });

    this.mockSheets.set(SHEET_NAMES.APPSHEET_CONFIG, {
      headers: ['config_key', 'config_value', 'updated_at', 'description'],
      data: [
        ['SCHEDULING_ENABLED', 'true', TimeZoneAwareDate.toISOString(new Date()), 'Enable automatic scheduling']
      ]
    });

    this.mockSheets.set(SHEET_NAMES.TIME_BLOCKS, {
      headers: [
        'block_id', 'date', 'start_time', 'end_time', 'block_type', 'energy_level',
        'remaining_minutes', 'scheduled_actions', 'created_at'
      ],
      data: []
    });

    this.mockSheets.set(SHEET_NAMES.ACTIVITY, {
      headers: ['timestamp', 'level', 'component', 'message', 'context'],
      data: []
    });

    this.mockSheets.set(SHEET_NAMES.PROPOSED_TASKS, {
      headers: [
        'proposal_id', 'status', 'created_at', 'processed_at', 'source',
        'source_id', 'sender', 'subject', 'parsed_title', 'suggested_lane',
        'suggested_priority', 'suggested_duration',
        'confidence_score', 'raw_content_preview', 'created_task_id'
      ],
      data: []
    });

    this.mockSheets.set(SHEET_NAMES.HUMAN_STATE, {
      headers: [
        'state_id', 'timestamp', 'energy_level', 'focus_level', 'mood',
        'stress_level', 'current_context', 'notes'
      ],
      data: []
    });
  }

  /**
   * Get headers for a mock sheet (with caching simulation)
   */
  getHeaders(sheetName) {
    const mockSheet = this.mockSheets.get(sheetName);
    if (!mockSheet) {
      throw new Error(`MockBatchOperations: Sheet '${sheetName}' does not exist`);
    }

    const cacheKey = `${this.headerCachePrefix}${sheetName}:${mockSheet.headers.length}`;
    let cachedHeaders = this.cache.get(cacheKey);

    if (!cachedHeaders) {
      this.cache.set(cacheKey, mockSheet.headers, 300); // 5-minute TTL
      cachedHeaders = mockSheet.headers;
    }

    return [...cachedHeaders];
  }

  /**
   * Get all data from mock sheet including headers
   */
  getAllSheetData(sheetName) {
    const mockSheet = this.mockSheets.get(sheetName);
    if (!mockSheet) {
      throw new Error(`MockBatchOperations: Sheet '${sheetName}' does not exist`);
    }
    return [
      [...mockSheet.headers], // Headers as first row
      ...mockSheet.data.map(row => [...row])
    ];
  }

  /**
   * Get data rows with their sheet positions for iteration
   */
  getRowsWithPosition(sheetName, criteria = {}) {
    const mockSheet = this.mockSheets.get(sheetName);
    if (!mockSheet) {
      throw new Error(`MockBatchOperations: Sheet '${sheetName}' does not exist`);
    }

    const result = [];
    mockSheet.data.forEach((row, index) => {
      let matches = true;
      for (const [key, value] of Object.entries(criteria)) {
        const colIndex = mockSheet.headers.indexOf(key);
        if (colIndex !== -1 && row[colIndex] !== value) {
          matches = false;
          break;
        }
      }
      if (matches) {
        result.push({
          row: [...row],
          sheetRowIndex: index + 2 // +2 because row 1 is headers, sheets are 1-indexed
        });
      }
    });

    return result;
  }

  /**
   * Batch update mock sheet data
   */
  batchUpdate(sheetName, updates) {
    const mockSheet = this.mockSheets.get(sheetName);
    if (!mockSheet) {
      throw new Error(`MockBatchOperations: Sheet '${sheetName}' does not exist`);
    }

    for (const update of updates) {
      if (update.rangeA1 && update.values) {
        const match = update.rangeA1.match(/^([A-Z]+)(\d+):([A-Z]+)(\d+)$/);
        if (match) {
          const startCol = this._columnA1ToIndex(match[1]);
          const startRow = parseInt(match[2], 10);
          const endCol = this._columnA1ToIndex(match[3]);
          const endRow = parseInt(match[4], 10);

          for (let rowOffset = 0; rowOffset <= endRow - startRow; rowOffset++) {
            const targetRowIndex = startRow - 1 + rowOffset;
            const valueRow = update.values[rowOffset] || [];

            if (targetRowIndex === 0) {
              for (let colOffset = 0; colOffset <= endCol - startCol; colOffset++) {
                const targetColIndex = startCol + colOffset;
                const newValue = valueRow[colOffset];
                if (newValue !== undefined && targetColIndex < mockSheet.headers.length) {
                  mockSheet.headers[targetColIndex] = newValue;
                }
              }
            } else {
              const dataRowIndex = targetRowIndex - 1;
              while (mockSheet.data.length <= dataRowIndex) {
                mockSheet.data.push(new Array(mockSheet.headers.length).fill(''));
              }
              for (let colOffset = 0; colOffset <= endCol - startCol; colOffset++) {
                const targetColIndex = startCol + colOffset;
                const newValue = valueRow[colOffset];
                if (newValue !== undefined && targetColIndex < mockSheet.headers.length) {
                  mockSheet.data[dataRowIndex][targetColIndex] = newValue;
                }
              }
            }
          }
        }
      } else if (update.row && update.values) {
        const targetRowIndex = update.row - 2;
        if (targetRowIndex >= 0) {
          while (mockSheet.data.length <= targetRowIndex) {
            mockSheet.data.push(new Array(mockSheet.headers.length).fill(''));
          }
          mockSheet.data[targetRowIndex] = [...update.values];
        }
      }
    }

    const cacheKey = `${this.headerCachePrefix}${sheetName}:${mockSheet.headers.length}`;
    if (this.cache.delete) {
      this.cache.delete(cacheKey);
    }
  }

  /**
   * Add test data to mock sheets
   */
  addTestData(sheetName, testData) {
    const mockSheet = this.mockSheets.get(sheetName);
    if (!mockSheet) {
      throw new Error(`MockBatchOperations: Sheet '${sheetName}' does not exist`);
    }
    testData.forEach(rowData => {
      mockSheet.data.push([...rowData]);
    });
  }

  /**
   * Clear all test data (for hermetic isolation)
   */
  clearTestData() {
    for (const mockSheet of this.mockSheets.values()) {
      mockSheet.data = [];
    }
    if (this.cache.deletePattern) {
      this.cache.deletePattern(this.headerCachePrefix);
    } else if (this.cache.clear) {
      this.cache.clear();
    }
  }

  /**
   * Convert A1 column notation to 0-based index
   * @private
   */
  _columnA1ToIndex(columnA1) {
    let result = 0;
    for (let i = 0; i < columnA1.length; i++) {
      result = result * 26 + (columnA1.charCodeAt(i) - 64);
    }
    return result - 1;
  }

  /**
   * Mock implementation of atomic swap with feature flag support
   * Simulates atomic swap behavior for testing
   */
  performAtomicSwapOrFallback(originalSheetName, newData, configManager, logger) {
    const startTime = Date.now();

    try {
      logger.debug('BatchOperations', `Starting atomic swap for ${originalSheetName} with ${newData.length} rows`);

      // Simulate atomic swap by replacing data
      const mockSheet = this.mockSheets.get(originalSheetName);
      if (!mockSheet) {
        throw new Error(`MockBatchOperations: Sheet '${originalSheetName}' does not exist`);
      }

      if (newData.length === 0) {
        mockSheet.headers = [];
        mockSheet.data = [];
      } else {
        mockSheet.headers = [...newData[0]];
        mockSheet.data = newData.slice(1).map(row => [...row]);
      }

      const elapsedMs = Date.now() - startTime;
      this.logger.info('BatchOperations', `Atomic swap completed for ${originalSheetName} in ${elapsedMs}ms`);
      return true;

    } catch (error) {
      const elapsedMs = Date.now() - startTime;
      logger.warn('BatchOperations', `Atomic swap failed for ${originalSheetName} after ${elapsedMs}ms: ${error.message}`);
      this.logger.info('BatchOperations', `Falling back to legacy pattern for ${originalSheetName}`);
      return this._performLegacyClearAndSet(originalSheetName, newData, logger);
    }
  }

  /**
   * Mock legacy clear and set for atomic swap fallback
   */
  _performLegacyClearAndSet(sheetName, newData, logger) {
    const mockSheet = this.mockSheets.get(sheetName);
    if (!mockSheet) {
      throw new Error(`MockBatchOperations: Sheet '${sheetName}' does not exist`);
    }
    if (newData.length === 0) {
      mockSheet.headers = [];
      mockSheet.data = [];
    } else {
      mockSheet.headers = [...newData[0]];
      mockSheet.data = newData.slice(1).map(row => [...row]);
    }
    logger.info('BatchOperations', `Legacy clear and set performed for ${sheetName}`);
    return false;
  }

  /**
   * Phase 6: Append rows to mock sheet
   * Instrumented for test assertions
   */
  appendRows(sheetName, rows) {
    const mockSheet = this.mockSheets.get(sheetName);
    if (!mockSheet) {
      throw new Error(`MockBatchOperations: Sheet '${sheetName}' does not exist`);
    }

    rows.forEach(row => {
      mockSheet.data.push([...row]);
      this.operationCounts.appends++; // Phase 6: Track appends
    });

    this.logger.debug('MockBatchOperations', `Appended ${rows.length} rows to ${sheetName}`);
  }

  /**
   * Phase 6: Update action with optimistic locking
   * Simplified mock implementation with instrumentation
   */
  updateActionWithOptimisticLocking(sheetName, actionId, updatedAction) {
    this.operationCounts.optimisticLockCalls++; // Phase 6: Track optimistic lock calls

    const mockSheet = this.mockSheets.get(sheetName);
    if (!mockSheet) {
      throw new Error(`MockBatchOperations: Sheet '${sheetName}' does not exist`);
    }

    const actionIdIndex = mockSheet.headers.indexOf('action_id');
    if (actionIdIndex === -1) {
      return { success: false, error: 'action_id column not found' };
    }

    // Find the row with matching action_id
    const rowIndex = mockSheet.data.findIndex(row => row[actionIdIndex] === actionId);

    if (rowIndex === -1) {
      return { success: false, error: 'Task not found' };
    }

    // Mock version check (simplified - always succeeds for testing)
    const versionIndex = mockSheet.headers.indexOf('version');
    if (versionIndex !== -1) {
      const currentVersion = mockSheet.data[rowIndex][versionIndex] || 0;
      const expectedVersion = updatedAction.version || 0;

      if (currentVersion !== expectedVersion) {
        return { success: false, versionConflict: true, error: 'Version conflict' };
      }
    }

    // Update the row with new values
    mockSheet.headers.forEach((header, index) => {
      if (updatedAction[header] !== undefined) {
        mockSheet.data[rowIndex][index] = updatedAction[header];
      }
    });

    // Increment version if present
    if (versionIndex !== -1) {
      mockSheet.data[rowIndex][versionIndex] = (mockSheet.data[rowIndex][versionIndex] || 0) + 1;
    }

    return { success: true };
  }

  /**
   * Phase 6: Delete rows by indices
   * Instrumented for test assertions
   */
  deleteRowsByIndices(sheetName, rowIndices) {
    const mockSheet = this.mockSheets.get(sheetName);
    if (!mockSheet) {
      throw new Error(`MockBatchOperations: Sheet '${sheetName}' does not exist`);
    }

    // Sort indices in descending order to delete from bottom up
    const sortedIndices = [...rowIndices].sort((a, b) => b - a);

    sortedIndices.forEach(rowIndex => {
      // Convert 1-based sheet row index to 0-based data array index
      const dataIndex = rowIndex - 2; // -2 because row 1 is header
      if (dataIndex >= 0 && dataIndex < mockSheet.data.length) {
        mockSheet.data.splice(dataIndex, 1);
        this.operationCounts.deletions++; // Phase 6: Track deletions
      }
    });

    this.logger.debug('MockBatchOperations', `Deleted ${sortedIndices.length} rows from ${sheetName}`);
    return sortedIndices.length;
  }

  /**
   * Phase 6: Get operation counts for test assertions
   */
  getOperationCounts() {
    return { ...this.operationCounts };
  }

  /**
   * Phase 6: Reset operation counts for test isolation
   */
  resetOperationCounts() {
    this.operationCounts = {
      optimisticLockCalls: 0,
      deletions: 0,
      appends: 0
    };
  }

  /**
   * Phase 6: Get rows by filter (for testing)
   * Simplified implementation
   */
  getRowsByFilter(sheetName, filterObject = {}, options = {}) {
    const mockSheet = this.mockSheets.get(sheetName);
    if (!mockSheet) {
      throw new Error(`MockBatchOperations: Sheet '${sheetName}' does not exist`);
    }

    const { includeHeader = false } = options;
    const filteredData = [];

    mockSheet.data.forEach(row => {
      let matches = true;
      for (const [key, value] of Object.entries(filterObject)) {
        const colIndex = mockSheet.headers.indexOf(key);
        if (colIndex !== -1 && row[colIndex] !== value) {
          matches = false;
          break;
        }
      }
      if (matches) {
        filteredData.push([...row]);
      }
    });

    if (includeHeader && filteredData.length > 0) {
      return [[...mockSheet.headers], ...filteredData];
    }

    return filteredData;
  }
}