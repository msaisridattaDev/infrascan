# InfraScan — Phase-Wise Production Deployment Playbook
*Execution playbook: GitHub from commit #1, Vercel (frontend) + Render (backend) live from Phase 3/4, every subsequent phase ships to production. Companion to `infrascan_founding_engineer_demo_plan.md`, which holds the full architecture research and reasoning — this document is the build sequence.*

## Revision note — Phases 1–6 complete, scope updated from 6B onward

Phases 1–6 as written below are **already implemented and preserved unchanged** — repo, GitHub workflow, Vercel/Render deployment, frontend↔backend integration, and the core ingestion pipeline (`POST /observations`, dedup, storage) are done and stay exactly as built. **Nothing in the backend ingest endpoint needs to change** — a real Android app is just another real client posting to the same endpoint the capture simulator already proved works.

Everything from **Phase 6B onward** is updated to reflect the final, confirmed architecture: a real Android app (camera + accelerometer trigger + GPS), Claude Vision (Tier 2), simplified road-segment matching, seeded DLP lookup, human review, and dashboard — scoped honestly for what's achievable in the remaining time, with on-device Tier 1, EKF sensor fusion, self-hosted OSRM/Valhalla, and live government routing explicitly deferred and marked as such, not quietly dropped.

## How to use this playbook

Each phase has the same seven sections. **Do not start the next phase until the current phase's Definition of Done is fully checked.** This is the actual discipline point — it's what makes "phase-wise" mean something instead of being a table of contents.

Phase count: **16**, expanded from the requested 15 by splitting "AI/vision/LLM provider abstraction" into two phases — the frontier-model abstraction (Phase 7) and the own-model cascade layer (Phase 8) — because the in-house training methodology deserves its own phase, not a subsection.

---

## Phase 0 — Locked Decisions (read before starting, not a build phase)

These were researched and decided already; this playbook builds them, it doesn't re-derive them.

| Decision | Choice |
|---|---|
| Repo structure | Monorepo: `/frontend`, `/backend`, `/docs` |
| Frontend | React + Vite, deployed on **Vercel** |
| Backend | FastAPI (Python, async), deployed on **Render** as a Web Service |
| Background processing | Render **Background Worker** service (batch orchestrator, DLQ sweep, calibration recompute) — separate from the web service, same DB |
| Database | **Render managed Postgres** from Phase 4 onward — not local SQLite. Render web services have ephemeral disks; a SQLite file does not survive a redeploy. Validate against real Postgres early, not the night before the demo. |
| Object storage | S3-compatible bucket (Cloudflare R2 or AWS S3 free tier) behind an `ObjectStorage` protocol — images are never stored on Render's ephemeral disk |
| AI/vision layer | `InferenceProvider` protocol; Tier 2 = frontier vision LLM behind a real adapter (Anthropic today, OpenAI/Gemini as stub adapters); Tier 1 = our own model, the production workhorse (model cascade — §0c of the plan doc) |
| Branching | Trunk-based: short-lived feature branches → PR → `main` (protected) → auto-deploy. No gitflow/staging-branch overhead for a one-engineer project |
| CI | GitHub Actions runs tests on every PR; Vercel and Render both auto-deploy on push to `main` |

---

## Phase 0b — Today's Actual Scope (Locked, Updated)

The phases below describe the full production build. **This table is the honest, final answer to "what are we actually doing" — refer back to it before every phase, not just once.**

| Phase | Status | Why |
|---|---|---|
| 1 — Repo init | ✅ **Done** | Complete |
| 2 — GitHub workflow | ✅ **Done** | Complete |
| 3 — Frontend + Vercel | ✅ **Done** | Complete |
| 4 — Backend + Render | ✅ **Done** | Complete |
| 5 — Frontend↔backend integration | ✅ **Done** | Complete |
| 6 — Core pipeline (ingest/dedup/storage) | ✅ **Done** | Complete, unchanged — real Android now POSTs to this same endpoint |
| 6B — Real Android capture app | **Build** | Camera + accelerometer trigger + GPS, real device, real drive — the centerpiece change from the earlier simulator-based plan |
| 7 — Tier-2 provider abstraction | **Build** | Real Claude Vision call, structured output — still the AI centerpiece |
| 7B — Road-segment matching + DLP lookup | **Build, simplified/seeded** | Nearest-segment matching against 5–10 seeded rows, not self-hosted OSRM/Valhalla; fail-closed logic preserved |
| 8 — Tier-1 cascade & training methodology | **Design doc only** | No training run, no on-device model. `docs/model-training-methodology.md` referencing PGKD. |
| 9 — Batch/worker orchestration | **Skip** | Documented as next step |
| 10 — Reliability (retry/DLQ/backpressure) | **Skip** | Documented as next step |
| 11 — Storage hardening | **Skip** | Documented as next step |
| 12 — Observability | **Skip** | Documented as next step |
| 13 — Testing/CI gate | **Skip** | Documented as next step |
| 14 — Load testing | **Skip** | Documented as next step |
| 15 — Production-readiness | **Skip** | Documented as next step |
| 16 — Final demo | **Build (scaled to what's live)** | Rehearse only what's actually real |

**What's explicitly simplified or mocked for the demo, and why — say this out loud, don't hide it:**

| Piece | Full production target | Today | Why |
|---|---|---|---|
| On-device vision (Tier 1) | Trained TFLite model, PyTorch→ONNX→TFLite pipeline | **Skipped entirely** | Needs labeled training data and a train/convert/test cycle we don't have time for. Every accelerometer-triggered frame goes straight to Tier 2 cloud. |
| Sensor fusion for localization | EKF fusing accelerometer+gyroscope+GPS | **Raw GPS reading only** | An untested Kalman filter is worse than raw GPS — needs real driving data to tune and validate |
| Road-segment matching | Self-hosted OSRM/Valhalla, HMM map matching against a GPS trajectory | **Nearest-segment-by-distance against 5–10 seeded rows** | Standing up and validating a real routing engine is itself hours of infra work |
| DLP/contract registry | Real GeoSadak/PMGSY dataset ingestion | **5–10 manually seeded contract records** | Real dataset ingestion is a pipeline, not a today task |
| Government routing | Live Open311 or OMMAS-style API submission | **Draft only, human-reviewed, never auto-sent** | Matches the real manual process anyway — this was never going to be live-submitted |
| Fix Verification | Automatic before/after check on a later live drive-by | **Tested with two manually staged before/after photos** | Proves the comparison logic works without requiring a real second drive past the same pothole |

**What today's build proves, honestly, against the original job requirements:**

| JD requirement | Status today | What's real about it |
|---|---|---|
| Mobile capture | ✅ **Real** | A real Android app, real camera, on a real device |
| GPS | ✅ **Real** | Real `FusedLocationProvider` reading at the moment of capture, no synthetic coordinates |
| Hardware/IoT | ❌ Not built | Bonus JD item, out of scope |
| Millions of images | ❌ Not demonstrated live | Architecture designed (model cascade, batching, self-hosted map matching); no load test run |
| **Review workflow** | ✅ **Real** | Structured AI output → calibrated routing → human correction → eval feedback, all live |
| **GIS / map** | ✅ **Real** | Real AI output at real GPS coordinates, on a real map |
| **Contractor/DLP accountability** | ⚠️ **Real logic, seeded data** | Fail-closed matching genuinely works; the underlying dataset is 5–10 sample rows, not a real government feed |

**Demo ordering — AI output leads, infrastructure follows:** open on a real captured photo going through the real Tier-2 call and showing real structured output on screen, *before* explaining any architecture. Everything else exists to support that moment — it is not the moment itself.

---

## Phase 1 — Repository & Project Initialization

**Objective:** A single source of truth exists, structured to hold frontend, backend, and docs without restructuring later.

**Goal:** `git clone` + two commands gets any future contributor (or you, in six months) a running local dev environment.

**What gets implemented:**
- Monorepo skeleton: `/frontend`, `/backend`, `/docs`, root `README.md`
- `.gitignore` for Python + Node
- `LICENSE` (or explicitly private, founder's call)
- Root `README.md` stub — filled in properly in Phase 16

**Exact tasks:**
1. `mkdir infrascan && cd infrascan && git init`
2. Create folders: `mkdir frontend backend docs`
3. Add root `.gitignore`: `__pycache__/`, `*.pyc`, `.venv/`, `node_modules/`, `dist/`, `.env`, `.env.local`, `.DS_Store`
4. Create root `README.md` with a one-paragraph project description (placeholder, expanded in Phase 16)
5. `git add . && git commit -m "chore: initial repo structure"`

**Expected output:** A repo with three folders and a first commit, nothing running yet.

**Verification checklist:**
- [ ] `git log` shows one commit
- [ ] `/frontend`, `/backend`, `/docs` exist and are empty except `.gitkeep` if needed
- [ ] `.env` and `.env.local` are in `.gitignore` — confirm by creating a dummy `.env` and running `git status`; it must not appear

**Definition of Done (gate to Phase 2):** Repo structure exists, first commit made, secrets-ignore confirmed working.

---

## Phase 2 — GitHub Setup & Branching/Commit Workflow

**Objective:** Every subsequent line of code goes through the same lightweight, real workflow from day one — not "we'll add process later."

**Goal:** `main` is protected, feature branches are the only way in, commit messages are conventional and greppable.

**What gets implemented:**
- GitHub repo created, `main` pushed
- Branch protection on `main`: require PR, require passing CI (CI itself comes in Phase 13, but the protection rule is set now)
- `CONTRIBUTING.md` documenting the workflow (even solo — this is what you paste into the interview answer about process)
- Conventional commit convention: `feat:`, `fix:`, `chore:`, `docs:`, `test:`

**Exact tasks:**
1. Create GitHub repo (private), add as remote: `git remote add origin <url>`
2. `git push -u origin main`
3. GitHub → Settings → Branches → add rule for `main`: require pull request before merging, require status checks to pass (will bind to CI once Phase 13 lands)
4. Write `docs/CONTRIBUTING.md`: branch naming (`feat/observation-ingest`, `fix/dedupe-race`), commit convention, PR template stub
5. Create `.github/pull_request_template.md` with sections: What changed / How verified / Screenshots if UI

**Expected output:** A protected `main` branch; any change requires a branch + PR, even solo.

**Verification checklist:**
- [ ] Attempting to push directly to `main` is rejected
- [ ] Opening a PR from a test branch shows the PR template
- [ ] `CONTRIBUTING.md` exists and states the branch/commit convention

**Definition of Done (gate to Phase 3):** Branch protection active and tested with a throwaway branch; workflow documented.

---

## Phase 3 — Frontend Foundation + Vercel Deployment

**Objective:** A live, public frontend URL exists before a single real feature is built — deployment is proven working while the stakes are zero.

**Goal:** Push to `main` → Vercel auto-deploys → live URL updates, confirmed end-to-end.

**What gets implemented:**
- Vite + React app in `/frontend`
- A single placeholder page: "InfraScan — coming online"
- Vercel project connected to the GitHub repo, root directory set to `/frontend`
- Environment variable placeholder for the future API base URL

**Exact tasks:**
1. `cd frontend && npm create vite@latest . -- --template react`
2. `npm install`, confirm `npm run dev` works locally
3. Replace the default page with a one-line placeholder component
4. Commit on a `feat/frontend-skeleton` branch, open PR, merge to `main`
5. Vercel dashboard → New Project → import the GitHub repo → set **Root Directory = `frontend`** (critical for monorepos) → deploy
6. Add environment variable `VITE_API_BASE_URL` in Vercel (Production + Preview) — value is a placeholder (`https://placeholder.example.com`) until Phase 4/5
7. Confirm Vercel auto-deploys on every push to `main`, and creates a Preview deployment on every PR

**Expected output:** A live `*.vercel.app` URL showing the placeholder page, auto-updating on push.

**Verification checklist:**
- [ ] Production URL loads the placeholder page
- [ ] Opening a test PR produces a distinct Preview URL
- [ ] Merging that PR updates the Production URL within Vercel's normal deploy time
- [ ] `VITE_API_BASE_URL` is visible in the Vercel project's environment variable settings for both Production and Preview

**Definition of Done (gate to Phase 4):** Live frontend URL, confirmed auto-deploy on merge, confirmed distinct preview-per-PR.

---

## Phase 4 — Backend Foundation + Render Deployment

**Objective:** A live, public backend URL exists, proven deployed, before any real endpoint logic is built.

**Goal:** Push to `main` → Render auto-deploys → `/health` returns 200 at the live URL.

**What gets implemented:**
- FastAPI app in `/backend` with one route: `GET /health` → `{"status": "ok"}`
- Render Web Service pointing at `/backend`
- Render managed Postgres instance created now (even though nothing writes to it yet) — validates the connection path early
- `requirements.txt`, `render.yaml` (Render's infra-as-code config, optional but recommended so the service definition lives in git, not only in the dashboard)

**Exact tasks:**
1. `cd backend && python -m venv .venv && source .venv/bin/activate`
2. `pip install fastapi uvicorn[standard] sqlalchemy psycopg2-binary python-dotenv`
3. `pip freeze > requirements.txt`
4. Create `main.py` with the `/health` route
5. Create `render.yaml` at repo root declaring: one `web` service (build: `pip install -r backend/requirements.txt`, start: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`), one `pserv` Postgres instance (free tier)
6. Commit on `feat/backend-skeleton`, PR, merge
7. Render dashboard → New → Blueprint (reads `render.yaml`) → connect repo → deploy
8. Copy the Postgres connection string into the web service's environment variables as `DATABASE_URL`
9. Confirm `curl https://<render-url>/health` returns `{"status":"ok"}`

**Expected output:** A live Render URL answering `/health`; a Postgres instance provisioned and reachable.

**Verification checklist:**
- [ ] `curl` against the live Render URL returns 200 and the expected JSON
- [ ] Render dashboard shows successful auto-deploy on the most recent `main` push
- [ ] `DATABASE_URL` is set in the web service's environment and a throwaway script (`python -c "..."`) confirms it connects
- [ ] Understood and accepted: free-tier web service spins down after ~15 min idle (acceptable for now; note to upgrade to Starter, $7/mo, before the live founder demo to remove cold-start latency)

**Definition of Done (gate to Phase 5):** Live backend URL, `/health` verified, Postgres connection verified, spin-down behavior understood.

---

## Phase 5 — Frontend ↔ Backend Integration

**Objective:** Prove the full deployed path — Vercel frontend calling Render backend — before building real features on top of it.

**Goal:** The placeholder frontend page displays a live value fetched from the deployed backend's `/health` endpoint.

**What gets implemented:**
- CORS configuration on FastAPI allowing the Vercel production domain and Vercel's preview-deployment wildcard
- Frontend fetch call to `${VITE_API_BASE_URL}/health`, rendering the result
- `VITE_API_BASE_URL` updated from placeholder to the real Render URL

**Exact tasks:**
1. Backend: add `CORSMiddleware` allowing `https://<project>.vercel.app` and `https://*.vercel.app` (preview deployments) — tighten this list later in Phase 15
2. Frontend: `fetch(import.meta.env.VITE_API_BASE_URL + "/health")`, display status on the placeholder page
3. Update Vercel's `VITE_API_BASE_URL` env var to the real Render URL, redeploy
4. PR + merge both changes

**Expected output:** Visiting the live Vercel URL shows a page that says something like "Backend status: ok" — fetched live, not hardcoded.

**Verification checklist:**
- [ ] Live Vercel page shows a live-fetched value from the Render backend (not a hardcoded string — confirm by temporarily breaking `/health` and seeing the frontend reflect it)
- [ ] No CORS errors in browser console
- [ ] Preview deployment (new PR) also successfully calls the backend

**Definition of Done (gate to Phase 6):** Full deployed round-trip (Vercel → Render) proven working, before real features exist. This is the walking skeleton — everything from here is additive.

---

## Phase 6 — Core Application Pipeline

**Objective:** Real data flows and persists — ingestion, dedup, storage — with no AI yet. Prove the plumbing before adding intelligence.

**Goal:** A capture simulator posts image + GPS + metadata; the backend dedupes, stores, and persists to Postgres; the frontend queue view lists real rows.

**What gets implemented:**
- Full `observations` table (per plan doc §13) in Postgres via SQLAlchemy models + Alembic migration
- `POST /observations` endpoint: validates, computes `content_hash`, enforces `UNIQUE(content_hash)` dedup, stores image in object storage, writes the row
- `GET /observations` endpoint: list/filter
- `ObjectStorage` protocol + one real implementation (R2/S3 adapter)
- A standalone capture-simulator script (`scripts/simulate_capture.py`) posting synthetic image+GPS+timestamp batches — **exact ID/field generation spelled out in the trace below**
- Frontend: basic queue table view, fetching and rendering real `GET /observations` data

**Exact tasks:**
1. `pip install alembic`, `alembic init migrations`, write the `observations` table migration, run it against Render Postgres
2. Implement `ObjectStorage` protocol (`save(bytes) -> uri`, `load(uri) -> bytes`); implement `R2ObjectStorage` (or `S3ObjectStorage`)
3. Implement `POST /observations`: validate payload → compute content hash → dedupe check → upload image via `ObjectStorage` → insert row
4. Implement `GET /observations?status=&since=`
5. Write `scripts/simulate_capture.py` exactly per the trace below: generates a client UUID, a real SHA-256 content hash, jittered GPS along a plausible route, a synthetic timestamp and device ID — posts to the live Render URL
6. Frontend: queue table component fetching `GET /observations`, rendering thumbnail (via signed/public object URL), GPS, timestamp, status
7. PR + merge; confirm deployed

**Expected output:** Running the simulator against the live Render URL populates real rows, visible in the deployed frontend's queue table.

**Verification checklist:**
- [ ] Posting the same image twice (same content hash) results in exactly one row — dedup confirmed against live Postgres, not just locally
- [ ] Simulator run of 20+ synthetic observations succeeds end-to-end against the deployed backend
- [ ] Frontend queue table on the live Vercel URL shows the real rows
- [ ] Images are retrievable from object storage via the stored `image_uri`

**Definition of Done (gate to Phase 6B):** Real ingestion, dedup, storage, and display working end-to-end on the deployed stack. No AI involved yet — that's the point. **This phase is complete and unchanged — the real Android app in Phase 6B posts to this exact endpoint, no backend modifications needed.**

---

## Phase 6B — Real Android Capture App (Camera + Accelerometer → Trigger → GPS)

**Objective:** Replace the capture simulator with a real Android app — real camera, real accelerometer, real GPS, on a real device.

**Goal:** A phone mounted in a moving vehicle produces accelerometer-triggered photo+GPS+metadata uploads to the already-built Phase 6 endpoint, with zero backend changes required.

**What gets implemented:**
- Kotlin Android app: CameraX for capture, `SensorManager` (`TYPE_ACCELEROMETER`) for the jerk trigger, `FusedLocationProvider` for GPS
- **Simplified trigger logic (24-hour reality):** a hand-tuned moving-average/delta threshold on accelerometer magnitude, tuned via 2–3 short test drives — not a trained LSTM/TCN classifier. State this plainly; it's the honest version of Tier 0 from the improved architecture.
- **Raw GPS only (24-hour reality):** the `FusedLocationProvider` reading at the trigger moment, no EKF sensor fusion. State this plainly too.
- On trigger: capture a frame, read GPS, generate `client_id` (UUID) + SHA-256 `content_hash` — identical shape to what the simulator already produced, so the backend sees no difference
- Room DB local queue + WorkManager upload (basic retry; full offline-resume sophistication stays a documented next step, not built today)
- **Manual "Capture Now" button as a fallback** — if the accelerometer threshold misfires or under-fires during the actual demo drive, the demo isn't dependent on it triggering correctly live

**Exact tasks:**
1. New Android Studio/Gradle project; CameraX, Location, and Sensor permissions declared and requested at runtime
2. Accelerometer listener with a magnitude-over-moving-average threshold; tune the constant against 2–3 real test drives before the demo
3. On trigger (or manual button): CameraX captures a frame → `FusedLocationProvider.getCurrentLocation()` → generate `client_id` + `content_hash`
4. Room table mirroring the `observations` schema; WorkManager enqueues the upload
5. POST to the existing deployed Phase 6 endpoint — verify no backend changes are needed
6. Test end-to-end on a physical device, not just an emulator (emulator GPS/accelerometer are simulated even when the app code is real)

**Expected output:** Real photo+GPS+timestamp rows in the already-built dashboard, sourced from an actual phone, not a script.

**Verification checklist:**
- [ ] App builds and installs on a physical Android device
- [ ] At least one real accelerometer-triggered capture during a test drive reaches the backend successfully
- [ ] The manual capture fallback works independently of the accelerometer trigger
- [ ] GPS coordinates in the resulting row are real device coordinates, not synthetic
- [ ] The dashboard shows these rows identically to how it showed simulator rows — no backend distinction

**Definition of Done (gate to Phase 7):** At least 3–5 real captures (a mix of triggered and manual) visible in the deployed dashboard, sourced from a physical device on at least one real short drive.

---

## End-to-End Observation Trace — Every ID, Every Field, What's Real vs. Simplified

This is the single walkthrough to have memorized before the demo. If asked "walk me through what happens to one photo," this is the exact answer — table by table, ID by ID.

### The eight hops

**1. Capture (real — the Phase 6B Android app)**

| Field | Generated as | Real or simplified |
|---|---|---|
| `client_id` (becomes `observations.id`) | UUID v4, generated on-device at capture time by the real Room DB | **Real** — real app, real device |
| `content_hash` | SHA-256 of the actual captured image bytes | **Real** |
| `gps_lat`, `gps_lon`, `gps_accuracy_m` | Real `FusedLocationProvider` reading at the trigger moment | **Real** — no synthetic coordinates. **Simplified: no EKF fusion**, so accuracy is whatever raw GPS gives at that instant |
| `captured_at` | Real device timestamp | **Real** |
| `device_id` | Real Android device identifier | **Real** |
| Trigger decision itself | Hand-tuned accelerometer moving-average/delta threshold | **Real signal, simplified logic** — not a trained classifier (that's the documented Tier-1 production target) |

This is the one hop that changed most significantly from the earlier plan: it used to be a script standing in for a phone; now it's a real phone. Nothing downstream changed to accommodate this — that's the payoff of having built Phase 6's endpoint against a stable contract from the start.

**2. Upload / Ingest (real — live on Render, unchanged)**

- `POST /observations` receives `client_id`, `content_hash`, GPS fields, image bytes
- Dedup check: `SELECT ... WHERE content_hash = ?` — if it already exists, the endpoint is idempotent and returns the existing row (this is the `client_id`-as-idempotency-key pattern from the plan doc)
- Image uploaded to object storage → `image_uri` returned and stored
- Row inserted: `observations.id = client_id`, `status = 'new'`

**3. Tier 1 attempt — skipped today**

- In the full design, `Tier1Model.predict(image)` would run here first. Tier 1 doesn't exist today (Phase 8 is doc-only), so this hop is a no-op and every observation proceeds directly to Tier 2.

**4. Tier 2 inference (real — live Anthropic call)**

- Before the call: insert into `inference_attempts` — `observation_id = client_id`, `provider = 'anthropic'`, `attempt_number = 1`, `status = 'in_flight'`
- `InferenceProvider.analyze_image()` → `AnthropicVisionAdapter` → real forced tool-call structured-output request
- On response: `inference_attempts.status = 'succeeded'`, `resolved_at` set; Anthropic's own `provider_request_id` captured for support/reconciliation
- Insert into `ai_results`: `observation_id = client_id` (**UNIQUE constraint — first result wins**), `provider`, `provider_request_id`, `model_name`, `model_version`, `prompt_version`, `defect_type`, `severity`, `raw_confidence`, `calibrated_confidence` (looked up from `calibration_buckets`), `latency_ms`, `cost_usd`
- `observations.status` updated: `accepted` / `review` / `rejected` / `recapture`, from the calibrated-confidence routing decision

**4B. Road-segment matching + DLP lookup (real logic, seeded data — the Phase 7B addition)**

- On a `defect_type` result of "pothole," the real `gps_lat`/`gps_lon` from hop 1 is matched against the seeded `road_segments` table via nearest-point distance
- If within the fail-closed threshold: insert into `jurisdiction_matches` with `match_confidence = 'confident'`, joined `contract_id` surfaces contractor name, tender number, responsible officer, and computed `dlp_expiry`
- If outside the threshold: `match_confidence = 'uncertain'` — **no contractor is asserted**, matching Gaurav Sen's verified fail-closed pattern
- This is real matching logic running against real GPS — the simplification is entirely in the *data source* (5–10 seeded rows instead of self-hosted OSRM/Valhalla against real GeoSadak/OSM data)

**5. Human review (real, if routed there)**

- Reviewer action → `review_actions`: `observation_id = client_id`, `reviewer_id`, `decision`, `corrected_defect_type`
- Correction → `eval_labels`: `observation_id = client_id`, `ground_truth_defect_type`, `source = 'reviewer_correction'`
- *(Design-only today)* this same row is what Phase 8's methodology doc describes as future Tier-1 training data — it exists, it's just not being consumed by anything yet

**6. Dashboard / Map display (real)**

- `GET /observations` and `GET /map/observations`, both keyed on `observations.id = client_id`
- Map plots the **real** `gps_lat`/`gps_lon`, popup shows the (real) `ai_results` and, where matched, the contractor/DLP details from hop 4B
- The ArchitectureFlow dashboard screen shows exactly which components are live vs. planned vs. simplified, matching this trace node-for-node

**7. The duplicate-ID edge case (designed, testable today even without Tier 1)**

- If a retry or fallback produces a second result for the same `observation_id`, the `UNIQUE(ai_results.observation_id)` constraint rejects the second insert
- It's redirected to `duplicate_inference_events`: `losing_provider`, `losing_provider_request_id`, `cost_usd` — tracked for reconciliation, never silently dropped, never stored as a second "real" result
- This is testable today by manually double-submitting a Tier-2 call for the same `client_id` — worth doing once as a sanity check, even without the full retry/fallback machinery from Phase 10

**8. Fix Verification (tested with staged photos, not a live re-drive)**

- Two manually captured before/after photos of the same spot, fed through the same Tier-2 structured-output call, compared for "intact repair material covering the same footprint"
- Result written to `fix_verifications` as `fixed` / `still_open` / `ambiguous`
- Proves the comparison logic works without requiring an actual second pass over the same pothole during a live demo

### One `client_id`, seven tables, one story

```
client_id (UUID, generated at real capture on a real device)
   │
   ├─→ observations.id                     (row created at ingest)
   ├─→ inference_attempts.observation_id   (written before the Tier-2 call)
   ├─→ ai_results.observation_id           (UNIQUE — the result, once)
   ├─→ jurisdiction_matches.observation_id (road/DLP match, confident or uncertain)
   ├─→ review_actions.observation_id       (if a human touches it)
   ├─→ eval_labels.observation_id          (ground truth, from seed or correction)
   └─→ duplicate_inference_events.observation_id   (only if something raced)
```

One ID, generated once, on a real device — carried, unchanged, through every table in the system. That single fact is what makes the dedup, idempotency, and jurisdiction-match claims checkable with one SQL query (`SELECT * FROM ... WHERE observation_id = '<uuid>'` across every table) instead of something you'd have to take on faith.

---

## Phase 7 — AI/Vision/LLM Provider Abstraction (Tier 2: Frontier Model)

**Objective:** The application never imports a provider SDK directly. The frontier vision model is reachable only through a clean internal contract.

**Goal:** `analyze_image()` returns a normalized, schema-validated result — regardless of which provider adapter is behind it today.

**What gets implemented:** (architecture fully specified in the plan doc §8–§13; this phase builds it)
- `InferenceProvider` protocol: `analyze_image(image, context) -> InferenceResult`
- `AnthropicVisionAdapter`: real implementation — forced tool-call structured output, no `anthropic.messages.create()` calls anywhere outside this module
- `OpenAIVisionAdapter`, `GeminiVisionAdapter`: stub classes (signature + docstring only) proving the seam is real
- Normalized `InferenceResult` contract: `observation_id, defect_type, severity, confidence, evidence, provider, model, model_version, provider_request_id, attempt_id, latency_ms, usage, cost_usd`
- `inference_attempts` idempotency ledger table (per plan doc §13): written before every call, resolved to `succeeded` / `failed` / `unknown`
- Retry (same provider, transient errors, backoff) explicitly separate from fallback (different provider, only after retries exhaust) — even with one real provider live, the retry path is real and testable now

**Exact tasks:**
1. Define `InferenceProvider` Protocol and `InferenceResult` Pydantic model in `backend/inference/base.py`
2. Implement `AnthropicVisionAdapter` in `backend/inference/anthropic_adapter.py`: forced tool-call schema for `{defect_type, severity, confidence, evidence}`
3. Write `inference_attempts` migration; wire the ledger write before every call and status update after
4. Implement retry-with-backoff (transient errors: timeout, 429, 5xx) inside the adapter's sync path
5. Add `POST /observations/{id}/analyze` (sync, for testing) calling `AnthropicVisionAdapter` through the protocol only
6. Add stub `OpenAIVisionAdapter` / `GeminiVisionAdapter` — enough to prove the interface is provider-agnostic, not enough to spend the day on
7. PR + merge; deploy; run against 5–10 real observations from Phase 6

**Expected output:** Real, structured, schema-validated AI results attached to real observations, on the deployed backend, with zero provider-specific code outside the adapter module.

**Verification checklist:**
- [ ] `grep -r "anthropic\." backend/ --include="*.py" -l` returns only files inside `backend/inference/anthropic_adapter.py`
- [ ] A forced malformed-schema test (mock a bad response) is caught and does not crash the endpoint
- [ ] `inference_attempts` shows a row for every call, correctly resolved
- [ ] Result rows in `ai_results` include `provider`, `model_version`, `cost_usd`, `latency_ms` — all real, not placeholder values

**Definition of Done (gate to Phase 7B):** Tier-2 inference works end-to-end on the deployed stack through the abstraction only; idempotency ledger proven; stub adapters exist.

---

## Phase 7B — Road-Segment Matching (Simplified) + DLP Lookup (Seeded)

**Objective:** Prove the DLP/contractor-accountability differentiation end-to-end, honestly scoped — real matching logic, seeded data, fail-closed behavior, not a live map-matching engine or real government dataset ingestion.

**Goal:** A confirmed pothole result gets matched against a small, manually-seeded set of road segments and contracts, producing either a confident contractor/officer identification or an explicit "uncertain" result — never a guess.

**What gets implemented:**
- `road_segments` and `contracts` tables (per `infrascan_final_architecture.md` schema), seeded with 5–10 rows approximating the actual test-drive route — real-format DLP fields (`completion_date`, `dlp_years`, computed `dlp_expiry`, `contractor_name`, `tender_number`, `responsible_officer`)
- `jurisdiction_matches` table
- **Simplified matching (24-hour reality):** nearest-segment-by-haversine-distance against the seeded rows — not self-hosted OSRM/Valhalla HMM map matching. That stays the documented production target.
- Fail-closed threshold: distance beyond a fixed radius (e.g. 50m) → `match_confidence = 'uncertain'`, no contractor asserted — this is the real, non-negotiable behavior, adopted directly from the verified Gaurav Sen pattern

**Exact tasks:**
1. Seed `road_segments`: 5–10 rows with lat/lon points along the actual demo drive route
2. Seed `contracts`: matching sample rows with plausible PMGSY-style DLP data; compute `dlp_expiry = completion_date + dlp_years`
3. Implement nearest-segment matching (haversine distance to each seeded point, take the minimum), threshold-gated
4. On Tier-2 result ingestion (hop 4B in the trace above), write `jurisdiction_matches` with `match_confidence`
5. Surface the match (or "uncertain") on the review/detail screen — contractor, tender number, officer, DLP status when confident; a clear "uncertain — needs manual confirmation" state when not

**Expected output:** At least one demo observation resolves to a confident contractor/officer match; at least one deliberately out-of-range observation resolves to "uncertain" — both demonstrated live.

**Verification checklist:**
- [ ] Confident-match case displays contractor, tender number, officer, and DLP status on the dashboard
- [ ] Out-of-range case displays "uncertain," never a guessed contractor
- [ ] `dlp_expiry` computes correctly from seeded `completion_date` + `dlp_years`
- [ ] Both cases are reproducible on demand, not one-time flukes

**Definition of Done (gate to Phase 8):** Both the confident-match and fail-closed-uncertain cases demonstrated live against seeded data, matching logic real, data source explicitly labeled as seeded on the ArchitectureFlow screen.

---

## Phase 8 — Own-Model Cascade Layer (Tier 1) & In-House Training Methodology

**⚠️ TODAY'S SCOPE CHANGE: this phase is design-only.** No training script runs, no `model_versions` table gets populated, no Tier-1 model exists in the deployed system today. Everything below through step 6 of the methodology is written up in `docs/model-training-methodology.md` and referenced in the interview — nothing is executed. The "What gets implemented" / "Exact tasks" / verification checklist further down describe the **full production version**, to be built after today, not today's deliverable. Faking a trained model on almost no data would be a worse signal than an honest, well-reasoned design doc — say exactly that if asked.

**Objective (production version, not today):** Prove the model cascade (plan doc §0c/§8/§12) is real, not narrated — our own model handles the majority of volume; the frontier model is teacher/escalation-only.

**Goal (production version, not today):** A versioned, calibration-gated Tier-1 model exists; a documented training/promotion loop exists and has been run at least once.

**Training methodology (write this in `docs/model-training-methodology.md` and state it explicitly in the interview — this is the actual deliverable for today):**

This follows the teacher-student active-distillation pattern documented in production ML literature — closest published precedent is Amazon's **Performance-Guided Knowledge Distillation (PGKD)**: an LLM teacher labels data, a small task-specific student model trains on those labels, and an active-learning loop (hard-negative mining + student validation performance) decides what the teacher labels next. Applied here:

1. **Cold start:** all traffic routes to Tier 2 + human review (already true from Phase 7). Every accepted/corrected result is a labeled example.
2. **Bootstrap training set:** once enough labeled examples exist (demo-scale: the 15–20 hand-labeled seed set + whatever Phase 7 generated), train Tier-1 model v1.
3. **Model choice, stated honestly for the demo:** a frozen pretrained vision backbone (e.g., a small CLIP/MobileNet embedding extractor) + a lightweight classifier head (logistic regression or a small MLP) trained on the seed embeddings — trains in seconds to minutes, appropriate for a 1-day build. The stated production target (documented, not built today) is a fine-tuned YOLO-class detector or a domain-adapted vision foundation model (the NV-DINOv2 precedent from the plan doc §0c) once real training volume exists.
4. **Active learning / hard-negative mining:** cases where Tier-1's calibrated confidence is low, or where Tier-1 and Tier-2 disagree, are prioritized as the next labeling target for Tier 2 — this is the PGKD active-learning step, applied to our cascade.
5. **Evaluation-gated promotion:** a new Tier-1 `model_version` is only promoted if its precision/recall/F1 on the held-out golden eval set is ≥ the currently deployed version — the same CI-gate philosophy already used for prompt versions, now applied to model versions.
6. **Calibration recompute:** `calibration_buckets` recomputed for Tier 1 specifically after every retrain — this is what drives `tier1_escalation_rate` down over successive versions, and it's the metric that proves the loop is working.

**What gets implemented:**
- `backend/models/tier1_classifier.py`: training script (embedding extraction + classifier fit), versioned artifact saved to object storage
- `Tier1Model` wrapper implementing the same result-shape contract as `InferenceProvider`, so routing code doesn't care which tier produced a result
- Calibration-gated routing: Tier-1 result used directly if calibrated confidence is above threshold; otherwise escalates to Tier 2 (Phase 7's path)
- `model_versions` table: version id, training-set size, eval metrics, promoted (bool), created_at
- A retrain/promote script (`scripts/retrain_tier1.py`) runnable on demand (Render Background Worker cron in Phase 9; manual for now)

**Exact tasks:**
1. Write `scripts/retrain_tier1.py`: pull labeled examples from `eval_labels` + `review_actions`, extract embeddings, fit classifier, save artifact + metrics to `model_versions`
2. Implement `Tier1Model.predict(image) -> InferenceResult` with `calibrated_confidence` populated from `calibration_buckets`
3. Update the routing logic: `Tier1Model.predict()` first; if `calibrated_confidence < threshold`, call `InferenceProvider.analyze_image()` (Tier 2)
4. Run the retrain script once against the seed set → produces `model_version=v1` (expected: low accuracy, small training set — state this honestly)
5. Feed 5–10 new Tier-2/human-corrected results back into the training set, rerun retrain → `model_version=v2`, confirm the promotion gate correctly compares v2's eval metrics against v1's before promoting
6. PR + merge; deploy

**Expected output (production version):** A real (if weak) Tier-1 model in production, a real promotion-gated retrain cycle that has run at least twice, and a measurable `tier1_escalation_rate`.

**Verification checklist (production version):**
- [ ] `model_versions` table has ≥2 rows with real, different eval metrics
- [ ] The promotion gate correctly refused to promote a worse version in at least one deliberate test (train a v3 on a deliberately corrupted/small subset, confirm it's rejected)
- [ ] `tier1_escalation_rate` is a real, queryable number, not hardcoded
- [ ] At least one observation was resolved by Tier 1 alone (no Tier-2 call), and this is visible/distinguishable in the data

**Definition of Done — TODAY:** `docs/model-training-methodology.md` exists, references PGKD explicitly, and describes all 6 steps above. Nothing is executed. The ArchitectureFlow dashboard screen (Phase 16) shows Tier 1 as `PLANNED — NOT BUILT`, with the dashed-amber routing arrow to Tier 2 — the UI must not imply Tier 1 is live.

**Definition of Done — production version (not today, next phase after the demo):** The cascade is real end-to-end; the retrain/promotion loop has executed more than once.

---

## Phase 9 — Production-Style Processing Architecture

**Objective:** Move from synchronous per-request calls to the real orchestration design: batch accumulation, async processing, a dedicated worker.

**Goal:** A Render Background Worker service runs the batch orchestrator independently of the web service, sharing the same Postgres DB.

**What gets implemented:**
- Second Render service: **Background Worker**, running `backend/worker/orchestrator.py`
- Batch accumulation window (time- or size-based) collecting dedup'd, Tier-1-escalated observations
- `BatchProvider` protocol + `AnthropicBatchProvider` adapter (submit/poll/ingest against the frontier provider's batch API)
- Sync fast-path retained for `urgent_flag = true` observations only (small, separate, low-volume by design)
- Job state machine on `observations.status`: `new → tier1_processing → (accepted | escalated) → batched → tier2_processing → accepted/review/rejected/recapture`

**Exact tasks:**
1. Create `backend/worker/orchestrator.py`: polling loop — pull escalated observations, accumulate into a batch, submit via `BatchProvider`, poll for completion, ingest results idempotently (unique constraint on `observation_id`, per plan doc §13)
2. Add a second service to `render.yaml`: `type: worker`, same repo, different start command (`python -m backend.worker.orchestrator`), same `DATABASE_URL`
3. Implement `BatchProvider` protocol + `AnthropicBatchProvider`
4. Implement the sync fast-path endpoint for `urgent_flag` observations, bypassing the batch window entirely
5. Deploy the worker service on Render; confirm it starts and logs a heartbeat
6. Run the simulator (Phase 6 script) with a mix of normal and `urgent_flag=true` observations; confirm normal ones flow through the batch path and urgent ones resolve faster via the sync path

**Expected output:** Two independently deployed Render services cooperating through Postgres — the web service handles requests, the worker handles background processing — matching the real production shape, not a single-process shortcut.

**Verification checklist:**
- [ ] Render dashboard shows two healthy services: web + worker
- [ ] Worker logs show batch accumulation, submission, and ingestion events
- [ ] Urgent-flagged observations visibly resolve faster than batched ones in the dashboard
- [ ] Restarting the worker service mid-batch does not lose or duplicate observations (manual test: redeploy the worker while a batch is in flight, confirm state after restart)

**Definition of Done (gate to Phase 10):** Two-service architecture live and proven resilient to a worker restart mid-batch.

---

## Phase 10 — Reliability: Retries, Timeouts, Rate Limits, Concurrency, Backpressure

**Objective:** The failure-handling design from the plan doc (§17) is implemented and demonstrably works, not just documented.

**Goal:** Inject each major failure mode and confirm the system recovers correctly, without duplication or silent loss.

**What gets implemented:**
- Token-bucket rate limiter in front of Tier-2 calls, sized to the provider's real per-minute limit
- Concurrency cap (semaphore) on the worker's batch-submission loop
- Dead-letter table + capped-retry/backoff (exponential + jitter) for malformed/failed results
- `duplicate_inference_events` handling for the ambiguous-timeout-then-fallback case (plan doc §13)
- Backpressure: if the DLQ depth exceeds a threshold, the orchestrator pauses new batch submissions rather than piling on more failures

**Exact tasks:**
1. Implement a simple token-bucket limiter class, configured from the provider's documented rate limit
2. Wrap Tier-2 calls with capped retry (3 attempts, exponential backoff + jitter) for transient errors; on exhaustion, write to `dead_letter_results`
3. Implement `GET /dlq` and `POST /dlq/{id}/replay` endpoints; add a DLQ view to the frontend dashboard
4. Implement the backpressure check in the orchestrator loop: `if dlq_depth > threshold: pause_new_submissions()`
5. Write a fault-injection script (`scripts/inject_failures.py`) that forces a percentage of calls to time out, return malformed JSON, or return a 429 — run it against a staging batch
6. Confirm: DLQ catches the injected failures, replay recovers them, no duplicate `ai_results` rows appear, backpressure engages and releases correctly

**Expected output:** A system that degrades gracefully and visibly under injected failure, recoverable from the dashboard without a redeploy.

**Verification checklist:**
- [ ] Fault-injection run with 10%+ simulated failures results in zero data loss (every observation ends in a terminal, correct state)
- [ ] `dead_letter_results` populated correctly with failure reason and retry count
- [ ] Replay from the dashboard successfully reprocesses a DLQ'd observation
- [ ] Backpressure visibly pauses submission when DLQ depth crosses the threshold, and resumes after it clears
- [ ] No duplicate rows in `ai_results` after a deliberately forced ambiguous-timeout-then-fallback scenario

**Definition of Done (gate to Phase 11):** All failure modes in plan doc §17 have been deliberately triggered and confirmed handled correctly, on the deployed stack.

---

## Phase 11 — Persistence & Storage Hardening

**Objective:** Confirm the data layer is actually production-shaped, not just "happens to work in a demo."

**Goal:** Postgres schema is migration-managed, indexed appropriately, and backed up; object storage lifecycle is defined.

**What gets implemented:**
- Alembic migration history reviewed and squashed/cleaned
- Indexes added: `observations(status)`, `observations(gps_lat, gps_lon)` (for map bbox queries), `ai_results(observation_id)`
- Render Postgres automated backups confirmed enabled (available on paid tiers — note the free-tier limitation explicitly)
- Object storage lifecycle policy documented: retention, what happens to images after an observation is terminal-state

**Exact tasks:**
1. Review full migration history; confirm every schema change in this playbook has a corresponding migration file (not manual dashboard edits)
2. Add the indexes listed above via a migration
3. Confirm Render Postgres backup settings; document the free-tier limitation ("free Postgres is not intended for production use" — upgrade before real launch)
4. Write `docs/data-retention-policy.md`: how long images are kept, what triggers deletion, GDPR/PII considerations if any

**Expected output:** A schema and storage layer an incoming engineer could understand and trust from the migration history alone.

**Verification checklist:**
- [ ] `alembic history` shows a clean, linear migration chain
- [ ] Query plans (`EXPLAIN ANALYZE`) on the queue and map endpoints use the new indexes, not sequential scans
- [ ] Backup status confirmed and documented
- [ ] Data retention policy document exists

**Definition of Done (gate to Phase 12):** Schema, indexing, and storage lifecycle reviewed and documented, not just working by accident.

---

## Phase 12 — Observability & Logging

**Objective:** When something breaks in production, the first move is checking a dashboard, not adding print statements and redeploying.

**Goal:** Structured logs, key metrics, and basic tracing exist for every major operation.

**What gets implemented:**
- Structured (JSON) logging across web service and worker, with a consistent `observation_id` correlation field
- `/metrics/summary` and `/metrics/eval` endpoints (per plan doc §14) actually populated from real data
- Render's built-in log stream confirmed usable for debugging a live issue
- Basic alerting: a simple check (even a scheduled script) that flags if DLQ depth or error rate crosses a threshold

**Exact tasks:**
1. Configure Python's `logging` module for JSON output; include `observation_id`, `provider`, `model_tier`, `latency_ms` on relevant log lines
2. Wire `/metrics/summary` to real aggregate queries (cost, latency, review rate, failure rate, Tier1/Tier2 split)
3. Confirm Render's log viewer shows the structured logs and is searchable/filterable enough to debug a specific `observation_id`
4. Add a simple scheduled check (Render Cron Job) that queries DLQ depth and error rate, logging a warning if thresholds are crossed (email/Slack webhook optional, log-visible minimum required)

**Expected output:** Given an `observation_id`, its full history — capture, Tier-1 attempt, Tier-2 escalation if any, review — is reconstructable from logs and the dashboard alone.

**Verification checklist:**
- [ ] Picking a random `observation_id`, its full processing history is traceable through logs
- [ ] `/metrics/summary` returns real, current numbers (confirm by comparing to a manual DB query)
- [ ] The scheduled threshold check has been manually triggered (force DLQ depth up) and confirmed to fire

**Definition of Done (gate to Phase 13):** A production issue could be debugged from logs/metrics alone, without redeploying to add instrumentation.

---

## Phase 13 — Testing

**Objective:** Confidence that a change doesn't silently break the pipeline, enforced automatically, not just "I tested it manually."

**Goal:** GitHub Actions runs the test suite on every PR; `main`'s branch protection (Phase 2) actually blocks merges on failure.

**What gets implemented:**
- Unit tests: dedup logic, calibration bucket computation, idempotency ledger state transitions, structured-output schema validation
- Integration tests: `POST /observations` → dedup → storage, against a test Postgres instance
- Contract tests for `InferenceProvider` adapters: the stub `OpenAIVisionAdapter`/`GeminiVisionAdapter` are tested against the same interface contract as the real Anthropic adapter, proving swappability isn't just claimed
- GitHub Actions workflow: `.github/workflows/test.yml`

**Exact tasks:**
1. `pip install pytest pytest-asyncio httpx`
2. Write unit tests for: content-hash dedup, calibration bucket math, DLQ state transitions
3. Write integration tests using a test Postgres (GitHub Actions service container) for the ingest → dedup → store path
4. Write a shared contract test suite run against every `InferenceProvider` implementation (real and stub), asserting each returns a schema-valid `InferenceResult`
5. Write `.github/workflows/test.yml`: runs on every PR, spins up test Postgres, runs `pytest`
6. Update the branch protection rule (Phase 2) to require this check passing before merge

**Expected output:** A red/green CI check on every PR; merges are blocked on failure.

**Verification checklist:**
- [ ] Opening a PR shows the CI check running and passing
- [ ] Deliberately breaking a test (e.g., dedup logic) and pushing shows CI fail and the merge button blocked
- [ ] Contract tests pass identically against the real and stub `InferenceProvider` implementations

**Definition of Done (gate to Phase 14):** CI enforced on `main`, confirmed to actually block a broken PR.

---

## Phase 14 — Load Testing

**Objective:** Prove the orchestration layer (the part that's actually ours — see plan doc §19) holds up under volume, without spending real money faking scale.

**Goal:** Run the load-testing methodology from the plan doc against the deployed stack; record real throughput/failure-recovery numbers.

**What gets implemented:**
- `scripts/load_test.py`: fires 1,000–5,000 synthetic observations through the real deployed ingestion/dedup/DLQ/calibration code, with Tier-2 calls stubbed (latency/shape sampled from real calls captured earlier)
- `load_test_runs` table (plan doc §13) capturing results
- A results view on the frontend dashboard

**Exact tasks:**
1. Capture latency/response-shape samples from ~20 real Tier-2 calls made in earlier phases
2. Write the stub that replays those samples with realistic jitter
3. Run `load_test.py` against the live Render deployment at increasing worker concurrency (1, 2, 4)
4. Record: dedup correctness (zero duplicate rows), DLQ recovery rate under injected failures, throughput at each concurrency level, p50/p95 latency
5. Write results to `load_test_runs`; surface on the dashboard
6. Document explicitly in the README which parts were stubbed and why (plan doc §19's transparency point)

**Expected output:** Real, measured numbers proving the orchestration layer doesn't have a bottleneck — not a claim, a benchmark.

**Verification checklist:**
- [ ] Load test run completes against the live deployment without manual intervention
- [ ] Zero duplicate `ai_results` rows after the run, confirmed by query
- [ ] Throughput scales with concurrency (near-linear until a documented ceiling)
- [ ] Results are visible on the dashboard, sourced from `load_test_runs`, not hardcoded

**Definition of Done (gate to Phase 15):** At least one full load-test run completed and recorded against the live deployed stack.

---

## Phase 15 — Production-Readiness Checks

**Objective:** A final pass through everything that's easy to skip under deadline pressure but obvious in its absence to an experienced reviewer.

**Goal:** Secrets, error handling, and operational basics are genuinely in place, not assumed.

**What gets implemented:**
- Secrets audit: no API keys/credentials in git history, all in Render/Vercel environment variables
- CORS tightened from the wildcard used in Phase 5 to the exact production domain(s)
- Rate limiting on public-facing endpoints (basic, e.g. per-IP on `/observations`)
- `docs/runbook.md`: what to do if the worker dies, DLQ depth spikes, or a provider outage occurs
- Health checks confirmed on both Render services (web + worker)

**Exact tasks:**
1. `git log -p | grep -i "api_key\|secret\|password"` (and a proper secret-scanning tool if available) — confirm clean history
2. Tighten CORS to the exact Vercel production domain + a documented preview pattern, not a bare wildcard
3. Add basic per-IP rate limiting middleware on `/observations`
4. Write `docs/runbook.md` covering the failure scenarios from Phase 10, with the exact dashboard steps to diagnose and recover
5. Confirm Render's health check path is configured for both services (so Render itself restarts a hung service)

**Expected output:** A system that wouldn't visibly embarrass you if a technical founder opened the GitHub repo and Render dashboard cold.

**Verification checklist:**
- [ ] No secrets found in git history
- [ ] CORS allows only the intended domains
- [ ] Rate limiting confirmed working (manual burst test returns 429 past the threshold)
- [ ] Runbook exists and covers every failure mode exercised in Phase 10
- [ ] Both Render services show a passing health check in the dashboard

**Definition of Done (gate to Phase 16):** Production-readiness checklist fully passed.

---

## Phase 16 — Final End-to-End Demo

**Objective:** Everything actually built (Phases 1–7B, Phase 8 as a doc, not Phases 9–15) comes together into a rehearsed demo, performed against the live deployed stack — not localhost, and against a real Android device. AI output leads; infrastructure supports it.

**Goal:** A rehearsed, working, deployed demonstration where the real Tier-2 output is the opening beat, real road/DLP matching shows both its confident and fail-closed behavior, and the ArchitectureFlow screen makes the live/simplified/planned boundary visible without you having to explain it verbally.

**What gets implemented:**
- `ArchitectureFlow.jsx` updated to reflect the real Android app (live), simplified road matching (amber "simplified," not planned), seeded DLP (amber "seeded data"), and Tier 1/EKF/self-hosted map matching (still amber "planned")
- Demo rehearsal against the live Vercel + Render URLs, from a real phone, in **AI-output-first order** (below)
- Backup: a recorded video of the same demo, including the real drive/capture moment, in case of live network/GPS/provider issues
- Final `README.md`, filled in properly (architecture diagram, quickstart, what's real/simplified/simulated, ID/data-flow trace, cost model, current eval metrics)

**Demo order — AI-output-first, not architecture-first:**
1. Open on the **ArchitectureFlow screen** for 15 seconds — "here's the full system I designed; green is live, amber is simplified or planned, and here's exactly which is which"
2. **Real capture, live**: trigger a real accelerometer-detected capture (or use the manual fallback if needed), show it appear in the queue within seconds
3. Show the **real Tier-2 structured result** — defect_type, severity, calibrated confidence — this is the centerpiece
4. Show the **road/DLP match**: one confident case (contractor, tender, officer, DLP status) and one deliberately out-of-range case showing "uncertain" — this is the differentiation, demonstrate both states
5. Show a deliberately poor/ambiguous photo correctly landing in review, not a false accept
6. Correct it live; point at the `eval_labels` row and say the PGKD-teacher-data sentence from Phase 8
7. Show the **Fix Verification** result from the two staged before/after photos
8. Show the map with real AI output at real GPS coordinates
9. Close by returning to the ArchitectureFlow screen: "here's exactly what I'd build next, in order" — pointing at Phases 9–15 and the documented production targets (on-device Tier 1, EKF, self-hosted OSRM/Valhalla)

**Exact tasks:**
1. Update `ArchitectureFlow.jsx` node statuses to match the real 7B scope
2. Rehearse the full script end-to-end at least twice, including a real drive/capture if at all possible before the actual call
3. Record a backup video of the same run
4. Finalize `README.md`, including the ID/data-flow trace, the JD-coverage table, and the explicit simplified/mocked table from Phase 0b
5. Confirm the Render web service is on a paid tier (or pre-warmed) for the actual live demo

**Expected output:** A live, rehearsed, deployable-on-demand demo that opens with real intelligence from a real device, not a diagram — with the diagram available as proof of the rest of the thinking, not as a substitute for it.

**Verification checklist:**
- [ ] ArchitectureFlow screen live on the deployed frontend, statuses match what's actually running (no node shown live that isn't, nothing simplified shown as fully planned)
- [ ] Full demo script runs live against production URLs and a real device, AI-output-first order, without manual database seeding mid-demo (seeded DLP data is fine — that's disclosed; seeding an `observations` row live to fake a capture is not)
- [ ] Both confident and uncertain road/DLP match cases reproducible on demand
- [ ] Backup video recorded and accessible
- [ ] README includes the ID/data-flow trace, the JD-coverage table, and the simplified/mocked table
- [ ] Render service confirmed warm/paid ahead of the actual call

**Definition of Done:** Ready to schedule the founder call.

---

# Consolidated Reference

This section has three tiers, on purpose — don't merge them. **"Done"** is complete and unchanged. **"Today"** is real logic against simplified/seeded data, built for the remaining time. **"Roadmap"** is the full production target, not built. Presenting these as one list is exactly the blurring this whole conversation has been correcting for.

## Complete Phase Checklist

- [x] Phase 1 — Repository & Project Initialization — **Done**
- [x] Phase 2 — GitHub Setup & Branching/Commit Workflow — **Done**
- [x] Phase 3 — Frontend Foundation + Vercel Deployment — **Done**
- [x] Phase 4 — Backend Foundation + Render Deployment — **Done**
- [x] Phase 5 — Frontend ↔ Backend Integration — **Done**
- [x] Phase 6 — Core Application Pipeline (ingest/dedup/storage) — **Done, unchanged**
- [ ] Phase 6B — Real Android Capture App — **Today — the centerpiece change**
- [ ] Phase 7 — AI/Vision/LLM Provider Abstraction (Tier 2) — **Today — real AI centerpiece**
- [ ] Phase 7B — Road-Segment Matching + DLP Lookup — **Today, simplified/seeded**
- [ ] Phase 8 — Own-Model Cascade Layer (Tier 1) & Training Methodology — **Doc only** (`docs/model-training-methodology.md`, no code runs)
- [ ] Phase 9 — Production-Style Processing Architecture — Roadmap
- [ ] Phase 10 — Reliability: Retries, Timeouts, Rate Limits, Backpressure — Roadmap
- [ ] Phase 11 — Persistence & Storage Hardening — Roadmap
- [ ] Phase 12 — Observability & Logging — Roadmap
- [ ] Phase 13 — Testing — Roadmap
- [ ] Phase 14 — Load Testing — Roadmap
- [ ] Phase 15 — Production-Readiness Checks — Roadmap
- [ ] Phase 16 — Final End-to-End Demo — **Today**, scaled to what's actually live

## Final Architecture Overview

**What's actually deployed/built:**

```
GitHub (main, protected, PR-only)
   |
   ├── Vercel (frontend, React/Vite) — LIVE
   |      - queue, review, map, eval, ArchitectureFlow screens
   |
   └── Render — LIVE
          ├── Web Service (FastAPI) — ingestion, dedup, Tier-2 inference,
          |     road/DLP matching, API
          └── Managed Postgres — observations, ai_results, inference_attempts,
                duplicate_inference_events, eval_labels, review_actions,
                road_segments (seeded), contracts (seeded), jurisdiction_matches,
                fix_verifications

Capture layer: real Android app (Phase 6B) — CameraX + accelerometer trigger
  (hand-tuned threshold) + FusedLocationProvider GPS (raw, no EKF)

Inference layer:
   Tier 0: NOT BUILT — no on-device vision gate; accelerometer trigger only
   Tier 1: NOT BUILT (doc only — docs/model-training-methodology.md)
   Tier 2: InferenceProvider protocol → AnthropicVisionAdapter (real, live) —
           doing 100% of inference volume
   Human review: real, feeds eval_labels

Road/DLP layer: real matching logic (nearest-segment, fail-closed threshold)
  against seeded road_segments/contracts — NOT self-hosted OSRM/Valhalla
```

**The full production target** (roadmap — Phases 9–15 plus the documented upgrades from `infrascan_final_architecture.md`):

```
GitHub (main, protected, PR-only)
   |
   ├── Vercel (frontend, React/Vite)
   |      - auto-deploy on push to main, preview deployment per PR
   |
   └── Render
          ├── Web Service (FastAPI) — ingestion, API, dashboard endpoints
          ├── Background Worker — batch orchestrator, DLQ sweep, calibration/retrain
          ├── Self-hosted OSRM/Valhalla — HMM map matching against real
          |     GeoSadak/OSM road-network data
          ├── Managed Postgres — + dead_letter_results, model_versions,
          |                       calibration_buckets, load_test_runs
          └── (external) S3/R2 object storage — images

Capture layer: EKF fusing accelerometer + gyroscope + GPS; capture-source
  agnostic (phone, dashcam, or existing fixed CCTV)

Inference layer (full target):
   Tier 0: trained on-device model (PyTorch→ONNX→TFLite pipeline)
   Tier 1: our own model (calibration-gated) — production workhorse
   Tier 2: InferenceProvider protocol → AnthropicVisionAdapter (real) /
           OpenAIVisionAdapter, GeminiVisionAdapter (stub) — teacher/escalation-only
   Human review: ground truth for eval + Tier-1 retraining

Road/DLP layer: real GeoSadak/OSM data ingestion, Open311 routing where
  available, live government submission
```

## Final Deployment Checklist

**Done:**
- [x] `main` branch protected, PR-only (CI itself is Phase 13 — the branch rule exists, the check it gates on doesn't yet)
- [x] Vercel: production + preview deployments both confirmed working
- [x] Render Web Service: health check configured
- [x] Render Postgres: connected, migrations applied
- [x] Object storage: images persisted outside Render's ephemeral disk
- [x] Environment variables: no secrets in git, all in Vercel/Render env settings

**Today:**
- [ ] Render Web Service: paid/pre-warmed specifically for demo day
- [ ] CORS: tightened to real domains, not wildcard
- [ ] `road_segments`/`contracts` seeded and verified against the actual demo route

**Roadmap:**
- [ ] Render Background Worker: running, confirmed resilient to restart mid-batch
- [ ] Render Postgres: automated backups confirmed
- [ ] Rate limiting on public endpoints
- [ ] Self-hosted OSRM/Valhalla instance
- [ ] Runbook covering every injected failure mode

## Final End-to-End Verification Checklist

**Today — walk the ID trace above, live, and confirm each hop:**
- [ ] Real Android capture (accelerometer-triggered or manual) → dedup (`content_hash`) → storage — verified against live deployment, from a physical device
- [ ] Tier 2 call produces a schema-valid, structured result — real, on screen, not a mock
- [ ] Road/DLP match shows both a confident case (contractor/tender/officer/DLP status) and an out-of-range "uncertain" case — the fail-closed behavior demonstrated live
- [ ] Calibrated-confidence routing correctly sends a hard case to REVIEW, not a false accept
- [ ] A reviewer correction updates `eval_labels`, visibly, live
- [ ] Fix Verification correctly classifies the staged before/after photo pair
- [ ] `SELECT * FROM ... WHERE observation_id = '<uuid>'` across `observations`, `inference_attempts`, `ai_results`, `jurisdiction_matches`, `review_actions`, `eval_labels` returns a consistent, single-ID trace
- [ ] ArchitectureFlow screen accurately reflects live vs. simplified vs. planned — no mismatch between the screen and what's actually running
- [ ] Full AI-output-first demo script (Phase 16) runs live against production URLs and a real device

**Full production target (roadmap, not verified today):**
- [ ] Self-hosted OSRM/Valhalla match confidence used instead of nearest-point distance
- [ ] Tier 1 resolves the majority of a batch directly, calibration gate visible
- [ ] Model promotion gate correctly accepted an improved version and rejected a worse one
- [ ] DLQ + replay demonstrated against an injected failure
- [ ] Load test results present and real, sourced from `load_test_runs`

## What Should Be Visible/Working in the Final Demo

**Today:**
- Live Vercel URL, live Render URL — not localhost
- ArchitectureFlow screen, opened first, accurately showing live vs. simplified vs. planned
- A real accelerometer-triggered (or manual) capture from a physical Android device, live
- A real image producing a real, structured Tier-2 result on screen — the centerpiece moment
- A confident road/DLP match (contractor, tender, officer) and an "uncertain" fail-closed case, both demonstrated
- One deliberately hard example correctly routed to review, not auto-accepted
- A live human correction, visibly updating the eval set
- The Fix Verification result from staged before/after photos
- Map with real AI output at real GPS coordinates
- README with the ID/data-flow trace, the JD-requirement coverage table, and the explicit simplified/mocked table

**Explicitly not shown today, and said out loud rather than hidden:**
- A trained Tier-1 model, `tier1_escalation_rate`, or any `model_versions` row
- An on-device vision gate or EKF sensor fusion — accelerometer trigger and raw GPS only
- Self-hosted OSRM/Valhalla — road matching is nearest-point against seeded data
- Real GeoSadak/OSM data ingestion — 5–10 seeded contract records only
- Live government submission — draft-only, human-reviewed
- DLQ recovery, load-test numbers, or the batch/worker split
