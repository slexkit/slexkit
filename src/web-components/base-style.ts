/** The trusted shadow-root layout rules and their matching sandbox CSP hash. */
export const COMPONENT_BASE_STYLE =
  ":host{display:block;min-width:0}:host([hidden]){display:none}slot{display:contents}::slotted(*){min-width:0}" +
  ":host([data-slex-balanced-tile])>.slexkit-root{height:100%}" +
  ":host([data-slex-balanced-tile]) .slex-stat,:host([data-slex-balanced-tile]) .slex-card{height:100%}" +
  ":host([data-slex-balanced-tile]) .slex-stat-value{margin-top:auto}";

export const COMPONENT_BASE_STYLE_HASH = "'sha256-/+wPaniv7ff+evYTYaHp8Y7d2pQIT1aK4xJMcRqLRkQ='";
