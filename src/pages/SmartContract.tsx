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
    seed: string;
    created_at: string;
}

const SmartContract = () => {
    const { connection } = useConnection();
    const { connected, publicKey } = useWallet();
    const [poolInfo, setPoolInfo] = useState<PoolInfo | null>(null);
    const [poolBalance, setPoolBalance] = useState<number | null>(null);
    const [initHash, setInitHash] = useState("");
    const [amount, setAmount] = useState("");
    const [attemptHash, setAttemptHash] = useState("");

    useEffect(() => {
        fetchPoolInfo();
    }, []);

    useEffect(() => {
        if (poolInfo?.pool_token_account) {
            fetchPoolBalance(new PublicKey(poolInfo.pool_token_account));
        }
    }, [poolInfo]);

    const getProvider = () => {
        if (!publicKey) throw new Error('Wallet not connected');
        return new AnchorProvider(connection, window.solana, {});
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
        }
    };

    const initializePool = async () => {
        if (!connected || !publicKey || !initHash) return;

        try {
            const provider = getProvider();
            const program = new Program<McgaPool>(IDL as McgaPool, provider);

            const uniqueSeed = `pool_${Date.now()}`;
            const [poolPda] = PublicKey.findProgramAddressSync(
                [Buffer.from(uniqueSeed)],
                program.programId
            );

            const poolTokenAccount = Keypair.generate();

            const tx = await program.methods
                .initializePool(uniqueSeed, initHash)
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

            console.log("Pool initialized:", tx);

            const newPoolInfo = {
                pool_address: poolPda.toString(),
                pool_token_account: poolTokenAccount.publicKey.toString(),
                seed: uniqueSeed,
                created_at: new Date().toISOString()
            };

            const { error } = await supabase
                .from('pool_info')
                .upsert(newPoolInfo);

            if (error) throw error;
            await fetchPoolInfo();

        } catch (err) {
            console.error("Error initializing pool:", err);
        }
    };

    const tryGuess = async () => {
        if (!connected || !publicKey || !poolInfo) return;

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
            const depositAmount = new BN(parseFloat(amount) * 1e9);

            const [poolPda] = PublicKey.findProgramAddressSync(
                [Buffer.from(poolInfo.seed)],
                program.programId
            );

            // Step 1: Deposit
            console.log("Depositing tokens...");
            const depositTx = await program.methods
                .deposit(depositAmount)
                .accounts({
                    pool: poolPda,
                    poolTokenAccount: new PublicKey(poolInfo.pool_token_account),
                    userTokenAccount: userTokenAccount,
                    user: publicKey,
                    tokenProgram: TOKEN_PROGRAM_ID,
                })
                .rpc();

            console.log("Deposit complete:", depositTx);

            // Step 2: Check hash
            console.log("Checking hash...");
            const checkTx = await program.methods
                .checkHash(attemptHash)
                .accounts({
                    pool: poolPda,
                    poolTokenAccount: new PublicKey(poolInfo.pool_token_account),
                    userTokenAccount: userTokenAccount,
                    user: publicKey,
                    tokenProgram: TOKEN_PROGRAM_ID,
                })
                .rpc();

            console.log("Hash check complete:", checkTx);

            // Refresh pool balance after transactions
            await fetchPoolBalance(new PublicKey(poolInfo.pool_token_account));
        } catch (err) {
            console.error("Error:", err);
        }
    };

    return (
        <div>
            {!poolInfo ? (
                <div>
                    <input
                        type="text"
                        placeholder="Enter hash for pool"
                        value={initHash}
                        onChange={(e) => setInitHash(e.target.value)}
                    />
                    <button onClick={initializePool}>Initialize Pool</button>
                </div>
            ) : (
                <div>
                    <div>Pool: {poolInfo.pool_address}</div>
                    <div>Token Account: {poolInfo.pool_token_account}</div>
                    <div>Current Pool Balance: {poolBalance?.toString() || '0'} MCGA</div>
                    <input
                        type="number"
                        placeholder="Amount"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                    />
                    <input
                        type="text"
                        placeholder="Attempt hash"
                        value={attemptHash}
                        onChange={(e) => setAttemptHash(e.target.value)}
                    />
                    <button onClick={tryGuess}>Try Guess</button>
                </div>
            )}
        </div>
    );
};

export default SmartContract;