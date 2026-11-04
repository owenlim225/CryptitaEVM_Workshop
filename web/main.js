import { BrowserProvider, Contract, ContractFactory, getAddress, getCreateAddress, hexlify, parseEther, randomBytes, toQuantity } from "ethers";
import artifact from "../artifacts/Gacha.json";
import { readDeck, cardMetadata, drawCard } from "./cards.js";
import { BASE_SEPOLIA, getMetaMask, switchNetwork, walletError } from "./wallet.js";
import { initRoulette, resetRoulette, revealRarity } from "./roulette.js";
import { showResultCard } from "./components/result-card.jsx";

const STORE = "cryptita.player-win.v3.84532";
const minterKey = account => "cryptita.player-minter.v3.84532." + account;
const SPIN_PRICE = parseEther("0.0001");
const $ = id => document.getElementById(id);
let deck = [], win, busy = false, connectedWallet, connectedAccount, observedWallet;

function save(next) {
  try { localStorage.setItem(STORE, JSON.stringify(next)); }
  catch { throw Error("Allow site storage to keep the card and its mint receipt."); }
  win = next;
}
function restoreWin() {
  const current = localStorage.getItem(STORE);
  return current ? JSON.parse(current) : undefined;
}
function render() {
  $("spin").hidden = !deck.length;
  $("spin").disabled = busy || !connectedAccount;
  $("spin").textContent = win?.pending ? "Check spin status" : win && !win.receipt ? "Retry paid spin" : win ? "Spin again · 0.0001 ETH" : "Pay & spin · 0.0001 ETH";
  $("connect-wallet").hidden = !!connectedAccount;
  $("connect-wallet").disabled = busy;
  $("wallet-address").hidden = !connectedAccount;
  $("wallet-address").textContent = connectedAccount || "";
  $("disconnect-wallet").hidden = !connectedAccount;
  $("disconnect-wallet").disabled = busy;
  $("edit").textContent = deck.length ? "Edit collection" : "Create a collection";
  $("edit").className = deck.length ? "jump" : "button-link";
  $("win-link").hidden = !win?.receipt;
  $("receipt").hidden = !win?.receipt;
  $("import").disabled = busy;
  if (!win) return;
  if (!win.receipt) return;
  showResultCard(win.card);
  const r = win.receipt;
  $("receipt-network").textContent = BASE_SEPOLIA.chainName + " (84532)";
  $("receipt-address").textContent = r.address;
  $("token").textContent = r.token;
  $("owner").textContent = r.owner;
  $("metadata").textContent = JSON.stringify(JSON.parse(cardMetadata(win.card)), null, 2);
  $("tx").textContent = "Recovered from the contract";
  if (r.hash) {
    const link = document.createElement("a");
    link.href = BASE_SEPOLIA.blockExplorerUrls[0] + "/tx/" + r.hash;
    link.textContent = r.hash; link.target = "_blank"; link.rel = "noopener noreferrer";
    $("tx").replaceChildren(link);
  }
}
async function run(task, area = "deck-status") {
  if (busy) return;
  busy = true; render();
  try { await task(); }
  catch (error) { $(area).textContent = walletError(error, "test ETH"); }
  finally { busy = false; render(); }
}
async function spin() {
  await currentWallet();
  if (!win || win.receipt || !win.metadataUri) {
    const response = await fetch("/api/metadata");
    if (!response.ok) throw Error((await response.json()).error || "Pinata setup is unavailable.");
  }
  if (!win || win.receipt) {
    const id = hexlify(randomBytes(32));
    save({id, card:deck[drawCard(id, deck)]});
    $("import-status").textContent = "";
    resetRoulette();
    render();
  }
  await claim();
}
async function connect() {
  const wallet = getMetaMask();
  await wallet.request({method:"eth_requestAccounts"});
  await switchNetwork(wallet, 84532);
  if (Number(await wallet.request({method:"eth_chainId"})) !== 84532) throw Error("Select Base Sepolia in MetaMask.");
  const [selected] = await wallet.request({method:"eth_accounts"});
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
async function disconnect() {
  await connectedWallet.request({method:"wallet_revokePermissions", params:[{eth_accounts:{}}]});
  connectedWallet = undefined;
  connectedAccount = undefined;
  render();
}
async function currentWallet() {
  if (!connectedWallet || !connectedAccount) throw Error("Connect your wallet before spinning.");
  const wallet = connectedWallet;
  const account = connectedAccount;
  await switchNetwork(wallet, 84532);
  const [selected] = await wallet.request({method:"eth_accounts"});
  if (!selected || getAddress(selected) !== account) {
    connectedWallet = undefined;
    connectedAccount = undefined;
    throw Error("Wallet account changed. Connect again before spinning.");
  }
  return {wallet, account};
}
async function verifyMint(provider, pending) {
  if (await provider.getCode(pending.address) === "0x") return false;
  const nft = new Contract(pending.address, artifact.abi, provider);
  const token = await nft.mintedToken(pending.account, win.id);
  if (!token) return false;
  const [owner, uri] = await Promise.all([nft.ownerOf(token), nft.tokenURI(token)]);
  if (uri !== win.metadataUri) throw Error("The token URI differs from the uploaded winning card. Check the mint receipt.");
  const response = await fetch(uri);
  if (!response.ok) throw Error("The uploaded metadata is not available yet. Check spin status again shortly.");
  const json = await response.text();
  if (json !== cardMetadata(win.card)) throw Error("The token metadata differs from the winning card. Check the mint receipt.");
  // mintedToken is keyed by the original recipient. The token may have moved since minting.
  const receipt = {address:pending.address, token:String(token), owner, hash:pending.hash};
  localStorage.setItem(minterKey(pending.account), JSON.stringify({address:pending.address, winId:win.id}));
  save({...win, pending:null, receipt});
  $("deck-status").textContent = "Paid mint confirmed. Your wallet owns the NFT.";
  render();
  return true;
}
async function showMintedResult(wallet, account) {
  await offerImport(wallet, account);
  await revealRarity(win.card.rarity, win.card.name);
  $("result-dialog").showModal();
}
async function prepare(provider, account) {
  const nonce = await provider.getTransactionCount(account, "pending");
  const known = JSON.parse(localStorage.getItem(minterKey(account)));
  if (known && await provider.getCode(known.address) !== "0x") {
    const nft = new Contract(known.address, artifact.abi, provider);
    const previousToken = await nft.mintedToken(account, known.winId);
    if (!previousToken) throw Error("Could not verify the saved minter for this account.");
    if (!(await nft.tokenURI(previousToken)).startsWith("https://")) {
      return {account, address:getCreateAddress({from:account, nonce}), nonce, create:true};
    }
    return {account, address:known.address, nonce, create:false};
  }
  return {account, address:getCreateAddress({from:account, nonce}), nonce, create:true};
}
async function claim() {
  const {wallet, account} = await currentWallet();
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
      try { if (await verifyMint(provider, pending)) { await showMintedResult(wallet, account); return; } }
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
        $("deck-status").textContent = "Transaction pending. Check again after confirmation in MetaMask."; return;
      }
      if (!window.confirm("No pending transaction is visible. Retry this same win using the original transaction nonce?")) return;
    }
    let metadataUri = win.metadataUri;
    if (!metadataUri) {
      $("deck-status").textContent = "Preparing card metadata on IPFS…";
      const response = await fetch("/api/metadata", {
        method:"POST", headers:{"Content-Type":"application/json"}, body:cardMetadata(win.card)
      });
      const result = await response.json();
      if (!response.ok) throw Error(result.error || "Metadata upload failed.");
      metadataUri = result.uri;
      save({...win, metadataUri});
    }
    const factory = new ContractFactory(artifact.abi, artifact.bytecode);
    const tx = pending.create ? await factory.getDeployTransaction(win.id, metadataUri)
      : {to:pending.address, data:factory.interface.encodeFunctionData("mint", [win.id, metadataUri])};
    save({...win, pending});
    $("deck-status").textContent = pending.create ? "Confirm 0.0001 test ETH plus gas to create your collection and mint." : "Confirm 0.0001 test ETH plus gas to mint your card.";
    let hash;
    try {
      hash = await wallet.request({method:"eth_sendTransaction", params:[{
        ...tx, from:account, chainId:BASE_SEPOLIA.chainId, nonce:toQuantity(pending.nonce), value:toQuantity(SPIN_PRICE)
      }]});
    } catch (error) {
      if (!previous && (Number(error.code) === 4001 || error.code === "ACTION_REJECTED" || error.code === "INSUFFICIENT_FUNDS" || /insufficient funds/i.test(error.message))) save({...win, pending:null});
      throw error;
    }
    pending = {...pending, hash};
    save({...win, pending});
    $("deck-status").textContent = "Submitted. Waiting for Base Sepolia confirmation…";
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
    if (!await verifyMint(provider, pending)) throw Error("The mint is confirmed but token data is still loading. Check spin status.");
    await showMintedResult(wallet, account);
  } finally { provider.destroy(); }
}
async function offerImport(wallet, account) {
  const {address, token, owner} = win.receipt;
  if (account !== owner) {
    $("import-status").textContent = "The NFT has moved to " + owner + ". Import it in that wallet if needed.";
    return;
  }
  try {
    const added = await wallet.request({method:"wallet_watchAsset", params:{type:"ERC721", options:{address, tokenId:token}}});
    $("import-status").textContent = added ? "MetaMask accepted the NFT import." : "Import manually with the contract address and token ID above.";
  } catch (error) {
    $("import-status").textContent = Number(error.code) === 4001 ? "NFT import declined. You can add it later with the details above." : "MetaMask could not add the NFT automatically. Use its NFT import form and the details above.";
  }
}
async function importNft() {
  const {wallet, account} = await currentWallet();
  await offerImport(wallet, account);
}
$("connect-wallet").onclick = () => run(connect);
$("disconnect-wallet").onclick = () => run(disconnect);
$("spin").onclick = () => run(spin);
$("import").onclick = () => run(importNft, "import-status");
$("win-link").onclick = () => $("result-dialog").showModal();
$("close-result").onclick = () => $("result-dialog").close();
window.addEventListener("storage", e => { if (!e.key || e.key === STORE) location.reload(); });
window.addEventListener("pageshow", e => { if (e.persisted) location.reload(); });

try {
  deck = readDeck();
  win = restoreWin();
  $("deck-status").textContent = deck.length ? deck.length + (deck.length === 1 ? " card in your deck" : " cards in your deck") : "Finish editing your first deck to unlock the wheel.";
  $("deck-summary").textContent = deck.length ? "Each spin draws from the rarities in your saved collection. Cards within a rarity share its chance equally." : "Add artwork, a name, a description and a rarity to each card. Finish editing when your collection is ready.";
  initRoulette(deck);
  if (win?.receipt) revealRarity(win.card.rarity, win.card.name, false);
  else if (win) resetRoulette();
} catch (error) { $("deck-status").textContent = error.message; }
render();
