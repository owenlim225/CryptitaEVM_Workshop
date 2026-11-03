# Blockchain Integration & Web3: From Smart Contracts to a Functional Web Application

Build your own gacha card web app, connect it to MetaMask, and mint a winning card as an ERC-721 NFT on **BNB Smart Chain Testnet**. This repository is the finished **Rarity Roulette** reference. The workshop starter supplies the interface and transaction recovery code; you implement the contract mint, card metadata and draw, network switch, and wallet connection.

## The outcome and the boundary

By the end, you should have a locally running app that lets you create a 1–25 card collection, spin for a winner, approve a testnet transaction in MetaMask, and verify an NFT whose owner and metadata match that winner. The first mint deploys your reusable contract and creates token #1 in one wallet transaction. Later wins mint into that contract from the same account and browser.

| Term | Meaning |
| --- | --- |
| Card | One design with a name, description, image and rarity |
| Collection or deck | Your saved browser list of cards |
| Win | One browser draw, identified by a random 32-byte win ID |
| Token | The on-chain NFT created for a chosen win |
| Contract | Your reusable ERC-721 collection on chain 97 |

Cards and draws are local. When you mint, the winning card's JSON is uploaded to public IPFS through Pinata, and only its IPFS URI is written on-chain. The browser supplies the result and metadata, so this is a classroom collectible, not a trustworthy paid prize draw. Paid spins, mainnet, marketplaces, and provably fair randomness are outside this workshop.

## 1. Prepare your computer and wallet

1. Install [Node.js](https://nodejs.org/en/download) 22.12 or later, Git, VS Code, and the [MetaMask browser extension](https://metamask.io/download/). Use a **dedicated test account**.
2. Open a terminal. Clone this repository and enter it:

   ~~~sh
   git clone https://github.com/owenlim225/CryptitaEVM_Workshop.git
   cd CryptitaEVM_Workshop
   npm ci
   ~~~

3. If PowerShell blocks the npm shim, use <code>npm.cmd ci</code> and <code>npm.cmd run dev</code> in place of the corresponding commands.
4. In MetaMask, choose your test account. Add **BNB Smart Chain Testnet** if it is missing: network name <code>BNB Smart Chain Testnet</code>, RPC <code>https://bsc-testnet-dataseed.bnbchain.org</code>, chain ID <code>97</code>, currency symbol <code>tBNB</code>, explorer <code>https://testnet.bscscan.com</code>. The app can also ask MetaMask to add or switch to this network. Check the chain ID before signing. See [BNB Chain's network settings](https://docs.bnbchain.org/bnb-smart-chain/developers/wallet-configuration/) and [RPC list](https://docs.bnbchain.org/bnb-smart-chain/developers/json_rpc/json-rpc-endpoint/).
5. Get test tBNB from the [BNB Chain faucet guide](https://docs.bnbchain.org/docs/bsc-faucet/) or your facilitator. Contract creation needs more gas than a later mint. Do not move real BNB to the test account for this lab.

6. Create a [Pinata API key](https://docs.pinata.cloud/frameworks/next-js#create-an-api-key-and-get-gateway-url). Put its JWT in a new <code>.env.local</code> file in the project root as <code>PINATA_JWT=your-jwt</code>. Keep that file private; it is ignored by Git. Restart the dev server after adding it. The server uploads winning-card JSON to public IPFS before MetaMask opens. The upload endpoint is intended for this local workshop; add authentication and rate limits before deploying it publicly.

**No private key or recovery phrase goes into this project.** MetaMask signs transactions in the browser. The Pinata JWT stays on the server and is never sent to the browser. An image can still use an HTTPS or <code>ipfs://</code> URL; a local thumbnail becomes part of the uploaded JSON.

## 2. See the finished target, then create your starter

1. In the reference checkout run:

   ~~~sh
   npm test
   npm run dev
   ~~~

2. Open [http://localhost:5173](http://localhost:5173). Choose **Create a collection**, save at least one card, choose **Finish collection & spin**, then spin. This is the result your build should reach. Stop the dev server with Ctrl+C. In the browser's DevTools, open **Application → Storage → Clear site data** for <code>localhost:5173</code> before starting your own project; otherwise the reference deck and win will appear in your student app because both use the same local origin.
3. From the reference repository root, generate your **separate** student project:

   ~~~sh
   node workshop/create-starter.mjs ../my-gacha
   cd ../my-gacha
   npm ci
   code .
   ~~~

   Choose another folder name if <code>my-gacha</code> already exists. The generator refuses to overwrite an existing folder. You now edit files in <code>my-gacha</code>, not the reference checkout. The new project's <code>README.md</code> is this guide. The initial tests are expected to fail until you complete the TODOs.

## 3. Implement the Solidity NFT

Open <code>contracts/Gacha.sol</code>. The constructor calls <code>_mintCard</code> so the deployment transaction issues the first NFT. The public <code>mint</code> function uses the same routine for later wins. Replace the two TODO functions with:

~~~solidity
function _mintCard(bytes32 winId, string memory metadataUri) private returns (uint256 tokenId) {
    if (winId == bytes32(0)) revert InvalidWinId();
    uint256 previousToken = mintedToken[msg.sender][winId];
    if (previousToken != 0) revert AlreadyMinted(previousToken);
    bytes memory uri = bytes(metadataUri);
    if (uri.length < 8 || uri.length > 128 ||
        uri[0] != 'i' || uri[1] != 'p' || uri[2] != 'f' || uri[3] != 's' ||
        uri[4] != ':' || uri[5] != '/' || uri[6] != '/') revert InvalidMetadataURI();

    tokenId = nextTokenId++;
    mintedToken[msg.sender][winId] = tokenId;
    tokenUris[tokenId] = metadataUri;
    _safeMint(msg.sender, tokenId);
}

function tokenURI(uint256 tokenId) public view override returns (string memory) {
    _requireOwned(tokenId);
    return tokenUris[tokenId];
}
~~~

The duplicate check is scoped to <code>msg.sender</code> and win ID. It prevents that sender from minting the same win twice, even after transferring the first NFT. Token IDs start at 1, so zero means “not minted.” The contract stores an <code>ipfs://</code> URI of at most 128 bytes; the upload endpoint limits the JSON to 8,192 **UTF-8 bytes**.

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

Open <code>web/wallet.js</code>. Its supplied code discovers MetaMask and names chain 97. Replace <code>switchNetwork</code> with:

~~~js
export async function switchNetwork(wallet, target) {
  const config = BSC_TESTNET;
  if (target !== 97) throw Error("This workshop only uses BNB Smart Chain Testnet.");
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
  await switchNetwork(wallet, 97);
  if (Number(await wallet.request({ method: "eth_chainId" })) !== 97)
    throw Error("Select BNB Smart Chain Testnet in MetaMask.");
  const [selected] = await wallet.request({ method: "eth_accounts" });
  if (!selected) throw Error("Choose an account in MetaMask.");
  return { wallet, account: getAddress(selected) };
}
~~~

Trace the supplied <code>claim</code> function in that same file. It uploads the winning-card JSON to Pinata, saves the returned URI with the win, reads the compiled ABI and bytecode, prepares a contract-creation transaction for the first mint, asks MetaMask to send it, waits for a receipt, and verifies <code>mintedToken</code>, <code>ownerOf</code>, <code>tokenURI</code> and the fetched JSON. For later wins it calls <code>mint</code> on the saved contract. The pending transaction code lets the user return after an interrupted confirmation without uploading a different URI.

Run <code>npm test</code>. All twelve automated tests should pass before you try a public testnet mint.

## 6. Make the app yours and run it

1. In <code>contracts/Gacha.sol</code>, change <code>ERC721("Cryptita Gacha", "GACHA")</code> to your collection name and a short symbol. Keep the constructor arguments and chain guard.
2. In <code>app/layout.jsx</code>, change the site title and description. In <code>app/page.jsx</code>, change the visible heading and introduction. In <code>app/deploy/Editor.jsx</code>, change the collection instructions if your theme needs them. The supplied <code>web/style.css</code> and <code>web/editor.css</code> are your styling starting point.
3. Run <code>npm test</code>, then <code>npm run dev</code>. Open [http://localhost:5173](http://localhost:5173). The editor is at <code>/deploy</code>.
4. Create a card with your own title, description, rarity and photo. Use an HTTPS or <code>ipfs://</code> image URL, or upload a JPG/PNG/WebP thumbnail. Add at least one more card in a different rarity. Save each card, choose **Finish collection & spin**, then choose **Spin the wheel**. Record the winning name, rarity, image URI and description before minting.

**Checkpoint:** your app works without MetaMask until you choose to mint. The collection and current win are saved in this browser and local origin. Do not switch browsers or local ports between drawing and minting.

## 7. Mint the winner on BNB Smart Chain Testnet

1. Unlock MetaMask. Check the selected test account, chain ID **97**, and its tBNB balance.
2. On the winner, choose **Mint this card with MetaMask**. The app uploads its metadata to public IPFS first. Approve the account and network prompts if shown.
3. Review the wallet transaction. Your **first** mint is contract creation and should require test tBNB for gas. Confirm it and wait for the app's receipt. If you reject it, the card stays available to retry.
4. Record the contract address, token ID, receiving account and transaction hash shown by the app. Open the transaction on [BscScan Testnet](https://testnet.bscscan.com/) and check that it succeeded. The ERC-721 <code>Transfer</code> event should have the zero address as sender and your account as recipient.
5. Choose **Add NFT to MetaMask**. If your MetaMask version does not import it automatically, open its **NFTs → Import NFT** screen and enter the **contract address and token ID** on BNB Smart Chain Testnet. The transaction hash is not the NFT address. See [MetaMask's NFT import guide](https://support.metamask.io/nfts/nft-tokens-in-your-metamask-wallet/).
6. Spin a different win and mint again. The second receipt should use the **same contract address** and a new token ID. The app reuses a contract per account in the same browser.

If a request stalls, check MetaMask activity and the transaction on BscScan before retrying. The app keeps a pending win and checks the chain for its token when you return.

## 8. Read the NFT independently

Open <code>workshop/exercises/inspect-token.mjs</code> in your student project. Replace the body of <code>readCard</code> with:

~~~js
const owner = await contract.ownerOf(id);
const uri = await contract.tokenURI(id);
if (!/^ipfs:\/\/b[a-z2-7]{20,}$/.test(uri)) throw new Error("Unexpected metadata URI");
const response = await fetch("https://ipfs.io/ipfs/" + uri.slice(7));
if (!response.ok) throw new Error("Metadata is unavailable from IPFS");
const card = await response.json();
const rarity = card.attributes.find(attribute => attribute.trait_type === "Rarity").value;
return { owner, name: card.name, description: card.description, image: card.image, rarity };
~~~

Run the inspector with the values from **your** mint receipt:

~~~sh
node workshop/exercises/inspect-token.mjs CONTRACT_ADDRESS TOKEN_ID
~~~

Replace both placeholders. It reads the public chain and IPFS and needs no wallet secret. If the public RPC is unavailable, set <code>WORKSHOP_RPC_URL</code> to another **chain-97** endpoint. Compare its owner, name, description, image URI and rarity with your recorded winner. If you transferred the NFT, <code>ownerOf</code> changes while <code>tokenURI</code> stays the same. A public IPFS gateway can take time to retrieve a new CID; retry if the mint is confirmed but metadata is not available yet.

## 9. Final checks and hand-in

Run <code>npm test</code> and <code>npm run build</code>. The production build is in <code>.next/</code>; <code>npm start</code> serves it at [http://localhost:5173](http://localhost:5173). Show your facilitator:

1. Your edited app and collection name.
2. A saved pre-mint winner and its rarity.
3. A successful chain-97 transaction hash, contract address and token ID.
4. An independent inspector result that matches the winner and current owner.
5. A brief explanation of why a browser-selected result is unsuitable for a paid gacha.

| Symptom | Check |
| --- | --- |
| A tier never appears | Only tiers represented in the finished deck participate. |
| A card exceeds the limit | Shorten its metadata or use a permanent image URL; uploads become small embedded thumbnails. |
| Metadata upload fails | Check <code>PINATA_JWT</code> in <code>.env.local</code>, restart the dev server, then retry. |
| MetaMask is missing | Enable and unlock the extension in this browser profile, reload, then retry. |
| Wrong network or no gas | Verify chain 97 and tBNB in the selected account. |
| NFT is absent in MetaMask | Check the successful receipt, current account and chain; import by contract address and token ID. |
| A mint confirmation was interrupted | Check wallet activity and the explorer, then use the app's **Check mint status** action. |

For class timing and teaching notes, see the [participant guide](workshop/PARTICIPANT.md) and [facilitator guide](workshop/FACILITATOR.md). Maintainers can use the [implementation plan](IMPLEMENTATION_PLAN.md).
