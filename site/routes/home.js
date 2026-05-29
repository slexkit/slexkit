import { defaultLocale } from "../data/component-docs.js";
import { homePlaygroundConfig } from "../playground/home-playground.js";

const homeLabelsByLocale = {
  "zh-CN": {
    previewLabel: "实时预览",
    lede: '"文档即工具，工具即文档"，赋予 Markdown 可交互的能力，让 AI 的输出变得生动。',
    primaryAction: "快速开始",
    secondaryAction: "查看组件",
  },
  "en-US": {
    previewLabel: "Live preview",
    lede: '"Docs as tools, tools as docs" gives Markdown interactive power, making AI output come alive.',
    primaryAction: "Quick start",
    secondaryAction: "Components",
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
    replaceRoot(page);
    mountHomePlayground(page);
    document.title = "SlexKit";
    clearMobileContext();
  }

  return {
    renderHome,
  };
}
