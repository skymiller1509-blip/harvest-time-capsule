/**
 * deploy-capsule.ts - deploy the TimeCapsule contract to the QoreChain EVM
 * Engine (Diana testnet, chain 9800) and exercise it: seal one sample
 * capsule that opens 5 minutes from now, then read it back.
 *
 * Mirrors the starter's scripts/deploy.ts, using @qorechain/evm:
 *   - createEvmClient({ endpoints })  → a viem-backed client (chain id auto-detected)
 *   - deployContract(walletClient, …) → deploy and get the tx hash
 *   - readContract / writeContract    → typed reads and writes
 *
 * Requirements (see CHECKLIST.md):
 *   - QORE_EVM_RPC_URL = https://evm-testnet.qore.host
 *   - QORE_EVM_PRIVATE_KEY for a funded TESTNET-ONLY account (0x-prefixed,
 *     32 bytes). Testnet only. Never reuse this key on mainnet, never commit it.
 *   - The account's ML-DSA-87 key registered AND an EVM window open, or the
 *     deploy will be refused. The evm-solidity starter does not open a window:
 *     do it first with the QoreX app, or with the `window` helper of the
 *     hardhat/foundry template (register, then open). Opening a window
 *     advances the account's nonce, so deploy AFTER it lands.
 *
 * The sample letter is sample text only, never a real secret. Only its
 * SHA-256 hash goes on chain; the text itself stays in this script output
 * and in the demo, so the capsule can be opened again from the frontend.
 */
import { createHash } from "node:crypto";
import {
  createEvmClient,
  deployContract,
  evmAccountFromPrivateKey,
  readContract,
  writeContract,
} from "@qorechain/evm";
import type { Address, Hex } from "viem";

import {
  timeCapsuleAbi,
  timeCapsuleBytecode,
} from "../contracts/TimeCapsule.artifact.js";

export const SAMPLE_TITLE = "Sample: hello future";
export const SAMPLE_LETTER =
  "Dear future me, this is a sample letter. It was sealed on the QoreChain testnet and it opens five minutes later. Nothing real is inside.";
export const SAMPLE_UNLOCK_SECONDS = 300;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function sha256Hex(text: string): Hex {
  return `0x${createHash("sha256").update(text, "utf8").digest("hex")}` as Hex;
}

async function main(): Promise<void> {
  const evmRpc = process.env.QORE_EVM_RPC_URL ?? "http://localhost:8545";
  const privateKey = requireEnv("QORE_EVM_PRIVATE_KEY") as Hex;

  const client = await createEvmClient({ endpoints: { evmRpc } });
  const account = evmAccountFromPrivateKey(privateKey);
  const wallet = client.getWalletClient(account);

  console.log(`network:  QoreChain EVM (chain id ${await client.getChainId()})`);
  console.log(`deployer: ${account.address}`);

  console.log("\nDeploying TimeCapsule()…");
  const deployHash = await deployContract(wallet, {
    abi: timeCapsuleAbi,
    bytecode: timeCapsuleBytecode,
    args: [],
  });
  const receipt = await client.publicClient.waitForTransactionReceipt({
    hash: deployHash,
  });
  const contract = receipt.contractAddress;
  if (!contract) {
    throw new Error("Deployment receipt did not include a contract address.");
  }
  console.log(`deployed: ${contract}`);

  const unlockTime = BigInt(
    Math.floor(Date.now() / 1000) + SAMPLE_UNLOCK_SECONDS,
  );
  const letterHash = sha256Hex(SAMPLE_LETTER);
  console.log(`\nSealing sample capsule "${SAMPLE_TITLE}"…`);
  console.log(`letter hash: ${letterHash}`);
  console.log(`unlock time: ${unlockTime} (in ${SAMPLE_UNLOCK_SECONDS} seconds)`);

  const sealHash = await writeContract(wallet, {
    address: contract as Address,
    abi: timeCapsuleAbi,
    functionName: "sealCapsule",
    args: [letterHash, unlockTime, SAMPLE_TITLE],
    account: wallet.account ?? null,
    chain: wallet.chain,
  });
  const sealReceipt = await client.publicClient.waitForTransactionReceipt({
    hash: sealHash,
  });
  console.log(`seal tx: ${sealHash} (block ${sealReceipt.blockNumber})`);

  const total = await readContract(client.publicClient, {
    address: contract as Address,
    abi: timeCapsuleAbi,
    functionName: "totalCapsules",
  });
  console.log(`total capsules: ${total}`);

  // getCapsule returns a 5-value tuple; viem types the read as unknown,
  // so name the shape explicitly instead of guessing it.
  const capsule = (await readContract(client.publicClient, {
    address: contract as Address,
    abi: timeCapsuleAbi,
    functionName: "getCapsule",
    args: [0n],
  })) as unknown as readonly [Address, Hex, bigint, boolean, string];
  console.log("capsule 0:", {
    creator: capsule[0],
    letterHash: capsule[1],
    unlockTime: capsule[2].toString(),
    opened: capsule[3],
    title: capsule[4],
  });

  console.log("\nDone. Paste the contract address into frontend/index.html.");
  console.log(
    "Open the sample capsule from the frontend after the unlock time, using the sample letter text printed above.",
  );
}

main().catch((err: unknown) => {
  console.error("\nDeploy failed.");
  console.error(
    "Check QORE_EVM_RPC_URL is https://evm-testnet.qore.host, the key is funded on testnet, and the ML-DSA-87 key is registered with an EVM window open.",
  );
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
