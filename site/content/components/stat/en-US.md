---
title: "Stat"
category: Display
status: ready
order: 10
summary: "Metric display with label, value, unit, and semantic tone."
---

# Stat

Presents a labeled value with optional unit, icon, tone, and initial animation.

## HTML example

```slex
<slex-row>
  <slex-stat id="calculated" label="Calculated" unit="V"></slex-stat>
  <slex-stat label="Authored precision" value="1.000" unit="ms"></slex-stat>
</slex-row>
<script type="module">
  slex.root.querySelector("#calculated").value = Math.PI;
</script>
```

Numbers use at most six significant digits and adapt to the available width, using scientific notation when needed. Formatting only affects display: `.value` keeps the original value. A short formatted string such as `"1.000"` keeps its trailing zeros. Oversized decimal strings can also adapt; integer strings and identifiers remain literal and use an ellipsis when necessary. Hover over the value or use assistive reading to access its full text, including the unit.

Numeric values keep their left-to-right digit order in RTL pages. Text values use the browser's automatic direction and text shaping.

## API Reference

Defaults describe rendered behavior when an attribute is omitted, not necessarily the property getter; `auto` means derived as described. Boolean attributes use presence; pass arrays through JavaScript properties.

| Property / attribute | Type | Default | Description |
| --- | --- | --- | --- |
| `label` | string | `""` | Visible control label. |
| `value` | string / number | `""` | Numeric display uses up to six significant digits and fits the available width; the live value is unchanged. Short formatted strings are retained. Full values are available in the tooltip and accessible text. |
| `unit` | string | `""` | Unit shown after the value. |
| `icon` | string | `""` | Registered icon name. No icon is rendered when empty. |
| `tone` | string | unset | Tone data value used by theme styles. |
| `animateInitial` / `animate-initial` | boolean | `false` | Animates digits from zero on the first render. |

## Contract summary

- Attributes: `label`, `value`, `unit`, `icon`, `tone`, `animate-initial`
- Properties: `label`, `value`, `unit`, `icon`, `tone`, `animateInitial`
- Events: none
- Slots: none

Use `dist/custom-elements.json` for exact types and full descriptions. Use attributes for scalar initial values, JavaScript properties for arrays/objects, and native events for interaction.
