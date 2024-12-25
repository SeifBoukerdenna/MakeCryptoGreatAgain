// src/hooks/useMcgaBalance.ts
import { useEffect, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";

// Example: Import your MCGA_TOKEN_MINT from a config
import { MCGA_TOKEN_MINT } from "../constants/tokens";

async function fetchMcgaBalance(publicKey: PublicKey, connection: any) {
  try {
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
      publicKey,
      { mint: MCGA_TOKEN_MINT }
    );

    const mcgaAccount = tokenAccounts.value[0];
    if (mcgaAccount) {
      const tokenAmount = mcgaAccount.account.data.parsed.info.tokenAmount;
      return parseInt(tokenAmount.amount) / Math.pow(10, tokenAmount.decimals);
    }
    return 0;
  } catch (err) {
    console.error("Error fetching MCGA balance:", err);
    return 0;
  }
}

export function useMcgaBalance() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [mcgaBalance, setMcgaBalance] = useState<number>(0);

  useEffect(() => {
    if (!publicKey) {
      setMcgaBalance(0);
      return;
    }

    fetchMcgaBalance(publicKey, connection).then((balance) => {
      setMcgaBalance(balance);
    });
  }, [publicKey, connection]);

  return mcgaBalance;
}
