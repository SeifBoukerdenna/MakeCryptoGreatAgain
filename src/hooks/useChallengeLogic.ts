// src/hooks/useChallengeLogic.ts
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useDynamicCooldown } from "./useDynamicCooldown";
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import { Program } from "@coral-xyz/anchor";
import { McgaPool } from "../smart-contract/idl_type";
import IDL from "../smart-contract/idl.json";
import { getProvider } from "../smart-contract/anchor";
import { Price } from "../constants/price";

interface Winner {
  address: string;
  amount: number;
}
export interface CharacterChallenge {
  character_id: string;
  wallet_address: string;
  success: boolean;
  last_attempt: string | null;
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

  // Our dynamic cooldown from MCGA tokens
  const { dynamicCooldownMs } = useDynamicCooldown();

  const MCGA_MINT = new PublicKey(
    "5g1hscK8kkX9ee1Snmm4HvBM4fH1b2u1tfee3GyTewAq"
  );

  // States
  const [guesses, setGuesses] = useState<Record<string, string>>({});
  const [cooldowns, setCooldowns] = useState<Record<string, Date>>({});
  const [results, setResults] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [totalAttempts, setTotalAttempts] = useState<number>(0);
  const [winners, setWinners] = useState<Record<string, Winner>>({});
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});
  const [poolInfos, setPoolInfos] = useState<Record<string, PoolInfo>>({});

  // 1. Timer to refresh cooldowns every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCooldowns((prev) => ({ ...prev }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 2. Clean up expired cooldowns and clear results for expired cooldowns
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      setCooldowns((prevCooldowns) => {
        const now = Date.now();
        const newCooldowns: Record<string, Date> = {};
        const expiredIds: string[] = [];

        Object.entries(prevCooldowns).forEach(([id, date]) => {
          // Instead of a static COOL_DOWN, use dynamicCooldownMs
          if (now - date.getTime() < dynamicCooldownMs) {
            newCooldowns[id] = date;
          } else {
            expiredIds.push(id);
          }
        });

        if (expiredIds.length > 0) {
          setResults((prevResults) => {
            const updatedResults = { ...prevResults };
            expiredIds.forEach((id) => {
              delete updatedResults[id];
            });
            return updatedResults;
          });
        }

        return newCooldowns;
      });
    }, 1000);

    return () => clearInterval(cleanupInterval);
  }, [dynamicCooldownMs]);

  // 3. If user changes, fetch cooldowns
  useEffect(() => {
    if (publicKey) {
      fetchUserCooldowns();
    } else {
      setCooldowns({});
    }
  }, [publicKey]);

  // 4. Re-fetch total attempts whenever a guess is submitted
  useEffect(() => {
    fetchTotalAttempts();
  }, [submittingId]);

  // 5. Realtime subscription + fetch winners
  useEffect(() => {
    fetchWinners();
    const subscription = supabase
      .channel("character_challenges")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "character_challenges" },
        (payload) => {
          console.log("INSERT payload:", payload);
          const newRecord = payload.new as CharacterChallenge & {
            tokens_won: number;
          };
          if (newRecord.success) {
            setWinners((prev) => ({
              ...prev,
              [newRecord.character_id]: {
                address: newRecord.wallet_address,
                amount: newRecord.tokens_won,
              },
            }));
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "character_challenges" },
        (payload) => {
          console.log("UPDATE payload:", payload);
          const updatedRecord = payload.new as CharacterChallenge & {
            tokens_won: number;
          };
          if (updatedRecord.success) {
            setWinners((prev) => ({
              ...prev,
              [updatedRecord.character_id]: {
                address: updatedRecord.wallet_address,
                amount: updatedRecord.tokens_won,
              },
            }));
          }
        }
      )
      .subscribe();

    const interval = setInterval(fetchWinners, 60000);

    return () => {
      subscription.unsubscribe();
      clearInterval(interval);
    };
  }, [dynamicCooldownMs]);

  // 6. Fetch pool information on mount
  useEffect(() => {
    fetchPoolInfo();
  }, []);

  // Log winners state updates
  useEffect(() => {
    console.log("Winners state updated:", winners);
  }, [winners]);

  async function fetchUserCooldowns() {
    if (!publicKey) return;
    const { data, error } = await supabase
      .from("character_challenges")
      .select("character_id, last_attempt")
      .eq("wallet_address", publicKey.toString());

    if (error) {
      console.error("Error fetching cooldowns:", error);
      return;
    }
    if (data) {
      const newCooldowns: Record<string, Date> = {};
      data.forEach((record: any) => {
        if (record.last_attempt) {
          const attemptDate = new Date(record.last_attempt);
          newCooldowns[record.character_id] = attemptDate;
        }
      });
      setCooldowns(newCooldowns);
    }
  }

  async function fetchTotalAttempts() {
    const { data, error } = await supabase
      .from("character_challenges")
      .select("attempts");

    if (error) {
      console.error("Error fetching total attempts:", error);
      return;
    }
    if (data && Array.isArray(data)) {
      const total = data.reduce(
        (acc: number, row: any) => acc + (row.attempts || 0),
        0
      );
      setTotalAttempts(total);
    }
  }

  async function fetchWinners() {
    try {
      const { data, error } = await supabase
        .from("character_challenges")
        .select("*")
        .eq("success", true)
        .order("last_attempt", { ascending: false });

      if (error) throw error;
      if (data) {
        const winnersMap: Record<string, Winner> = {};
        data.forEach((record: CharacterChallenge & { tokens_won: number }) => {
          const { character_id, wallet_address, tokens_won } = record;
          if (!winnersMap[character_id]) {
            winnersMap[character_id] = {
              address: wallet_address,
              amount: tokens_won,
            };
          }
        });
        setWinners(winnersMap);
      }
    } catch (error) {
      console.error("Error fetching winners:", error);
    }
  }

  async function handleGuess(characterId: string) {
    if (!publicKey || !connected) return;
    if (winners[characterId]) return;

    const lastAttempt = cooldowns[characterId];
    if (lastAttempt && Date.now() - lastAttempt.getTime() < dynamicCooldownMs) {
      return;
    }

    setIsLoading(true);
    setSubmittingId(characterId);

    try {
      const userGuess = guesses[characterId]?.trim().toLowerCase() || "";
      console.log(`User Guess for Character ${characterId}: "${userGuess}"`);

      const poolInfo = poolInfos[characterId];
      if (!poolInfo) {
        console.error(
          `No pool information found for character_id: ${characterId}`
        );
        alert("Pool not initialized for this character.");
        return;
      }

      // Try smart contract first and capture signatures
      const signatures = await handlePoolGuess(characterId, userGuess);
      if (signatures.length === 0) {
        throw new Error("Smart contract operation failed");
      }

      // Trigger the callback with each signature
      signatures.forEach((signature) => {
        if (onTransaction) {
          onTransaction(signature);
        }
      });

      // Fetch secret from Supabase
      const { data: secretData, error } = await supabase
        .from("character_secrets")
        .select("secret")
        .eq("character_id", characterId)
        .single();

      if (error) {
        console.error("Error fetching secret:", error);
        throw error;
      }
      if (!secretData) {
        console.error("No secret found for character_id:", characterId);
        throw new Error("Secret not found");
      }

      const correctAnswer = secretData.secret.trim().toLowerCase();
      console.log(
        `Correct Answer for Character ${characterId}: "${correctAnswer}"`
      );

      const isCorrect = userGuess === correctAnswer;
      console.log(`Is Correct: ${isCorrect}`);
      setResults((prev) => ({ ...prev, [characterId]: isCorrect }));

      // Fetch pool balance AFTER the attempt
      let tokensWon = 0;
      if (poolInfo) {
        const poolBalanceAfter = await connection.getTokenAccountBalance(
          new PublicKey(poolInfo.pool_token_account)
        );
        tokensWon = poolBalanceAfter.value.uiAmount || 0;
        console.log(`Tokens Won: ${tokensWon}`);
      }

      // Update database
      const upsertData = {
        wallet_address: publicKey.toString(),
        character_id: characterId,
        success: isCorrect,
        attempts: (await getAttempts(characterId)) + 1,
        last_attempt: new Date().toISOString(),
        tokens_won: isCorrect ? tokensWon : 0,
      };

      // Perform upsert with detailed logging
      const { data: upsertDataResponse, error: upsertError } = await supabase
        .from("character_challenges")
        .upsert(upsertData, { onConflict: "wallet_address,character_id" })
        .select();

      if (upsertError) {
        console.error("Upsert Error:", upsertError);
        alert(
          "An error occurred while submitting your guess. Please try again."
        );
        return;
      }

      console.log("Upsert Successful:", upsertDataResponse);

      // Update local states
      if (!isCorrect) {
        setCooldowns((prev) => ({
          ...prev,
          [characterId]: new Date(),
        }));
        setGuesses((prev) => ({
          ...prev,
          [characterId]: "",
        }));
      } else {
        setCooldowns((prev) => {
          const { [characterId]: _, ...rest } = prev;
          return rest;
        });
        setWinners((prev) => ({
          ...prev,
          [characterId]: {
            address: publicKey.toString(),
            amount: tokensWon,
          },
        }));
      }

      await fetchTotalAttempts();
    } catch (err) {
      console.error("Error submitting guess:", err);
      alert("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
      setSubmittingId(null);
    }
  }

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

  async function handlePoolGuess(
    characterId: string,
    userGuess: string
  ): Promise<string[]> {
    // Return an array of signatures
    if (!connected || !publicKey) return [];
    const poolInfo = poolInfos[characterId];
    if (!poolInfo) {
      console.error("No pool found for character");
      return [];
    }

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

      // Step 1: Deposit
      console.log("Depositing tokens...");
      const depositAmount = new BN(Price.challengePrice * 1e9);
      const depositSignature = await program.methods
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

      // Step 2: Check hash
      console.log("Checking hash...");
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

      return [depositSignature, checkHashSignature];
    } catch (err) {
      console.error("Smart contract error:", err);
      return [];
    }
  }

  function getCooldownRemaining(characterId: string) {
    const lastAttempt = cooldowns[characterId];
    if (!lastAttempt) return 0;
    const timePassed = Date.now() - lastAttempt.getTime();
    return Math.max(dynamicCooldownMs - timePassed, 0);
  }

  async function handleCopy(address: string) {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedStates((prev) => ({ ...prev, [address]: true }));
      setTimeout(() => {
        setCopiedStates((prev) => ({ ...prev, [address]: false }));
      }, 2000);
    } catch (err) {
      console.error("Failed to copy address:", err);
    }
  }

  async function getAttempts(characterId: string): Promise<number> {
    if (!publicKey) return 0;

    try {
      const { data } = await supabase
        .from("character_challenges")
        .select("attempts")
        .eq("wallet_address", publicKey.toString())
        .eq("character_id", characterId)
        .single();

      return data?.attempts || 0;
    } catch {
      return 0;
    }
  }

  // Return everything needed by the UI
  return {
    guesses,
    setGuesses,
    cooldowns,
    results,
    isLoading,
    submittingId,
    totalAttempts,
    winners,
    copiedStates,
    handleGuess,
    handleCopy,
    getCooldownRemaining,
    poolInfos, // Expose poolInfos to the component
  };
}
