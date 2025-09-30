import { toPoolMeta } from "./mapping.js";
import { getJson } from "../../common/http.js";
import { ORCA_ENDPOINT } from "./constants.js";
import { PoolMeta } from "../../common/types.js";

export default async function fetch(): Promise<PoolMeta[]> {
  const pools = await getJson<{ whirlpools: any[] }>(ORCA_ENDPOINT);
  return pools.whirlpools.map(toPoolMeta);
}
