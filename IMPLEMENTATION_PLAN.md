# Rarity Roulette implementation plan

A student creates cards locally, rolls once and optionally mints that exact winner into MetaMask. The facilitator can run the class from the same repository as the students. One three-hour session covers the nine agenda topics.

| Sequence | Owner | Deliverable and acceptance check |
| --- | --- | --- |
| 1. Align the game and lab | Project lead | Define a card (name, description, photo, rarity), a collection (the student's local deck), a win (one draw) and a token (one minted winner). Agree on the six-step flow in the README. |
| 2. Implement the ERC-721 | Contract subagent | Constructor on chain 97 mints the first winner to the sender. Subsequent calls use `mint(winId, metadataJson)`. Store metadata per token, enforce the 8,192-byte limit and prevent reuse of a win ID by that sender on the same contract. |
| 3. Implement editor and wheel | Web subagent | Add/edit cards individually. Finish a 1–25 card deck using any tiers. Spin without a wallet, renormalize weights over present tiers, and display the winning name, description, photo and rarity. |
| 4. Integrate mint and import | Project lead with web subagent | Check MetaMask network and account, deploy-and-mint on first approval, reuse the correct account's contract for subsequent wins and show receipt, contract address, token ID and NFT import instructions. |
| 5. Write the course | Curriculum subagent | Cover all nine agenda topics. Teach deployment from the first mint, sender-scoped win IDs, weighted draws, metadata inspection and MetaMask import. |
| 6. Verify and fix | Project lead with owning subagent | Install from lockfile, run tests and build. Exercise a single-card deck and partial-tier deck, mint the exact winning metadata twice with distinct win IDs, reject a duplicate and test rejected wallet requests. Return failures to their owners and rerun the affected check and full suite. |
| 7. Run class and collect evidence | Facilitator and participants | Each pair records one winning card and a successful chain-97 mint receipt. Independently compare current owner, name, description, image URI and rarity. |

## Scope and verification

Card editing and drawing are off-chain. The NFT mint price is zero and participants pay test gas. Browser-supplied metadata is appropriate for learner-authored cards. Paid draws, marketplaces, mainnet and verifiable prize randomness are outside this lesson.

For automated contract checks, use the in-memory test chain configured as chain 97. Production build and test results establish software behavior. The public-chain checkpoint requires the participant's successful transaction on [BscScan Testnet](https://testnet.bscscan.com/). The facilitator rehearses the [six-step flow](README.md#play-in-six-steps) before class. A failed classroom step goes back to its accountable owner.
