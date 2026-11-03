export const BSC_TESTNET = {
  chainId: "0x61",
  chainName: "BNB Smart Chain Testnet",
  nativeCurrency: { name: "Test BNB", symbol: "tBNB", decimals: 18 },
  rpcUrls: ["https://bsc-testnet-dataseed.bnbchain.org"],
  blockExplorerUrls: ["https://testnet.bscscan.com"]
};

export function walletError(error, gasToken) {
  const code = error.info?.error?.code ?? error.code;
  if (code === 4001 || code === "ACTION_REJECTED") return "You declined the wallet request. Try again when ready.";
  if (code === -32002) return "Your wallet already has a request open. Check the wallet popup.";
  if (code === "INSUFFICIENT_FUNDS" || /insufficient funds/i.test(error.message))
    return "Your wallet needs " + gasToken + " for gas on this network.";
  if (/unexpected error|selectExtension/i.test(error.message ?? ""))
    return "The extension could not complete the request. Unlock MetaMask and reconnect.";
  return error.shortMessage || error.message || "Wallet request failed. Check the network and try again.";
}

let announcedMetaMask;
function discoverMetaMask() {
  window.addEventListener("eip6963:announceProvider", rememberMetaMask);
  window.dispatchEvent(new Event("eip6963:requestProvider"));
}
function rememberMetaMask({ detail }) {
  if (detail?.info?.rdns === "io.metamask" && typeof detail.provider?.request === "function") {
    announcedMetaMask = detail.provider;
  }
}
// Discovery handles extensions that announce after startup. Account access waits for Mint.
if (typeof window !== "undefined") discoverMetaMask();

export function getMetaMask() {
  if (!announcedMetaMask) discoverMetaMask();
  if (announcedMetaMask) return announcedMetaMask;
  // Older versions of MetaMask expose the inpage API and its _metamask object.
  const injected = window.ethereum;
  const legacy = (injected?.providers ?? [injected]).find(p =>
    p?.isMetaMask && p._metamask && !p.isBraveWallet && typeof p.request === "function");
  if (legacy) return legacy;
  throw Error("Open this game in a browser with MetaMask enabled and unlock your account.");
}

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
