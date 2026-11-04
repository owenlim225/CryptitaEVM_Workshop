# Optional paid gacha demo

`PaidGachaDemo.sol` is separate from the student workshop app and is not copied into generated starter projects. It targets Base Sepolia (chain 84532). Its `ROLL_PRICE` is `0.0001 ether` in Solidity units, which means **0.0001 test ETH** on this network.

The hardcoded token metadata URL is:

```text
https://ivory-additional-snail-831.mypinata.cloud/ipfs/bafkreibc7d3vnc24vsg3inh6s6qh6d2xlfhd62fexxt3n5pxtuoshsk7be
```

This URL must serve ERC-721 JSON with fields such as `name`, `description`, and `image`. The front end passes its selected card index to `roll(outcome)` and sends exactly `0.0001 ether` in transaction value. The contract records the index in `outcomeOf(tokenId)` and the `Rolled` event. Every token uses the same metadata URL, so wallets display the same NFT appearance for every outcome. The owner can call `withdraw()` to collect testnet proceeds.

This contract is not wired into the app or deployed. Callers can bypass the front-end randomizer and choose their own outcome. The workshop app also uses browser-selected outcomes with test ETH only. A real paid draw needs verifiable randomness and separate metadata URLs for distinct prizes.
