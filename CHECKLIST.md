# Build checklist, Harvest-Proof Time Capsule (Quantum Pass)

Do these in order. Nothing here deploys until step 5, and nothing costs real money at any step. Testnet only.

## 0. What you need first (Eddie, on your phone)

- [ ] QoreX wallet installed (Android app from the Play Store, or the browser extension). Switch it to **Testnet** (app: Settings, then Use testnet).
- [ ] Free test QOR from the faucet: https://dashboard.qorechain.io/faucet, sign in, 100 QOR once every 24 hours.
- [ ] GitHub account: skymiller1509-blip (already have it). X account: @EmeraldPop15035 (already have it).
- [ ] Register for the fest at https://build.qorechain.io/register, sign in with GitHub, choose level **Quantum Pass**, confirm 18+, connect X, connect QoreX on Testnet. Registration is free. **Only Eddie can do this** (his GitHub, his X, his wallet).

## 1. Install (VM)

```sh
cd ~/workspace/hackathons/qorechain/harvest-time-capsule
npm install
```

Node 20+ required (VM has Node 24).

## 2. Configure `.env` (VM, testnet only)

```sh
cp .env.example .env
```

Then edit `.env`:

```
QORE_EVM_RPC_URL=https://evm-testnet.qore.host
QORE_EVM_PRIVATE_KEY=0x<testnet-only deployer key, funded from the faucet>
```

- The scaffolder left `QORE_EVM_RPC_URL` on localhost, set it to the testnet URL above.
- The key in `.env` right now is `0x000...0`, a placeholder. Replace it with a **fresh throwaway testnet-only key**. Never reuse a mainnet key, never commit `.env` (it is gitignored).

## 3. Register the post-quantum key and open an EVM window (do FIRST, before deploy)

The chain only admits an EVM transaction inside a window that the account's ML-DSA-87 key opened. The `evm-solidity` starter does **not** open one. Two ways:

- **Easy way (Eddie's phone):** in the QoreX app, the wallet registers the post-quantum key and opens the window when you connect it to the dApp. Do the first seal from the phone and the window is open.
- **Script way (VM):** use the `window` helper from the `hardhat` or `foundry` template of `create-qorechain-dapp` (`register`, then `open`), or the SDK's `openEvmWindowMsg`. Opening a window advances the account's nonce, so deploy **after** it lands.

Verify first: check the account on https://explore.qore.network (switch to Testnet) and confirm the ML-DSA-87 key shows as registered.

## 4. Typecheck (VM)

```sh
npm run typecheck
```

## 5. Deploy the contract and seal the sample capsule (VM, testnet only)

```sh
npm run deploy:capsule
```

This deploys `TimeCapsule`, seals one sample capsule that opens in 5 minutes, and reads it back. Save the contract address, the deploy tx hash, and the seal tx hash.

## 6. Point the frontend at it (VM)

Paste the deployed contract address into `frontend/index.html` (the `CONTRACT` constant at the top of the script). Then serve it locally and open it:

```sh
python3 -m http.server 8000 --directory frontend
```

Open http://localhost:8000, connect QoreX, and run the full loop with the sample letter: seal it, tap "Test the lock" before the date to see the contract refuse, wait 5 minutes, open it. Confirm the letter is revealed and the capsule shows as opened.

## 7. Prove the hybrid part (VM and phone)

- [ ] The ML-DSA-87 key-registration transaction hash is recorded (from QoreX or the explorer).
- [ ] The seal transaction hash is recorded, with its `Sealed` event visible on the explorer.
- [ ] The open transaction hash is recorded, with its `Opened` event visible on the explorer.
- [ ] Write all three hashes into the README or project page.

## 8. Publish the repo (Eddie and Mabel)

- [ ] Eddie creates a **public** GitHub repo (name: `harvest-time-capsule`) and adds it to the `mabel` fine-grained token, as for the other hackathon repos.
- [ ] Push this project (MIT licence, README, no `.env`, no keys).
- [ ] Install the QoreChain Build GitHub App on the repo from My space, so commits show in the fest feed.

## 9. Create the project on the fest site (Eddie)

- [ ] https://build.qorechain.io, create the project, category **Quantum Pass**, country **Nigeria** (Middle East and Africa region).
- [ ] Cover image 16:9, at least 1200x675, JPG/PNG/WebP, up to 5 MB.
- [ ] Video up to 3 minutes showing the seal and the open working (record the phone and the explorer). Keep it to the one flow: write, seal, countdown, open.
- [ ] At least one testnet address the project uses (the deployer or QoreX address).
- [ ] Tick only the kits really in the code (`@qorechain/evm`, `create-qorechain-dapp`).

## 10. Optional extra prizes (same project, no extra build)

- [ ] People's Choice: share the capsule demo on X with #BuildBeforeQDay. The vote runs 6-15 Dec on mainnet with QoreX, and team members cannot vote for their own project.
- [ ] Q-Day Drill (18 Nov, register the drill account by 17 Nov 23:59 UTC): only if the seal flow is already working. A fresh testnet account, never held mainnet funds, ML-DSA-87 key registered, its classical private key handed to the drill bot. **Decide at the time; the key is published after the drill.**
- [ ] Best AI-Native Build ($500): `AI_USAGE.md` is already in this repo, keep it honest and up to date.

## Deadline

Everything must be in place by **2 December 23:59 UTC**. There is no submit button. At the deadline the project becomes read-only and that version is checked (3-5 Dec), judged 6-15 Dec, winners announced 16 Dec.
