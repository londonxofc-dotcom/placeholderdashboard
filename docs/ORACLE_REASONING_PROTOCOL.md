# Oracle Mathematical Critical Thinking Protocol

**Status:** Design/canon principle — specifies reasoning standards for all high-stakes forecast evaluations. **NOT an implementation authorization.** This document prescribes how forecasts must be reasoned, but does not enable live prediction wiring, shell promotion automation, or database mutation.

## Ten Reasoning Lenses

Every forecast evaluation must apply at least **all ten lenses** before declaring confidence:

1. **Base-Rate Analysis** — What is the historical frequency of this outcome across similar contexts? Never treat a single instance or anecdote as evidence without anchoring to the actual base rate.

2. **Bayesian Update** — Given observed evidence, how does your posterior probability differ from your prior? State both. Document what evidence would change your mind.

3. **Trend-Delta Analysis** — Separate signal from noise. Rising trends must show sustained momentum (≥3 consecutive windows same direction). Declining trends must have supporting evidence of regime shift or behavioral change, not just one-off observation.

4. **Cycle Analysis** — Distinguish trend from seasonal/cyclical variation. If the signal is "up in month 3 because month 3 is always higher," the forecast is about the cycle, not about change.

5. **Regime-Shift Detection** — Has a landmark event (0.5+ magnitude) occurred that resets the baseline? Forecasts must account for regime changes or explicitly state why the old regime applies.

6. **Behavioral Repetition** — Does the actor have observable pattern history? If yes, weight observed outcome distribution (win/loss/neutral) heavily. If no, do not infer behavior from theory.

7. **Monte Carlo / Sensitivity Analysis** — Vary your key assumptions (±10–20%) and re-run. If the forecast flips with small perturbations, confidence must be **low** regardless of point-estimate strength. Document which assumptions are sensitive.

8. **Expected Value Framing** — Forecast probability × impact of being right vs. being wrong. A 60% likely outcome with 10× downside is higher-risk than an 80% likely outcome with 1× downside. State both the probability band and the impact asymmetry.

9. **Confidence Calibration** — Match your stated confidence to the uncertainty in your inputs. If you have 3+ independent sources of evidence with 70%+ agreement, confidence can be ≥0.65. If you have 1 source or sources disagree, confidence ≤0.5.

10. **Second-Order Effects & Failure Modes** — What happens if the forecast is wrong? What cascades? Are there asymmetric downside scenarios you have not modeled?

## Required Output Structure

Every forecast evaluation must include:

- **Forecast Statement:** Explicit probability band (unlikely / possible / likely / strong) + human-readable summary
- **Evidence Basis:** List of sources and their confidence weights; indicate source tier (T0–T5)
- **Supporting Signals:** Evidence pointing toward the forecast
- **Opposing Evidence:** Contradictions, caveats, or evidence pointing away; must be non-trivial
- **Key Assumptions:** List assumptions required for the forecast to hold; include sensitivity analysis (which assumptions, if wrong by ±10–20%, flip the forecast?)
- **Remaining Uncertainty:** What information would most improve confidence?
- **Failure Modes:** How could this forecast be wrong? What would detection look like?
- **Next Action / Test:** How will the forecast be validated or invalidated? What evidence comes next?

## Forbidden Claims

The following patterns are **not permitted** in any forecast evaluation. They represent common reasoning traps:

- **"Will definitely happen" / "will certainly not happen"** — No outcome has >99% certainty. Use probability bands instead.
- **Diagnosis language** — Do not say "the pattern shows X is unmotivated" or "Y suffers from Z trait." Forecasts are about outcomes, not about protected categories or individual psychology.
- **Protected trait inference** — Do not infer protected characteristics (age, gender, race, disability status, etc.) from behavioral patterns. Behavioral patterns may correlate with protected traits; never make the inference explicit or actionable.
- **Pattern-as-destiny** — Do not treat observed pattern as inevitable future. Patterns are input to a forecast, not the forecast itself. Actors change, contexts change, regimes shift.
- **Scaffold-only strong forecasts** — A "strong" forecast (>80% confidence) cannot rest solely on T3–T5 sources. Must include T0–T2 evidence (direct observation, documented record, or cross-platform agreement).
- **Unevidenced promotion** — Do not promote a forecast to higher confidence based on internal coherence alone. "This makes sense so it must be true" is the fluency trap. Ground all confidence increases in new evidence.

## Activation Requirements

The Mathematical Critical Thinking Protocol is a canon standard that guides all Phase 3 oracle work. It is activated implicitly by:

1. Any Phase 3 stage assignment involving forecast or prediction logic
2. New oracle evaluation contracts with shell promotion, memory graduation, or pattern detection
3. Safety verification requirements for new Phase 3 functionality

Explicit activation is not required. The protocol is always in scope when building oracle decision contracts.

---

*Extracted from ORACLE_WHITEPAPER_V0_1.md. This condensed version captures the reasoning framework without the broader whitepaper context, preserving the Ten Lenses standard for all future oracle evaluations.*
