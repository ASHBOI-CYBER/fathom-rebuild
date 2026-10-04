# Documentation

| Document | What it answers |
|---|---|
| [BRD: business requirements](BRD.md) | Why build this, for whom, what success means, what was left out and why |
| [PRD: product requirements](PRD.md) | Every feature as user stories with acceptance criteria and live status, the key 8-person scenario, non-functional requirements, what's next |
| [Architecture](ARCHITECTURE.md) | How it works: system, pages, data model, playback, sharing, search, landing scenes, CI and agent capture, all as diagrams, plus key decisions |
| [Stats](STATS.md) | Numbers generated from the repo: seeded data, code size, commit timeline, agent logs, with charts |

Earlier working documents:

| Document | What it is |
|---|---|
| [Fathom product map](../research/fathom-product-map.md) | Research on Fathom's screens and features before building |
| [Using Fathom first-hand](../research/my-fathom/FINDINGS.md) | A real recorded call on Fathom's free plan, with screenshots and what it changed in Sounding |
| [Seed data spec](../data/source/AUTHORING.md) | The shared fictional company all 10 meetings are written against |
| [Landing page brief](../research/landing-brief.md) | The cinematic landing prompt, rewritten for Sounding |
| [Walkthrough script](../WALKTHROUGH.md) | The five-minute video script |
| [Capture test](../CAPTURE-TEST.md) | How prompts and responses are captured into `.agent-logs/` |

## How it was built

This is what happened, in order. The full record is in [`.agent-logs/`](../.agent-logs/).

1. **Capture first.** The agent capture hook was installed and tested before any product code, as the brief requires. The logs were committed as the work went.
2. **Skills before code.** The find-skills skill was used to pick skills for the job: design (frontend-design, impeccable, taste skills), animation (GSAP's official skills) and React performance. Then the work was planned.
3. **Research.** A product map of Fathom from public sources, then a real call recorded on Fathom's free plan. That's where the search miss and the "ATX" mistranscription came from.
4. **Data in parallel.** One shared spec for a fictional company, then five agents wrote the 10 meetings at the same time. A validator checks them before every deploy.
5. **The meeting page first,** because the brief says the 8-person, one-hour call is the case that matters. Everything else came after.
6. **Three design passes:**
   - **Declutter:** one job per screen.
   - **New identity:** the sonar print, the seabed, unusual type.
   - **Critique-driven polish:** two independent reviewer agents, one for visual design and one measuring the page in a browser. Every serious issue they found was fixed.
7. **Cost-aware.**
   - Higgsfield prices were checked before spending anything: one cheap image, and no video at 72 credits a clip.
   - AI notes were generated once at build time instead of on every visit.
   - Long review work went to sub-agents so the main conversation stayed small.
   - When the conversation outgrew the model's context window, it was summarised and carried on.
