import { presetWind4 } from "@unocss/preset-wind4";
import { colors } from "@unocss/preset-wind4/colors";

const zinc = colors.zinc;
const blue = colors.blue;
const emerald = colors.emerald;
const amber = colors.amber;
const red = colors.red;

const semanticColors = {
  background: "var(--background)",
  foreground: "var(--foreground)",
  card: "var(--card)",
  "card-foreground": "var(--card-foreground)",
  popover: "var(--popover)",
  "popover-foreground": "var(--popover-foreground)",
  primary: {
    50: "var(--slex-primary-50)",
    100: "var(--slex-primary-100)",
    200: "var(--slex-primary-200)",
    300: "var(--slex-primary-300)",
    400: "var(--slex-primary-400)",
    500: "var(--slex-primary-500)",
    600: "var(--slex-primary-600)",
    700: "var(--slex-primary-700)",
    800: "var(--slex-primary-800)",
    900: "var(--slex-primary-900)",
    950: "var(--slex-primary-950)",
    DEFAULT: "var(--primary)",
  },
  "primary-foreground": "var(--primary-foreground)",
  secondary: "var(--secondary)",
  "secondary-foreground": "var(--secondary-foreground)",
  muted: "var(--muted)",
  "muted-foreground": "var(--muted-foreground)",
  accent: "var(--accent)",
  "accent-foreground": "var(--accent-foreground)",
  info: "var(--info)",
  "info-foreground": "var(--info-foreground)",
  success: "var(--success)",
  "success-foreground": "var(--success-foreground)",
  warning: "var(--warning)",
  "warning-foreground": "var(--warning-foreground)",
  destructive: "var(--destructive)",
  "destructive-foreground": "var(--destructive-foreground)",
  border: "var(--border)",
  input: "var(--input)",
  ring: "var(--ring)",
};

function unoThemeVars(dark = false): Record<string, string> {
  if (dark) {
    return {
      "color-scheme": "dark",
      "--background": zinc[950],
      "--foreground": zinc[50],
      "--card": zinc[900],
      "--card-foreground": zinc[50],
      "--popover": zinc[900],
      "--popover-foreground": zinc[50],
      "--primary": zinc[50],
      "--primary-foreground": zinc[950],
      "--secondary": zinc[800],
      "--secondary-foreground": zinc[50],
      "--muted": zinc[800],
      "--muted-foreground": zinc[400],
      "--accent": zinc[800],
      "--accent-foreground": zinc[50],
      "--info": blue[500],
      "--info-foreground": zinc[950],
      "--success": emerald[400],
      "--success-foreground": zinc[950],
      "--warning": amber[400],
      "--warning-foreground": zinc[950],
      "--destructive": red[400],
      "--destructive-foreground": zinc[950],
      "--border": zinc[800],
      "--input": zinc[700],
      "--ring": zinc[300],
      "--radius": "0.5rem",
      "--slex-control-height": "2.25rem",
      "--slex-primary-50": zinc[50],
      "--slex-primary-100": zinc[100],
      "--slex-primary-200": zinc[200],
      "--slex-primary-300": zinc[300],
      "--slex-primary-400": zinc[400],
      "--slex-primary-500": zinc[500],
      "--slex-primary-600": zinc[600],
      "--slex-primary-700": zinc[700],
      "--slex-primary-800": zinc[800],
      "--slex-primary-900": zinc[900],
      "--slex-primary-950": zinc[950],
    };
  }

  return {
    "color-scheme": "light",
    "--background": colors.white,
    "--foreground": zinc[950],
    "--card": colors.white,
    "--card-foreground": zinc[950],
    "--popover": colors.white,
    "--popover-foreground": zinc[950],
    "--primary": zinc[900],
    "--primary-foreground": zinc[50],
    "--secondary": zinc[100],
    "--secondary-foreground": zinc[900],
    "--muted": zinc[100],
    "--muted-foreground": zinc[500],
    "--accent": zinc[100],
    "--accent-foreground": zinc[900],
    "--info": blue[700],
    "--info-foreground": colors.white,
    "--success": emerald[600],
    "--success-foreground": colors.white,
    "--warning": amber[600],
    "--warning-foreground": zinc[950],
    "--destructive": red[600],
    "--destructive-foreground": zinc[50],
    "--border": zinc[200],
    "--input": zinc[200],
    "--ring": zinc[950],
    "--radius": "0.5rem",
    "--slex-control-height": "2.25rem",
    "--slex-primary-50": zinc[50],
    "--slex-primary-100": zinc[100],
    "--slex-primary-200": zinc[200],
    "--slex-primary-300": zinc[300],
    "--slex-primary-400": zinc[400],
    "--slex-primary-500": zinc[500],
    "--slex-primary-600": zinc[600],
    "--slex-primary-700": zinc[700],
    "--slex-primary-800": zinc[800],
    "--slex-primary-900": zinc[900],
    "--slex-primary-950": zinc[950],
  };
}

function cssVars(vars: Record<string, string>): string {
  return Object.entries(vars)
    .map(([key, value]) => `${key}: ${value};`)
    .join("\n");
}

export function fallbackThemeCss(): string {
  return `
:root {
color-scheme: light;
}

:root:where(.dark, [data-theme="dark"]) {
color-scheme: dark;
}

.slexkit-theme-uno,
.slexkit-theme-flowbite,
body.slexkit-theme-uno {
${cssVars(unoThemeVars())}
}

:where(.dark, [data-theme="dark"]) .slexkit-theme-uno,
.slexkit-theme-uno:where(.dark, [data-theme="dark"]),
:where(.dark, [data-theme="dark"]) .slexkit-theme-flowbite,
.slexkit-theme-flowbite:where(.dark, [data-theme="dark"]),
:where(.dark, [data-theme="dark"]) body.slexkit-theme-uno,
body.slexkit-theme-uno:where(.dark, [data-theme="dark"]) {
${cssVars(unoThemeVars(true))}
}
`;
}

export default {
  presets: [presetWind4({ preflights: { reset: false } })],
  content: {
    pipeline: {
      exclude: [/site[\\/]components[\\/].*\.html(\?.*)?$/],
    },
  },
  safelist: [
    "ui-button",
    "ui-button-primary",
    "ui-button-secondary",
    "ui-button-outline",
    "bg-accent",
    "text-accent-foreground",
    "font-medium",
    "w-full",
    "site-example-card",
    "site-example-title",
    "site-example-desc",
  ],
  preflights: [
    {
      getCSS: fallbackThemeCss,
    },
  ],
  extendTheme(theme: Record<string, unknown>) {
    const themeColors = (theme.colors ?? {}) as Record<string, unknown>;
    return {
      ...theme,
      colors: {
        ...themeColors,
        ...semanticColors,
      },
      fontFamily: {
        ...((theme.fontFamily ?? {}) as Record<string, unknown>),
        sans: `var(--font-sans, "Geist", "Geist Sans", "Noto Sans SC", "Noto Sans", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif)`,
        mono: `var(--font-mono, "Geist Mono", "Noto Sans Mono", "Noto Sans Mono CJK SC", "SFMono-Regular", "Cascadia Code", Consolas, monospace)`,
      },
      borderRadius: {
        ...((theme.borderRadius ?? {}) as Record<string, unknown>),
        sm: "calc(var(--radius, 0.5rem) - 4px)",
        md: "calc(var(--radius, 0.5rem) - 2px)",
        lg: "var(--radius, 0.5rem)",
        xl: "calc(var(--radius, 0.5rem) + 4px)",
      },
    };
  },
  shortcuts: {
    "slex-token-focus": "outline-none ring-2 ring-ring ring-offset-2 ring-offset-background",
    "slex-token-surface": "bg-card text-card-foreground border border-border rounded-lg",
    "slex-token-muted": "bg-muted text-muted-foreground",
    "ui-button":
      "inline-flex h-9 appearance-none items-center justify-center whitespace-nowrap rounded-md border border-solid border-transparent px-3 text-sm font-medium no-underline transition-colors focus-visible:slex-token-focus disabled:pointer-events-none disabled:opacity-50",
    "ui-button-primary": "border border-primary bg-primary text-primary-foreground shadow-sm hover:opacity-90",
    "ui-button-secondary": "bg-secondary text-secondary-foreground shadow-sm hover:bg-accent hover:text-accent-foreground",
    "ui-button-outline": "border border-input bg-background text-foreground shadow-sm hover:bg-accent hover:text-accent-foreground",
    "site-example-card":
      "flex min-h-[92px] cursor-pointer flex-col rounded-lg border border-solid border-border bg-card p-4 text-card-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground",
    "site-example-title": "m-0 text-[15px] font-semibold tracking-normal",
    "site-example-desc": "mt-2 text-[13px] text-muted-foreground",
  },
};
