# Time Capsule — deploy status (Diana testnet, chain 9800)

Deployed 2026-11-13. All hashes verified on-chain via the EVM RPC.

## Accounts

- Deployer (fresh throwaway testnet-only key, lives ONLY in `.env`):
  - EVM: `0xD5327A02C83C737Db5633728DA6AE7EC623f610a`
  - Native: `qor165e85qkg83ehmdtrxu5d56h8a33r7cg288hmju`
  - Funded with 10 QOR from Eddie's QoreX; balance after deploy + seal: ~9.571 QOR
- Eddie's QoreX (for the frontend / project page):
  - Native: `qor1mpm376k9kuun0elwy05un0t6fqlfpj9s8k7nlm`
  - EVM: `0xd8771f6ac5b73937e7ee23e9c9bd7a483e90c8b0`

## Hybrid setup (native lane, both code 0)

- ML-DSA-87 key registration tx:
  `80698FEF9D7437E42F8E15D63068C144E15DA48029C8E09F62D7D803C004BDD9`
  (block 10021463; `MsgRegisterPQCKeyV2`, classical bootstrap signature, proof of possession included; PQC pubkey starts `0xd52511c0d27c5287...`, 2592 bytes)
- EVM window open tx:
  `99C8EE58239DF00C17750A0984046AE9F99BC8A019A65931B9B14F4A360F13CA`
  (block 10021467; `MsgOpenEVMWindow`, hybrid-signed; blocks 1000, maxTxs 10, maxValue 5,000,000 uqor)
- Window after deploy + seal: live, remainingTxs 8, remainingValue 4,809,795 uqor,
  remainingBlocks 982, expiry height 10022467.

## Contract

- TimeCapsule: `0xad9261bf5e318c34e3d51435288a354c8f60d2eb`
- Deploy tx: `0xfafc052d9a02f1ca84221314cae99cd20ee3235d4226fd80d5f5aa83c9c1bb61`
  (block 10021473, nonce 2, status success)

## Sample capsule (id 0)

- Seal tx: `0xf387206fcda315d854e1bc7f07494dbf3a661b49675f88983109564b6d36eb2a`
  (block 10021475, status success; `Sealed` event confirmed, topic
  `0xdc8f866dea49b05f5a3261721a0099f0ad2408cf2b3ba77ef12db907315c6351`)
- Title: "Sample: hello future"
- Letter hash: `0x64604b4a477242a3f70c0adbd97852d39fbb22ffbd2a1e5e5b70deb5d0ae2596`
- Unlock time: 1794585806 (5 minutes after sealing)
- Creator: deployer; opened: false; total capsules: 1
- Sample letter text (kept off-chain, needed to open it):
  "Dear future me, this is a sample letter. It was sealed on the QoreChain
  testnet and it opens five minutes later. Nothing real is inside."

## How it was done

- `scripts/register-and-window.ts` (new, local only): builds the unified
  eth-native account from the deployer key (`unifiedAccountFromSeed` with a
  separate random PQC secret saved in `.env` as `QORE_PQC_SECRET`), checks
  PQC status via the `pqcKeyStatus` precompile, registers the ML-DSA-87 key
  with `EthNativeSigner` in classical mode, then opens the window with
  `EthNativeSigner` in hybrid mode. Transport: cosmjs `StargateClient` on
  `https://rpc-testnet.qore.host`; REST `https://api-testnet.qore.host`.
- `npm run deploy:capsule` then deployed the contract and sealed the sample.
- Nothing was pushed to GitHub; the frontend was not edited.

## Still to do (parent)

- Frontend wired 2026-11-13 ~16:14 UTC: deployed address
  `0xad9261bf5e318c34e3d51435288a354c8f60d2eb` pasted into
  `frontend/index.html` (both the display line and the `CONTRACT` const).
  Sample capsule 0 unlocks 1794585806 (2026-11-13 16:03:26 UTC) — openable now.
- Repo: committed locally as `881c915` ("Harvest-Proof Time Capsule:
  deployed contract wired into frontend, loop-check script"). No remote set
  yet — push needs `git remote add origin
  https://github.com/skymiller1509-blip/harvest-time-capsule.git` plus the
  widened mabel token; `gh` is NOT logged in on this VM.
- Open test DONE 2026-11-13 ~16:26 UTC: loop-check.mjs passed (totalCapsules 1, capsule 0 correct, open simulation with the right letter succeeded, wrong letter reverted). First EVM window (1000 blocks) EXPIRED before the open tx (0 blocks left at ~16:24 UTC); new window opened 2026-11-13 ~16:27 UTC (tx 7BDFE3B7D8CAAE5E76CDB83560E978C5400A04F2A22A423754118037BC25B227, 5000 blocks, 10 txs, 5,000,000 uqor). OPEN TX SENT 2026-11-13 ~16:27 UTC: 0x7ca24f60d1ac116614f04af575f96bf058ee7b04c90aa08988e8192d3c62fd66, status success, block 10022668. Capsule 0 now reads opened=true; re-open correctly reverts "already opened". FULL LOOP PROVED: seal, lock, open.
- Demo video (up to 3 min), 16:9 cover, create the project on build.qorechain.io.
