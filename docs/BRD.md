# Business requirements (BRD): Sounding

| | |
|---|---|
| Product | Sounding, a rebuild of the Fathom AI meeting notetaker |
| Owner | Asher Ahmed |
| Status | Shipped. Live at https://ashboi-cyber.github.io/fathom-rebuild/ |
| Written | 2026-10-04. Written after the build, from the brief, the research and the code, to record the decisions as they were made. |
| Related | [PRD](PRD.md) · [Architecture](ARCHITECTURE.md) · [Stats](STATS.md) |

## 1. Background

The 8x take-home asks for a live rebuild of [fathom.video](https://fathom.video) within a 24-hour window. Fathom is an AI meeting notetaker: a bot joins Zoom, Google Meet or Teams calls, records them, and returns a transcript, AI notes in templates, action items, highlights, search across meetings, and shareable clips.

The brief names the case that matters most: **an eight-person call that runs an hour.**

## 2. The business problem

Meeting notetakers capture everything. The value is lost later, when someone needs one decision, one promise or one moment from an hour of talk between eight people.

Using Fathom first-hand ([research/my-fathom/FINDINGS.md](../research/my-fathom/FINDINGS.md)) surfaced three concrete failures:

| What happened in Fathom | Why it matters to the business |
|---|---|
| Searching for "GitHub", a word said in the call and present in both action items, returned nothing | If search misses, the archive is worthless and people go back to taking notes by hand |
| "8x" was transcribed as "ATX", and the mistake went straight into an action item | Wrong names in tasks erode trust in every AI output |
| Chat-bubble transcripts hide who spoke and when | Fine with one person, unusable with eight, which is the case the brief cares about |

## 3. Objectives

The assignment is judged on three things. Each became a business objective with a measurable target.

| # | Objective | Target | Result |
|---|---|---|---|
| O1 | **Speed:** as much working product as possible in the window | Every flow in the brief works end to end on a public link | Met. Every flow in the brief is live, built in one day (see [Stats](STATS.md#how-the-build-went)) |
| O2 | **Product judgement:** build the right things first | Most of the effort goes to the 8-person, one-hour call; low-value features left out on purpose and listed | Met. The meeting page came first; the omissions are listed in the [README](../README.md#what-i-stubbed-or-left-out-and-why) |
| O3 | **UX and UI:** good to use | Readable at a glance, keyboard accessible, mobile ready, distinct from Fathom | Met. Three design passes, the last one critique-driven, with contrast and focus fixes |

## 4. Stakeholders

| Stakeholder | Interest |
|---|---|
| 8x reviewers | Judge speed, product judgement and UX, using the live link, the repo, the agent logs and the walkthrough |
| Asher Ahmed (builder) | Show strong product judgement and effective use of AI agents |
| Meeting host (end user) | Run the call without taking notes; find decisions and owners afterwards |
| Teammate who missed the call | Catch up in minutes, not an hour |
| Outsider receiving a clip | Watch one moment without signing in and without seeing anything else |

## 5. Scope

**In scope**
- A meeting page built for long, crowded calls: playback, a synced transcript, speaker focus, AI notes in templates, action items, Ask.
- Clips and share links that open for someone who isn't signed in.
- Search across every meeting.
- Highlighting during a live call.
- Calendar view with auto-record rules.
- A marketing landing page.
- Realistic seed data: 10 meetings in one coherent fictional company.

**Out of scope, on purpose**
- **A real recording bot.** The brief allows the capture layer to be stubbed.
- **Live AI calls.** The site is public and static, so an API key can't ship in it.
- **Accounts and a backend:** sign-up, teams, folders, billing.
- **Integrations:** CRM sync, Slack, Zapier.
- **Coaching scorecards and transcript editing.**

None of these change whether the hour-long, 8-person call is usable.

## 6. Business requirements

| ID | Requirement | Priority | Status | Built as |
|---|---|---|---|---|
| BR-1 | Anyone can open the product without signing in | Must | Done | Static site on GitHub Pages, signed in as a demo user |
| BR-2 | The workspace is full of realistic meetings, not empty | Must | Done | 10 authored meetings, 5h 27m, 46k words ([Stats](STATS.md)) |
| BR-3 | An 8-person, one-hour call is easy to navigate | Must | Done | Sonar dial, speaker lanes, speaker focus, chapters ([PRD F1](PRD.md#f1-the-meeting-page)) |
| BR-4 | Notes come in templates, and each point links to its source | Must | Done | 11 templates with the best fit marked ([PRD F2](PRD.md#f2-ai-notes-and-templates)) |
| BR-5 | Action items have owners, dates and a link to the moment | Must | Done | [PRD F3](PRD.md#f3-action-items) |
| BR-6 | A moment can be clipped and shared with an outsider, privately | Must | Done | Share pages show only the clip and its words ([PRD F5](PRD.md#f5-clips-and-sharing)) |
| BR-7 | Search finds every word said, in every meeting | Must | Done | Word-start full-text search, opens at the second ([PRD F6](PRD.md#f6-search-across-meetings)) |
| BR-8 | A moment can be highlighted during a live call | Must | Done | /live replay with H / A / X capture ([PRD F7](PRD.md#f7-highlight-during-a-live-call)) |
| BR-9 | The faked parts are stated openly | Must | Done | README, landing page FAQ and walkthrough |
| BR-10 | Every agent prompt and response is captured in the repo | Must | Done | Capture hook and `.agent-logs/`, committed as we went |
| BR-11 | The product has its own identity, not a Fathom clone | Should | Done | Sounding brand, sea-ink palette, sonar print |
| BR-12 | A landing page explains the product in one scroll | Could | Done | Scroll-scrubbed landing page ([PRD F9](PRD.md#f9-landing-page)) |

## 7. Constraints

| Constraint | Effect on the build |
|---|---|
| A 24-hour window, tracked | Ruthless scope; the meeting page first |
| No budget for paid AI APIs | AI notes written at seed time by Claude and validated; no runtime model calls |
| Free static hosting | Next.js static export to GitHub Pages; per-viewer state in localStorage |
| Higgsfield free plan (under 10 credits) | One AI image for the link preview; video clips (72 credits each) replaced by live 3D and SVG scenes |
| Windows machine; Fathom's newer bot-free app is Mac-only | Research done with Fathom Classic (the bot) on Windows |

## 8. Assumptions

- Reviewers value judgement and polish over a working Zoom bot (the brief says so).
- Pre-generated AI output is acceptable when it's labelled as such and every citation checks out.
- A fictional but internally consistent company gives a fairer test than random text.

## 9. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Stubbed capture reads as "fake product" | Said plainly in the README, FAQ and walkthrough; everything above capture is real and clickable |
| Seed data contradicts itself | One shared world spec ([AUTHORING.md](../data/source/AUTHORING.md)) and a validator that runs in CI before every deploy |
| A shared clip leaks the rest of the meeting | Share pages render only the clip's words, with no notes or action items (fixed in the critique pass) |
| Heavy 3D slows the page | three.js loads lazily, pauses offscreen, and respects reduced motion |
| Live link breaks after a change | Every push runs validate, then build, then deploy; a failed step never deploys |

## 10. Success criteria (the hand-in)

| Criterion | Status |
|---|---|
| The live link opens for someone who isn't signed in | Done |
| The repository is public and `.agent-logs/` is in it, committed as we went | Done |
| Walkthrough on Loom, camera on, five minutes or less | Recorded by Asher |
| Seeded with real-looking data | Done |
| The live link and repo are labelled in the form | Asher's hand-in |
