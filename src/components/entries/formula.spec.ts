import { component, example, noChildren } from "../spec-helpers";

export const formulaSpec = component({
    type: "formula",
    category: "Display",
    title: "Formula",
    summary: "Reactive KaTeX formula display.",
    description: "Use formula to render SlexKit state and computed values through KaTeX.",
    props: {
      tex: { type: "string", dynamic: true, description: "KaTeX source to render." },
      formula: { type: "string", dynamic: true, description: "Alias for tex." },
      value: { type: "string", dynamic: true, description: "Alias for tex." },
      displayMode: { type: "boolean", default: true, description: "Render as display math when true; inline math when false." },
      display: { type: "boolean", default: true, description: "Alias for displayMode." },
      block: { type: "boolean", default: true, description: "Alias for displayMode." },
    },
    children: noChildren,
    examples: [example("formula", {
        "namespace": "doc_formula_typical",
        "g": {
          "r": 10000,
          "c": 100,
          "fc": 159.15
        },
        "layout": {
          "formula:cutoff": {
            "$tex": "'f_c = \\\\frac{1}{2\\\\pi RC} = ' + g.fc + '\\\\text{ Hz}'"
          }
        }
      })],
  });
