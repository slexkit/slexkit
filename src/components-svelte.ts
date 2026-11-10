/** Svelte is the implementation detail; public components are Custom Elements. */
export { defineSlexElements, describeSlexElements } from "./web-components";
export type { DefineSlexElementsOptions, SlexElement, SlexElementType } from "./web-components";
import { defineSlexElements, type SlexElementType } from "./web-components";
export const registerAll = defineSlexElements;
export function registerSubset(components: SlexElementType[]): void { defineSlexElements({ components }); }
