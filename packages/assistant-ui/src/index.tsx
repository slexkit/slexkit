import { StreamdownTextPrimitive } from "@assistant-ui/react-streamdown";
import type {
  ComponentsByLanguage,
  StreamdownTextPrimitiveProps,
  SyntaxHighlighterProps,
} from "@assistant-ui/react-streamdown";
import { SlexKitRenderer } from "@slexkit/streamdown";
import type { SlexKitRendererOptions } from "@slexkit/streamdown";
import { createElement, useId, useMemo } from "react";

export type SlexKitAssistantRendererOptions = Omit<
  SlexKitRendererOptions,
  "className" | "domain" | "languages"
> & {
  artifactId?: string;
  className?: string;
  domain?: string;
};

export type SlexKitAssistantStreamdownTextProps = Omit<
  StreamdownTextPrimitiveProps,
  "componentsByLanguage"
> &
  SlexKitAssistantRendererOptions & {
    componentsByLanguage?: ComponentsByLanguage;
    slexkit?: SlexKitAssistantRendererOptions;
  };

function normalizeSlexKitOptions(
  options: SlexKitAssistantRendererOptions = {},
): Omit<SlexKitRendererOptions, "languages"> {
  const { artifactId, domain, runtime, showChrome, ...rest } = options;
  return {
    ...rest,
    domain: domain ?? artifactId,
    runtime: runtime ?? "secure",
    showChrome: showChrome ?? false,
  };
}

function createSlexKitSyntaxHighlighter(
  options: SlexKitAssistantRendererOptions = {},
) {
  const rendererOptions = normalizeSlexKitOptions(options);

  return function SlexKitAssistantSyntaxHighlighter({
    code,
    language,
  }: SyntaxHighlighterProps) {
    return createElement(SlexKitRenderer, {
      ...rendererOptions,
      code,
      isIncomplete: false,
      language: language || "slex",
    });
  };
}

export function createSlexKitAssistantStreamdownComponents(
  options: SlexKitAssistantRendererOptions = {},
  componentsByLanguage: ComponentsByLanguage = {},
): ComponentsByLanguage {
  return {
    ...componentsByLanguage,
    slex: {
      ...componentsByLanguage.slex,
      CodeHeader: componentsByLanguage.slex?.CodeHeader ?? (() => null),
      SyntaxHighlighter: createSlexKitSyntaxHighlighter(options),
    },
  };
}

export function SlexKitAssistantStreamdownText({
  artifactId,
  className,
  componentsByLanguage,
  domain,
  hostAdapter,
  onError,
  placeholder,
  playgroundUrl,
  renderMode,
  runtime,
  runtimeHost,
  secureFrame,
  securePolicy,
  showChrome,
  showSource,
  slexkit,
  streaming,
  useGlobalRuntimeHost,
  ...streamdownProps
}: SlexKitAssistantStreamdownTextProps) {
  const generatedId = useId();
  const resolvedArtifactId = artifactId ?? domain ?? `slexkit-assistant-${generatedId}`;
  const resolvedComponentsByLanguage = useMemo(
    () =>
      createSlexKitAssistantStreamdownComponents(
        {
          artifactId: resolvedArtifactId,
          className,
          domain,
          hostAdapter,
          onError,
          placeholder,
          playgroundUrl,
          renderMode,
          runtime,
          runtimeHost,
          secureFrame,
          securePolicy,
          showChrome,
          showSource,
          streaming,
          useGlobalRuntimeHost,
          ...slexkit,
        },
        componentsByLanguage,
      ),
    [
      className,
      componentsByLanguage,
      domain,
      hostAdapter,
      onError,
      placeholder,
      playgroundUrl,
      renderMode,
      resolvedArtifactId,
      runtime,
      runtimeHost,
      secureFrame,
      securePolicy,
      showChrome,
      showSource,
      slexkit,
      streaming,
      useGlobalRuntimeHost,
    ],
  );

  return createElement(StreamdownTextPrimitive, {
    ...streamdownProps,
    componentsByLanguage: resolvedComponentsByLanguage,
  });
}

export type {
  ComponentsByLanguage,
  StreamdownTextPrimitiveProps,
  SyntaxHighlighterProps,
};
