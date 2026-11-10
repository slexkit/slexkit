# Theme contract

SlexKit supports `auto`, `host-shadcn`, `uno`, and `flowbite` theme modes.
The runtime resolves `auto` to `host-shadcn` only when the mount container has
the complete required semantic palette:

```text
--background
--foreground
--card
--card-foreground
--popover
--popover-foreground
--primary
--primary-foreground
--secondary
--secondary-foreground
--muted
--muted-foreground
--accent
--accent-foreground
--destructive
--destructive-foreground
--border
--input
--ring
```

If any required token is absent, `auto` selects `uno`. This prevents a partial
host palette from being mistaken for a complete theme. An explicit
`theme: "host-shadcn"` request is always honored.

## Host token inheritance and fallbacks

SlexKit does not declare shadcn semantic variables such as `--foreground` on
its root. Declaring them there would mask values inherited from the host.
Instead, component styles consume private `--slex-*` aliases. Each alias reads
the corresponding inherited host variable and supplies a per-variable
fallback when it is missing.

Light and dark fallback palettes are both provided. A complete host palette is
used unchanged, while an explicitly selected missing or partial palette remains
readable. If a host supplies only one side of any semantic color pair, the runtime
uses its coherent fallback color palette instead of mixing unmatched colors.
Supply both background and foreground tokens to preserve host branding. Token
changes are observed and the observer is released on unmount. A dark fallback is selected below `.dark` or
`[data-theme="dark"]`.

The additional `--info`, `--success`, and `--warning` color pairs are supported
when supplied by a host and otherwise use SlexKit fallbacks. They are not
required for automatic host-theme detection because they are extensions to the
standard shadcn semantic palette.

## Optional component tokens

Hosts may customize these optional tokens. Omitting them preserves the existing
component defaults:

| Token | Purpose | Default at use site |
| --- | --- | --- |
| `--slex-control-height` | Controls and text fields | Existing per-component heights (`2.25rem`, `2.5rem`, `2.5625rem`) |
| `--slex-control-gap` | Spacing between control content | `0.5rem` |
| `--slex-surface-padding` | Padding for selectable surfaces | `0.6rem 0.75rem` |
| `--slex-focus-ring-width` | Focus-ring width | `2px` |
| `--slex-motion-duration` | Standard component motion duration | Existing per-component duration |
| `--slex-motion-easing` | Standard component motion easing | Existing per-component easing |

Component-specific tokens, such as `--slex-tabs-indicator-duration`, continue
to take precedence over the standard motion duration.
