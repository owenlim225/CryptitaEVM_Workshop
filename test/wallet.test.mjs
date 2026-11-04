import assert from "node:assert/strict";
import { test } from "node:test";
import { getMetaMask, switchNetwork } from "../web/wallet.js";

test("MetaMask is selected when another extension also announces or owns window.ethereum", () => {
  const events = new EventTarget();
  globalThis.window = events;
  Object.defineProperty(events, "ethereum", { get() { throw Error("Conflicting global provider"); } });
  const wallets = ["com.brave.wallet", "io.metamask"].map(rdns => ({
    info: { rdns }, provider: { request() { throw Error("Discovery must not send wallet requests"); } }
  }));
  events.addEventListener("eip6963:requestProvider", () => {
    for (const detail of wallets) events.dispatchEvent(new CustomEvent("eip6963:announceProvider", {detail}));
  });
  assert.equal(getMetaMask(), wallets[1].provider);
});

test("a wallet missing Base Sepolia gets chain 84532 with test currency and explorer", async () => {
  const calls = [];
  let added = false;
  let active = "0x38";
  const wallet = { async request({ method, params }) {
    calls.push(method);
    if (method === "eth_chainId") return active;
    if (method === "wallet_addEthereumChain") {
      assert.equal(params[0].chainId, "0x14a34");
      assert.equal(params[0].nativeCurrency.symbol, "ETH");
      assert.deepEqual(params[0].blockExplorerUrls, ["https://sepolia.basescan.org"]);
      added = true;
    } else if (!added) {
      throw Object.assign(Error("Unrecognized chain"), { code: 4902 });
    } else {
      active = params[0].chainId;
    }
  } };
  await switchNetwork(wallet, 84532);
  assert.deepEqual(calls, ["eth_chainId", "wallet_switchEthereumChain", "wallet_addEthereumChain", "wallet_switchEthereumChain", "eth_chainId"]);
});
