# Sounding: a Fathom rebuild

**Live:** https://ashboi-cyber.github.io/fathom-rebuild/ (opens without signing in)
**Repo:** https://github.com/ASHBOI-CYBER/fathom-rebuild
**Agent logs:** [`.agent-logs/`](.agent-logs/) · capture setup in [`CAPTURE-TEST.md`](CAPTURE-TEST.md)

Sounding is a rebuild of [Fathom](https://fathom.video), the AI meeting notetaker, built for the 8x assignment. It has its own name and look on purpose, and it isn't affiliated with Fathom.

The workspace is seeded with 10 recorded calls at a fictional 60-person logistics-software company. That adds up to 5½ hours of transcript.

## I used Fathom first

I recorded a real Google Meet call on Fathom's free plan before finishing this. Screenshots and notes are in [research/my-fathom/FINDINGS.md](research/my-fathom/FINDINGS.md). Three things stood out:

- Searching my recordings for "GitHub" found nothing, even though I'd said it and it was in both action items.
- Speech-to-text heard "8x" as "ATX", and the mistake went straight into an action item.
- The transcript bubbles hide who spoke and when. That's fine alone, and painful with eight people.

They shaped the priorities below.

## What I built first, and why

The brief says the case that matters is **an eight-person call that runs an hour**. Fathom's weakest moment is the day after that call, when you're trying to find what was decided and who said it. So I put most of the time into the meeting page and spent very little on account or settings screens.

1. **The meeting page** ([try the 8-person, 62-minute planning call](https://ashboi-cyber.github.io/fathom-rebuild/meetings/q4-planning/))
   - **Sounding chart.** One lane per speaker shows exactly when each person talked, with chapters above and clips below. You can see the shape of an hour before pressing play, and scrub, hover or click anywhere to jump. Fathom has no equivalent.
   - **Speaker focus.** Click a name on the chart, or in People, to read only what that person said. On an 8-person call this is the fastest way to answer "what did Tom actually commit to?"
   - **Transcript synced to playback.** The active line follows the playhead, with a "Back to now" button when you scroll away. You can find words in the transcript, and chapter headings carry one-line summaries.
   - **AI notes in 11 templates.** These include General, Decision log, Project update, MEDDPICC, BANT, Demo, Customer success, 1:1, Stand-up, Interview and Retro. The picker marks the best fit for the meeting type. Every bullet links to the second it came from.
   - **Action items** with owners, due dates and timestamps. Filter by person, check items off, add new ones at the playhead, or copy the open items as a checklist.
   - **Ask.** Questions about the call get answers with clickable citations.
   - **People.** Talk share, turns, longest monologue and questions asked, per person.
2. **Clips and sharing.** There are three ways to clip:
   - select words in the transcript
   - press **+** on a line
   - press **Clip last 30s** during playback

   Every clip gets a link that opens a read-only page for someone who wasn't on the call ([example](https://ashboi-cyber.github.io/fathom-rebuild/share/harbor-pine-discovery/?from=1769.7&to=1903.0&title=Tom%20puts%20live%20ETA%20on%20this%20quarter%27s%20roadmap)). The page is bounded to the clip and shades the rest of the chart. The share dialog has the three access levels Fathom offers.
3. **Search across meetings** (Ctrl K or /). It searches every transcript line, note and action item, and filters by who said it. Each result opens the meeting at that exact second. Try "live ETA": the thread runs through 9 of the 10 meetings.
4. **A live call, highlighted mid-call** ([/live](https://ashboi-cyber.github.io/fathom-rebuild/live/)). A real stand-up is replayed as if it were live. Press **Highlight**, **Action item** or **Concern** (or H / A / X); each capture reaches back to when the current speaker started. When you end the call, the processing step files your captures into that meeting's clips.
5. **Calendar and recording rules** ([/upcoming](https://ashboi-cyber.github.io/fathom-rebuild/upcoming/)). Auto-record by rule: all, external, ones I organize, or none. Any single meeting can be overridden, and the home page shows what's next.

## What I stubbed or left out, and why

- **The capture layer is stubbed, as the brief allows.**
  - No bot joins Zoom, Meet or Teams. Each meeting is an authored transcript, and `scripts/build-data.mjs` gives every turn real timing from its word count and a per-speaker speaking rate.
  - The player is a clock that drives a "simulated playback" stage: participant tiles, the active speaker lit, and live captions.
  - The rest of the product (sync, clips, search, sharing) works exactly as it would on top of a real recording.
- **AI output is pre-generated.** Summaries in every template, action items, chapter gists and the suggested Ask answers were written by an LLM (Claude) at seed time from each transcript, then validated so that every cited timestamp points at a turn that exists.
  - Free-form Ask questions use transcript retrieval and quote the matching lines with timestamps.
  - There's no live model call, because the site is static and public, and an API key can't ship in it.
- **No accounts or backend.** The demo workspace is signed in as Asher. Your clips, checked-off actions and template choices persist in your browser's localStorage. Invites in the share dialog are explicitly marked as simulated.
- **Left out on purpose:** CRM sync, Slack and Zapier, teams and folders, coaching scorecards, billing and plan limits, and transcript editing. They're real Fathom features, but none of them changes whether the hour-long, 8-person call is usable.

## How the seed data was made

- [`data/source/AUTHORING.md`](data/source/AUTHORING.md) defines a shared world: one company, its people, and threads that recur across calls:
  - a live-ETA promise sales made too early
  - a Sep 24 outage
  - a $310k deal
  - a renewal at risk
- Five agents wrote the 10 meetings in parallel against that spec.
- [`scripts/validate-source.mjs`](scripts/validate-source.mjs) checks turn order, speakers, word budgets and that every summary citation resolves. CI runs it before every deploy.

## Stack

- Next.js 16 (App Router, static export) and React 19, with Tailwind CSS 4.
- GSAP drives the one orchestrated entrance per page (talk bars on the list, chart lanes on the meeting) and the template-switch transition.
- Deployed to GitHub Pages by [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).

```bash
npm install
npm run dev        # compiles data/source → src/data/generated, then next dev
npm run validate   # checks every authored meeting
npm run build      # static export to ./out
```
