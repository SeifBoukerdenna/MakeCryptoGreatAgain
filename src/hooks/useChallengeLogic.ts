// src/hooks/useChallengeLogic.ts
import { useState, useEffect } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useDynamicCooldown } from "./useDynamicCooldown";
import { PublicKey } from "@solana/web3.js";
import { BN, Program } from "@coral-xyz/anchor";
import { McgaPool } from "../smart-contract/idl_type";
import IDL from "../smart-contract/idl.json";
import { getProvider } from "../smart-contract/anchor";
import { Price } from "../constants/price";
import { supabase } from "../lib/supabase";
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from "@solana/spl-token";

interface CharacterStatus {
  character_id: string;
  is_solved: boolean;
  solved_by: string | null;
  solved_at: string | null;
  tokens_won: number;
}

interface ChallengeAttempt {
  character_id: string;
  wallet_address: string;
  last_attempt: string;
  next_attempt_allowed: string;
  attempts: number;
}

interface PoolInfo {
  pool_address: string;
  pool_token_account: string;
  seed: string;
  created_at: string;
  character_id: string;
}

export function useChallengeLogic(onTransaction?: (txHash: string) => void) {
  const { connected, publicKey } = useWallet();
  const { connection } = useConnection();
  const { dynamicCooldownMs } = useDynamicCooldown();

  const MCGA_MINT = new PublicKey(
    "5g1hscK8kkX9ee1Snmm4HvBM4fH1b2u1tfee3GyTewAq"
  );

  // States
  const [guesses, setGuesses] = useState<Record<string, string>>({});
  const [attempts, setAttempts] = useState<Record<string, ChallengeAttempt>>(
    {}
  );
  const [characterStatuses, setCharacterStatuses] = useState<
    Record<string, CharacterStatus>
  >({});
  const [isLoading, setIsLoading] = useState(false);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [poolInfos, setPoolInfos] = useState<Record<string, PoolInfo>>({});
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});

  // Initialize Realtime subscription
  useEffect(() => {
    const characterStatusSub = supabase
      .channel("character-status-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "character_status" },
        () => fetchCharacterStatuses()
      )
      .subscribe();

    return () => {
      characterStatusSub.unsubscribe();
    };
  }, []);

  // Fetch initial data
  useEffect(() => {
    fetchCharacterStatuses();
    fetchPoolInfo();
  }, []);

  // Fetch user-specific attempts when wallet connects
  useEffect(() => {
    if (publicKey) {
      fetchUserAttempts();
    } else {
      setAttempts({});
    }
  }, [publicKey]);

  const fetchCharacterStatuses = async () => {
    try {
      const { data, error } = await supabase
        .from("character_status")
        .select("*");

      if (error) throw error;

      const statusMap: Record<string, CharacterStatus> = {};
      data?.forEach((status) => {
        statusMap[status.character_id] = status;
      });
      setCharacterStatuses(statusMap);
    } catch (err) {
      console.error("Error fetching character statuses:", err);
    }
  };

  const fetchUserAttempts = async () => {
    if (!publicKey) return;

    try {
      const { data, error } = await supabase
        .from("challenge_attempts")
        .select("*")
        .eq("wallet_address", publicKey.toString());

      if (error) throw error;

      const attemptsMap: Record<string, ChallengeAttempt> = {};
      data?.forEach((attempt) => {
        attemptsMap[attempt.character_id] = attempt;
      });
      setAttempts(attemptsMap);
    } catch (err) {
      console.error("Error fetching user attempts:", err);
    }
  };

  const isCoolingDown = (characterId: string): boolean => {
    const attempt = attempts[characterId];
    if (!attempt?.next_attempt_allowed) return false;

    const now = new Date();
    const nextAttemptTime = new Date(attempt.next_attempt_allowed);
    return now < nextAttemptTime;
  };

  const getCooldownRemaining = (characterId: string): number => {
    const attempt = attempts[characterId];
    if (!attempt?.next_attempt_allowed) return 0;

    const now = new Date().getTime();
    const nextAttemptTime = new Date(attempt.next_attempt_allowed).getTime();
    return Math.max(nextAttemptTime - now, 0);
  };

  const handleGuess = async (characterId: string) => {
    if (!publicKey || !connected) return;
    if (isCoolingDown(characterId)) return;

    setIsLoading(true);
    setSubmittingId(characterId);

    try {
      const userGuess = guesses[characterId]?.trim().toLowerCase() || "";
      const poolInfo = poolInfos[characterId];

      if (!poolInfo) {
        throw new Error("Pool not initialized for this character.");
      }

      // Smart contract interaction
      const signatures = await handlePoolGuess(characterId, userGuess);
      if (signatures.length === 0) {
        throw new Error("Smart contract operation failed");
      }

      signatures.forEach((sig) => {
        if (onTransaction) onTransaction(sig);
      });

      // Verify answer
      const { data: secretData } = await supabase
        .from("character_secrets")
        .select("secret")
        .eq("character_id", characterId)
        .single();

      if (!secretData) throw new Error("Secret not found");

      const isCorrect = userGuess === secretData.secret.trim().toLowerCase();

      // Calculate next attempt time
      const now = new Date();
      const nextAttemptTime = new Date(now.getTime() + dynamicCooldownMs);

      if (isCorrect) {
        // If correct - update global character status to mark as solved
        const poolBalanceAfter = await connection.getTokenAccountBalance(
          new PublicKey(poolInfo.pool_token_account)
        );
        const tokensWon = poolBalanceAfter.value.uiAmount || 0;

        // Update global character status - this affects all users
        const { error: statusError } = await supabase
          .from("character_status")
          .upsert({
            character_id: characterId,
            is_solved: true,
            solved_by: publicKey.toString(),
            solved_at: now.toISOString(),
            tokens_won: tokensWon,
          })
          .select();

        if (statusError) throw statusError;

        // Update character statuses immediately
        setCharacterStatuses((prev) => ({
          ...prev,
          [characterId]: {
            character_id: characterId,
            is_solved: true,
            solved_by: publicKey.toString(),
            solved_at: now.toISOString(),
            tokens_won: tokensWon,
          },
        }));
      } else {
        // If incorrect - update user's attempts and cooldown
        const currentAttempts = attempts[characterId]?.attempts || 0;
        const { error: attemptError } = await supabase
          .from("challenge_attempts")
          .upsert({
            character_id: characterId,
            wallet_address: publicKey.toString(),
            last_attempt: now.toISOString(),
            next_attempt_allowed: nextAttemptTime.toISOString(),
            attempts: currentAttempts + 1,
          })
          .select();

        if (attemptError) throw attemptError;

        // Update attempts state immediately
        setAttempts((prev) => ({
          ...prev,
          [characterId]: {
            character_id: characterId,
            wallet_address: publicKey.toString(),
            last_attempt: now.toISOString(),
            next_attempt_allowed: nextAttemptTime.toISOString(),
            attempts: currentAttempts + 1,
          },
        }));
      }

      // Clear input if incorrect
      setGuesses((prev) => ({
        ...prev,
        [characterId]: isCorrect ? prev[characterId] : "",
      }));

      // Refresh all data to ensure consistency
      await Promise.all([fetchCharacterStatuses(), fetchUserAttempts()]);
    } catch (err) {
      console.error("Error submitting guess:", err);
      throw new Error("Failed to submit guess");
    } finally {
      setIsLoading(false);
      setSubmittingId(null);
    }
  };

  const handlePoolGuess = async (
    characterId: string,
    userGuess: string
  ): Promise<string[]> => {
    if (!connected || !publicKey) return [];

    const poolInfo = poolInfos[characterId];
    if (!poolInfo) return [];

    try {
      const provider = getProvider();
      const program = new Program<McgaPool>(IDL as McgaPool, provider);

      const userTokenAccount = await getAssociatedTokenAddress(
        MCGA_MINT,
        publicKey
      );

      const [poolPda] = PublicKey.findProgramAddressSync(
        [Buffer.from(poolInfo.seed)],
        program.programId
      );

      // Deposit
      const depositAmount = new BN(Price.challengePrice * 1e9);
      const depositSignature = await program.methods
        .deposit(depositAmount)
        .accounts({
          pool: poolPda,
          poolTokenAccount: new PublicKey(poolInfo.pool_token_account),
          userTokenAccount,
          user: publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();

      // Check hash
      const checkHashSignature = await program.methods
        .checkHash(userGuess)
        .accounts({
          pool: poolPda,
          poolTokenAccount: new PublicKey(poolInfo.pool_token_account),
          userTokenAccount,
          user: publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();

      return [depositSignature, checkHashSignature];
    } catch (err) {
      console.error("Smart contract error:", err);
      return [];
    }
  };

  const fetchPoolInfo = async () => {
    try {
      const { data, error } = await supabase.from("pool_info").select("*");
      if (error) throw error;

      const infoMap: Record<string, PoolInfo> = {};
      data?.forEach((pool) => {
        infoMap[pool.character_id] = pool;
      });
      setPoolInfos(infoMap);
    } catch (err) {
      console.error("Error fetching pool info:", err);
    }
  };

  const handleCopy = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedStates((prev) => ({ ...prev, [address]: true }));
      setTimeout(() => {
        setCopiedStates((prev) => ({ ...prev, [address]: false }));
      }, 2000);
    } catch (err) {
      console.error("Failed to copy address:", err);
    }
  };

  return {
    guesses,
    setGuesses,
    attempts,
    characterStatuses,
    isLoading,
    submittingId,
    poolInfos,
    copiedStates,
    handleGuess,
    handleCopy,
    getCooldownRemaining,
    isCoolingDown,
  };
}
