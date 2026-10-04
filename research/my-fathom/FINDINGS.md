# Using Fathom first-hand (Oct 4, 2026)

I signed up for Fathom's free plan on Windows and recorded a short Google Meet call with myself. The screenshots in this folder are numbered in the order things happened.

## What happened, step by step

1. **Install** (`01`): on Windows only **Fathom Classic** (the bot) is available. Bot-free capture is "Coming Soon to Windows", so the newer bot-free Fathom 3.0 can't be used on Windows yet.
2. **First attempt: nothing came out.** I pasted a Meet link into the desktop app and it said it was recording, but the call never appeared afterwards. The notetaker joins as a guest, and in Meet a guest has to be admitted by hand. That isn't obvious the first time.
3. **Second attempt** (`05`, `06`): the panel went "Recorder joining", then "Asher's Fathom Notetaker" appeared as a full video tile in the call, then "Looking for host" while it checked that the account owner was present. After that it recorded.
4. **The result** (`07`):
   - "Meeting too short to generate a summary". On a short call there are no notes at all.
   - Even so, it pulled out **2 correct action items**, assigned to me with a timestamp (@0:07), plus "Copy Follow-up Email".
   - Template picker: only **Enhanced** is marked FREE. Sales, Sandler, SPICED, MEDDPICC, BANT, Customer Success, REACH, Candidate Interview, Demo, One-on-One and Project Kick-Off look locked.
5. **Transcript** (`08`): chat-style bubbles, with action items pinned at the top and a "+" on hover to make a highlight. Speech-to-text mistakes on a 30-second call:
   - "8x" became **"ATX"**, which also leaked into an action item: "Email **ATX** team GitHub repo link"
   - "recording bot" became "recording **board**"
   - "walkthrough" became "**work through**"
6. **Share** (`09`): "Share Recording", add people by email, owner listed, "Anyone with the link can view", Copy Link.
7. **Search**: searching all recordings for **"GitHub"** returned **no matches**, even though the word is in the transcript and in both action items.

## What this changed or confirmed in Sounding

| Fathom, first-hand | Sounding |
|---|---|
| Search for a word that was said, "GitHub", finds nothing | Search covers every transcript line, note and action item the moment a meeting exists, and opens at the exact second (Ctrl K) |
| Mistranscribed names flow straight into action items ("ATX team") | Every note and action item links to the second it came from, so a wrong word is one click from being checked against the source |
| Short calls get no notes at all | Notes are always present for seeded calls. Thresholds belong to the real capture layer, which is stubbed here |
| Transcript bubbles hide who is speaking and when. Fine with one person, hard with eight | Speaker name and timestamp on every line, a per-speaker chart, and a filter to show one person only |
| Advanced templates are paywalled on the free plan | All templates shown, with the best fit for the meeting type marked |
| Notetaker must be admitted by hand, and the first attempt silently produced nothing | Out of scope (capture is stubbed). Worth noting as a real onboarding gap: the app should say "waiting to be admitted" in plain words |
| Share: anyone-with-link, by email, owner | Same three access levels, plus clip links bounded to a moment |

## What I could not test alone

An eight-person, one-hour call needs eight people. I designed for it with the 62-minute, 8-speaker seeded meeting (`q4-planning`) instead, and the comparisons above about many speakers come from that design work, not from a real Fathom call of that size.
