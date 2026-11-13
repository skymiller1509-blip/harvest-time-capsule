/**
 * open-capsule.ts - open the sample capsule (id 0) on the live TimeCapsule
 * contract, from the deployer account, inside the open EVM window.
 * Testnet only. Uses the same @qorechain/evm client as deploy-capsule.ts.
 * NOTE: do NOT import from deploy-capsule.ts - that module runs the deploy
 * on import. The sample letter is inlined here (same text as the seal).
 */
import {
  createEvmClient,
  evmAccountFromPrivateKey,
  writeContract,
} from "@qorechain/evm";
import type { Address, Hex } from "viem";

import { timeCapsuleAbi } from "../contracts/TimeCapsule.artifact.js";

const CONTRACT = "0xad9261bf5e318c34e3d51435288a354c8f60d2eb" as Address;
const SAMPLE_LETTER =
  "Dear future me, this is a sample letter. It was sealed on the QoreChain testnet and it opens five minutes later. Nothing real is inside.";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

async function main(): Promise<void> {
  const evmRpc = process.env.QORE_EVM_RPC_URL ?? "https://evm-testnet.qore.host";
  const privateKey = requireEnv("QORE_EVM_PRIVATE_KEY") as Hex;
  const client = await createEvmClient({ endpoints: { evmRpc } });
  const account = evmAccountFromPrivateKey(privateKey);
  const wallet = client.getWalletClient(account);
  console.log(`opener: ${account.address}`);

  const hash = await writeContract(wallet, {
    address: CONTRACT,
    abi: timeCapsuleAbi,
    functionName: "openCapsule",
    args: [0n, SAMPLE_LETTER],
  });
  console.log("open tx:", hash);
  const receipt = await client.publicClient.waitForTransactionReceipt({ hash });
  console.log("open receipt status:", receipt.status, "block:", receipt.blockNumber);
  if (receipt.status !== "success") throw new Error("Open tx did not succeed.");
  console.log("OPEN TX CONFIRMED. Verify opened=true with: node scripts/loop-check.mjs");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
