import { useState, useEffect } from 'react';
import { Program, AnchorProvider } from '@coral-xyz/anchor';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, Keypair, SystemProgram, SYSVAR_RENT_PUBKEY } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import BN from 'bn.js';
import { supabase } from '../lib/supabase';

import IDL from '../smart-contract/idl.json';
import type { McgaPool } from '../smart-contract/my_project';

const MCGA_MINT = new PublicKey("5g1hscK8kkX9ee1Snmm4HvBM4fH1b2u1tfee3GyTewAq");

interface PoolInfo {
    pool_address: string;
    pool_token_account: string;
    created_at: string;
    seed: string;
}

const SmartContract = () => {
    const { connection } = useConnection();
    const wallet = useWallet();
    const { connected, publicKey } = wallet;
    const [poolInfo, setPoolInfo] = useState<PoolInfo | null>(null);
    const [poolBalance, setPoolBalance] = useState<number | null>(null);
    const [depositAmount, setDepositAmount] = useState("");
    const [attemptHash, setAttemptHash] = useState("");
    const [secretHash, setSecretHash] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        fetchPoolInfo();
    }, []);

    useEffect(() => {
        if (poolInfo?.pool_token_account) {
            const poolTokenPubkey = new PublicKey(poolInfo.pool_token_account);
            fetchPoolBalance(poolTokenPubkey);

            const subscriptionId = connection.onAccountChange(
                poolTokenPubkey,
                () => {
                    fetchPoolBalance(poolTokenPubkey);
                },
                'confirmed'
            );

            return () => {
                connection.removeAccountChangeListener(subscriptionId);
            };
        }
    }, [poolInfo, connection]);

    const getProvider = () => {
        if (!wallet || !publicKey) throw new Error('Wallet not connected');
        const provider = new AnchorProvider(
            connection,
            wallet as any,
            AnchorProvider.defaultOptions()
        );
        return provider;
    };

    const fetchPoolInfo = async () => {
        try {
            const { data, error } = await supabase
                .from('pool_info')
                .select('*')
                .single();

            if (error) {
                console.error('Error fetching pool info:', error);
                return;
            }

            setPoolInfo(data);
        } catch (err) {
            console.error('Error in fetchPoolInfo:', err);
        }
    };

    const fetchPoolBalance = async (poolTokenPubkey: PublicKey) => {
        try {
            const balanceInfo = await connection.getTokenAccountBalance(poolTokenPubkey);
            setPoolBalance(balanceInfo.value.uiAmount);
        } catch (err) {
            console.error("Error fetching pool balance:", err);
            setError("Failed to fetch pool balance");
        }
    };

    const initializePool = async () => {
        if (!connected || !publicKey) {
            setError("Please connect your wallet first");
            return;
        }

        if (!secretHash) {
            setError("Please enter a secret phrase");
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const uniqueSeed = `pool_${Date.now()}`;
            const provider = getProvider();
            const program = new Program<McgaPool>(IDL as McgaPool, provider);

            const [poolPda] = PublicKey.findProgramAddressSync(
                [Buffer.from(uniqueSeed)],
                program.programId
            );

            const poolTokenAccount = Keypair.generate();

            const tx = await program.methods
                .initializePool(uniqueSeed, secretHash)
                .accounts({
                    pool: poolPda,
                    poolTokenAccount: poolTokenAccount.publicKey,
                    mcgaMint: MCGA_MINT,
                    authority: publicKey,
                    systemProgram: SystemProgram.programId,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    rent: SYSVAR_RENT_PUBKEY,
                })
                .signers([poolTokenAccount])
                .rpc();

            const { error: upsertError } = await supabase
                .from('pool_info')
                .upsert({
                    pool_address: poolPda.toString(),
                    pool_token_account: poolTokenAccount.publicKey.toString(),
                    seed: uniqueSeed,
                    created_at: new Date().toISOString(),
                });

            if (upsertError) throw upsertError;

            setPoolInfo({
                pool_address: poolPda.toString(),
                pool_token_account: poolTokenAccount.publicKey.toString(),
                seed: uniqueSeed,
                created_at: new Date().toISOString(),
            });

            setSuccess(`Pool initialized! Transaction: ${tx}`);
            await fetchPoolInfo();
        } catch (err) {
            console.error("Error initializing pool:", err);
            setError("Failed to initialize pool: " + (err instanceof Error ? err.message : String(err)));
        } finally {
            setLoading(false);
        }
    };

    const depositWithHash = async () => {
        if (!connected || !publicKey) {
            setError("Please connect your wallet first");
            return;
        }

        if (!poolInfo) {
            setError("No pool initialized");
            return;
        }

        if (!depositAmount || !attemptHash) {
            setError("Please enter both amount and hash");
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const provider = getProvider();
            const program = new Program<McgaPool>(IDL as McgaPool, provider);

            const userTokenAccounts = await connection.getTokenAccountsByOwner(
                publicKey,
                { mint: MCGA_MINT }
            );

            if (userTokenAccounts.value.length === 0) {
                throw new Error("No MCGA token account found");
            }

            const userTokenAccount = userTokenAccounts.value[0].pubkey;
            const amount = new BN(parseFloat(depositAmount) * 1e9);

            const [poolPda] = PublicKey.findProgramAddressSync(
                [Buffer.from(poolInfo.seed)],
                program.programId
            );

            const poolTokenPubkey = new PublicKey(poolInfo.pool_token_account);

            const tx = await program.methods
                .depositWithHash(amount, attemptHash)
                .accounts({
                    pool: poolPda,
                    poolTokenAccount: poolTokenPubkey,
                    userTokenAccount: userTokenAccount,
                    user: publicKey,
                    tokenProgram: TOKEN_PROGRAM_ID,
                })
                .rpc();

            setSuccess(`Transaction successful! Hash: ${tx}`);
            setDepositAmount("");
            setAttemptHash("");
        } catch (err) {
            console.error("Error depositing:", err);
            setError("Failed to deposit: " + (err instanceof Error ? err.message : String(err)));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col space-y-4 max-w-md mx-auto p-4">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">MCGA Token Pool</h2>

            {/* Initialize Pool Section */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold mb-4">Initialize Pool</h3>
                {!poolInfo && (
                    <div className="mb-4">
                        <input
                            type="text"
                            value={secretHash}
                            onChange={(e) => setSecretHash(e.target.value)}
                            placeholder="Enter secret phrase for pool"
                            className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-purple-500 mb-4"
                        />
                    </div>
                )}
                <button
                    onClick={initializePool}
                    disabled={loading || !connected || !!poolInfo || (!poolInfo && !secretHash)}
                    className="w-full bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:opacity-50 transition-all duration-200"
                >
                    {loading ? "Initializing..." : poolInfo ? "Pool Initialized" : "Initialize Pool"}
                </button>

                {poolInfo && (
                    <div className="mt-4 text-sm space-y-2 bg-gray-50 dark:bg-gray-700 p-4 rounded">
                        <p className="break-all">Pool Address: {poolInfo.pool_address}</p>
                        <p className="break-all">Pool Token Account: {poolInfo.pool_token_account}</p>
                        <p>Pool Balance: {poolBalance !== null ? poolBalance.toLocaleString() : "Loading..."} MCGA</p>
                    </div>
                )}
            </div>

            {/* Deposit With Hash Section */}
            {poolInfo && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-semibold mb-4">Try Your Luck</h3>
                    <div className="space-y-4">
                        <div>
                            <input
                                type="number"
                                value={depositAmount}
                                onChange={(e) => setDepositAmount(e.target.value)}
                                placeholder="Amount to deposit"
                                className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                                min="0"
                            />
                        </div>
                        <div>
                            <input
                                type="text"
                                value={attemptHash}
                                onChange={(e) => setAttemptHash(e.target.value)}
                                placeholder="Enter secret phrase"
                                className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                        </div>
                        <button
                            onClick={depositWithHash}
                            disabled={loading || !connected || !poolInfo || !depositAmount || !attemptHash}
                            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-3 rounded hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 transition-all duration-200 font-medium"
                        >
                            {loading ? "Processing..." : "Try Your Luck"}
                        </button>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                            Enter amount and secret phrase to try winning the pool's balance
                        </p>
                    </div>
                </div>
            )}

            {/* Status Messages */}
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                    <span className="block sm:inline">{error}</span>
                </div>
            )}
            {success && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
                    <span className="block sm:inline">{success}</span>
                </div>
            )}
        </div>
    );
};

export default SmartContract;