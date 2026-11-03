# From a winning card to a wallet NFT

**Three hours**, including a ten-minute break. Bring basic JavaScript skills, an editor, Node.js 22 LTS (22.12 or later in that line) and MetaMask. Work in pairs. One student drives while the other records the winning card and receipt; switch before minting.

## 1. Welcome, introductions and objectives · 10 min

Open the game supplied by the facilitator. Choose **Create a collection**, give one card a distinctive title, description, photo and rarity, and choose **Save card**. Use **+ Add card** to create another, then choose **Finish collection & spin**. Choose **Spin the wheel** and write down the winning card's details. By the end of class, your partner should be able to recover those details from an NFT owned by your wallet.

**Checkpoint.** Show the winning card before connecting MetaMask. Keep the same site and browser profile for the mint.

## 2. Blockchain integration and Web3 architecture · 15 min

Trace these three paths:

```text
Card editor → 1–25 local cards → weighted roll → winning card + win ID
First mint  → MetaMask confirms contract creation → constructor mints winner to msg.sender
Later mint  → MetaMask confirms mint(winId, metadataJson) on saved contract → next token
```

The ERC-721 contract stores the JSON for each minted token. The app sends just the winner's metadata, including its photo URI. A URL points to a remote image; an embedded thumbnail includes image bytes. The remaining cards stay in the browser.

The default tier weights are N 55, R 28, SR 12, SSR 4 and UR 1. When some tiers are absent, divide each represented tier's weight by the sum of represented weights. Predict the odds for a deck containing only SSR and UR (4/5 and 1/5) and for one containing a single UR (100%). Rarity describes the card while a token ID identifies one minted copy.

## 3. Development environment and wallet setup · 20 min

From the repository root:

```sh
npm ci
npm run dev
```

Open Vite's URL. If you first rolled on a facilitator-hosted site, create your cards and roll again in this local copy. Each site keeps its own browser state. On Windows use `npm.cmd` if PowerShell blocks `npm`.

For minting, select a dedicated MetaMask account on **BNB Smart Chain Testnet**. The chain ID is **97** (`0x61`), currency **tBNB**, RPC `https://bsc-testnet-dataseed.bnbchain.org` and explorer `https://testnet.bscscan.com`. Obtain enough tBNB for contract creation and one later mint. Keep your recovery phrase and private key in MetaMask. [Official faucet](https://www.bnbchain.org/en/testnet-faucet) · [BNB Chain RPC endpoints](https://docs.bnbchain.org/bnb-smart-chain/developers/json_rpc/json-rpc-endpoint/)

**Checkpoint.** Confirm the account and chain ID. If funding is delayed, continue editing and testing, then pair with a funded participant for the live step.

## 4. Smart contract development using Solidity · 30 min

Read [Gacha.sol](../contracts/Gacha.sol). The uploaded `NFTA.sol` example uses a hardcoded token URI. Here, both the constructor and `mint` receive the winning card's JSON. `_mintCard` stores it under a new token ID and calls `_safeMint(msg.sender, tokenId)`. The connected sender therefore receives the NFT. You can complete the lab using this repository alone.

### Challenge 1 · Guard a repeated mint

In your own working copy, locate the existing duplicate check inside `_mintCard`. Remove only the lookup and check (leave the mapping update intact), then run `npm test` and find the failing duplicate-mint case. Restore the guard yourself.

- Look up the previous token with `mintedToken[msg.sender][winId]`. Token IDs start at 1, so 0 is the unused sentinel.
- If it is already set, revert with `AlreadyMinted(previousToken)`.
- Preserve the existing validation of nonzero win IDs and metadata length (1–8,192 UTF-8 bytes).

**Checkpoint.** Explain why reusing a win ID in the same account and contract must fail, while a different account can use that ID. The browser chooses the winning card; this contract accepts learner-supplied metadata.

## 5. Compile, test and prepare for deployment · 20 min

Run `npm test` after restoring your guard. Find the ABI and bytecode in `artifacts/Gacha.json`. Identify the first-mint constructor inputs and compare them with the parameters of `mint`. In a terminal run `npm run build` and confirm the Next.js production build is generated in `.next/`.

**Checkpoint.** Explain what the ABI allows the app to encode, what bytecode MetaMask submits on a first mint, and why a second mint in the same contract sends a function call. Automated contract tests simulate chain 97 in memory.

**Break · 10 min.**

## 6. Smart contract deployment on testnet · 20 min

Watch a first mint with a funded MetaMask account that has no saved game contract. From the winning card, start the mint and review the wallet's contract-creation request. The constructor deploys the contract **and** mints the first NFT in that single transaction. If doing this yourself, keep the resulting receipt for module 8.

Record the chain, contract address, mint transaction hash, token ID and receiving account. Search the transaction on [BscScan Testnet](https://testnet.bscscan.com/). A successful receipt contains an ERC-721 `Transfer` from the zero address to the receiving account. On later wins from the same account and browser, compare the destination address and gas estimate with this first receipt.

## 7. Frontend website and blockchain integration · 20 min

### Challenge 2 · Decode a token from another client

Complete `readCard` in [inspect-token.mjs](exercises/inspect-token.mjs). Given the token ID, return `{ owner, name, description, image, rarity }`. Use `ownerOf(id)` and `tokenURI(id)`. For the rarity, find the metadata attribute whose `trait_type` is `"Rarity"`.

<details><summary>Hint for decoding the URI</summary>

The URI starts with `data:application/json;base64,`. Remove the prefix, call `Buffer.from(payload, "base64").toString("utf8")`, and parse the resulting JSON.

</details>

**Checkpoint.** Predict which fields change after a transfer. Your inspector needs read access to the network and no wallet secret.

## 8. Wallet connection and contract interaction · 20 min

1. Return to the winner. If you minted it during module 6, spin a new win for this exercise. In MetaMask confirm the intended account, BNB Smart Chain Testnet and gas charge. Approve the mint and wait for confirmation.
2. Save the receipt details. If MetaMask supports the import request, use the app's add-NFT action and approve it. Otherwise open MetaMask's NFT import screen and enter the **contract address and token ID** on chain 97. The transaction hash is a different value.
3. Run your completed inspector using the address and ID from the receipt, replacing both placeholders:
   ```sh
   node workshop/exercises/inspect-token.mjs CONTRACT_ADDRESS TOKEN_ID
   ```
   It defaults to the public BNB Smart Chain Testnet RPC. Set `WORKSHOP_RPC_URL` to another chain-97 endpoint if needed.
4. Compare the inspector's owner with your MetaMask address and its name, image URI, description and rarity with the recorded winner. If a thumbnail was embedded, compare its rendered photo as well. Keep the result with your receipt.

## 9. Testing, troubleshooting and finalizing · 15 min

Try a second winner in the same wallet and browser. Reject the transaction before broadcast, then retry the same win. A confirmed later mint should reuse the contract address and give the new winner its own token ID.

| Symptom | What to check |
| --- | --- |
| A tier never appears | Only tiers represented in the finished deck participate. Compare the probabilities with the relative weights. |
| Card exceeds the metadata limit | Shorten the description, use a compact image or reference a reachable HTTPS/IPFS photo. Count bytes in the final per-card JSON. |
| MetaMask is missing or a `selectExtension` message appears | Verify MetaMask is enabled and unlocked in this profile, reload and retry. Check the stack source before attributing an extension error to a specific wallet. |
| Cannot pay gas or wrong network | Check chain 97 and the sender's tBNB balance. A first mint includes contract creation and needs more gas than a typical later mint. |
| Claim hangs or confirmation is interrupted | Check the wallet activity and transaction hash on BscScan before retrying. On a known contract, `mintedToken(sender, winId)` gives the minted token ID or 0 if unused. |
| NFT is missing from the wallet | Check receipt success, current account and chain. Import the ERC-721 contract address and token ID; use your inspector to check ownership independently. |

**Exit ticket.** Show your partner the pre-mint card, confirmed receipt and inspector result. Explain when the contract was created and why the browser's draw is appropriate only for workshop collectibles.
