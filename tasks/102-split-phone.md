# 102 Split the phone file into five parts

Status: done (merged f22a8cf; tester signed 1ece7c1; index.html byte-identical)
Owner's yes: not yet (open on a real phone and walk all five tabs)

## Summit word it serves
Phone-first. The phone app is one 1,357-line file; split by tab so each
screen can change without the others, with the shipped page unchanged.

## Requirement
Split `source/parts/595-the-phone.js` into five parts by tab:
`595-1-now.js`, `595-2-talk.js`, `595-3-journal.js`, `595-4-you.js`,
`595-5-onboarding.js`. Delete the original. The built `index.html` must stay
byte-identical, so the five files joined in name order must equal the old
file byte for byte.

## Limits (non-functional)
- Privacy: no change, code move only
- Offline: no change
- Interruptions: none
- Accessibility: no change (byte-identical output)
- AI: a model sees nothing new

## Files and owners
| File | Owner |
|---|---|
| source/parts/595-the-phone.js (delete) | phone |
| source/parts/595-1-now.js (new) | phone |
| source/parts/595-2-talk.js (new) | phone |
| source/parts/595-3-journal.js (new) | phone |
| source/parts/595-4-you.js (new) | phone |
| source/parts/595-5-onboarding.js (new) | phone |

## Order
1. phone only. Pure move. No engine or behaviour change.

## Acceptance (Tester writes one test per line)
- [ ] The five files joined in name order are byte-identical to the old 595 file
- [ ] `index.html` after Lead rebuilds is byte-identical to before (Lead proves with cmp)
- [ ] Each file is a whole run of code, split at a tab boundary, not mid-statement
- [ ] No `var` moved below a part that reads it while the page loads

## Triggers
- [ ] New server field or table
- [ ] New vendor or data flow
- [ ] Prompt, model or AI tool change
- [ ] vercel.json, supabase/, api/, sw.js
- [ ] Privacy or legal text

(No trigger fires. Pure code move.)

## What the owner tries on a real device
Open the phone, walk Now, Talk, Journal, You and onboarding; all behave as before.
