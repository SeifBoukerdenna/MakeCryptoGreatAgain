// src/components/SmartContract.tsx

import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { useCallback, useEffect, useState } from "react";
import { AnchorProvider, Program, BN } from "@coral-xyz/anchor";
import {
    PublicKey,
    SystemProgram,
    Transaction,
} from "@solana/web3.js";
import { getProgram } from "../smart-contract/anchor";
import { MCGA_TOKEN_MINT } from "../constants/tokens";
import {
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID,
    createAssociatedTokenAccountInstruction,
    getAssociatedTokenAddress,
} from "@solana/spl-token";

// Define the program account types
interface PoolAccount {
    size: BN;
    authority: PublicKey;
}

// Define the program methods
interface ProgramMethods {
    initialize(): {
        accounts(accounts: {
            poolAccount: PublicKey;
            user: PublicKey;
            systemProgram: PublicKey;
        }): {
            rpc(): Promise<string>;
        };
    };
    deposit(): { // Removed amount parameter
        accounts(accounts: {
            poolAccount: PublicKey;
            userTokenAccount: PublicKey;
            poolTokenAccount: PublicKey;
            user: PublicKey;
            tokenProgram: PublicKey;
        }): {
            rpc(): Promise<string>;
        };
    };
}

// Combine into a single type
type MyProgram = Program & {
    methods: ProgramMethods;
    account: {
        poolAccount: {
            fetch(address: PublicKey): Promise<PoolAccount>;
        };
    };
};

function SmartContract() {
    const wallet = useAnchorWallet();
    const [poolSize, setPoolSize] = useState<number | null>(null);
    const [program, setProgram] = useState<MyProgram | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [poolAccount, setPoolAccount] = useState<PublicKey | null>(null);

    // Initialize program and provider
    useEffect(() => {
        if (wallet) {
            try {
                const programInstance = getProgram() as unknown as MyProgram;
                setProgram(programInstance);
                setError(null);
            } catch (err) {
                setError("Failed to initialize program");
                console.error("Program initialization error:", err);
            }
        }
    }, [wallet]);

    // Derive the Pool PDA
    useEffect(() => {
        if (program) {
            const [poolAddr, poolBump] = PublicKey.findProgramAddressSync(
                [Buffer.from("pool")], // Correct seed
                program.programId
            );
            setPoolAccount(poolAddr);
            console.log("Derived Pool PDA:", poolAddr.toBase58(), "Bump:", poolBump);
        }
    }, [program]);

    // Fetch pool account size
    const fetchPoolSize = useCallback(async () => {
        if (!program || !poolAccount) return;
        try {
            const account = await program.account.poolAccount.fetch(poolAccount);
            setPoolSize(account.size.toNumber());
            setError(null);
        } catch (err) {
            console.error("Error fetching pool size:", err);
            setError("Failed to fetch pool size");
        }
    }, [program, poolAccount]);

    // Initialize the pool
    const initializePool = async () => {
        if (!program || !wallet || !poolAccount) return;
        try {
            setLoading(true);
            setError(null);

            const tx = await program.methods
                .initialize()
                .accounts({
                    poolAccount: poolAccount,
                    user: wallet.publicKey,
                    systemProgram: SystemProgram.programId,
                })
                .rpc();

            console.log("Pool initialized with transaction:", tx);
            await fetchPoolSize();
        } catch (err: any) {
            console.error("Error initializing pool:", err);
            setError("Failed to initialize pool");
        } finally {
            setLoading(false);
        }
    };

    // Deposit tokens (fixed amount of 250 MCGA)
    const depositTokens = async () => {
        if (!program || !wallet || !poolAccount) return;
        try {
            setLoading(true);
            setError(null);

            const provider = program.provider as AnchorProvider;

            // Define fixed deposit amount (considering decimals, e.g., 6 decimals)
            const DECIMALS = 6; // Adjust based on your token's decimals
            const amount = new BN(250 * Math.pow(10, DECIMALS)); // 250 MCGA tokens

            // Get token accounts addresses
            const userTokenAccount = await getAssociatedTokenAddress(
                MCGA_TOKEN_MINT,
                wallet.publicKey
            );

            const poolTokenAccount = await getAssociatedTokenAddress(
                MCGA_TOKEN_MINT,
                poolAccount,
                true  // allowOwnerOffCurve for PDA
            );

            console.log("User Token Account:", userTokenAccount.toString());
            console.log("Pool Token Account:", poolTokenAccount.toString());

            let transaction = new Transaction();

            // Create user's token account if it doesn't exist
            const userAccountInfo = await provider.connection.getAccountInfo(userTokenAccount);
            if (!userAccountInfo) {
                console.log("Creating user token account...");
                transaction.add(
                    createAssociatedTokenAccountInstruction(
                        wallet.publicKey,       // Payer
                        userTokenAccount,       // Associated Token Account
                        wallet.publicKey,       // Owner
                        MCGA_TOKEN_MINT         // Mint
                    )
                );
            }

            // Create pool's token account if it doesn't exist
            const poolAccountInfo = await provider.connection.getAccountInfo(poolTokenAccount);
            if (!poolAccountInfo) {
                console.log("Creating pool token account...");
                transaction.add(
                    createAssociatedTokenAccountInstruction(
                        wallet.publicKey,       // Payer
                        poolTokenAccount,       // Associated Token Account
                        poolAccount,            // Owner (Pool PDA)
                        MCGA_TOKEN_MINT         // Mint
                    )
                );
            }

            // Only send the create accounts transaction if needed
            if (transaction.instructions.length > 0) {
                console.log("Sending create accounts transaction...");
                const { blockhash } = await provider.connection.getLatestBlockhash();
                transaction.recentBlockhash = blockhash;
                transaction.feePayer = wallet.publicKey;

                const createAccountsTx = await provider.sendAndConfirm(transaction);
                console.log("Created token accounts:", createAccountsTx);

                // Wait for account creation to be confirmed
                await new Promise(resolve => setTimeout(resolve, 2000));
            }

            console.log("Sending deposit instruction...");
            // Send deposit instruction with fixed amount
            const tx = await program.methods
                .deposit()
                .accounts({
                    poolAccount,
                    userTokenAccount,
                    poolTokenAccount,
                    user: wallet.publicKey,
                    tokenProgram: TOKEN_PROGRAM_ID,
                })
                .rpc();

            console.log("Deposit successful:", tx);
            await fetchPoolSize();

        } catch (err: any) {
            console.error("Error in deposit process:", err);
            if (err.logs) {
                const logs = err.logs.join('\n');
                console.error("Transaction Logs:", logs);
                setError(`Transaction failed: ${logs}`);
            } else {
                setError(`Failed to complete deposit: ${err.message || err}`);
            }
        } finally {
            setLoading(false);
        }
    };

    // Fetch pool size when program or pool account changes
    useEffect(() => {
        if (program && poolAccount) {
            fetchPoolSize();
        }
    }, [program, poolAccount, fetchPoolSize]);

    return (
        <div className="p-8">
            <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-bold mb-6 text-center text-gray-800 dark:text-white">
                    MCGA Token Pool
                </h2>

                {error && (
                    <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
                        {error}
                    </div>
                )}

                {!wallet ? (
                    <p className="text-center text-gray-600 dark:text-gray-300">
                        Please connect your wallet to continue.
                    </p>
                ) : (
                    <div className="space-y-6">
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button
                                onClick={initializePool}
                                disabled={loading}
                                className={`px-6 py-2 rounded-lg font-semibold text-white ${loading
                                    ? 'bg-purple-300 cursor-not-allowed'
                                    : 'bg-purple-500 hover:bg-purple-600'
                                    }`}
                            >
                                {loading ? 'Processing...' : 'Initialize Pool'}
                            </button>
                            <button
                                onClick={depositTokens}
                                disabled={loading || poolSize === null}
                                className={`px-6 py-2 rounded-lg font-semibold text-white ${loading || poolSize === null
                                    ? 'bg-purple-300 cursor-not-allowed'
                                    : 'bg-purple-500 hover:bg-purple-600'
                                    }`}
                            >
                                {loading ? 'Processing...' : 'Deposit 250 MCGA Tokens'}
                            </button>
                        </div>

                        <div className="space-y-2 text-center">
                            <p className="text-gray-700 dark:text-gray-300">
                                Pool Size: {poolSize !== null ? `${poolSize / Math.pow(10, 6)} MCGA` : 'Not initialized'}
                            </p>
                            {poolAccount && (
                                <p className="text-sm text-gray-500 dark:text-gray-400 break-all">
                                    Pool Account: {poolAccount.toBase58()}
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default SmartContract;
