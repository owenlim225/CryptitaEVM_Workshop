# Facilitator guide

Allow three hours, including a ten-minute break. Students need basic JavaScript, a browser and an editor. A funded MetaMask account on **BNB Smart Chain Testnet (97)** is required for the optional on-chain mint.

## Rehearse before class

Run `npm ci`, `npm test`, `npm run build` and `npm run dev` in a fresh checkout. Try a one-card deck, then a deck with two tiers. Confirm that card creation, finishing the collection and rolling work with MetaMask disconnected. Arrange tBNB for live signing and test an independent RPC endpoint for the [inspector exercise](exercises/inspect-token.mjs). [Official faucet](https://www.bnbchain.org/en/testnet-faucet)

In the same account and browser, mint two different winners. Capture the first receipt's contract address and token ID. The later mint should target the same address. Check current ownership, both tokens' distinct metadata and MetaMask import. Keep public chain-97 receipts separate from automated test output. Students create their contracts through their own first mint.

## Run of show

| Elapsed | Agenda | Instructor move |
| --- | --- | --- |
| 00:00–00:10 | Welcome and objectives | Each pair creates cards, finishes its collection and rolls. Record the winner's photo and fields before signing anything. |
| 00:10–00:25 | Blockchain integration and Web3 architecture | Trace browser inputs, first mint and later mint. Ask for the probabilities of SSR and UR when only those two tiers exist. |
| 00:25–00:45 | Environment and wallet setup | Install dependencies. Verify MetaMask account, chain ID 97 and tBNB balance. Learners awaiting funding can pair with a funded participant. |
| 00:45–01:15 | Solidity development | Contrast the hardcoded URI in the supplied NFTA.sol example with per-token metadata. Students implement the duplicate guard in challenge 1. |
| 01:15–01:35 | Compile, test and prepare | Run the regression and locate ABI and bytecode. Identify constructor and mint parameters. |
| 01:35–01:45 | Break | Keep the winning card and browser profile available. |
| 01:45–02:05 | Testnet deployment | Demonstrate the combined contract creation and first mint. Inspect the receipt's Transfer event. |
| 02:05–02:25 | Frontend integration | Trace ownerOf and tokenURI in the ABI. Pairs implement the inspector. |
| 02:25–02:45 | Wallet interaction | Students mint their winner, check the recipient and import the NFT into MetaMask. |
| 02:45–03:00 | Test, troubleshoot and finalize | Reject a later mint, retry, compare both receipts and inspect the exact card. |

## Answer key

**Challenge 1.** The sender and win ID together key the mapping on this contract. Check it before minting. A nonzero value identifies the token already minted, including after it is transferred.

```solidity
uint256 previousToken = mintedToken[msg.sender][winId];
if (previousToken != 0) revert AlreadyMinted(previousToken);
```

**Challenge 2.** Replace the body of `readCard` in the instructor's working copy:

```js
const owner = await contract.ownerOf(id);
const uri = await contract.tokenURI(id);
const prefix = "data:application/json;base64,";
if (!uri.startsWith(prefix)) throw new Error("Unexpected metadata URI");
const card = JSON.parse(Buffer.from(uri.slice(prefix.length), "base64").toString("utf8"));
const rarity = card.attributes.find(attribute => attribute.trait_type === "Rarity").value;
return { owner, name: card.name, description: card.description, image: card.image, rarity };
```

**Finish check.** Ask the pair for its original winner, successful public mint hash, contract address, token ID, current owner and independently decoded metadata. Ask what stays in the browser, what the successful mint publishes, and what bytes a remote image URL actually preserves. If a pair could only complete the off-chain steps, record those steps and leave the public mint checkpoint open.
