# @slexkit/assistant-ui

Official assistant-ui bridge for HTML-first SlexKit fences.

```tsx
import { SlexKitAssistantStreamdownText } from "@slexkit/assistant-ui";
import "@slexkit/assistant-ui/style.css";

export function AssistantText() {
  return <SlexKitAssistantStreamdownText
    artifactId="message-1"
    secureFrame={{ runtimeUrl: "/assets/slexkit.runtime.js" }}
  />;
}
```

The bridge keeps assistant-ui and Streamdown's ordinary Markdown behavior, and
claims only the `slex` language renderer. Fence bodies are HTML strings:

````md
```slex
<slex-card title="Answer" data-key="answer">
  <slex-text text="Ready"></slex-text>
</slex-card>
```
````

`createSlexKitAssistantStreamdownComponents(options, existing)` merges language
components while ensuring `slex` remains owned by SlexKit. Options are forwarded
to `@slexkit/streamdown`; use a stable `artifactId`/`domain` for each message and
an explicit self-contained `secureFrame.runtimeUrl`. Every fence is isolated.
Runtime load failure is visible and never falls back to host-realm execution.

Exports also include `SlexKitAssistantStreamdownText` and the assistant-ui type
aliases used by custom integrations.
