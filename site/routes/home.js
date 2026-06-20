import { defaultLocale } from "../data/component-docs.js";
import { homePlaygroundConfig } from "../playground/home-playground.js";

const homeLabelsByLocale = {
  "zh-CN": {
    previewLabel: "实时预览",
    lede: '"文档即工具，工具即文档"，把显式 Markdown fence 渲染成带状态的交互块。',
    primaryAction: "快速开始",
    secondaryAction: "查看组件",
    description: "SlexKit 是面向 Markdown 宿主的交互式 UI 运行时。文档中写显式 slex fence，运行时负责挂载表单、指标、计算器和预览组件；不需要为每段内容增加构建流程。",
    featuresTitle: "能力范围",
    features: [
      ["零构建", "在 Markdown 中直接写 slex fence；宿主只需加载运行时和样式"],
      ["流式渲染", "适合消息流和文档流：内容到达后按 fence 挂载"],
      ["响应式状态", "同一 artifact 内共享状态，控件和展示组件可以联动"],
      ["组件集", "内置常用文档组件：卡片、表单、表格、代码块、标签页等"],
      ["安全沙箱", "不可信内容可放入 secure runtime，与宿主页隔离"],
      ["工具调用渲染", "ToolHost 把确认、选择和表单类工具调用渲染成可提交 UI"],
    ],
    hostAdaptersTitle: "宿主接入",
    hostAdaptersDesc: "不同宿主保留自己的 Markdown 渲染；SlexKit 只接管显式 slex fence。",
    hostAdapters: [
      ["Streamdown", "React 消息流或 Markdown 页面", "/examples/streamdown-host"],
      ["Tiptap", "编辑器内 slex 代码块预览", "/examples/tiptap-host"],
      ["Svelte Markdown Host", "官网 Markdown renderer 的接入参考", "/docs/guides/integration"],
    ],
    aiDocsTitle: "AI / LLM 接入",
    aiDocsDesc: "供 agent 读取的索引、全文和 MCP 入口：",
    getStartedTitle: "开始使用",
  },
  "en-US": {
    previewLabel: "Live preview",
    lede: '"Docs as tools, tools as docs" renders explicit Markdown fences as stateful UI blocks.',
    primaryAction: "Quick start",
    secondaryAction: "Components",
    description: "SlexKit is an interactive UI runtime for Markdown hosts. Write explicit slex fences in the document; the runtime mounts forms, metrics, calculators, and previews without adding a build step for each artifact.",
    featuresTitle: "Runtime scope",
    features: [
      ["Zero-build", "Write slex fences directly in Markdown; the host loads the runtime and CSS."],
      ["Streaming", "Works with message and document streams; fences mount as content arrives."],
      ["Reactive state", "Components in one artifact can share state and update together."],
      ["Component set", "Built-in document components: cards, forms, tables, code blocks, tabs, and more."],
      ["Secure sandbox", "Run untrusted content in a secure runtime isolated from the host page."],
      ["Tool-call rendering", "ToolHost renders confirmations, choices, and forms as submit-ready UI."],
    ],
    hostAdaptersTitle: "Host integration",
    hostAdaptersDesc: "Hosts keep their Markdown renderer; SlexKit takes over explicit slex fences.",
    hostAdapters: [
      ["Streamdown", "React message streams or Markdown pages.", "/examples/streamdown-host"],
      ["Tiptap", "Editor preview for slex code blocks.", "/examples/tiptap-host"],
      ["Svelte Markdown Host", "Integration reference from this site's Markdown renderer.", "/docs/guides/integration"],
    ],
    aiDocsTitle: "AI / LLM",
    aiDocsDesc: "Index, full context, and MCP entry points for agents:",
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

    for (const [name, descText] of labels.features) {
      const card = document.createElement("div");
      card.className = "slex-home-feature-card";
      const nameEl = textElement("strong", "slex-home-feature-name", name);
      const descEl = textElement("span", "slex-home-feature-desc", descText);
      card.append(nameEl, descEl);
      grid.appendChild(card);
    }

    section.appendChild(grid);
    return section;
  }

  function renderHostAdaptersSection(labels) {
    const section = document.createElement("section");
    section.className = "slex-home-section";

    const title = textElement("h2", "slex-home-section-title", labels.hostAdaptersTitle);
    const desc = textElement("p", "slex-home-section-desc", labels.hostAdaptersDesc);
    section.append(title, desc);

    const grid = document.createElement("div");
    grid.className = "slex-home-adapters-grid";

    for (const [name, descText, href] of labels.hostAdapters) {
      const card = document.createElement("a");
      card.className = "slex-home-adapter-card";
      card.href = navHref(href);
      const nameEl = textElement("strong", "slex-home-adapter-name", name);
      const descEl = textElement("span", "slex-home-adapter-desc", descText);
      card.append(nameEl, descEl);
      grid.appendChild(card);
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
      ["/llms-full.txt", "Full documentation (single file)"],
      ["/slexkit-ai-manifest.json", "Machine-readable metadata"],
    ];

    const grid = document.createElement("div");
    grid.className = "slex-home-ai-grid";

    for (const [href, desc] of links) {
      const card = document.createElement("a");
      card.className = "slex-home-ai-card";
      card.href = href;
      const path = textElement("span", "slex-home-ai-path", href);
      const label = textElement("span", "slex-home-ai-label", desc);
      card.append(path, label);
      grid.appendChild(card);
    }

    section.append(grid);
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
      renderHostAdaptersSection(labels),
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
