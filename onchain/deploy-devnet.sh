#!/usr/bin/env bash
# Wdrożenie (i aktualizacja) programu escrow na devnet. Płaci portfel
# ~/.config/solana/omnira-devnet.json - potrzebuje ok. 4 SOL przy pierwszym
# wdrożeniu (konto programu + tymczasowy bufor, który wraca po wdrożeniu).
# Testowe SOL: faucet.solana.com (logowanie GitHubem), bo `solana airdrop`
# często odbija się od limitu.
set -euo pipefail
cd "$(dirname "$0")"
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"

./build.sh
solana program deploy target/deploy/omnira_rewards.so \
  --program-id ~/.config/solana/omnira-rewards-program.json \
  --keypair ~/.config/solana/omnira-devnet.json \
  --url devnet
echo "→ https://explorer.solana.com/address/$(solana-keygen pubkey ~/.config/solana/omnira-rewards-program.json)?cluster=devnet"
