export type StatFormatOptions = {
  width?: number;
  measure?: (text: string) => number;
};

const MAX_SIGNIFICANT_DIGITS = 6;
const STRICT_DECIMAL_OR_SCIENTIFIC =
  /^[+-]?(?:(?:\d+\.\d*|\.\d+)(?:[eE][+-]?\d+)?|\d+[eE][+-]?\d+)$/;

function normalizeDecimal(text: string): string {
  if (!text.includes(".")) return text;
  return text.replace(/(\.\d*?[1-9])0+$/, "$1").replace(/\.0*$/, "");
}

function normalizeScientific(text: string): string {
  const [mantissa, exponent = "0"] = text.toLowerCase().split("e");
  return `${normalizeDecimal(mantissa)}e${Number.parseInt(exponent, 10)}`;
}

function normalizePrecision(text: string): string {
  return /e/i.test(text) ? normalizeScientific(text) : normalizeDecimal(text);
}

function expandScientific(text: string): string {
  const [rawMantissa, rawExponent = "0"] = text.toLowerCase().split("e");
  const sign = rawMantissa.startsWith("-") ? "-" : "";
  const mantissa = rawMantissa.replace(/^[+-]/, "");
  const point = mantissa.indexOf(".");
  const integerDigits = point === -1 ? mantissa.length : point;
  const digits = mantissa.replace(".", "");
  const decimalPosition = integerDigits + Number.parseInt(rawExponent, 10);

  if (decimalPosition <= 0) {
    return normalizeDecimal(`${sign}0.${"0".repeat(-decimalPosition)}${digits}`);
  }
  if (decimalPosition >= digits.length) {
    return `${sign}${digits}${"0".repeat(decimalPosition - digits.length)}`;
  }
  return normalizeDecimal(
    `${sign}${digits.slice(0, decimalPosition)}.${digits.slice(decimalPosition)}`,
  );
}

function numericCandidates(value: number): string[] {
  const candidates: string[] = [];
  const seen = new Set<string>();

  for (let significantDigits = MAX_SIGNIFICANT_DIGITS; significantDigits >= 1; significantDigits -= 1) {
    const precision = value.toPrecision(significantDigits);
    const ordinary = /e/i.test(precision)
      ? expandScientific(precision)
      : normalizeDecimal(precision);
    const scientific = normalizeScientific(value.toExponential(significantDigits - 1));

    for (const candidate of [ordinary, scientific]) {
      if (!seen.has(candidate)) {
        seen.add(candidate);
        candidates.push(candidate);
      }
    }
  }

  return candidates;
}

function formatMeasuredNumber(
  value: number,
  width: number,
  measure: (text: string) => number,
): string {
  const candidates = numericCandidates(value);
  let shortest = candidates[0];
  let shortestWidth = Number.POSITIVE_INFINITY;

  for (const candidate of candidates) {
    const measuredWidth = measure(candidate);
    if (Number.isFinite(measuredWidth) && measuredWidth <= width) return candidate;

    const comparableWidth = Number.isFinite(measuredWidth) ? measuredWidth : candidate.length;
    if (comparableWidth < shortestWidth) {
      shortest = candidate;
      shortestWidth = comparableWidth;
    }
  }

  return shortest;
}

function canReformatNumericString(value: string, parsed: number): boolean {
  if (!STRICT_DECIMAL_OR_SCIENTIFIC.test(value) || !Number.isFinite(parsed)) return false;
  if (parsed === 0 && /[1-9]/.test(value.split(/[eE]/, 1)[0])) return false;
  return !Number.isInteger(parsed) || Number.isSafeInteger(parsed);
}

export function formatStatValue(value: unknown, options: StatFormatOptions = {}): string {
  if (value === null || value === undefined) return "";

  const hasMeasurement =
    typeof options.width === "number" &&
    !Number.isNaN(options.width) &&
    typeof options.measure === "function";

  if (typeof value === "number") {
    if (!Number.isFinite(value)) return String(value);
    if (Object.is(value, -0) || value === 0) return "0";
    if (hasMeasurement) {
      return formatMeasuredNumber(value, options.width!, options.measure!);
    }
    return normalizePrecision(value.toPrecision(MAX_SIGNIFICANT_DIGITS));
  }

  const literal = String(value);
  if (!hasMeasurement || typeof value !== "string") return literal;
  if (options.measure!(literal) <= options.width!) return literal;

  const parsed = Number(literal);
  if (!canReformatNumericString(literal, parsed)) return literal;
  if (Object.is(parsed, -0) || parsed === 0) return "0";
  return formatMeasuredNumber(parsed, options.width!, options.measure!);
}
