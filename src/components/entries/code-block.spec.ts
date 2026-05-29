import { component, example, noChildren } from "../spec-helpers";

export const codeBlockSpec = component({
    type: "code-block",
    category: "Content",
    title: "Code Block",
    summary: "Formatted code or log block.",
    description: "Use code-block for static code samples, configuration snippets, and logs.",
    props: {
      code: { type: "string", dynamic: true, description: "Code text content." },
      source: { type: "string", dynamic: true, description: "Alias for code." },
      content: { type: "string", dynamic: true, description: "Alias for code." },
      language: { type: "string", description: "Language label." },
      title: { type: "string", description: "Code block title." },
      icon: { type: "string", description: "Icon name shown before the title." },
      lineNumbers: { type: "boolean", default: true, description: "Show line numbers." },
    },
    children: noChildren,
    examples: [example("code-block", {
        "namespace": "doc_code_block_typical",
        "layout": {
          "code-block:config": {
            "title": "Config",
            "icon": "code",
            "language": "js",
            "code": "export const enabled = true;"
          }
        }
      })],
  });
