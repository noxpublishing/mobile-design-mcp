# Mobile UI quality checks

Use the app's accepted direction and authoritative theme/components. Review a
real task with representative content; avoid declaring a technique inherently
good/bad or identifying who authored a UI. During implementation apply relevant
checks as part of the authorized task. An audit records concrete findings.

| Area | Inspect | Useful evidence |
|---|---|---|
| Task and hierarchy | Can the intended user find the next action and understand its consequence? Do headings/decoration compete with it? | Entry state, task execution and result/recovery. |
| Typography and content | Do semantic roles remain readable with real long text and enlarged text? Do labels name the actual action? | Normal/enlarged renders and semantic labels. |
| Spacing and density | Do repeated roles share meaningful relationships? Are groups and reading order understandable? | Changed state plus a representative peer use. |
| Color and emphasis | Are states distinguishable without color alone? Does text/control contrast remain usable? | Actual rendered colors, state comparison and relevant contrast check. |
| Navigation and input | Do safe areas, keyboard, system back/dismiss and focus support completing the task? Is drag supplemented by an accessible action? | Actual native interaction and semantic inspection. |
| State and recovery | Are save/loading/empty/error/cancel/success states truthful where the feature needs them? Can undo or retry recover correctly? | State transition and persisted result, not static copy alone. |
| Motion | Does movement clarify state or continuity, remain interruptible and respect reduced motion? | Actual clip plus identified state/input conditions. |
| Runtime cost | Do lists, media and effects avoid unnecessary work and clean up owned resources? | Source inspection followed by the relevant native measurement. |

Do not force fixed numbers of fonts, colors or cards. A repeated card can support
a real collection; indistinguishable treatment becomes a finding when it hides
different roles. Changes in type scale from accessibility are intentional state
adaptation. Keep the design source as the source of values, not this checklist.

For each finding cite severity, affected state/evidence, expected versus observed
behavior, user impact, correction and rerun. Separate missing evidence from a
confirmed defect. Route relevant questions to existing visual, UX, accessibility,
platform, motion or performance profiles through [agents](agents.md). Preserve
the [shared resolution/completion states](workflow.md); no universal taste score
or automatic performance pass is introduced.
