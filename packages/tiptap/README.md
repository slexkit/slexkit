# @slexkit/tiptap

Tiptap extension for explicit `slex` fenced UI blocks.

```sh
npm install slexkit @slexkit/theme-shadcn @slexkit/tiptap @tiptap/core @tiptap/pm @tiptap/starter-kit @tiptap/extension-code-block @tiptap/markdown
```

Import the SlexKit theme once in your app entry:

```ts
import "@slexkit/theme-shadcn/style.css";
import "@slexkit/tiptap/style.css";
```

## Minimal setup

```ts
import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { createSlexKitTiptapExtension } from "@slexkit/tiptap";

const editor = new Editor({
  element: document.querySelector("#editor"),
  extensions: [
    StarterKit.configure({ codeBlock: false }),
    createSlexKitTiptapExtension({
      artifactId: "note-42",
    }),
  ],
});
```

Only code blocks whose language is exactly `slex` are rendered by SlexKit. Other code blocks stay ordinary Tiptap code blocks.

## Markdown roundtrip

Add Tiptap's Markdown extension when loading or exporting Markdown:

```ts
import { Markdown } from "@tiptap/markdown";

const editor = new Editor({
  extensions: [
    StarterKit.configure({ codeBlock: false }),
    Markdown,
    createSlexKitTiptapExtension({ artifactId: "doc" }),
  ],
  content: markdown,
  contentType: "markdown",
});

const nextMarkdown = editor.getMarkdown();
```

The adapter uses normal fenced code blocks instead of a custom tokenizer, so ` ```slex ` blocks remain readable in plain Markdown hosts.

## Shared state across fences

All `slex` blocks in one editor share the same artifact runtime by default. A state-only fence can seed later renderable fences:

````md
```slex
{
  namespace: "calc",
  g: { value: 21 }
}
```

```slex
{
  namespace: "calc",
  layout: {
    "text:answer": { "$text": "'answer: ' + (g.value * 2)" }
  }
}
```
````

## Runtime boundary

This adapter defaults to trusted runtime mode, intended for application-authored content, repository-maintained snippets, reviewed examples, and local document workflows. Use SlexKit secure runtime APIs for untrusted user Markdown or direct agent output.

## Documentation

- [Official Tiptap editor example](https://slexkit.app.simgor.cn/examples/tiptap-host)
- [Runnable example source](https://github.com/slexkit/slexkit/tree/main/examples/tiptap)
- [SlexKit Host integration](https://github.com/slexkit/slexkit/blob/main/site/content/reference/integration/en-US.md)
