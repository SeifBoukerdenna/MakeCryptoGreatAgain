import { useState, useEffect } from 'react';
import { Program, AnchorProvider } from '@coral-xyz/anchor';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Keypair, PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import BN from 'bn.js';
import { supabase } from '../lib/supabase';

import IDL from '../smart-contract/idl.json';
import type { McgaPool } from '../smart-contract/my_project';

const MCGA_MINT = new PublicKey("5g1hscK8kkX9ee1Snmm4HvBM4fH1b2u1tfee3GyTewAq");
const PROGRAM_ID = new PublicKey(IDL.address);

interface PoolInfo {
    pool_address: string;
    pool_token_account: string;
    created_at: string;
}

const SmartContract = () => {
    const { connection } = useConnection();
    const wallet = useWallet();
    const { connected, publicKey } = wallet;
    const [poolInfo, setPoolInfo] = useState<PoolInfo | null>(null);
    const [poolBalance, setPoolBalance] = useState<number | null>(null);
    const [depositAmount, setDepositAmount] = useState("");
    const [secretPhrase, setSecretPhrase] = useState("");
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
            { commitment: 'confirmed' }
        );
        return provider;
    };

    const findPoolPDA = () => {
        return PublicKey.findProgramAddressSync(
            [Buffer.from("pool")],
            PROGRAM_ID
        );
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

        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const provider = getProvider();
            const program = new Program<McgaPool>(IDL as any, provider);
            const [poolPda] = findPoolPDA();

            // Create new token account for the pool
            const poolTokenAccount = Keypair.generate();

            const tx = await program.methods
                .initializePool()
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

            // Store pool info in Supabase
            const { error: upsertError } = await supabase
                .from('pool_info')
                .upsert({
                    pool_address: poolPda.toString(),
                    pool_token_account: poolTokenAccount.publicKey.toString(),
                });

            if (upsertError) throw upsertError;

            setPoolInfo({
                pool_address: poolPda.toString(),
                pool_token_account: poolTokenAccount.publicKey.toString(),
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

    const trySecret = async () => {
        if (!connected || !publicKey) {
            setError("Please connect your wallet first");
            return;
        }

        if (!poolInfo) {
            setError("No pool initialized");
            return;
        }

        if (parseFloat(depositAmount) <= 0) {
            setError("Amount must be greater than zero");
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const provider = getProvider();
            const program = new Program<McgaPool>(IDL as any, provider);

            // Get user's token account
            const userTokenAccounts = await connection.getTokenAccountsByOwner(
                publicKey,
                { mint: MCGA_MINT }
            );

            if (userTokenAccounts.value.length === 0) {
                throw new Error("No MCGA token account found");
            }

            const userTokenAccount = userTokenAccounts.value[0].pubkey;
            const amount = new BN(parseFloat(depositAmount) * 1e9);
            const [poolPda] = findPoolPDA();

            const tx = await program.methods
                .depositWithSecret(amount, secretPhrase)
                .accounts({
                    pool: poolPda,
                    poolTokenAccount: new PublicKey(poolInfo.pool_token_account),
                    userTokenAccount: userTokenAccount,
                    user: publicKey,
                    tokenProgram: TOKEN_PROGRAM_ID,
                })
                .rpc();

            setSuccess(`Transaction successful! Transaction: ${tx}`);
            setDepositAmount("");
            setSecretPhrase("");
        } catch (err) {
            console.error("Error with secret attempt:", err);
            setError("Failed to process: " + (err instanceof Error ? err.message : String(err)));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col space-y-4 max-w-md mx-auto p-4">
            <h2 className="text-2xl font-bold">MCGA Token Pool</h2>

            {/* Initialize Pool Section */}
            <div className="bg-gray-100 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">Initialize Pool</h3>
                <button
                    onClick={initializePool}
                    disabled={loading || !connected || !!poolInfo}
                    className={`bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 disabled:opacity-50 ${poolInfo ? 'cursor-not-allowed' : ''}`}
                >
                    {loading ? "Initializing..." : poolInfo ? "Pool Initialized" : "Initialize Pool"}
                </button>
                {poolInfo && (
                    <div className="mt-2 text-sm break-all space-y-2">
                        <p>Pool Balance: {poolBalance !== null ? poolBalance.toLocaleString() : "Loading..."} MCGA</p>
                    </div>
                )}
            </div>

            {/* Try Secret Section */}
            {poolInfo && (
                <div className="bg-gray-100 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-2">Try Your Luck</h3>
                    <div className="space-y-3">
                        <div>
                            <label className="block text-sm mb-1">Amount to Risk</label>
                            <input
                                type="number"
                                value={depositAmount}
                                onChange={(e) => setDepositAmount(e.target.value)}
                                placeholder="MCGA amount"
                                className="w-full p-2 border rounded"
                                min="0"
                            />
                        </div>
                        <div>
                            <label className="block text-sm mb-1">Secret Phrase</label>
                            <input
                                type="password"
                                value={secretPhrase}
                                onChange={(e) => setSecretPhrase(e.target.value)}
                                placeholder="Enter the secret phrase"
                                className="w-full p-2 border rounded"
                            />
                        </div>
                        <button
                            onClick={trySecret}
                            disabled={loading || !connected || parseFloat(depositAmount) <= 0}
                            className="w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
                        >
                            {loading ? "Processing..." : "Try Secret"}
                        </button>
                    </div>
                </div>
            )}

            {/* Status Messages */}
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    {error}
                </div>
            )}
            {success && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                    {success}
                </div>
            )}
        </div>
    );
};

export default SmartContract;