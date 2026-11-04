# Blockchain Integration & Web3: From Smart Contracts to a Functional Web Application

Build your own gacha card web app, connect it to MetaMask, and pay test ETH to spin and mint an ERC-721 NFT on **Base Sepolia**. This repository is the finished **MARSU Roulette** reference. The workshop starter supplies the interface and transaction recovery code; you implement the contract mint, card metadata and draw, network switch, and wallet connection.

## The outcome and the boundary

By the end, you should have a locally running app that lets you create a 1–25 card collection, approve a 0.0001 test ETH spin in MetaMask, and see the result after its NFT is minted and verified. The first paid spin deploys your reusable contract and creates token #1 in one wallet transaction. Later spins mint into that contract from the same account and browser.

| Term | Meaning |
| --- | --- |
| Card | One design with a name, description, image and rarity |
| Collection or deck | Your saved browser list of cards |
| Win | One browser draw, identified by a random 32-byte win ID |
| Token | The on-chain NFT created for a chosen win |
| Contract | Your reusable ERC-721 collection on Base Sepolia (chain 84532) |

Cards and draws are local. Before the wallet transaction, the browser selects a card without showing it and encodes its JSON as a self-contained <code>data:application/json;base64,</code> token URI. The URI is stored on-chain during the paid mint, so no Pinata account or upload key is needed. The result appears after the mint is verified. Storing metadata on-chain uses more gas, especially when a card includes an embedded photo. The 0.0001 test ETH fee goes into the player's own contract and can be withdrawn by that player. This is a classroom payment demo: the browser controls the outcome, so it is unsuitable for real-money prizes. Mainnet, marketplaces, and provably fair randomness are outside this workshop.

## 1. Prepare your computer and wallet

1. Install [Node.js](https://nodejs.org/en/download) 22.12 or later, Git, VS Code, and the [MetaMask browser extension](https://metamask.io/download/).
2. Open the extension and choose **Create a new wallet** for this workshop. Follow MetaMask's setup prompts and use a **dedicated test wallet**. If you choose the Secret Recovery Phrase setup, write its **12 words** in the exact order and keep them somewhere private and offline. Anyone with those words can control the wallet; MetaMask cannot recover them for you. **Never show the phrase to a facilitator, enter it in this project or a QR site, or put it in a screenshot.** See [MetaMask's wallet setup guide](https://support.metamask.io/start/creating-a-new-wallet).
3. In MetaMask, select the workshop account and click its **public EVM wallet address** to copy it. Check that the pasted address starts with <code>0x</code> and matches the first and last characters shown in MetaMask. Open [QR Code Generator](https://www.qr-code-generator.com/), choose a **static Text** QR code, and paste **only that public address**. Generate the code and let a live facilitator scan it to send Base Sepolia test ETH. Have them confirm the scanned address matches the one in MetaMask. The QR code shares your receiving address, never your recovery phrase or private key. See [MetaMask's address guide](https://support.metamask.io/configure/accounts/how-to-view-your-account-details-and-public-address/) and the [static QR code guide](https://support.qr-code-generator.com/hc/en-us/articles/7664248839053-How-can-I-create-a-Static-QR-Code-without-an-account).
4. Add **Base Sepolia** in MetaMask: open **Networks → Manage networks → Add a custom network → Add from Chainlist**, search for **Base Sepolia**, then approve the request and choose **Save** if prompted. If your MetaMask version does not show **Add from Chainlist**, follow [MetaMask's Chainlist instructions](https://support.metamask.io/configure/networks/how-to-add-a-custom-network-rpc) or add it manually. Before approving, verify the network against [Base's network details](https://docs.base.org/get-started/connect-to-base): RPC <code>https://sepolia.base.org</code>, chain ID <code>84532</code>, currency symbol <code>ETH</code>, explorer <code>https://sepolia.basescan.org</code>. Choose **Base Sepolia**, not Base mainnet (chain 8453). The app can also ask MetaMask to add or switch to Base Sepolia.
5. On MetaMask's **Tokens** tab, open the **Enabled networks** or selected network filter and choose **Base Sepolia** so the displayed balance is for this testnet. If prompted, enable **Show test networks** in the Networks menu first. This filter controls what balances you see; when you connect the workshop app later, also approve **Base Sepolia** as the app's network. See [MetaMask's network filter guide](https://support.metamask.io/configure/networks/how-to-change-networks).
6. Ask your facilitator to send test ETH to the QR code address, or use a [Base testnet faucet](https://docs.base.org/get-started/get-funds). Confirm that the **same account** shows the deposit on **Base Sepolia** before spinning. Each spin needs 0.0001 test ETH plus gas; contract creation needs more gas than a later mint. Do not move real ETH to the test wallet for this lab.
7. Open a terminal. Clone this repository and enter it:

   ~~~sh
   git clone https://github.com/owenlim225/CryptitaEVM_Workshop.git
   cd CryptitaEVM_Workshop
   npm ci
   ~~~

8. If PowerShell blocks the npm shim, use <code>npm.cmd ci</code> and <code>npm.cmd run dev</code> in place of the corresponding commands.

**No private key or recovery phrase goes into this project.** MetaMask signs transactions in the browser. An image can still use an HTTPS or <code>ipfs://</code> URL; a local thumbnail becomes part of the on-chain JSON URI.

## 2. See the finished target, then create your starter

1. In the reference checkout run:

   ~~~sh
   npm test
   npm run dev
   ~~~

2. Open [http://localhost:5173](http://localhost:5173). Choose **Create a collection**, save at least one card, and choose **Finish collection & spin** to inspect the wheel. A paid spin requires a funded test wallet; you can complete it in your student project. Stop the dev server with Ctrl+C. In the browser's DevTools, open **Application → Storage → Clear site data** for <code>localhost:5173</code> before starting your own project; otherwise the reference deck and receipt will appear in your student app because both use the same local origin.
3. From the reference repository root, generate your **separate** student project:

   ~~~sh
   node workshop/create-starter.mjs ../my-gacha
   cd ../my-gacha
   npm ci
   code .
   ~~~

   Choose another folder name if <code>my-gacha</code> already exists. The generator refuses to overwrite an existing folder. You now edit files in <code>my-gacha</code>, not the reference checkout. The new project's <code>README.md</code> is this guide. The initial tests are expected to fail until you complete the TODOs.
## 3. Implement the Solidity NFT

Open <code>contracts/Gacha.sol</code>. Like the <code>MyNFT</code> example, it inherits OpenZeppelin's <code>ERC721URIStorage</code>, calls <code>_safeMint</code>, and then calls <code>_setTokenURI</code> with the card's JSON data URI. The constructor calls <code>_mintCard</code> so the deployment transaction issues the first NFT. The public <code>mint</code> function uses the same routine for later wins. Replace the TODO function with:

~~~solidity
function _mintCard(bytes32 winId, string memory metadataUri) private returns (uint256 tokenId) {
    if (msg.value != SPIN_PRICE) revert IncorrectPayment(msg.value);
    if (winId == bytes32(0)) revert InvalidWinId();
    uint256 previousToken = mintedToken[msg.sender][winId];
    if (previousToken != 0) revert AlreadyMinted(previousToken);
    bytes memory uri = bytes(metadataUri);
    bytes memory prefix = bytes("data:application/json;base64,");
    if (uri.length <= prefix.length || uri.length > 10953) revert InvalidMetadataURI();
    for (uint256 i; i < prefix.length; i++) {
        if (uri[i] != prefix[i]) revert InvalidMetadataURI();
    }

    tokenId = nextTokenId++;
    mintedToken[msg.sender][winId] = tokenId;
    _safeMint(msg.sender, tokenId);
    _setTokenURI(tokenId, metadataUri);
}
~~~

The exact-payment check requires 0.0001 test ETH on deployment and every later mint. The duplicate check is scoped to <code>msg.sender</code> and win ID. It prevents that sender from minting the same win twice, even after transferring the first NFT. Token IDs start at 1, so zero means “not minted.” <code>ERC721URIStorage</code> supplies <code>tokenURI()</code> and stores the JSON data URI set by <code>_setTokenURI</code>. The editor limits JSON to 8,192 **UTF-8 bytes**, which becomes at most 10,953 bytes after Base64 encoding and the URI prefix. The deploying wallet owns the collection's accumulated test ETH and can call <code>withdraw()</code>.

Run:

~~~sh
npm run compile
npm test
~~~

The contract tests should pass; card and wallet tests still need your remaining TODOs. Open <code>artifacts/Gacha.json</code>: its <code>abi</code> describes callable contract functions and its <code>bytecode</code> is the deployment program. This generated file is ignored by Git and is rebuilt before tests, dev and production builds.

## 4. Encode cards and draw by rarity

Open <code>web/cards.js</code>. Replace the three TODO functions with the code below. Leave the supplied <code>validateCard</code>, browser storage and image URL checks in place.

~~~js
export function cardMetadata(card) {
  return JSON.stringify({
    name: card.name,
    description: card.description,
    image: card.image,
    attributes: [{ trait_type: "Rarity", value: tierNames[card.rarity] }]
  });
}

export function availableWeights(cards) {
  return tierWeights.map((weight, tier) =>
    cards.some(card => card.rarity === tier) ? weight : 0);
}

export function drawCard(randomHex, cards) {
  const weights = availableWeights(cards);
  const total = BigInt(weights.reduce((sum, weight) => sum + weight, 0));
  if (!total) throw Error("Create at least one card before spinning.");
  const seed = BigInt(randomHex);
  let roll = Number(seed % total);
  const tier = weights.findIndex(weight => {
    if (roll < weight) return true;
    roll -= weight;
    return false;
  });
  const pool = cards.map((card, i) => card.rarity === tier ? i : -1)
    .filter(i => i >= 0);
  return pool[Number((seed / total) % BigInt(pool.length))];
}
~~~

The weights are **N 55, R 28, SR 12, SSR 4, UR 1**. Only represented rarities count. A deck with only SSR and UR draws those tiers at 4/5 and 1/5; cards within a tier split that tier's chance equally. <code>web/roulette.js</code> animates the wheel to match the selected card. The wheel's five visual sectors are equal sized; the printed probabilities and draw code determine the actual chance.

Run <code>npm test</code>. The card and roulette tests should now pass. Explain to a partner why the same random win ID selects both a tier and a card within that tier.

## 5. Connect MetaMask to the correct chain

Open <code>web/wallet.js</code>. Its supplied code discovers MetaMask and names chain 84532. Replace <code>switchNetwork</code> with:

~~~js
export async function switchNetwork(wallet, target) {
  const config = BASE_SEPOLIA;
  if (target !== 84532) throw Error("This workshop only uses Base Sepolia.");
  const current = await wallet.request({ method: "eth_chainId" });
  if (Number(current) === target) return;
  const switchChain = () => wallet.request({
    method: "wallet_switchEthereumChain", params: [{ chainId: config.chainId }]
  });
  try {
    await switchChain();
  } catch (error) {
    const code = error?.data?.originalError?.code ?? error?.code;
    if (Number(code) !== 4902) throw error;
    await wallet.request({ method: "wallet_addEthereumChain", params: [config] });
    await switchChain();
  }
  if (Number(await wallet.request({ method: "eth_chainId" })) !== target) {
    throw Error("Select " + config.chainName + " in your wallet and try again.");
  }
}
~~~

Open <code>web/main.js</code>. Replace its <code>connect</code> TODO with:

~~~js
async function connect() {
  const wallet = getMetaMask();
  await wallet.request({ method: "eth_requestAccounts" });
  await switchNetwork(wallet, 84532);
  if (Number(await wallet.request({ method: "eth_chainId" })) !== 84532)
    throw Error("Select Base Sepolia in MetaMask.");
  const [selected] = await wallet.request({ method: "eth_accounts" });
  if (!selected) throw Error("Choose an account in MetaMask.");
  connectedWallet = wallet;
  connectedAccount = getAddress(selected);
  if (observedWallet !== wallet) {
    wallet.on?.("accountsChanged", accounts => {
      if (connectedWallet !== wallet) return;
      connectedAccount = accounts[0] ? getAddress(accounts[0]) : undefined;
      if (!connectedAccount) connectedWallet = undefined;
      render();
    });
    observedWallet = wallet;
  }
  render();
}
~~~

Trace the supplied <code>spin</code> and <code>claim</code> functions in that same file. Connect the wallet in the header before spinning. They select a card, encode its JSON into a data URI, save the URI, and prepare a 0.0001 test ETH transaction. The first transaction deploys the contract and mints the NFT; later payments call <code>mint</code> on the saved contract. After confirmation, the app verifies <code>mintedToken</code>, <code>ownerOf</code> and <code>tokenURI</code> against the winning card. Choose **Spin** to reveal the card and open the result modal. The NFT is already in the receiving wallet; the modal offers a display option only if MetaMask does not show it. The pending transaction code lets the user return after an interrupted confirmation without paying twice for the same spin.

Run <code>npm test</code>. All student-project tests should pass before you try a public testnet mint.

## 6. Make the app yours and run it

1. In <code>contracts/Gacha.sol</code>, change <code>ERC721("Cryptita Gacha", "GACHA")</code> to your collection name and a short symbol. Keep the constructor arguments and chain guard.
2. In <code>app/layout.jsx</code>, change the site title and description. In <code>app/page.jsx</code>, change the visible heading and introduction. In <code>app/deploy/Editor.jsx</code>, change the collection instructions if your theme needs them. The supplied <code>web/style.css</code> and <code>web/editor.css</code> are your styling starting point.
3. Run <code>npm test</code>, then <code>npm run dev</code>. Open [http://localhost:5173](http://localhost:5173). The editor is at <code>/deploy</code>.
4. Create a card with your own title, description, rarity and photo. Use an HTTPS or <code>ipfs://</code> image URL, or upload a JPG/PNG/WebP thumbnail. Add at least one more card in a different rarity. Save each card, choose **Finish collection & spin**, connect MetaMask in the header, then choose **Pay to spin**. When the transaction completes, choose **Spin** in the popup and record the winning name, rarity, image URI and description from the result.

**Checkpoint:** you can build the collection without MetaMask. The paid spin needs MetaMask and Base Sepolia test ETH for the fee plus on-chain metadata gas. The collection and current transaction are saved in this browser and local origin. Do not switch browsers or local ports while a mint is pending.

## 7. Pay, mint, then reveal on Base Sepolia

1. Unlock MetaMask. Check the selected test account, chain ID **84532**, and its Base Sepolia test ETH balance.
2. Choose **Connect MetaMask** in the header, approve the account and network prompts, then choose **Pay to spin** or **Pay for next spin**. The selected card's metadata is encoded into the transaction before payment; the wheel stays still.
3. Review the wallet transaction: **0.0001 test ETH plus gas**. The first payment also creates your contract. Confirm it and wait for verification; the page shows a spinner during the wallet and chain wait. If you reject it, use **Retry payment** for the same selected card.
4. When the **Transaction complete** popup appears, choose its **Spin** button to reveal the card and open the result dialog. If you close the popup, the page's **Spin** button remains available. Record the contract address, token ID, receiving account and transaction hash. Open it on [Base Sepolia BaseScan](https://sepolia.basescan.org/) and check that it succeeded. The ERC-721 <code>Transfer</code> event should have the zero address as sender and your account as recipient.
5. The confirmed mint already credits the NFT to the receiving wallet. If it does not appear in MetaMask, open **NFT not showing in MetaMask?** in the result dialog and choose **Show NFT in MetaMask**. If that fails, open MetaMask’s **NFTs → Import NFT** screen and enter the **contract address and token ID** on Base Sepolia. The transaction hash is not the NFT address. See [MetaMask's NFT import guide](https://support.metamask.io/manage-crypto/nfts/nft-tokens-in-your-metamask-wallet/).
6. Choose **Pay for next spin** and confirm another paid mint, then choose **Spin** again. The second receipt should use the **same contract address** and a new token ID. The app reuses a contract per account in the same browser.

If a request stalls, check MetaMask activity and the transaction on BaseScan before retrying. The app keeps a pending win and checks the chain for its token when you choose **Check transaction status**.

## 8. Read the NFT independently

Open <code>workshop/exercises/inspect-token.mjs</code> in your student project. Replace the body of <code>readCard</code> with:

~~~js
const owner = await contract.ownerOf(id);
const uri = await contract.tokenURI(id);
const prefix = "data:application/json;base64,";
if (!uri.startsWith(prefix)) throw new Error("Unexpected metadata URI");
const card = JSON.parse(Buffer.from(uri.slice(prefix.length), "base64").toString("utf8"));
const rarity = card.attributes.find(attribute => attribute.trait_type === "Rarity").value;
return { owner, name: card.name, description: card.description, image: card.image, rarity };
~~~

Run the inspector with the values from **your** mint receipt:

~~~sh
node workshop/exercises/inspect-token.mjs CONTRACT_ADDRESS TOKEN_ID
~~~

Replace both placeholders. It reads the public chain and decodes the on-chain metadata without a wallet secret. If the public RPC is unavailable, set <code>WORKSHOP_RPC_URL</code> to another **chain-84532** endpoint. Compare its owner, name, description, image URI and rarity with your recorded winner. If you transferred the NFT, <code>ownerOf</code> changes while <code>tokenURI</code> stays the same.

## 9. Final checks and hand-in

Run <code>npm test</code> and <code>npm run build</code>. The production build is in <code>.next/</code>; <code>npm start</code> serves it at [http://localhost:5173](http://localhost:5173). Show your facilitator:

1. Your edited app and collection name.
2. A result revealed after a paid mint.
3. A successful chain-84532 transaction hash, contract address and token ID.
4. An independent inspector result that matches the winner and current owner.
5. A brief explanation of why a browser-selected result is unsuitable for a paid gacha.

| Symptom | Check |
| --- | --- |
| A tier never appears | Only tiers represented in the finished deck participate. |
| A card exceeds the limit | Shorten its metadata or use a permanent image URL; uploads become small embedded thumbnails. |
| The wallet estimates high gas | Use a permanent image URL instead of an embedded photo, or shorten the card details. |
| MetaMask is missing | Enable and unlock the extension in this browser profile, reload, then retry. |
| Wrong network or no gas | Verify chain 84532 and enough Base Sepolia test ETH for the fee plus gas. |
| NFT is absent in MetaMask | Check the successful receipt, current account and chain; import by contract address and token ID. |
| A mint confirmation was interrupted | Check wallet activity and the explorer, then use **Check transaction status**. |

For class timing and teaching notes, see the [participant guide](workshop/PARTICIPANT.md) and [facilitator guide](workshop/FACILITATOR.md). Maintainers can use the [implementation plan](IMPLEMENTATION_PLAN.md).
