#!/usr/bin/env bash
# Build programu na łańcuch (SBPFv3, platform-tools v1.56) do target/deploy.
# Nie `anchor build`: Anchor 1.1.2 ma na sztywno platform-tools v1.52, które
# nie umieją v3, a Solana CLI 4.3 buduje v3 domyślnie (naprawione w 1.2.x).
set -euo pipefail
cd "$(dirname "$0")"
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"

# Klucz programu żyje poza repo; bez niego nie zaktualizujemy programu.
mkdir -p target/deploy
cp ~/.config/solana/omnira-rewards-program.json target/deploy/omnira_rewards-keypair.json

cd programs/omnira-rewards
cargo build-sbf --tools-version v1.56 --arch v3 --sbf-out-dir ../../target/deploy
