// src/components/SmartContract.tsx
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
}

const SmartContract = () => {
    const { connection } = useConnection();
    const wallet = useWallet();
    const { connected, publicKey } = wallet;
    const [poolInfo, setPoolInfo] = useState<PoolInfo | null>(null);
    const [poolBalance, setPoolBalance] = useState<number | null>(null);
    const [depositAmount, setDepositAmount] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Fetch pool info on component mount
    useEffect(() => {
        fetchPoolInfo();
    }, []);

    // Fetch pool balance when pool info changes
    useEffect(() => {
        if (poolInfo?.pool_token_account) {
            const poolTokenPubkey = new PublicKey(poolInfo.pool_token_account);
            fetchPoolBalance(poolTokenPubkey);

            // Subscribe to account changes
            const subscriptionId = connection.onAccountChange(
                poolTokenPubkey,
                () => {
                    fetchPoolBalance(poolTokenPubkey);
                },
                'singleGossip'
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
            const amount = balanceInfo.value.uiAmount;
            setPoolBalance(amount);
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
            const program = new Program<McgaPool>(IDL as McgaPool, provider);

            // Generate keypairs
            const pool = Keypair.generate();
            const poolTokenAccount = Keypair.generate();

            const tx = await program.methods
                .initializePool()
                .accounts({
                    pool: pool.publicKey,
                    poolTokenAccount: poolTokenAccount.publicKey,
                    mcgaMint: MCGA_MINT,
                    authority: publicKey,
                    systemProgram: SystemProgram.programId,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    rent: SYSVAR_RENT_PUBKEY,
                })
                .signers([pool, poolTokenAccount])
                .rpc();

            // Store pool info in Supabase
            const { error: upsertError } = await supabase
                .from('pool_info')
                .upsert({
                    pool_address: pool.publicKey.toString(),
                    pool_token_account: poolTokenAccount.publicKey.toString(),
                }, {
                    onConflict: 'pool_address'
                });

            if (upsertError) throw upsertError;

            // Update local state
            setPoolInfo({
                pool_address: pool.publicKey.toString(),
                pool_token_account: poolTokenAccount.publicKey.toString(),
                created_at: new Date().toISOString(),
            });

            setSuccess(`Pool initialized! Transaction: ${tx}`);

            // Refresh pool info
            await fetchPoolInfo();
        } catch (err) {
            console.error("Error initializing pool:", err);
            setError("Failed to initialize pool: " + (err instanceof Error ? err.message : String(err)));
        } finally {
            setLoading(false);
        }
    };

    const deposit = async () => {
        if (!connected || !publicKey) {
            setError("Please connect your wallet first");
            return;
        }

        if (!poolInfo) {
            setError("No pool initialized");
            return;
        }

        if (parseFloat(depositAmount) <= 0) {
            setError("Deposit amount must be greater than zero");
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const provider = getProvider();
            const program = new Program<McgaPool>(IDL as McgaPool, provider);

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

            const poolPubkey = new PublicKey(poolInfo.pool_address);
            const poolTokenPubkey = new PublicKey(poolInfo.pool_token_account);

            const tx = await program.methods
                .deposit(amount)
                .accounts({
                    pool: poolPubkey,
                    poolTokenAccount: poolTokenPubkey,
                    userTokenAccount: userTokenAccount,
                    user: publicKey,
                    tokenProgram: TOKEN_PROGRAM_ID,
                })
                .rpc();

            setSuccess(`Deposit successful! Transaction: ${tx}`);
            setDepositAmount("");
        } catch (err) {
            console.error("Error depositing:", err);
            setError("Failed to deposit: " + (err instanceof Error ? err.message : String(err)));
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
                        <p>Pool Address: {poolInfo.pool_address}</p>
                        <p>Pool Token Account: {poolInfo.pool_token_account}</p>
                        <p>Pool Balance: {poolBalance !== null ? poolBalance.toLocaleString() : "Loading..."} MCGA</p>
                    </div>
                )}
            </div>

            {/* Deposit Section */}
            {poolInfo && (
                <div className="bg-gray-100 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-2">Deposit MCGA</h3>
                    <div className="flex space-x-2">
                        <input
                            type="number"
                            value={depositAmount}
                            onChange={(e) => setDepositAmount(e.target.value)}
                            placeholder="Amount to deposit"
                            className="flex-1 p-2 border rounded"
                            min="0"
                        />
                        <button
                            onClick={deposit}
                            disabled={loading || !connected || !poolInfo || parseFloat(depositAmount) <= 0}
                            className={`bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50 ${!depositAmount || parseFloat(depositAmount) <= 0 ? 'cursor-not-allowed' : ''}`}
                        >
                            {loading ? "Depositing..." : "Deposit"}
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