// src/components/AdminPools.tsx
import React, { useState, useEffect } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Keypair, PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY } from '@solana/web3.js';
import { Program, AnchorProvider } from '@coral-xyz/anchor';
import { Loader2, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { charactersConfig } from '../configs/characters.config';
import IDL from '../smart-contract/idl.json';
import type { McgaPool } from '../smart-contract/my_project';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';

const MCGA_MINT = new PublicKey("5g1hscK8kkX9ee1Snmm4HvBM4fH1b2u1tfee3GyTewAq");

interface PoolInfo {
    pool_address: string;
    pool_token_account: string;
    seed: string;
    created_at: string;
    character_id: string;
}

const AdminPools: React.FC = () => {
    const { connection } = useConnection();
    const { connected, publicKey } = useWallet();
    const [poolInfo, setPoolInfo] = useState<Record<string, PoolInfo>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [processingCharId, setProcessingCharId] = useState<string | null>(null);

    useEffect(() => {
        fetchPoolInfo();
    }, []);

    const fetchPoolInfo = async () => {
        try {
            const { data, error } = await supabase
                .from('pool_info')
                .select('*');

            if (error) throw error;

            const poolMap: Record<string, PoolInfo> = {};
            data?.forEach(pool => {
                poolMap[pool.character_id] = pool;
            });
            setPoolInfo(poolMap);
        } catch (err) {
            console.error('Error fetching pool info:', err);
            setError('Failed to load pool information');
        }
    };

    const getProvider = () => {
        if (!publicKey) throw new Error('Wallet not connected');
        return new AnchorProvider(connection, window.solana, {});
    };

    const initializePool = async (characterId: string, secretHash: string) => {
        if (!connected || !publicKey) return;

        try {
            setProcessingCharId(characterId);
            setIsLoading(true);
            setError(null);

            const provider = getProvider();
            const program = new Program<McgaPool>(IDL as McgaPool, provider);

            const uniqueSeed = `pool_${characterId}_${Date.now()}`;
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

            console.log("Pool initialized:", tx);

            const newPoolInfo = {
                pool_address: poolPda.toString(),
                pool_token_account: poolTokenAccount.publicKey.toString(),
                seed: uniqueSeed,
                created_at: new Date().toISOString(),
                character_id: characterId
            };

            const { error: upsertError } = await supabase
                .from('pool_info')
                .upsert(newPoolInfo);

            if (upsertError) throw upsertError;
            await fetchPoolInfo();

        } catch (err) {
            console.error("Error initializing pool:", err);
            setError('Failed to initialize pool');
        } finally {
            setIsLoading(false);
            setProcessingCharId(null);
        }
    };

    return (
        <section className="admin-section">
            <h2>Pool Management</h2>

            {error && (
                <div className="error-message">
                    {error}
                    <button onClick={() => setError(null)}>Dismiss</button>
                </div>
            )}

            <div className="grid gap-4 p-4">
                {charactersConfig.map((character) => {
                    const existingPool = poolInfo[character.id];

                    return (
                        <div key={character.id} className="character-secret-card">
                            <div className="secret-header">
                                <img
                                    src={character.avatar}
                                    alt={character.name}
                                    className="rounded-full"
                                />
                                <h3>{character.name}</h3>
                            </div>

                            {existingPool ? (
                                <div className="mt-4 space-y-2">
                                    <div className="text-sm">
                                        <span className="font-semibold">Pool Address:</span>{' '}
                                        {existingPool.pool_address}
                                    </div>
                                    <div className="text-sm">
                                        <span className="font-semibold">Token Account:</span>{' '}
                                        {existingPool.pool_token_account}
                                    </div>
                                    <div className="text-sm">
                                        <span className="font-semibold">Created:</span>{' '}
                                        {new Date(existingPool.created_at).toLocaleString()}
                                    </div>
                                </div>
                            ) : (
                                <div className="secret-actions mt-4">
                                    <button
                                        onClick={() => {
                                            // Get the secret from character_secrets table first
                                            const secret = prompt('Enter secret hash for the pool:');
                                            if (secret) {
                                                initializePool(character.id, secret);
                                            }
                                        }}
                                        className="secret-button add"
                                        disabled={isLoading || processingCharId === character.id}
                                    >
                                        {processingCharId === character.id ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Plus className="w-4 h-4" />
                                        )}
                                        Initialize Pool
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </section>
    );
};

export default AdminPools;