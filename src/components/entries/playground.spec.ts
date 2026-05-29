import { component, example, noChildren } from "../spec-helpers";

export const playgroundSpec = component({
    type: "playground",
    category: "Tooling",
    title: "Playground",
    summary: "Interactive source preview.",
    description: "Use playground in documentation surfaces to render editable SlexKit or Markdown examples.",
    props: {
      source: { type: "object | string", description: "SlexKit or Markdown source to preview." },
      sourceType: { type: "string", values: ["slex", "markdown", "auto-markdown"], default: "slex", description: "Source parser mode." },
      title: { type: "string", description: "Playground title." },
      previewAlign: { type: "string", values: ["center", "start"], default: "center", description: "Vertical preview alignment in render mode." },
      alignPreview: { type: "string", values: ["center", "start"], description: "Alias for previewAlign." },
      previewPlacement: { type: "string", values: ["center", "start"], description: "Alias for previewAlign." },
      previewMinHeight: { type: "string", description: "Minimum preview area height." },
      previewMaxWidth: { type: "string", description: "Maximum preview content width." },
      themeToggle: { type: "boolean", default: false, description: "Show the theme toggle action." },
      showThemeToggle: { type: "boolean", default: false, description: "Alias for themeToggle." },
      enableThemeToggle: { type: "boolean", default: false, description: "Alias for themeToggle." },
      themeLabel: { type: "string", description: "Accessible label for the theme toggle action." },
      themeToggleLabel: { type: "string", description: "Alias for themeLabel." },
      sourceTypeLabel: { type: "string", description: "Accessible label for the source type selector." },
      copyLabel: { type: "string", description: "Accessible label for the copy source action." },
      openWebLabel: { type: "string", description: "Accessible label for opening the source in the standalone playground." },
      webUrl: { type: "string", description: "Standalone playground URL used by the open action." },
      playgroundUrl: { type: "string", description: "Alias for webUrl." },
    },
    children: noChildren,
    examples: [example("playground", {
        "namespace": "doc_playground_typical",
        "layout": {
          "playground:demo": {
            "title": "Stat Playground",
            "previewMinHeight": "180px",
            "source": {
              "namespace": "inner_stat_demo",
              "layout": {
                "stat:value": {
                  "label": "Requests",
                  "value": "1.2k",
                  "unit": "/min"
                }
              }
            }
          }
        }
      })],
  });
