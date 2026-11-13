/**
 * register-and-window.ts - register the deployer's ML-DSA-87 key and open an
 * EVM authorisation window on the QoreChain Diana testnet, using @qorechain/sdk.
 *
 * Flow (all documented in node_modules/@qorechain/sdk/README.md):
 *  1. Build the unified eth-native account from the deployer secp256k1 key in
 *     .env (unifiedAccountFromSeed), with a PQC key derived from a separate
 *     32-byte secret (QORE_PQC_SECRET in .env; generated once and saved).
 *  2. Check PQC status on-chain (pqcKeyStatus precompile). If not registered,
 *     broadcast MsgRegisterPQCKeyV2 signed CLASSICAL via EthNativeSigner
 *     (signMode "classical" - the bootstrap path), with proof of possession.
 *  3. Open an EVM window (MsgOpenEVMWindow) signed HYBRID via EthNativeSigner.
 *  4. Verify the window is live (fetchEvmWindow).
 *
 * Only the deployer account is touched. Testnet only. No secrets are printed.
 */
import { appendFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { StargateClient } from "@cosmjs/stargate";
import {
  buildRegisterPqcKeyMsg,
  calculateFee,
  EthNativeSigner,
  fetchEvmWindow,
  GasPrice,
  openEvmWindowMsg,
  recommendedGasPriceUqor,
  signProofOfPossession,
  unifiedAccountFromSeed,
} from "@qorechain/sdk";
import { createEvmClient, pqcKeyStatus } from "@qorechain/evm";
import type { Hex } from "viem";

const REST = "https://api-testnet.qore.host";
const RPC = "https://rpc-testnet.qore.host";
const EVM_RPC = "https://evm-testnet.qore.host";
const CHAIN_ID = "qorechain-diana";
const EXPECTED_EVM = "0xd5327a02c83c737db5633728da6ae7ec623f610a";

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required environment variable: ${name}`);
  return v;
}
function hexToBytes(hex: string): Uint8Array {
  const h = hex.startsWith("0x") ? hex.slice(2) : hex;
  return Uint8Array.from(Buffer.from(h, "hex"));
}
function bytesToHex(b: Uint8Array): string {
  return "0x" + Buffer.from(b).toString("hex");
}

async function getAccountSeq(
  address: string,
): Promise<{ accountNumber: bigint; sequence: bigint }> {
  const res = await fetch(`${REST}/cosmos/auth/v1beta1/accounts/${address}`);
  if (!res.ok) throw new Error(`auth query failed: ${res.status}`);
  const body = (await res.json()) as {
    account: { account_number: string; sequence: string };
  };
  return {
    accountNumber: BigInt(body.account.account_number),
    sequence: BigInt(body.account.sequence),
  };
}

async function main(): Promise<void> {
  const privateKey = requireEnv("QORE_EVM_PRIVATE_KEY") as Hex;
  const seed32 = hexToBytes(privateKey);
  if (seed32.length !== 32) {
    throw new Error("QORE_EVM_PRIVATE_KEY must be 32 bytes");
  }

  // PQC secret: separate 32-byte entropy, kept in .env for recovery.
  let pqcSecretHex = process.env.QORE_PQC_SECRET;
  if (!pqcSecretHex) {
    pqcSecretHex = Buffer.from(randomBytes(32)).toString("hex");
    appendFileSync(
      ".env",
      `\n# Separate 32-byte secret for the deployer's ML-DSA-87 key (recovery).\nQORE_PQC_SECRET=${pqcSecretHex}\n`,
    );
    console.log("Generated a fresh PQC secret and saved it to .env (QORE_PQC_SECRET).");
  }
  const pqcSecret = hexToBytes(pqcSecretHex);

  const account = unifiedAccountFromSeed(seed32, { pqcSecret });
  const cosmos = account.cosmos;
  const evm = account.evm;
  if (evm.toLowerCase() !== EXPECTED_EVM) {
    throw new Error(`Derived EVM address ${evm} does not match the deployer. Stopping.`);
  }
  console.log(`deployer cosmos: ${cosmos}`);
  console.log(`deployer evm:    ${evm}`);
  console.log(
    `pqc pubkey:      ${bytesToHex(account.pqc.publicKey).slice(0, 18)}... (${account.pqc.publicKey.length} bytes)`,
  );

  const evmClient = await createEvmClient({ endpoints: { evmRpc: EVM_RPC } });
  const chainId = await evmClient.getChainId();
  console.log(`network: QoreChain EVM (chain id ${chainId})`);

  // 1. Status check
  const status = await pqcKeyStatus(evmClient.publicClient, evm as `0x${string}`);
  console.log(`pqc registered: ${status.registered} (algorithm ${status.algorithmId})`);
  if (status.registered) {
    const mine = bytesToHex(account.pqc.publicKey).toLowerCase();
    const onchain = status.pubkey.toLowerCase();
    console.log(`registered key matches mine: ${mine === onchain}`);
    if (mine !== onchain) {
      throw new Error("A DIFFERENT PQC key is already registered for this account. Stopping.");
    }
  }

  const gasPriceStr = await recommendedGasPriceUqor({ rest: REST });
  const gasPrice = GasPrice.fromString(`${gasPriceStr}uqor`);
  console.log(`gas price: ${gasPriceStr} uqor/gas`);

  const transport = await StargateClient.connect(RPC);

  // 2. Register if needed (classical bootstrap signature).
  if (!status.registered) {
    const pop = signProofOfPossession({
      chainId: CHAIN_ID,
      account: cosmos,
      keypair: account.pqc,
    });
    const ecdsaPubkey = hexToBytes(account.publicKey);
    const msg = buildRegisterPqcKeyMsg(cosmos, {
      pqcKeypair: account.pqc,
      ecdsaPubkey,
      proofOfPossession: pop,
    });
    const { accountNumber, sequence } = await getAccountSeq(cosmos);
    const fee = calculateFee(1_500_000, gasPrice);
    console.log(
      `\nRegistering ML-DSA-87 key (account ${accountNumber}, sequence ${sequence})...`,
    );
    const signer = new EthNativeSigner(account, { signMode: "classical", rest: REST });
    const res = await signer.signAndBroadcast(transport, {
      chainId: CHAIN_ID,
      accountNumber,
      sequence,
      messages: [msg],
      fee,
    });
    console.log(`register tx: ${res.transactionHash} (code ${res.code}, height ${res.height})`);
    if (res.code !== 0) {
      throw new Error(`Registration failed: ${res.rawLog ?? `code ${res.code}`}`);
    }
    const after = await pqcKeyStatus(evmClient.publicClient, evm as `0x${string}`);
    console.log(`pqc registered now: ${after.registered}`);
    if (!after.registered) {
      throw new Error("Registration broadcast but status still unregistered.");
    }
  }

  // 3. Open the window (hybrid-signed).
  const windowBefore = await fetchEvmWindow({ rest: REST, address: cosmos });
  console.log(`\nwindow before: found=${windowBefore.found} live=${windowBefore.live}`);
  if (!windowBefore.live) {
    const { accountNumber, sequence } = await getAccountSeq(cosmos);
    const maxValue = "5000000"; // uqor = 5 QOR, covers deploy + seal fees with headroom
    const msg = openEvmWindowMsg({ sender: cosmos, blocks: 5000, maxTxs: 10, maxValue });
    const fee = calculateFee(800_000, gasPrice);
    console.log(
      `Opening EVM window (account ${accountNumber}, sequence ${sequence}; blocks 5000, maxTxs 10, maxValue ${maxValue} uqor)...`,
    );
    const signer = new EthNativeSigner(account, { rest: REST }); // hybrid by default
    const res = await signer.signAndBroadcast(transport, {
      chainId: CHAIN_ID,
      accountNumber,
      sequence,
      messages: [msg],
      fee,
    });
    console.log(`window tx: ${res.transactionHash} (code ${res.code}, height ${res.height})`);
    if (res.code !== 0) {
      throw new Error(`Window open failed: ${res.rawLog ?? `code ${res.code}`}`);
    }
  }

  // 4. Verify live
  const w = await fetchEvmWindow({ rest: REST, address: cosmos });
  console.log(
    `\nwindow live: ${w.live} (found=${w.found}, remainingTxs=${w.remainingTxs}, remainingValue=${w.remainingValue} uqor, remainingBlocks=${w.remainingBlocks})`,
  );
  if (!w.live) throw new Error("Window is not live after opening.");
  console.log("\nDone. Deploy with: npm run deploy:capsule");
}

main().catch((err: unknown) => {
  console.error("\nFailed.");
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
