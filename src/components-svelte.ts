import {
  registerAll,
  registerSvelteComponent,
  registerSubset,
} from "./components/index";

const registerAllApi = registerAll;
const registerSvelteComponentApi = registerSvelteComponent;
const registerSubsetApi = registerSubset;

export {
  registerAllApi as registerAll,
  registerSvelteComponentApi as registerSvelteComponent,
  registerSubsetApi as registerSubset,
};
