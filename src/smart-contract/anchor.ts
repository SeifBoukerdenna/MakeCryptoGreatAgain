// app/src/anchor.ts

import { AnchorProvider, Program, setProvider } from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import idl from "./idl.json";
import { MyProject } from "./my_project";

export const NETWORK = "https://api.devnet.solana.com";
export const PROGRAM_ID = new PublicKey(
  "B979w4ShSrvQYrW62iWgijkEyxFaXDVDZS2SwpT4iVNN"
);

export const getProvider = (): AnchorProvider => {
  const connection = new Connection(NETWORK, "processed");
  const provider = new AnchorProvider(
    connection,
    (window as any).solana,
    AnchorProvider.defaultOptions()
  );
  setProvider(provider);
  return provider;
};

export const getProgram = (): Program<MyProject> => {
  const provider = getProvider();
  return new Program(idl as MyProject, provider);
};
