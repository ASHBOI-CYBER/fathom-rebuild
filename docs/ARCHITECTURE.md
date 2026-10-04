# Architecture: Sounding

How the pieces fit together. Every diagram is drawn by GitHub from the text in this file (Mermaid), so it stays editable.

Related: [BRD](BRD.md) · [PRD](PRD.md) · [Stats](STATS.md)

## 1. The whole system

There is no server. Meetings are authored as text, compiled into JSON at build time, baked into static HTML, and served from GitHub Pages. Anything a viewer creates (clips, checked-off actions, template choices) stays in their own browser.

```mermaid
flowchart LR
  subgraph Author["Authoring (build time)"]
    W["AUTHORING.md<br/>shared world spec"] --> S["data/source<br/>10 meetings + people"]
    S --> V["validate-source.mjs<br/>turn order, speakers,<br/>citations resolve"]
    S --> B["build-data.mjs<br/>times every turn,<br/>builds indexes"]
    B --> G["src/data/generated<br/>index, meetings, search, people"]
  end
  subgraph Next["Next.js 16 static export"]
    G --> P["Pages prerendered<br/>to static HTML"]
  end
  subgraph CI["GitHub Actions"]
    V -. gate .-> D
    P --> D["Deploy to GitHub Pages"]
  end
  D --> U["Visitor's browser"]
  U <--> L[("localStorage<br/>clips, actions,<br/>template choice")]
```

## 2. Pages

```mermaid
flowchart TD
  L["/ (landing page)"] -->|Open the demo| H["/meetings (app home)"]
  H --> M["/meetings/[id] (meeting page)"]
  H --> C["/clips (clip library)"]
  H --> UP["/upcoming (calendar and record rules)"]
  UP --> LV["/live (live call replay)"]
  LV -->|End call| M
  M -->|Share a clip| SH["/share/[id]?from&to&title<br/>(read-only, no sign-in)"]
  SH -->|What is Sounding?| L
  M -. Ctrl K .-> SR{{"Search palette<br/>(every page in the app)"}}
  SR -->|"?t=seconds&q=terms"| M
```

The 10 meeting pages and 10 share pages are generated at build time from `generateStaticParams`. Query parameters (`?t`, `?q`, `?tab`, `?from`, `?to`) are read on the client, inside a Suspense boundary whose fallback renders the full page, so the static HTML is never empty.

## 3. Data model

```mermaid
erDiagram
  MEETING ||--o{ TURN : "is spoken as"
  MEETING ||--o{ CHAPTER : "is split into"
  MEETING ||--o{ SUMMARY : "has one per template"
  MEETING ||--o{ ACTION_ITEM : "produces"
  MEETING ||--o{ HIGHLIGHT : "has clips"
  MEETING ||--o{ ASK_ENTRY : "has prepared answers"
  PERSON ||--o{ TURN : speaks
  PERSON ||--o{ ACTION_ITEM : owns
  SUMMARY ||--o{ SUMMARY_ITEM : contains
  SUMMARY_ITEM }o--o| TURN : "cites (ref + ts)"
  ACTION_ITEM }o--o| TURN : "cites"
  MEETING {
    string id
    string title
    string type
    string platform
    number duration
    string host
  }
  TURN {
    number id
    string speaker
    string text
    number start
    number end
  }
  HIGHLIGHT {
    string kind
    number start
    number end
    string by
  }
```

`build-data.mjs` also writes a slim index for list pages. For each meeting it holds talk time per person, `segments` (speaker, start, end per turn) and `chapterStarts`, which is everything a sonar print needs without loading the full transcript.

## 4. Playback without a recording

The capture layer is stubbed, so playback is a clock. It's a tiny external store, and each component subscribes to just the slice it needs, so a 60 fps clock never re-renders the whole transcript.

```mermaid
sequenceDiagram
  participant U as User
  participant P as createPlayer (clock)
  participant D as SonarDial
  participant T as Transcript
  participant B as PlayerBar
  U->>P: Space / play
  loop every animation frame (plus a watchdog interval)
    P->>P: time += elapsed × rate
    P-->>D: beam angle (written outside React)
    P-->>T: active turn index (binary search, re-render on change only)
    P-->>B: scrubber position
  end
  U->>D: drag or click an arc
  D->>P: seek(t)
  P-->>T: jump, instant scroll to the line
```

The watchdog interval keeps the clock moving in environments that throttle animation frames, and the store is safe under React StrictMode's double mount.

## 5. Clip and share

```mermaid
sequenceDiagram
  actor A as Kenji (signed in)
  participant M as Meeting page
  participant S as localStorage
  participant SD as Share dialog
  actor O as Marcus (outsider)
  participant SP as /share/[id]
  A->>M: select words, press + on a line, or Clip last 30s
  M->>M: title from the first words spoken
  M->>S: save highlight {start, end, title}
  A->>SD: Share, then Copy link
  SD-->>A: /share/id/?from=…&to=…&title=…
  A-->>O: sends the link
  O->>SP: opens it, no sign-in
  SP->>SP: bound the player to [from, to]
  SP-->>O: clip title, byline, and only the words inside the clip
```

## 6. Search

```mermaid
flowchart LR
  Q["Query: live eta"] --> T["Split into terms"]
  T --> F{"Every term starts<br/>a word in the line?"}
  IDX["search.json<br/>every transcript line,<br/>note and action item"] --> F
  F -->|yes| R["Score and group<br/>by meeting"]
  F -->|no| X["Skip"]
  R --> SP["Optional speaker filter"]
  SP --> UI["Results with the match marked"]
  UI -->|click| M["/meetings/id/?t=seconds&q=terms"]
```

Matching at word starts is deliberate: "eta" finds "ETAs", but "live" doesn't match "delivery".

## 7. The landing page's scroll scenes

```mermaid
flowchart TD
  SC["window scroll"] --> PR["Section progress 0 to 1<br/>(how far the tall section<br/>has passed its sticky view)"]
  PR --> H["Hero: three.js points<br/>lerp from swirl to the print"]
  PR --> CSS["--p on the section<br/>drives captions and fades"]
  H --> X["At the end: crossfade to the<br/>crisp SVG print, sweep, heartbeat"]
  PR --> SG["Signal: Record, Find, Share<br/>transforms set directly on elements"]
  PR --> PF["Product frame tilts up into place"]
```

Progress is read straight from scroll events instead of a timeline library. The picture is always exactly where the reader's thumb is, and it still works where animation frames are throttled. The 3D scene loads lazily, renders only while on screen, and shows the finished print for people who prefer reduced motion.

## 8. Build and deploy

```mermaid
flowchart LR
  PUSH["git push to main"] --> CI["GitHub Actions"]
  CI --> I["npm ci"] --> VAL["npm run validate"] --> BLD["npm run build<br/>(BASE_PATH=/fathom-rebuild)"] --> UP["upload ./out"] --> DEP["deploy to Pages"]
  VAL -. fails .-> STOP["nothing deploys"]
```

## 9. Agent capture

```mermaid
sequenceDiagram
  participant CC as Claude Code
  participant H as capture.mjs hook
  participant L as .agent-logs/*.md
  CC->>H: SessionStart
  H->>L: create the session file, note the model
  CC->>H: UserPromptSubmit (prompt text)
  H->>L: append PROMPT entry (verbatim, UTC timestamp)
  CC->>H: Stop (final response)
  H->>L: append RESPONSE entry, update totals
  Note over H: never blocks the agent, errors go to .claude/hooks/.state/errors.log
```

## 10. Key decisions

| Decision | Why | Trade-off |
|---|---|---|
| Stub the capture layer | The brief allows it; the value is in what happens after the call | No real recording. Said openly everywhere |
| Generate AI notes at seed time | A public static site can't hold an API key | Free-form Ask falls back to retrieval, not generation |
| Static export on GitHub Pages | Free, fast, opens for anyone | No backend; per-viewer state lives in localStorage |
| Time turns from word counts and per-speaker speaking rates | Realistic pacing without audio | Timing is plausible, not measured |
| One shared fictional company across all 10 meetings | Threads recur (the live-ETA promise, the outage, a $310k deal), so search across meetings means something | More authoring work up front |
| A validator in CI | Five agents wrote meetings in parallel; nothing ships with a broken citation | Stricter authoring |
| The sonar print as the product's signature | Shows the shape of a long, crowded call at a glance | A new visual to learn, explained in the UI |
| Word-start search | Precision over recall ("live" shouldn't match "delivery") | Mid-word matches aren't found |
| Scroll progress read directly, not a scroll library | Exact, robust, no extra dependency | Hand-written choreography |
