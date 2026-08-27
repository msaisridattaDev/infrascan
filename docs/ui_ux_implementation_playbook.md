# InfraScan — UI/UX Reference Synthesis & Implementation Playbook

*Written after a rapid reference audit of RoadWatch, CivicLens, FixMyStreet, Spothole, and Civix. Purpose: stop iterating blindly on visual design, lock one direction, and hand the next session an exact, orderable task list — not a re-derivation exercise.*

## How to use this doc

This is the single source of truth for "what are we building and in what order" for the UI/UX pass. Read the reference audit once, then work top-to-bottom through the Implementation Order section. Don't re-litigate the reference choices mid-build — they're locked below.

---

## 1. Reference audit — what each source is good at, and what we take from it

### RoadWatch (`roadwatch-in.vercel.app` — municipal ops dashboard, reference screenshots)
A polished **operations/back-office** view for a road authority (Kolkata Municipal Corporation framing). Four screens: Live detection, Defects (map), Accountability, Field app.

**Take:**
- Stat-card row pattern: 4 compact cards (big number + label) summarizing the whole system at a glance — we already built this (Total/Under Review/Accepted/Avg Confidence)
- Severity-colored map markers with a legend (dot size/color = severity) — we already built this with Leaflet `CircleMarker`
- Report-card list pattern: thumbnail + title + severity badge + confidence + age/SLA badge (e.g. "41 DAYS OPEN", "3RD REPORT") — **age/repeat badges are new, not yet built, and are a cheap, high-impact addition**
- Tab structure: Live detection / Defects / Accountability / Field app → maps to our Dashboard / Map / (future) Accountability / Capture
- Dark, minimal telemetry bar under a live camera feed (defects captured, frame, km/h) — **stretch goal only**, not needed for a photo-based (non-video) capture flow
- "Data coverage" trust-building stats block (segments mapped, tenders retrieved, etc.) — nice-to-have for a later polish pass, not core

**Leave out (for now):** the live video + bounding-box overlay screen (needs a video pipeline, not a photo pipeline — out of scope), the Accountability/contractor-liability screen (needs the `jurisdiction_matches`/DLP data model from the original playbook's Phase 7B — real feature, deliberately deferred, not faked)

### CivicLens (mobile app screenshots — citizen-facing reporting app)
A **citizen-facing mobile app** for reporting civic issues broadly (not just roads). Second, deeper screenshot pass covered: Home, a full Report Detail screen, Profile setup, and a Privacy/DPDP disclosure screen.

**Take — layout and hierarchy:**
- Home screen structure: personalized greeting header (with a language selector + notification bell) → hero CTA card → grid of action tiles → "Recent in your area" section → bottom tab bar. This exact top-to-bottom hierarchy (greeting → primary action → secondary actions grid → recent activity → nav) is the pattern to copy for our own Home/Dashboard landing, not just the hero card in isolation.
- Hero CTA card pattern (orange gradient, headline + subtext + ghost-outline button) — already adapted into our Capture tab's dark hero header; **keep our dark variant or switch to a warm accent color, either is fine — the structural pattern matters more than the exact hue**
- Quick-action tile grid (rounded-square icon-in-circle + label, 3 columns) — **new pattern to add**, used as the primary in-app navigation surface into our real features (Capture, Map, Dashboard/My Reports) rather than a flat tab bar alone. Scope to only the tiles we actually have; don't add placeholder tiles for features that don't exist (no Traffic Violation, Scan Signboard, RTI, Rate Leaders — those are CivicLens-specific scope, not ours)
- Bottom tab bar for mobile nav (Home / Explore / My Reports / Profile) — **we currently use a top tab switcher; bottom tab bar is more mobile-native and should replace it.** Ours: Home / Map / Capture (center, elevated) / Reports
- **Report Detail screen — a whole screen type we don't have yet and should add.** Structure, top to bottom: media (photo) → status chip row (type chip + status chip, each with a small icon) → title → description → a lightweight engagement affordance (their "tap to show support" heart — optional for us, skip or repurpose as nothing) → a labeled section ("Take action") → a horizontal row of circular icon-buttons for contact/escalation actions → a secondary list of accountable parties (their "representatives": avatar + name + affiliation) → a location row (pin icon + address) → a comment input bar (pill-shaped text field + send icon) pinned near the bottom. Tapping a report card in our list/map should open this detail view instead of doing nothing, as it does today.
- Status/type chips: pill-shaped, small leading icon, color-coded per state (their red-tinted "Pothole" type chip with a warning icon, orange-tinted "Pending Review" status chip) — upgrade our current plain-text badges to this icon+pill style
- "Take action" contact-icons row (Tweet / Email / SMS / Call / Portal, each a circular icon button with a label underneath) and the "representatives" accountable-party list — **both are real, valuable patterns but need a jurisdiction→contact/contractor data model we don't have yet (this is exactly Phase 7B's `road_segments`/`contracts`/`jurisdiction_matches`).** Build the component now, wire it to real data only once Phase 7B lands; don't fake the data to fill the component early.
- Location row (pin icon + human-readable address) — we currently show raw lat/lon; reverse geocoding is a cheap nice-to-have but not required — component should accept either a formatted address or a coordinate pair
- Comment input bar (rounded pill input + send button) — reserve as a component for the eventual review/correction flow (original playbook's `review_actions`/`eval_labels`), not needed for today's read-only report detail
- Onboarding/profile screen (name, email, phone, state, city, language) — **skip entirely for the demo**; adds auth/account complexity with zero payoff for a live demo audience
- Privacy/DPDP-Act disclosure screen — **don't build as a gating screen**, but its content pattern (icon + short trust statement, then a "what we collect" list of icon+title+one-line-description rows) is cheap to repurpose as a small, non-blocking "How this works" info card or footer note — real trust-building value for near-zero build cost

**Leave out:** anything requiring user accounts/auth, RTI filing, traffic-violation/signboard-scanning features — different product surface, not our scope

### FixMyStreet (mysociety — mature open-source precedent, github.com/mysociety/fixmystreet)
The **established reference implementation** for this entire category (15+ years in production across many countries).

**Take:**
- "Check nearby reports before submitting" pattern — surfaces existing nearby reports so a citizen sees "this is already reported" before duplicating. We already have server-side dedup by exact image hash; FixMyStreet's pattern is complementary (catches the case where someone photographs the *same pothole* from a different angle, which our hash-based dedup can't catch). **Worth adding as a "nearby reports" list on the Capture screen** — pure win, cheap to build (haversine distance query we already have logic for from the original playbook's Phase 7B).
- Public-by-default transparency model — validates that a public Queue/Map view (no login wall) is the right call for our demo, not a gap.
- Simple linear submission flow (locate → describe → confirm) — validates our single-screen capture flow is appropriately simple; no need to add multi-step wizard complexity.

### Spothole (`github.com/nirbhayph/spothole` — AI pothole detection + jurisdiction dashboard)
Closest **conceptual** match to InfraScan itself (AI detection + accountability). Didn't deep-dive its UI code — the value here is validation, not code reuse: it confirms "AI-detected defect + jurisdiction/contractor accountability" is a real, previously-attempted product shape, which is exactly the original playbook's Phase 7B (road-segment matching + DLP lookup). **Signal: build Phase 7B next after the UI pass, it's a proven differentiator, not a nice-to-have.**

### Civix (`github.com/HarshS16/Civix` — React + Tailwind civic issue app, 65★)
Standard React+Tailwind stack, similar to what we just built.

**Take:** dark-mode toggle (`darkMode: 'class'` in Tailwind config) — cheap, we can add this in the same pass since Tailwind is already wired up.

**Leave out:** everything else — its structure doesn't offer anything beyond what we already have from RoadWatch/CivicLens.

---

## 1.5. Component library — build once, reuse everywhere

Every screen above is a rearrangement of the same ~15 component types. Build each as its own component and reuse it across the Dashboard, Capture, and (new) Report Detail screens rather than writing bespoke markup per screen — this is what actually makes the "presentable in hours, not days" goal achievable.

| Component | Purpose | Used on | Status |
|---|---|---|---|
| `MetricCard` | Big number + label (Total Reports, Under Review, etc.) | Dashboard stat row | **Built** |
| `Badge` / `Chip` | Generic color-coded pill, optional leading icon | Everywhere | Built (plain-text); **upgrade to icon+pill per CivicLens style** |
| `StatusChip` | `Badge` variant for observation status (new/review/accepted/recapture) | Report cards, Report Detail | Built (as `Badge`), needs icon upgrade |
| `SeverityBadge` | `Badge` variant for defect severity (low/medium/high), also drives map marker color | Report cards, map legend, Report Detail | Partial — color mapping exists (`SEVERITY_COLOR`), not yet a standalone chip |
| `AgeRepeatBadge` | "N days open" / "Nth report at this spot" — computed client-side from `captured_at` + proximity match | Report cards | **New** |
| `IssueCard` / `ReportCard` | Thumbnail + type + severity + status + confidence + age badge, tappable → Report Detail | Dashboard list, future Home "recent" section | Built, needs chip upgrade + tap-through + age badge |
| `ConfidenceRing` | Small circular/donut indicator of AI confidence %, replacing or accompanying the plain-text percentage | Report cards, Report Detail | **New** |
| `MapCard` | Bordered/rounded container wrapping the Leaflet map, consistent with other card surfaces | Dashboard | Built (inline styling; extract to a component) |
| `EvidencePhotoCard` | Larger photo presentation with caption, used in detail context | Report Detail | **New** |
| `LocationRow` | Pin icon + coordinates or reverse-geocoded address | Report cards (compact), Report Detail (full) | Partial — plain text exists, needs icon + component extraction |
| `HeroCTA` | Large accent-colored card: headline + subtext + action button | Capture entry point, Home landing | Built (Capture only), reuse for Home if a combined landing is added |
| `ActionTileGrid` / `ActionTile` | Rounded-square icon tile + label, grid layout | Home landing (new), linking to Capture/Map/Reports | **New** |
| `BottomNav` | Fixed bottom icon+label nav, active-state highlight | All screens (mobile) | **New**, replaces current top tab switcher |
| `SectionHeader` | Small eyebrow label + heading, optional "See all →" action | Dashboard list header, Home "Recent" section | **New** (currently a plain `<p>`) |
| `ContactActionRow` | Row of circular icon-buttons (Tweet/Email/SMS/Call/Portal-style) for escalation | Report Detail | **New component, real data wired only after Phase 7B** |
| `AccountabilityList` / `AccountabilityListItem` | Avatar-initial + name + affiliation line, list | Report Detail (accountable party), future Accountability tab | **New component, real data wired only after Phase 7B** |
| `CommentInput` | Pill text input + send icon button | Report Detail (reserved) | **New, deferred** — not needed until a review/correction flow exists |
| `FilterChipRow` | Horizontal row of toggleable filter chips (All/New/Review/Accepted/Recapture) | Dashboard list/map filtering | **New** |
| `PrimaryButton` / `SecondaryButton` | Consistent solid vs. ghost-outline button styles | Everywhere | Ad-hoc today (inline Tailwind classes); extract for consistency |
| `InfoDisclosureCard` | Icon + short trust statement + optional bullet list, non-blocking | Home footer or a dismissible one-time card | **New**, repurposed from CivicLens's privacy screen content, not its gating flow |

Build order for these follows the Implementation Order in §6 below — don't build the whole library speculatively before wiring it into a real screen.

---

## 2. Final synthesized direction

Two audiences, one backend, already-working pipeline underneath:

1. **Field/Capture experience** (CivicLens-inspired) — mobile-first, hero CTA, camera+GPS capture, instant AI result, "my reports" list, bottom tab bar. This is the web-based stand-in for Phase 6B's native Android app.
2. **Ops/Dashboard experience** (RoadWatch-inspired) — stat cards, severity-colored map, report list with age/repeat badges, nearby-reports duplicate awareness (FixMyStreet pattern).
3. **Accountability view** (Spothole-validated, deferred) — real feature, built only once Phase 7B's seeded `road_segments`/`contracts` schema exists. Not faked with placeholder data.

Nothing about the backend pipeline changes. Dedup, GPS, stub classification (swappable for real Claude Vision later), status routing, Postgres storage, Render/Vercel deploy — all reused exactly as built.

---

## 3. Current state — what already exists (don't rebuild this)

**Backend (`backend/`) — done, working, deployed:**
- `db.py`, `models.py` (`Observation` table), `inference.py` (stub `classify_defect()`, swappable for real Anthropic call), `main.py` (`POST/GET /observations`, dedup, confidence-based status routing)
- Live at `https://infrascan-backend.onrender.com`

**Frontend (`frontend/`) — built locally, tested, NOT YET COMMITTED (sitting in the working tree from the last session):**
- Tailwind CSS v4 wired in via `@tailwindcss/vite`
- `Dashboard` component: 4 stat cards, report-card list, Leaflet map with severity-colored `CircleMarker`s
- `Capture` component: dark hero header, dashed photo-tile, submit flow, color-coded result card
- Verified: local build clean, backend round-trip tested against the real data shape

**First task of the next session: commit and ship what's already built and verified**, then layer the new items below on top of it. Don't re-derive or redo this part.

---

## 4. Feature decisions — keep / add / defer

| Feature | Decision | Source |
|---|---|---|
| Dedup by content hash | Keep as-is | Original playbook |
| GPS capture (browser Geolocation) | Keep as-is | Original playbook |
| Stub AI classification, swappable | Keep as-is | Original playbook |
| Confidence-based status routing | Keep as-is | Original playbook |
| Stat-card dashboard row | Keep (already built) | RoadWatch |
| Severity-colored map | Keep (already built) | RoadWatch |
| Age/repeat badges on report cards ("41 days open", "3rd report") | **Add** | RoadWatch |
| Bottom tab bar (mobile nav) replacing top tab switcher | **Add** | CivicLens |
| Hero CTA capture card | Keep (already built) | CivicLens |
| "Nearby reports" list before/after submitting (haversine distance) | **Add** | FixMyStreet |
| Public no-login Queue/Map | Keep as-is (validated, not a gap) | FixMyStreet |
| Dark mode toggle | **Add (cheap)** | Civix |
| Accountability/contractor view | **Defer to Phase 7B** — real feature, needs seeded `road_segments`/`contracts` schema first | Spothole, original playbook §7B |
| Live video + bounding-box overlay | **Defer indefinitely** — needs a video/streaming pipeline, out of scope | RoadWatch |
| "Take action" contact-escalation (Tweet/Email/SMS/Call) | **Defer** — needs jurisdiction→contact data we don't have | CivicLens |
| User accounts / profile / auth | **Skip entirely** — no payoff for a live demo | CivicLens |
| RTI filing, traffic violation, signboard scan | **Skip** — different product scope | CivicLens |

---

## 5. Android app plan (deferred from today, documented for later)

Per the earlier decision in this project, a native Android app was descoped for the immediate 2-hour demo in favor of a mobile-responsive web capture page. That decision stands. When Android work resumes:

- Kotlin, CameraX (capture) + `FusedLocationProvider` (GPS) + `SensorManager` accelerometer trigger (hand-tuned threshold, not a trained classifier — per original playbook Phase 6B)
- UI modeled on the CivicLens capture flow: hero card entry point, large capture button, instant result card matching the web version's color-coded status
- Posts to the exact same `POST /observations` endpoint the web capture page already uses — zero backend changes required, this is the entire point of building the endpoint contract-first
- Manual "Capture Now" button as a fallback alongside the accelerometer trigger

This is a separate build track from the web UI work below and should not block it.

---

## 6. Exact implementation order for the next session

Work top to bottom. Each step is independently shippable (commit + PR + merge + verify live) — don't batch everything into one giant PR. Build each component from §1.5 the first time it's needed, not speculatively ahead of time.

1. **Commit and ship what's already built** — the Tailwind Dashboard/Capture rebuild sitting uncommitted in the working tree. Verify live on Vercel before touching anything else.
2. **Component extraction pass** — pull the ad-hoc inline markup already in `Dashboard`/`Capture` into standalone components: `MetricCard`, `Badge`/`StatusChip`/`SeverityBadge`, `ReportCard`, `MapCard`, `HeroCTA`, `PrimaryButton`/`SecondaryButton`, `SectionHeader`. No visual change yet — this is a refactor so every later step reuses instead of re-writes.
3. **Chip/badge icon upgrade** — give `StatusChip`/`SeverityBadge` a small leading icon per the CivicLens style (warning icon for defect type, clock/eye icon for status), replacing today's plain-text pills.
4. **Bottom tab bar (`BottomNav`)** — replace the top tab switcher with a fixed bottom nav (Home / Map / Capture / Reports — pick real sections, don't pad with fake ones). Mobile-first, small isolated change.
5. **`AgeRepeatBadge`** — compute "N days open" from `captured_at` and a repeat-count (same GPS within ~20m, distinct `content_hash`) client-side from existing `GET /observations` data; no backend schema change needed yet. Wire into `ReportCard`.
6. **`ConfidenceRing`** — small circular confidence indicator, used in `ReportCard` and the new Report Detail screen.
7. **Report Detail screen** — new screen, built from the CivicLens Report Detail layout: `EvidencePhotoCard` → `StatusChip` row → type/description → `LocationRow` → (placeholder, collapsed) `ContactActionRow` and `AccountabilityList` sections labeled "available once jurisdiction matching is live" rather than hidden or faked. Tapping a `ReportCard` navigates here instead of doing nothing.
8. **Home landing screen** — new screen using `HeroCTA` + `ActionTileGrid` (tiles: Capture, Map, My Reports — only real features) + a "Recent" `SectionHeader` + list of `ReportCard`s, matching the CivicLens home hierarchy. Decide whether this replaces or sits alongside the existing Dashboard tab.
9. **`FilterChipRow`** — filter the Dashboard/Home report list and map by status or severity.
10. **Nearby-reports awareness** — on the Capture screen, after GPS lock but before submit, show a small "N similar reports nearby" list (client-side haversine filter over the already-fetched `/observations` list, or a new `GET /observations/nearby?lat=&lon=&radius=` endpoint if the list grows large). Backend change is additive, not breaking.
11. **`InfoDisclosureCard`** — one small, non-blocking "how this works / what we collect" card on the Home screen, repurposing the CivicLens privacy screen's content pattern without building a gating flow.
12. **Dark mode toggle** — Tailwind `darkMode: 'class'`, a toggle in the header, persisted to `localStorage`. Purely additive, no logic risk.
13. **Phase 7B (Accountability view)** — only after the above: seed `road_segments`/`contracts` tables, implement nearest-segment matching with the fail-closed "uncertain" behavior, wire real data into `ContactActionRow`/`AccountabilityList` (built in step 7), add a dedicated Accountability tab. This is a real backend feature addition, not a UI reskin — budget real time for it, don't rush it into the same session as the UI polish above.
14. **Real Claude Vision swap** — whenever an Anthropic API key becomes available, swap `backend/inference.py`'s `classify_defect()` body only. No caller changes needed anywhere — this was designed in from the start.
15. **Android app** — separate track, per §5 above, whenever device/time is available.

Steps 1–12 are pure frontend/light-backend work with no new external credentials needed — the same "no-approval-needed" category from earlier planning. Step 13 needs a data/content decision (which road segments to seed) but no new credentials. Step 14 needs the Anthropic key. Step 15 needs Android Studio + a physical device + drive time.
