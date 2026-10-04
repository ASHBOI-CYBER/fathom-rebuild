# Seed data authoring spec

Seed meetings for **Sounding**, a Fathom-style meeting notetaker. Every meeting is a recorded call
at a fictional company. Transcripts must read like real speech: people interrupt, hedge, say
"yeah, so —", circle back, make small jokes, and get numbers slightly wrong and then correct them.
No stage directions. No "[laughs]". The transcript is the raw speech-to-text output, lightly
punctuated, like Fathom's.

## The world

**Tandem** (tandem.app) is a 60-person B2B SaaS startup. It sells route optimization and dispatch
software to delivery fleets (grocery, parcel, freight). People are in `people.json`; use those ids.

Ongoing threads. Reference these across meetings, consistently, so cross-meeting search is interesting:

- **Routing v3**: the new route-optimization engine. Uses a new solver plus Kenji's ML ETA model.
  GA target: **Nov 17, 2026**. Beta with 6 fleets since Sep 8. Beta result so far: **11% fewer
  miles driven** and on-time delivery up from 91.2% to 94.6%.
- **ML ETA model** (Kenji): mean absolute error improved from **6.1 min to 4.3 min**. It still
  struggles with dense urban stops and loading-dock wait times.
- **Live ETA sharing**: a customer-facing tracking link that shows live driver location and ETA.
  It is *not built yet*. Harbor & Pine wants it as a must-have, and Brightside has asked twice.
  Estimate: about 5 engineer-weeks. It competes with the Driver app onboarding work for Q4 capacity.
- **ETA service outage, Thu Sep 24**: 47 minutes (14:12–14:59 UTC). A Redis cluster failover
  triggered a retry storm from the dispatch workers, and the ETA service fell over. 312 fleets were
  affected. Brightside's drivers saw stale ETAs and customers got wrong delivery windows.
  The status page was updated late, after 26 minutes. That is a sore point.
- **Driver app onboarding redesign** (Priya): 38% of new drivers drop off before completing
  their first route. Target: below 15%. The new flow uses phone-number login, a 3-step permissions
  primer, and a practice route.
- **Harbor & Pine Logistics deal** (prospect): 420 trucks, regional freight in the Pacific
  Northwest. About **$310k ARR**. Decision by **Oct 30**. Competing against **RouteWise**
  (fictional competitor), which is cheaper. Marcus Hill is the champion; the economic buyer is
  their CFO, **Dana Whitfield**, who is not on the calls. Elena handles integrations: they run
  **Samsara** telematics and an old on-prem **Oracle TMS**.
- **Brightside Grocers** (customer since 2024): 180 vans, grocery delivery in 3 metros.
  Renewal is **Jan 31, 2027**, currently $145k ARR. They are frustrated by the outage and want
  live ETA sharing. Expansion opportunity: a 4th metro (Sacramento), +60 vans.
- **Hiring**: two Senior Frontend Engineers for the driver app and dashboard. Sam Rivera is a
  strong candidate.
- **Q4 OKRs** (being finalized in the Q4 planning meeting): ship Routing v3 GA; cut driver
  onboarding drop-off below 15%; close Harbor & Pine; keep Brightside (renewal).

Calendar: today is **Sun Oct 4, 2026**. All dates are 2026. Use UTC ISO timestamps in `startsAt`.

## File format

Write one folder per meeting: `data/source/meetings/<meeting-id>/`.

### `meeting.json`

```json
{
  "id": "q4-planning",
  "title": "Q4 Planning — Routing v3 & Driver App",
  "startsAt": "2026-10-02T16:00:00Z",
  "platform": "meet",                // "meet" | "zoom" | "teams"
  "kind": "internal",                // "internal" | "external"
  "type": "Planning",                // short chip label: Planning, Sales, Demo, Customer, 1:1, Stand-up, Interview, Retro, Design review, Sync
  "host": "asher",
  "participants": ["asher", "maya", "..."],
  "externalCompany": null,           // e.g. "Harbor & Pine Logistics"
  "transcriptFiles": ["transcript-1.json", "transcript-2.json"],
  "summaries": { ... },              // see below
  "actionItems": [ ... ],
  "highlights": [ ... ],
  "ask": [ ... ]
}
```

### `transcript-N.json`

The transcript is split into chapters. A file holds one or more chapters. Turn ids are integers,
globally unique within the meeting, and increase in speaking order across files (1, 2, 3, …).

```json
[
  {
    "title": "Kickoff and goals",
    "gist": "One sentence on what this chapter covers and concludes.",
    "turns": [
      { "id": 1, "s": "asher", "t": "Okay, I think we're — yeah, we've got everyone. Thanks for making time on a Friday..." },
      { "id": 2, "s": "maya",  "t": "Happy Friday." }
    ]
  }
]
```

Timing is computed from word count (about 150 wpm), so **length = word count**. Hit the word budget
you are given: roughly 150 words per minute of meeting. Mix short interjections ("Yeah.", "Mm-hm,
totally.", "Sorry, go ahead.") with long turns (60–180 words). In a multi-person meeting, talk time
should be **uneven** and realistic: a host and one or two people dominate, someone is nearly silent.

### `summaries`

Keys are template ids. Every meeting must include `general` plus the extra templates listed in your
assignment. Each summary is an object with a one-line `tldr` and ordered `sections`:

```json
"general": {
  "tldr": "One sentence a busy exec would read.",
  "sections": [
    { "heading": "Meeting purpose", "items": [ { "text": "…", "ref": 3 } ] },
    { "heading": "Key takeaways",   "items": [ { "text": "…", "ref": 41 }, { "text": "…", "ref": 77 } ] }
  ]
}
```

- `ref` is the turn id where that point is made, and it becomes a clickable timestamp. Every item
  should have a `ref`. Refs must point at the turn that actually supports the claim.
- Items can carry `"owner": "<personId>"` when someone owns the item.
- Write like a sharp chief of staff: specific numbers, names and decisions. No filler like
  "The team discussed various topics."

Template ids and their sections (use these headings):

| id | headings |
|---|---|
| `general` | Meeting purpose · Key takeaways · Topics (one section per major topic, heading = topic name) · Next steps |
| `decisions` | Decisions made (who decided, why) · Open questions · Disagreements & how they resolved |
| `project_update` | Status at a glance · Progress · Risks & blockers · Next steps |
| `sales_meddpicc` | Metrics · Economic buyer · Decision criteria · Decision process · Paper process · Identified pain · Champion · Competition |
| `sales_bant` | Budget · Authority · Need · Timeline · Next steps |
| `demo` | What we showed · How they reacted · Objections · Open questions · Next steps |
| `customer_success` | Account health · Customer goals · Risks · Expansion opportunities · Next steps |
| `one_on_one` | Wins · Challenges · Feedback · Growth & career · Commitments |
| `standup` | One section per person (heading = their first name). Items prefixed "Yesterday:", "Today:", "Blocker:" |
| `interview` | Candidate snapshot · Strengths · Concerns · Technical signal · Motivation & fit · Recommendation |
| `retrospective` | Timeline · What went well · What went wrong · Root cause · Follow-ups |

### `actionItems`

```json
{ "text": "Send Harbor & Pine the Samsara integration spec", "owner": "daniel", "ref": 212, "due": "2026-10-07" }
```

Use 3–12 per meeting, all grounded in something someone said (`ref`). `due` is optional.

### `highlights`

These are moments a participant clipped. Use 2–5 per meeting.

```json
{ "title": "Tom commits live ETA to Harbor & Pine", "from": 140, "to": 144, "by": "asher", "kind": "bookmark" }
```

`kind` is one of `bookmark` | `action` | `quote` | `concern`. `from` and `to` are turn ids (inclusive).

### `ask`

These are suggested questions with pre-generated answers for the "Ask" panel. Use 4–6 per meeting.

```json
{ "q": "What did Tom promise Harbor & Pine?", "a": "Two to four sentences, specific.", "refs": [140, 143] }
```

## Quality bar

- Run `node scripts/validate-source.mjs <meeting-id>` after writing. It checks the JSON, turn-id
  order, refs and word counts. Fix everything it reports.
- Don't invent people beyond `people.json`, except people who are mentioned but not on the call
  (e.g. Dana Whitfield, the CFO).
- Keep facts consistent with "The world" above.
