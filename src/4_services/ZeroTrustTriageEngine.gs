/**
 * MOH TIME OS v2.0 - ZERO TRUST TRIAGE ENGINE
 *
 * Advanced email triage system that processes full inbox without relying on labels.
 * Implements 4-stage pipeline: Sieve → Technical Filter → Reputation Check → NLP Analysis.
 * Provides zero-trust email processing with machine learning capabilities.
 *
 * Original lines: 12846-13610 from scriptA.js
 */

class ZeroTrustTriageEngine {
  constructor(senderReputationManager, batchOperations, logger, configManager, errorHandler) {
    this.senderReputationManager = senderReputationManager;
    this.batchOperations = batchOperations;
    this.logger = logger;
    this.configManager = configManager;
    this.errorHandler = errorHandler;

    // Gmail label names from global constants
    this.TRIAGE_APPROVED_LABEL = GMAIL_LABELS.TRIAGE_APPROVED;
    this.TRIAGE_IGNORED_LABEL = GMAIL_LABELS.TRIAGE_IGNORED;
    this.TRIAGE_PROCESSING_LABEL = GMAIL_LABELS.TRIAGE_PROCESSING;
  }

  /**
   * Lazy getter for EmailIngestionEngine to resolve circular dependency
   * @returns {EmailIngestionEngine} The email ingestion engine instance
   */
  get emailIngestionEngine() {
    if (!this._emailIngestionEngine) {
      // Lazy load from container to avoid circular dependency
      if (typeof container !== 'undefined' && container.has && container.has(SERVICES.EmailIngestionEngine)) {
        this._emailIngestionEngine = container.get(SERVICES.EmailIngestionEngine);
      } else {
        throw new Error('EmailIngestionEngine not available in container');
      }
    }
    return this._emailIngestionEngine;
  }

  /**
   * Main entry point for Zero-Trust Triage processing
   * Replaces the traditional label-based email processing with full inbox scanning
   * @returns {Object} Processing results with metrics
   */
  runInboxTriageCycle() {
    return this.errorHandler.withRetry(() => {
      this.logger.info('ZeroTrustTriageEngine', 'Starting Zero-Trust Triage cycle for full inbox');

      const results = {
        processed: 0,
        approved: 0,
        ignored: 0,
        errors: 0,
        proposals_created: [],
        processing_time_ms: Date.now()
      };

      try {
        // Stage 1: The Sieve - Get candidate emails from full inbox
        const candidateEmails = this._executeSieveStage();

        if (!candidateEmails || candidateEmails.length === 0) {
          this.logger.info('ZeroTrustTriageEngine', 'No candidate emails found in inbox');
          return results;
        }

        this.logger.info('ZeroTrustTriageEngine', `Sieve stage identified ${candidateEmails.length} candidate emails`);

        // Process each candidate through the 4-stage pipeline
        for (const email of candidateEmails) {
          try {
            const triageResult = this._processEmailThroughPipeline(email);

            results.processed++;

            if (triageResult.decision === 'APPROVED') {
              results.approved++;
              if (triageResult.proposalData) {
                results.proposals_created.push(triageResult.proposalData);
              }
            } else if (triageResult.decision === 'IGNORED') {
              results.ignored++;
            }

          } catch (emailError) {
            results.errors++;
            this.logger.error('ZeroTrustTriageEngine', `Error processing individual email: ${emailError.message}`, {
              email_id: email.getId ? email.getId() : 'unknown',
              error: emailError.message
            });

            // Continue processing other emails despite individual failures
          }
        }

        // Batch create all approved proposals
        if (results.proposals_created.length > 0) {
          this._batchCreateProposals(results.proposals_created);
        }

        results.processing_time_ms = Date.now() - results.processing_time_ms;

        // Flush any pending sender reputation updates to persist them
        if (this.senderReputationManager && typeof this.senderReputationManager.flushPendingUpdates === 'function') {
          this.senderReputationManager.flushPendingUpdates();
        }

        this.logger.info('ZeroTrustTriageEngine',
          `Triage cycle complete: ${results.processed} processed, ${results.approved} approved, ${results.ignored} ignored, ${results.errors} errors`);

        return results;

      } catch (error) {
        this.logger.error('ZeroTrustTriageEngine', `Critical error in triage cycle: ${error.message}`, {
          error: error.message,
          stack: error.stack
        });

        // Critical failure - fallback to original engine will be handled by caller
        throw error;
      }
    }, 'runInboxTriageCycle');
  }

  /**
   * Stage 1: The Sieve - Aggressive filtering to get candidates from full inbox
   * Uses cheap Gmail search queries to identify potential actionable emails
   * @returns {Array} Array of GmailMessage objects that passed initial filtering
   * @private
   */
  _executeSieveStage() {
    try {
      this.logger.debug('ZeroTrustTriageEngine', 'Executing Sieve stage - searching full inbox');

      // Get maximum lookback from config
      const maxDaysBack = this.configManager.getNumber('ZERO_TRUST_MAX_DAYS_BACK', 30);
      const batchSize = this.configManager.getNumber('ZERO_TRUST_BATCH_SIZE', 100);

      // Build search query to exclude already-processed emails
      const searchQuery = this._buildSieveSearchQuery(maxDaysBack);

      this.logger.debug('ZeroTrustTriageEngine', `Using search query: ${searchQuery}`);

      // Search inbox
      const threads = GmailApp.search(searchQuery, 0, batchSize);
      const messages = [];

      // Optimized: Get only last message per thread using batch processing
      for (const thread of threads) {
        const threadMessages = thread.getMessages();
        // Only process the most recent message in each thread to avoid duplicates
        if (threadMessages.length > 0) {
          messages.push(threadMessages[threadMessages.length - 1]);
        }
      }

      this.logger.debug('ZeroTrustTriageEngine', `Sieve stage found ${messages.length} candidate messages from ${threads.length} threads`);

      return messages;

    } catch (error) {
      this.logger.error('ZeroTrustTriageEngine', `Sieve stage failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Build the Gmail search query for the Sieve stage
   * @param {number} maxDaysBack - Maximum days to look back
   * @returns {string} Gmail search query
   * @private
   */
  _buildSieveSearchQuery(maxDaysBack) {
    const excludeLabels = [
      this.TRIAGE_APPROVED_LABEL,
      this.TRIAGE_IGNORED_LABEL,
      this.TRIAGE_PROCESSING_LABEL,
      GMAIL_LABELS.ACTION_BLOCK
    ];

    let query = 'in:inbox';

    // Exclude already processed emails
    for (const label of excludeLabels) {
      query += ` -label:"${label}"`;
    }

    // Add date restriction
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - maxDaysBack);
    const dateStr = Utilities.formatDate(cutoffDate, Session.getScriptTimeZone(), 'yyyy/MM/dd');
    query += ` after:${dateStr}`;

    // Exclude common noise patterns
    query += ' -from:noreply';
    query += ' -from:no-reply';
    query += ' -subject:"out of office"';
    query += ' -subject:"auto-reply"';

    return query;
  }

  /**
   * Process a single email through the 4-stage triage pipeline
   * @param {GmailMessage} email - Email message to process
   * @returns {Object} Triage result with decision and optional proposal data
   * @private
   */
  _processEmailThroughPipeline(email) {
    // Stage 2: Technical Filter
    const technicalResult = this._executeTechnicalFilter(email);
    if (!technicalResult.passed) {
      this._markEmailIgnored(email, 'TECHNICAL_FILTER', technicalResult.reason);
      return { decision: 'IGNORED', reason: technicalResult.reason };
    }

    // Stage 3: Reputation Check
    const reputationResult = this._executeReputationCheck(email);
    if (!reputationResult.passed) {
      this._markEmailIgnored(email, 'REPUTATION_CHECK', reputationResult.reason);
      return { decision: 'IGNORED', reason: reputationResult.reason };
    }

    // Stage 4: NLP Analysis
    const nlpResult = this._executeNLPAnalysis(email);
    if (!nlpResult.passed) {
      this._markEmailIgnored(email, 'NLP_ANALYSIS', nlpResult.reason);
      return { decision: 'IGNORED', reason: nlpResult.reason };
    }

    // Email passed all stages - approve for task creation
    this._markEmailApproved(email);
    return {
      decision: 'APPROVED',
      proposalData: nlpResult.proposalData
    };
  }

  /**
   * Stage 2: Technical Filter - Fast technical checks
   * @param {GmailMessage} email - Email to analyze
   * @returns {Object} Filter result with passed flag and reason
   * @private
   */
  _executeTechnicalFilter(email) {
    try {
      const subject = email.getSubject() || '';
      const body = email.getPlainBody() || '';
      const sender = email.getFrom() || '';

      // Check for auto-generated content
      if (this._isAutoGenerated(email, subject, body, sender)) {
        return { passed: false, reason: 'Auto-generated content detected' };
      }

      // Check minimum content requirements
      if (subject.length < 3 || body.length < 10) {
        return { passed: false, reason: 'Insufficient content' };
      }

      // Check for spam indicators
      if (this._hasSpamIndicators(subject, body)) {
        return { passed: false, reason: 'Spam indicators detected' };
      }

      return { passed: true };

    } catch (error) {
      this.logger.error('ZeroTrustTriageEngine', `Technical filter error: ${error.message}`);
      return { passed: false, reason: `Technical filter error: ${error.message}` };
    }
  }

  /**
   * Check if email is auto-generated
   * @param {GmailMessage} email - Email message
   * @param {string} subject - Email subject
   * @param {string} body - Email body
   * @param {string} sender - Sender address
   * @returns {boolean} True if auto-generated
   * @private
   */
  _isAutoGenerated(email, subject, body, sender) {
    const autoIndicators = [
      'auto-reply', 'automatic reply', 'out of office',
      'delivery status notification', 'undelivered mail',
      'vacation response', 'away message'
    ];

    const subjectLower = subject.toLowerCase();
    const bodyLower = body.toLowerCase();
    const senderLower = sender.toLowerCase();

    // Check for obvious auto-reply indicators
    for (const indicator of autoIndicators) {
      if (subjectLower.includes(indicator) || bodyLower.includes(indicator)) {
        return true;
      }
    }

    // Check for automated sender patterns
    const autoSenderPatterns = [
      'noreply', 'no-reply', 'donotreply', 'mailer-daemon',
      'postmaster', 'support@', 'notifications@'
    ];

    for (const pattern of autoSenderPatterns) {
      if (senderLower.includes(pattern)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check for spam indicators in email content
   * @param {string} subject - Email subject
   * @param {string} body - Email body
   * @returns {boolean} True if spam indicators found
   * @private
   */
  _hasSpamIndicators(subject, body) {
    const spamKeywords = [
      'urgent action required', 'click here now', 'limited time offer',
      'congratulations you have won', 'nigerian prince', 'lottery winner',
      'make money fast', 'work from home opportunity'
    ];

    const combinedText = (subject + ' ' + body).toLowerCase();

    for (const keyword of spamKeywords) {
      if (combinedText.includes(keyword)) {
        return true;
      }
    }

    // Check for excessive capitalization
    const capsRatio = (combinedText.match(/[A-Z]/g) || []).length / combinedText.length;
    if (capsRatio > 0.3) {
      return true;
    }

    return false;
  }

  /**
   * Stage 3: Reputation Check - Verify sender reputation
   * @param {GmailMessage} email - Email to analyze
   * @returns {Object} Reputation check result
   * @private
   */
  _executeReputationCheck(email) {
    try {
      const sender = email.getFrom();

      if (!this.senderReputationManager) {
        // If reputation manager not available, allow through
        return { passed: true, reason: 'Reputation manager not available' };
      }

      const reputation = this.senderReputationManager.getSenderReputation(sender);

      // Block known bad senders
      if (reputation.status === 'BLOCKED') {
        return { passed: false, reason: `Sender blocked: ${reputation.reason}` };
      }

      // Require minimum trust score
      const minScore = this.configManager.getNumber('ZERO_TRUST_MIN_REPUTATION_SCORE', 0.3);
      if (reputation.trustScore < minScore) {
        return { passed: false, reason: `Low trust score: ${reputation.trustScore}` };
      }

      return { passed: true, trustScore: reputation.trustScore };

    } catch (error) {
      this.logger.error('ZeroTrustTriageEngine', `Reputation check error: ${error.message}`);
      // On error, be permissive rather than blocking legitimate emails
      return { passed: true, reason: `Reputation check error (allowed): ${error.message}` };
    }
  }

  /**
   * Stage 4: NLP Analysis - Extract actionable tasks from email content
   * @param {GmailMessage} email - Email to analyze
   * @returns {Object} NLP analysis result with proposal data
   * @private
   */
  _executeNLPAnalysis(email) {
    try {
      const subject = email.getSubject() || '';
      const body = email.getPlainBody() || '';
      const sender = email.getFrom() || '';
      const receivedTime = email.getDate();

      // Use existing email processing logic from EmailIngestionEngine
      const emailData = {
        messageId: email.getId(),
        senderEmail: sender,
        subject: subject,
        body: body,
        date: receivedTime,
        threadId: email.getThread().getId(),
        actionabilityScore: 1.0
      };

      // Delegate to EmailIngestionEngine for NLP processing
      const emailIngestionEngine = this.emailIngestionEngine;
      if (emailIngestionEngine && emailIngestionEngine.parseTaskFromEmailWithLearning) {
        this.logger.debug('ZeroTrustTriageEngine', 'Calling parseTaskFromEmailWithLearning', {
          subject: subject.substring(0, 50),
          hasBody: !!body,
          bodyLength: body.length
        });

        const extractionResult = emailIngestionEngine.parseTaskFromEmailWithLearning(emailData);

        this.logger.debug('ZeroTrustTriageEngine', 'NLP extraction result', {
          hasResult: !!extractionResult,
          actionable: extractionResult ? extractionResult.actionable : 'N/A',
          title: extractionResult ? extractionResult.title : 'N/A',
          lane: extractionResult ? extractionResult.lane : 'N/A'
        });

        if (!extractionResult || !extractionResult.actionable) {
          return { passed: false, reason: 'No actionable content detected' };
        }

        // Build proposal data structure
        const proposalData = {
          proposal_id: `zt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          status: STATUS.PENDING_APPROVAL,
          created_at: TimeZoneAwareDate.now(),
          processed_at: null,
          source: 'zero_trust_triage',
          source_id: emailData.messageId,
          sender: sender,
          subject: subject,
          parsed_title: extractionResult.title,
          suggested_lane: extractionResult.lane,
          suggested_priority: extractionResult.suggested_priority || PRIORITY.MEDIUM,
          suggested_duration: extractionResult.suggested_duration || '',
          confidence_score: extractionResult.score,
          raw_content_preview: body.substring(0, 200) + (body.length > 200 ? '...' : ''),
          created_task_id: ''
        };

        return {
          passed: true,
          proposalData: proposalData
        };
      }

      return { passed: false, reason: 'EmailIngestionEngine not available for NLP analysis' };

    } catch (error) {
      this.logger.error('ZeroTrustTriageEngine', `NLP analysis error: ${error.message}`);
      return { passed: false, reason: `NLP analysis error: ${error.message}` };
    }
  }

  /**
   * Mark email as approved and apply processing label
   * @param {GmailMessage} email - Email to mark
   * @private
   */
  _markEmailApproved(email) {
    try {
      const label = GmailApp.getUserLabelByName(this.TRIAGE_APPROVED_LABEL) ||
                   GmailApp.createLabel(this.TRIAGE_APPROVED_LABEL);
      email.getThread().addLabel(label);

      this.logger.debug('ZeroTrustTriageEngine', `Marked email as approved: ${email.getSubject()}`);
    } catch (error) {
      this.logger.error('ZeroTrustTriageEngine', `Failed to mark email as approved: ${error.message}`);
    }
  }

  /**
   * Mark email as ignored and apply processing label
   * @param {GmailMessage} email - Email to mark
   * @param {string} stage - Stage where email was rejected
   * @param {string} reason - Reason for rejection
   * @private
   */
  _markEmailIgnored(email, stage, reason) {
    try {
      const label = GmailApp.getUserLabelByName(this.TRIAGE_IGNORED_LABEL) ||
                   GmailApp.createLabel(this.TRIAGE_IGNORED_LABEL);
      email.getThread().addLabel(label);

      this.logger.debug('ZeroTrustTriageEngine', `Marked email as ignored at ${stage}: ${reason}`, {
        subject: email.getSubject(),
        sender: email.getFrom()
      });
    } catch (error) {
      this.logger.error('ZeroTrustTriageEngine', `Failed to mark email as ignored: ${error.message}`);
    }
  }

  /**
   * Batch create proposals in the PROPOSED_TASKS sheet
   * @param {Array} proposalsData - Array of proposal objects
   * @private
   */
  _batchCreateProposals(proposalsData) {
    try {
      this.logger.info('ZeroTrustTriageEngine', `Creating ${proposalsData.length} task proposals from approved emails`);

      const headers = this.batchOperations.getHeaders(SHEET_NAMES.PROPOSED_TASKS);
      const safeAccess = new SafeColumnAccess(headers);
      const rows = proposalsData.map(proposal => safeAccess.mapObjectToRow({
        proposal_id: proposal.proposal_id,
        status: proposal.status,
        created_at: proposal.created_at,
        processed_at: proposal.processed_at || '',
        source: proposal.source,
        source_id: proposal.source_id,
        sender: proposal.sender,
        subject: proposal.subject,
        parsed_title: proposal.parsed_title,
        suggested_lane: proposal.suggested_lane,
        suggested_priority: proposal.suggested_priority || '',
        suggested_duration: proposal.suggested_duration || '',
        confidence_score: proposal.confidence_score || '',
        raw_content_preview: proposal.raw_content_preview || '',
        created_task_id: proposal.created_task_id || ''
      }));

      // Append all proposals at once
      this.batchOperations.appendRows(SHEET_NAMES.PROPOSED_TASKS, rows);

      this.logger.info('ZeroTrustTriageEngine', `Successfully created ${proposalsData.length} task proposals`);

    } catch (error) {
      this.logger.error('ZeroTrustTriageEngine', `Failed to batch create proposals: ${error.message}`, {
        count: proposalsData.length,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get Zero-Trust Triage Engine statistics
   * @returns {Object} Engine statistics and health info
   */
  getEngineStats() {
    try {
      const approvedCount = this._countEmailsWithLabel(this.TRIAGE_APPROVED_LABEL);
      const ignoredCount = this._countEmailsWithLabel(this.TRIAGE_IGNORED_LABEL);

      return {
        healthy: true,
        approved_emails: approvedCount,
        ignored_emails: ignoredCount,
        total_processed: approvedCount + ignoredCount,
        labels_configured: this._verifyLabelsExist(),
        timestamp: TimeZoneAwareDate.now()
      };

    } catch (error) {
      // OBJ_SENTINEL_NULL_RETHROW_FATAL profile
      // TEST: TEST_SILENT_063_GETENGINESTATS
      LoggerFacade.error('ZeroTrustTriageEngine', 'getEngineStats failed', {
        error: error.message,
        stack: error.stack,
        context: 'getEngineStats'
      });

      if (error.name === 'DatabaseError' || error.name === 'ConfigurationError') {
        throw error;
      }

      return null;
    }
  }

  /**
   * Count emails with a specific label
   * @param {string} labelName - Label name to count
   * @returns {number} Count of emails
   * @private
   */
  _countEmailsWithLabel(labelName) {
    try {
      const label = GmailApp.getUserLabelByName(labelName);
      return label ? label.getThreads().length : 0;
    } catch (error) {
      // RETHROW_WITH_LOG profile
      // TEST: TEST_SILENT_064__COUNTEMAILSWITHLABEL
      LoggerFacade.error('ZeroTrustTriageEngine', '_countEmailsWithLabel failed', {
        error: error.message,
        stack: error.stack,
        context: '_countEmailsWithLabel'
      });

      throw error;
    }
  }

  /**
   * Verify that all required labels exist
   * @returns {boolean} True if all labels exist
   * @private
   */
  _verifyLabelsExist() {
    const requiredLabels = [
      this.TRIAGE_APPROVED_LABEL,
      this.TRIAGE_IGNORED_LABEL,
      this.TRIAGE_PROCESSING_LABEL
    ];

    for (const labelName of requiredLabels) {
      const label = GmailApp.getUserLabelByName(labelName);
      if (!label) {
        return false;
      }
    }

    return true;
  }

  /**
   * Test Zero-Trust Triage Engine functionality
   * @returns {boolean} True if test passes
   */
  selfTest() {
    try {
      this.logger.info('ZeroTrustTriageEngine', 'Running Zero-Trust Triage Engine self-test');

      // Test 1: Verify dependencies
      if (!this.batchOperations || !this.logger || !this.configManager || !this.errorHandler) {
        throw new Error('Missing required dependencies');
      }

      // Test 2: Verify Gmail access
      const testQuery = 'in:inbox';
      GmailApp.search(testQuery, 0, 1);

      // Test 3: Verify label creation capability
      const testLabelName = 'TimeOS/Test-' + Date.now();
      const testLabel = GmailApp.createLabel(testLabelName);
      GmailApp.deleteLabel(testLabel);

      // Test 4: Verify sheet access
      this.batchOperations.getHeaders(SHEET_NAMES.PROPOSED_TASKS);

      // Test 5: Test configuration access
      const maxDaysBack = this.configManager.getNumber('ZERO_TRUST_MAX_DAYS_BACK', 30);
      const batchSize = this.configManager.getNumber('ZERO_TRUST_BATCH_SIZE', 100);
      const minScore = this.configManager.getNumber('ZERO_TRUST_MIN_REPUTATION_SCORE', 0.3);

      this.logger.info('ZeroTrustTriageEngine', 'Self-test passed', {
        maxDaysBack: maxDaysBack,
        batchSize: batchSize,
        minScore: minScore
      });

      return true;

    } catch (error) {
      this.logger.error('ZeroTrustTriageEngine', `Zero-Trust Engine test failed: ${error.message}`);
      return false;
    }
  }
}
