import BookOpenRegular from "@phosphor-icons/core/assets/regular/book-open.svg?raw";
import CaretDownRegular from "@phosphor-icons/core/assets/regular/caret-down.svg?raw";
import CircleHalfRegular from "@phosphor-icons/core/assets/regular/circle-half.svg?raw";
import CopyRegular from "@phosphor-icons/core/assets/regular/copy.svg?raw";
import DatabaseRegular from "@phosphor-icons/core/assets/regular/database.svg?raw";
import LightbulbRegular from "@phosphor-icons/core/assets/regular/lightbulb.svg?raw";
import ListRegular from "@phosphor-icons/core/assets/regular/list.svg?raw";
import MarkdownLogoRegular from "@phosphor-icons/core/assets/regular/markdown-logo.svg?raw";
import MoonRegular from "@phosphor-icons/core/assets/regular/moon.svg?raw";
import SquaresFourRegular from "@phosphor-icons/core/assets/regular/squares-four.svg?raw";
import SquareSplitHorizontalRegular from "@phosphor-icons/core/assets/regular/square-split-horizontal.svg?raw";
import TagRegular from "@phosphor-icons/core/assets/regular/tag.svg?raw";
import SunRegular from "@phosphor-icons/core/assets/regular/sun.svg?raw";
import TranslateRegular from "@phosphor-icons/core/assets/regular/translate.svg?raw";
import XRegular from "@phosphor-icons/core/assets/regular/x.svg?raw";
import BookOpenDuotone from "@phosphor-icons/core/assets/duotone/book-open-duotone.svg?raw";
import CaretDownDuotone from "@phosphor-icons/core/assets/duotone/caret-down-duotone.svg?raw";
import CircleHalfDuotone from "@phosphor-icons/core/assets/duotone/circle-half-duotone.svg?raw";
import CopyDuotone from "@phosphor-icons/core/assets/duotone/copy-duotone.svg?raw";
import DatabaseDuotone from "@phosphor-icons/core/assets/duotone/database-duotone.svg?raw";
import LightbulbDuotone from "@phosphor-icons/core/assets/duotone/lightbulb-duotone.svg?raw";
import ListDuotone from "@phosphor-icons/core/assets/duotone/list-duotone.svg?raw";
import MarkdownLogoDuotone from "@phosphor-icons/core/assets/duotone/markdown-logo-duotone.svg?raw";
import MoonDuotone from "@phosphor-icons/core/assets/duotone/moon-duotone.svg?raw";
import SquaresFourDuotone from "@phosphor-icons/core/assets/duotone/squares-four-duotone.svg?raw";
import SquareSplitHorizontalDuotone from "@phosphor-icons/core/assets/duotone/square-split-horizontal-duotone.svg?raw";
import TagDuotone from "@phosphor-icons/core/assets/duotone/tag-duotone.svg?raw";
import SunDuotone from "@phosphor-icons/core/assets/duotone/sun-duotone.svg?raw";
import TranslateDuotone from "@phosphor-icons/core/assets/duotone/translate-duotone.svg?raw";
import XDuotone from "@phosphor-icons/core/assets/duotone/x-duotone.svg?raw";

const regularIcons = {
  "book-open": BookOpenRegular,
  "caret-down": CaretDownRegular,
  "circle-half": CircleHalfRegular,
  copy: CopyRegular,
  database: DatabaseRegular,
  lightbulb: LightbulbRegular,
  list: ListRegular,
  "markdown-logo": MarkdownLogoRegular,
  moon: MoonRegular,
  "squares-four": SquaresFourRegular,
  "square-split-horizontal": SquareSplitHorizontalRegular,
  tag: TagRegular,
  sun: SunRegular,
  translate: TranslateRegular,
  x: XRegular,
};

const duotoneIcons = {
  "book-open": BookOpenDuotone,
  "caret-down": CaretDownDuotone,
  "circle-half": CircleHalfDuotone,
  copy: CopyDuotone,
  database: DatabaseDuotone,
  lightbulb: LightbulbDuotone,
  list: ListDuotone,
  "markdown-logo": MarkdownLogoDuotone,
  moon: MoonDuotone,
  "squares-four": SquaresFourDuotone,
  "square-split-horizontal": SquareSplitHorizontalDuotone,
  tag: TagDuotone,
  sun: SunDuotone,
  translate: TranslateDuotone,
  x: XDuotone,
};

function stateEnabled(value) {
  return value === true || value === "" || value === "true" || value === "page" || value === "step";
}

export function resolvePhosphorIconWeight(state = "regular") {
  if (typeof state === "string") return state;
  if (state.weight) return state.weight;
  return stateEnabled(state.selected) || stateEnabled(state.active) || stateEnabled(state.pressed) || stateEnabled(state.current)
    ? "duotone"
    : "regular";
}

export function getPhosphorIcon(name, state = "regular") {
  const regular = regularIcons[name] ?? "";
  if (resolvePhosphorIconWeight(state) === "duotone") return duotoneIcons[name] ?? regular;
  return regular;
}
