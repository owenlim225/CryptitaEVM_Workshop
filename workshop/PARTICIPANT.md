# Participant lab: build a gacha app and mint its winner

Follow the numbered instructions in the [README](../README.md). This page is your three-hour class schedule and checkpoint list. Work in your own generated starter project; keep the finished repository open only as a reference.

| Time | Build step | Show at the checkpoint |
| --- | --- | --- |
| 00:00–00:20 | README §§1–2: install, wallet, Pinata key, inspect finished target, generate starter | Separate project folder, dedicated MetaMask test account, chain 97 |
| 00:20–00:50 | §3: implement the ERC-721 mint with URI storage | Contract tests pass; identify ABI and bytecode |
| 00:50–01:20 | §4: encode card JSON and weighted draw | Card/roulette tests pass; explain SSR:UR = 4:1 |
| 01:20–01:45 | §5: network switching and wallet connection | Twelve automated tests pass |
| 01:45–01:55 | Break | Keep your project and browser profile open |
| 01:55–02:15 | §6: name your app and collection, create cards, spin | Record the pre-mint winner |
| 02:15–02:40 | §7: MetaMask mint on BNB Smart Chain Testnet | Successful receipt, contract address, token ID, account |
| 02:40–02:55 | §8: independent NFT inspector | Owner and metadata match the winner |
| 02:55–03:00 | §9: final hand-in | Explain why a browser draw is only for classroom collectibles |

## What you are building

The starter includes the Next.js pages, editor, wheel display, styles, tests, and transaction recovery flow. You complete six TODOs: the Solidity mint with <code>_setTokenURI</code>, JSON metadata, represented-tier weights, card draw, MetaMask network switch, and wallet connection. You then customize the app and use your wallet for the public testnet step.

The path through the system is:

~~~text
Local card editor → saved deck → weighted draw → winner + win ID
Pinata upload → public HTTPS metadata URL
First wallet approval → contract creation + token #1
Later wallet approval → mint on saved contract → next token
Public read → ownerOf + tokenURI → IPFS JSON → compare with original winner
~~~

## Evidence to keep

- Your collection name and two cards with different rarities.
- The winner's name, description, rarity and image URI **before** minting.
- Your chain-97 transaction hash, contract address, token ID and account.
- The inspector output for that token and your explanation of any difference after a transfer.

If funding is delayed, finish through README §6 and the inspector code in §8. Record the public mint checkpoint as incomplete; a simulated test receipt is not a public-chain receipt. Ask the facilitator for test tBNB or pair with someone who has a funded dedicated test account.
