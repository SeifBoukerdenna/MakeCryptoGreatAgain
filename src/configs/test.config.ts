// src/configs/test.config.ts

export const TEST_MODE = true; // Toggle this for testing
export const FREE_CHARACTER_ID = "1"; // Trump's ID

export const MAX_REQUESTS_PER_MINUTE = 15;
export const CHALLENGES_ENABLED = false;

export const SHOW_CONTRACT_HASH = false;

const devMode = true;
export const NETWORK = devMode ? "devnet" : "mainnet";

export const endpoint = devMode
  ? "https://api.devnet.solana.com"
  : "https://go.getblock.io/362df45e292143fead2e2288ab34ec29";
