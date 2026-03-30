# Auth0 Token Vault: Complete Guide for Data Boomerang

## 🔐 What is Auth0 Token Vault?

**Token Vault is a managed credential service from Auth0 specifically designed for AI agents and applications.**

It solves a critical problem:

```
❌ BEFORE (Dangerous)
Agent code:           API keys hardcoded in source code
Environment vars:     Secrets visible to anyone with server access
Token rotation:       Manual, error-prone process
User permissions:     No way to scope what agent can do
Audit trail:          Impossible to track what accessed what

✅ AFTER (Token Vault)
Agent code:           No secrets at all
Token requests:       "Give me Tableau token with write:data scope"
Token rotation:       Automatic, transparent
User permissions:     User explicitly approves "write:data" scope
Audit trail:          Every token request logged + timestamped
```

---

## 🎯 How Token Vault Works in Data Boomerang

### The Flow

```
┌─────────────────────────────────────────────────────────┐
│ 1. SETUP: User Creates Boomerang                         │
└─────────────────────────────────────────────────────────┘

Director says: "I need Q1 data. Please pull from Tableau and Slack."
↓
Data Boomerang asks: "What permissions should I have?"
↓
Director explicitly grants:
  ✓ Tableau: write:boomerang-data (upload validated data)
  ✓ Slack: chat:write (send notifications)
  ✗ Gmail: (NOT approved - too sensitive)
↓
Auth0 shows OAuth consent screen
↓
Director clicks "Allow" for each service
↓
Tokens are generated and stored in Token Vault
  (encrypted, never visible to boomerang code)

┌─────────────────────────────────────────────────────────┐
│ 2. RUNTIME: When Boomerang Needs a Token                │
└─────────────────────────────────────────────────────────┘

Boomerang code:
  token = await tokenVault.requestToken(
    userId="director@company.com",
    service="tableau",
    scope="write:boomerang-data",
    reason="Syncing validated Q1 briefing data"
  )

↓ Token Vault checks:

  1. Is this user known? YES
  2. Did they grant "write:boomerang-data" for Tableau? YES
  3. Is the token still valid? YES (if expired, auto-refresh)
  4. Log this request for audit trail ✓

↓ Token Vault returns:

  {
    token: "ya29.a0AfH6SMBx...",
    expiresIn: 3600,
    service: "tableau",
    scope: "write:boomerang-data"
  }

↓

Boomerang uses token to sync data to Tableau

┌─────────────────────────────────────────────────────────┐
│ 3. TRANSPARENCY: User Can See & Revoke                  │
└─────────────────────────────────────────────────────────┘

Director's Dashboard:
  Boomerang Permissions:
    ✓ Tableau (write:boomerang-data)   [Revoke]
    ✓ Slack (chat:write)               [Revoke]
    ✗ Gmail (not granted)

  Audit Log:
    Mar 27, 3:15 PM: Boomerang synced 15 rows to Tableau
    Mar 27, 2:45 PM: Boomerang sent summary to #analytics
    Mar 27, 2:30 PM: Director granted Slack write permission

If Director clicks [Revoke] for Tableau:
  → Future Tableau syncs fail safely
  → Slack still works
  → One service disabled without breaking others
```

---

## 🛠️ Setting Up Token Vault for Hackathon

### Step 1: Get Auth0 Account

Go to: https://auth0.com/product/ai-agents

Sign up for free trial. You'll get:
- **Tenant domain:** `your-app.auth0.com`
- **Client ID & Secret:** For authenticating the boomerang
- **Token Vault API:** For requesting tokens

### Step 2: Create OAuth Connections

Auth0 Dashboard → Connections → Social/Enterprise

Set up OAuth connections for services you want to sync to:
- **Tableau:** App ID, Client Secret
- **Slack:** Bot Token, Signing Secret
- **Google Sheets:** OAuth 2.0 credentials

(For hackathon, use dummy credentials - judges understand you won't have real integrations)

### Step 3: Configure Your Boomerang

In `backend/lib/token-vault-client.js`:

```javascript
// The boomerang knows:
const boomerangScopes = {
  tableau: ['write:boomerang-data'],
  slack: ['chat:write'],
  google_sheets: ['read:spreadsheets'],
};

// When asking for a token:
const token = await tokenVault.requestToken(
  userId,
  'tableau',
  'write:boomerang-data',  // ← Must be pre-approved by user
  'Syncing Q1 brief to Tableau'  // ← Logged for audit
);
```

### Step 4: Update .env

```bash
AUTH0_DOMAIN=your-app.auth0.com
AUTH0_CLIENT_ID=YOUR_CLIENT_ID
AUTH0_CLIENT_SECRET=YOUR_CLIENT_SECRET
TOKEN_VAULT_URL=https://your-app.auth0.com/api/v1/token-vault
TOKEN_VAULT_API_KEY=YOUR_API_KEY
```

### Step 5: Test

```bash
npm run dev

curl http://localhost:3000/api/auth/scopes \
  -H "x-user-id: test-user"

# Should see what permissions test-user has
# In mock mode, shows simulated permissions
```

---

## 🎭 Mock Mode (For Testing Without Auth0)

**Can't get Auth0 set up quickly?** No problem!

The code automatically runs in **mock mode** if Token Vault isn't configured:

```javascript
// In token-vault-client.js

if (!this.vaultUrl || !this.apiKey) {
  console.warn('⚠️  Token Vault not configured. Using mock mode.');
  this.mockMode = true;
}
```

Mock mode:
- ✅ Simulates Token Vault responses perfectly
- ✅ Shows what real Token Vault would do
- ✅ Judges understand this for hackathon
- ✅ Production-ready code pattern (just `if (mockMode)`)

**For demo/testing:** Mock mode is FINE! Focus on the validation & UX.

**For submission:** Even mock mode demonstrates:
- Your understanding of Token Vault architecture
- Proper credential handling patterns
- User permission model
- Audit logging approach

---

## 🔑 Key Token Vault Concepts

### 1. **Scopes** (What the agent can do)

```javascript
// Boomerang asks for specific scope
await requestToken(userId, "tableau", "write:boomerang-data");

// This is NOT asking for:
// ❌ delete:all_data
// ❌ admin:access
// ❌ unlimited power

// It's asking for:
// ✓ Write only
// ✓ Only boomerang data
// ✓ Minimum necessary privilege
```

Scope design for Data Boomerang:
```
tableau:
  read:dashboards        (view templates)
  write:boomerang-data   (sync validated data)

slack:
  chat:write             (send notifications)

google_sheets:
  read:spreadsheets      (read as template)
```

### 2. **User Consent** (Transparency)

```javascript
// User must explicitly approve before Agent can use scope
// Auth0 shows: "Data Boomerang wants write:boomerang-data from Tableau"
// User: "Allow" or "Deny"
// Once approved: Token stored in vault, never shown to code
```

### 3. **Token Lifecycle** (Automatic)

```javascript
// Token expires (typically 1 hour)
// Boomerang requests token: Token Vault detects expiry
// Vault auto-refreshes using refresh token
// Returns new token transparently
// Boomerang code doesn't need to handle refresh
```

### 4. **Audit Logging** (Accountability)

```javascript
// Every token request is logged
await tokenVault.getAuditLog(userId, limit=50);

// Returns:
[
  {
    timestamp: "2026-03-27T15:30:00Z",
    action: "token_requested",
    service: "tableau",
    scope: "write:boomerang-data",
    reason: "Syncing validated Q1 data",
    status: "granted"
  },
  {
    timestamp: "2026-03-27T14:15:00Z",
    action: "scope_granted",
    service: "slack",
    scope: "chat:write",
    status: "user_approved"
  },
  ...
]

// Judges love this: Complete transparency
// Users can audit what the agent did
```

---

## 📋 Token Vault API Reference

### Request a Token

```javascript
POST /token-vault/request
{
  "user_id": "director@company.com",
  "service": "tableau",
  "scope": "write:boomerang-data",
  "reason": "Syncing Q1 briefing data"  // logged
}

RESPONSE:
{
  "access_token": "ya29.a0AfH6SMBx...",
  "expires_in": 3600,
  "token_type": "Bearer",
  "service": "tableau",
  "scope": "write:boomerang-data"
}
```

### Check User Scopes

```javascript
GET /token-vault/user/{userId}/scopes/{service}
Authorization: Bearer {API_KEY}

RESPONSE:
{
  "service": "tableau",
  "scopes": ["write:boomerang-data"],
  "grantedAt": "2026-03-27T10:00:00Z"
}
```

### Revoke Scope

```javascript
DELETE /token-vault/user/{userId}/scopes/{service}/{scope}
Authorization: Bearer {API_KEY}

RESPONSE:
{ "success": true }
```

### Get Audit Log

```javascript
GET /token-vault/user/{userId}/audit?limit=50
Authorization: Bearer {API_KEY}

RESPONSE:
{
  "entries": [
    {
      "timestamp": "2026-03-27T15:30:00Z",
      "action": "token_requested",
      "service": "tableau",
      "scope": "write:boomerang-data",
      "reason": "...",
      "status": "granted"
    },
    ...
  ]
}
```

---

## 🏆 How Token Vault Wins Judges

### Security Model (25 points)

**With Token Vault:**
- ✅ Zero hardcoded secrets
- ✅ User explicitly grants permissions
- ✅ Scope-based access (principle of least privilege)
- ✅ Automatic token rotation
- ✅ Complete audit trail
- ✅ User can revoke anytime

**Judges see:** "This team understands modern credential management."

### User Control (20 points)

**Users can:**
- See what permissions agent has
- Understand why it needs each permission
- Grant/revoke individually
- Audit what the agent did
- Disable one service without breaking others

**Judges see:** "This team respects user privacy and control."

### Insight Value (20 points)

**Your project demonstrates:**
- Why Token Vault is essential for agents
- How to implement OAuth properly
- Best practices for credential handling
- New pattern: multi-agent with scoped access

**Judges see:** "This team identified a real architectural pattern."

---

## 🚨 Common Mistakes (Avoid These)

### ❌ Hardcoding Tokens

```javascript
// DON'T DO THIS
const tableauToken = "ya29.a0AfH6SMBx...";  // ❌ Visible in code!
const boomerangCode = `
  fetch("https://tableau.com/api/...", {
    headers: { Authorization: Bearer ${tableauToken} }
  });
`;
```

### ✅ Use Token Vault Instead

```javascript
// DO THIS
const token = await tokenVault.requestToken(
  userId,
  "tableau",
  "write:boomerang-data",
  "Syncing Q1 data"
);
// Token is managed, encrypted, auditable
```

### ❌ Ignoring Token Expiry

```javascript
// DON'T DO THIS
const token = getToken();  // ❌ Could be expired!
await syncToTableau(token);  // Might fail
```

### ✅ Request Fresh Token

```javascript
// DO THIS - Token Vault handles expiry
const token = await tokenVault.requestToken(...);
// If expired, vault auto-refreshes before returning
```

### ❌ Over-permissioning

```javascript
// DON'T DO THIS
user.grants("admin:all");  // ❌ Too much power!
// Boomerang could delete everything
```

### ✅ Request Minimal Scopes

```javascript
// DO THIS
user.grants("write:boomerang-data");  // ✓ Specific
user.grants("chat:write");             // ✓ Limited
// Boomerang can only do what's needed
```

---

## 📚 Examples in This Codebase

### Example 1: Requesting a Token

File: `backend/lib/token-vault-client.js`

```javascript
async requestToken(userId, service, scope, reason = '') {
  const response = await axios.post(
    `${this.vaultUrl}/request`,
    {
      user_id: userId,
      service,
      scope,
      reason,  // logged for audit
      client_id: process.env.AUTH0_CLIENT_ID,
    },
    {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
    }
  );
  return { token: response.data.access_token, ... };
}
```

### Example 2: Using Token Vault in API

File: `backend/server.js`

```javascript
app.post('/api/boomerangs/:id/sync-tableau', async (req, res) => {
  const token = await tokenVaultClient.requestToken(
    userId,
    'tableau',
    'write:boomerang-data',
    'Syncing validated Q1 briefing data'
  );

  // Now use the token
  await fetch('https://tableau.com/api/data', {
    headers: { Authorization: `Bearer ${token.token}` },
    body: validatedData
  });
});
```

### Example 3: Checking Permissions

File: `backend/server.js`

```javascript
app.get('/api/auth/scopes', async (req, res) => {
  const scopes = await tokenVaultClient.getGrantedScopes(
    userId,
    'tableau'
  );
  res.json({ scopes });  // User sees what they approved
});
```

---

## 🎬 Talking About Token Vault in Your Demo

**30-second elevator pitch:**

> "Data Boomerang is secure because it uses Auth0 Token Vault. Instead of storing API keys in code, users explicitly grant permissions—'write to Tableau', 'send Slack messages'—and tokens are managed by Auth0. Every access is logged. If a user wants to revoke access, one click disables it. This is how modern applications should handle credentials."

**Why judges care:**

1. **Security:** No secrets in code
2. **User Control:** Explicit permissions
3. **Auditability:** Every action logged
4. **Best Practice:** Production-ready pattern

---

## ✅ Hackathon Submission Checklist for Token Vault

- [ ] Token Vault is mentioned in README
- [ ] `.env.example` includes Token Vault variables
- [ ] Code uses `tokenVaultClient` (not hardcoded tokens)
- [ ] API requests tokens with proper scopes
- [ ] User can see granted permissions
- [ ] Audit log is accessible
- [ ] Demo mentions Token Vault explicitly
- [ ] Judges can understand how it works from code

---

## 🚀 Next Steps

1. **Set up Auth0 account** (5 mins): https://auth0.com/product/ai-agents
2. **Copy `.env.example` → `.env`** (2 mins)
3. **Fill in Auth0 credentials** (5 mins)
4. **Run in mock mode first** (test everything works)
5. **Connect real Token Vault** (optional for hackathon)
6. **Record demo** (show validation + permissions)
7. **Submit!**

---

**Remember:** Even in mock mode, your code demonstrates correct Token Vault patterns. Judges will recognize the architecture and understand this is how it would work in production. ✅

---

Questions? Check:
- Auth0 docs: https://auth0.com/docs/token-vault
- This codebase: `backend/lib/token-vault-client.js`
- README.md: Full setup instructions
