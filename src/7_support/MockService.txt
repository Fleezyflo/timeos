/**
 * MOH TIME OS v2.0 - MOCK SERVICE
 *
 * Mock data generation service for testing scenarios.
 * Creates realistic test data for actions, calendar events, and proposals.
 * Provides scenario-based mock data for comprehensive testing coverage.
 *
 * Original lines: 11427-11681 from scriptA.js
 */

class MockService {
  constructor() {
    this.actionIdCounter = 1;
    this.proposalIdCounter = 1;
    this.eventIdCounter = 1;
  }

  /**
   * Create a mock MohTask with realistic default values
   * @param {Object} overrides - Properties to override default values
   * @returns {MohTask} Mock action object
   */
  createMockAction(overrides = {}) {
    const baseAction = {
      action_id: `MOCK_ACTION_${this.actionIdCounter++}`,
      status: STATUS.PENDING,
      priority: PRIORITY.MEDIUM,
      created_at: TimeZoneAwareDate.toISOString(new Date()),
      updated_at: TimeZoneAwareDate.toISOString(new Date()),
      title: 'Mock Action Title',
      lane: 'ops',
      context: 'admin',
      estimated_minutes: 30,
      deadline: null,
      scheduled_start: null,
      scheduled_end: null,
      calendar_event_id: null,
      source: 'test',
      source_id: null,
      notes: ''
    };

    return new MohTask({ ...baseAction, ...overrides });
  }

  /**
   * Create multiple mock actions for various test scenarios
   * @param {string} scenario - Scenario type ('basic', 'urgent', 'large_backlog', 'mixed')
   * @returns {MohTask[]} Array of mock actions
   */
  createMockActionsForScenario(scenario) {
    switch (scenario) {
    case 'urgent':
      return [
        this.createMockAction({
          title: 'Critical bug fix',
          priority: PRIORITY.HIGH,
          deadline: TimeZoneAwareDate.toISOString(new Date(Date.now() + 2 * 60 * 60 * 1000)), // 2 hours
          estimated_minutes: 90,
          context: 'deep_work'
        }),
        this.createMockAction({
          title: 'Client presentation prep',
          priority: PRIORITY.HIGH,
          deadline: TimeZoneAwareDate.toISOString(new Date(Date.now() + 24 * 60 * 60 * 1000)), // 1 day
          estimated_minutes: 60,
          lane: 'client'
        })
      ];

    case 'large_backlog': {
      const actions = [];
      for (let i = 0; i < 50; i++) {
        actions.push(this.createMockAction({
          title: `Backlog item ${i + 1}`,
          priority: [PRIORITY.HIGH, PRIORITY.MEDIUM, PRIORITY.LOW][i % 3],
          estimated_minutes: 15 + (i % 4) * 15, // 15, 30, 45, or 60 minutes
          lane: ['ops', 'client', 'growth', LANE.ADMIN][i % 4]
        }));
      }
      return actions;
    }

    case 'mixed':
      return [
        this.createMockAction({
          title: 'Daily standup',
          priority: PRIORITY.MEDIUM,
          estimated_minutes: 15,
          context: 'communication'
        }),
        this.createMockAction({
          title: 'Code review',
          priority: PRIORITY.HIGH,
          estimated_minutes: 45,
          context: 'deep_work',
          deadline: TimeZoneAwareDate.toISOString(new Date(Date.now() + 6 * 60 * 60 * 1000)) // 6 hours
        }),
        this.createMockAction({
          title: 'Expense report',
          priority: PRIORITY.LOW,
          estimated_minutes: 20,
          context: 'admin',
          lane: LANE.ADMIN
        })
      ];

    case 'basic':
    default:
      return [
        this.createMockAction(),
        this.createMockAction({
          title: 'Second mock action',
          priority: PRIORITY.HIGH,
          estimated_minutes: 60
        })
      ];
    }
  }

  /**
   * Create mock calendar events for testing calendar integration
   * @param {number} count - Number of events to create
   * @returns {Object[]} Array of mock calendar event objects
   */
  createMockCalendarEvents(count = 5) {
    const events = [];
    const now = new Date();

    for (let i = 0; i < count; i++) {
      const startTime = new Date(now.getTime() + (i * 2 + 1) * 60 * 60 * 1000); // Every 2 hours, offset by 1
      const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hour duration

      events.push({
        event_id: `MOCK_EVENT_${this.eventIdCounter++}`,
        start_time: TimeZoneAwareDate.toISOString(startTime),
        end_time: TimeZoneAwareDate.toISOString(endTime),
        duration_minutes: 60,
        title: `Mock Calendar Event ${i + 1}`,
        is_all_day: false,
        source_calendar_id: 'primary'
      });
    }

    return events;
  }

  /**
   * Create mock proposed tasks for testing email ingestion
   * @param {number} count - Number of proposals to create
   * @returns {Object[]} Array of mock proposed task objects
   */
  createMockProposedTasks(count = 3) {
    const proposals = [];

    for (let i = 0; i < count; i++) {
      proposals.push({
        proposal_id: `MOCK_PROPOSAL_${this.proposalIdCounter++}`,
        status: 'PENDING_REVIEW',
        created_at: TimeZoneAwareDate.toISOString(new Date()),
        processed_at: null,
        source: 'gmail',
        source_id: `mock_email_${i + 1}`,
        sender: `test${i + 1}@example.com`,
        subject: `Mock Email Subject ${i + 1}`,
        parsed_title: `Proposed Task ${i + 1}`,
        suggested_lane: ['ops', 'client', LANE.ADMIN][i % 3],
        confidence_score: 0.7 + (i * 0.1),
        raw_content_preview: `This is mock email content for proposal ${i + 1}`
      });
    }

    return proposals;
  }

  /**
   * Create mock time blocks for scheduling tests
   * @param {string} scenario - Time block scenario ('work_hours', 'fragmented', 'busy')
   * @returns {Object[]} Array of mock time block objects
   */
  createMockTimeBlocks(scenario = 'work_hours') {
    const now = new Date();
    const startOfTomorrow = new Date(now);
    startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);
    startOfTomorrow.setHours(9, 0, 0, 0); // 9 AM tomorrow

    switch (scenario) {
    case 'fragmented':
      return [
        {
          block_id: 'MOCK_BLOCK_1',
          date: startOfTomorrow.toDateString(),
          start_time: TimeZoneAwareDate.toISOString(new Date(startOfTomorrow.getTime())),
          end_time: TimeZoneAwareDate.toISOString(new Date(startOfTomorrow.getTime() + 45 * 60 * 1000)), // 45 min
          block_type: 'WORK',
          context: 'deep_work',
          energy_level: PRIORITY.HIGH,
          associated_action_id: null
        },
        {
          block_id: 'MOCK_BLOCK_2',
          date: startOfTomorrow.toDateString(),
          start_time: TimeZoneAwareDate.toISOString(new Date(startOfTomorrow.getTime() + 2 * 60 * 60 * 1000)), // 2h later
          end_time: TimeZoneAwareDate.toISOString(new Date(startOfTomorrow.getTime() + 2.5 * 60 * 60 * 1000)), // 30 min
          block_type: 'ADMIN',
          context: 'admin',
          energy_level: 'LOW',
          associated_action_id: null
        }
      ];

    case 'busy': {
      // Create many small blocks with little free time
      const busyBlocks = [];
      for (let i = 0; i < 8; i++) {
        busyBlocks.push({
          block_id: `MOCK_BUSY_${i + 1}`,
          date: startOfTomorrow.toDateString(),
          start_time: TimeZoneAwareDate.toISOString(new Date(startOfTomorrow.getTime() + i * 60 * 60 * 1000)),
          end_time: TimeZoneAwareDate.toISOString(new Date(startOfTomorrow.getTime() + (i + 0.5) * 60 * 60 * 1000)), // 30 min blocks
          block_type: 'MEETING',
          context: 'communication',
          energy_level: 'MEDIUM',
          associated_action_id: null
        });
      }
      return busyBlocks;
    }

    case 'work_hours':
    default:
      return [
        {
          block_id: 'MOCK_MORNING_BLOCK',
          date: startOfTomorrow.toDateString(),
          start_time: TimeZoneAwareDate.toISOString(new Date(startOfTomorrow.getTime())),
          end_time: TimeZoneAwareDate.toISOString(new Date(startOfTomorrow.getTime() + 3 * 60 * 60 * 1000)), // 3 hours
          block_type: 'DEEP_WORK',
          context: 'deep_work',
          energy_level: PRIORITY.HIGH,
          associated_action_id: null
        },
        {
          block_id: 'MOCK_AFTERNOON_BLOCK',
          date: startOfTomorrow.toDateString(),
          start_time: TimeZoneAwareDate.toISOString(new Date(startOfTomorrow.getTime() + 5 * 60 * 60 * 1000)), // 5h later (after lunch)
          end_time: TimeZoneAwareDate.toISOString(new Date(startOfTomorrow.getTime() + 7 * 60 * 60 * 1000)), // 2 hours
          block_type: 'WORK',
          context: 'admin',
          energy_level: 'MEDIUM',
          associated_action_id: null
        }
      ];
    }
  }

  /**
   * Reset all counters for fresh test runs
   */
  reset() {
    this.actionIdCounter = 1;
    this.proposalIdCounter = 1;
    this.eventIdCounter = 1;
  }
}