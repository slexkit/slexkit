export type EngineeringNumberResult = {
  raw: string;
  number: number | null;
  valid: boolean;
  prefix: string;
  unit: string;
  normalized: string;
  error?: string;
};

const NUMBER_RE = /^[+-]?(?:(?:\d+(?:\.\d*)?)|(?:\.\d+))(?:[eE][+-]?\d+)?/;

const PREFIX_FACTORS: Record<string, number> = {
  p: 1e-12,
  n: 1e-9,
  u: 1e-6,
  "µ": 1e-6,
  m: 1e-3,
  k: 1e3,
  K: 1e3,
  M: 1e6,
  meg: 1e6,
  G: 1e9,
  T: 1e12,
};

const PREFIXES = ["meg", "p", "n", "u", "µ", "m", "k", "K", "M", "G", "T"];

function invalid(raw: string, error: string): EngineeringNumberResult {
  return {
    raw,
    number: null,
    valid: false,
    prefix: "",
    unit: "",
    normalized: "",
    error,
  };
}

function parseSuffix(suffix: string): { prefix: string; unit: string } {
  const compact = suffix.trim();
  if (!compact) return { prefix: "", unit: "" };
  for (const prefix of PREFIXES) {
    if (prefix === "meg") {
      if (compact.toLowerCase().startsWith("meg")) {
        return { prefix: "meg", unit: compact.slice(3).trim() };
      }
      continue;
    }
    if (compact.startsWith(prefix)) {
      return { prefix, unit: compact.slice(prefix.length).trim() };
    }
  }
  return { prefix: "", unit: compact };
}

export function parseEngineeringNumber(input: unknown): EngineeringNumberResult {
  const raw = input == null ? "" : String(input);
  const source = raw.trim();
  if (!source) {
    return {
      raw,
      number: null,
      valid: false,
      prefix: "",
      unit: "",
      normalized: "",
      error: "empty",
    };
  }

  const numberMatch = source.match(NUMBER_RE);
  if (!numberMatch) return invalid(raw, "invalid_number");

  const numberText = numberMatch[0];
  const rest = source.slice(numberText.length).trim();
  const base = Number(numberText);
  if (!Number.isFinite(base)) return invalid(raw, "invalid_number");

  const { prefix, unit } = parseSuffix(rest);
  const multiplier = prefix ? PREFIX_FACTORS[prefix] : 1;
  if (!Number.isFinite(multiplier)) return invalid(raw, "invalid_prefix");

  const number = base * multiplier;
  if (!Number.isFinite(number)) return invalid(raw, "out_of_range");

  return {
    raw,
    number,
    valid: true,
    prefix,
    unit,
    normalized: `${number}${unit ? ` ${unit}` : ""}`,
  };
}

export function isEngineeringNumberResult(value: unknown): value is EngineeringNumberResult {
  return !!value &&
    typeof value === "object" &&
    "raw" in value &&
    "number" in value &&
    "valid" in value &&
    "prefix" in value &&
    "unit" in value &&
    "normalized" in value;
}
