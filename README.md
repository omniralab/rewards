# Omnira Rewards

**AI × Workforce × Solana.** Omnira rewards the behavior companies actually care
about: showing up, being on time and stepping in when the operation needs you.

Live demo: **[rewards.omniralab.com](https://rewards.omniralab.com)**

Omnira is an AI workforce platform for operations with large shift-based teams
(logistics hubs, warehouses, manufacturing). Omnira Rewards is its incentive
layer, built from two parts:

- **OM Loyalty Points** - in-app points for reliability (on-time check-ins,
  streaks, accepted shifts). They unlock levels (Bronze, Silver, Gold, Platinum)
  and a rewards catalogue. OM is **not a token**: no speculation, no tokenomics.
- **USDC Rewards on Solana** - real money for the moments that matter, such as
  a *Shift Bonus* or an *Emergency Bounty* when a line is short-staffed. The
  company funds a budget, the AI agent proposes a bounty within rules set by a
  human, the reward is held in escrow and settles to the worker's wallet once
  the shift is verified (check-in and check-out).

> **Status: hackathon prototype.** The web app in `src/` is a clickable
> front-end prototype built for the Colosseum hackathon: its people, wallets
> and transaction signatures are illustrative. The **escrow program in
> [`onchain/`](onchain) is real and live on Solana devnet** - see
> [On-chain escrow](#on-chain-escrow-live-on-devnet). See [Roadmap](#roadmap)
> for the path to production.

## What to look at

| Route | What it shows |
|---|---|
| [`/`](https://rewards.omniralab.com) | Landing page with an interactive phone in the hero (a bounty arrives after ~2 s) |
| [`/app`](https://rewards.omniralab.com/app) | Company console and worker phone side by side, sharing one live state |
| [`/phone`](https://rewards.omniralab.com/phone) | Worker app on its own, full screen on mobile |
| [`/app?live=1`](https://rewards.omniralab.com/app?live=1) | **Live mode:** the hero worker's budget, escrow lock and payout run as real transactions of the escrow program on Solana devnet; ledger rows marked *devnet* open in Solana Explorer |

### The golden path (`/app`)

1. The AI agent detects a staffing gap on *Line 3 · Outbound* (8 forklift
   operators missing, parcels and the estimated cost of the gap at risk).
2. The manager launches an **Emergency Bounty** with the bounty builder
   (amount slider, per-person cap, total budget rules).
3. Matched workers get a push notification. Oksana accepts from her phone.
4. She checks in on site, works the shift and checks out.
5. Escrow settles: **+20 USDC** on Solana and **+430 OM** loyalty points.

Keyboard shortcuts on `/app` and on `/phone` (desktop):

| Key | Action |
|---|---|
| `Space` / `→` | Next step |
| `1`-`6` | Jump to phase: gap, bounty, accepted, on site, settling, settled |
| `R` | Reset |
| `L` | Toggle Live mode (real devnet transactions) |
| `H` | Hide the company console (phone only) |
| `?` | Show shortcuts |

## Running locally

Requires Node.js 22+.

```bash
npm ci
npm run dev          # http://localhost:3007
```

Checks and production build:

```bash
npm run lint && npx tsc --noEmit && npm run build
```

Docker (Next.js standalone output):

```bash
docker build -t omnira-rewards .
docker run -p 3000:3000 omnira-rewards   # http://localhost:3000
```

## How it is built

- **Next.js 15** (App Router), **React 19**, **TypeScript**, **Tailwind CSS 4**,
  **Framer Motion**, **Zustand**.
- `src/lib/symulacja.ts` - a single Zustand store drives the whole demo. The
  company console and the worker phone read the same state, so an action on
  one side shows up on the other. Timers carry a "generation" so a reset
  cancels callbacks from the previous run.
- `src/lib/dane.ts` - the demo world: company, shift, worker, candidates,
  loyalty levels and the escrow ledger.
- `src/components/telefon/` - the worker app, rendered on a fixed 390×844
  screen and scaled to fit.
- `src/components/konsola/` - the company console: KPIs, AI agent alert with
  the bounty builder, live staffing and the escrow ledger.
- `src/components/landing/` - landing page sections.
- `src/app/api/health` - health check endpoint.

Code identifiers and comments are partly in Polish - the team is based in
Poland.

## On-chain escrow (live on devnet)

Program [`GPdXwqT253UXiN1j4k115NXrvLf2V7FP4TiaiE8kKeYc`](https://explorer.solana.com/address/GPdXwqT253UXiN1j4k115NXrvLf2V7FP4TiaiE8kKeYc?cluster=devnet)
(Anchor, Rust) holds a company's USDC budget for a shift and pays a bounty
only after the shift is verified. Omnira never owns the funds: the vault is
controlled by the program, Omnira's keys can only lock a bounty (agent) and
confirm or reject a shift (attestor).

| Instruction | Signed by | What it does |
|---|---|---|
| `create_budget` | company | opens a vault for one shift: per-worker cap, expiry, agent and attestor keys |
| `fund` | company | moves USDC into the vault |
| `accept_bounty` | worker + agent | locks the bounty; one bounty per worker per shift, within the cap and the unlocked balance |
| `release` | attestor | shift verified: the vault pays the worker (token account created if needed), also after expiry |
| `refund_bounty` | attestor, or anyone 3 days after expiry | shift not done: the lock returns to the company pool, so funds can never get stuck; the grace period stops anyone from front-running a late payout |
| `withdraw` | company | takes back unlocked funds only |

The golden path from the video ran on devnet with real transactions - links in
[`onchain/DEVNET.md`](onchain/DEVNET.md). The web app's Live mode
(`src/app/api/live`, `src/lib/live`) calls the same program from the server
with demo keys and a devnet test token; setup in `.env.example` and
`scripts/live-setup.mjs`.

```bash
cd onchain
./test.sh                      # 13 LiteSVM tests: golden path + abuse cases
./build.sh                     # SBPFv3 build (platform-tools v1.56)
cd programs/omnira-rewards && cargo run --example devnet   # golden path on devnet
```

Not audited - devnet only. Known gaps before mainnet: a USDC-only mint
allowlist (a company could otherwise fund a budget with its own mint that has
freeze or permanent-delegate powers and pull locked funds), closing settled
accounts to reclaim rent, upgrade authority on a multisig.

## Roadmap

What it takes to turn the prototype into a working product:

1. **Escrow program on Solana** - done on devnet (see above). Next: security
   review and audit before mainnet, upgrade authority on a multisig.
2. **Worker wallets without crypto friction** - embedded wallets created at
   onboarding, so workers never handle seed phrases, with an off-ramp to a
   local bank account.
3. **Verified attendance** - check-in and check-out signed by the Omnira
   backend (geofence, site QR, supervisor confirmation) as the trigger for
   settlement.
4. **Agent budget and permissions** - spending limits, per-person caps and
   approval rules enforced both in the platform and on-chain, with a full
   audit trail for the company.
5. **OM Loyalty Points service** - off-chain ledger for points, levels and the
   rewards catalogue, integrated with Omnira's workforce platform.
6. **Compliance** - payroll, tax and KYC requirements for paying workers in
   stablecoins in each market.

## License

Copyright 2026 Omnira Lab.

The source code is licensed under the [Apache License 2.0](LICENSE).
The license does not grant rights to the Omnira name or logo. Solana and USDC
names and logos belong to their respective owners.
