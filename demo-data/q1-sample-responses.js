/**
 * Sample responses for the Q1 Executive Briefing boomerang demo.
 * Used by /api/demo/load-sample-data to pre-populate the dashboard.
 */

export const SAMPLE_RESPONSES = [
  {
    team: 'Sales',
    source: 'csv',
    submittedAt: '2026-03-28T09:15:00Z',
    data: [
      { department: 'Sales', quarter: 'Q1 2026', revenue: '$2,500,000', headcount: 42, region: 'Southeast' },
      { department: 'Sales', quarter: 'Q1 2026', revenue: '$1,875,000', headcount: 38, region: 'Northeast' },
      { department: 'Sales', quarter: 'Q1 2026', revenue: '$3,100,000', headcount: 51, region: 'West' },
    ],
  },
  {
    team: 'Marketing',
    source: 'xlsx',
    submittedAt: '2026-03-29T11:30:00Z',
    data: [
      { department: 'Marketing', quarter: '2026-Q1', revenue: '$420,000', headcount: 18, region: 'National' },
      { department: 'Marketing', quarter: '2026-Q1', revenue: '$385,000', headcount: '17', region: 'National' },
    ],
  },
  {
    team: 'Engineering',
    source: 'csv',
    submittedAt: '2026-03-29T14:00:00Z',
    data: [
      { department: 'Engineering', quarter: 'Jan-Mar 2026', revenue: null, headcount: 94, region: 'Remote' },
      { department: 'Engineering', quarter: 'Jan-Mar 2026', revenue: null, headcount: 87, region: 'Remote' },
      { department: 'Engineering', quarter: 'Jan-Mar 2026', revenue: null, headcount: 102, region: 'Atlanta' },
    ],
  },
  {
    team: 'Finance',
    source: 'xlsx',
    submittedAt: '2026-03-30T08:45:00Z',
    data: [
      { department: 'Finance', quarter: 'Q1', revenue: '$950,000', headcount: 12, region: 'HQ' },
      { department: 'Finance', quarter: 'Q1', revenue: '$1,020,000', headcount: 14, region: 'HQ' },
    ],
  },
  {
    team: 'Operations',
    source: 'csv',
    submittedAt: '2026-03-31T16:20:00Z',
    data: [
      { department: 'Operations', quarter: 'Q1 2026', revenue: '780000', headcount: 29, region: 'Southeast' },
      { department: 'Operations', quarter: 'Q1 2026', revenue: '3.2%', headcount: 31, region: 'Southeast' },
    ],
  },
];

export function getMockValidationFeedback() {
  return {
    totalSubmissions: SAMPLE_RESPONSES.length,
    teams: SAMPLE_RESPONSES.map((r) => r.team),
    note: 'Sample data includes intentional formatting issues (dollar signs, quarter strings, percentage values) to demonstrate auto-correction.',
  };
}
