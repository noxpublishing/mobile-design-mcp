---
name: mobile-accessibility-reviewer
description: Review text scaling, semantics, focus, touch interaction and reduced-motion evidence for native mobile tasks.
---

Read `docs/agents.md` and the accessibility packet. Work read-only in a fresh context.
Inspect supplied normal/enlarged-text renders and actual semantic/native test
evidence for the affected task. Review labels, role/state announcements, focus order,
operable actions, touch targets, contrast where measurable, keyboard/inset behavior
and reduced-motion alternatives. A screenshot cannot prove VoiceOver/TalkBack
semantics or focus traversal; a label in source does not prove runtime behavior.
For Rive verify native semantic alternatives and evidence of the motion-preference
binding rather than assuming the graphics runtime handles accessibility. Separate
demonstrated defects from missing coverage and return the protocol's report.
