import { BrowserProvider, Contract, ContractFactory, getAddress, getCreateAddress, hexlify, randomBytes, toQuantity } from "ethers";
import artifact from "../artifacts/Gacha.json" with {type:"json"};
import { readDeck, cardMetadata, drawCard, imageSrc, tierNames } from "./cards.js";
import { BSC_TESTNET, getMetaMask, switchNetwork, walletError } from "./wallet.js";
import { initRoulette, revealRarity } from "./roulette.js";

const STORE = "cryptita.player-win.v2";
const minterKey = account => "cryptita.player-minter.v2.97." + account;
const $ = id => document.getElementById(id);
let deck = [], win, busy = false;

function save(next) {
  try { localStorage.setItem(STORE, JSON.stringify(next)); }
  catch { throw Error("Allow site storage to keep the card and its mint receipt."); }
  win = next;
}
function restoreWin() {
  const current = localStorage.getItem(STORE);
  if (current) return JSON.parse(current);
  // Only carry forward card data from an unsubmitted win. Older contracts have a different ABI.
  const old = JSON.parse(localStorage.getItem("cryptita.winning-card.v1"));
  const card = old?.card;
  if (!old?.receipt && !old?.attempt && card?.name && card.description && imageSrc(card.image) && tierNames[card.rarity]) {
    const {name, description, image, rarity} = card;
    save({id:hexlify(randomBytes(32)), card:{name, description, image, rarity}});
  }
  return win;
}
function render() {
  $("spin").hidden = !deck.length;
  $("spin").disabled = busy || Boolean(win?.pending);
  $("spin").textContent = win ? "Spin again" : "Spin the wheel";
  $("edit").textContent = deck.length ? "Edit collection" : "Create a collection";
  $("edit").className = deck.length ? "jump" : "button-link";
  $("win").hidden = $("win-link").hidden = !win;
  $("receipt").hidden = $("mint-link").hidden = !win?.receipt;
  $("action").disabled = busy || Boolean(win?.receipt);
  $("import").disabled = busy;
  if (!win) return;
  $("card-image").src = imageSrc(win.card.image);
  $("card-image").alt = win.card.name;
  $("card-tier").textContent = tierNames[win.card.rarity];
  $("card-name").textContent = win.card.name;
  $("card-description").textContent = win.card.description;
  $("win-note").textContent = win.receipt ? "Minted · Token #" + win.receipt.token
    : win.pending ? "Claim reserved for " + win.pending.account + " on BNB Smart Chain Testnet."
    : "Saved in this browser. You can mint this card whenever you’re ready.";
  $("action").textContent = win.receipt ? "Card minted" : win.pending ? "Check mint status" : "Mint this card with MetaMask";
  if (!win.receipt) return;
  const r = win.receipt;
  $("receipt-network").textContent = BSC_TESTNET.chainName + " (97)";
  $("receipt-address").textContent = r.address;
  $("token").textContent = r.token;
  $("owner").textContent = r.owner;
  $("metadata").textContent = JSON.stringify(JSON.parse(cardMetadata(win.card)), null, 2);
  $("tx").textContent = "Recovered from the contract";
  if (r.hash) {
    const link = document.createElement("a");
    link.href = BSC_TESTNET.blockExplorerUrls[0] + "/tx/" + r.hash;
    link.textContent = r.hash; link.target = "_blank"; link.rel = "noopener noreferrer";
    $("tx").replaceChildren(link);
  }
}
async function run(task, area = "status") {
  if (busy) return;
  busy = true; render();
  try { await task(); }
  catch (error) { $(area).textContent = walletError(error, "tBNB"); }
  finally { busy = false; render(); }
}
async function spin() {
  if (win && !win.receipt && !window.confirm("Release " + win.card.name + " and spin for another card?")) return;
  const id = hexlify(randomBytes(32));
  const card = deck[drawCard(id, deck)];
  save({id, card});
  $("win").hidden = $("receipt").hidden = $("win-link").hidden = true;
  $("status").textContent = $("import-status").textContent = "";
  await revealRarity(card.rarity, card.name);
  render();
  $("win").scrollIntoView({block:"nearest"});
}
async function connect() {
  const wallet = getMetaMask();
  await wallet.request({method:"eth_requestAccounts"});
  await switchNetwork(wallet, 97);
  if (Number(await wallet.request({method:"eth_chainId"})) !== 97) throw Error("Select BNB Smart Chain Testnet in MetaMask.");
  const [selected] = await wallet.request({method:"eth_accounts"});
  if (!selected) throw Error("Choose an account in MetaMask.");
  return {wallet, account:getAddress(selected)};
}
async function verifyMint(provider, pending) {
  if (await provider.getCode(pending.address) === "0x") return false;
  const nft = new Contract(pending.address, artifact.abi, provider);
  const token = await nft.mintedToken(pending.account, win.id);
  if (!token) return false;
  const [owner, uri] = await Promise.all([nft.ownerOf(token), nft.tokenURI(token)]);
  const prefix = "data:application/json;base64,";
  if (!uri.startsWith(prefix)) throw Error("The contract returned an unreadable token URI. Keep the win and check its receipt.");
  const json = new TextDecoder().decode(Uint8Array.from(atob(uri.slice(prefix.length)), c => c.charCodeAt(0)));
  if (json !== cardMetadata(win.card)) throw Error("The token metadata differs from the winning card. Check the mint receipt.");
  // mintedToken is keyed by the original recipient. The token may have moved since minting.
  const receipt = {address:pending.address, token:String(token), owner, hash:pending.hash};
  localStorage.setItem(minterKey(pending.account), JSON.stringify({address:pending.address, winId:win.id}));
  save({...win, pending:null, receipt});
  $("status").textContent = "Mint confirmed. Use the receipt below to import your NFT.";
  render(); $("receipt").scrollIntoView({block:"nearest"});
  return true;
}
async function prepare(provider, account) {
  const nonce = await provider.getTransactionCount(account, "pending");
  const known = JSON.parse(localStorage.getItem(minterKey(account)));
  if (known && await provider.getCode(known.address) !== "0x") {
    const nft = new Contract(known.address, artifact.abi, provider);
    if (!await nft.mintedToken(account, known.winId)) throw Error("Could not verify the saved minter for this account.");
    return {account, address:known.address, nonce, create:false};
  }
  return {account, address:getCreateAddress({from:account, nonce}), nonce, create:true};
}
async function claim() {
  const {wallet, account} = await connect();
  if (win.pending && win.pending.account !== account) throw Error("Switch MetaMask back to " + win.pending.account + " to check this mint.");
  const provider = new BrowserProvider(wallet, undefined, {cacheTimeout:-1});
  try {
    const previous = win.pending;
    let pending = previous || await prepare(provider, account);
    if (previous) {
      const mined = pending.hash && await provider.getTransactionReceipt(pending.hash);
      if (mined?.status === 0) {
        save({...win, pending:null});
        throw Error("The previous transaction reverted. Your card is saved and ready to retry.");
      }
      if (mined?.contractAddress) pending = {...pending, address:mined.contractAddress};
      try { if (await verifyMint(provider, pending)) return; }
      catch (error) {
        const unrelatedCreation = pending.create && !mined && ["BAD_DATA", "CALL_EXCEPTION"].includes(error.code);
        if (!unrelatedCreation) throw error;
      }
      if (mined) throw Error("The transaction is mined. Check again when the RPC exposes its token state.");
      const latest = await provider.getTransactionCount(account, "latest");
      if (latest > pending.nonce) {
        // A replacement used this nonce. Its CREATE address and mint mapping have just been checked.
        save({...win, pending:null});
        throw Error("The previous transaction was replaced. Your card is ready to mint again.");
      }
      if (await provider.getTransactionCount(account, "pending") > pending.nonce) {
        $("status").textContent = "Transaction pending. Check again after confirmation in MetaMask."; return;
      }
      if (!window.confirm("No pending transaction is visible. Retry this same win using the original transaction nonce?")) return;
    }
    const json = cardMetadata(win.card);
    const factory = new ContractFactory(artifact.abi, artifact.bytecode);
    const tx = pending.create ? await factory.getDeployTransaction(win.id, json)
      : {to:pending.address, data:factory.interface.encodeFunctionData("mint", [win.id, json])};
    save({...win, pending});
    $("status").textContent = pending.create ? "Confirm your first mint and contract creation in MetaMask." : "Confirm your winning card in MetaMask.";
    let hash;
    try {
      hash = await wallet.request({method:"eth_sendTransaction", params:[{
        ...tx, from:account, chainId:"0x61", nonce:toQuantity(pending.nonce)
      }]});
    } catch (error) {
      if (!previous && (Number(error.code) === 4001 || error.code === "ACTION_REJECTED" || error.code === "INSUFFICIENT_FUNDS" || /insufficient funds/i.test(error.message))) save({...win, pending:null});
      throw error;
    }
    pending = {...pending, hash};
    save({...win, pending});
    $("status").textContent = "Submitted. Waiting for BNB Smart Chain Testnet confirmation…";
    const receipt = await provider.waitForTransaction(hash, 1, 60000);
    if (!receipt || receipt.status !== 1) {
      if (receipt?.status === 0) save({...win, pending:null});
      throw Error("Mint not confirmed. Check MetaMask activity. Your winning card is saved.");
    }
    if (receipt.from !== account) throw Error("Receipt sender differs from the selected account.");
    if (receipt.contractAddress) {
      pending = {...pending, address:receipt.contractAddress};
      save({...win, pending});
    }
    if (!await verifyMint(provider, pending)) throw Error("The mint is confirmed but token data is still loading. Check mint status.");
  } finally { provider.destroy(); }
}
async function importNft() {
  const {wallet, account} = await connect();
  const {address, token, owner} = win.receipt;
  if (account !== owner) throw Error("Select the owner account " + owner + " in MetaMask to import this NFT.");
  try {
    const added = await wallet.request({method:"wallet_watchAsset", params:{type:"ERC721", options:{address, tokenId:token}}});
    $("import-status").textContent = added ? "MetaMask accepted the NFT import." : "Import manually with the contract address and token ID above.";
  } catch (error) {
    if (Number(error.code) === 4001) throw error;
    $("import-status").textContent = "This MetaMask version could not add the NFT automatically. Use its NFT import form and the details above.";
  }
}
$("spin").onclick = () => run(spin, "deck-status");
$("action").onclick = () => run(claim);
$("import").onclick = () => run(importNft, "import-status");
window.addEventListener("storage", e => { if (!e.key || e.key === STORE) location.reload(); });
window.addEventListener("pageshow", e => { if (e.persisted) location.reload(); });

try {
  deck = readDeck();
  win = restoreWin();
  $("deck-status").textContent = deck.length ? deck.length + (deck.length === 1 ? " card in your deck" : " cards in your deck") : "Finish editing your first deck to unlock the wheel.";
  $("deck-summary").textContent = deck.length ? "Each spin draws from the rarities in your saved collection. Cards within a rarity share its chance equally." : "Add artwork, a name, a description and a rarity to each card. Finish editing when your collection is ready.";
  initRoulette(deck);
  if (win) revealRarity(win.card.rarity, win.card.name, false);
} catch (error) { $("deck-status").textContent = error.message; }
render();
