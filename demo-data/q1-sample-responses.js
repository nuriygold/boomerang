/**
 * Sample Q1 Data Responses
 *
 * These represent the MESSY data that comes in from different teams
 * Notice how inconsistent the data is - this is the REAL problem Data Boomerang solves
 */

export const SAMPLE_RESPONSES = [
  {
    id: 'response-001',
    boomerangId: 'demo-q1-2026',
    submittedAt: '2026-03-15T09:30:00Z',
    team: 'Sales',
    source: 'spreadsheet',
    data: [
      {
        'Team Name': 'Sales',
        'Q1 Primary Metric': '$2,500,000', // Note: dollar sign, comma
        'Q1 Secondary Metric': '3.2', // churn %
        'Metric Period': '2026-Q1', // Different date format!
        'Confidence Score': '9',
        'Comments': 'Includes new enterprise deals signed in March',
      },
      {
        'Team Name': 'Sales',
        'Q1 Primary Metric': '2500000', // No formatting
        'Q1 Secondary Metric': '3.2',
        'Metric Period': '03/31/2026', // US format
        'Confidence Score': '9',
        'Comments': '',
      },
    ],
  },

  {
    id: 'response-002',
    boomerangId: 'demo-q1-2026',
    submittedAt: '2026-03-15T14:00:00Z',
    team: 'Marketing',
    source: 'csv',
    data: [
      {
        // Missing Team Name!
        'Primary': '1850', // Wrong field name
        'Secondary': '4.1',
        'Date': 'March 2026', // Natural language date
        'Confidence': '7',
        'Notes': 'Conservative estimate, campaigns still running',
      },
    ],
  },

  {
    id: 'response-003',
    boomerangId: 'demo-q1-2026',
    submittedAt: '2026-03-16T08:45:00Z',
    team: 'Engineering',
    source: 'email',
    data: [
      {
        'Team Name': 'Engineering',
        'Q1 Primary Metric': '847', // Deployments
        'Q1 Secondary Metric': '12', // Incidents
        'Metric Period': '2026-03-15', // Correct format!
        'Confidence Score': 10, // Integer not string
        'Comments': 'All systems nominal',
      },
    ],
  },

  {
    id: 'response-004',
    boomerangId: 'demo-q1-2026',
    submittedAt: '2026-03-16T11:20:00Z',
    team: 'Operations',
    source: 'screenshot_ocr', // Image that was OCR'd
    data: [
      {
        'Team Name': 'Ops',
        // Missing Q1 Primary Metric!
        'Q1 Secondary Metric': 'N/A', // Can't parse as number
        'Metric Period': '2026-03-31',
        'Confidence Score': '5',
        'Comments': 'System outage Jan 15-17 affected numbers',
      },
    ],
  },

  {
    id: 'response-005',
    boomerangId: 'demo-q1-2026',
    submittedAt: '2026-03-17T10:00:00Z',
    team: 'Finance',
    source: 'google_sheet',
    data: [
      {
        'Team Name': 'Finance / Accounting',
        'Q1 Primary Metric': '45.2M', // Mixed format
        'Q1 Secondary Metric': '1.8',
        'Metric Period': '2026-Q1-31', // Invalid format
        'Confidence Score': '8',
        'Comments':
          'Preliminary numbers, final audit underway. Includes 2M from one-time event',
      },
    ],
  },
];

/**
 * What the API returns to show the user
 * Real-time validation feedback for each submission
 */
export function getMockValidationFeedback() {
  return {
    totalSubmissions: 5,
    validSubmissions: 2,
    invalidSubmissions: 3,
    commonIssues: {
      'Q1 Primary Metric': {
        count: 3,
        issues: [
          'Missing in Operations submission',
          'Format inconsistency: "$2.5M" vs "2500000"',
          'Contains non-numeric characters in Finance submission',
        ],
      },
      'Metric Period': {
        count: 2,
        issues: [
          'Invalid format in Finance: "2026-Q1-31" (should be YYYY-MM-DD)',
          'Natural language in Marketing: "March 2026"',
        ],
      },
      'Q1 Secondary Metric': {
        count: 1,
        issues: ['Operations submitted "N/A" - must be numeric'],
      },
      'Team Name': {
        count: 1,
        issues: ['Marketing submission missing Team Name entirely'],
      },
    },
  };
}

/**
 * Expected cleaned output after validation
 */
export const EXPECTED_CLEANED_DATA = [
  {
    'Team Name': 'Sales',
    'Q1 Primary Metric': 2500000,
    'Q1 Secondary Metric': 3.2,
    'Metric Period': '2026-03-31',
    'Confidence Score': 9,
    'Comments': 'Includes new enterprise deals signed in March',
  },
  {
    'Team Name': 'Engineering',
    'Q1 Primary Metric': 847,
    'Q1 Secondary Metric': 12,
    'Metric Period': '2026-03-15',
    'Confidence Score': 10,
    'Comments': 'All systems nominal',
  },
];
