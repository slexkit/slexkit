---
title: Secure Runtime Setup
category: Guides
status: ready
order: 40
summary: "Run unreviewed user input, third-party Markdown, or agent output in the isolated HTML document host."
slexkitRenderMode: component
---

# Secure Runtime Setup

Generated HTML and JavaScript run in an isolated frame. Shadow DOM is styling encapsulation, not a security sandbox. Static inspection never executes scripts and rejects external scripts/imports, event-handler attributes, embedded frames/plugins, navigation metadata, and executable URL schemes.

The host must supply a valid runtime URL; load failure fails closed. The frame policy denies payload fetch, image, font, external script, and external link resource loads in supported browsers. Approved requests go through policy-gated `slex.api`.

This is not a universal egress firewall: a payload can navigate its own sandboxed iframe with `location.href`, and that navigation can issue a request. SlexKit also does not preempt arbitrary computation. Hostile execution needs external browser/process network controls and timeouts.
