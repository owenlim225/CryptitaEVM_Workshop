# Workshop scope and acceptance

The [README](README.md) is the canonical student procedure. The reference repository is the completed Next.js gacha app; <code>workshop/create-starter.mjs</code> creates a separate student copy with seven TODOs. The [participant guide](workshop/PARTICIPANT.md) owns class timing, and the [facilitator guide](workshop/FACILITATOR.md) owns rehearsal and assessment.

## In scope

1. Students implement the ERC-721 mint and token URI, card JSON metadata, represented-rarity draw, MetaMask network switch and wallet connection.
2. Students personalize their collection and app, create cards, spin and record a winner.
3. The first wallet transaction deploys their contract and mints that winner on BNB Smart Chain Testnet (97). Later mints reuse the contract for that account in the same browser.
4. Students import or view the NFT in MetaMask and independently read its owner and metadata URI from the public chain, then fetch the JSON from IPFS.

## Exclusions

No private-key deployment, Base Sepolia, ABI Ninja, mainnet, paid draws, marketplace integration or verifiable prize randomness. Pinata stores winner metadata on public IPFS; the contract stores its URI. Browser-selected winners are suitable only for classroom collectibles.

## Acceptance checks

| Check | Evidence |
| --- | --- |
| Starter generation | New sibling folder with seven TODOs; existing folder is never overwritten |
| Local implementation | <code>npm test</code> passes twelve tests after the TODOs; <code>npm run build</code> creates the Next.js routes <code>/</code>, <code>/deploy</code> and <code>/api/metadata</code> |
| Off-chain play | A 1–25 card deck can draw from only its represented rarities without a wallet |
| Public mint | Successful chain-97 transaction with contract address, token ID, recipient and testnet explorer link |
| Independent verification | <code>ownerOf</code> and JSON fetched from the <code>tokenURI</code> IPFS CID match the recorded winner and current owner |

The public mint check requires an actual testnet transaction. In-memory Hardhat tests establish local behavior but cannot prove that the student completed the public-chain step.
