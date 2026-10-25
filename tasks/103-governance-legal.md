# 103 Processing record, subcontractors, privacy and terms drafts

Status: in progress
Owner's yes: not yet

## Summit word it serves
Trust. A person hands us their day; the record and the plain privacy words
show what we hold, where, and why.

## Requirement
Write `governance/processing-record.md` and `governance/subcontractors.md`
from the real data flows (README.md "The data", notes/ai-decisions.md,
supabase/ and api/). Write `legal/privacy.md` and `legal/terms.md` as drafts,
each marked "needs lawyer review" at the top. Describe only what the app does
today; invent no data flow.

## Limits (non-functional)
- Privacy: this card describes privacy, it changes no code and moves no data
- Offline: n/a
- Interruptions: none
- Accessibility: plain short English, headings, no jargon
- AI: records that the tutor and order endpoints send Anthropic what a question needs; adds nothing new

## Files and owners
| File | Owner |
|---|---|
| governance/processing-record.md (new) | compliance |
| governance/subcontractors.md (new) | compliance |
| legal/privacy.md (new) | compliance |
| legal/terms.md (new) | compliance |

## Order
1. compliance only. Board and phone draw the legal text in a later wave (Wave 2).

## Acceptance (Tester writes one test per line)
- [ ] processing-record.md lists every store: localStorage board, journal, check-in, account (boards), push, calendar copy
- [ ] subcontractors.md names Vercel, Supabase (eu-north-1) and Anthropic, with what each holds
- [ ] privacy.md and terms.md each start with "needs lawyer review"
- [ ] No store or vendor appears that is not in the code

## Triggers
- [ ] New server field or table
- [ ] New vendor or data flow
- [x] Privacy or legal text

Privacy/legal trigger fires: security-review and compliance both sign before
merge. Compliance writes it; security-review reads it against the code.

## What the owner tries on a real device
Read privacy.md and confirm it matches what the owner believes the app does.
