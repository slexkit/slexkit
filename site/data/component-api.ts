export type ComponentApiField = {
  type?: string;
  default: string;
  en: string;
  zh: string;
};

type ApiFields = Record<string, ComponentApiField>;

const field = (type: string, defaultValue: string, en: string, zh: string): ComponentApiField => ({
  type,
  default: defaultValue,
  en,
  zh,
});

const emptyText = (en: string, zh: string): ComponentApiField => field("string", '""', en, zh);
const icon = field(
  "string",
  '""',
  "Registered icon name. No icon is rendered when empty.",
  "已注册的图标名称；为空时不渲染图标。",
);
const disabled = field("boolean", "false", "Disables user interaction.", "禁用用户交互。");
const formLabel = emptyText("Visible control label.", "控件的可见标签。");
const formUnit = emptyText(
  "Unit text shown with the value when the component supports it.",
  "组件支持时随值显示的单位文本。",
);
const formDescriptionIgnored = emptyText(
  "Exposed for contract consistency, but this component does not currently render it.",
  "为保持接口一致而暴露，但该组件目前不会渲染它。",
);
const formName = field(
  "string",
  "unset",
  "Name used when the custom element participates in a native form.",
  "自定义元素参与原生表单时使用的字段名。",
);
const ariaLabel = field(
  "string",
  "auto",
  "Accessible name override; otherwise the visible label supplies the name when available.",
  "无障碍名称覆盖；省略时会在可用时使用可见标签。",
);
const required = field(
  "boolean",
  "false",
  "Requires a value for native form validity.",
  "要求提供值以通过原生表单校验。",
);

const sliderFields: ApiFields = {
  label: formLabel,
  unit: formUnit,
  description: formDescriptionIgnored,
  disabled,
  name: formName,
  value: field(
    "number",
    "0",
    "Current numeric value; the browser clamps and step-aligns assignments.",
    "当前数值；浏览器会按范围与步长约束赋值。",
  ),
  "aria-label": ariaLabel,
  min: field("string / number", "0", "Minimum range value.", "范围最小值。"),
  max: field("string / number", "100", "Maximum range value.", "范围最大值。"),
  step: field("string / number", "1", "Range step size.", "范围步长。"),
  orientation: field(
    "string",
    "horizontal",
    "Sets the orientation data marker; the current native range and styling remain horizontal.",
    "设置方向数据标记；当前原生 range 与样式仍保持水平。",
  ),
  valueAsNumber: field(
    "number",
    "0",
    "Read-only JavaScript property exposing the current numeric value after browser clamping and step alignment.",
    "只读 JavaScript property，返回经浏览器范围限制与步长对齐后的当前数值。",
  ),
};

const checkboxFields: ApiFields = {
  label: formLabel,
  unit: formDescriptionIgnored,
  description: formDescriptionIgnored,
  disabled,
  name: formName,
  value: field(
    "string / number",
    '"on"',
    "Value submitted when checked; defaults to on when no value was assigned. Use checked to control the visual state.",
    "选中时提交的值；未赋入 value 时提交 on。通过 checked 控制视觉状态。",
  ),
  "aria-label": ariaLabel,
  checked: field("boolean", "false", "Current checked state.", "当前选中状态。"),
};

const switchFields: ApiFields = {
  label: formLabel,
  unit: formDescriptionIgnored,
  description: formDescriptionIgnored,
  disabled,
  name: formName,
  value: field(
    "string / number",
    '"on"',
    "Value submitted when enabled; defaults to on when no value was assigned. Use enabled or checked to control the state.",
    "启用时提交的值；未赋入 value 时提交 on。通过 enabled 或 checked 控制状态。",
  ),
  "aria-label": ariaLabel,
  checked: field(
    "boolean",
    "false",
    "Alias of enabled; the wrapper keeps both states synchronized.",
    "enabled 的别名；包装层会同步两者状态。",
  ),
  enabled: field(
    "boolean",
    "false",
    "Current on/off state; synchronized with checked.",
    "当前开关状态；与 checked 同步。",
  ),
};

const selectBase: ApiFields = {
  label: formLabel,
  unit: formDescriptionIgnored,
  description: formDescriptionIgnored,
  disabled,
  name: formName,
  value: field(
    "string / number",
    '""',
    "Selected option value. Light-DOM option children derive the first enabled value; property-supplied options do not auto-select.",
    "已选选项值。使用 light DOM option 子元素时会推导首个可用值；通过 property 提供 options 时不会自动选择。",
  ),
  "aria-label": field("string", "auto", "Accessible name when no visible label is provided.", "未提供可见标签时使用的无障碍名称。"),
};

export const componentApiMetadata: Record<string, Record<string, ComponentApiField>> = {
  column: {},
  card: {
    title: emptyText(
      "Optional heading above the default-slot content.",
      "默认插槽内容上方的可选标题。",
    ),
    icon,
    tone: field(
      "string",
      "unset",
      "Tone data value used by theme styles.",
      "供主题样式使用的色调数据值。",
    ),
    variant: field("string", "unset", "Presentation variant data value.", "展示变体数据值。"),
  },
  grid: {
    columns: field(
      "string / number",
      "1",
      "Base column count. The grid is forced to one column below 640px of isolated-document width.",
      "基础列数。隔离文档宽度低于 640px 时强制为单列。",
    ),
    smColumns: field(
      "string / number",
      "unset",
      "Column count from 640px isolated-document width.",
      "隔离文档宽度从 640px 起使用的列数。",
    ),
    mdColumns: field(
      "string / number",
      "auto",
      "Column count from 768px isolated-document width; falls back to columns.",
      "隔离文档宽度从 768px 起使用的列数；默认回退到 columns。",
    ),
    lgColumns: field(
      "string / number",
      "unset",
      "Column count from 1024px isolated-document width.",
      "隔离文档宽度从 1024px 起使用的列数。",
    ),
    xlColumns: field(
      "string / number",
      "unset",
      "Column count from 1280px isolated-document width.",
      "隔离文档宽度从 1280px 起使用的列数。",
    ),
    gap: field(
      "string",
      "1rem",
      "CSS length used as the grid gap; unitless token integers are not supported.",
      "作为网格间距的 CSS 长度；不支持无单位 token 整数。",
    ),
  },
  row: {
    gap: field(
      "string",
      "1rem",
      "CSS length used between children; unitless token integers are not supported.",
      "子元素之间的 CSS 长度；不支持无单位 token 整数。",
    ),
    align: field(
      "string",
      "stretch",
      "CSS align-items value. When omitted, same-kind stat/card children balance automatically with equal row heights. Explicit align or justify selects normal flex layout.",
      "CSS align-items 值。省略时，同类 stat/card 自动均衡分列并保持同行等高；显式 align 或 justify 使用普通 flex 布局。",
    ),
    justify: field("string", "normal", "CSS justify-content value.", "CSS justify-content 值。"),
  },
  slider: sliderFields,
  checkbox: checkboxFields,
  switch: switchFields,
  button: {
    label: emptyText(
      "Visible button text; omitted values are derived from the element's text content.",
      "可见按钮文本；省略时从元素文本内容推导。",
    ),
    icon,
    variant: field(
      "string",
      "primary",
      "Visual variant such as primary, secondary, danger, or ghost.",
      "视觉变体，例如 primary、secondary、danger 或 ghost。",
    ),
    disabled,
    pressed: field(
      "boolean",
      "false",
      "Pressed state for icon weight and aria-pressed.",
      "用于图标粗细与 aria-pressed 的按下状态。",
    ),
    selected: field(
      "boolean",
      "false",
      "Selected visual state; it does not add aria-pressed by itself.",
      "视觉选中状态；单独设置时不会添加 aria-pressed。",
    ),
    title: emptyText("Native tooltip text; provide label or element text for the visible caption.", "原生提示文本；可见标题请使用 label 或元素文本。"),
    "aria-label": ariaLabel,
  },
  stat: {
    label: formLabel,
    value: field(
      "string / number",
      '""',
      "Numeric display uses up to six significant digits and fits the available width; the live value is unchanged. Short formatted strings are retained. Full values are available in the tooltip and accessible text.",
      "数值显示最多六位有效数字，并按可用宽度调整；不改变 value 原值。保留较短的格式化字符串，完整值可通过悬停提示与无障碍文本读取。",
    ),
    unit: emptyText("Unit shown after the value.", "显示在值之后的单位。"),
    icon,
    tone: field(
      "string",
      "unset",
      "Tone data value used by theme styles.",
      "供主题样式使用的色调数据值。",
    ),
    animateInitial: field(
      "boolean",
      "false",
      "Animates digits from zero on the first render.",
      "首次渲染时让数字从零开始动画。",
    ),
  },
  text: {
    content: emptyText(
      "Primary text content; takes precedence over text and label.",
      "主要文本内容；优先于 text 与 label。",
    ),
    text: emptyText("Alternate text field. Light-DOM-derived content takes precedence even when empty; prefer content or element text.", "备用文本字段。从 light DOM 推导的 content 即使为空也优先使用；建议使用 content 或元素文本。"),
    label: emptyText(
      "Alternate label field; the light-DOM-derived content takes precedence. Prefer content or element text.",
      "备用标签字段；从 light DOM 推导的 content 优先使用，建议使用 content 或元素文本。",
    ),
    variant: field(
      "string",
      "unset",
      "Adds the matching text variant class.",
      "添加对应的文本变体 class。",
    ),
    color: field(
      "string",
      "inherited",
      "CSS color value; inherits when unset.",
      "CSS 颜色值；未设置时继承。",
    ),
    size: field(
      "string / number",
      "inherited",
      "CSS font-size; numeric values are interpreted as pixels.",
      "CSS 字号；数值按像素解释。",
    ),
  },
  progress: {
    label: formLabel,
    value: field(
      "string / number",
      "0",
      "Percentage clamped to the 0–100 range.",
      "会限制在 0–100 范围内的百分比。",
    ),
    icon,
    indeterminate: field(
      "boolean",
      "false",
      "Removes numeric ARIA range values and marks indeterminate state.",
      "移除数值型 ARIA 范围并标记为不定进度。",
    ),
    "aria-label": ariaLabel,
  },
  badge: {
    label: emptyText("Primary badge text.", "主要徽标文本。"),
    text: emptyText("Alternate badge text; the light-DOM-derived label takes precedence. Prefer label or element text.", "备用徽标文本；从 light DOM 推导的 label 优先使用，建议使用 label 或元素文本。"),
    icon,
    tone: field(
      "string",
      "neutral",
      "Badge tone; danger and error normalize to destructive.",
      "徽标色调；danger 与 error 会归一化为 destructive。",
    ),
    variant: field(
      "string",
      "neutral",
      "Fallback tone alias used only when tone is unset.",
      "仅在 tone 未设置时使用的后备色调别名。",
    ),
  },
  "code-block": {
    code: emptyText("Primary code source.", "主要代码源。"),
    content: emptyText("Alternate source field; the light-DOM-derived code takes precedence. Prefer code or element text.", "备用代码源字段；从 light DOM 推导的 code 优先使用，建议使用 code 或元素文本。"),
    language: emptyText(
      "Language label and syntax-highlighting hint; unsupported names render plain code.",
      "语言标签与语法高亮提示；不支持的名称会按纯文本代码渲染。",
    ),
    title: emptyText("Optional caption title.", "可选标题说明。"),
  },
  divider: {
    label: emptyText("Optional centered divider label.", "可选的居中分隔标签。"),
    icon,
  },
  link: {
    text: emptyText("Primary visible link text.", "主要可见链接文本。"),
    label: emptyText("Alternate label field; the light-DOM-derived text takes precedence. Prefer text or element text.", "备用标签字段；从 light DOM 推导的 text 优先使用，建议使用 text 或元素文本。"),
    href: field(
      "string",
      '"#"',
      "Destination URL; executable URL schemes are replaced with #.",
      "目标 URL；可执行 URL scheme 会替换为 #。",
    ),
    target: field(
      "string",
      "unset",
      "Browsing-context target; _blank also adds noreferrer.",
      "浏览上下文目标；_blank 会同时添加 noreferrer。",
    ),
    icon,
    variant: field(
      "string",
      "unset",
      "Variant data value used by theme styles.",
      "供主题样式使用的变体数据值。",
    ),
  },
  table: {
    columns: field(
      "array",
      "[]",
      "Property-only column keys or { key, label, icon } objects.",
      "仅 property；列键或 { key, label, icon } 对象数组。",
    ),
    rows: field(
      "array",
      "[]",
      "Property-only row data; takes precedence over items, including an empty array.",
      "仅 property；行数据，包含空数组在内都优先于 items。",
    ),
    items: field(
      "array",
      "[]",
      "Property-only fallback row data used when rows is unset.",
      "仅 property；rows 未设置时使用的后备行数据。",
    ),
  },
  select: {
    ...selectBase,
    options: field(
      "array",
      "[]",
      "Property-only { label, value, disabled, icon } option objects; light-DOM option children are also derived.",
      "仅 property；{ label, value, disabled, icon } 选项对象数组；也会从 light DOM option 子元素推导。",
    ),
    placeholder: field(
      "string",
      '"Select..."',
      "Text shown when no option is selected.",
      "未选择选项时显示的文本。",
    ),
    icon,
    variant: field(
      "string",
      "default",
      "Visual variant; toolbar enables the compact toolbar treatment.",
      "视觉变体；toolbar 启用紧凑工具栏样式。",
    ),
    required,
  },
  "radio-group": {
    ...selectBase,
    value: field(
      "string / number",
      '""',
      "Selected option value. Neither property-supplied nor light-DOM-derived options auto-select a value.",
      "已选选项值。通过 property 提供或从 light DOM 推导的选项都不会自动选择值。",
    ),
    options: field(
      "array",
      "[]",
      "Property-only { label, value, description, disabled, icon } option objects; light-DOM option children are also derived.",
      "仅 property；{ label, value, description, disabled, icon } 选项对象数组；也会从 light DOM option 子元素推导。",
    ),
    orientation: field(
      "string",
      "vertical",
      "Layout orientation; horizontal places choices in a wrapping row.",
      "布局方向；horizontal 会将选项放入可换行横排。",
    ),
    icon,
    variant: field(
      "string",
      "unset",
      "Visual variant; list renders card-like options.",
      "视觉变体；list 会将选项渲染为卡片式列表。",
    ),
    required,
  },
  tabs: {
    value: field(
      "scalar",
      "auto",
      "Selected tab value. Named light-DOM panels derive tabs and select the first enabled panel; property-supplied tabs require an explicit value.",
      "选中的标签值。具名 light DOM 面板会推导 tabs 并选择首个可用面板；通过 property 提供 tabs 时需显式设置 value。",
    ),
    tabs: field(
      "array",
      "[]",
      "Property-only tab objects. Named light-DOM panels can derive this array and supply their content.",
      "仅 property；标签对象数组。具名 light DOM 面板可推导此数组并提供内容。",
    ),
    orientation: field(
      "string",
      "horizontal",
      "Tab-list orientation. At 640px or less of isolated-document width, vertical tabs collapse to a horizontal scrolling list.",
      "标签列表方向。隔离文档宽度不超过 640px 时，vertical 会折叠为可横向滚动的列表。",
    ),
  },
  accordion: {
    value: field(
      "scalar / array",
      "unset",
      "Open item value, or an array of values when multiple is true.",
      "展开项的值；multiple 为 true 时使用值数组。",
    ),
    items: field(
      "array",
      "[]",
      "Property-only item objects. Named light-DOM panels derive items and override each item's text content.",
      "仅 property；项目对象数组。具名 light DOM 面板会推导 items，并覆盖对应项目的文本内容。",
    ),
    multiple: field(
      "boolean",
      "false",
      "Allows more than one item to remain open.",
      "允许多个项目同时保持展开。",
    ),
  },
  collapsible: {
    open: field("boolean", "false", "Current expanded state.", "当前展开状态。"),
    trigger: field("string", '"Toggle"', "Trigger button label.", "触发按钮标签。"),
    icon,
    content: emptyText(
      "Text rendered in the panel alongside default-slot children.",
      "在面板中与默认插槽子元素一同渲染的文本。",
    ),
  },
  formula: {
    tex: emptyText(
      "TeX source; empty input renders a harmless spacing formula.",
      "TeX 源码；为空时渲染无害的间距公式。",
    ),
    displayMode: field(
      "boolean",
      "true",
      "Uses KaTeX display mode by default. Assign displayMode = false for inline mode; omitting the attribute restores display mode.",
      "默认使用 KaTeX 展示模式。将 displayMode property 赋为 false 可切换到行内模式；省略属性则恢复展示模式。",
    ),
  },
  callout: {
    title: emptyText("Optional callout heading.", "可选提示框标题。"),
    content: emptyText(
      "Primary body text, rendered alongside default-slot children.",
      "主要正文文本，与默认插槽子元素一同渲染。",
    ),
    description: emptyText(
      "Fallback body text used when content is unset.",
      "未设置 content 时使用的后备正文。",
    ),
    tone: field(
      "string",
      "info",
      "Semantic tone; error and destructive normalize to danger.",
      "语义色调；error 与 destructive 会归一化为 danger。",
    ),
    icon,
  },
  section: {
    title: emptyText("Section heading.", "分区标题。"),
    subtitle: emptyText("Supporting text below the heading.", "标题下方的辅助文本。"),
    icon: field(
      "string",
      '""',
      "Heading icon; it renders only when a header exists.",
      "标题图标；仅在存在 header 时渲染。",
    ),
  },
  step: {
    title: emptyText("Step heading.", "步骤标题。"),
    description: emptyText("Supporting text below the heading.", "标题下方的辅助文本。"),
    index: field(
      "string / number",
      "unset",
      "Current step index; shown alone unless total is set.",
      "当前步骤序号；未设置 total 时单独显示。",
    ),
    total: field(
      "string / number",
      "unset",
      "Total step count, rendered with index as index/total.",
      "步骤总数，与 index 一起显示为 index/total。",
    ),
    state: field(
      "string",
      "unset",
      "State data value used by theme styles.",
      "供主题样式使用的状态数据值。",
    ),
    progress: field(
      "string / number",
      '""',
      "Explicit progress label; takes precedence over index and total when non-empty.",
      "显式进度标签；非空时优先于 index 与 total。",
    ),
  },
  toast: {
    title: emptyText("Toast heading.", "Toast 标题。"),
    description: emptyText("Toast body text.", "Toast 正文。"),
    tone: field(
      "string",
      "info",
      "Semantic tone; error and destructive normalize to danger.",
      "语义色调；error 与 destructive 会归一化为 danger。",
    ),
    icon,
    duration: field(
      "string / number",
      "0",
      "Auto-dismiss delay in milliseconds; zero or invalid values keep it visible.",
      "自动关闭延迟（毫秒）；零或非法值会保持显示。",
    ),
    dismissable: field(
      "boolean",
      "true",
      "Shows the close control. The public spelling is dismissable.",
      "显示关闭控件。公开 property 的拼写为 dismissable。",
    ),
  },
  submit: {
    submitLabel: field("string", '"Submit"', "Primary submit button label.", "主要提交按钮标签。"),
    ignoreLabel: field(
      "string",
      '"Ignore"',
      "Secondary ignore button label.",
      "次要忽略按钮标签。",
    ),
    disabled: field(
      "boolean",
      "false",
      "Disables only the submit button; Ignore remains available.",
      "仅禁用提交按钮；Ignore 仍可用。",
    ),
  },
  playground: {
    source: emptyText(
      "Editable HTML source. Assigning it updates the editor and runs a preview-phase render.",
      "可编辑 HTML 源码。赋值会更新编辑器并执行 preview 阶段渲染。",
    ),
    autorun: field(
      "boolean",
      "false",
      "Runs the initial connected source in commit phase; later source changes still use preview phase.",
      "首次连接时以 commit 阶段运行源码；后续 source 变化仍使用 preview 阶段。",
    ),
  },
};
