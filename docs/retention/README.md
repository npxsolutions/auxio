# Retention

Keeping paid customers paying. Every percentage point of gross retention is worth more than any CAC reduction.

## Files

- `churn-reduction.md` — cancel-flow design, save offers, pause option, win-back sequence. Documented churn reasons by cohort.
- `feedback-loops.md` — NPS cadence, in-app feedback widget, customer advisory board, feature-request intake and triage, close-the-loop comms.
- `email-automation.md` — Resend-powered lifecycle: welcome (D0), activation (D1/D3/D7), value-reinforcement (weekly digest — already shipped in `app/api/digest/morning`), expansion prompts, dunning, win-back.

## Key questions

- What is the leading indicator of a churned account 30 days before they cancel? (Login frequency? Orders synced? Channels connected?)
- Which 3 emails in the lifecycle move retention the most?
- What do the top 10% of retained customers do in week 1 that the bottom 10% don't?

## TODO

- [ ] Instrument activation milestones (channel connected, first order synced, first report viewed).
- [ ] Build cancel flow with reason capture + save offer.
- [ ] Ship NPS cadence (quarterly, in-app + email).
- [ ] Expand digest into full lifecycle: welcome, D3, D7, D30, dunning, win-back.
