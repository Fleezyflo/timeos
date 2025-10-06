# PHASE 3: GMAIL API ERROR HANDLING - SUBAGENT BRIEF

## OBJECTIVE
Implement comprehensive Gmail API quota management and error handling to prevent rate limit failures.

## TASKS

### TASK 1: Add Quota Manager to EmailIngestionEngine
**File**: `src/4_services/EmailIngestionEngine.gs`
**Location**: Constructor and class methods
**Required Actions**:
1. Add quota management properties to constructor
2. Add `_enforceQuotaLimit()` method
3. Wrap all Gmail API calls with quota enforcement

**Step 1 - Add to Constructor** (after existing properties):
```javascript
// Add these properties in the constructor:
this.quotaManager = {
  callsPerMinute: 0,
  lastReset: Date.now(),
  maxCallsPerMinute: 75,
  waitTime: 1000, // ms between calls
  lastCallTime: 0,
  totalCallsToday: 0,
  dailyLimit: 250000,
  lastDailyReset: new Date().toDateString()
};
```

**Step 2 - Add Quota Enforcement Method**:
```javascript
/**
 * Enforce Gmail API quota limits
 * @private
 */
_enforceQuotaLimit() {
  const now = Date.now();
  const today = new Date().toDateString();

  // Reset daily counter if new day
  if (today !== this.quotaManager.lastDailyReset) {
    this.quotaManager.totalCallsToday = 0;
    this.quotaManager.lastDailyReset = today;
  }

  // Check daily limit
  if (this.quotaManager.totalCallsToday >= this.quotaManager.dailyLimit) {
    throw new Error('Daily Gmail API quota exceeded');
  }

  // Reset per-minute counter
  if (now - this.quotaManager.lastReset > 60000) {
    this.quotaManager.callsPerMinute = 0;
    this.quotaManager.lastReset = now;
  }

  // Check per-minute limit
  if (this.quotaManager.callsPerMinute >= this.quotaManager.maxCallsPerMinute) {
    const waitTime = 60000 - (now - this.quotaManager.lastReset);
    this.logger.warn('EmailIngestionEngine', `Gmail quota limit reached, waiting ${waitTime}ms`);
    Utilities.sleep(waitTime);
    this.quotaManager.callsPerMinute = 0;
    this.quotaManager.lastReset = Date.now();
  }

  // Enforce minimum time between calls
  const timeSinceLastCall = now - this.quotaManager.lastCallTime;
  if (timeSinceLastCall < this.quotaManager.waitTime) {
    Utilities.sleep(this.quotaManager.waitTime - timeSinceLastCall);
  }

  this.quotaManager.callsPerMinute++;
  this.quotaManager.totalCallsToday++;
  this.quotaManager.lastCallTime = Date.now();
}
```

**Step 3 - Wrap processUnreadEmails Method**:
Find the `processUnreadEmails()` method and modify it:
```javascript
processUnreadEmails() {
  const maxRetries = 3;
  let retryCount = 0;

  while (retryCount < maxRetries) {
    try {
      // Add quota enforcement before Gmail API call
      this._enforceQuotaLimit();

      // ... existing implementation ...
      // (keep the existing code but wrap it in this try-catch)

    } catch (error) {
      // Handle specific Gmail errors
      if (error.message && error.message.includes('User-rate limit exceeded')) {
        retryCount++;
        if (retryCount >= maxRetries) {
          this.logger.error('EmailIngestionEngine', 'Gmail rate limit exceeded after retries');
          throw error;
        }
        const backoffTime = Math.pow(2, retryCount) * 60000; // Exponential backoff
        this.logger.warn('EmailIngestionEngine', `Rate limit hit, waiting ${backoffTime}ms`);
        Utilities.sleep(backoffTime);
        continue; // Retry
      }

      // Handle quota errors
      if (error.message && error.message.includes('Quota exceeded')) {
        this.logger.error('EmailIngestionEngine', 'Gmail quota exceeded', {
          dailyCalls: this.quotaManager.totalCallsToday,
          error: error.message
        });
        throw error;
      }

      // Other errors
      throw error;
    }
  }
}
```

### TASK 2: Add Batch Processing with Error Recovery
**File**: `src/4_services/EmailIngestionEngine.gs`
**Location**: Add new method for batch processing
**Required Actions**:
1. Add `_processEmailBatch()` method
2. Add retry logic for failed batches

**Add This Method**:
```javascript
/**
 * Process email batch with error recovery
 * @private
 */
_processEmailBatch(threads, startIndex, batchSize) {
  const maxRetries = 3;
  let retryCount = 0;

  while (retryCount < maxRetries) {
    try {
      this._enforceQuotaLimit();

      const endIndex = Math.min(startIndex + batchSize, threads.length);
      const batch = threads.slice(startIndex, endIndex);

      const results = [];
      const failedThreads = [];

      for (const thread of batch) {
        try {
          // Process individual thread with error handling
          this._enforceQuotaLimit();
          const messages = thread.getMessages();

          for (const message of messages) {
            try {
              this._enforceQuotaLimit();
              const result = this._processMessage(message);
              results.push(result);
            } catch (messageError) {
              this.logger.error('EmailIngestionEngine', 'Failed to process message', {
                messageId: message.getId(),
                subject: message.getSubject(),
                error: messageError.message
              });
              // Continue with next message
            }
          }
        } catch (threadError) {
          this.logger.error('EmailIngestionEngine', 'Failed to process thread', {
            threadId: thread.getId(),
            error: threadError.message
          });
          failedThreads.push(thread);
        }
      }

      // Retry failed threads once
      if (failedThreads.length > 0 && retryCount === 0) {
        this.logger.info('EmailIngestionEngine', `Retrying ${failedThreads.length} failed threads`);
        Utilities.sleep(2000); // Wait 2 seconds before retry

        for (const thread of failedThreads) {
          try {
            this._enforceQuotaLimit();
            const messages = thread.getMessages();
            for (const message of messages) {
              this._processMessage(message);
            }
          } catch (retryError) {
            this.logger.error('EmailIngestionEngine', 'Thread retry failed', {
              threadId: thread.getId(),
              error: retryError.message
            });
          }
        }
      }

      return results;

    } catch (error) {
      retryCount++;
      if (retryCount >= maxRetries) {
        this.logger.error('EmailIngestionEngine', 'Batch processing failed after retries', {
          startIndex,
          batchSize,
          error: error.message
        });
        throw error;
      }

      const backoffTime = Math.pow(2, retryCount) * 1000;
      this.logger.warn('EmailIngestionEngine', `Retrying batch after ${backoffTime}ms`, {
        attempt: retryCount
      });
      Utilities.sleep(backoffTime);
    }
  }
}

/**
 * Process individual message
 * @private
 */
_processMessage(message) {
  try {
    const messageData = {
      id: message.getId(),
      subject: message.getSubject(),
      from: message.getFrom(),
      date: message.getDate(),
      body: message.getPlainBody(),
      labels: message.getThread().getLabels().map(l => l.getName())
    };

    // Process the message (existing logic)
    return this._extractTaskFromMessage(messageData);
  } catch (error) {
    this.logger.error('EmailIngestionEngine', 'Message processing failed', {
      messageId: message.getId(),
      error: error.message
    });
    throw error;
  }
}
```

### TASK 3: Add ZeroTrustTriageEngine Quota Management
**File**: `src/4_services/ZeroTrustTriageEngine.gs`
**Location**: Similar quota management for triage operations
**Required Actions**:
1. Add quota manager to constructor
2. Wrap Gmail API calls

**Add to Constructor**:
```javascript
// Add quota manager (same as EmailIngestionEngine)
this.quotaManager = {
  callsPerMinute: 0,
  lastReset: Date.now(),
  maxCallsPerMinute: 75,
  waitTime: 1000,
  lastCallTime: 0
};
```

**Wrap the scanUnprocessedEmails Method**:
Find `scanUnprocessedEmails()` and add error handling:
```javascript
scanUnprocessedEmails(daysBack = 30, maxEmails = 100) {
  try {
    // Enforce quota before search
    this._enforceQuotaLimit();

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);

    const searchQuery = this._buildSearchQuery(cutoffDate);

    // Add quota enforcement before Gmail search
    this._enforceQuotaLimit();
    const threads = GmailApp.search(searchQuery, 0, maxEmails);

    if (!threads || threads.length === 0) {
      this.logger.info('ZeroTrustTriageEngine', 'No unprocessed emails found');
      return { processed: 0, approved: 0, ignored: 0 };
    }

    // Process in smaller batches to avoid timeouts
    const batchSize = 10;
    let totalProcessed = 0;
    let totalApproved = 0;
    let totalIgnored = 0;

    for (let i = 0; i < threads.length; i += batchSize) {
      const batch = threads.slice(i, Math.min(i + batchSize, threads.length));

      for (const thread of batch) {
        try {
          this._enforceQuotaLimit();
          const result = this._processThread(thread);
          totalProcessed++;
          if (result.approved) totalApproved++;
          if (result.ignored) totalIgnored++;
        } catch (threadError) {
          this.logger.error('ZeroTrustTriageEngine', 'Thread processing failed', {
            threadId: thread.getId(),
            error: threadError.message
          });
        }
      }
    }

    return {
      processed: totalProcessed,
      approved: totalApproved,
      ignored: totalIgnored
    };

  } catch (error) {
    if (error.message && error.message.includes('User-rate limit exceeded')) {
      this.logger.warn('ZeroTrustTriageEngine', 'Gmail rate limit hit, will retry later');
      return { processed: 0, approved: 0, ignored: 0, error: 'Rate limit exceeded' };
    }
    throw error;
  }
}

// Add the quota enforcement method (copy from EmailIngestionEngine)
_enforceQuotaLimit() {
  // Same implementation as EmailIngestionEngine
  const now = Date.now();

  if (now - this.quotaManager.lastReset > 60000) {
    this.quotaManager.callsPerMinute = 0;
    this.quotaManager.lastReset = now;
  }

  if (this.quotaManager.callsPerMinute >= this.quotaManager.maxCallsPerMinute) {
    const waitTime = 60000 - (now - this.quotaManager.lastReset);
    this.logger.warn('ZeroTrustTriageEngine', `Gmail quota limit reached, waiting ${waitTime}ms`);
    Utilities.sleep(waitTime);
    this.quotaManager.callsPerMinute = 0;
    this.quotaManager.lastReset = Date.now();
  }

  const timeSinceLastCall = now - this.quotaManager.lastCallTime;
  if (timeSinceLastCall < this.quotaManager.waitTime) {
    Utilities.sleep(this.quotaManager.waitTime - timeSinceLastCall);
  }

  this.quotaManager.callsPerMinute++;
  this.quotaManager.lastCallTime = Date.now();
}
```

## VALIDATION CRITERIA
1. EmailIngestionEngine has quota manager in constructor
2. _enforceQuotaLimit() method prevents exceeding 75 calls/minute
3. processUnreadEmails has retry logic with exponential backoff
4. Batch processing handles individual message failures gracefully
5. ZeroTrustTriageEngine has similar quota management

## EXPECTED OUTCOME
Gmail API operations will respect rate limits, automatically retry on failures, and prevent quota exhaustion.