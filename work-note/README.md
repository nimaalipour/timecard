# Work Note Builder 📋

A single-file app for writing occupational-injury work notes fast: pick the
visit type and the client, dictate or type a few fields, and the app assembles
both the **work note** and the **work status report** as you go — ready to copy
into the EMR or print for the employer.

## How to use it

Open **`work-note/index.html`** in any browser — double-click it, no server, no
install, no internet needed. Everything runs on the device; nothing is ever
uploaded anywhere.

1. **Visit type** — choose *Initial visit* or *Follow-up / recheck*. The form
   and both generated documents change to match.
2. **Client (employer)** — pick from the dropdown. Click **⚙ Manage client
   list…** to upload a list (`.csv`/`.tsv`: first column used, a header row
   like "Company Name" skipped; `.txt`: one name per line), paste names one
   per line (commas in names like "Acme, Inc." are kept), or add them one at
   a time. The list is saved in the browser and is there next time.
3. Fill or **dictate** (🎤 on each text box, in Chrome/Edge/Safari) the history:
   - job title, employed-since, and the **injury type** — a specific incident
     (with a date of injury) or **cumulative / repetitive strain** (with an
     approximate onset, phrased "without a single discrete traumatic event");
   - chief complaint(s), body parts (tap-to-pick with left/right/bilateral),
     pain level;
   - *initial visit*: what's been done since the day of injury, and whether
     the employee has been working since (shown when the visit is more than a
     day after the injury, or always for cumulative injuries);
   - *recheck*: what's been going on since the last visit, each order from the
     last visit with its status (approved / not approved / pending
     authorization), PT/acupuncture/chiro sessions completed vs. authorized,
     and any specialist seen between visits.
4. **Exam & plan** — the note is a full SOAP progress note: an Objective
   section with the standard review paragraph and a normal-exam template
   built from the selected body parts (toggleable, with a field for
   additional findings), a diagnosis / clinical impression, Treatment Today
   (meds, DME, recommendations like hourly stretch breaks), referrals,
   full/modified/off work with restriction checkboxes, first aid yes/no, and
   the follow-up interval (or a custom date, or discharge) with optional
   "return sooner if worse" advice. The Assessment/Plan Summary ends with
   labeled Diagnosis / Work Status / Follow-up / Disposition lines.
5. The **Work Note** and **Work Status** tabs on the right update live —
   **Copy to clipboard** for the EMR, **Print** for the employer copy
   (the in-app button and the browser's own Ctrl+P both print just the
   document on the active tab). Implausible inputs — a follow-up date before
   the visit, an injury date in the future, "first aid" combined with
   off-work status or referrals — get a red warning in the form.

## What is remembered, and where

| Data | Stored | Lifetime |
| --- | --- | --- |
| Client list, clinic & provider names | this browser (`localStorage`) | until removed |
| The note in progress | this tab (`sessionStorage`) | until the tab closes or **Clear form** |
| Patient data | nowhere else — never leaves the device | — |

**🧹 Clear form** wipes the patient fields for the next visit (and resets the
visit type to *Initial*) but keeps the client list and the clinic/provider
names.

One privacy caveat: the 🎤 dictation buttons use the browser's built-in speech
service, which sends the audio to the browser vendor for transcription. Typing
(or using a local dictation tool such as a device keyboard's dictation or
Dragon) keeps everything on the device.

## Changing the templates

All of the generated wording lives in small functions near the bottom of
`index.html`: `buildNote` assembles the SOAP note from `headerBlock`,
`subjectiveBlock`, `objectiveBlock`, `treatmentBlock`, and `assessmentBlock`,
and `buildWorkStatus` produces the employer report — plain string assembly,
one line per sentence, easy to reword. The quick-pick chips (common
medications, DME, referrals, treatments, restrictions, body parts) are plain
lists in the HTML/JS and are just as easy to extend.
