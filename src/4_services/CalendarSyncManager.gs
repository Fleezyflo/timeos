/**
 * MOH TIME OS v2.0 - CALENDAR SYNC MANAGER
 *
 * Manages synchronization between tasks and Google Calendar.
 * Provides calendar projection and real-time sync capabilities.
 * Handles calendar event creation, updates, and conflict resolution.
 *
 * Original lines: 4906-4948 from scriptA.js
 */

class CalendarSyncManager {
  constructor(batchOperations, configManager, errorHandler, logger) {
    if (!batchOperations) {
      throw new Error('CalendarSyncManager: batchOperations is required');
    }
    this.batchOperations = batchOperations;
    this.configManager = configManager;
    this.errorHandler = errorHandler;
    this.logger = logger || console;
  }

  /**
   * Prepare sync operations for scheduled actions
   * @param {Array} actions - Array of scheduled actions
   * @returns {Object} Sync operations and scheduled actions
   */
  prepareSyncOperations(actions = []) {
    try {
      const operations = [];
      const syncableActions = actions.filter(action =>
        action.scheduled_start &&
        action.scheduled_end &&
        action.status !== STATUS.CANCELED
      );

      for (const action of syncableActions) {
        // Check if calendar event already exists
        if (action.calendar_event_id) {
          // Update existing event
          operations.push({
            type: 'UPDATE',
            action: action,
            eventId: action.calendar_event_id
          });
        } else {
          // Create new event
          operations.push({
            type: 'CREATE',
            action: action
          });
        }
      }

      this.logger.debug('CalendarSyncManager', `Prepared ${operations.length} sync operations`, {
        total_actions: actions.length,
        syncable_actions: syncableActions.length,
        create_ops: operations.filter(op => op.type === 'CREATE').length,
        update_ops: operations.filter(op => op.type === 'UPDATE').length
      });

      return {
        operations: operations,
        scheduledActions: syncableActions
      };

    } catch (error) {
      // OBJ_SENTINEL_NULL_RETHROW_FATAL profile
      // TEST: TEST_SILENT_086_PREPARECALENDARSYNCOPERATIONS
      LoggerFacade.error('CalendarSyncManager', 'Failed to prepare sync operations', {
        error: error.message,
        stack: error.stack,
        context: 'prepareSyncOperations'
      });

      if (error.name === 'DatabaseError' || error.name === 'ConfigurationError') {
        throw error;
      }

      return {
        operations: [],
        scheduledActions: []
      };
    }
  }

  /**
   * Refresh calendar projection data
   * @param {number} daysAhead - Number of days to project ahead
   * @returns {number} Number of events processed
   */
  refreshCalendarProjection(daysAhead = 7) {
    try {
      this.logger.info('CalendarSyncManager', `Refreshing calendar projection for ${daysAhead} days`);

      const headers = this.batchOperations.getHeaders(SHEET_NAMES.CALENDAR_PROJECTION);
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + daysAhead);

      // Get calendar events from Google Calendar
      const calendarEvents = this._getCalendarEvents(startDate, endDate);

      // Convert events to projection format
      const projectionData = [headers, ...calendarEvents.map(event => this._eventToProjectionRow(event, headers))];

      // Perform atomic update
      this.batchOperations.performAtomicSwapOrFallback(
        SHEET_NAMES.CALENDAR_PROJECTION,
        projectionData,
        this.configManager,
        this.logger
      );

      this.logger.info('CalendarSyncManager', `Calendar projection refreshed`, {
        events_processed: calendarEvents.length,
        days_ahead: daysAhead,
        date_range: `${this._formatDate(startDate)} to ${this._formatDate(endDate)}`
      });

      return Math.max(projectionData.length - 1, 0);

    } catch (error) {
      this.logger.error('CalendarSyncManager', 'refreshCalendarProjection failed', {
        error: error.message,
        days_ahead: daysAhead
      });
      throw error;
    }
  }

  /**
   * Get calendar events from Google Calendar
   * @param {Date} startDate - Start date for events
   * @param {Date} endDate - End date for events
   * @returns {Array} Array of calendar events
   * @private
   */
  _getCalendarEvents(startDate, endDate) {
    try {
      const calendar = CalendarApp.getDefaultCalendar();
      const events = calendar.getEvents(startDate, endDate);

      return events.map(event => ({
        id: event.getId(),
        title: event.getTitle(),
        description: event.getDescription() || '',
        start: event.getStartTime(),
        end: event.getEndTime(),
        location: event.getLocation() || '',
        isAllDay: event.isAllDayEvent(),
        attendees: event.getGuestList().map(guest => guest.getEmail()).join(', '),
        creator: event.getCreators().join(', '),
        busy: true, // Assume all events make you busy unless specified
        visibility: this._getEventVisibility(event),
        source: 'google_calendar'
      }));

    } catch (error) {
      this.logger.warn('CalendarSyncManager', `Failed to fetch calendar events: ${error.message}`);
      return [];
    }
  }

  /**
   * Convert calendar event to projection row
   * @param {Object} event - Calendar event object
   * @param {Array} headers - Sheet headers
   * @returns {Array} Row data for sheet
   * @private
   */
  _eventToProjectionRow(event, headers) {
    const row = new Array(headers.length).fill('');

    const metadata = {
      location: event.location,
      isAllDay: event.isAllDay,
      attendees: event.attendees,
      creator: event.creator,
      visibility: event.visibility,
      source: event.source
    };

    const description = event.description + '\n\n--- METADATA ---\n' + JSON.stringify(metadata, null, 2);

    const mapping = {
      'event_id': event.id || '',
      'start': event.start ? TimeZoneAwareDate.toISOString(event.start) : '',
      'end': event.end ? TimeZoneAwareDate.toISOString(event.end) : '',
      'type': this._categorizeEvent(event),
      'busy': event.busy ? 'true' : 'false',
      'title': event.title || '',
      'description': description
    };

    headers.forEach((header, index) => {
      if (mapping.hasOwnProperty(header)) {
        row[index] = mapping[header];
      }
    });

    return row;
  }

  /**
   * Categorize event type based on title and properties
   * @param {Object} event - Calendar event
   * @returns {string} Event type
   * @private
   */
  _categorizeEvent(event) {
    const title = (event.title || '').toLowerCase();

    if (title.includes('meeting') || title.includes('call') || event.attendees.length > 1) {
      return 'meeting';
    }

    if (title.includes('block') || title.includes('focus') || title.includes('work')) {
      return 'work_block';
    }

    if (title.includes('break') || title.includes('lunch') || title.includes('personal')) {
      return 'break';
    }

    if (title.includes('travel') || title.includes('commute')) {
      return 'travel';
    }

    return 'general';
  }

  /**
   * Get event visibility level
   * @param {Object} event - Calendar event
   * @returns {string} Visibility level
   * @private
   */
  _getEventVisibility(event) {
    try {
      const visibility = event.getVisibility();
      return visibility ? visibility.toString() : 'default';
    } catch (error) {
      return 'default';
    }
  }

  /**
   * Sync actions to Google Calendar
   * @param {Array} actions - Actions to sync
   * @returns {number} Number of actions synced
   */
  syncActionsToCalendar(actions = []) {
    try {
      if (!this.configManager.getBoolean('ENABLE_CALENDAR_SYNC', false)) {
        this.logger.debug('CalendarSyncManager', 'Calendar sync disabled');
        return 0;
      }

      const syncOperations = this.prepareSyncOperations(actions);
      let syncedCount = 0;

      for (const operation of syncOperations.operations) {
        try {
          if (operation.type === 'CREATE') {
            const eventId = this._createCalendarEvent(operation.action);
            if (eventId) {
              // Update action with calendar event ID
              this._updateActionCalendarId(operation.action.action_id, eventId);
              syncedCount++;
            }
          } else if (operation.type === 'UPDATE') {
            const success = this._updateCalendarEvent(operation.eventId, operation.action);
            if (success) {
              syncedCount++;
            }
          }
        } catch (operationError) {
          this.logger.warn('CalendarSyncManager', `Sync operation failed: ${operationError.message}`, {
            operation_type: operation.type,
            action_id: operation.action.action_id
          });
        }
      }

      this.logger.info('CalendarSyncManager', `Calendar sync completed`, {
        total_operations: syncOperations.operations.length,
        synced_count: syncedCount,
        success_rate: syncOperations.operations.length > 0 ?
          Math.round((syncedCount / syncOperations.operations.length) * 100) + '%' : '0%'
      });

      return syncedCount;

    } catch (error) {
      this.logger.error('CalendarSyncManager', `Calendar sync failed: ${error.message}`);
      return 0;
    }
  }

  /**
   * Create calendar event for action
   * @param {Object} action - Action to create event for
   * @returns {string|null} Event ID if successful
   * @private
   */
  _createCalendarEvent(action) {
    try {
      const calendar = CalendarApp.getDefaultCalendar();
      const startTime = new Date(action.scheduled_start);
      const endTime = new Date(action.scheduled_end);

      const event = calendar.createEvent(
        action.title,
        startTime,
        endTime,
        {
          description: this._buildEventDescription(action),
          location: action.location || ''
        }
      );

      this.logger.debug('CalendarSyncManager', `Created calendar event: ${action.title}`, {
        action_id: action.action_id,
        event_id: event.getId()
      });

      return event.getId();

    } catch (error) {
      this.logger.error('CalendarSyncManager', `Failed to create calendar event: ${error.message}`, {
        action_id: action.action_id,
        title: action.title
      });
      return null;
    }
  }

  /**
   * Update existing calendar event
   * @param {string} eventId - Calendar event ID
   * @param {Object} action - Updated action data
   * @returns {boolean} Success status
   * @private
   */
  _updateCalendarEvent(eventId, action) {
    try {
      const calendar = CalendarApp.getDefaultCalendar();
      const event = calendar.getEventById(eventId);

      if (!event) {
        this.logger.warn('CalendarSyncManager', `Calendar event not found: ${eventId}`);
        return false;
      }

      // Update event properties
      event.setTitle(action.title);
      event.setTime(new Date(action.scheduled_start), new Date(action.scheduled_end));
      event.setDescription(this._buildEventDescription(action));

      if (action.location) {
        event.setLocation(action.location);
      }

      this.logger.debug('CalendarSyncManager', `Updated calendar event: ${action.title}`, {
        action_id: action.action_id,
        event_id: eventId
      });

      return true;

    } catch (error) {
      this.logger.error('CalendarSyncManager', `Failed to update calendar event: ${error.message}`, {
        action_id: action.action_id,
        event_id: eventId
      });
      return false;
    }
  }

  /**
   * Build event description from action data
   * @param {Object} action - Action object
   * @returns {string} Event description
   * @private
   */
  _buildEventDescription(action) {
    const parts = [];

    if (action.description) {
      parts.push(action.description);
    }

    if (action.context) {
      parts.push(`Context: ${action.context}`);
    }

    if (action.lane) {
      parts.push(`Lane: ${action.lane}`);
    }

    if (action.priority) {
      parts.push(`Priority: ${action.priority}`);
    }

    if (action.estimated_minutes) {
      parts.push(`Estimated: ${action.estimated_minutes} minutes`);
    }

    parts.push(`MOH Time OS Task ID: ${action.action_id}`);

    return parts.join('\n\n');
  }

  /**
   * Update action with calendar event ID
   * @param {string} actionId - Action ID
   * @param {string} eventId - Calendar event ID
   * @private
   */
  _updateActionCalendarId(actionId, eventId) {
    try {
      // Find and update the action in the ACTIONS sheet
      const headers = this.batchOperations.getHeaders(SHEET_NAMES.ACTIONS);
      const rows = this.batchOperations.getRowsWithPosition(SHEET_NAMES.ACTIONS, {
        action_id: actionId
      });

      if (rows.length > 0) {
        const row = rows[0];
        const calendarEventIdIndex = headers.indexOf('calendar_event_id');

        if (calendarEventIdIndex !== -1) {
          row.data[calendarEventIdIndex] = eventId;

          this.batchOperations.batchUpdate(SHEET_NAMES.ACTIONS, [{
            range: `A${row.sheetRow}:${String.fromCharCode(65 + headers.length - 1)}${row.sheetRow}`,
            values: [row.data]
          }]);

          this.logger.debug('CalendarSyncManager', `Updated action with calendar event ID`, {
            action_id: actionId,
            event_id: eventId
          });
        }
      }

    } catch (error) {
      this.logger.error('CalendarSyncManager', `Failed to update action calendar ID: ${error.message}`, {
        action_id: actionId,
        event_id: eventId
      });
    }
  }

  /**
   * Check for calendar conflicts
   * @param {Date} startTime - Proposed start time
   * @param {Date} endTime - Proposed end time
   * @returns {Array} Array of conflicting events
   */
  checkCalendarConflicts(startTime, endTime) {
    try {
      const calendar = CalendarApp.getDefaultCalendar();
      const conflicts = calendar.getEvents(startTime, endTime);

      return conflicts.map(event => ({
        id: event.getId(),
        title: event.getTitle(),
        start: event.getStartTime(),
        end: event.getEndTime(),
        isAllDay: event.isAllDayEvent()
      }));

    } catch (error) {
      this.logger.error('CalendarSyncManager', `Failed to check conflicts: ${error.message}`);
      return [];
    }
  }

  /**
   * Find free time slots in calendar
   * @param {Date} startDate - Start of search range
   * @param {Date} endDate - End of search range
   * @param {number} durationMinutes - Required duration
   * @returns {Array} Array of free time slots
   */
  findFreeTimeSlots(startDate, endDate, durationMinutes) {
    try {
      const calendar = CalendarApp.getDefaultCalendar();
      const busyEvents = calendar.getEvents(startDate, endDate);

      // Create time slots (15-minute intervals)
      const freeSlots = [];
      const intervalMinutes = 15;
      const requiredSlots = Math.ceil(durationMinutes / intervalMinutes);

      let currentTime = new Date(startDate);
      while (currentTime < endDate) {
        const slotEnd = new Date(currentTime.getTime() + (durationMinutes * 60000));

        if (slotEnd <= endDate) {
          // Check if this slot conflicts with any busy events
          const hasConflict = busyEvents.some(event => {
            return !(slotEnd <= event.getStartTime() || currentTime >= event.getEndTime());
          });

          if (!hasConflict) {
            freeSlots.push({
              start: new Date(currentTime),
              end: new Date(slotEnd),
              duration: durationMinutes
            });
          }
        }

        currentTime.setMinutes(currentTime.getMinutes() + intervalMinutes);
      }

      return freeSlots;

    } catch (error) {
      this.logger.error('CalendarSyncManager', `Failed to find free time slots: ${error.message}`);
      return [];
    }
  }

  /**
   * Format date for display
   * @param {Date} date - Date to format
   * @returns {string} Formatted date string
   * @private
   */
  _formatDate(date) {
    return TimeZoneAwareDate.toISOString(date).split('T')[0];
  }

  /**
   * Self-test calendar sync manager
   * @returns {boolean} True if all tests pass
   */
  selfTest() {
    try {
      this.logger.info('CalendarSyncManager', 'Running self-test');

      // Test 1: Check calendar access
      const calendar = CalendarApp.getDefaultCalendar();
      if (!calendar) {
        throw new Error('Cannot access default calendar');
      }

      // Test 2: Test projection refresh (with small range)
      const eventsProcessed = this.refreshCalendarProjection(1);
      if (typeof eventsProcessed !== 'number') {
        throw new Error('refreshCalendarProjection should return number');
      }

      // Test 3: Test sync operations preparation
      const testActions = [{
        action_id: 'test_action',
        title: 'Test Action',
        scheduled_start: TimeZoneAwareDate.now(),
        scheduled_end: new Date(Date.now() + 3600000).toISOString(),
        status: STATUS.SCHEDULED
      }];

      const syncOps = this.prepareSyncOperations(testActions);
      if (!syncOps.operations || !Array.isArray(syncOps.operations)) {
        throw new Error('prepareSyncOperations should return operations array');
      }

      // Test 4: Test conflict checking
      const now = new Date();
      const oneHourLater = new Date(now.getTime() + 3600000);
      const conflicts = this.checkCalendarConflicts(now, oneHourLater);
      if (!Array.isArray(conflicts)) {
        throw new Error('checkCalendarConflicts should return array');
      }

      this.logger.info('CalendarSyncManager', 'Self-test passed', {
        events_processed: eventsProcessed,
        calendar_accessible: true,
        sync_ops_prepared: syncOps.operations.length,
        conflicts_checked: conflicts.length
      });

      return true;

    } catch (error) {
      this.logger.error('CalendarSyncManager', `Self-test failed: ${error.message}`);
      return false;
    }
  }
}
