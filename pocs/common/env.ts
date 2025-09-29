import "dotenv/config";
import { z } from "zod";

const EnvSchema = z.object({
  SOLANA_RPC: z.string().optional().default(""),
  PUMPSWAP_PROGRAM: z.string().optional().default(""),
  BIRDEYE_API_KEY: z.string().optional().default(""),
});

export const env = EnvSchema.parse({
  SOLANA_RPC: process.env.SOLANA_RPC,
  PUMPSWAP_PROGRAM: process.env.PUMPSWAP_PROGRAM,
  BIRDEYE_API_KEY: process.env.BIRDEYE_API_KEY,
});

export const hasRpc = () => !!env.SOLANA_RPC;
