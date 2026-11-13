# Harvest-Proof Time Capsule

**One line:** write a letter, pick a date, seal it on the QoreChain testnet. It only opens on or after that date, and sealing it is one hybrid-signed transaction.

Quantum Pass entry for the QoreChain Developer Fest (Build Before Q-Day), 4 Nov to 2 Dec 2026. Solo build. Testnet only, $0 real money.

## The one flow

1. Open this page. Connect QoreX (Diana testnet).
2. QoreX has your ML-DSA-87 post-quantum key registered, and an EVM window open. That is the hybrid part: every native QoreChain transaction carries a classical secp256k1 signature **and** an ML-DSA-87 signature, and the chain checks both.
3. Write your letter and pick an open date. Press **Seal it on chain**. Approve it in QoreX.
4. The TimeCapsule contract stores only the SHA-256 hash of your letter, never the letter itself, plus the unlock date. A countdown shows how long is left.
5. On or after the date, paste the same letter text and press **Open it**. The contract checks the hash and the date, then marks the capsule opened and reveals the letter.

That is the whole app. No money, no token, no prize. Sealing and opening cost testnet gas only.

## What the user sees

- A letter box, a date picker, a Seal button, and a countdown.
- A "Test the lock" button that checks, free and without a transaction, whether the capsule would open. Before the date it shows the contract refusing, which proves the lock works.
- After opening, the letter itself, with the transaction hash and a link to the explorer.

## Inspiration, and what is new here

The idea is inspired by Time-Locked Gifts, a NEAR Hackathon entry by the same builder (a gift that cannot be opened until a chosen date). This is **not** a copy of that project. The NEAR contract is written for NEAR, in a different language, on a different chain. The TimeCapsule contract here is fresh Solidity, written for QoreChain, and the whole flow is different: a sealed letter proved by a hash, opened by its creator, with the seal itself being a hybrid-signed transaction. Credit is given here and in the project write-up, and no NEAR code was reused.

## How it is made

- Starter: `create-qorechain-dapp`, `evm-solidity` template.
- Contract: `contracts/TimeCapsule.sol`. Two writes: `sealCapsule(letterHash, unlockTime, title)` and `openCapsule(id, letter)`. One read: `getCapsule(id)`. Opening checks three things: the caller is the creator, the date has passed, and the SHA-256 of the pasted letter matches the sealed hash.
- Deploy script: `scripts/deploy-capsule.ts` (viem via `@qorechain/evm`). It deploys the contract, seals one sample capsule that opens in 5 minutes, and reads it back.
- Frontend: `frontend/index.html`. No build step, no dependencies. Reads go straight to the public testnet RPC. Writes go through `window.ethereum` (QoreX extension), so the wallet signs, not the page. The letter hash is computed in the browser with SHA-256, and the call data is encoded by hand in the page, so there is no library to break.
- Testnet: QoreChain Diana, EVM chain id 9800, RPC `https://evm-testnet.qore.host`, explorer `https://explore.qore.network` (switch to Testnet).

## Honest limits

- The letter is hidden by its hash, not by encryption. The chain never sees the letter text until opening, but the date lock is enforced by the contract, not by cryptography. Do not seal a real secret. Sample text only.
- The quantum-safe part is the seal transaction: it is hybrid-signed, and the chain checks both signatures. The letter itself is not post-quantum encrypted. A future version could add ML-KEM encryption, but this entry does not claim it.
- Only the creator can open a capsule. If the creator loses the letter text, the capsule can never be opened, because the hash cannot be reversed.

## Run it (build time)

See [CHECKLIST.md](CHECKLIST.md) for the exact commands in order. Short version: install, put the testnet RPC and a **testnet-only** key in `.env`, register the ML-DSA-87 key and open an EVM window, then `npm run deploy:capsule`, then paste the contract address into `frontend/index.html` and open it.

## Compiling the contract

```sh
npx solc@0.8.24 --optimize --abi --bin -o out contracts/TimeCapsule.sol
```

Then copy the `.abi` JSON into `timeCapsuleAbi` and the `.bin` hex (prefixed with `0x`) into `timeCapsuleBytecode` in `contracts/TimeCapsule.artifact.ts`. The output files are named `contracts_TimeCapsule_sol_TimeCapsule.abi` and `.bin`.

## Submission (fest)

- Category: Quantum Pass (teams of 1-2). Solo.
- Needs: public GitHub repo, MIT licence, README (this file), a 16:9 cover image (at least 1200x675, JPG/PNG/WebP, up to 5 MB), a video of up to 3 minutes showing the project working, and at least one testnet address the project uses.
- There is no submit button: at 2 December 23:59 UTC the project becomes read-only, and that version is what is checked.
- Full verified rules: [RESEARCH.md](RESEARCH.md). The Q-Day Coin Flip scaffold this was built from is in `../qday-coin-flip/`.

## Licence

MIT. See [LICENSE](LICENSE).
