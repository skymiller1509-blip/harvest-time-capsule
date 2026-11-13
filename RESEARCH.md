# Harvest-Proof Time Capsule: requirements note

Short note. The full verified fest rules live in `../qday-coin-flip/RESEARCH.md`, read live from the official pages on 2026-11-12. Everything below matches that file. The fest warns on every page that rules, prizes and dates are not final and may change until the end of the event, so recheck the site before submitting.

## The fest

- Name: Build Before Q-Day, the QoreChain Developer Fest. Organiser: QoreChain Association.
- Building: 4 Nov to 2 Dec 2026. Submissions close **2 Dec 2026, 23:59 UTC**. Checks 3-5 Dec, judging 6-15 Dec, winners announced 16 Dec.
- Prize pool: $20,000 total. Prizes are paid in stablecoin.

## Quantum Pass (our category)

- Teams of 1-2. Solo is allowed.
- Build a small original QoreChain app, tool, game or bot.
- Exact requirements: use `create-qorechain-dapp`, connect QoreX, deploy on testnet, and complete one hybrid-signed transaction.
- Prizes: 10 x $150 for the ten best, plus 20 x $50 raffle among the Quantum Pass projects that pass the submission checks and do not win a $150 prize. Total $2,500.
- Also open to this project: People's Choice ($500/$300/$200, community vote with QoreX on mainnet, 6-15 Dec, team members cannot vote for their own project), Q-Day Survivor (5 x $200, drill on 18 Nov), Best AI-Native Build ($500, needs an `AI_USAGE.md` file), Regional Awards (5 x $200, one per region including Middle East and Africa, Nigeria is in that region), Top-Quality Awards (7 x $250, for projects scoring at least 70/100 that win no other prize).

## Submission

- Public GitHub repository, with an MIT or Apache-2.0 licence file GitHub can detect, and a README explaining what the project does and how to run it.
- One category (Quantum Pass).
- A featured/cover image: 16:9, at least 1200x675 pixels, JPG, PNG or WebP, up to 5 MB.
- A video of up to 3 minutes showing the project working. Required.
- At least one testnet address the project uses (`qor1...`).
- The kits and network features used, ticked on the project form, confirmed from the repo, so only tick what is really in the code.
- Install the QoreChain Build GitHub App on the repo from My space, so commits appear in the fest feed.
- There is no submit button. At the deadline the project becomes read-only, and that version is what is checked.

## Original work

- Projects are built during the event. Open source libraries, kits and templates may be used and must be credited in the README. Copied projects are disqualified.
- This entry: the TimeCapsule contract is fresh Solidity written for this fest. The idea is inspired by Time-Locked Gifts, a NEAR entry by the same builder, credited in the README. No NEAR code was reused. The starter template is `create-qorechain-dapp` 0.14.0, credited in the README.

## Network

- Diana testnet, EVM chain id 9800 (hex 0x2648), EVM JSON-RPC `https://evm-testnet.qore.host`, explorer `https://explore.qore.network` (switch to Testnet).
- Faucet: https://dashboard.qorechain.io/faucet, 100 QOR once every 24 hours.
- A hybrid-signed transaction carries a classical secp256k1 signature and an ML-DSA-87 post-quantum signature. The EVM lane only admits a transaction inside a window the account's post-quantum key opened: register the ML-DSA-87 key, then open the window. QoreX does both when you connect it.
