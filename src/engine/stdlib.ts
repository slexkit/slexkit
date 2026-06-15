export type SlexKitStdlib = {
  math: {
    clamp: (value: unknown, min: unknown, max: unknown) => number;
    round: (value: unknown, digits?: unknown) => number;
    safeDivide: (numerator: unknown, denominator: unknown, fallback?: unknown) => number;
    percent: (part: unknown, total: unknown, digits?: unknown) => number;
    lerp: (start: unknown, end: unknown, t: unknown) => number;
  };
  stats: {
    sum: (values: unknown) => number;
    mean: (values: unknown) => number;
    min: (values: unknown) => number;
    max: (values: unknown) => number;
    median: (values: unknown) => number;
  };
  format: {
    fixed: (value: unknown, digits?: unknown) => string;
    number: (value: unknown, digits?: unknown, locale?: unknown) => string;
    compact: (value: unknown, digits?: unknown, locale?: unknown) => string;
    percent: (ratio: unknown, digits?: unknown) => string;
    currency: (value: unknown, currency?: unknown, locale?: unknown) => string;
  };
  units: {
    withUnit: (value: unknown, unit: unknown, digits?: unknown) => string;
    bytes: (value: unknown, digits?: unknown) => string;
    duration: (ms: unknown, digits?: unknown) => string;
    si: (value: unknown, unit?: unknown, digits?: unknown) => string;
  };
};

function toNumber(value: unknown): number {
  return Number(value);
}

function finiteNumber(value: unknown, fallback = 0): number {
  const parsed = toNumber(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function digits(value: unknown, fallback: number): number {
  const parsed = Math.trunc(finiteNumber(value, fallback));
  return Math.max(0, Math.min(20, parsed));
}

function finiteValues(values: unknown): number[] {
  if (!Array.isArray(values)) return [];
  return values.map(toNumber).filter(Number.isFinite);
}

function formatFixed(value: unknown, digitCount = 2): string {
  const parsed = toNumber(value);
  return Number.isFinite(parsed) ? parsed.toFixed(digitCount) : "NaN";
}

function locale(value: unknown): string {
  return typeof value === "string" && value.trim() ? value : "en-US";
}

function currencyCode(value: unknown): string {
  return typeof value === "string" && /^[A-Za-z]{3}$/.test(value) ? value.toUpperCase() : "USD";
}

function formatNumber(
  value: unknown,
  digitCount: number,
  localeName: string,
  notation?: "compact",
  style?: "currency",
  currency?: string,
  minimumFractionDigits = 0,
): string {
  const parsed = toNumber(value);
  if (!Number.isFinite(parsed)) return "NaN";
  return new Intl.NumberFormat(localeName, {
    maximumFractionDigits: digitCount,
    minimumFractionDigits,
    notation,
    style,
    currency,
  }).format(parsed);
}

function freezeDeep<T extends Record<string, unknown>>(value: T): T {
  for (const child of Object.values(value)) {
    if (child && typeof child === "object") freezeDeep(child as Record<string, unknown>);
  }
  return Object.freeze(value);
}

export const slexkitStd: SlexKitStdlib = freezeDeep({
  math: {
    clamp(value, min, max) {
      const lower = finiteNumber(min);
      const upper = finiteNumber(max);
      const parsed = finiteNumber(value);
      return Math.min(Math.max(parsed, Math.min(lower, upper)), Math.max(lower, upper));
    },
    round(value, digitValue = 0) {
      const factor = 10 ** digits(digitValue, 0);
      return Math.round(finiteNumber(value) * factor) / factor;
    },
    safeDivide(numerator, denominator, fallback = 0) {
      const divisor = toNumber(denominator);
      if (!Number.isFinite(divisor) || divisor === 0) return finiteNumber(fallback);
      const quotient = toNumber(numerator) / divisor;
      return Number.isFinite(quotient) ? quotient : finiteNumber(fallback);
    },
    percent(part, total, digitValue = 1) {
      const ratio = slexkitStd.math.safeDivide(part, total, NaN) * 100;
      return slexkitStd.math.round(ratio, digitValue);
    },
    lerp(start, end, t) {
      const a = finiteNumber(start);
      return a + (finiteNumber(end) - a) * finiteNumber(t);
    },
  },
  stats: {
    sum(values) {
      return finiteValues(values).reduce((total, value) => total + value, 0);
    },
    mean(values) {
      const numbers = finiteValues(values);
      return numbers.length ? slexkitStd.stats.sum(numbers) / numbers.length : NaN;
    },
    min(values) {
      const numbers = finiteValues(values);
      return numbers.length ? Math.min(...numbers) : NaN;
    },
    max(values) {
      const numbers = finiteValues(values);
      return numbers.length ? Math.max(...numbers) : NaN;
    },
    median(values) {
      const numbers = finiteValues(values).sort((a, b) => a - b);
      if (!numbers.length) return NaN;
      const middle = Math.floor(numbers.length / 2);
      return numbers.length % 2 ? numbers[middle] : (numbers[middle - 1] + numbers[middle]) / 2;
    },
  },
  format: {
    fixed(value, digitValue = 2) {
      return formatFixed(value, digits(digitValue, 2));
    },
    number(value, digitValue = 0, localeName = "en-US") {
      return formatNumber(value, digits(digitValue, 0), locale(localeName));
    },
    compact(value, digitValue = 1, localeName = "en-US") {
      return formatNumber(value, digits(digitValue, 1), locale(localeName), "compact");
    },
    percent(ratio, digitValue = 1) {
      return `${formatFixed(finiteNumber(ratio) * 100, digits(digitValue, 1))}%`;
    },
    currency(value, currency = "USD", localeName = "en-US") {
      return formatNumber(value, 2, locale(localeName), undefined, "currency", currencyCode(currency), 2);
    },
  },
  units: {
    withUnit(value, unit, digitValue = 2) {
      const suffix = typeof unit === "string" ? unit : String(unit ?? "");
      return `${formatFixed(value, digits(digitValue, 2))}${suffix ? ` ${suffix}` : ""}`;
    },
    bytes(value, digitValue = 1) {
      const units = ["B", "KB", "MB", "GB", "TB", "PB"];
      let amount = Math.abs(finiteNumber(value));
      let index = 0;
      while (amount >= 1024 && index < units.length - 1) {
        amount /= 1024;
        index += 1;
      }
      const sign = finiteNumber(value) < 0 ? -1 : 1;
      return `${formatFixed(amount * sign, digits(digitValue, 1))} ${units[index]}`;
    },
    duration(ms, digitValue = 1) {
      const value = finiteNumber(ms);
      const abs = Math.abs(value);
      if (abs < 1000) return `${formatFixed(value, 0)} ms`;
      if (abs < 60000) return `${formatFixed(value / 1000, digits(digitValue, 1))} s`;
      if (abs < 3600000) return `${formatFixed(value / 60000, digits(digitValue, 1))} min`;
      return `${formatFixed(value / 3600000, digits(digitValue, 1))} h`;
    },
    si(value, unit = "", digitValue = 2) {
      const units = ["", "k", "M", "G", "T", "P"];
      let amount = Math.abs(finiteNumber(value));
      let index = 0;
      while (amount >= 1000 && index < units.length - 1) {
        amount /= 1000;
        index += 1;
      }
      const sign = finiteNumber(value) < 0 ? -1 : 1;
      const suffix = typeof unit === "string" ? unit : String(unit ?? "");
      return `${formatFixed(amount * sign, digits(digitValue, 2))} ${units[index]}${suffix}`.trim();
    },
  },
});
