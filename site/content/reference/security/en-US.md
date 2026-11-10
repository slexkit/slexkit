---
title: Security Runtime Contract
category: Reference
status: ready
order: 50
summary: "Threat model, sandbox iframe deployment, host policy, postMessage bridge, and fail-closed behavior."
slexkitRenderMode: component
---

# Security Runtime Contract

The isolated frame is the execution boundary. Host/guest messages validate source window, channel token, request ID, revision, and payload shape. A stale response cannot overwrite a newer revision. Preview keeps the last committed view interactive.

Static checks reduce accidental risk but do not prove code safe. The host bridge exposes no network operation unless policy allows it. There is no unsafe inline host-page execution escape.
The frame policy denies payload fetch, image, font, external script, and external link resource loads in supported browsers, including nonce-bearing resources. It is not a complete egress firewall: iframe self-navigation can issue a request. The runtime also does not provide CPU preemption, so hostile execution requires external browser/process controls and timeouts.
