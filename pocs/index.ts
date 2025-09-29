import "dotenv/config";
import { validatePools } from "./validate.js";

const adapterModules = {
  orca: () => import("./adapters/orca/orca.js"),
  meteora: () => import("./adapters/meteora/meteora.js"),
  pumpswap: () => import("./adapters/pumpswap/pumpSwap.js"),
} as const;

const adapterKey = process.argv[2] as keyof typeof adapterModules | undefined;

if (!adapterKey || !(adapterKey in adapterModules)) {
  console.error(`Invalid or missing adapter.

Usage:
  npm run orca
  npm run meteora
  npm run pumpswap`);
  process.exit(1);
}

const { default: defaultFn, ...named } = (await adapterModules[
  adapterKey
]()) as any;

const fetchFunction =
  typeof defaultFn === "function"
    ? defaultFn
    : (named as any)[
        `fetchPools${adapterKey[0].toUpperCase()}${adapterKey.slice(1)}`
      ];

if (typeof fetchFunction !== "function") {
  console.error(`Couldn't find a fetch function in ${adapterKey}`);
  process.exit(1);
}

const pools = await fetchFunction();
const validated = validatePools(adapterKey, pools, { min: 1 });

console.log(JSON.stringify(validated.slice(0, 200), null, 2));
console.error(`${adapterKey}: OK (${validated.length} pools)`);
