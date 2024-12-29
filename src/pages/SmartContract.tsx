import { useState, useEffect } from 'react';
import { Program, AnchorProvider, BN } from '@coral-xyz/anchor';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, Keypair, SystemProgram, SYSVAR_RENT_PUBKEY } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';

import IDL from '../smart-contract/idl.json';
import type { McgaPool } from '../smart-contract/my_project';

// Constants
const PROGRAM_ID = new PublicKey("DNsprXHccVbxFTE2RNvchU3E3W1Hn3U4yosFSiVs8bQT"); // Your deployed program ID
const MCGA_MINT = new PublicKey("5g1hscK8kkX9ee1Snmm4HvBM4fH1b2u1tfee3GyTewAq"); // New mint address

const LOCAL_STORAGE_POOL_KEY = "mcga_pool_address";
const LOCAL_STORAGE_POOL_TOKEN_ACCOUNT_KEY = "mcga_pool_token_account";

const SmartContract = () => {
    const { connection } = useConnection();
    const wallet = useWallet();
    const { connected, publicKey } = wallet;
    const [poolAddress, setPoolAddress] = useState<string | null>(null);
    const [poolTokenAccount, setPoolTokenAccount] = useState<string | null>(null);
    const [depositAmount, setDepositAmount] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Load pool data from Local Storage on component mount
    useEffect(() => {
        if (publicKey) {
            const savedPoolAddress = localStorage.getItem(LOCAL_STORAGE_POOL_KEY);
            const savedPoolTokenAccount = localStorage.getItem(LOCAL_STORAGE_POOL_TOKEN_ACCOUNT_KEY);

            if (savedPoolAddress && savedPoolTokenAccount) {
                setPoolAddress(savedPoolAddress);
                setPoolTokenAccount(savedPoolTokenAccount);
            }
        }
    }, [publicKey]);

    const getProvider = () => {
        if (!wallet || !publicKey) throw new Error('Wallet not connected');
        const provider = new AnchorProvider(
            connection,
            wallet as any,
            AnchorProvider.defaultOptions()
        );
        return provider;
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

            // Update state
            const poolAddressStr = pool.publicKey.toString();
            const poolTokenAccountStr = poolTokenAccount.publicKey.toString();

            setPoolAddress(poolAddressStr);
            setPoolTokenAccount(poolTokenAccountStr);
            setSuccess(`Pool initialized! Transaction: ${tx}`);

            // Save to Local Storage
            localStorage.setItem(LOCAL_STORAGE_POOL_KEY, poolAddressStr);
            localStorage.setItem(LOCAL_STORAGE_POOL_TOKEN_ACCOUNT_KEY, poolTokenAccountStr);
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

        if (!poolAddress || !poolTokenAccount) {
            setError("Please initialize a pool first");
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
            const amount = new BN(parseFloat(depositAmount) * 1e9); // Convert to smallest units

            const poolPubkey = new PublicKey(poolAddress);
            const poolTokenPubkey = new PublicKey(poolTokenAccount);

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
        } catch (err) {
            console.error("Error depositing:", err);
            setError("Failed to deposit: " + (err instanceof Error ? err.message : String(err)));
        } finally {
            setLoading(false);
        }
    };

    const resetPool = () => {
        // Optional: Function to reset the pool data from Local Storage
        localStorage.removeItem(LOCAL_STORAGE_POOL_KEY);
        localStorage.removeItem(LOCAL_STORAGE_POOL_TOKEN_ACCOUNT_KEY);
        setPoolAddress(null);
        setPoolTokenAccount(null);
        setSuccess(null);
        setError(null);
    };

    return (
        <div className="flex flex-col space-y-4 max-w-md mx-auto p-4">
            <h2 className="text-2xl font-bold">MCGA Token Pool</h2>

            {/* Initialize Pool Section */}
            <div className="bg-gray-100 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">Initialize Pool</h3>
                <button
                    onClick={initializePool}
                    disabled={loading || !connected || !!poolAddress}
                    className={`bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 disabled:opacity-50 ${poolAddress ? 'cursor-not-allowed' : ''}`}
                >
                    {loading ? "Initializing..." : poolAddress ? "Pool Initialized" : "Initialize Pool"}
                </button>
                {poolAddress && (
                    <div className="mt-2 text-sm break-all space-y-2">
                        <p>Pool Address: {poolAddress}</p>
                        <p>Pool Token Account: {poolTokenAccount}</p>
                        <button
                            onClick={resetPool}
                            className="text-red-500 underline text-sm"
                        >
                            Reset Pool
                        </button>
                    </div>
                )}
            </div>

            {/* Deposit Section */}
            {poolAddress && (
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
                            disabled={loading || !connected || !poolAddress || parseFloat(depositAmount) <= 0}
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
