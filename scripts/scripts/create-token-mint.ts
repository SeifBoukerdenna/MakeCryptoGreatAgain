// This uses "@metaplex-foundation/mpl-token-metadata@2" to create tokens
import "dotenv/config";
import fs from "fs";
import path from "path";
import {
  getExplorerLink,
  // Removed getKeypairFromEnvironment since we're loading from a file
} from "@solana-developers/helpers";
import {
  Connection,
  clusterApiUrl,
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
  Keypair,
} from "@solana/web3.js";
import { createCreateMetadataAccountV3Instruction } from "@metaplex-foundation/mpl-token-metadata";
import { PreReleaseTokenMint } from "./data";

// Path to your keypair JSON file
const keypairPath = path.resolve("my-wallet.json");

// Ensure the keypair file exists
if (!fs.existsSync(keypairPath)) {
  throw new Error(`Keypair file not found at ${keypairPath}`);
}

// Read and parse the keypair JSON file
const secretKeyString = fs.readFileSync(keypairPath, "utf8");
const secretKey = Uint8Array.from(JSON.parse(secretKeyString));

// Create a Keypair instance from the secret key
const user = Keypair.fromSecretKey(secretKey);

const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

console.log(
  `🔑 We've loaded our keypair securely from ${keypairPath}! Our public key is: ${user.publicKey.toBase58()}`
);

const TOKEN_METADATA_PROGRAM_ID = new PublicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
);

// **Important:** Replace this with your actual token mint address
const tokenMintAccount = new PublicKey(PreReleaseTokenMint);

const metadataData = {
  name: "PRE-RELEASE TEST V3",
  symbol: "PRTV3",
  uri: "https://gateway.pinata.cloud/ipfs/bafkreiautsay4zod5nd5mmkdyvcjzcgx6fwpeqhljouwueqpwjg4z36w5q",
  sellerFeeBasisPoints: 0,
  creators: null,
  collection: null,
  uses: null,
};

const [metadataPDA, _bump] = PublicKey.findProgramAddressSync(
  [
    Buffer.from("metadata"),
    TOKEN_METADATA_PROGRAM_ID.toBuffer(),
    tokenMintAccount.toBuffer(),
  ],
  TOKEN_METADATA_PROGRAM_ID
);

const transaction = new Transaction();

const createMetadataAccountInstruction =
  createCreateMetadataAccountV3Instruction(
    {
      metadata: metadataPDA,
      mint: tokenMintAccount,
      mintAuthority: user.publicKey,
      payer: user.publicKey,
      updateAuthority: user.publicKey,
    },
    {
      createMetadataAccountArgsV3: {
        collectionDetails: null,
        data: metadataData,
        isMutable: true,
      },
    }
  );

transaction.add(createMetadataAccountInstruction);

// Send and confirm the transaction
const transactionSignature = await sendAndConfirmTransaction(
  connection,
  transaction,
  [user]
);

const transactionLink = getExplorerLink(
  "transaction",
  transactionSignature,
  "devnet"
);

console.log(`✅ Transaction confirmed, explorer link is: ${transactionLink}`);

const tokenMintLink = getExplorerLink(
  "address",
  tokenMintAccount.toString(),
  "devnet"
);

console.log(`✅ Look at the token mint again: ${tokenMintLink}`);
