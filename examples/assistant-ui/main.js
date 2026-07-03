import React from "react";
import { createRoot } from "react-dom/client";
import {
  AssistantRuntimeProvider,
  MessagePrimitive,
  ThreadPrimitive,
  useExternalStoreRuntime,
} from "@assistant-ui/react";
import { SlexKitAssistantStreamdownText } from "@slexkit/assistant-ui";

const assistantMarkdown = `The filter is stable and ready to tune. I would present the cutoff and gain as a compact status card, then keep the implementation note as ordinary Markdown.

\`\`\`ts
const cutoffHz = 640;
const sampleRateHz = 48000;
const alpha = cutoffHz / (cutoffHz + sampleRateHz);
\`\`\`

\`\`\`slex
{
  slex: "0.1",
  namespace: "assistant_ui_static_filter",
  g: {
    cutoffHz: 640,
    sampleRateHz: 48000,
    alpha: 0.0132
  },
  layout: {
    "card:summary": {
      title: "RC Low-Pass Filter",
      description: "Rendered from a slex fence inside an assistant-ui text part.",
      "badge:runtime": { label: "secure iframe", tone: "success" },
      "grid:stats": {
        columns: 1,
        mdColumns: 2,
        "stat:cutoff": { label: "Cutoff", "$value": "g.cutoffHz", unit: "Hz" },
        "stat:alpha": { label: "Alpha", "$value": "g.alpha.toFixed(4)" }
      }
    }
  }
}
\`\`\`

This demo does not render tool calls. Tool-call UI remains a separate integration layer.`;

const messages = [
  {
    id: "assistant-ui-demo-user",
    role: "user",
    content: [
      {
        type: "text",
        text: "Summarize this filter as a status card and keep the calculation readable.",
      },
    ],
  },
  {
    id: "assistant-ui-demo-assistant",
    role: "assistant",
    status: { type: "complete", reason: "stop" },
    content: [
      {
        type: "text",
        text: assistantMarkdown,
      },
    ],
  },
];

const noopNewMessage = async () => {};
const embed = new URLSearchParams(window.location.search).get("embed") === "1";

document.getElementById("assistant-markdown-source").textContent = assistantMarkdown;
if (embed) document.querySelector(".adapter-example-shell")?.setAttribute("data-embed", "true");

function StaticAssistantRuntimeProvider({ children }) {
  const runtime = useExternalStoreRuntime({
    messages,
    convertMessage: (message) => message,
    isRunning: false,
    onNew: noopNewMessage,
  });

  return React.createElement(AssistantRuntimeProvider, { runtime }, children);
}

function UserTextPart({ text }) {
  return React.createElement("p", { className: "assistant-ui-user-text" }, text);
}

function AssistantTextPart() {
  return React.createElement(SlexKitAssistantStreamdownText, {
    artifactId: "assistant-ui-demo-response",
    className: "assistant-ui-markdown",
    mode: "static",
    runtime: "secure",
    secureFrame: {
      runtimeUrl: "/dist/slexkit.runtime.js",
    },
    controls: {
      code: { copy: false, download: false },
      table: { copy: false, download: false, fullscreen: false },
    },
  });
}

function MessageParts() {
  return React.createElement(MessagePrimitive.Parts, {
    children: ({ part }) => {
      if (part.type !== "text") return null;
      return part.text === assistantMarkdown
        ? React.createElement(AssistantTextPart)
        : React.createElement(UserTextPart, { text: part.text });
    },
  });
}

function Message() {
  return React.createElement(
    MessagePrimitive.Root,
    {
      className: "assistant-ui-message",
    },
    React.createElement(MessagePrimitive.If, {
      user: true,
      children: React.createElement(
        "div",
        { className: "assistant-ui-message-row assistant-ui-message-row-user" },
        React.createElement("div", { className: "assistant-ui-avatar assistant-ui-avatar-user" }, "U"),
        React.createElement(
          "div",
          { className: "assistant-ui-message-stack assistant-ui-message-stack-user" },
          React.createElement("div", { className: "assistant-ui-message-label" }, "You"),
          React.createElement(
            "div",
            { className: "assistant-ui-bubble assistant-ui-bubble-user" },
            React.createElement(MessageParts),
          ),
        ),
      ),
    }),
    React.createElement(MessagePrimitive.If, {
      assistant: true,
      children: React.createElement(
        "div",
        { className: "assistant-ui-message-row assistant-ui-message-row-assistant" },
        React.createElement("div", { className: "assistant-ui-avatar assistant-ui-avatar-assistant" }, "S"),
        React.createElement(
          "div",
          { className: "assistant-ui-message-stack assistant-ui-message-stack-assistant" },
          React.createElement("div", { className: "assistant-ui-message-label" }, "Assistant"),
          React.createElement(
            "div",
            { className: "assistant-ui-bubble assistant-ui-bubble-assistant" },
            React.createElement(MessageParts),
          ),
        ),
      ),
    }),
  );
}

function Thread() {
  return React.createElement(
    ThreadPrimitive.Root,
    { className: "assistant-ui-thread" },
    React.createElement(
      ThreadPrimitive.Viewport,
      { className: "assistant-ui-viewport" },
      React.createElement(ThreadPrimitive.Messages, {
        components: {
          UserMessage: Message,
          AssistantMessage: Message,
        },
      }),
    ),
  );
}

function App() {
  return React.createElement(
    StaticAssistantRuntimeProvider,
    null,
    React.createElement(Thread),
  );
}

createRoot(document.getElementById("assistant-ui-root")).render(React.createElement(App));

window.slexkitAssistantUiExample = { messages, assistantMarkdown };
