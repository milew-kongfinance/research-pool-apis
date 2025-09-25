import { env } from "./env.js";
import { Connection, PublicKey, Commitment } from "@solana/web3.js";

let _connection: Connection | null = null;

export function getConnection(
  commitment: Commitment = "confirmed"
): Connection {
  if (!_connection) {
    if (!env.SOLANA_RPC) {
      throw new Error("SOLANA_RPC is required for on-chain discovery");
    }

    _connection = new Connection(env.SOLANA_RPC, commitment);
  }

  return _connection;
}

export async function listProgramAccounts(
  programId: string,
  {
    limit = 400,
    dataSlice = { offset: 0, length: 0 },
  }: { limit?: number; dataSlice?: { offset: number; length: number } } = {}
) {
  const connection = getConnection("confirmed");

  try {
    const accounts = await connection.getProgramAccounts(
      new PublicKey(programId),
      { dataSlice }
    );

    return accounts.slice(0, limit).map((a) => a.pubkey.toBase58());
  } catch (error: any) {
    const code = error?.code ?? error?.data?.code;
    if (code === -32012 || code === -32010) {
      console.warn(
        `[scan-skipped] getProgramAccounts blocked for ${programId} (code ${code}). ` +
          `Use --onchain=true + a provider that allows scans or add filters.`
      );

      return [];
    }

    throw error;
  }
}
