# Fathom (fathom.video / fathom.ai) — Product Map for Rebuild

Research date: 2026-10-04. No sign-up or log-in was used. Sources: the public marketing site (fathom.video now 301-redirects to **fathom.ai**), the help center (help.fathom.video), the public developer docs and OpenAPI spec, TechCrunch, and reviews on Capterra, GetApp and Trustpilot. Public screenshots are saved under `research/screenshots/`. The file names are listed in §10.

> **Two generations of UI exist right now:**
> - **"Previous Fathom experience" (classic, roughly 2022–2025):** a bot joins the call, with an in-call highlight panel. The web app has tabs SUMMARY / TRANSCRIPT / ASK FATHOM.
> - **"Fathom 3.0+" (launched April 2026):** a desktop-first redesign with bot-free capture modes, live summaries and a Scratchpad. The post-call page has tabs Summary / Action items / Comments / Transcript / Related, with Ask Fathom as a right rail. At launch it was Mac-only; Windows is "coming soon". ([Fathom 3.0+](https://help.fathom.video/en/articles/11577345), [Coming soon](https://help.fathom.video/en/articles/11578049), [TechCrunch 2026-04-15](https://techcrunch.com/2026/04/15/fathom-adds-a-bot-less-meeting-mode-in-a-bid-to-take-on-granola/))
>
> The rebuild should target the 3.0 information architecture and borrow the classic features (highlights, trim, clip menus) where 3.0 hasn't caught up yet.

---

## 1. Information architecture

### 1.1 Top-level navigation (Fathom 3.0 web)
From the TechCrunch product graphic (`screenshots/fathom3-my-calls-grid.jpg`, source <https://techcrunch.com/wp-content/uploads/2026/04/fathom_product-graphic_my-calls.jpeg>):

- **Header:** a `FATHOM` wordmark with a cyan chevron logo on the left. In the centre is a global search input with the placeholder **"Search with AI..."**. The user avatar sits on the right.
- **Horizontal tab nav.** It is a top bar, not a left sidebar. The active tab is cyan with a cyan underline.
  - **My calls**: the user's own meetings. This is the default home.
  - **Team calls**: the shared team library (Team plans).
  - **Folders**: whole calls grouped together. Folders got their own tab in February 2025 ([release notes](https://help.fathom.video/en/articles/6220097)).
  - **Playlists**: collections of highlight clips.
  - **Alerts**: keyword alerts (legacy, superseded by Trackers).
  - **Trackers**: AI-tracked topics across calls.
  - **Deals**: Deal View, which needs a CRM.
  - **Coaching**: Scorecards and Behavioral Metrics.
- **Right rail on list pages:** a persistent **ASK FATHOM** panel. It shows suggested prompt chips, an **"Ask anything..."** composer and a scope dropdown (**"My meetings"** on My calls).
- **Settings** opens from the avatar menu. There are separate **Organization Settings** for admins ([Org settings](https://help.fathom.video/en/articles/3239681)).
- **Not present as top-level items:** "Shared with me" and "Integrations". Shared calls are folded into My calls / Team calls through visibility rules. Integrations live inside Settings.
- A **"Customer view"** (calls with a company) is reached by clicking a company logo in Team calls ([Viewing calls with a company](https://help.fathom.video/en/articles/450112)).

URL patterns (from the OpenAPI examples):
- `https://fathom.video/calls/{id}`, with `?timestamp=645` for deep-link seconds
- share links: `https://fathom.video/share/{token}`
- folders: `https://fathom.video/folders`

([OpenAPI](https://developers.fathom.ai/api-reference/openapi.yaml), [Folders](https://help.fathom.video/en/articles/295808))

### 1.2 What each screen shows
| Screen | Contents |
|---|---|
| **My calls** | Card grid grouped by **Today / Yesterday / Last week / …**. Ask Fathom right rail. See §2. |
| **Team calls** | The same card list plus filters: a team filter (**All Teams**, a checkbox list of sub-teams such as Customer Success, Engineering, Executive, Marketing, Operations, Product, Sales, Other) and a call-type filter (**All Calls / External / Internal**). Company logos are shown on cards. Visibility icons: lock = only people added; crossed-eye = not shared with teams; people icon = specific teams; all-teams icon; building = external call visible to team. ([Team Calls library](https://help.fathom.video/en/articles/449856)) |
| **Folders** | Whole calls (recording, transcript and summary). Each folder has a bookmarkable URL. Visibility options: Private / Visible to your team / Visible to multiple teams / Visible to all teams. Folder access levels: Limited / Standard / Admin. You add a call with **"Add to Folder"** under the call title. There is no bulk add. ([Folders](https://help.fathom.video/en/articles/295808)) |
| **Playlists** | Highlight clips. Clips are added from a highlight's "…" menu → **"Add to Playlist"**. Buttons: **Play All** (plays the clips in sequence) and **Share** (copies the link). ([Playlists](https://help.fathom.video/en/articles/449792)) |
| **Alerts** | **Add Alert**: name, keywords, and who said it (anyone / external attendees only / team members only). After the meeting an email arrives with the matching sentence and a link to the moment. Alerts work on external calls only. Users can **Subscribe** to teammates' alerts. ([Alerts](https://help.fathom.video/en/articles/449984)) |
| **Trackers** | Title "Trackers", subtitle "Automatically track what matters most", and a **Create Tracker** button. Each tracker card shows a thumbnail with "▶ View playlist", an "N clips" count and a "New" badge. It also shows the title, filter chips (Sales team / All meeting types / All speakers), an AI synthesis paragraph, a mini bar-chart sparkline, a bell (subscribe) and a ⋮ menu. A right column lists **Popular Trackers** with subscriber counts. Example tracker names: "Competitor mentioned: Cumulus", "Frustrated customers who could churn", "Questions about onboarding efficiency". (`screenshots/trackers.png`, [Using Trackers](https://help.fathom.video/en/articles/11380417)) |
| **Deals** | Deal View: a **Deal Summary** built from a deal template (Sales / SPICED / MEDDPICC / BANT / Sandler), **Key People** with roles, a deal activity timeline, Ask Fathom scoped to the deal, and CRM properties. Tabs seen: **Summary / Key People / Ask Fathom**, then a "Deal Information" section. ([Deal View](https://help.fathom.video/en/articles/5363457)) |
| **Coaching** | **Scorecards** (Business plan: AI scorecards, overall meeting scores) and **Behavioral Metrics** (number of calls, talk time distribution, number of questions asked, monologue length). Columns are sortable and the current user is pinned to the top. ([Coaching](https://help.fathom.video/en/articles/450176), [AI Scorecards](https://help.fathom.video/en/articles/7906049)) |
| **Settings** | See §6. |

### 1.3 Desktop app (3.0)
- The app lives in the Mac menu bar tray. A window opens at the **top centre** of the screen. ([Desktop app](https://help.fathom.video/en/articles/449088))
- It shows a **"My Meetings"** view listing upcoming meetings, each with a per-meeting capture mode dropdown. Past meetings show short summaries ([Coming soon](https://help.fathom.video/en/articles/11578049)).
- **"Capture Now"** starts an ad-hoc recording.
- Desktop settings:
  - **Auto-capture** (All / External / Internal / No Meetings)
  - **Default capture mode**
  - "Open Meetings in Desktop App"
  - Notifications
  - Privacy: **"Invisible when screen sharing"**
  - Compliance: consent chat message
  - Optional features: Real-time coaching
- **iOS app** (launched October 2026):
  - A **Homescreen** with today's upcoming meetings and a capture toggle per meeting (sends the bot).
  - A **Meetings** tab for history.
  - The meeting view has Summary / Action Items / Transcript tabs.
  - **"Capture In-Person Meeting"** starts recording immediately and asks for the participant count. It supports optional voiceprinting of the user. ([iOS app](https://help.fathom.video/en/articles/13926529))

---

## 2. Meetings list / Home ("My calls")

### Layout
`screenshots/fathom3-my-calls-grid.jpg`
- A **3-column card grid**, grouped by **relative date headers**: "Today", "Yesterday", "Last week", then older periods.
- Each card contains:
  - **Thumbnail.** Video calls show a frame of the participants' grid (a 1-up, 2-up or 3-up collage). **Audio-only** calls show an orange-to-pink gradient with a white waveform glyph. **Transcript-only** calls show a pink-to-purple gradient with a document glyph. So the thumbnail type tells you the capture mode at a glance.
  - A **duration badge** in the bottom-right of the thumbnail ("30 mins", "27 mins").
  - **Title** (bold), e.g. "Team Check-in", "NovaReach Introduction Call", "Hallie + Mark | Onboarding".
  - A **sub-line**: the **company name** (matched from attendee domains, e.g. "Cosmos Technologies") **or the date** ("Apr 8"), then a dot, then a **meeting type / visibility chip with a dropdown** ("Team ▾", "Intros ▾", "Resear… ▾"). A CRM-synced icon can also appear (e.g. a HubSpot sprocket after "Contract").
  - A **⋮ overflow menu**.
- Older call history loads with infinite scroll ([Find your calls](https://help.fathom.video/en/articles/7573185)).

### Filters (Team calls)
- Team picker
- All Calls / External / Internal
- Meeting type, which is shown in My Calls, Team Calls, Deal View and the call page ([Meeting Types](https://help.fathom.video/en/articles/7905409))

### Search behaviour (three layers)
1. **Keyword search in the global bar.** You can search by keyword, phrase, name or email. Results split into **"Transcript matches for *X*" (count)** and **"Calls titled *X*" (count)**.
   - Transcript hits are grouped by date ("TODAY") and by call.
   - Each hit shows "*Speaker* said:" with the quoted sentence, the term highlighted, and a **PLAY** button that jumps to that timestamp. ([Team Calls library](https://help.fathom.video/en/articles/449856), `screenshots/helpcenter-sheet-C.png`)
2. **AI Search** (Team Edition, July 2025). A **"Find *X* with AI"** row appears under the keyword results and returns key moments as clips.
   - Filters: Date (30/90 days, 6 months, 1 year, custom); Teams; Meeting type (internal / external / all); Speaker (anyone / you / internal / external).
   - A **Subscribe** button turns a search into a Tracker, with email digests and Slack alerts. ([AI Search](https://help.fathom.video/en/articles/7374465))
3. **Ask Fathom (account-wide)**, in the right-rail chat.
   - The scope dropdown is **My Calls / Team Calls / All Calls** on Team plans; the UI label is "My meetings" / "All meetings".
   - Free and Premium users only get their own calls.
   - It searches titles, summaries, transcripts and attendees. It does not search deal data, scorecards or trackers.
   - **Answers carry citations linked to exact transcript moments.**
   - **History is not saved.**
   - Example chips: "List my action items for this week", "Summarize my meetings from today", "Any looming deadlines?"
   - Sources: [Account-wide Ask Fathom](https://help.fathom.video/en/articles/10390017), [Using Ask Fathom](https://help.fathom.video/en/articles/3239425), [product page](https://fathom.ai/product)

---

## 3. Meeting detail page (core)

### 3.1 Fathom 3.0 layout
Sources: `screenshots/fathom3-meeting-detail-summary.jpg` (TechCrunch, <https://techcrunch.com/wp-content/uploads/2026/04/Fathom-Post-Call-Summary.jpeg>) and `screenshots/meeting-detail-tabs-ask-fathom.png` (fathom.ai carousel).

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ ←  Interview: Ivan Mehta (TechCrunch) <<>> Richard White (Fathom)   [Share|🔗] ⋮ ✕│
│ [📅 Today] [avatars] [🏢 Untitled Partners] [+]                                │
├──────────────────────────────────────────────┬───────────────────────────────┤
│ ✦Summary | Action items (2) | Comments (2) |  │  ⟲10   ▶   ⟳10   (video/audio)│
│ Transcript | Related                           │  ───────────────── 0:00/31:29 1x│
│ General Summary ▾  [Customize]   [HubSpot Sync][⧉]├───────────────────────────────┤
│ ## Meeting Purpose                             │ ✦ ASK FATHOM            [◫]   │
│ ## Key Takeaways (bold lead-in bullets)        │                               │
│ ## Topics  → sub-headings → bullets            │  chips: Generate a follow-up  │
│ ...                                            │  email / Anything left        │
│ (Change Template)(Add Section)(Update Style)   │  unresolved? / Find any       │
│ ## Action items  [Asana Project ▾][⧉][⇅]       │  moments of friction…         │
│ ☐ Confirm security review…  Kadin · @2:41      │  [Ask anything…] [This Call ▾]↑│
└──────────────────────────────────────────────┴───────────────────────────────┘
```

**Header**
- A back arrow and the title, which you can rename.
- Meta chips: date ("Today"), an attendee avatar stack, company ("Untitled Partners") and a **+** to add one (e.g. folder or company).
- A primary **Share** button (cyan, with an eye-off icon showing current visibility) split with a **copy-link** button, a **⋮** menu, and a **✕** close (the page can open as a modal over the list).

**Left column tabs**
- **Summary**: has a sparkle icon and is the default.
- **Action items**: with a count badge.
- **Comments**: with a count badge. Comments and @mentions are Team plans.
- **Transcript**
- **Related**: other calls with the same company or attendees. This is inferred from the label.

**Summary tab controls**
- A template picker ("General Summary ▾" / "Enhanced Summary") and a **Customize** chip.
- A CRM sync pill: "Sync" before syncing, "Synced ✓" after, using the CRM's icon.
- A copy icon.
- Footer chips: **Change Template**, **Add Section**, **Update Style**.

**Right column**
- A compact player on top: back 10 s, play, forward 10 s, a scrubber, "0:00 / 31:29", volume and a **1x** speed toggle. It is a video frame for video calls and controls only for audio.
- Below the player is the **ASK FATHOM** chat. It can collapse to a side panel (◫ icon). The scope dropdown defaults to **"This Call"** and can be switched to "All meetings".

**Summary output format (General template)**
- **Meeting Purpose**: one sentence.
- **Key Takeaways**: 3–5 bullets, each starting with a **bold label:**.
- **Topics**: H3 topic headings, each with bullets and nested bullets ("Why it matters:", "How it works:").
- **Next Steps / Action items**
- The format is markdown. The API returns `default_summary.markdown_formatted` with a `template_name` such as "general" ([OpenAPI](https://developers.fathom.ai/api-reference/openapi.yaml)).
- @mentions of teammates show inline in the summary as cyan "@Kadin".

### 3.2 Classic web layout (previous experience)
From help-center screenshots, `screenshots/helpcenter-sheet-A/B/C.png`:
- Right-panel tabs: **SUMMARY | TRANSCRIPT | ASK FATHOM**. In Deal View they are **Summary | Key People | Ask Fathom**.
- The summary toolbar has a template dropdown with a chart icon ("General ▾", "Sales - SPICED ▾"), a **⚙ gear** that opens **Customize**, a language dropdown with flags ("🇺🇸 EN ▾"), and a **Copy Summary** button next to a Google Docs icon.
- The left column under the video has these sections:
  - **ATTENDEES**, with a **Send Recording** button.
  - **ACTION ITEMS**, with **"Extract Action Items from Transcript"**.
  - **ANNOTATIONS**, where highlights are listed with an "INTERNAL" lock badge. Each row reads "▶ Highlight · 26s" with an AI one-line description, a link icon and a ⋮ menu.
  - The ⋮ menu offers **Delete Annotation**, **Download Video Clip (mp4)** and **Add to Playlist**.

### 3.3 Transcript panel
- **Speaker-turn "bubbles"**: the speaker name (taken from the calendar invite or the meeting platform, not "Speaker 1") and a timestamp, then the text.
  - The API models each turn as `{speaker:{display_name, matched_calendar_invitee_email}, text, timestamp "HH:MM:SS"}` ([OpenAPI](https://developers.fathom.ai/api-reference/openapi.yaml)).
  - Attendees are matched to speakers through `matched_speaker_display_name`.
- **Click-to-seek**: clicking a turn jumps the player to it. While the video plays, the current turn is highlighted and the panel follows along (transcript synced with playback per [review](https://gotranscript.com/public/exploring-fathom-ai-for-efficient-note-taking)). There is also in-transcript search with match highlighting and jump-to-match ([Supademo](https://supademo.com/blog/how-to-get-meeting-transcripts-in-fathom-3)).
- **Hover affordances**:
  - A **blue "+"** at the left of a bubble creates a highlight.
  - A **⋯** button on the right opens a menu: **Edit transcript**, **Change speaker**, **Trim this section**, **Trim all sections before this section**, **Trim all sections after this section**.
  - After a trim the page has to be refreshed. Trim is not supported on audio-only calls. ([Trimming](https://help.fathom.video/en/articles/295744), `screenshots/helpcenter-sheet-B.png`)
- **Copy Transcript** button above the transcript. Transcripts cannot be downloaded as a file in the UI ([Get a copy of your transcript](https://help.fathom.video/en/articles/296000)).
- Admins can disable transcript editing for compliance (June 2025). A Transcription Dictionary handles company terms ([release notes](https://help.fathom.video/en/articles/6220097)).

### 3.4 AI note templates (complete list)
Sources: [Advanced AI Features](https://help.fathom.video/en/articles/640768) and the settings dropdown screenshot. Each template has a one-line description in the picker.

| # | Template name (exact) | Picker description |
|---|---|---|
| 1 | **General** (a.k.a. General/Enhanced, the default) | "Capture any call's insights and key takeaways." |
| 2 | **Enhanced** | general meeting insights (merged with General) |
| 3 | **Chronological** | "Short summary of the meeting by chapter". **Deprecated May 2026** and auto-replaced by General. |
| 4 | **Sales** | "Unpack a prospect's needs, challenges, and buying journey." |
| 5 | **Sales - Sandler** | "Notes based on Sandler Selling System" |
| 6 | **Sales - SPICED** | "Notes based on the sales methodology by Winning by Design." |
| 7 | **Sales - MEDDPICC** | "Notes based on the popular sales methodology." |
| 8 | **Sales - BANT** | "Notes based on the popular sales methodology." |
| 9 | **Q&A** | "Recap questions with answers." |
| 10 | **Demo** | "showcase journeys and impact" |
| 11 | **Customer Success** | "experiences, challenges, goals, and Q&A" |
| 12 | **Customer Success - REACH** | "Notes based on expansion framework by HelloCCO" |
| 13 | **One-on-One** | "updates, priorities, support signals, and discussion" |
| 14 | **Project Update** | "break down each task's status, discussion, and next steps" |
| 15 | **Project Kick-Off** | "focus on vision, targets, and resources" |
| 16 | **Candidate Interview** | "delve into a candidate's experience, goals, and responses" |
| 17 | **Retrospective** | "capture processes to start, stop, and continue" |

- **Deal templates** (Deal View): Sales, Sales - SPICED, Sales - MEDDPICC, Sales - BANT, Sandler.
- **Customization** (Premium and up):
  - The gear opens a modal titled "**Customize *Sales* Template**". It reads "Provide feedback to the AI on how you'd like your summary to differ from the default output." and has a "Write your instruction" textarea. The placeholder offers examples: "Increase detail", "Prefix each bullet point with its topic+colon in bold", "Append a 'Misc' topic with everything not already covered".
  - The modal has a **Regenerate Summary** button.
  - Regenerating shows a bar: "✨ Customized summary generated" with **Apply to Future Summaries**, a ✏️ edit button and a ↶ reset button.
  - Business plan: fully **custom summaries**.
  - ([Customizing AI Summaries](https://help.fathom.video/en/articles/3239809))
- **Language dropdown**: English, Spanish, Portuguese, German, French, Italian, Dutch. A call detected in one of those languages is auto-translated. Transcription supports 38 languages. In September 2026 a default summary language setting was added. ([Languages](https://help.fathom.video/en/articles/296192))
- **Meeting Types** (Team/Business): admins define types. The AI auto-classifies new calls (with a preview against the last 20 calls) and attaches a default template plus an optional "template modifier". A meeting-type template overrides a user's personal default. ([Meeting Types](https://help.fathom.video/en/articles/7905409))

### 3.5 Action items
- Action items are AI-extracted (Premium and up), each with an **assignee** (name, email, team).
- Each item has a **checkbox** and a **timestamp link ("Kadin · @2:41")** that seeks to the moment. The API exposes `recording_timestamp` and `recording_playback_url …?timestamp=645`.
- Manual items are flagged `user_generated`, and there is a `completed` state ([OpenAPI](https://developers.fathom.ai/api-reference/openapi.yaml)).
- Header controls: an integration target ("Project Neptune ▾" with the Asana icon and a synced ✓), copy, and filter/sort.
- **Push targets:**
  - **Asana**: auto or manual through a **"Sync to Asana"** button. It adds "Fathom Link" and "Fathom Meeting Title" custom fields ([Asana](https://help.fathom.video/en/articles/7639617)).
  - **HubSpot Tasks** ([HubSpot](https://help.fathom.video/en/articles/448832)).
  - **Salesforce Tasks**.
  - Zapier.
- **AI follow-up email draft** (Premium): generated from the action items for copy and paste ([640768](https://help.fathom.video/en/articles/640768)).
- In 3.0 the summary text can @mention teammates. Mentioned people who weren't in the meeting get an email ([3.0](https://help.fathom.video/en/articles/11577345)).

### 3.6 Highlights / clips
- **During the call (classic only)**: the "Fathom Panel" has coloured highlight buttons.
  - Built-ins: **ACTION ITEM, BOOKMARK, COMMENT**.
  - Custom examples: **BUG, USER FEEDBACK, FEATURE REQUEST, USE CASE, INSIGHT, HIGHLIGHT, TESTIMONIAL**. The settings examples add "Budget", "Timing", "Cool Idea", "Good Testimonial", "Happy Customer" and "Share with the Team".
  - **Clicking captures retroactively from when the other person started talking.** The clip ends automatically when *you* start speaking again, ignoring short affirmations. Clicking again ends it manually. ([Marking Highlights](https://help.fathom.video/en/articles/295424))
  - Highlight types are managed at the bottom of Settings → **Highlight Options**: "+ Add More", colour, name, reorder, trash ([Managing Highlights](https://help.fathom.video/en/articles/278720)).
  - In 3.0 / bot-free, in-meeting highlights are **not available**. Post-meeting clips are described as "coming soon".
- **After the call**: hover over the transcript, click the **blue +**, pick a highlight type, then **drag the handles** to extend the range. The clip appears in the right-side Annotations list, where the share-link icon next to "…" copies a clip URL ([Add highlights after](https://help.fathom.video/en/articles/295680)).
- Each clip gets an **AI one-line summary** (API `Highlight{type, summary, text, start_time, end_time}` in seconds).
- Clips can be sent to Slack channels per highlight type, added to Playlists, or downloaded as mp4.

### 3.7 Ask Fathom (per meeting)
- It sits in the right rail under the player, with the scope set to **"This Call"**.
- Chips: **"Generate a follow-up email"**, **"Anything left unresolved?"**, **"Find any moments of friction or disagreement"**.
- Answers contain blue inline links to cited moments and entities.
- Since May 2026 the model knows who the user is, so a request like "draft a follow-up email" is written from the user's point of view ([release notes](https://help.fathom.video/en/articles/6220097)).
- Prompt library examples by role ([Ideal use cases](https://help.fathom.video/en/articles/10302273)): "What were the key pain points mentioned by this customer?", "Help me create an agenda for my next call."

### 3.8 Talk-time stats / topics / chapters
- **No per-meeting talk-time widget appears in the public 3.0 screenshots.**
  - Talk-time and monologue metrics live in **Coaching → Behavioral Metrics**, aggregated per rep.
  - **Real-time coaching** (classic) shows live talk-time % alerts every 5 minutes (calls under 30 minutes) or every 10 minutes (longer calls), and flags a **monologue at 90 consecutive seconds** ([Real-time coaching](https://help.fathom.video/en/articles/295360)).
  - **This is an opportunity**: show per-speaker talk-time bars and a speaker timeline on the meeting page.
- **Topics/chapters**: the General summary has a "Topics" section with H3 per topic. The old Chronological template was "by chapter". **There is no timestamped chapter navigation or chapter markers on the scrubber.** Another opportunity.

---

## 4. Sharing

- **Share dialog**, titled "**Share Recording**" ([Sharing](https://help.fathom.video/en/articles/295616), `screenshots/helpcenter-sheet-B.png`):
  - A search input: "Add teams, users, and emails".
  - A **PEOPLE WITH ACCESS** list showing name, email and role: Owner / **Limited** / **Standard** / **Admin**, with **Remove** in red.
    - Limited: "No access to highlights or comments".
    - Standard: "Access to all content. Can add comments, highlights, or action items".
    - Admin: "Can share with others, trim meeting, edit the transcript".
  - Teams can also be added, e.g. "Engineering · 0 people · Standard".
  - Footer: a general-access dropdown and a **Copy Link** button. The dropdown options are:
    - 🌐 **Anyone with the link can view**
    - 🏢 **Anyone @{domain} can view**
    - 🔒 **Only people added can view**
  - Viewers without permission see "Ask the owner to upgrade your access to view sharing details."
- **Team visibility** dropdown under the Share button: No Team Visibility / Visible to {Team} Only / Visible to All Teams / Visible to Multiple Teams ([Find your calls](https://help.fathom.video/en/articles/7573185)).
- **Org-level defaults**: "Default Share Link Access" (Users Choose / Anyone with link / Domain only / Invited only). Enterprise can use "Restrict Anonymous Recording Access", "Disable Recording Download" and "Disable Recording Deletion" ([Org settings](https://help.fathom.video/en/articles/3239681)).
- **Clip sharing**: the "Copy Share Link" icon on a highlight copies a clip URL that plays just that range ([Supademo](https://supademo.com/blog/how-to-share-video-clips-in-fathom)). A full call can be deep-linked with `?timestamp=<seconds>`.
- **What a non-user sees**: the recording, transcript, summary and "questions", **with no account required** ([296128](https://help.fathom.video/en/articles/296128)). The exact public-page chrome and any sign-up call to action are **not documented**. Expect a Fathom-branded viewer with a sign-up call to action, since product-led growth is how Fathom spreads.
- **Auto-share email after the call.** Settings has a sentence-style control: "Auto-record [ … ▾ ] **and auto-share** [ Summary & recording ▾ | Summary only | Nothing ] **with attendees**".
  - The email goes to **all calendar invitees**, whether or not they attended. It is sent immediately after the call.
  - With "Summary only", the recipient has to request the recording and the owner approves.
  - You cannot recall a sent email, but you can revoke access to the link ([Auto-share](https://help.fathom.video/en/articles/7574785)).
  - Separate **"Auto-Share with Internal Attendees"** setting for teams ([5750273](https://help.fathom.video/en/articles/5750273)).
  - In the attendees panel, **Send Recording** shares the call manually with selected attendees.
  - **Copy Summary** (with a Google Docs icon) and "Copy for Asana" export the notes.

---

## 5. Live in-call experience

- **Bot ("Fathom Notetaker")**: it joins as a participant named **"{First name}'s Fathom Notetaker"** by default. Premium users can rename it ("Bot Name: LJ's Notetaker … Save / Cancel / Revert to Default").
  - The bot's video tile is a dark navy gradient card with the FATHOM logo and the text **"Recording and taking notes"** (`screenshots/helpcenter-sheet-C.png`).
  - It **cannot join without the host present** and leaves when the meeting ends ([5461313](https://help.fathom.video/en/articles/5461313)).
  - Org setting "Single Bot per Meeting" stops several bots from joining the same call. Duplicate bots are a known review complaint.
- **Capture modes (3.0)**, chosen per meeting from a dropdown (`screenshots/home-hero-capture-modes.png`):
  - **Audio & video**: bot
  - **Audio** `BOT-FREE`
  - **Transcript only** `BOT-FREE`
  - **Capture off**
  - Bot-free video works on Zoom on Mac; Google Meet support is coming via the Chrome extension. **Slack Huddles** are supported bot-free.
- **Live window (3.0)**, from `screenshots/live-summary-scratchpad.png`. This is a floating dark panel beside the call:
  - Meeting title and attendee avatars.
  - Tabs **✦ Summary | ✎ Scratchpad**.
  - The **live summary** streams in bullets, including "@Lily to follow-up…" mentions, with a "Listening…" indicator at the bottom.
  - Footer: an animated cyan waveform and an **End** button.
  - The menu bar shows recording and paused states (May 2026).
  - Scratchpad notes are merged into the final summary, and the merged sections are highlighted ([3.0](https://help.fathom.video/en/articles/11577345)).
- **Classic in-call panel**: coloured highlight buttons (see §3.6), real-time coaching toasts, and an in-meeting recording banner (the "Recording Notification Banner" toggle, which Premium can remove).
- **Recording consent**:
  - **Auto Request Recording Consent** emails external attendees 24 h before the meeting, or immediately if it was booked the same day. The email has buttons "**YES, I consent to being recorded**" / "**No, I'd prefer not to be recorded**".
  - If someone declines, auto-record turns off and a warning icon appears, though you can still record manually after getting verbal consent. If nobody replies, recording proceeds as normal. A green toggle shows in the Fathom drawer once consent is given. ([Consent](https://help.fathom.video/en/articles/294272))
  - **Chat notice for bot-free capture**: "Fathom is recording and taking notes, and you consent by continuing". Admins can enforce it (September 2026). There is also an in-app consent prompt.
  - Zoom in-meeting chat setting ([12625089](https://help.fathom.video/en/articles/12625089)).

---

## 6. Calendar integration and auto-join rules

- Google or Microsoft calendar is required at signup. Users with consumer email addresses need at least one meeting in the next 7 days. Multiple calendars are supported ([Quick start](https://help.fathom.video/en/articles/276608), [5291969](https://help.fathom.video/en/articles/5291969)).
- **Auto-record rule** (user Settings, sentence UI, `screenshots/helpcenter-sheet-C.png`): "Auto-record [▾]" with these options:
  - **All meetings** (`MOST COMMON` badge)
  - **External meetings**
  - **Internal meetings**
  - **No meetings. I'll record manually**
  - Admin overrides show tags like `FORCED ON` / `FORCED OFF` next to each option.
  - Internal or external is decided by attendee email domain.
  - **Impromptu/Unscheduled** meetings (not on the calendar) have their own toggle, as do Slack Huddles ([294208](https://help.fathom.video/en/articles/294208)).
- **Org auto-capture**: separate rules for External / Internal / Unscheduled, each **On / Off / Optional**. A lock icon shows whether users can override: white lock = locked, grey unlocked = free, blue semi-lock = limited ([13729025](https://help.fathom.video/en/articles/13729025)).
- **Video conferencing** section: status rows such as "**Zoom: Fully Enabled**" (or "Partially Enabled"), plus Google Meet and Microsoft Teams. There are toggles for unscheduled meetings and "Enhanced Recording: record gallery mode and with improved recording quality".
- **Upcoming meetings**:
  - In 3.0 they appear in the desktop "My Meetings" view and on the iOS Homescreen. Each upcoming meeting has a **capture-mode dropdown or toggle**, and there is one-click join.
  - The 3.0 web screenshots show no upcoming list. The classic web dashboard is not documented in detail.
  - **Recommendation**: put an "Upcoming" strip at the top of My calls with a per-meeting Record toggle and mode selector.
- **Other user settings** ([Settings page](https://help.fathom.video/en/articles/3239617)):
  - Default Meeting Summary Template (dropdown)
  - Auto-Generate Action Items
  - Recording Notification Banner
  - Zapier toggle
  - Integrations (Slack, Salesforce / HubSpot / Close)
  - Options: Auto Request Recording Consent; "Make external meetings visible to your team by default"
  - Fathom Apps (installation audit of the Desktop App, Zoom App and Chrome Extension)
  - Highlight Options

---

## 7. Plans: free vs paid
Pricing from [fathom.ai/pricing](https://fathom.ai/pricing), checked October 2026:

| | **Free** $0 | **Premium** $20/mo ($16 billed annually) | **Team** $19/user/mo ($15 annually) | **Business** $34/user/mo ($25 annually) | **Enterprise** |
|---|---|---|---|---|---|
| Recordings / transcription / storage | **Unlimited** | Unlimited | Unlimited | Unlimited | Unlimited |
| Downloads and clips | Unlimited | Unlimited | Unlimited | Unlimited | |
| AI summaries | Advanced templates for the **first 5 calls per month**, then General only | Unlimited advanced (15+ templates) | same | **Custom summaries** | |
| Action items / follow-up emails | — | ✓ | ✓ | ✓ | |
| Ask Fathom | Single call, limited. Account-wide usage limits from November 2026. | Single call, limited | Account-wide, limited lookback on team calls | Unlimited personal, limited team lookback | |
| Remove banner / rename bot | — | ✓ | ✓ | ✓ | |
| CRM sync (HubSpot, Salesforce, Close) | Up to 3 users per domain | same | same | **CRM field sync** (map summary sections to fields) | |
| Team folders, comments and mentions, Customer view, team search | — | — | ✓ | ✓ | |
| Deal view, Coaching metrics, AI Scorecards | — | — | — | ✓ | |
| SSO/SCIM, retention, org security controls, dedicated CSM | — | — | — | — | ✓ |

- Free vs Premium details: [5290881](https://help.fathom.video/en/articles/5290881).
- Special offers: nonprofits get 10 free seats; startups get up to 2 years free; Gong switchers get Business free for the rest of their contract.

---

## 8. Teams features and integrations

- **Team features**:
  - Team calls library, sub-teams and multi-team visibility
  - Folders, Playlists, Comments and @mentions
  - Customer (company) view, Deal View
  - Meeting Types, AI Search, Trackers with a Weekly Trackers Digest, Alerts
  - Coaching: Behavioral Metrics and AI Scorecards
  - Transcription Dictionary, retention policies, external meeting visibility
  - Roles: Team Admin / Account Admin
  - Domain merge, SSO (Okta SAML) and SCIM (Okta, Entra ID)
  - ([Teams category](https://help.fathom.video/en/categories/66112-teams-pricing-plans))
- **CRM**:
  - **HubSpot** syncs the summary to the meeting event, creates Tasks and links deals. A **HubSpot Card** shows the last 5 meetings on a Company, Contact or Deal. Business plans can **Map to HubSpot** fields. ([HubSpot](https://help.fathom.video/en/articles/448832))
  - **Salesforce** logs a Task on Contact, Account and the open Opportunity. Sync is automatic, or manual with **"Sync to CRM"**. Only H3/H4 sections can be mapped to fields, with a 32k-character limit. ([Salesforce](https://help.fathom.video/en/articles/448640))
  - **Close**
- **Slack**: posts highlight clips by type to **public** channels only. AI Search and Tracker alerts can also go to channels ([Slack](https://help.fathom.video/en/articles/448576)).
- **Zapier**: triggers for new recording, summary, action items and highlights. You choose your meetings or teammates' visible meetings. Retroactive triggers are supported. ([Zapier](https://help.fathom.video/en/articles/450432))
- **Other**: Asana, Notion, Gmail, Chrome Extension, Zoom App, Google Meet, Microsoft Teams, Slack Huddles.
- **Public API, webhooks and MCP**:
  - API keys, OAuth, 60 requests/min ([API](https://help.fathom.video/en/articles/8368641)).
  - The MCP server at `api.fathom.ai/mcp` exposes 7 tools for Claude and ChatGPT ([MCP](https://help.fathom.video/en/articles/11497793)).

**Useful data model** (from the [OpenAPI spec](https://developers.fathom.ai/api-reference/openapi.yaml)):
- `Meeting{title, meeting_title, meeting_type, recording_id, url, share_url, meeting_url, scheduled_start/end_time, recording_start/end_time, calendar_invitees_domains_type(only_internal|one_or_more_external), shared_with(no_teams|single_team|multiple_teams|all_teams), transcript_language, transcript[], default_summary{template_name, markdown_formatted}, action_items[], highlights[], calendar_invitees[{name,email,email_domain,is_external,matched_speaker_display_name}], recorded_by, crm_matches{contacts,companies,deals}}`
- Endpoints:
  - `GET /meetings`, with filters: `created_after/before`, `calendar_invitees_domains[]`, `meeting_type`, `recorded_by[]`, `teams[]`, `include_*`, and a cursor
  - `GET /recordings/{id}/summary|transcript`
  - `POST /recordings/{id}/download`
  - `GET /teams`, `/team_members`, `/users`, `/meeting_types`
  - `POST/DELETE /webhooks`
- Webhook `triggered_for`: `my_recordings | my_shared_with_team_recordings | shared_external_recordings`.

---

## 9. Pain points: opportunities to beat the original

**Speaker identification and transcript**
- Speakers get mislabelled, especially on short interjections ("yeah", "oh wow"). Two similar voices get confused. Cross-talk is handled poorly: one CEO wrote that it "struggles when there more than one person speaking at a time". Users also ask for "clearer speaker attribution". ([Capterra p2](https://www.capterra.com/p/276054/Fathom/reviews/?page=2), [GetApp](https://www.getapp.com/sales-software/a/fathom-1/reviews/))
- Conference rooms and hybrid meetings are a known gap. Fathom's own AI summary of its CEO interview says "Hybrid meetings (e.g., conference rooms) are still a challenge" (`screenshots/fathom3-meeting-detail-summary.jpg`).
- Accuracy drops with background noise and accents, and there is no UK-English option ([Capterra p9](https://www.capterra.com/p/276054/Fathom/reviews/?page=9), [Capterra p5](https://www.capterra.com/p/276054/Fathom/reviews/?page=5)).
- Fixing speakers is one bubble at a time ("Change speaker" in the ⋯ menu). **Opportunity**: bulk "rename Speaker X → person" everywhere, re-assign a run of turns, a speaker confidence indicator, voice enrolment for the whole team (Fathom only voiceprints the user), and a per-speaker colour lane.

**Long meetings with many people (for example 8 people, 1 hour)**
- A transcript of 600+ bubbles is one long scroll. There are **no chapters or timestamped topic jump list**, **no per-speaker filter** in the transcript, and **no per-meeting talk-time bars or speaker timeline**. Navigation is limited to search and clicking turns.
- The summary for a large meeting gets long: "lot of information moving between paragraphs" and "recap points are redundant" (Capterra p9, p2). Takeaways are sometimes wrong (Capterra p5). Summaries "missed key deliverables" and passages were hallucinated in mid-2025 ([Wispr comparison](https://wisprflow.ai/notetaker/wispr-notetaker-vs-fathom)).
- The layout is uncomfortable on 13–14" laptops: "scrolling through the notes feels a bit uncomfortable" (GetApp, Capterra p2).
- **Opportunities**:
  - Auto-chapters with timestamps, plus a chapter strip on the scrubber.
  - Filters such as "show only Alice" and "only questions / decisions / action items".
  - A per-speaker talk-time bar and a speaker timeline under the player.
  - Collapsible summary sections with **citation links on every bullet** that seek the video.
  - A "decisions" section, and dedupe and redundancy control.
  - A compact layout mode for small screens.

**Summary control**
- Users want more format control and dislike the "stiff" or "beige" tone ([theaigearbox](https://theaigearbox.com/fathom-review-for-ai-meeting-summaries/)). Removing sections is not easy (Capterra p9). Free users only get 5 advanced summaries a month.
- **Opportunity**: section-level edit, remove and regenerate; a user style profile; and template building in the UI (Fathom only offers instruction text plus "Add Section" / "Update Style").

**Bot and recording reliability**
- The bot sometimes misses meetings at random, or misses them when the meeting link changes. Several bots can join the same call and produce duplicate recaps. It takes about 1 minute to join and its tile is intrusive. The desktop widget can fail to launch. ([Trustpilot](https://www.trustpilot.com/review/fathom.video), Capterra p2/p5/p9)
- Zoom chat is not captured, so links shared in chat are lost (Capterra p2).
- In-meeting highlights and real-time coaching are **missing in 3.0 bot-free mode**.

**Sharing**
- Auto-sending to every calendar invitee, including people who didn't attend, is unwanted by some (Capterra p5).
- **Opportunity**: preview-before-send recap, per-recipient selection, and an "attendees who actually joined" rule.

**Other gaps**
- Transcripts can't be downloaded as a file (copy only).
- Ask Fathom history is not saved.
- There is no Jira or Linear push for action items.
- The UI is dark-only (dark/light toggle "not available", per [7574145](https://help.fathom.video/en/articles/7574145)).
- Support is email only (Trustpilot).

---

## 10. Visual design

**App UI (3.0 and current web app)**
- **Dark theme only.** Near-black backgrounds: page `#0a0a0a`, cards and panels `#171717`, popovers `#212121`, muted `#262626`, borders `#ffffff1a`.
- **The single accent is Fathom cyan `#00beff`** (CSS var `--accent-fathom`). It is used for the active tab and underline, the primary **Share** button fill, links, @mentions, the "Summary" tab icon and the waveform. **There are no purple/indigo accents in the app.**
- Warn `#ffc82f`, destructive `#dc2626` / `#f87171`.
- The app CSS is **shadcn/ui-style tokens** (`--background`, `--card`, `--popover`, `--muted`, `--sidebar-*`, `--chart-1..5`, `--radius: .625rem`) on **Tailwind v4** (oklch palette, `--fv-` prefix). Light-theme values exist in the CSS but the UI only ships dark. Source: the public bundle `https://static.fathom.video/<sha>/frontend_react/assets/webApp-*.css`, linked from the public sign-in page.
- **Fonts**:
  - The app loads **Inter** (all weights, from `static.fathom.video/.../fonts/fonts.css`).
  - **Sora** is used for headings and brand text.
  - **IBM Plex Mono** for monospace.
  - The default sans stack is the system UI font.
  - Type scale: xs 12, sm 14, base 16, lg 18, xl 20, 2xl 24 px. Radius 10 px. Cards use rounded-xl.
- **Components seen**:
  - Pill tabs with an underline, and count badges as grey circles.
  - Rounded dark chips with a ▾ for dropdowns. Sentence-style settings controls.
  - Gradient placeholder thumbnails: orange `#f55200`→pink `#ffa8bb` for audio, pink→purple `#9600ff` for transcript-only.
  - Avatar stacks.
  - The Ask Fathom wordmark: thin "ASK" plus bold "FATHOM", with a sparkle icon.
  - Outline cyan buttons ("Create Tracker", "Copy Link") and a filled cyan primary ("Share", "Regenerate Summary").

**Marketing brand (fathom.ai, 2025 visual identity)**
- **Space/astronaut theme**. Headline: "AI notetaking that is out of this world". Illustrations include an astronaut and a cyan moon.
- Palette tokens from the site CSS: black `#000`, off-black `#191919`, off-white `#faf5f5`, **cyan `#00beff`** (primary link colour), purple `#9600ff`, pink `#ffa8bb`, orange `#f55200`, yellow `#fff58c`. The purple, pink and orange appear only in gradients and illustrations.
- Fonts: **Sora**, plus **"TT Rounds Neue Condensed Medium"** for display.
- The logo is the uppercase wordmark "FATHOM" followed by a cyan stacked-chevron mark.

**Screenshot URLs** (local copies are in `research/screenshots/`)
- My calls grid: <https://techcrunch.com/wp-content/uploads/2026/04/fathom_product-graphic_my-calls.jpeg> → `fathom3-my-calls-grid.jpg`
- Meeting detail: <https://techcrunch.com/wp-content/uploads/2026/04/Fathom-Post-Call-Summary.jpeg> → `fathom3-meeting-detail-summary.jpg`
- Homepage hero (capture modes, Ask Fathom, Summary/Scratchpad): `https://cdn.prod.website-files.com/6899da9beccbdbe92be49b5d/6a906aae186955014cec4283_69decfaf990e574c8859da7e_hero%20(1).avif` → `home-hero-capture-modes.png`
- Live summary window: `…/6a906aaede7376e9ec5c6b3d_69de69257342cfaefbbaa833_carousel-1%20(1).avif` → `live-summary-scratchpad.png`
- Meeting page with all tabs and Ask Fathom: `…/6a906aada78e00c5b32a3be5_69de69251b2c5b7bf83e2782_carousel-2%20(1).avif` → `meeting-detail-tabs-ask-fathom.png`
- MCP in ChatGPT: `…carousel-3%20(1).avif` → `mcp-chatgpt.png`
- Trackers: `…carousel-4%20(1).avif` → `trackers.png`
- Help-center UI crops (share dialog, access levels, template customize, language menu, transcript ⋯ menu, highlight types, search results, auto-record dropdown, bot tile): `https://usw2.frontkb-cdn.com/attachments/5508513/20480/<uuid>.png`, collected in `helpcenter-sheet-A/B/C.png`

---

### Confidence notes
- **High confidence**: nav tabs, card layout, meeting-page tabs and controls, share dialog labels, template names, settings dropdowns, colours and fonts. These come from first-party screenshots, CSS and docs.
- **Medium confidence**:
  - The classic left column (Attendees / Action items / Annotations below the video) is inferred from help-center crops.
  - Transcript auto-scroll and in-transcript search come from third-party tutorials.
  - The exact public share-page chrome and the post-call email layout are not documented publicly.
  - No first-party evidence was found for a per-meeting talk-time widget.
