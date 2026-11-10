type MockAnimationStyle = {
  animationName?: string;
  animationDuration?: string;
  animationDelay?: string;
  animationIterationCount?: string;
};

export function mockAnimationStyle(
  className: string,
  values: MockAnimationStyle = {},
): () => void {
  const view = document.defaultView;
  if (!view) throw new Error("Animation tests require a document window.");

  const ownDescriptor = Object.getOwnPropertyDescriptor(view, "getComputedStyle");
  const original = view.getComputedStyle;
  const replacements: Required<MockAnimationStyle> = {
    animationName: values.animationName ?? className,
    animationDuration: values.animationDuration ?? "1s",
    animationDelay: values.animationDelay ?? "0s",
    animationIterationCount: values.animationIterationCount ?? "1",
  };

  Object.defineProperty(view, "getComputedStyle", {
    configurable: true,
    writable: true,
    value: ((element: Element, pseudoElement?: string | null) => {
      const computed = original.call(view, element, pseudoElement);
      if (!element.classList.contains(className)) return computed;
      return new Proxy(computed, {
        get(target, property, receiver) {
          if (typeof property === "string" && property in replacements) {
            return replacements[property as keyof MockAnimationStyle];
          }
          return Reflect.get(target, property, receiver);
        },
      });
    }) as typeof view.getComputedStyle,
  });

  return () => {
    if (ownDescriptor) {
      Object.defineProperty(view, "getComputedStyle", ownDescriptor);
    } else {
      delete (view as Window & { getComputedStyle?: typeof view.getComputedStyle }).getComputedStyle;
    }
  };
}
