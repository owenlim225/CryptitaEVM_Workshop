# Cryptita Plays · Rarity Roulette

Make a small deck, spin the wheel, and mint the card you won into MetaMask on **BNB Smart Chain Testnet**. Creating cards and spinning happen in the browser. Only a winner you choose to mint goes on-chain.

## Play in six steps

1. **Create a card.** Choose **Create a collection**, give the first card a title, description, photo and rarity, then choose **Save card**. Use an HTTPS/IPFS photo URL or upload a supported image.
2. **Build your collection.** Use **+ Add card** to create and save cards individually. A deck can contain 1–25 cards in any mix of N, R, SR, SSR and UR. Each card's encoded JSON must fit within 8,192 UTF-8 bytes.
3. **Finish the deck.** Choose **Finish collection & spin** to move from the editor into roulette. Your collection stays in your browser.
4. **Roll and reveal.** Choose **Spin the wheel** to reveal one winning card. Compare its name, description, photo and rarity with the card you created. You can stop here without a wallet.
5. **Mint the winner.** Choose **Mint this card with MetaMask**, select BNB Smart Chain Testnet (chain ID 97), review the destination account and approve the gas charge in tBNB. Your first mint deploys a reusable ERC-721 contract and creates the winning token in one transaction. Later wins use the saved contract for that account in the same browser.
6. **View the NFT.** Choose **Add NFT to MetaMask** if supported, or manually import the **contract address and token ID** into the same account on chain 97. Compare the receipt and token with the original winning card. [BscScan Testnet](https://testnet.bscscan.com/)

## Run the workshop

Use Node.js 22 LTS (22.12 or later in that line). From the repository root run:

```sh
npm ci
npm test
npm run dev
```

Open the local URL printed by Vite. On Windows, `npm.cmd` works when PowerShell blocks the `npm` shim. To produce the static site in `dist/`, run `npm run build`.

| Audience | Guide |
| --- | --- |
| Students | [Three-hour lab with two coding challenges](workshop/PARTICIPANT.md) |
| Facilitators | [Run of show, answer key and troubleshooting](workshop/FACILITATOR.md) |
| Maintainers | [Implementation plan and acceptance checks](IMPLEMENTATION_PLAN.md) |

The challenge format follows the [Cryptita Plays Builder Workshop](https://github.com/owenlim225/CRYPTITAPLAYS_BuilderWorkshop2026).

## Rarity and ownership

| Rarity | N · Normal | R · Rare | SR · Super Rare | SSR · Super Super Rare | UR · Ultra Rare |
| --- | ---: | ---: | ---: | ---: | ---: |
| Relative weight | 55 | 28 | 12 | 4 | 1 |

UR and LR (Legendary Rare) refer to the same highest tier here. The wheel uses only tiers present in your deck. With R and SR alone, their probabilities are 28/40 and 12/40. With one card, it wins every spin.

The browser supplies the winner's metadata. The contract stores those bytes for its token ID and mints to `msg.sender`. A repeated win ID for that sender on that contract resolves to the original token via `mintedToken(account, winId)`. A player can change browser data, so this classroom draw should only be used for test collectibles. [Solidity contract](contracts/Gacha.sol)

**Network settings.** BNB Smart Chain Testnet uses `97` (`0x61`), currency `tBNB`, RPC `https://bsc-testnet-dataseed.bnbchain.org`, and explorer `https://testnet.bscscan.com`. Obtain test funds before the mint exercise. [Official faucet](https://www.bnbchain.org/en/testnet-faucet) · [BNB Chain network settings](https://docs.bnbchain.org/bnb-smart-chain/developers/wallet-configuration/)
