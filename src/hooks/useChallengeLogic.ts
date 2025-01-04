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
import { MCGA_TOKEN_MINT } from "../constants/tokens";

export interface CharacterStatus {
  character_id: string;
  is_solved: boolean;
  solved_by: string | null;
  solved_at: string | null;
  tokens_won: number;
  secret_phrase: string;
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

  const fetchCharacterStatuses = async () => {
    try {
      console.log("Fetching character statuses...");
      const { data, error } = await supabase
        .from("character_status")
        .select("*");

      if (error) {
        console.error("Error fetching from Supabase:", error);
        throw error;
      }

      console.log("Raw data from Supabase:", data);

      const statusMap: Record<string, CharacterStatus> = {};
      data?.forEach((status) => {
        console.log(`Processing status record:`, status);

        // Handle potential null/undefined values
        let tokensWon = 0;

        if (status.tokens_won !== null && status.tokens_won !== undefined) {
          // Convert string or number to number, handling potential floating point values
          tokensWon =
            typeof status.tokens_won === "string"
              ? parseFloat(status.tokens_won)
              : Number(status.tokens_won);

          // Ensure we have a valid number
          if (isNaN(tokensWon)) {
            console.warn(
              `Invalid tokens_won value for character ${status.character_id}:`,
              status.tokens_won
            );
            tokensWon = 0;
          }
        }

        console.log(`Processed character ${status.character_id}:`, {
          original: status.tokens_won,
          converted: tokensWon,
          type: typeof tokensWon,
          fullRecord: status,
        });

        statusMap[status.character_id] = {
          ...status,
          tokens_won: tokensWon,
          is_solved: Boolean(status.is_solved),
        };
      });

      console.log("Final processed status map:", statusMap);
      setCharacterStatuses(statusMap);
    } catch (err) {
      console.error("Error in fetchCharacterStatuses:", err);
    }
  };

  useEffect(() => {
    const characterStatusSub = supabase
      .channel("character-status-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "character_status" },
        () => {
          console.log("Character status change detected, fetching updates...");
          fetchCharacterStatuses();
        }
      )
      .subscribe();

    // Initial fetch
    fetchCharacterStatuses();
    fetchPoolInfo();

    return () => {
      characterStatusSub.unsubscribe();
    };
  }, []); // Empty dependency array since we want this to run once on mount

  useEffect(() => {
    if (publicKey) {
      fetchUserAttempts();
    } else {
      setAttempts({});
    }
  }, [publicKey]);

  const calculateTokensWon = (
    before: number | null | undefined,
    after: number | null | undefined
  ): number => {
    console.log("Calculating tokens won:", { before, after });

    const beforeAmount = before || 0;
    const afterAmount = after || 0;
    const difference = beforeAmount - afterAmount;

    // Round to 9 decimal places to handle SPL token decimals
    const tokens = Math.round(difference * 1e9) / 1e9;

    console.log("Tokens calculation:", {
      beforeAmount,
      afterAmount,
      difference,
      finalTokens: tokens,
    });

    return tokens;
  };

  const handlePoolGuess = async (
    characterId: string,
    userGuess: string
  ): Promise<{
    txResults: string[];
    isCorrect: boolean;
    depositSucceeded: boolean;
  }> => {
    if (!connected || !publicKey) {
      return { txResults: [], isCorrect: false, depositSucceeded: false };
    }

    const poolInfo = poolInfos[characterId];
    if (!poolInfo) {
      return { txResults: [], isCorrect: false, depositSucceeded: false };
    }

    try {
      const provider = getProvider();
      const program = new Program<McgaPool>(IDL as McgaPool, provider);

      const userTokenAccount = await getAssociatedTokenAddress(
        MCGA_TOKEN_MINT,
        publicKey
      );
      const [poolPda] = PublicKey.findProgramAddressSync(
        [Buffer.from(poolInfo.seed)],
        program.programId
      );

      // First transaction: DEPOSIT
      let depositSucceeded = false;
      let depositSignature = "";
      try {
        const depositAmount = new BN(Price.challengePrice * 1e9);
        depositSignature = await program.methods
          .deposit(depositAmount)
          .accounts({
            // @ts-ignore
            pool: poolPda,
            poolTokenAccount: new PublicKey(poolInfo.pool_token_account),
            userTokenAccount,
            user: publicKey,
            tokenProgram: TOKEN_PROGRAM_ID,
          })
          .rpc();

        // Wait for confirmation of deposit
        await connection.confirmTransaction(depositSignature);
        depositSucceeded = true;
      } catch (depositError) {
        console.log(
          "Deposit transaction failed or was rejected:",
          depositError
        );
        return {
          txResults: [],
          isCorrect: false,
          depositSucceeded: false,
        };
      }

      // Only proceed with check_hash if deposit succeeded
      if (depositSucceeded) {
        try {
          // Second transaction: CHECK HASH
          const checkHashSignature = await program.methods
            .checkHash(userGuess)
            .accounts({
              // @ts-ignore
              pool: poolPda,
              poolTokenAccount: new PublicKey(poolInfo.pool_token_account),
              userTokenAccount,
              user: publicKey,
              tokenProgram: TOKEN_PROGRAM_ID,
            })
            .rpc();

          // If we got here, both transactions succeeded
          return {
            txResults: [depositSignature, checkHashSignature],
            isCorrect: true, // The check_hash instruction only completes if hash matches
            depositSucceeded: true,
          };
        } catch (checkHashError: any) {
          // If we get here, deposit succeeded but hash check failed
          // This could be due to wrong hash or user rejection

          return {
            txResults: [depositSignature],
            isCorrect: false,
            depositSucceeded: true,
          };
        }
      }

      return {
        txResults: [],
        isCorrect: false,
        depositSucceeded: false,
      };
    } catch (error) {
      console.error("Smart contract error:", error);
      return {
        txResults: [],
        isCorrect: false,
        depositSucceeded: false,
      };
    }
  };

  const handleGuess = async (characterId: string) => {
    if (!publicKey || !connected) return;

    try {
      if (isCoolingDown(characterId)) {
        throw new Error(
          "You must wait for the cooldown period to end before trying again"
        );
      }

      setIsLoading(true);
      setSubmittingId(characterId);

      const userGuess = guesses[characterId]?.trim().toLowerCase() || "";
      const poolInfo = poolInfos[characterId];

      if (!poolInfo) {
        throw new Error("Pool not initialized for this character.");
      }

      // Get initial pool balance
      const poolBalanceBefore = await connection.getTokenAccountBalance(
        new PublicKey(poolInfo.pool_token_account)
      );

      // Attempt the transactions
      const { txResults, isCorrect, depositSucceeded } = await handlePoolGuess(
        characterId,
        userGuess
      );

      // Notify of transactions
      txResults.forEach((sig) => {
        if (onTransaction) onTransaction(sig);
      });

      // Calculate tokens only if needed
      let tokensWon = 0;
      if (isCorrect) {
        const poolBalanceAfter = await connection.getTokenAccountBalance(
          new PublicKey(poolInfo.pool_token_account)
        );
        tokensWon = calculateTokensWon(
          poolBalanceBefore.value.uiAmount,
          poolBalanceAfter.value.uiAmount
        );
      }

      // Get the actual secret to verify
      const { data: secretData } = await supabase
        .from("character_secrets")
        .select("secret")
        .eq("character_id", characterId)
        .single();

      if (!secretData) throw new Error("Secret not found");

      const hashMatches = userGuess === secretData.secret.trim().toLowerCase();
      const now = new Date();

      // Handle different scenarios
      if (!depositSucceeded) {
        // If deposit failed/rejected, do nothing
        setGuesses((prev) => ({ ...prev, [characterId]: "" }));
      } else {
        // Deposit succeeded, handle based on hash check result
        if (!hashMatches) {
          // Wrong hash: apply cooldown regardless of second tx
          await applyCooldown(characterId);
          setGuesses((prev) => ({ ...prev, [characterId]: "" }));
        } else if (isCorrect) {
          // Correct hash and both transactions succeeded
          const status = {
            character_id: characterId,
            is_solved: true,
            solved_by: publicKey.toString(),
            solved_at: now.toISOString(),
            tokens_won: tokensWon,
            secret_phrase: userGuess,
          };

          // Update status in database
          const { error: statusError } = await supabase
            .from("character_status")
            .upsert(status)
            .select();

          if (statusError) throw statusError;

          // Update local state
          setCharacterStatuses((prev) => ({
            ...prev,
            [characterId]: {
              ...status,
              tokens_won: tokensWon,
            },
          }));
        }
      }

      await Promise.all([fetchCharacterStatuses(), fetchUserAttempts()]);
    } catch (error: any) {
      console.error("Error submitting guess:", error);
      setGuesses((prev) => ({
        ...prev,
        [characterId]: "",
      }));
      throw error;
    } finally {
      setIsLoading(false);
      setSubmittingId(null);
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

  const applyCooldown = async (characterId: string) => {
    if (!publicKey) return;

    const now = new Date();
    const nextAttemptTime = new Date(now.getTime() + dynamicCooldownMs);

    const { data: existingAttempt } = await supabase
      .from("challenge_attempts")
      .select("*")
      .eq("character_id", characterId)
      .eq("wallet_address", publicKey.toString())
      .single();

    if (existingAttempt) {
      await supabase
        .from("challenge_attempts")
        .update({
          last_attempt: now.toISOString(),
          next_attempt_allowed: nextAttemptTime.toISOString(),
          attempts: existingAttempt.attempts + 1,
        })
        .eq("character_id", characterId)
        .eq("wallet_address", publicKey.toString());
    } else {
      await supabase.from("challenge_attempts").insert({
        character_id: characterId,
        wallet_address: publicKey.toString(),
        last_attempt: now.toISOString(),
        next_attempt_allowed: nextAttemptTime.toISOString(),
        attempts: 1,
      });
    }

    setAttempts((prev) => ({
      ...prev,
      [characterId]: {
        character_id: characterId,
        wallet_address: publicKey.toString(),
        last_attempt: now.toISOString(),
        next_attempt_allowed: nextAttemptTime.toISOString(),
        attempts: (existingAttempt?.attempts || 0) + 1,
      },
    }));
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
