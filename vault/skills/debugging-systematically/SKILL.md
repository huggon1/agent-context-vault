---
name: debugging-systematically
description: Use when encountering any bug, test failure, or unexpected behavior, before proposing fixes — replaces guess-and-check with a short, evidence-driven loop.
---

# Debugging Systematically

When something behaves unexpectedly, resist the urge to immediately edit code. Most "quick fixes" land on a symptom and leave the real cause in place. Work through a small evidence-driven loop instead.

## The loop

1. **Reproduce.** Find the smallest, most reliable way to trigger the problem. If you can't reproduce it, you can't verify a fix.
2. **Observe.** Read the actual error, stack trace, log line, or output. Quote the exact text. Do not paraphrase or assume.
3. **Hypothesize.** State one specific cause that would explain the observation. Be concrete: "the cache returns stale data because invalidation runs before the write commits" — not "probably a race condition."
4. **Test the hypothesis cheaply.** Add a log, set a breakpoint, run a query, check the value at the moment of failure. The goal is to confirm or kill the hypothesis with evidence, not to fix anything yet.
5. **Repeat.** If the hypothesis is wrong, form a new one based on what the test revealed. Each cycle should narrow the search.
6. **Fix the cause, not the symptom.** Once the cause is identified, the fix is usually small. If the fix grew large, you may still be patching a symptom.
7. **Verify.** Re-run the reproduction. Confirm the failure is gone *and* nothing adjacent broke.

## Red flags

These thoughts mean you're guessing, not debugging — stop and go back to step 2:

- "Let me try changing X and see if it helps."
- "I'll add a try/catch here just in case."
- "It's probably a timing issue, let me add a delay."
- "I'll just restart it."

If you can't articulate *why* a change would fix the bug, the change is a guess.

## When the bug won't reproduce

- Capture more context next time it occurs: full input, environment, timing, concurrent activity.
- Add targeted logging at the suspected boundary and wait.
- Look for environmental differences between where it happens and where it doesn't.

Do not "fix" intermittent bugs by adding retries or swallowing errors. That hides the signal.
