import "dotenv/config";
import { z } from "zod";

const EnvSchema = z.object({
  SOLANA_RPC: z.string().optional().default(""),
  PUMPSWAP_PROGRAM: z.string().optional().default(""),
});

export const env = EnvSchema.parse({
  SOLANA_RPC: process.env.SOLANA_RPC,
  PUMPSWAP_PROGRAM: process.env.PUMPSWAP_PROGRAM,
});

export const hasRpc = () => !!env.SOLANA_RPC;
