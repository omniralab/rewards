# Omnira Rewards escrow on Solana devnet

Program: [`GPdXwqT253UXiN1j4k115NXrvLf2V7FP4TiaiE8kKeYc`](https://explorer.solana.com/address/GPdXwqT253UXiN1j4k115NXrvLf2V7FP4TiaiE8kKeYc?cluster=devnet)
(deployed 12.10.2026, SBPFv3; upgraded 13.10.2026 with a 3-day grace period
before anyone but the attestor can refund a lock, 263 KB).

Golden path run from `cargo run --example devnet` (test token tUSDC, 6 decimals like USDC):

| Step | Transaction |
|---|---|
| Test token and 500 tUSDC for the company | [4KrfXN…g9Xa](https://explorer.solana.com/tx/4KrfXNMpeEuUYXWA3wxQPEjR7w8axEoJY2oyxVyY49q9va9kKZsEmXPFWBPTfyf3FH1XgqUcM42NJ89AQyfTg9Xa?cluster=devnet) |
| Company opens a shift budget (cap 50 per worker, 1 h) | [5GnXsG…9Wc](https://explorer.solana.com/tx/5GnXsGWthjw98CU9wEXvt3L83vxx9npoGt7Ty1piWNeJ71afyCGbQE42tSuu2VcPn784wobHiudVqTNfDECYu9Wc?cluster=devnet) |
| Company funds the vault with 500 tUSDC | [4JuJBL…o4iC](https://explorer.solana.com/tx/4JuJBLSgLMPbXF7NpMrDndghj6ww4VxA4yfVTjSWoiEsnE8LoSsC678GbBdpHuAA7vPAugx4zqA9Upuq3FT6o4iC?cluster=devnet) |
| Worker accepts a 20 tUSDC bounty, co-signed by the agent (locked) | [3bTaJ4…QNQJ](https://explorer.solana.com/tx/3bTaJ4tEy2CeKGUFe7eeqqaAnybTUE7k5EcLYzHmPeXngJj6MqkPBZVjvoxhfqTTTA9QkabMvpYhWSmD2bH4QNQJ?cluster=devnet) |
| Attestor confirms the shift, escrow pays the worker | [2ALyie…dQ](https://explorer.solana.com/tx/2ALyief8hnXgAp5jy7UdKzZhbxGKLaNYSya971LE3pQdrxuoLU78yetfqpVDxmfwatgoC8NCLVTHymu8AMNZE9dQ?cluster=devnet) |

Result read back from the chain: worker wallet 20 tUSDC, budget locked 0 /
released 20 tUSDC. Budget account:
[AhwkxyDg…cPp8](https://explorer.solana.com/address/AhwkxyDg81pmdEG8XjBTHqDdYU9zuJb1CvGxNrWMcPp8?cluster=devnet).
