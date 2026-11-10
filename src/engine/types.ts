export type ThemeMode = "auto" | "host-shadcn" | "uno" | "flowbite";
export type DirectionMode = "ltr" | "rtl" | "auto";
export type RuntimeLabels = Partial<Record<string, string>>;

export type MountOptions = {
  theme?: ThemeMode;
  dir?: DirectionMode;
  labels?: RuntimeLabels;
  api?: Record<string, unknown>;
  executionMode?: "live" | "preview";
};

export type RenderContext = {
  std: import("./stdlib").SlexKitStdlib;
  api?: Record<string, unknown>;
  dir: Exclude<DirectionMode, "auto">;
  labels: RuntimeLabels;
  document: Document;
  /**
   * Internal hook used by built-in child hosts to register their stable target
   * even when the current children layout is empty.
   */
  registerChildTarget?: (container: HTMLElement) => void;
  releaseChildTarget?: (container: HTMLElement) => void;
  /** Native HTML slot projection used by the Web Components facade. */
  renderSlot?: (name: string, container: HTMLElement) => boolean;
  emit: (eventName: string, data?: unknown) => void;
  id: string | null;
};
