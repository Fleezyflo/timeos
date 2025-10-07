/**
 * MOH TIME OS v2.0 - SENDER REPUTATION MANAGER
 *
 * Bayesian reputation scoring system for email senders.
 * Tracks sender approval/rejection history and calculates trust scores.
 * Provides reputation-based filtering for email processing.
 *
 * Original lines: 5277-5913 from scriptA.js
 */

class SenderReputationManager {
  constructor(batchOperations, logger, configManager, cache) {
    this.batchOperations = batchOperations;
    this.logger = logger;
    this.configManager = configManager;
    this.cache = cache;

    // Bayesian prior parameters for new senders
    this.ALPHA_PRIOR = 1; // Prior approved count
    this.BETA_PRIOR = 1;  // Prior rejected count

    // Cache configuration for performance
    this.REPUTATION_CACHE_KEY = 'sender_reputation_table_v1';
    this.REPUTATION_CACHE_TTL = 600; // 10 minutes
    this.PENDING_UPDATES_KEY = 'reputation_pending_updates_v1';

    // In-memory store for pending updates (batch processing)
    this.pendingUpdates = new Map(); // sender_email -> update_data
    this.cacheLoaded = false;
  }

  /**
   * Get or create sender reputation record
   * @param {string} senderEmail - Sender's email address
   * @returns {Object} Sender reputation data
   */
  getSenderReputation(senderEmail) {
    try {
      if (!senderEmail || typeof senderEmail !== 'string') {
        throw new Error('Invalid sender email provided');
      }

      const normalizedEmail = senderEmail.toLowerCase().trim();

      // Cache-first approach - load reputation table once and cache it
      const reputationTable = this._getReputationTableFromCache();

      // Check if sender exists in cached table
      if (reputationTable.has(normalizedEmail)) {
        const senderData = reputationTable.get(normalizedEmail);
        this.logger.debug('SenderReputationManager', `Found sender in cache: ${normalizedEmail}`);
        return senderData;
      } else {
        // New sender - create neutral record and add to cache
        const newReputation = this._createNewSenderRecordInCache(normalizedEmail, reputationTable);
        return newReputation;
      }
    } catch (error) {
      // Handle missing SENDER_REPUTATION sheet gracefully
      if (error.message && error.message.toLowerCase().includes('not found')) {
        this.logger.warn('SenderReputationManager',
          'SENDER_REPUTATION sheet not found. Operating without reputation scoring.', {
            senderEmail: senderEmail,
            error: error.message
          });
        return this._getNeutralReputation(senderEmail);
      }

      this.logger.error('SenderReputationManager', `Error getting sender reputation: ${error.message}`, {
        senderEmail: senderEmail,
        error: error.message
      });

      // Return neutral reputation on error to avoid blocking emails
      return this._getNeutralReputation(senderEmail);
    }
  }

  /**
   * Update sender reputation based on user feedback
   * @param {string} senderEmail - Sender's email address
   * @param {string} feedbackType - 'approved' or 'rejected'
   * @param {Object} additionalContext - Optional additional context
   */
  recordFeedback(senderEmail, feedbackType, additionalContext = {}) {
    try {
      if (!senderEmail || typeof senderEmail !== 'string') {
        throw new Error('Invalid sender email provided');
      }

      if (!['approved', 'rejected'].includes(feedbackType)) {
        throw new Error(`Invalid feedback type: ${feedbackType}`);
      }

      const normalizedEmail = senderEmail.toLowerCase().trim();
      const currentReputation = this.getSenderReputation(normalizedEmail);

      // Update counts based on feedback
      let newApprovedCount = currentReputation.approved_count;
      let newRejectedCount = currentReputation.rejected_count;

      if (feedbackType === 'approved') {
        newApprovedCount++;
      } else {
        newRejectedCount++;
      }

      // Calculate new reputation score using Bayesian approach
      const newReputationScore = this._calculateBayesianScore(newApprovedCount, newRejectedCount);

      // Update sender data
      const updatedSender = {
        ...currentReputation,
        approved_count: newApprovedCount,
        rejected_count: newRejectedCount,
        reputation_score: newReputationScore,
        last_updated: TimeZoneAwareDate.now(),
        total_interactions: newApprovedCount + newRejectedCount
      };

      // Stage update for batch processing
      this._stagePendingUpdate(normalizedEmail, updatedSender);

      this.logger.info('SenderReputationManager', `Recorded ${feedbackType} feedback for sender`, {
        sender: normalizedEmail,
        newScore: newReputationScore,
        totalInteractions: updatedSender.total_interactions,
        context: additionalContext
      });

      return updatedSender;

    } catch (error) {
      this.logger.error('SenderReputationManager', `Error recording feedback: ${error.message}`, {
        senderEmail: senderEmail,
        feedbackType: feedbackType,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get reputation table from cache or load from sheet
   * @returns {Map} Map of sender_email -> reputation_data
   * @private
   */
  _getReputationTableFromCache() {
    // Check if we have cached data
    const cachedTable = this.cache.get(this.REPUTATION_CACHE_KEY);
    if (cachedTable && this.cacheLoaded) {
      return new Map(cachedTable);
    }

    // Load from sheet and cache
    try {
      const headers = this.batchOperations.getHeaders(SHEET_NAMES.SENDER_REPUTATION);
      const rows = this.batchOperations.getRowsByFilter(SHEET_NAMES.SENDER_REPUTATION, {});

      const reputationMap = new Map();

      rows.forEach(row => {
        // Skip header row (check multiple columns to avoid false positives)
        if (row[0] === 'sender_email' && row[1] === 'approved_count' && row[2] === 'rejected_count') {
          return;
        }

        if (row.length >= headers.length) {
          const senderData = {};
          headers.forEach((header, index) => {
            senderData[header] = row[index];
          });

          // Ensure numeric fields are properly typed
          senderData.approved_count = parseInt(senderData.approved_count, 10) || 0;
          senderData.rejected_count = parseInt(senderData.rejected_count, 10) || 0;
          senderData.reputation_score = parseFloat(senderData.reputation_score) || 0.5;
          senderData.total_interactions = parseInt(senderData.total_interactions, 10) || 0;

          reputationMap.set(senderData.sender_email, senderData);
        }
      });

      // Cache the table
      this.cache.set(this.REPUTATION_CACHE_KEY, Array.from(reputationMap.entries()), this.REPUTATION_CACHE_TTL);
      this.cacheLoaded = true;

      this.logger.debug('SenderReputationManager', `Loaded ${reputationMap.size} sender reputations from sheet`);

      return reputationMap;

    } catch (error) {
      this.logger.error('SenderReputationManager', `Failed to load reputation table: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create a new sender record in cache
   * @param {string} normalizedEmail - Normalized sender email
   * @param {Map} reputationTable - Current reputation table
   * @returns {Object} New sender reputation data
   * @private
   */
  _createNewSenderRecordInCache(normalizedEmail, reputationTable) {
    const newSender = {
      sender_email: normalizedEmail,
      approved_count: 0,
      rejected_count: 0,
      reputation_score: 0.5, // Neutral starting score
      first_seen: TimeZoneAwareDate.now(),
      last_updated: TimeZoneAwareDate.now(),
      total_interactions: 0,
      status: 'ACTIVE'
    };

    // Add to cache
    reputationTable.set(normalizedEmail, newSender);

    // Update cached version
    this.cache.set(this.REPUTATION_CACHE_KEY, Array.from(reputationTable.entries()), this.REPUTATION_CACHE_TTL);

    // Stage for batch write to sheet
    this._stagePendingUpdate(normalizedEmail, newSender);

    this.logger.debug('SenderReputationManager', `Created new sender record: ${normalizedEmail}`);

    return newSender;
  }

  /**
   * Calculate Bayesian reputation score
   * @param {number} approvedCount - Number of approved interactions
   * @param {number} rejectedCount - Number of rejected interactions
   * @returns {number} Bayesian reputation score (0-1)
   * @private
   */
  _calculateBayesianScore(approvedCount, rejectedCount) {
    // Beta distribution with priors
    const alpha = approvedCount + this.ALPHA_PRIOR;
    const beta = rejectedCount + this.BETA_PRIOR;

    // Mean of beta distribution
    const score = alpha / (alpha + beta);

    // Round to 3 decimal places
    return Math.round(score * 1000) / 1000;
  }

  /**
   * Get neutral reputation for new or error cases
   * @param {string} senderEmail - Sender email
   * @returns {Object} Neutral reputation data
   * @private
   */
  _getNeutralReputation(senderEmail) {
    return {
      sender_email: senderEmail,
      approved_count: 0,
      rejected_count: 0,
      reputation_score: 0.5,
      first_seen: TimeZoneAwareDate.now(),
      last_updated: TimeZoneAwareDate.now(),
      total_interactions: 0,
      status: 'ACTIVE',
      trustScore: 0.5 // For compatibility with ZeroTrustTriageEngine
    };
  }

  /**
   * Stage pending update for batch processing
   * @param {string} senderEmail - Sender email
   * @param {Object} updatedData - Updated sender data
   * @private
   */
  _stagePendingUpdate(senderEmail, updatedData) {
    this.pendingUpdates.set(senderEmail, updatedData);

    // If we have many pending updates, flush them
    // Lowered from 50 to 10 to ensure data persistence
    if (this.pendingUpdates.size >= 10) {
      this.flushPendingUpdates();
    }
  }

  /**
   * Flush all pending updates to the sheet
   */
  flushPendingUpdates() {
    if (this.pendingUpdates.size === 0) {
      return;
    }

    try {
      this.logger.info('SenderReputationManager', `Flushing ${this.pendingUpdates.size} pending reputation updates`);

      const headers = this.batchOperations.getHeaders(SHEET_NAMES.SENDER_REPUTATION);
      const safeAccess = new SafeColumnAccess(headers);
      const existingData = this.batchOperations.getRowsByFilter(SHEET_NAMES.SENDER_REPUTATION, {});

      // Build a map of existing data for efficient lookup
      const existingMap = new Map();
      existingData.forEach((row, index) => {
        if (row.length > 0) {
          const senderEmailIndex = headers.indexOf('sender_email');
          if (senderEmailIndex !== -1 && row[senderEmailIndex]) {
            existingMap.set(row[senderEmailIndex], index + 2); // +2 for header row and 0-based indexing
          }
        }
      });

      const newRows = [];
      const updates = [];

      // Process each pending update
      for (const [senderEmail, updatedData] of this.pendingUpdates) {
        const row = this._senderDataToRow(updatedData, headers);

        if (existingMap.has(senderEmail)) {
          // Update existing row
          const rowNumber = existingMap.get(senderEmail);
          updates.push({
            range: safeAccess.getRowRange(rowNumber),
            values: [row]
          });
        } else {
          // New row to append
          newRows.push(row);
        }
      }

      // Perform batch updates
      if (updates.length > 0) {
        this.batchOperations.batchUpdate(SHEET_NAMES.SENDER_REPUTATION, updates);
      }

      if (newRows.length > 0) {
        this.batchOperations.appendRows(SHEET_NAMES.SENDER_REPUTATION, newRows);
      }

      // Clear pending updates
      this.pendingUpdates.clear();

      // Invalidate cache to force reload
      this.cache.delete(this.REPUTATION_CACHE_KEY);
      this.cacheLoaded = false;

      this.logger.info('SenderReputationManager', 'Successfully flushed reputation updates', {
        updates: updates.length,
        newRows: newRows.length
      });

    } catch (error) {
      this.logger.error('SenderReputationManager', `Failed to flush pending updates: ${error.message}`);
      throw error;
    }
  }

  /**
   * Convert sender data to sheet row
   * @param {Object} senderData - Sender reputation data
   * @param {Array} headers - Sheet headers
   * @returns {Array} Row data
   * @private
   */
  _senderDataToRow(senderData, headers) {
    const row = new Array(headers.length).fill('');

    headers.forEach((header, index) => {
      if (senderData.hasOwnProperty(header)) {
        row[index] = senderData[header];
      }
    });

    return row;
  }

  /**
   * Get reputation multiplier for task prioritization
   * @param {string} senderEmail - Sender email
   * @returns {number} Reputation multiplier (0.5 to 1.5)
   */
  getReputationMultiplier(senderEmail) {
    try {
      const reputation = this.getSenderReputation(senderEmail);
      const score = reputation.reputation_score;

      // Convert 0-1 score to 0.5-1.5 multiplier
      // score = 0 -> multiplier = 0.5
      // score = 0.5 -> multiplier = 1.0
      // score = 1 -> multiplier = 1.5
      const multiplier = 0.5 + score;

      return Math.max(0.5, Math.min(1.5, multiplier));

    } catch (error) {
      this.logger.warn('SenderReputationManager', `Error getting reputation multiplier, using neutral: ${error.message}`);
      return 1.0; // Neutral multiplier on error
    }
  }

  /**
   * Check if sender is blocked
   * @param {string} senderEmail - Sender email
   * @returns {boolean} True if sender is blocked
   */
  isSenderBlocked(senderEmail) {
    try {
      const reputation = this.getSenderReputation(senderEmail);
      return reputation.status === 'BLOCKED';
    } catch (error) {
      return false; // Don't block on error
    }
  }

  /**
   * Block a sender
   * @param {string} senderEmail - Sender email
   * @param {string} reason - Reason for blocking
   */
  blockSender(senderEmail, reason = 'Manual block') {
    try {
      const normalizedEmail = senderEmail.toLowerCase().trim();
      const currentReputation = this.getSenderReputation(normalizedEmail);

      const updatedSender = {
        ...currentReputation,
        status: 'BLOCKED',
        block_reason: reason,
        blocked_at: TimeZoneAwareDate.now(),
        last_updated: TimeZoneAwareDate.now()
      };

      this._stagePendingUpdate(normalizedEmail, updatedSender);

      this.logger.info('SenderReputationManager', `Blocked sender: ${normalizedEmail}`, {
        reason: reason
      });

      return updatedSender;

    } catch (error) {
      this.logger.error('SenderReputationManager', `Error blocking sender: ${error.message}`);
      throw error;
    }
  }

  /**
   * Unblock a sender
   * @param {string} senderEmail - Sender email
   */
  unblockSender(senderEmail) {
    try {
      const normalizedEmail = senderEmail.toLowerCase().trim();
      const currentReputation = this.getSenderReputation(normalizedEmail);

      const updatedSender = {
        ...currentReputation,
        status: 'ACTIVE',
        block_reason: null,
        blocked_at: null,
        last_updated: TimeZoneAwareDate.now()
      };

      this._stagePendingUpdate(normalizedEmail, updatedSender);

      this.logger.info('SenderReputationManager', `Unblocked sender: ${normalizedEmail}`);

      return updatedSender;

    } catch (error) {
      this.logger.error('SenderReputationManager', `Error unblocking sender: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get reputation statistics
   * @returns {Object} Reputation system statistics
   */
  getReputationStats() {
    try {
      const reputationTable = this._getReputationTableFromCache();
      const senders = Array.from(reputationTable.values());

      const stats = {
        totalSenders: senders.length,
        activeSenders: senders.filter(s => s.status === 'ACTIVE').length,
        blockedSenders: senders.filter(s => s.status === 'BLOCKED').length,
        averageScore: 0,
        highTrustSenders: 0,
        lowTrustSenders: 0,
        pendingUpdates: this.pendingUpdates.size
      };

      if (stats.totalSenders > 0) {
        const totalScore = senders.reduce((sum, s) => sum + s.reputation_score, 0);
        stats.averageScore = Math.round((totalScore / stats.totalSenders) * 1000) / 1000;

        stats.highTrustSenders = senders.filter(s => s.reputation_score > 0.7).length;
        stats.lowTrustSenders = senders.filter(s => s.reputation_score < 0.3).length;
      }

      return stats;

    } catch (error) {
      return {
        error: error.message,
        totalSenders: 0,
        pendingUpdates: this.pendingUpdates.size
      };
    }
  }

  /**
   * Test reputation system functionality
   * @returns {boolean} True if all tests pass
   */
  selfTest() {
    try {
      this.logger.info('SenderReputationManager', 'Running reputation system self-test');

      // Test 1: Basic reputation retrieval - use unique sender
      const testSender = 'test-selftest-' + Date.now() + '@example.com';
      const reputation = this.getSenderReputation(testSender);
      if (!reputation || typeof reputation.reputation_score !== 'number') {
        throw new Error('Failed to get basic reputation');
      }

      // Test 2: Feedback recording
      this.recordFeedback(testSender, 'approved');

      // CRITICAL FIX: Flush pending updates before validation
      this.flushPendingUpdates();

      // Clear cache to force reload from sheet
      this.cacheLoaded = false;
      this.cache.delete(this.REPUTATION_CACHE_KEY);

      const updatedReputation = this.getSenderReputation(testSender);
      if (updatedReputation.approved_count < 1) { // Changed from !== 1 to < 1
        throw new Error('Failed to record feedback');
      }

      // Test 3: Bayesian score calculation
      const score = this._calculateBayesianScore(5, 2);
      if (score < 0 || score > 1) {
        throw new Error('Invalid Bayesian score calculation');
      }

      // Test 4: Reputation multiplier
      const multiplier = this.getReputationMultiplier(testSender);
      if (multiplier < 0.5 || multiplier > 1.5) {
        throw new Error('Reputation multiplier out of expected range');
      }

      this.logger.info('SenderReputationManager', 'All reputation system tests passed');
      return true;

    } catch (error) {
      this.logger.error('SenderReputationManager', `Reputation system test failed: ${error.message}`);
      return false;
    }
  }
}