# Data Boomerang - Quick Start (10 minutes)

## You Now Have a Working Hackathon Foundation 🚀

All files are ready in `/sessions/practical-quirky-wright/mnt/outputs/data-boomerang-hackathon/`

---

## ⚡ Get Running in 2 Steps

### Step 1: Install & Configure

```bash
cd data-boomerang-hackathon

# Install dependencies
npm install

# Set up environment
cp .env.example .env

# No need to change .env yet - mock mode works!
```

### Step 2: Start the Server

```bash
npm run dev

# You'll see:
# ╔═══════════════════════════════════════════════════╗
# ║          DATA BOOMERANG - BACKEND READY            ║
# ╚═══════════════════════════════════════════════════╝
#
# API running on http://localhost:3000
```

---

## 🧪 Test the API (Paste in terminal)

```bash
# 1. See the demo boomerang schema
curl http://localhost:3000/api/demo/boomerang

# 2. Load 5 sample messy data submissions
curl http://localhost:3000/api/demo/load-sample-data

# 3. See validation results for all submissions
curl http://localhost:3000/api/boomerangs/demo-q1-2026/responses

# 4. Sync to Tableau (mock - uses Token Vault)
curl -X POST http://localhost:3000/api/boomerangs/demo-q1-2026/sync-tableau \
  -H "x-user-id: demo-user"
```

---

## 📁 What's Included

| File | Purpose |
|------|---------|
| `backend/server.js` | Main Express API |
| `backend/lib/token-vault-client.js` | **Auth0 Token Vault integration** |
| `backend/lib/validator.js` | Data validation logic |
| `backend/models/boomerang-schema.js` | Q1 briefing schema |
| `demo-data/q1-sample-responses.js` | 5 realistic messy datasets |
| `frontend/src/components/UploadForm.jsx` | React component stub |
| `README.md` | Full documentation |
| `TOKEN_VAULT_GUIDE.md` | Complete Token Vault explanation |
| `.env.example` | Configuration template |

---

## 🎯 What This Does

**The Problem:**
- Your 5-person leadership team needs Q1 data from 8 departments
- Everyone sends it in different formats (Excel, CSV, email, screenshot)
- You spend 2 days fixing, validating, reformatting
- Execs get briefed 2 days late

**Data Boomerang Solution:**
1. You define required fields (Team, Metric, Date, Confidence Score)
2. Send out shareable link
3. People upload data (any format)
4. **Instant feedback:** "Missing Employee ID in row 3" / "Date format wrong"
5. Contributors fix it on the spot
6. One click → validated data auto-syncs to Tableau
7. Beautiful dashboard ready for board meeting

---

## 🔐 The Token Vault Magic

**Why this matters:**

```
❌ Dangerous approach:
  const tableauToken = "ya29.a0AfH6SMBx...";  // hardcoded!

✅ Data Boomerang approach:
  token = tokenVaultClient.requestToken(
    userId,
    "tableau",
    "write:boomerang-data",  // specific scope
    "Syncing Q1 briefing"    // logged
  );
  // Token is encrypted, managed, auditable, user-revocable
```

**For judges:**
- Security model: ✅ No secrets in code
- User control: ✅ User explicitly approves scopes
- Technical execution: ✅ Proper Token Vault usage
- Audit trail: ✅ Every action logged

---

## 📊 The Data Boomerang Demo

**What judges will see in your 3-minute video:**

```
[0:00-0:30] THE CHAOS
"5 teams need to send Q1 data..."
Show: Messy Excel, hand-typed CSV, screenshot, email attachments
Narrate: "Different formats, wrong dates, missing fields"

[0:30-1:30] DATA BOOMERANG VALIDATES
"I create a boomerang with required fields"
Show: Upload form
Show: 5 submissions coming in
Show: Real-time feedback:
  ✓ Team A: "Perfect!"
  ⚠️  Team B: "Missing Date"
  ⚠️  Team C: "Bad format"

[1:30-2:30] BEHIND THE SCENES: TOKEN VAULT
"Under the hood, Auth0 Token Vault manages credentials"
Show: Code using tokenVaultClient.requestToken()
Show: User permissions dashboard
Show: Audit log

[2:30-3:00] THE OUTCOME
Click "Sync to Tableau"
Beautiful dashboard appears showing:
  Q1 Performance Summary
  - Sales: $2.5M ✓
  - Engineering: 847 deployments ✓
  - All data standardized, ready for board
```

---

## 🚀 Next Steps

### Immediate (Today)

- [ ] Run `npm install && npm run dev`
- [ ] Test API with curl commands above
- [ ] Read `TOKEN_VAULT_GUIDE.md` (understand the architecture)
- [ ] Explore `backend/lib/token-vault-client.js` (see the patterns)

### Before Submission (This Week)

- [ ] (Optional) Sign up for Auth0 free trial, get real credentials, update `.env`
- [ ] Build frontend UI (use `UploadForm.jsx` as starting point)
- [ ] Record 3-minute demo video
- [ ] Write submission description (see README)
- [ ] Push code to public GitHub repo
- [ ] Deploy backend (Heroku, Railway, Vercel)
- [ ] Submit!

---

## 💡 Why This Project Wins

| Criterion | You Have It |
|-----------|-----------|
| **Solves Real Problem** | ✅ Every enterprise collects scattered data |
| **Uses Token Vault** | ✅ Properly integrated (requestToken, scopes, audit) |
| **Security Model** | ✅ Zero hardcoded tokens, user-controlled permissions |
| **User Control** | ✅ Dashboard shows permissions, can revoke |
| **Technical Execution** | ✅ Production-ready patterns |
| **Design & UX** | ✅ Clean validation feedback, beautiful output |
| **Potential Impact** | ✅ Universal use case, could be real product |
| **Insight Value** | ✅ Demonstrates multi-service credential architecture |

---

## 🎓 Key Concepts

### Token Vault (The Star)

Instead of:
```javascript
const token = process.env.TABLEAU_TOKEN;  // ❌ Hardcoded
```

You do:
```javascript
const token = await tokenVaultClient.requestToken(
  userId,
  "tableau",
  "write:boomerang-data"  // ✅ Specific scope
);
// Token Vault handles:
// - User consent (explicit approval)
// - Token storage (encrypted)
// - Token refresh (automatic)
// - Audit logging (every request)
// - Revocation (user can disable)
```

### Validation (The Value)

```javascript
const feedback = validator.validateBatch(rows, schema);
// Returns:
{
  valid: 3,
  invalid: 2,
  errors: {
    'Q1 Primary Metric': 1,  // Missing in 1 row
    'Metric Period': 1        // Bad format in 1 row
  },
  sampleErrors: [
    { rowIndex: 3, field: 'Q1 Primary Metric', message: 'Missing required field' }
  ]
}
```

Users see **immediately** what's wrong and can fix it.

### Boomerang (The Container)

```javascript
const boomerang = {
  id: "q1-2026",
  name: "Q1 Executive Briefing",
  requiredFields: [
    { name: "Team Name", type: "string" },
    { name: "Q1 Primary Metric", type: "number" }
  ],
  destinations: [
    { service: "tableau", scope: "write:boomerang-data" },
    { service: "slack", scope: "chat:write" }
  ]
};
```

One boomerang, multiple contributors, standardized output.

---

## 🔗 Files You Need for Submission

**GitHub Repo:**
- ✅ All backend code
- ✅ Frontend component stubs
- ✅ `.env.example` with clear instructions
- ✅ `README.md` + `TOKEN_VAULT_GUIDE.md`
- ✅ `QUICKSTART.md` (this file)

**Deployed App:**
- Deploy backend to Heroku/Railway/Vercel
- Optional: deploy frontend (for judges to test UI)

**Video (3 minutes):**
- Screen recording showing data → validation → dashboard
- Upload to YouTube (public link in submission form)

**Text Description (250+ words):**
- Explain problem & solution
- Highlight Token Vault role
- Show judges you understand security/UX/impact

---

## 🏆 Final Checklist Before Submission

- [ ] Code runs locally: `npm install && npm run dev`
- [ ] API endpoints work (test with curl)
- [ ] `.env.example` is clear and complete
- [ ] README explains the full system
- [ ] TOKEN_VAULT_GUIDE.md shows you understand the architecture
- [ ] Demo video shows: upload → validation → output
- [ ] GitHub repo is public
- [ ] Backend is deployed (shareable URL)
- [ ] Video is on YouTube (public)
- [ ] Submission form filled (title, description, links)

---

## 🤔 Questions?

- **"How do I set up Auth0?"** → See `TOKEN_VAULT_GUIDE.md` (Step 1-5)
- **"Can I just use mock mode?"** → Yes! Judges understand. Focus on UX.
- **"What about the frontend?"** → `UploadForm.jsx` is a great starting point
- **"How do I record the video?"** → OBS Studio (free) or ScreenFlow (Mac)

---

## 🎉 You're Ready

You have:
- ✅ Full working backend
- ✅ Token Vault integration (mock + real)
- ✅ Validation logic
- ✅ Sample data
- ✅ API endpoints
- ✅ Complete documentation

**Next: Build the UI, record demo, submit!**

Good luck! This is going to be beautiful. 🚀
