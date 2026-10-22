# Comparison: our board, Motion and Sunsama

Written 2026-10-05.

**What is not checked.** The two Play Store pages could not be opened (the build machine blocks `play.google.com`). Ratings, download counts, Data safety sections and app permissions are **not checked**. Facts about Motion and Sunsama come from their own sites and third-party reviews. Facts about our board come from the build (`app` branch, `14877b7`).

The criteria test one purpose: managing a day that does not go to plan. They also include criteria where our board is weak, so the comparison is fair.

## 1. Selection criteria

| # | Criterion | How it is judged | Weight for the goal |
|---|---|---|---|
| A1 | Re-plans when the day changes | Does the plan change itself, or by asking, when something moves? | High |
| A2 | Protects against over-commitment | Does it limit, warn or size the day? | High |
| A3 | Handles a low-energy day | Is there a built-in lower mode, not only "reschedule"? | High |
| A4 | Says why | Does each suggestion give a reason? | Medium |
| B1 | Understands informal talk | Can you describe your day in plain words and get plan changes? | High |
| B2 | Guided routines | Is there a morning plan, an end-of-day close, a weekly review? | Medium |
| C1 | Calendar and tool links | Calendars, task apps, team tools | Medium |
| C2 | Phone experience | Real app, offline, how complete? | Medium |
| C3 | Cost for one person | Monthly price and any free option | Medium |
| D1 | Data and AI privacy | Where the data lives, and whether it trains AI | High |
| D2 | Security proof | Independent audit or certificate | Medium |
| D3 | Maturity and proof | Store rating, user base, years in use | Medium |

## 2. Comparison

| Criterion | Our board | Motion | Sunsama |
|---|---|---|---|
| A1 Re-plans when the day changes | **Partly.** It re-sizes the day from your recent days and hours. You change things by typing set phrases. No calendar, so it cannot see a moved meeting. | **Strong.** Its AI scheduling re-arranges task blocks when meetings or durations change. | **No.** Planning is manual. It does not re-arrange the day for you. |
| A2 Over-commitment | **Strong.** Today is capped at 1, 3 or 5. The waiting list never counts as planned. | **Partly.** It fits tasks into the time you have. It needs good duration and deadline inputs. | **Strong.** You set a daily hour limit. It warns as you near it and when you pass it. |
| A3 Low-energy day | **Strong.** One tap or "rough day" shrinks Today to 1. A minimum day still counts. Needs attention pauses. | **No** dedicated mode found. | **No** dedicated mode found. |
| A4 Says why | **Strong.** Every suggestion has a reason. | **Unverified.** Reviews describe the scheduling as a black box until you learn its settings. | **Partly.** The routine is explicit. No per-task reasons found. |
| B1 Informal talk | **Not yet.** The assistant matches set phrases. The AI tutor is decided, not built. | **Partly.** It has AI chat and a writer, with limited credits. Re-planning from chat not verified. | **Partly.** The sources show a guided flow, not free talk. |
| B2 Guided routines | **Partly.** Weekly check-in and a morning brief. A close-the-day step is not built. | **Partly.** No ritual focus found. | **Strong.** A guided morning plan, a focus mode and an end-of-day shutdown. |
| C1 Links | **None.** No calendar, no task-app links. | **Strong.** Calendars, meetings, many integrations, teams. | **Strong.** Google and Outlook calendars; Asana, ClickUp, GitHub, Linear, Jira, Trello, Todoist, Notion. |
| C2 Phone | **Partly.** An installable web app that works offline. Not in Play Store. Push reminders are unproven on a real phone. | **Partly.** iOS and Android apps, but reviews call mobile weak next to the calendar. | **Weak.** A companion app. Reviews say full planning and shutdown rituals work best on desktop. |
| C3 Cost, one person | **Not priced.** No payment built. | **$19 a month, or $12.73 billed yearly** (Pro). Business $29, or $19.43 yearly. No free plan. 7-day trial. | **About $20 a month billed yearly, $22 to $25 monthly** (sources differ). 14-day free trial. No free plan. |
| D1 Data and AI | **Strong.** Local first. Sign-in optional. No AI today. Weekly check-ins never leave the device. | **Unverified.** Nothing found on its AI-training policy. | **Strong.** States it never trains models on your data, and its AI vendors may not either. Data encrypted. |
| D2 Security proof | **None.** No audit. | **Unverified.** | **Strong.** SOC 2 Type I and Type II. |
| D3 Maturity | **Early.** One developer. No store rating. Not yet in use at scale. | **Unverified.** Established. Play rating not checked. | **Unverified.** Established. Play rating not checked. |

## 3. What the table says

- **Our strength is the bad day.** No tool here sizes the day down to one thing, or counts a small floor as a finished day. Both rivals assume you can meet a plan and help you fit it in.
- **Motion's strength is automatic re-planning,** but only with clean estimates. Reviews say it is hard to trust until you learn its rules. It has no free plan.
- **Sunsama's strength is the ritual:** a guided morning, a shutdown and a daily hour limit. It does not re-plan for you.
- **Where we are behind:** links to calendars and task apps, a store-listed phone app, security proof, track record, and the informal talk that Motion's AI offers. The AI tutor is the gap that touches the core purpose, and it is the next big step.
- **The open position:** the sources suggest neither rival has a low-energy mode. "Plan for real life, not perfect days" is a position no one else holds.

## 4. To finish the comparison

Paste from the two Play Store pages: the star rating and review count, the Data safety section, and the permissions, for each app. That fills D1 for Motion, D3 for both, and confirms C2.

## Sources (reviews and vendor pages)

- [Motion pricing](https://get-alfred.ai/blog/motion-pricing)
- [Motion review](https://geekflare.com/software/motion-review/)
- [Motion review, limits](https://hirekai.ai/blog/motion-app-review)
- [Sunsama review and pricing](https://efficient.app/apps/sunsama)
- [Sunsama features and mobile limits](https://dupple.com/reviews/sunsama)
- [Sunsama privacy policy](https://www.sunsama.com/privacy)
- [Sunsama trust and security](https://help.sunsama.com/docs/review-and-approval-by-it-and-security)
