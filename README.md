# Blockchain Integration & Web3: From Smart Contracts to a Functional Web Application

Build your own gacha card web app, connect it to MetaMask, and pay test ETH to spin and mint an ERC-721 NFT on **Base Sepolia**. This repository is the finished **Rarity Roulette** reference. The workshop starter supplies the interface and transaction recovery code; you implement the contract mint, card metadata and draw, network switch, and wallet connection.

## The outcome and the boundary

By the end, you should have a locally running app that lets you create a 1–25 card collection, approve a 0.0001 test ETH spin in MetaMask, and see the result after its NFT is minted and verified. The first paid spin deploys your reusable contract and creates token #1 in one wallet transaction. Later spins mint into that contract from the same account and browser.

| Term | Meaning |
| --- | --- |
| Card | One design with a name, description, image and rarity |
| Collection or deck | Your saved browser list of cards |
| Win | One browser draw, identified by a random 32-byte win ID |
| Token | The on-chain NFT created for a chosen win |
| Contract | Your reusable ERC-721 collection on Base Sepolia (chain 84532) |

Cards and draws are local. Before the wallet transaction, the browser selects a card without showing it in the interface and uploads its JSON to public IPFS through Pinata; only the HTTPS metadata URL is written on-chain. The result appears after the paid mint is verified. The 0.0001 test ETH fee goes into the player's own contract and can be withdrawn by that player. This is a classroom payment demo: the browser controls the outcome, so it is unsuitable for real-money prizes. Mainnet, marketplaces, and provably fair randomness are outside this workshop.

## 1. Prepare your computer and wallet

1. Install [Node.js](https://nodejs.org/en/download) 22.12 or later, Git, VS Code, and the [MetaMask browser extension](https://metamask.io/download/). Use a **dedicated test account**.
2. Open a terminal. Clone this repository and enter it:

   ~~~sh
   git clone https://github.com/owenlim225/CryptitaEVM_Workshop.git
   cd CryptitaEVM_Workshop
   npm ci
   ~~~

3. If PowerShell blocks the npm shim, use <code>npm.cmd ci</code> and <code>npm.cmd run dev</code> in place of the corresponding commands.
4. In MetaMask, choose your test account. Add **Base Sepolia** if it is missing: RPC <code>https://sepolia.base.org</code>, chain ID <code>84532</code>, currency symbol <code>ETH</code>, explorer <code>https://sepolia.basescan.org</code>. The app can also ask MetaMask to add or switch to this network. Check the chain ID before signing. See [Base's network details](https://docs.base.org/get-started/connect-to-base).
5. Get Base Sepolia test ETH from a [Base testnet faucet](https://docs.base.org/get-started/get-funds) or your facilitator. Each spin needs 0.0001 test ETH plus gas; contract creation needs more gas than a later mint. Do not move real ETH to the test account for this lab.

6. Create a [Pinata API key and find your gateway domain](https://docs.pinata.cloud/frameworks/next-js#create-an-api-key-and-get-gateway-url). Keep the JWT private; you will add it to your student project after generating the starter in §2.

**No private key or recovery phrase goes into this project.** MetaMask signs transactions in the browser. The Pinata JWT stays on the server and is never sent to the browser. An image can still use an HTTPS or <code>ipfs://</code> URL; a local thumbnail becomes part of the uploaded JSON.

## 2. See the finished target, then create your starter

1. In the reference checkout run:

   ~~~sh
   npm test
   npm run dev
   ~~~

2. Open [http://localhost:5173](http://localhost:5173). Choose **Create a collection**, save at least one card, and choose **Finish collection & spin** to inspect the wheel. A paid spin requires the funded test wallet and Pinata key configured in §1 and §2; you can complete it in your student project. Stop the dev server with Ctrl+C. In the browser's DevTools, open **Application → Storage → Clear site data** for <code>localhost:5173</code> before starting your own project; otherwise the reference deck and receipt will appear in your student app because both use the same local origin.
3. From the reference repository root, generate your **separate** student project:

   ~~~sh
   node workshop/create-starter.mjs ../my-gacha
   cd ../my-gacha
   npm ci
   code .
   ~~~

   Choose another folder name if <code>my-gacha</code> already exists. The generator refuses to overwrite an existing folder. You now edit files in <code>my-gacha</code>, not the reference checkout. The new project's <code>README.md</code> is this guide. The initial tests are expected to fail until you complete the TODOs.
4. In <code>my-gacha</code>, create <code>.env.local</code> with your Pinata values:

   ~~~text
   PINATA_JWT=your-jwt
   PINATA_GATEWAY_URL=https://ivory-additional-snail-831.mypinata.cloud
   ~~~

   The gateway above is the main example; replace it with your own Pinata gateway. Keep the JWT private; <code>.env.local</code> is ignored by Git. Restart the dev server after adding it. The server uploads winning-card JSON to public IPFS before the mint transaction is submitted. The upload endpoint is intended for this local workshop; add authentication and rate limits before deploying it publicly.

## 3. Implement the Solidity NFT

Open <code>contracts/Gacha.sol</code>. Like the <code>MyNFT</code> example, it inherits OpenZeppelin's <code>ERC721URIStorage</code>, calls <code>_safeMint</code>, and then calls <code>_setTokenURI</code> with a Pinata URL. The constructor calls <code>_mintCard</code> so the deployment transaction issues the first NFT. The public <code>mint</code> function uses the same routine for later wins. Replace the TODO function with:

~~~solidity
function _mintCard(bytes32 winId, string memory metadataUri) private returns (uint256 tokenId) {
    if (msg.value != SPIN_PRICE) revert IncorrectPayment(msg.value);
    if (winId == bytes32(0)) revert InvalidWinId();
    uint256 previousToken = mintedToken[msg.sender][winId];
    if (previousToken != 0) revert AlreadyMinted(previousToken);
    bytes memory uri = bytes(metadataUri);
    if (uri.length < 9 || uri.length > 256 ||
        uri[0] != 'h' || uri[1] != 't' || uri[2] != 't' || uri[3] != 'p' ||
        uri[4] != 's' || uri[5] != ':' || uri[6] != '/' || uri[7] != '/') revert InvalidMetadataURI();

    tokenId = nextTokenId++;
    mintedToken[msg.sender][winId] = tokenId;
    _safeMint(msg.sender, tokenId);
    _setTokenURI(tokenId, metadataUri);
}
~~~

The exact-payment check requires 0.0001 test ETH on deployment and every later mint. The duplicate check is scoped to <code>msg.sender</code> and win ID. It prevents that sender from minting the same win twice, even after transferring the first NFT. Token IDs start at 1, so zero means “not minted.” <code>ERC721URIStorage</code> supplies <code>tokenURI()</code> and stores the HTTPS URL set by <code>_setTokenURI</code>. The contract accepts URLs of at most 256 bytes; the upload endpoint limits JSON to 8,192 **UTF-8 bytes**. The deploying wallet owns the collection's accumulated test ETH and can call <code>withdraw()</code>.

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
  return { wallet, account: getAddress(selected) };
}
~~~

Trace the supplied <code>spin</code> and <code>claim</code> functions in that same file. They select a hidden card, upload its JSON to Pinata, save the URI, and prepare a 0.0001 test ETH transaction. The first transaction deploys the contract and mints the NFT; later spins call <code>mint</code> on the saved contract. After confirmation, the app verifies <code>mintedToken</code>, <code>ownerOf</code>, <code>tokenURI</code> and the fetched JSON, offers to add the NFT in MetaMask, and then opens the result modal. The pending transaction code lets the user return after an interrupted confirmation without paying twice for the same spin.

Run <code>npm test</code>. All twelve student-project tests should pass before you try a public testnet mint.

## 6. Make the app yours and run it

1. In <code>contracts/Gacha.sol</code>, change <code>ERC721("Cryptita Gacha", "GACHA")</code> to your collection name and a short symbol. Keep the constructor arguments and chain guard.
2. In <code>app/layout.jsx</code>, change the site title and description. In <code>app/page.jsx</code>, change the visible heading and introduction. In <code>app/deploy/Editor.jsx</code>, change the collection instructions if your theme needs them. The supplied <code>web/style.css</code> and <code>web/editor.css</code> are your styling starting point.
3. Run <code>npm test</code>, then <code>npm run dev</code>. Open [http://localhost:5173](http://localhost:5173). The editor is at <code>/deploy</code>.
4. Create a card with your own title, description, rarity and photo. Use an HTTPS or <code>ipfs://</code> image URL, or upload a JPG/PNG/WebP thumbnail. Add at least one more card in a different rarity. Save each card, choose **Finish collection & spin**, then choose **Pay & spin** with MetaMask. Record the winning name, rarity, image URI and description from the result.

**Checkpoint:** you can build the collection without MetaMask. The paid spin needs MetaMask, Pinata, and Base Sepolia test ETH. The collection and current transaction are saved in this browser and local origin. Do not switch browsers or local ports while a mint is pending.

## 7. Pay, mint, then reveal on Base Sepolia

1. Unlock MetaMask. Check the selected test account, chain ID **84532**, and its Base Sepolia test ETH balance.
2. Choose **Pay & spin** or **Spin again**. Approve the account and network prompts if shown. The app prepares the selected card's metadata on public IPFS before asking for payment.
3. Review the wallet transaction: **0.0001 test ETH plus gas**. The first spin also creates your contract. Confirm it and wait for verification; if you reject it, use **Retry paid spin** for the same hidden card.
4. The app verifies the minted NFT and asks MetaMask to add it. The result dialog then opens. Record the contract address, token ID, receiving account and transaction hash. Open it on [Base Sepolia BaseScan](https://sepolia.basescan.org/) and check that it succeeded. The ERC-721 <code>Transfer</code> event should have the zero address as sender and your account as recipient.
5. If your MetaMask version does not import the NFT automatically, open its **NFTs → Import NFT** screen and enter the **contract address and token ID** on Base Sepolia. The transaction hash is not the NFT address. See [MetaMask's NFT import guide](https://support.metamask.io/nfts/nft-tokens-in-your-metamask-wallet/).
6. Choose **Spin again** and confirm another paid mint. The second receipt should use the **same contract address** and a new token ID. The app reuses a contract per account in the same browser.

If a request stalls, check MetaMask activity and the transaction on BaseScan before retrying. The app keeps a pending win and checks the chain for its token when you choose **Check spin status**.

## 8. Read the NFT independently

Open <code>workshop/exercises/inspect-token.mjs</code> in your student project. Replace the body of <code>readCard</code> with:

~~~js
const owner = await contract.ownerOf(id);
const uri = await contract.tokenURI(id);
if (!/^https:\/\/[a-z0-9-]+\.mypinata\.cloud\/ipfs\/b[a-z2-7]{20,}$/.test(uri)) throw new Error("Unexpected metadata URI");
const response = await fetch(uri);
if (!response.ok) throw new Error("Metadata is unavailable from IPFS");
const card = await response.json();
const rarity = card.attributes.find(attribute => attribute.trait_type === "Rarity").value;
return { owner, name: card.name, description: card.description, image: card.image, rarity };
~~~

Run the inspector with the values from **your** mint receipt:

~~~sh
node workshop/exercises/inspect-token.mjs CONTRACT_ADDRESS TOKEN_ID
~~~

Replace both placeholders. It reads the public chain and IPFS and needs no wallet secret. If the public RPC is unavailable, set <code>WORKSHOP_RPC_URL</code> to another **chain-84532** endpoint. Compare its owner, name, description, image URI and rarity with your recorded winner. If you transferred the NFT, <code>ownerOf</code> changes while <code>tokenURI</code> stays the same. A public IPFS gateway can take time to retrieve a new CID; retry if the mint is confirmed but metadata is not available yet.

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
| Metadata upload fails | Check <code>PINATA_JWT</code> and <code>PINATA_GATEWAY_URL</code> in <code>.env.local</code>, restart the dev server, then retry. |
| MetaMask is missing | Enable and unlock the extension in this browser profile, reload, then retry. |
| Wrong network or no gas | Verify chain 84532 and enough Base Sepolia test ETH for the fee plus gas. |
| NFT is absent in MetaMask | Check the successful receipt, current account and chain; import by contract address and token ID. |
| A mint confirmation was interrupted | Check wallet activity and the explorer, then use **Check spin status**. |

For class timing and teaching notes, see the [participant guide](workshop/PARTICIPANT.md) and [facilitator guide](workshop/FACILITATOR.md). Maintainers can use the [implementation plan](IMPLEMENTATION_PLAN.md).
