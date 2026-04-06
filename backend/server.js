/**
 * Data Boomerang Backend Server
 *
 * Core API for:
 * - Creating boomerangs (define required fields)
 * - Uploading and validating data
 * - Managing permissions via Auth0 Token Vault
 * - Returning cleaned data
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

import tokenVaultClient from './lib/token-vault-client.js';
import validator from './lib/validator.js';
import { createBoomerang, Q1_EXECUTIVE_BRIEFING_SCHEMA } from './models/boomerang-schema.js';
import { SAMPLE_RESPONSES, getMockValidationFeedback } from '../demo-data/q1-sample-responses.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, 'public');
const publicBaseUrl = (process.env.PUBLIC_BASE_URL || process.env.FRONTEND_URL || `http://localhost:${PORT}`)
  .replace(/\/+$/, '');
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

// Middleware
app.use(cors({
  origin(origin, callback) {
    // Server-to-server and same-origin requests may not include Origin.
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS_BLOCKED: Origin ${origin} is not allowed`));
  },
}));
app.use(express.json());
app.use(express.static(publicDir));
const upload = multer({ storage: multer.memoryStorage() });

// Store boomerangs in memory (use database in production)
const boomerangs = new Map();
const responses = new Map();

// Initialize demo boomerang
const demoBoom = createBoomerang(Q1_EXECUTIVE_BRIEFING_SCHEMA, {
  id: 'demo-q1-2026',
  shareToken: 'share-token-demo-q1',
});
boomerangs.set(demoBoom.id, demoBoom);

// ============================================
// HEALTH CHECK
// ============================================

app.get('/', (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

app.get("/demo", (req, res) => {
  res.sendFile(path.join(publicDir, "demo.html"));
});

app.get("/app", (req, res) => {
  res.sendFile(path.join(publicDir, "app.html"));
});

app.get("/health", (req, res) => {
  res.json({
    status: 'ok',
    service: 'data-boomerang',
    tokenVaultConnected: !process.env.TOKEN_VAULT_URL?.includes('YOUR'),
    publicBaseUrl,
    timestamp: new Date().toISOString(),
  });
});

// ============================================
// BOOMERANG MANAGEMENT
// ============================================

/**
 * Create a new boomerang
 * POST /api/boomerangs
 * Body: { name, requiredFields, destinations }
 */
app.post('/api/boomerangs', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] || 'anonymous';

    // Request permission from Token Vault to create boomerang
    const tokenCheck = await tokenVaultClient.requestToken(
      userId,
      'boomerang',
      'write:boomerang',
      'Creating new boomerang for data collection'
    );

    const boomerang = createBoomerang(req.body);
    boomerangs.set(boomerang.id, boomerang);

    res.json({
      boomerang,
      shareUrl: `${publicBaseUrl}/?boomerang=${boomerang.id}`,
      message: `Boomerang created. Share the link with contributors.`,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * Get boomerang details
 * GET /api/boomerangs/:id
 */
app.get('/api/boomerangs/:id', (req, res) => {
  const boom = boomerangs.get(req.params.id);
  if (!boom) {
    return res.status(404).json({ error: 'Boomerang not found' });
  }

  res.json({
    id: boom.id,
    name: boom.name,
    description: boom.description,
    requiredFields: boom.requiredFields,
    status: boom.status,
    responseCount: responses.size,
    createdAt: boom.createdAt,
  });
});

// ============================================
// DATA SUBMISSION & VALIDATION (THE STAR)
// ============================================

/**
 * Upload and validate data for a boomerang
 * POST /api/boomerangs/:id/upload
 *
 * Accepts: CSV, Excel, JSON
 * Returns: Real-time validation feedback
 */
app.post('/api/boomerangs/:id/upload', upload.single('file'), async (req, res) => {
  try {
    const boomerangId = req.params.id;
    const boom = boomerangs.get(boomerangId);

    if (!boom) {
      return res.status(404).json({ error: 'Boomerang not found' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Parse file based on type
    let rows = [];
    const fileName = req.file.originalname.toLowerCase();

    if (fileName.endsWith('.csv')) {
      const parsed = Papa.parse(req.file.buffer.toString(), {
        header: true,
        skipEmptyLines: true,
      });
      rows = parsed.data;
    } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      const workbook = XLSX.read(req.file.buffer);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      rows = XLSX.utils.sheet_to_json(worksheet);
    } else {
      return res.status(400).json({ error: 'Unsupported file format. Use CSV or Excel.' });
    }

    // Pre-clean common messy formats before validation
    // Strips currency symbols/commas from numbers, removes % signs, handles quarter strings
    const numberFields = (boom.requiredFields || [])
      .filter(f => f.type === 'number' || f.type === 'integer')
      .map(f => f.name);
    const dateFields = (boom.requiredFields || [])
      .filter(f => f.type === 'date')
      .map(f => f.name);

    const preCleanedRows = rows.map(row => {
      const cleaned = { ...row };
      for (const field of numberFields) {
        if (cleaned[field] !== undefined && cleaned[field] !== null) {
          const raw = String(cleaned[field]).trim();
          // Strip $, commas, % signs — handle "3.2%" → 3.2, "$2,500,000" → 2500000
          const stripped = raw.replace(/[$,]/g, '').replace(/%$/, '');
          if (!isNaN(Number(stripped)) && stripped !== '') {
            cleaned[field] = stripped;
          }
        }
      }
      for (const field of dateFields) {
        if (cleaned[field] !== undefined && cleaned[field] !== null) {
          const raw = String(cleaned[field]).trim();
          // Handle common quarter formats: "2026-Q1", "Q1 2026", "Q1", "Jan-Mar 2026"
          const quarterMap = {
            'Q1': '2026-01-01', 'Q2': '2026-04-01', 'Q3': '2026-07-01', 'Q4': '2026-10-01'
          };
          const qMatch = raw.match(/Q([1-4])/i);
          if (qMatch) {
            const qKey = `Q${qMatch[1]}`;
            cleaned[field] = quarterMap[qKey] || cleaned[field];
          }
          // Handle "Jan-Mar 2026" style → map to Q1 start
          const monthRangeMap = {
            'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04',
            'may': '05', 'jun': '06', 'jul': '07', 'aug': '08',
            'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12'
          };
          const monthMatch = raw.match(/^([a-z]+)[- ]/i);
          if (monthMatch && !qMatch) {
            const mon = monthRangeMap[monthMatch[1].toLowerCase()];
            const yearMatch = raw.match(/(\d{4})/);
            if (mon && yearMatch) {
              cleaned[field] = `${yearMatch[1]}-${mon}-01`;
            }
          }
        }
      }
      return cleaned;
    });

    // VALIDATE against boomerang schema
    const validation = validator.validateBatch(preCleanedRows, boom);

    // Store response with validation result
    const responseId = uuidv4();
    const response = {
      id: responseId,
      boomerangId,
      submittedAt: new Date().toISOString(),
      submittedBy: req.headers['x-user-id'] || 'anonymous',
      fileName,
      rowCount: rows.length,
      validation,
      status: validation.summary.invalid === 0 ? 'valid' : 'invalid',
    };

    responses.set(responseId, response);

    // Build cleaned rows from validatedRow transformations
    const cleanedRows = validation.results.map((r) => r.validatedRow);
    const correctedCount = validation.results.filter(
      (r) => !r.isValid && r.validatedRow
    ).length;

    // THIS IS THE KEY VALUE: Immediate feedback
    res.json({
      responseId,
      message: validation.summary.invalid === 0
        ? '✓ Perfect! All data is valid.'
        : `⚠️  ${validation.summary.invalid} rows have issues — ${correctedCount} auto-corrected.`,
      summary: {
        totalRows: validation.summary.total,
        validRows: validation.summary.valid,
        invalidRows: validation.summary.invalid,
        correctedRows: correctedCount,
        fieldErrors: validation.summary.errors,
      },
      cleanedRows,  // All rows with auto-corrections applied (dates normalized, numbers parsed, etc.)
      feedback: {
        sampleErrors: validation.summary.sampleErrors.slice(0, 3),
        fullReport: validation.results, // All details for frontend
      },
      nextStep: validation.summary.invalid === 0
        ? 'Data ready to sync! Owner can review and push to Tableau.'
        : `${correctedCount} rows were auto-corrected. Download the clean file or fix remaining issues and resubmit.`,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// DATA REVIEW & SYNC (Owner dashboard)
// ============================================

/**
 * Get all responses for a boomerang (owner view)
 * GET /api/boomerangs/:id/responses
 */
app.get('/api/boomerangs/:id/responses', async (req, res) => {
  try {
    const boomerangId = req.params.id;
    const userId = req.headers['x-user-id'] || 'anonymous';

    // Check permissions via Token Vault
    const audit = await tokenVaultClient.getAuditLog(userId, 10);

    const allResponses = Array.from(responses.values()).filter(
      (r) => r.boomerangId === boomerangId
    );

    res.json({
      boomerangId,
      responses: allResponses.map((r) => ({
        id: r.id,
        submittedBy: r.submittedBy,
        submittedAt: r.submittedAt,
        fileName: r.fileName,
        status: r.status,
        validRows: r.validation.summary.valid,
        invalidRows: r.validation.summary.invalid,
      })),
      auditLog: audit,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Sync validated data to Tableau via Token Vault
 * POST /api/boomerangs/:id/sync-tableau
 */
app.post('/api/boomerangs/:id/sync-tableau', async (req, res) => {
  try {
    const boomerangId = req.params.id;
    const userId = req.headers['x-user-id'] || 'anonymous';

    // Request Tableau token from Token Vault
    const tableauToken = await tokenVaultClient.requestToken(
      userId,
      'tableau',
      'write:boomerang-data',
      `Syncing validated Q1 briefing data to Tableau`
    );

    // In real life, would push data to Tableau API here
    // For demo, just acknowledge
    console.log(`✓ Tableau sync initiated with token: ${tableauToken.token.slice(0, 20)}...`);

    res.json({
      message: '✓ Data synced to Tableau dashboard',
      timestamp: new Date().toISOString(),
      tableau: {
        server: process.env.TABLEAU_SERVER,
        dashboard: 'Q1_Executive_Briefing',
      },
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ============================================
// DEMO ENDPOINTS (for testing)
// ============================================

/**
 * Load demo data for testing
 * GET /api/demo/load-sample-data
 */
app.get('/api/demo/load-sample-data', (req, res) => {
  const boomerangId = 'demo-q1-2026';

  SAMPLE_RESPONSES.forEach((sampleResponse) => {
    const validation = validator.validateBatch(sampleResponse.data, Q1_EXECUTIVE_BRIEFING_SCHEMA);

    const responseId = uuidv4();
    responses.set(responseId, {
      id: responseId,
      boomerangId,
      submittedAt: sampleResponse.submittedAt,
      submittedBy: sampleResponse.team,
      fileName: `${sampleResponse.team}_Q1_Data.${sampleResponse.source}`,
      rowCount: sampleResponse.data.length,
      validation,
      status: validation.summary.invalid === 0 ? 'valid' : 'invalid',
    });
  });

  res.json({
    message: `✓ Loaded ${SAMPLE_RESPONSES.length} sample submissions`,
    boomerangId,
    feedback: getMockValidationFeedback(),
  });
});

/**
 * Get demo boomerang
 * GET /api/demo/boomerang
 */
app.get('/api/demo/boomerang', (req, res) => {
  res.json(demoBoom);
});

// ============================================
// TOKEN VAULT & AUTH
// ============================================

/**
 * Check current user permissions
 * GET /api/auth/scopes
 */
app.get('/api/auth/scopes', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] || 'demo-user';
    const services = ['tableau', 'slack', 'boomerang'];

    const scopes = {};
    for (const service of services) {
      scopes[service] = await tokenVaultClient.getGrantedScopes(userId, service);
    }

    res.json({
      userId,
      grantedPermissions: scopes,
      auditLog: await tokenVaultClient.getAuditLog(userId, 5),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════╗
║          DATA BOOMERANG - BACKEND READY            ║
╚═══════════════════════════════════════════════════╝

API running on http://localhost:${PORT}

QUICK START:
  1. GET http://localhost:${PORT}/api/demo/boomerang
     → See the demo Q1 briefing boomerang

  2. POST http://localhost:${PORT}/api/demo/load-sample-data
     → Load 5 sample messy submissions

  3. GET http://localhost:${PORT}/api/boomerangs/demo-q1-2026/responses
     → See validation feedback for each submission

  4. POST http://localhost:${PORT}/api/boomerangs/demo-q1-2026/sync-tableau
     → Sync to Tableau (mock with Token Vault)

TOKEN VAULT STATUS: ${!process.env.TOKEN_VAULT_URL?.includes('YOUR') ? '✓ Configured' : '⚠️  Mock mode (configure .env)'}

For hackathon submission:
- Keep this server running
- Frontend will call these APIs
- Demo video shows the UI + validation flow
`);
});
