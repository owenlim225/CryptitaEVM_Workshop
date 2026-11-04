# Facilitator guide

The [README](../README.md) is the exact student build procedure. The [participant guide](PARTICIPANT.md) gives a three-hour schedule. Students begin from a generated starter, complete six TODOs, personalize the app, then mint their own winner on **BNB Smart Chain Testnet (97)**.

## Before class

1. In a fresh reference checkout run <code>npm ci</code>, <code>npm test</code>, <code>npm run build</code> and <code>npm run dev</code>. Check <code>/deploy</code>, a two-tier deck, a spin and the winner dialog.
2. Generate a starter with <code>node workshop/create-starter.mjs ../rehearsal-gacha</code>. Check that it has six TODOs, compiles, and that the contract, card and wallet tests initially fail. Complete the README snippets in that copy and verify all twelve student-project tests pass. The reference repository remains the answer key.
3. Arrange test tBNB for a contract creation and a later mint per student or pair. Use a dedicated MetaMask test account. Review the [BNB Chain faucet guide](https://docs.bnbchain.org/docs/bsc-faucet/) and test a chain-97 RPC endpoint before class.
4. Rehearse a public first mint and later mint in the same browser and account. Keep their BscScan links. Verify token ownership and the Pinata metadata URL with the inspector. Do not substitute an in-memory test receipt for this checkpoint.
5. Remind participants that no private key or recovery phrase belongs in a file, form, chat or screenshot. MetaMask signs in the browser.

## Teaching checkpoints

| Stage | Ask the student |
| --- | --- |
| Contract | Which transaction deploys the contract? Why does <code>msg.sender</code> receive token #1? Why is a repeat win ID rejected? |
| Draw | If the deck has only SSR and UR, what are their odds? Why do two SSR cards share the SSR chance? |
| Wallet | What does chain ID 97 prevent? What does MetaMask show before a transaction is sent? |
| Integration | Where do the ABI and bytecode come from? Why does the first mint have no <code>to</code> contract address? |
| Verification | Do <code>ownerOf</code> and <code>tokenURI</code> match the recorded winner? What would change after transfer? |

## Troubleshooting

- **Starter was generated inside the reference repository or destination exists:** choose a new sibling folder, such as <code>../student-gacha-2</code>. The generator deliberately refuses overwrite.
- **Contract compile fails:** compare the two replaced Solidity functions with README §3. Compile generates <code>artifacts/Gacha.json</code>.
- **Tests fail after a TODO:** check the exact named function and its return type. The initial red tests are expected; the completed project should pass twelve student-project tests.
- **Wallet prompt missing or wrong extension responds:** enable and unlock MetaMask in the current browser profile, reload, and check the network. The app requests account access only when minting.
- **Insufficient funds or stalled mint:** verify the selected account and tBNB balance, check MetaMask activity and BscScan, then use **Check mint status**. A first mint includes contract creation.
- **NFT not visible:** use the current account on chain 97 and manually import the contract address plus token ID. Check <code>ownerOf</code> independently.
- **Inspector cannot read:** use a different BNB Smart Chain Testnet RPC with <code>WORKSHOP_RPC_URL</code>. The inspector does not need a private key.

## Finish check

Ask each student to show an edited app, the winner recorded before minting, a successful **public** chain-97 transaction, contract address, token ID, current owner and metadata independently fetched from IPFS. Ask them to state that the browser controls the draw, so the workshop contract must not be used for paid prizes. If public funding was unavailable, record that checkpoint as incomplete and keep the student's passing local tests as separate evidence.
