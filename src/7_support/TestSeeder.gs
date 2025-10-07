/**
 * MOH TIME OS v2.0 - TEST SEEDER
 *
 * Test data seeder for predictable test environments.
 * Manages creation and cleanup of test data scenarios in spreadsheets.
 * Ensures tests run against known, controlled datasets for reliability.
 *
 * Original lines: 11689-11906 from scriptA.js
 */

class TestSeeder {
  constructor(batchOperations, logger) {
    this.mockService = new MockService();
    this.batchOperations = batchOperations;
    this.logger = logger;
  }

  /**
   * Seed test data for a specific scenario
   * @param {string} scenario - Scenario name
   * @param {Object} options - Seeding options
   */
  seedTestData(scenario, options = {}) {
    const { cleanSlate = true } = options;

    try {
      // Use constructor-injected logger
      const logger = this.logger;
      // RF-1 FIX: Use injected dependency instead of global container
      const batchOps = this.batchOperations;

      this.logger.info('TestSeeder', `Seeding test data for scenario: ${scenario}`, { clean_slate: cleanSlate });

      // Clean slate - wipe existing data if requested
      if (cleanSlate) {
        this._cleanAllTestData();
      }

      // Reset mock service counters for consistent IDs
      this.mockService.reset();

      switch (scenario) {
      case 'empty':
        // No data - useful for testing empty states
        break;

      case 'basic_workflow':
        this._seedBasicWorkflowData(batchOps);
        break;

      case 'scheduling_stress_test':
        this._seedLargeBacklogData(batchOps);
        break;

      case 'email_ingestion_test':
        this._seedEmailIngestionData(batchOps);
        break;

      case 'calendar_integration_test':
        this._seedCalendarIntegrationData(batchOps);
        break;

      case 'mixed_scenario':
        this._seedMixedScenarioData(batchOps);
        break;

      default:
        throw new Error(`Unknown test scenario: ${scenario}`);
      }

      this.logger.info('TestSeeder', `Test data seeding completed for scenario: ${scenario}`);

    } catch (error) {
      // Use constructor-injected logger
      const logger = this.logger;
      logger.error('TestSeeder', 'Failed to seed test data', {
        scenario,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Clean all test data from sheets
   * @private
   */
  _cleanAllTestData() {
    // RF-1 FIX: Use injected dependency instead of global container
    const batchOps = this.batchOperations;

    // Clear main data sheets but preserve headers
    const sheetsToClean = [SHEET_NAMES.ACTIONS, SHEET_NAMES.PROPOSED_TASKS, SHEET_NAMES.CALENDAR_PROJECTION, SHEET_NAMES.TIME_BLOCKS, SHEET_NAMES.CHAT_QUEUE];

    for (const sheetName of sheetsToClean) {
      try {
        const headers = batchOps.getHeaders(sheetName);
        const sheet = batchOps._getSheet(sheetName);

        // Delete all data rows efficiently, preserving header
        const totalRows = sheet.getLastRow();
        if (totalRows > 1) {
          // Delete all data rows at once - more efficient than clearing ranges for large datasets
          sheet.deleteRows(2, totalRows - 1);
        }
      } catch (error) {
        // Sheet might not exist - continue with others
        this.logger.warn('System', `Could not clean sheet ${sheetName}: ${error.message}`);
      }
    }
  }

  /**
   * Seed data for basic workflow testing
   * @private
   */
  _seedBasicWorkflowData(batchOps) {
    const actions = this.mockService.createMockActionsForScenario('basic');
    const headers = batchOps.getHeaders(SHEET_NAMES.ACTIONS);
    const safeAccess = new SafeColumnAccess(headers);

    // Convert actions to sheet rows
    const updates = actions.map((action, index) => ({
      rangeA1: safeAccess.getRowRange(index + 2), // A2, A3, etc.
      values: [action.toSheetRow(headers)]
    }));

    batchOps.batchUpdate(SHEET_NAMES.ACTIONS, updates);
  }

  /**
   * Seed data for large backlog stress testing
   * @private
   */
  _seedLargeBacklogData(batchOps) {
    const actions = this.mockService.createMockActionsForScenario('large_backlog');
    const timeBlocks = this.mockService.createMockTimeBlocks('work_hours');

    // Seed actions
    const actionHeaders = batchOps.getHeaders(SHEET_NAMES.ACTIONS);
    const actionSafeAccess = new SafeColumnAccess(actionHeaders);
    const actionUpdates = actions.map((action, index) => ({
      rangeA1: actionSafeAccess.getRowRange(index + 2),
      values: [action.toSheetRow(actionHeaders)]
    }));
    batchOps.batchUpdate(SHEET_NAMES.ACTIONS, actionUpdates);

    // Seed time blocks
    const blockHeaders = batchOps.getHeaders(SHEET_NAMES.TIME_BLOCKS);
    const blockSafeAccess = new SafeColumnAccess(blockHeaders);
    const blockUpdates = timeBlocks.map((block, index) => {
      const row = blockHeaders.map(header => block[header] || '');
      return {
        rangeA1: blockSafeAccess.getRowRange(index + 2),
        values: [row]
      };
    });
    batchOps.batchUpdate(SHEET_NAMES.TIME_BLOCKS, blockUpdates);
  }

  /**
   * Seed data for email ingestion testing
   * @private
   */
  _seedEmailIngestionData(batchOps) {
    const proposals = this.mockService.createMockProposedTasks(5);
    const headers = batchOps.getHeaders(SHEET_NAMES.PROPOSED_TASKS);
    const safeAccess = new SafeColumnAccess(headers);

    const updates = proposals.map((proposal, index) => {
      const row = headers.map(header => proposal[header] || '');
      return {
        rangeA1: safeAccess.getRowRange(index + 2),
        values: [row]
      };
    });

    batchOps.batchUpdate(SHEET_NAMES.PROPOSED_TASKS, updates);
  }

  /**
   * Seed data for calendar integration testing
   * @private
   */
  _seedCalendarIntegrationData(batchOps) {
    const events = this.mockService.createMockCalendarEvents(8);
    const headers = batchOps.getHeaders(SHEET_NAMES.CALENDAR_PROJECTION);
    const safeAccess = new SafeColumnAccess(headers);

    const updates = events.map((event, index) => {
      const row = headers.map(header => event[header] || '');
      return {
        rangeA1: safeAccess.getRowRange(index + 2),
        values: [row]
      };
    });

    batchOps.batchUpdate(SHEET_NAMES.CALENDAR_PROJECTION, updates);
  }

  /**
   * Seed mixed scenario data
   * @private
   */
  _seedMixedScenarioData(batchOps) {
    // Combine multiple data types
    this._seedBasicWorkflowData(batchOps);

    // Add some calendar events
    const events = this.mockService.createMockCalendarEvents(3);
    const eventHeaders = batchOps.getHeaders(SHEET_NAMES.CALENDAR_PROJECTION);
    const eventSafeAccess = new SafeColumnAccess(eventHeaders);
    const eventUpdates = events.map((event, index) => {
      const row = eventHeaders.map(header => event[header] || '');
      return {
        rangeA1: eventSafeAccess.getRowRange(index + 2),
        values: [row]
      };
    });
    batchOps.batchUpdate(SHEET_NAMES.CALENDAR_PROJECTION, eventUpdates);

    // Add some proposed tasks
    const proposals = this.mockService.createMockProposedTasks(2);
    const proposalHeaders = batchOps.getHeaders(SHEET_NAMES.PROPOSED_TASKS);
    const proposalSafeAccess = new SafeColumnAccess(proposalHeaders);
    const proposalUpdates = proposals.map((proposal, index) => {
      const row = proposalHeaders.map(header => proposal[header] || '');
      return {
        rangeA1: proposalSafeAccess.getRowRange(index + 2),
        values: [row]
      };
    });
    batchOps.batchUpdate(SHEET_NAMES.PROPOSED_TASKS, proposalUpdates);
  }
}