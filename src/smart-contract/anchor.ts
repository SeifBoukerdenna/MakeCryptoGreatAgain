// src/smart-contract/anchor.ts
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import idl from "./idl.json";
import type { McgaPool } from "./my_project";

export const NETWORK = "https://api.devnet.solana.com";
export const PROGRAM_ID = new PublicKey(
  "B979w4ShSrvQYrW62iWgijkEyxFaXDVDZS2SwpT4iVNN"
);

export const getProvider = () => {
  const connection = new Connection(NETWORK, "processed");
  const provider = new AnchorProvider(connection, window.solana, {
    commitment: "processed",
  });
  return provider;
};

export const getProgram = () => {
  const provider = getProvider();
  return new Program(idl as McgaPool, provider);
};
