import { defaultLocale } from "../data/component-docs.js";
import { homePlaygroundConfig } from "../playground/home-playground.js";

const homeLabelsByLocale = {
  "zh-CN": {
    previewLabel: "实时预览",
    lede: '"文档即工具，工具即文档"，赋予 Markdown 可交互的能力，让 AI 的输出变得生动。',
    primaryAction: "快速开始",
    secondaryAction: "查看组件",
    description: "SlexKit 是一个零构建、Markdown 友好的响应式 UI 运行时，专为 AI 输出设计。它让你在 Markdown 文档中嵌入可交互的组件——表单、图表、计算工具、实时预览——无需任何构建步骤。",
    featuresTitle: "核心特性",
    features: [
      ["零构建", "直接在 Markdown 中使用 slex 代码块，无需 webpack、vite 或任何打包工具"],
      ["流式渲染", "支持 AI 流式输出，组件随内容到达逐步渲染"],
      ["响应式状态", "内置响应式系统，组件间可双向绑定数据"],
      ["丰富组件", "30+ 内置组件：卡片、表单、图表、代码块、手风琴、标签页等"],
      ["安全沙箱", "可选的安全运行时，隔离执行不受信任的内容"],
      ["工具调用渲染", "ToolHost 系统将 AI 工具调用渲染为可交互的确认对话框和表单"],
    ],
    aiDocsTitle: "AI / LLM 文档接入",
    aiDocsDesc: "SlexKit 为 AI agent 和 LLM 提供了专门的文档接口：",
    aiDocsMcp: "MCP 服务器",
    getStartedTitle: "开始使用",
  },
  "en-US": {
    previewLabel: "Live preview",
    lede: '"Docs as tools, tools as docs" gives Markdown interactive power, making AI output come alive.',
    primaryAction: "Quick start",
    secondaryAction: "Components",
    description: "SlexKit is a zero-build, Markdown-friendly reactive UI runtime designed for AI output. It lets you embed interactive components—forms, charts, calculators, live previews—inside Markdown documents without any build step.",
    featuresTitle: "Key Features",
    features: [
      ["Zero-build", "Use slex code blocks directly in Markdown. No webpack, vite, or bundler required."],
      ["Streaming", "Renders components as AI output streams in, progressively."],
      ["Reactive state", "Built-in reactive system with two-way data binding between components."],
      ["Rich components", "30+ built-in components: cards, forms, charts, code blocks, accordions, tabs, and more."],
      ["Secure sandbox", "Optional secure runtime for isolating untrusted content execution."],
      ["Tool-call rendering", "ToolHost system renders AI tool calls as interactive confirmation dialogs and forms."],
    ],
    aiDocsTitle: "AI / LLM Documentation",
    aiDocsDesc: "SlexKit provides dedicated documentation endpoints for AI agents and LLMs:",
    aiDocsMcp: "MCP server",
    getStartedTitle: "Get Started",
  },
};

function textElement(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  node.textContent = text;
  return node;
}

function appendTypewriterChars(parent, text, className) {
  for (const char of text) {
    const node = document.createElement("span");
    node.className = className;
    node.textContent = char;
    parent.appendChild(node);
  }
}

function playHomeExpandedName(node) {
  const chars = Array.from(node.querySelectorAll(".slex-home-expanded-char"));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  Promise.resolve(document.fonts?.ready).then(() => {
    if (!node.isConnected) return;

    requestAnimationFrame(() => {
      if (!node.isConnected) return;

      const fullWidth = Math.ceil(node.scrollWidth);
      node.style.setProperty("--slex-home-expanded-name-width", `${fullWidth}px`);

      if (reduceMotion || !chars.length) {
        node.style.width = "auto";
        return;
      }

      node.style.width = `${fullWidth}px`;
      const left = node.getBoundingClientRect().left;
      const widths = chars.map((char) => Math.ceil(char.getBoundingClientRect().right - left));
      node.style.width = "0px";

      let index = 0;
      const tick = () => {
        if (!node.isConnected) return;
        node.style.width = `${Math.min(fullWidth, widths[index])}px`;
        index += 1;
        if (index < widths.length) window.setTimeout(tick, 72);
      };

      window.setTimeout(tick, 250);
    });
  });
}

function homeExpandedName() {
  const node = document.createElement("div");
  node.className = "slex-home-expanded-name";
  node.setAttribute("aria-label", "Streaming Live EXpressions Kit");

  const words = [
    { accent: "S", rest: "treaming" },
    { accent: "L", rest: "ive" },
    { accent: "EX", rest: "pressions" },
    { accent: "Kit", rest: "" },
  ];
  words.forEach((word, index) => {
    const wordNode = document.createElement("span");
    wordNode.className = "slex-home-expanded-word";
    const initial = document.createElement("span");
    initial.className = "slex-home-expanded-initial";
    appendTypewriterChars(initial, word.accent, "slex-home-expanded-char");

    const rest = document.createElement("span");
    rest.className = "slex-home-expanded-rest";
    appendTypewriterChars(rest, word.rest, "slex-home-expanded-char");

    wordNode.append(initial, rest);
    node.appendChild(wordNode);
    if (index < words.length - 1) {
      const space = document.createElement("span");
      space.className = "slex-home-expanded-char slex-home-expanded-space";
      space.textContent = "\u00a0";
      node.appendChild(space);
    }
  });

  playHomeExpandedName(node);

  return node;
}

function homeBrandLockup() {
  const lockup = document.createElement("div");
  lockup.className = "slex-home-brand-lockup";

  const row = document.createElement("div");
  row.className = "slex-home-brand-row";

  const logo = document.createElement("span");
  logo.className = "slex-home-brand-logo slex-site-logo";
  logo.setAttribute("aria-hidden", "true");

  row.append(logo, textElement("h1", "slex-home-title", "SlexKit"));

  lockup.append(row, homeExpandedName());
  return lockup;
}

function renderHomePreview(labels) {
  const shell = document.createElement("aside");
  shell.id = "playground";
  shell.className = "slex-home-preview";
  shell.setAttribute("aria-label", labels.previewLabel);

  const surface = document.createElement("div");
  surface.className = "slex-home-preview-surface";
  surface.dataset.homePlayground = "true";

  shell.appendChild(surface);
  return shell;
}

export function createHomeRoute({ clearMobileContext, currentLocale, mount, navHref, replaceRoot, setSiteMount }) {
  function homeLabels(locale = currentLocale()) {
    return homeLabelsByLocale[locale] ?? homeLabelsByLocale[defaultLocale];
  }

  function homeAction(label, href, variant = "secondary") {
    const link = document.createElement("a");
    link.className = `slex-home-action ${variant}`;
    link.href = navHref(href);
    link.textContent = label;
    return link;
  }

  function homeLink(label, href) {
    const link = document.createElement("a");
    link.className = "slex-home-link";
    link.href = href;
    link.textContent = label;
    return link;
  }

  function renderFeaturesSection(labels) {
    const section = document.createElement("section");
    section.className = "slex-home-section";

    const title = textElement("h2", "slex-home-section-title", labels.featuresTitle);
    const desc = textElement("p", "slex-home-section-desc", labels.description);
    section.append(title, desc);

    const grid = document.createElement("div");
    grid.className = "slex-home-features-grid";

    for (const [name, desc] of labels.features) {
      const item = document.createElement("div");
      item.className = "slex-home-feature-item";
      const strong = document.createElement("strong");
      strong.textContent = name;
      const sep = document.createTextNode(" — ");
      const text = document.createTextNode(desc);
      item.append(strong, sep, text);
      grid.appendChild(item);
    }

    section.appendChild(grid);
    return section;
  }

  function renderAiDocsSection(labels) {
    const section = document.createElement("section");
    section.className = "slex-home-section";

    const title = textElement("h2", "slex-home-section-title", labels.aiDocsTitle);
    const desc = textElement("p", "slex-home-section-desc", labels.aiDocsDesc);
    section.append(title, desc);

    const links = [
      ["/llms.txt", "Documentation index"],
      ["/llms-full.txt", "Full English documentation (single file)"],
      ["/llms-components.txt", "Component docs with props/state reference"],
      ["/llms-runtime.txt", "Runtime, host integration, and secure rendering docs"],
      ["/llms-toolhost.txt", "ToolHost structured user-input docs"],
      ["/llms-authoring.txt", "slex fence authoring rules"],
      ["/slexkit-ai-manifest.json", "Machine-readable page and component metadata"],
    ];

    const list = document.createElement("ul");
    list.className = "slex-home-ai-links";

    for (const [href, desc] of links) {
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = href;
      a.textContent = href;
      const sep = document.createTextNode(" — ");
      const text = document.createTextNode(desc);
      li.append(a, sep, text);
      list.appendChild(li);
    }

    const mcp = document.createElement("p");
    mcp.className = "slex-home-section-desc";
    const mcpLabel = document.createElement("strong");
    mcpLabel.textContent = `${labels.aiDocsMcp}: `;
    const mcpCode = document.createElement("code");
    mcpCode.textContent = "npx -y @slexkit/mcp";
    mcp.append(mcpLabel, mcpCode);

    section.append(list, mcp);
    return section;
  }

  function mountHomePlayground(root) {
    const host = root.querySelector("[data-home-playground]");
    if (!host) return;
    setSiteMount(mount(
      {
        namespace: "site_home_playground",
        g: {},
        layout: {
          "playground:demo": homePlaygroundConfig(currentLocale()),
        },
      },
      host,
    ));
  }

  function renderHome() {
    const labels = homeLabels();
    const page = document.createElement("main");
    page.className = "slex-home-page";
    document.body.dataset.siteRoute = "home";

    const hero = document.createElement("section");
    hero.className = "slex-home-hero";

    const copy = document.createElement("div");
    copy.className = "slex-home-copy";
    copy.append(
      homeBrandLockup(),
      textElement("p", "slex-home-lede", labels.lede),
    );

    const actions = document.createElement("div");
    actions.className = "slex-home-actions";
    actions.append(
      homeAction(labels.primaryAction, "/docs/guides/quick-start", "primary"),
      homeAction(labels.secondaryAction, "/components"),
    );
    copy.appendChild(actions);

    hero.append(copy, renderHomePreview(labels));
    page.appendChild(hero);

    const content = document.createElement("div");
    content.className = "slex-home-content";
    content.append(
      renderFeaturesSection(labels),
      renderAiDocsSection(labels),
    );
    page.appendChild(content);

    replaceRoot(page);
    mountHomePlayground(page);
    document.title = "SlexKit";
    clearMobileContext();
  }

  return {
    renderHome,
  };
}
