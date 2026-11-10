---
title: Slex HTML Profile html-1
category: Reference
status: ready
order: 10
summary: "HTML source profile, sandbox SDK, update identity, lifecycle, and static inspection contract."
slexkitRenderMode: component
---

# Slex HTML Profile html-1

## Source

The source is an HTML fragment string. It may contain native HTML/SVG, `<style>`, documented `slex-*` elements, and inline scripts. Executable inline scripts run as modules even when `type` is omitted; data scripts remain inert. Object input is invalid.

The public profile identifier is `html-1`; the internal frame message channel is `slexkit-html-v1`. Neither is the former `0.1` expression protocol.

## Identity and updates

Stable block IDs and element `id`/`data-key` preserve compatible nodes, visible control values, focus, and supported selection. Deleted or retyped nodes dispose. Script code changes dispose the previous script before replacement. Reset reapplies defaults. Arbitrary closure state is not promised.

## SDK

`slex.root`, the scope `AbortSignal` at `slex.signal`, `slex.onDispose`, `slex.onSnapshot`, `slex.onRestore`, policy-gated `slex.api`, and artifact-local JSON `slex.shared.get/set/subscribe`. Each fence remains a separate document.
