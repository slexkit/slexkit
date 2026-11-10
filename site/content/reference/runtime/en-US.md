---
title: Runtime Model
category: Reference
status: ready
order: 30
summary: "HTML mounting, artifact updates, isolated lifecycle hooks, snapshots, shared JSON state, and static inspection."
slexkitRenderMode: component
---

# Runtime Model

`mount(source, container, options)` mounts the HTML document host and returns a disposer/handle with `ready`, `update`, `reset`, and `snapshot`. `createSlexKitMarkdownRuntimeHost` exposes configure/mount/dispose plus artifact update/reset operations.

Every fence has its own document and module scope. Fences with the same artifact identity may exchange bounded JSON through `slex.shared`; they do not share DOM or JavaScript globals. `slex.signal` is the current module scope's `AbortSignal`.

`inspectSlexSource` and `parseSlexSource` are static aliases; `validateSlexSource` returns diagnostics/warnings/errors for tooling. None executes payload scripts. `startSlexKitSandboxRunner` starts the frame guest.
