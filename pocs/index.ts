import "dotenv/config";
import { validatePools } from "./validate.js";

const adapterModules = {
  raydium: () => import("./adapters/raydium.js"),
  orca: () => import("./adapters/orca.js"),
  meteora: () => import("./adapters/meteora.js"),
  pumpswap: () => import("./adapters/pumpSwap.js"),
} as const;

const adapterKey = process.argv[2] as keyof typeof adapterModules | undefined;
const cliArgs = process.argv.slice(3);
const parsedCliOptions = cliArgs.reduce<Record<string, unknown>>(
  (options, arg) => {
    const match = arg.match(/^--([^=]+)=(.+)$/);
    if (match) {
      const [, key, value] = match;
      options[key] = value.includes(",") ? value.split(",") : value;
    }

    return options;
  },
  {}
);

if (!("onchain" in parsedCliOptions)) {
  parsedCliOptions.onchain = "false";
}

if (!adapterKey || !(adapterKey in adapterModules)) {
  console.error(`Usage:
  npm run fetch -- <raydium|orca|meteora|pumpswap> [--ids=id1,id2] [--onchain=true]

Examples:
  npm run fetch -- raydium
  npm run fetch -- raydium --ids=xxxxx,yyyyy --onchain=true
  npm run fetch -- orca`);

  process.exit(1);
}

const { default: defaultFn, ...named } = (await adapterModules[
  adapterKey
]()) as any;

const fn =
  typeof defaultFn === "function"
    ? defaultFn
    : (named as any)[
        `fetchPools${adapterKey[0].toUpperCase()}${adapterKey.slice(1)}`
      ];

if (typeof fn !== "function") {
  console.error(`Couldn't find a fetch function in ${adapterKey}`);
  process.exit(1);
}

const pools = await fn(parsedCliOptions);
const min = ["raydium", "orca", "meteora", "pumpswap"].includes(adapterKey)
  ? 1
  : 1;

const validated = validatePools(adapterKey, pools, { min });

console.log(JSON.stringify(validated.slice(0, 200), null, 2));
console.error(`${adapterKey}: OK (${validated.length} pools)`);
