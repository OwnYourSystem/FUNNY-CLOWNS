# 204 The assistant understands any context by name

Status: agreed
Owner's yes: 2026-10-25

## Summit word it serves
Yours. Tell the assistant "this is a Personal goal" and it knows which context
you mean, not just work or not.

## Requirement
The board assistant and the offline parser accept any context by name when a
person says which context a goal belongs to, matching against the user's list
instead of only "work" and "not work". A name that is not in the list returns a
plain correction, not a wrong set. The context is never added to a model
payload.

## Limits (non-functional)
- Privacy: no change. Matching happens on the device against local state.
- Offline: no change. The parser stays offline.
- Interruptions: none.
- Accessibility: spoken and typed both work; the confirmation is plain English.
- AI: a model sees nothing new. The context stays out of the order and tutor
  payloads. security-review confirms this against the code.

## Files and owners
| File | Owner |
|---|---|
| source/parts/440-board-assistant.js (`pWhere` and the where handling, line 310) | assistant |
| source/parts/460-the-assistant-understands-what-you.js | assistant |
| source/parts/470-the-tutor-where-there-is.js | assistant |

## Order
1. After card 201 is merged and on the base. assistant only. May run in
   parallel with cards 202 and 203 (different files).
2. security-review confirms context never enters a model payload; design-review
   and principles-review read it before merge.

## Acceptance (Tester writes one test per line)
- [ ] Saying a goal is "Personal" (a context the user has) sets that context
- [ ] Saying a context that does not exist returns a plain correction, not a wrong set
- [ ] The assistant's confirmation names the context and whether it is work-hours or outside-hours
- [ ] The order and tutor payloads are unchanged: no context name is sent to a model

## Triggers
- [ ] New server field or table
- [ ] New vendor or data flow
- [ ] Prompt, model or AI tool change
- [ ] vercel.json, supabase/, api/, sw.js
- [ ] Privacy or legal text

(No box ticked, but this change touches model-adjacent parts, so security-review
is required to confirm the context stays offline and never reaches a model. If
the change were to add context to a prompt, the AI trigger would fire.)

## What the owner tries on a real device
Tell the assistant a goal is a context you made (say "Life"); it sets that
context and says whether it counts as work hours or outside.
