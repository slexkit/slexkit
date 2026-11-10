const WATCHDOG_GRACE_MS = 50;
const INFINITE_LEAVE_TIMEOUT_MS = 5000;

// Capture the runtime's own lifecycle scheduler before the sandbox hardens
// guest scheduling globals. This is not exposed through the document API.
const ownSetTimeout = globalThis.setTimeout.bind(globalThis);
const ownClearTimeout = globalThis.clearTimeout.bind(globalThis);
const ownWindow = typeof window !== "undefined" && (window as unknown) === globalThis ? window : undefined;

export type AnimationCleanup = () => void;

type AnimationOptions = {
  removeClass: boolean;
  infiniteTimeout?: number;
};

function splitList(value: string): string[] {
  return value.split(",").map((item) => item.trim());
}

function listValue<T>(values: T[], index: number, fallback: T): T {
  if (values.length === 0) return fallback;
  return values[index % values.length] ?? fallback;
}

function parseTime(value: string): number {
  const normalized = value.trim().toLowerCase();
  if (normalized.endsWith("ms")) {
    const milliseconds = Number.parseFloat(normalized);
    return Number.isFinite(milliseconds) ? milliseconds : 0;
  }
  if (normalized.endsWith("s")) {
    const seconds = Number.parseFloat(normalized);
    return Number.isFinite(seconds) ? seconds * 1000 : 0;
  }
  return 0;
}

function parseIterationCount(value: string): number {
  if (value.trim().toLowerCase() === "infinite") return Number.POSITIVE_INFINITY;
  const count = Number.parseFloat(value);
  return Number.isFinite(count) && count >= 0 ? count : 1;
}

function computedAnimationTime(style: CSSStyleDeclaration): number | null {
  const names = splitList(style.animationName || "");
  const durations = splitList(style.animationDuration || "").map(parseTime);
  const delays = splitList(style.animationDelay || "").map(parseTime);
  const iterations = splitList(style.animationIterationCount || "").map(parseIterationCount);

  let active = false;
  let longest = 0;

  for (let index = 0; index < names.length; index += 1) {
    const name = names[index];
    if (!name || name === "none") continue;

    const duration = listValue(durations, index, 0);
    const iterationCount = listValue(iterations, index, 1);
    if (duration <= 0 || iterationCount <= 0) continue;

    active = true;
    if (!Number.isFinite(iterationCount)) return Number.POSITIVE_INFINITY;

    const delay = listValue(delays, index, 0);
    longest = Math.max(longest, Math.max(0, delay + duration * iterationCount));
  }

  return active ? longest : null;
}

function prefersReducedMotion(view: Window): boolean {
  try {
    return view.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
  } catch {
    return false;
  }
}

export function runCssAnimation(
  el: HTMLElement,
  animClass: string,
  onFinish: () => void,
  options: AnimationOptions,
): AnimationCleanup {
  const view = el.ownerDocument.defaultView;
  const schedule = view === ownWindow ? ownSetTimeout : view?.setTimeout.bind(view);
  const cancel = view === ownWindow ? ownClearTimeout : view?.clearTimeout.bind(view);
  let timer: number | undefined;
  let finished = false;

  const finish = (): void => {
    if (finished) return;
    finished = true;
    el.removeEventListener("animationend", handleAnimationEvent);
    el.removeEventListener("animationcancel", handleAnimationEvent);
    if (timer !== undefined) cancel?.(timer);
    if (options.removeClass) el.classList.remove(animClass);
    onFinish();
  };

  const handleAnimationEvent = (event: Event): void => {
    if (event.target !== el) return;
    finish();
  };

  el.classList.add(animClass);

  if (!view || prefersReducedMotion(view)) {
    finish();
    return finish;
  }

  let totalTime: number | null;
  try {
    totalTime = computedAnimationTime(view.getComputedStyle(el));
  } catch {
    totalTime = null;
  }

  if (totalTime === null || totalTime <= 0) {
    finish();
    return finish;
  }

  el.addEventListener("animationend", handleAnimationEvent);
  el.addEventListener("animationcancel", handleAnimationEvent);

  if (Number.isFinite(totalTime)) {
    timer = schedule?.(finish, totalTime + WATCHDOG_GRACE_MS) as number | undefined;
  } else if (options.infiniteTimeout !== undefined) {
    timer = schedule?.(finish, options.infiniteTimeout) as number | undefined;
  }

  return finish;
}

export const leaveAnimationOptions = {
  removeClass: false,
  infiniteTimeout: INFINITE_LEAVE_TIMEOUT_MS,
} satisfies AnimationOptions;

export const enterAnimationOptions = {
  removeClass: true,
} satisfies AnimationOptions;
