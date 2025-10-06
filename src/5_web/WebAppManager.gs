/**
 * MOH TIME OS v2.0 - WEB APP MANAGER
 *
 * Centralized web app request handler with proper dependency injection.
 * Eliminates circular dependencies and provides observability for all web requests.
 * Handles both GET (AppSheet bridge) and POST (Google Chat) with authentication.
 *
 * Original lines: 7997-8053 from scriptA.js
 */

class WebAppManager {
  constructor(appSheetBridge, chatEngine, systemManager, secureAuth, logger) {
    this.appSheetBridge = appSheetBridge; this.chatEngine = chatEngine;
    this.systemManager = systemManager; this.secureAuth = secureAuth; this.logger = logger;
  }

  handleDoGet(e) {
    const verificationId = Utilities.getUuid();

    // Check if this is a UI request (no endpoint parameter)
    const isUIRequest = !e || !e.parameter || !e.parameter.endpoint;

    if (isUIRequest) {
      // Serve HTML - no authentication required at this stage
      // Authentication happens automatically via google.script.run (user context)
      try {
        this.logger.info('WebAppManager', 'Serving DayPlanner UI', { verification_id: verificationId });

        const output = HtmlService.createHtmlOutputFromFile('5_web/DayPlanner')
          .setTitle('MOH Time OS - Day Planner')
          .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
          .addMetaTag('viewport', 'width=device-width, initial-scale=1');

        // Use NATIVE mode to avoid Google's buggy iframe wrapper with invalid feature policies
        output.setSandboxMode(HtmlService.SandboxMode.NATIVE);

        return output;

      } catch (error) {
        this.logger.error('WebAppManager', 'Failed to serve DayPlanner UI', {
          verification_id: verificationId,
          error: error.message
        });

        // Friendly error message when DayPlanner.html doesn't exist yet
        const errorHtml = '<!DOCTYPE html><html><head><title>UI Not Found</title><style>' +
          'body { font-family: sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }' +
          'h1 { color: #d32f2f; }' +
          'code { background: #f5f5f5; padding: 2px 6px; border-radius: 3px; }' +
          'p { line-height: 1.6; }' +
          '.error { background: #ffebee; border-left: 4px solid #d32f2f; padding: 15px; margin: 20px 0; }' +
          '</style></head><body>' +
          '<h1>DayPlanner UI Not Created Yet</h1>' +
          '<p>The file <code>moh-time-os-v2/src/5_web/DayPlanner.html</code> does not exist.</p>' +
          '<div class="error"><strong>Error:</strong> ' + error.message + '</div>' +
          '<p><strong>Expected Location:</strong> <code>src/5_web/DayPlanner.html</code></p>' +
          '<p><strong>Next Step:</strong> Create DayPlanner.html in the web layer to enable the UI.</p>' +
          '<p><strong>Backend API:</strong> All 28 appsheet_* functions are available and ready to use.</p>' +
          '<p><strong>Request ID:</strong> ' + verificationId + '</p>' +
          '</body></html>';

        return HtmlService.createHtmlOutput(errorHtml).setTitle('UI Not Found');
      }
    }

    // API endpoints (config/status) require token authentication
    if (!this.secureAuth.verifyWebAppToken(e)) {
      this.logger.warn('WebAppManager', 'doGet auth failed', { verification_id: verificationId });
      return ContentService.createTextOutput(JSON.stringify({ status: 401, error: 'Unauthorized', request_id: verificationId })).setMimeType(ContentService.MimeType.JSON);
    }

    // Lock and route to AppSheetBridge for JSON
    const lock = LockService.getScriptLock();
    if (!lock.tryLock(10000)) {
      this.logger.warn('WebAppManager', 'doGet lock contention', { verification_id: verificationId });
      return ContentService.createTextOutput(JSON.stringify({ status: 503, error: 'Service busy', request_id: verificationId })).setMimeType(ContentService.MimeType.JSON);
    }

    try {
      this.logger.info('WebAppManager', 'Processing doGet API request', {
        verification_id: verificationId,
        endpoint: e.parameter.endpoint
      });
      return this.appSheetBridge.doGet(e);
    } catch (error) {
      this.logger.error('WebAppManager', 'doGet failed', { verification_id: verificationId, error: error.message });
      throw error; // Re-throw the error to ensure it's not swallowed
    } finally {
      lock.releaseLock();
    }
  }

  handleDoPost(e) {
    const verificationId = Utilities.getUuid();
    if (!this.secureAuth.verifyGoogleChatAuth(e)) {
      this.logger.warn('WebAppManager', 'doPost auth failed', { verification_id: verificationId });
      return ContentService.createTextOutput(JSON.stringify({ status: 401, error: 'Unauthorized', request_id: verificationId })).setMimeType(ContentService.MimeType.JSON);
    }
    const lock = LockService.getScriptLock();
    if (!lock.tryLock(10000)) {
      this.logger.warn('WebAppManager', 'doPost lock contention', { verification_id: verificationId });
      return ContentService.createTextOutput(JSON.stringify({ status: 503, error: 'Service busy', request_id: verificationId })).setMimeType(ContentService.MimeType.JSON);
    }
    try {
      if (!this.systemManager._verifyDatabaseSchema()) {
        this.logger.error('WebAppManager', 'Schema verification failed', { verification_id: verificationId });
        return ContentService.createTextOutput(JSON.stringify({ text: 'System maintenance in progress', error: 'Schema verification failed', request_id: verificationId })).setMimeType(ContentService.MimeType.JSON);
      }
      return this.chatEngine.doPost(e);
    } catch (error) {
      this.logger.error('WebAppManager', 'doPost failed', { verification_id: verificationId, error: error.message });
      throw error; // Re-throw the error to ensure it's not swallowed
    } finally {
      lock.releaseLock();
    }
  }

  /**
   * Self-test method for deployment validation
   * @returns {boolean} True if all basic functionality works
   */
  selfTest() {
    try {
      // Test 1: Basic dependency validation
      if (!this.appSheetBridge || !this.chatEngine || !this.systemManager || !this.secureAuth || !this.logger) {
        return false;
      }

      // Test 2: Logger functionality
      try {
        this.logger.debug('WebAppManager', 'Self-test logging check');
      } catch (logError) {
        return false;
      }

      // Test 3: Lock service availability
      const lock = LockService.getScriptLock();
      if (!lock) {
        return false;
      }

      // Test 4: Content service availability
      const testResponse = ContentService.createTextOutput('test').setMimeType(ContentService.MimeType.JSON);
      if (!testResponse) {
        return false;
      }

      // Test 5: Utilities availability for UUID generation
      const testUuid = Utilities.getUuid();
      if (!testUuid || typeof testUuid !== 'string') {
        return false;
      }

      return true;
    } catch (error) {
      this.logger.error('WebAppManager', `Self-test failed: ${error.message}`);
      return false;
    }
  }
}