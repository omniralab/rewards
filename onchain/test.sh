#!/usr/bin/env bash
# Testy escrow na LiteSVM. LiteSVM 0.10 (szablon Anchora 1.1.2) nie wczytuje
# programów SBPFv3, więc testy dostają ten sam kod zbudowany w v0 do
# target/deploy-test. Na łańcuch idzie build v3 z ./build.sh.
set -euo pipefail
cd "$(dirname "$0")/programs/omnira-rewards"
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"

cargo build-sbf --tools-version v1.56 --arch v0 --sbf-out-dir ../../target/deploy-test
cargo test "$@"
