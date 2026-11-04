# Workshop scope and acceptance

The [README](README.md) is the canonical student procedure. The reference repository is the completed Next.js gacha app; <code>workshop/create-starter.mjs</code> creates a separate student copy with six TODOs. The [participant guide](workshop/PARTICIPANT.md) owns class timing, and the [facilitator guide](workshop/FACILITATOR.md) owns rehearsal and assessment.

## In scope

1. Students implement the ERC-721 mint using <code>ERC721URIStorage</code>, card JSON metadata, represented-rarity draw, MetaMask network switch and wallet connection.
2. Students personalize their collection and app, create cards, and pay test ETH to spin and mint a hidden winner.
3. The first wallet transaction deploys their contract and mints that winner on Base Sepolia (84532). Later paid spins reuse the contract for that account in the same browser. The result appears after verification.
4. Students import or view the NFT in MetaMask and independently read its owner and metadata URI from the public chain, then fetch the JSON from IPFS.

## Exclusions

No private-key deployment, ABI Ninja, mainnet, production paid draws, marketplace integration or verifiable prize randomness. Pinata stores winner metadata on public IPFS; the contract stores its HTTPS gateway URL. The 0.0001 test ETH fee stays in the player's own contract and can be withdrawn by its owner. The separate <code>examples/PaidGachaDemo.sol</code> remains an optional testnet reference example and is not copied into student starters.

## Acceptance checks

| Check | Evidence |
| --- | --- |
| Starter generation | New sibling folder with six TODOs; existing folder is never overwritten |
| Local implementation | <code>npm test</code> passes twelve student-project tests after the TODOs; <code>npm run build</code> creates the Next.js routes <code>/</code>, <code>/deploy</code> and <code>/api/metadata</code> |
| Deck and draw | A 1–25 card deck can draw from only its represented rarities; no result is shown before the paid mint |
| Public mint | Successful chain-84532 transaction with exact 0.0001 test ETH value, contract address, token ID, recipient and testnet explorer link |
| Independent verification | <code>ownerOf</code> and JSON fetched from the <code>tokenURI</code> Pinata URL match the recorded winner and current owner |

The public mint check requires an actual testnet transaction. In-memory Hardhat tests establish local behavior but cannot prove that the student completed the public-chain step.
