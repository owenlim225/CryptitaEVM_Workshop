import { readFile } from "node:fs/promises";
import { Contract, JsonRpcProvider, getAddress } from "ethers";

const [, , address, tokenId] = process.argv;
if (!address || !/^\d+$/.test(tokenId ?? "")) {
  throw new Error("Use: node workshop/exercises/inspect-token.mjs CONTRACT_ADDRESS TOKEN_ID");
}

const rpcUrl = process.env.WORKSHOP_RPC_URL || "https://bsc-testnet-dataseed.bnbchain.org";
const provider = new JsonRpcProvider(rpcUrl);
try {
  if ((await provider.getNetwork()).chainId !== 97n) throw new Error("Select BNB Smart Chain Testnet (97).");
  const artifact = JSON.parse(await readFile(new URL("../../artifacts/Gacha.json", import.meta.url), "utf8"));
  const contract = new Contract(getAddress(address), artifact.abi, provider);
  const card = await readCard(contract, BigInt(tokenId));
  console.log({ chainId: 97, contract: contract.target, tokenId, ...card });
} finally {
  provider.destroy();
}

async function readCard(contract, id) {
  // TODO: Read ownerOf(id) and tokenURI(id), then fetch the JSON from IPFS.
  // Return the owner, name, description, image URI and Rarity attribute.
  throw new Error("Complete readCard in module 7 of the participant guide");
}
