# @slexkit/tiptap

Official Tiptap code-block node view for HTML-first `slex` fences.

```ts
import StarterKit from "@tiptap/starter-kit";
import { createSlexKitTiptapExtension } from "@slexkit/tiptap";
import { createSlexKitMarkdownRuntimeHost } from "slexkit";

const runtimeHost = createSlexKitMarkdownRuntimeHost({
  secureFrame: { runtimeUrl: "/assets/slexkit.runtime.js" },
});

const extensions = [
  StarterKit.configure({ codeBlock: false }),
  createSlexKitTiptapExtension({ runtimeHost }),
];
```

The extension replaces only code blocks whose language is exactly `slex`.
Ordinary code blocks retain normal Tiptap behavior and Markdown round-tripping.

````md
~~~slex
<slex-input id="voltage" type="engineering" label="Voltage" value="12"></slex-input>
<slex-stat id="power" label="Power" unit="W"></slex-stat>
<script type="module">
  const voltage = slex.root.querySelector("#voltage");
  const power = slex.root.querySelector("#power");
  const update = () => { power.value = voltage.valueAsNumber * 2; };
  voltage.addEventListener("input", update);
  update();
</script>
~~~
````

Each editor owns a stable artifact; each node view owns a stable block ID.
Updates use the runtime host's preview/commit protocol, so invalid source reports
a diagnostic without destroying the last committed iframe. The adapter never
interprets DSL objects, namespaces, state-only blocks, expression strings, or
handler strings.

Options include `artifactId`, `runtimeHost`, `theme`, `showSource`, labels,
`className`, and `onError`. Custom legacy hosts remain supported for complete
commits, though atomic preservation requires `updateArtifact`.
