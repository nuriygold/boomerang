/**
 * Boomerang Schema Definition
 *
 * This is what a boomerang owner defines before sending it out
 * It specifies: what data is needed, in what format, and what's required
 */

export const Q1_EXECUTIVE_BRIEFING_SCHEMA = {
  id: 'q1-exec-briefing-2026',
  name: 'Q1 Executive Board Briefing Data',
  description: 'Quarterly performance metrics from all departments for board meeting',
  owner: 'analytics@company.com',
  createdAt: new Date().toISOString(),

  requiredFields: [
    {
      name: 'Team Name',
      type: 'string',
      description: 'Name of the contributing team (e.g., Sales, Marketing, Engineering)',
      rules: {
        minLength: 2,
        maxLength: 50,
      },
      examples: ['Sales', 'Marketing', 'Engineering', 'Operations'],
    },
    {
      name: 'Q1 Primary Metric',
      type: 'number',
      description: 'Primary KPI for this quarter (revenue, leads, deployments, etc.)',
      rules: {
        min: 0,
        max: 999999999,
      },
      examples: ['$2.5M', '1500', '450'],
    },
    {
      name: 'Q1 Secondary Metric',
      type: 'number',
      description: 'Secondary KPI (churn %, velocity, incidents, etc.)',
      rules: {
        min: 0,
        max: 100,
      },
      examples: ['2.3', '85', '12'],
    },
    {
      name: 'Metric Period',
      type: 'date',
      description: 'The date this metric is from',
      rules: {
        minDate: '2026-01-01',
        maxDate: '2026-03-31',
      },
      examples: ['2026-03-15', '2026-Q1'],
    },
    {
      name: 'Confidence Score',
      type: 'integer',
      description:
        'How confident are you in this data? (1-10, where 10 is very confident)',
      rules: {
        min: 1,
        max: 10,
      },
      examples: ['8', '10', '7'],
    },
    {
      name: 'Comments',
      type: 'string',
      description: 'Any context or caveats about this data (optional)',
      rules: {
        maxLength: 500,
        optional: true,
      },
      examples: ['Excludes one region due to system outage', 'Conservative estimate'],
    },
  ],

  // What the boomerang owner sees after all data is collected
  outputFormat: {
    csv: true,
    json: true,
    tableau: true, // Can auto-sync to Tableau
  },

  // Where to send validated data
  destinations: [
    {
      service: 'tableau',
      scope: 'write:boomerang-data',
      autoSync: true,
    },
    {
      service: 'slack',
      scope: 'chat:write',
      notification: 'Data collection complete! Ready for review.',
    },
  ],
};

/**
 * Helper to create a boomerang with a given schema
 */
export function createBoomerang(schemaTemplate, overrides = {}) {
  const boomerang = {
    ...schemaTemplate,
    id: overrides.id || `boomerang-${Date.now()}`,
    createdAt: new Date().toISOString(),
    status: 'active',
    responses: [],
    validatedData: [],
    ...overrides,
  };

  return boomerang;
}

/**
 * Sample boomerangs for demo
 */
export const DEMO_BOOMERANGS = {
  q1Briefing: {
    ...Q1_EXECUTIVE_BRIEFING_SCHEMA,
    id: 'demo-q1-2026',
    createdAt: '2026-03-01T10:00:00Z',
    owner: 'director@company.com',
    status: 'collecting',
    responses: [
      // Will be populated by demo data
    ],
  },
};
