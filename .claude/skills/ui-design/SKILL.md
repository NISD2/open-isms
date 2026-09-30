---
name: ui-design
description: How nisd2.eu designs user interfaces. Load before designing, redesigning, polishing or reviewing any screen, page, component, layout, form, onboarding or guided flow in this repo, and before choosing how to present a piece of content (explanation, legal duty, example, warning, help, record, confirmation). Covers the process (ask what real users did, show before building, research references, render and look) and the principles (one focus per screen for guided work, a distinct visual form per kind of content, fixed places, mirror the real document, motion with intent).
---

# UI design at nisd2.eu

The people using this product are mostly not security professionals. Often it is one person in a
company of 50 to 150 who was handed NIS 2 and knows nothing about it yet. Every screen is judged by
one question: **does that person know, at a glance, what this is, what to do, and where to look
for help?**

These principles came out of designing the guided Durchgang (one step at a time). They apply to
all UI. **The one-focus layout applies only to guided work.** Registers, dashboards and expert
views stay dense and scannable.

Reference implementation: `app/[locale]/durchgang-preview/` (script, screen shell, rail, matrix,
transitions), on branch `feat/durchgang-preview` until it merges.

---

## Process: how a design gets made

1. **Ask what happened, not what someone wants.** Before designing, ask about specifics and past
   behaviour. What did the last real user do on this screen? Where did they stop? What did you
   have to explain out loud that the screen did not say? Which app's flow felt right, and what
   were its first three screens? Do not hand the product owner menus of layout or architecture
   options. Infrastructure is the engineer's call; the owner describes the experience.
2. **Show before building.** When the ask is "let me see it", make the cheapest thing that shows
   the look: a static route with real text, clearly labelled as a preview. No data wiring, no
   source verification, no infrastructure work until the look is agreed.
3. **Research real references before styling.** Look at how the best products solve the same
   problem, and cite them: GOV.UK Design System patterns, native app onboarding (Duolingo,
   Headspace, Brilliant), tax apps (TurboTax, Taxfix, WISO). Take their reasons, not their pixels.
4. **Render and look.** Screenshot every screen at desktop (1440x900) and phone (390x844) width
   before calling it done. Check the fold, overflow, alignment and the mid-transition frame. A
   typecheck says nothing about whether it looks right.
5. **Move one notch per piece of feedback, then render again.** Do not redesign the whole screen
   in response to one comment.

---

## Principles

### 1. One focus per screen, for guided work

One screen is one piece of information you are telling them, one decision, or one question
(GOV.UK "one thing per page"). Not one field per screen: everything read off the same document
belongs together, so nobody has to put the letter down and pick it up again. A long list is
split into slices (a 57-item checklist becomes four short screens), never shown as a wall.

A guided item typically runs: **Verstehen** (what it is, why you must) → **Beispiel** (what good
looks like) → **Vorgabe** (the BSI default, if there is one) → **Eintragen / Nachweis** (do it) →
**Erledigt** (what was recorded, what comes next).

### 2. Every kind of content has its own visual form

Never reuse one generic card for content that does different jobs. The reader should know what a
block is before reading it. The vocabulary:

| Content | Form | Why |
|---|---|---|
| **Legal duty** ("warum Sie das tun müssen") | A block with a § mark, one plain sentence, a link to the statute | The paragraph sign says "law" before a word is read |
| **Example** | The artefact itself: a do/don't pair of real values, a filled sample row, a highlighted matrix cell | Show what good looks like instead of describing it |
| **Often missed** ("häufig übersehen") | One amber box in one fixed place, the same on every screen of the item | People look for it; it must always be where they looked last time |
| **Help only some need** ("Wo finde ich das?") | A disclosure under the field | Never hide what most people need behind one (GOV.UK details) |
| **Authoritative default** (BSI method) | A filled primary tag ("Vorgabe des BSI"), the real component read-only | Authority is marked, not implied |
| **A decision being recorded** | A document or log entry with date, lines and an empty signature line marked "steht aus" | The person sees the record they are creating |
| **Outcome** | A confirmation panel in the primary colour, then what was recorded | A clear end, and a moment of completion |
| **Reference** (terms, statutes) | A side rail on desktop, a "Nachschlagen" sheet on phone | Present but out of the way |
| **Where you are** | A small tag with an icon per screen kind (Verstehen, Beispiel, Eintragen...) | Orientation at a glance |

Use callouts sparingly. If everything is highlighted, nothing is.

### 3. Mirror the real thing

A form that is copied from a document looks like that document: a card headed with the
document's name ("Bestätigung der Registrierung"), fields in the order they appear on the paper.
TurboTax does this with the W-2. The person matches the screen to the paper in their hand.

### 4. Fixed places

Everything has one home, on every screen:

- **Header:** back (chevron, top left), where am I ("Registrierung · Schritt 2 von 5"), the item
  title, exit (top right). A thin progress bar along its bottom edge.
- **Stage:** the one thing this screen is about.
- **Rail:** "Häufig übersehen" first, then Begriffe, then Gesetz. The same order every time.
- **Footer:** one primary action on the right, the secondary action as quiet text on the left.

### 5. Use the screen

Wide stage, reference rail beside it on desktop. Body text capped at about 62 characters per line,
but cards, matrices and examples use the full stage width. Nothing essential below the fold on a
900 px tall laptop. On phones the rail moves behind a button so the stage keeps the whole screen.

### 6. One primary action, never a dead end

One filled button per screen. The forward button is never disabled: an unanswerable screen with a
disabled button forces a guess, and a guessed answer in a legal record is the worst outcome
available. "Geht noch nicht" (leave it open, with a reason) is always offered next to it, as a
peer of answering, and moves the person on to the next thing they can do.

### 7. Never make the reader feel wrong

People who are new to this will not ask questions if they feel they are failing. No red on first
view, no "überfällig", no count of what is still missing, no scolding copy, no fear marketing.
Progress counts what is done.

### 8. Motion with intent

Screen changes are direction-aware: forward slides the new screen in from the right while the old
one fades and drifts left; back mirrors it. Only the content moves; header, rail and footer stay
still so the eye keeps its place. Use the View Transitions API (see `transitions.css` in the
reference) rather than a motion library, and turn everything off under `prefers-reduced-motion`.

### 9. Illustrations

One small illustration per step, of one concrete object that stands for it (a mailbox with the BSI
letter for the registration). Flat vector in the site palette with one accent. Shown on the
explaining screens and where there is little text, never on dense input screens. On a tinted
panel, render white-ground SVGs with `mix-blend-multiply`. Anything carrying numbers or geometry
(a matrix, a clock of deadlines) is a real component or hand-drawn SVG, never generated art: a
diagram is a claim.

### 10. Colour and data

Colour follows the job: one hue from light to dark for magnitude (risk levels), with the label
written in every cell so colour is never the only carrier. Amber is for "look here", never for
"you failed". Status colours are for status only.

### 11. Typography and variety

Large, tight display headings (`text-3xl` to `text-4xl`, `tracking-tight`), a sentence-case caption
above them, generous line height in body text. Vary the composition by screen kind. When every
screen has the same eyebrow, the same card and the same stack, the product reads as generated.

### 12. Copy

German first, English second, same meaning side by side. Plain words, one idea per sentence, the
statute one click away and never paraphrased into something it does not say. The voice rules in
`CLAUDE.md` apply to every string.

---

## Checklist before showing a screen

- [ ] Can a newcomer say what this screen is for within three seconds?
- [ ] Does each block's form match its job (duty, example, missed, help, record, outcome)?
- [ ] Is "Häufig übersehen" in the same place as on the previous screen?
- [ ] Exactly one primary button, not disabled, with "Geht noch nicht" beside it?
- [ ] Nothing essential below the fold at 1440x900; the phone layout checked at 390x844?
- [ ] No red, no overdue language, no count of what is missing?
- [ ] Transitions checked mid-frame, and off under reduced motion?
- [ ] Every fact on the screen sourced; every string in DE and EN?

## Sources

- GOV.UK Design System: [question pages](https://design-system.service.gov.uk/patterns/question-pages),
  [inset text](https://design-system.service.gov.uk/components/inset-text/),
  [warning text](https://design-system.service.gov.uk/components/warning-text/),
  [details](https://design-system.service.gov.uk/components/details/),
  [panel](https://design-system.service.gov.uk/components/panel/)
- [How TurboTax turns a dreadful user experience into a delightful one](https://appcues.com/blog/how-turbotax-makes-a-dreadful-user-experience-a-delightful-one) (Appcues)
- [Apple Human Interface Guidelines: onboarding](https://developer.apple.com/design/human-interface-guidelines/onboarding)
- [Callout types and when to use them](https://learn.mintlify.com/courses/components/callout-types) (Mintlify)
