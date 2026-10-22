# The AI tutor: owner decisions

Recorded 2026-10-05. Nothing here is built.

## Decisions

1. **The AI tutor is core to the product.** The purpose: a person talks informally about their day, in the morning or when the plan drifts, and the board helps them re-plan and keep control in a day that does not go as scheduled.
2. **AI stays out of development for now.** The board today works without it. The hosted path in `api/tutor.js` stays switched off (`TUTOR_PROXY=false`).
3. **Provider and model.** The cheapest one that could be fine-tuned easily. Not chosen yet. See the options below.
4. **Language at launch.** English only.

## Options for decision 3 (checked 2026-10-05)

| Option | Price | Fine-tuning | Notes |
|---|---|---|---|
| Claude Haiku 4.5 on the Anthropic API | $1 in / $5 out per million tokens | Not found for this model. The only Claude fine-tuning found is Claude 3 Haiku on Amazon Bedrock, US West (Oregon) only, from 2024. | The hosted path is already built and tested for it. Cheapest Claude. |
| Small open-weight model, hosted by us or a host | Lowest | Easy and fully ours | We own the safety, the tool-use quality and the running. Data can stay in the EU. |
| Another vendor's small model with managed tuning | Not checked | Not checked | Would need a new server function and new checks. |

Open point: the choice should not be made for fine-tuning alone. A fine-tune needs hundreds of reviewed examples that we do not have, and conversations can be used only with the person's consent.

## Requirements still to write before any AI is built

- Disclosure that the person is talking to AI.
- What leaves the device, consent before first use, the provider's retention terms, a data-processing agreement, the region.
- A pinned model version, a fixed set of test conversations that must pass before a model change, a fallback model, defence against instructions hidden in task names.
- A budget alarm, a response-time target, a "what you see while waiting" rule.
- Undo for any change the assistant makes.
- Wellbeing limits and an age rule.
- Delete-my-data on the server, a formal accessibility check, monitoring of the push job and the API, server backups.
