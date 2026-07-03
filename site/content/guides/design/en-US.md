---
title: Design Philosophy
category: Guides
status: ready
order: 30
summary: "Design principles for live Markdown, components, and agent-friendly UI output."
includeTitleInToc: true
slexkitRenderMode: component
---

# SlexKit Design Philosophy

**Docs as tools, tools as docs.**

Make static documents come alive. Give AI agents the power to output interactive experiences.

```slex
{
  namespace: "design_philosophy",
  layout: {
    "diagram:philosophy": {},
    "grid:philosophy": {
      columns: 1,
      lgColumns: 3,
      "card:task": {
        tone: "primary",
        "heading:title": { level: 4, title: "Task-First" },
        "text:bodyA": { text: "Start from the task the user needs to complete." },
        "text:bodyB": { text: "Every design decision serves the core task." }
      },
      "card:intuitive": {
        tone: "info",
        "heading:title": { level: 4, title: "Intuitive" },
        "text:bodyA": { text: "Docs include live examples that update instantly." },
        "text:bodyB": { text: "Data flows across components through scoped binding." }
      },
      "card:breath": {
        tone: "success",
        "heading:title": { level: 4, title: "Visual Breath" },
        "text:bodyA": { text: "Whitespace and spacing create visual rhythm." },
        "text:bodyB": { text: "Typography and color build clear hierarchy." }
      }
    }
  }
}
```

## Color Semantics

Color expresses role, not personal preference.

```slex
{
  namespace: "design_color",
  layout: {
    "grid:colors": {
      columns: 1,
      mdColumns: 2,
      lgColumns: 3,
      "card:primary": {
        tone: "primary",
        "swatch:primary": { tone: "primary" },
        "heading:title": { level: 4, title: "Primary" },
        "text:body": { text: "Main actions, current selection, high-priority emphasis. Do not use as decoration." }
      },
      "card:info": {
        tone: "info",
        "swatch:info": { tone: "info" },
        "heading:title": { level: 4, title: "Info" },
        "text:body": { text: "Guidance, hints, informational states. Do not replace Primary." }
      },
      "card:success": {
        tone: "success",
        "swatch:success": { tone: "success" },
        "heading:title": { level: 4, title: "Success" },
        "text:body": { text: "Completed, passed, safe to continue. Use only when the result is confirmed." }
      },
      "card:warning": {
        tone: "warning",
        "swatch:warning": { tone: "warning" },
        "heading:title": { level: 4, title: "Warning" },
        "text:body": { text: "Risk, threshold, needs attention but not failed. Do not use to brighten pages." }
      },
      "card:destructive": {
        tone: "destructive",
        "swatch:destructive": { tone: "destructive" },
        "heading:title": { level: 4, title: "Destructive" },
        "text:body": { text: "Errors, deletions, irreversible actions. Must include consequence description." }
      },
      "card:neutral": {
        tone: "neutral",
        "swatch:neutral": { tone: "neutral" },
        "heading:title": { level: 4, title: "Neutral" },
        "text:body": { text: "Backgrounds, dividers, secondary information, default containers. Provides structure, not emphasis." }
      }
    }
  }
}
```

## Card Arrangement

Small cards are for comparison and judgment. Run metrics side-by-side; the system handles equal width, spacing, and wrapping. Wrap in a parent card when items share context; stack vertically when order matters.

```slex
{
  namespace: "design_arrangement",
  layout: {
    "column:arrange": {
      "row:metrics": {
        "stat:requests": {
          label: "Requests",
          value: "1.2k",
          unit: "/min",
          tone: "info"
        },
        "stat:success": {
          label: "Success",
          value: "98.4",
          unit: "%",
          tone: "success"
        },
        "stat:latency": {
          label: "Latency",
          value: "42",
          unit: "ms"
        },
        "stat:errors": {
          label: "Errors",
          value: "3",
          tone: "warning"
        },
        "stat:queued": {
          label: "Queued",
          value: "8"
        }
      },
      "grid:examples": {
        columns: 1,
        mdColumns: 2,
        "card:summary": {
          title: "Same Object",
          "row:service": {
            "stat:idle": {
              label: "Pending",
              value: "12"
            },
            "stat:active": {
              label: "Running",
              value: "5",
              tone: "info"
            },
            "stat:done": {
              label: "Done",
              value: "47",
              tone: "success"
            },
            "stat:failed": {
              label: "Failed",
              value: "2",
              tone: "danger"
            }
          }
        },
        "card:flow": {
          title: "Sequential",
          "column:steps": {
            "stat:input": {
              label: "Input",
              value: "1"
            },
            "stat:compute": {
              label: "Compute",
              value: "2",
              tone: "info"
            },
            "stat:output": {
              label: "Output",
              value: "3",
              tone: "success"
            }
          }
        }
      }
    }
  }
}
```

## Typography & Icons

SlexKit's typography is calm, clear, and technical. Icons are light, rounded, and restrained — serving as punctuation marks in the interface, not illustrations.

```slex
{
  namespace: "design_type_icon",
  layout: {
    "grid:type": {
      columns: 1,
      lgColumns: 2,
      "card:type": {
        "heading:title": { level: 4, title: "Type Voice", meta: "GEIST / NOTO SANS SC" },
        "diagram:font": { kind: "font-sample" },
        "text:body": { text: "English uses Geist, Chinese uses Noto Sans SC. Letterforms stay open and clean, serving readability rather than volume." }
      },
      "card:icon": {
        "heading:title": { level: 4, title: "Icon Voice", meta: "PHOSPHOR ICONS" },
        "row:icons": {
          "button:sparkle": { icon: "sparkle", iconOnly: true, label: "Assist" },
          "button:book": { icon: "book-open-text", iconOnly: true, label: "Manual" },
          "button:terminal": { icon: "terminal-window", iconOnly: true, label: "Terminal" },
          "button:cursor": { icon: "cursor-click", iconOnly: true, label: "Click" },
          "button:nut": { icon: "nut", iconOnly: true, label: "Nut" },
          "button:gear": { icon: "gear-six", iconOnly: true, label: "Gear" }
        },
        "text:body": { text: "Phosphor's character comes from geometric outlines, rounded corners, and consistent stroke width. When choosing icons, first check tone consistency, then semantic accuracy." }
      }
    }
  }
}
```

## Markdown Authoring

Design specs and component pages use Markdown for prose, with `slex` fenced blocks for runnable examples, achieving docs-as-examples authoring.

```slex
{
  namespace: "design_markdown",
  layout: {
    "grid:doc": {
      columns: 1,
      lgColumns: 3,
      "card:write": {
        "diagram:markdown": {},
        "heading:title": { level: 4, title: "Prose in Markdown" },
        "text:body": { text: "Explain context, boundaries, and rules. Do not write explanations inside UI components." }
      },
      "card:run": {
        "diagram:fence": {},
        "heading:title": { level: 4, title: "Examples in slex" },
        "text:body": { text: "Every key example should render and preview live, not be a screenshot." }
      },
      "card:compare": {
        "diagram:cards": {},
        "heading:title": { level: 4, title: "Rules as Small Cards" },
        "text:body": { text: "Put comparable principles into cards so readers can judge at a glance." }
      }
    }
  }
}
```

## Product Shape

SlexKit targets interactive fragments inside Markdown, not full applications. Typical scenarios include:

- A card explaining a result
- A row of metrics
- A form-like control area
- A status or confirmation block

The framework focuses on embedded document interactions, not routing, global app state, SSR, data fetching frameworks, or general UI standardization.

```slex
{
  namespace: "design_shape",
  layout: {
    "card:status": {
      title: "Build summary",
      tone: "info",
      "row:metrics": {
        "stat:passed": { label: "Passed", value: 28, tone: "success" },
        "stat:failed": { label: "Failed", value: 1, tone: "danger" },
        "stat:queued": { label: "Queued", value: 3, tone: "muted" }
      },
      "text:note": {
        text: "Keep the surface focused on one document or message task."
      }
    }
  }
}
```

## Tone Rules

Components support semantic tone values for expressing state roles.

```slex
{
  namespace: "design_tones",
  layout: {
    "grid:tones": {
      columns: 1,
      mdColumns: 2,
      lgColumns: 3,
      "card:info": {
        tone: "info",
        "badge:tone": { label: "info", tone: "info" },
        "text:body": { text: "Neutral guidance, current process, or informational state." }
      },
      "card:success": {
        tone: "success",
        "badge:tone": { label: "success", tone: "success" },
        "text:body": { text: "Completed, accepted, or safe-to-continue state." }
      },
      "card:warning": {
        tone: "warning",
        "badge:tone": { label: "warning", tone: "warning" },
        "text:body": { text: "Risk, threshold, or review-needed state." }
      },
      "card:danger": {
        tone: "danger",
        "badge:tone": { label: "danger", tone: "danger" },
        "text:body": { text: "Error, destructive action, or blocked state." }
      },
      "card:muted": {
        tone: "muted",
        "badge:tone": { label: "muted", tone: "muted" },
        "text:body": { text: "Secondary or background information." }
      }
    }
  }
}
```

## Display UI Versus ToolHost

Display UI is for information presentation and local interaction. ToolHost mode is used when the host needs structured results from the user.

```slex
{
  namespace: "design_boundary",
  layout: {
    "grid:boundary": {
      columns: 1,
      mdColumns: 2,
      "card:display": {
        tone: "muted",
        title: "Display UI",
        "text:body": { text: "Use slex fences for status, metrics, previews, and local controls." },
        "badge:kind": { label: "No host result", tone: "muted" }
      },
      "card:toolhost": {
        tone: "info",
        title: "ToolHost",
        "text:body": { text: "Use tool templates when confirmation or form data must return to the host." },
        "badge:kind": { label: "Returns ToolResult", tone: "info" }
      }
    }
  }
}
```
