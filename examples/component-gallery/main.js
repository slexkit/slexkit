import { mount } from "/dist/slexkit.js";

mount({
  namespace: "example_component_gallery",
  g: {
    environment: "production",
    mode: "overview",
    enabled: true,
    volume: 42,
    accepted: false,
    priority: "medium",
    progress: 68,
    toastNonce: 0,
    notify() {
      this.toastNonce += 1;
    },
  },
  layout: {
    "column:gallery": {
      "card:inputs": {
        title: "Input controls",
        "grid:controls": {
          columns: 1,
          mdColumns: 2,
          "select:environment": {
            label: "Environment",
            $value: "g.environment",
            placeholder: "Choose environment",
            options: [
              { label: "Development", value: "development" },
              { label: "Staging", value: "staging" },
              { label: "Production", value: "production" },
            ],
            onchange: "g.environment = $event",
            onselect: "g.environment = $event",
          },
          "tabs:mode": {
            $value: "g.mode",
            tabs: [
              { label: "Overview", value: "overview", icon: "ChartBar" },
              { label: "Events", value: "events", icon: "Bell" },
              { label: "Settings", value: "settings", icon: "Gear" },
            ],
            onchange: "g.mode = $event",
          },
          "switch:enabled": {
            label: "Live updates",
            $enabled: "g.enabled",
            onchange: "g.enabled = $event",
          },
          "slider:volume": {
            label: "Signal threshold",
            min: 0,
            max: 100,
            step: 1,
            unit: "%",
            $value: "g.volume",
            onchange: "g.volume = $event",
          },
          "checkbox:accepted": {
            label: "Include archived data",
            $checked: "g.accepted",
            onchange: "g.accepted = $event",
          },
          "radio-group:priority": {
            label: "Priority",
            $value: "g.priority",
            orientation: "horizontal",
            options: [
              { label: "Low", value: "low" },
              { label: "Medium", value: "medium" },
              { label: "High", value: "high" },
            ],
            onchange: "g.priority = $event",
          },
        },
      },
      "card:feedback": {
        title: "Disclosure and feedback",
        "accordion:details": {
          value: "state",
          items: [
            { label: "State", value: "state", content: "The controls write into g and re-render dependent props." },
            { label: "Accessibility", value: "a11y", content: "Select and tabs expose ARIA state for keyboard users." },
          ],
        },
        "progress:progress": {
          label: "Gallery coverage",
          $value: "g.progress",
          max: 100,
        },
        "button:toast": {
          label: "Show toast",
          variant: "secondary",
          onclick: "g.notify()",
        },
        "toast:notice": {
          $if: "g.toastNonce > 0",
          tone: "success",
          title: "Gallery event",
          $description: "'Toast render #' + g.toastNonce",
          duration: 0,
        },
      },
      "card:state": {
        title: "Current state",
        "grid:stats": {
          columns: 1,
          mdColumns: 4,
          "stat:environment": { label: "Environment", $value: "g.environment" },
          "stat:mode": { label: "Mode", $value: "g.mode" },
          "stat:threshold": { label: "Threshold", $value: "g.volume", unit: "%" },
          "stat:priority": { label: "Priority", $value: "g.priority" },
        },
      },
    },
  },
}, document.getElementById("app"), { theme: "host-shadcn" });
