# Greenfield Call Desk

A prospecting workbench for a cloud sales development rep. It does the parts of the job that happen before
and after the phone call: find a reason to call, open in thirty seconds, ask good questions, hand clean notes
to a seller, and keep following up until the meeting is booked.

**Built by:** Abdullah Al Mneni, Business Technology Management, Toronto Metropolitan University
**Written for:** the AWS Customer Acquisition Representative Intern posting (job 10590674, Toronto, Summer 2027)

> **Independent student project.** Not affiliated with, endorsed by or built for Amazon Web Services or any
> company listed. No one listed has been contacted through this project. Built with Claude Code.

## What is in it

| View | What it does |
|---|---|
| Territory | 30 real Canadian companies in 8 provinces (AB, BC, MB, NS, ON, PE, QC, SK), each with one public event dated Aug 1 to Nov 1, 2026 that gives a reason to call, linked to its source. Ranked on four adjustable weights: recency, event strength, size fit and source confidence. Copy as CSV. |
| Call sheet | Per account: the event and source, job titles to call, a hypothesis to test, a 30-second opener, three discovery questions plus the ask, the likely objection and an answer, a voicemail and a follow-up email. A pre-qualification form (budget, authority, need, timing) builds a handoff note for the seller. |
| Cadence | Six touches over ten business days (call, email, LinkedIn, call, email, call), staggered across accounts, skipping weekends and Ontario statutory holidays. Copy as CSV. |
| Dial log | Log dials, connects, conversations and meetings per calling block. Shows the funnel and the week's meetings against a target. Shows a labelled, made-up sample week until the first real block is logged. Stored only in the viewer's browser. |
| Method | Sources, exclusions and limits. |

## How the territory was built

- Three research passes (Ontario and Quebec traditional businesses; Canadian software and health tech;
  Western and Atlantic Canada) looked for companies of roughly 15 to 3,000 employees with a dated public event.
- Excluded: companies whose own public material says they use or partner with a major cloud provider, IT
  services firms, and companies over about 5,000 employees.
- Every event was re-checked on its source page on Nov 2, 2026. Corrections made during that check: one deal
  date moved to the article date, a plant count and a province count the source did not state were removed,
  and "acquired" became "agreed to acquire" where the deal had not closed.
- Employee counts appear only where a source gives one; otherwise "unknown".
- Job titles only, never named contacts. The only names in the data are executives named in an event.

## What it does not know

Which cloud provider each company uses today, any CRM or territory data, and any company's internal
qualification method. The call-sheet text is generated from the event type and the account's own event, and is
meant to be rehearsed and rewritten.

## Files

| Path | What it is |
|---|---|
| `data/accounts.json` | The 30 accounts with sources (edit this) |
| `python/build_site_data.py` | Validates every record (required fields, dates in window, https sources) and writes `assets/site-data.js` |
| `python/bundle.py` | Inlines CSS and JS into `dist/greenfield-call-desk.html`, one self-contained file |
| `index.html`, `assets/` | The page (plain HTML, CSS and JavaScript, no libraries) |

```bash
python3 python/build_site_data.py && python3 python/bundle.py
```
