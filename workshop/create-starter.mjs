import { cp, mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { resolve, join } from "node:path";

const destination = process.argv[2];
if (!destination) throw new Error("Use: node workshop/create-starter.mjs PATH_TO_NEW_PROJECT");

const root = resolve(import.meta.dirname, "..");
const target = resolve(destination);
if (target === root || target.startsWith(root + "\\") || target.startsWith(root + "/")) {
  throw new Error("Choose a new folder outside this reference repository, such as ../my-gacha.");
}
try {
  await stat(target);
  throw new Error("Destination already exists: " + target);
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}

await mkdir(target, { recursive: true });
for (const item of [
  "app", "contracts", "scripts", "test", "web", "package.json", "package-lock.json",
  "hardhat.config.cjs", "next.config.mjs", ".gitignore", "AGENTS.md", "README.md",
  "IMPLEMENTATION_PLAN.md"
]) {
  await cp(join(root, item), join(target, item), { recursive: true });
}
await mkdir(join(target, "workshop", "exercises"), { recursive: true });
await cp(join(root, "workshop", "exercises", "inspect-token.mjs"),
  join(target, "workshop", "exercises", "inspect-token.mjs"));
for (const guide of ["PARTICIPANT.md", "FACILITATOR.md"]) {
  await cp(join(root, "workshop", guide), join(target, "workshop", guide));
}

async function replace(file, from, to, placeholder) {
  const path = join(target, file);
  const source = await readFile(path, "utf8");
  const start = source.indexOf(from);
  const end = source.indexOf(to, start + from.length);
  if (start < 0 || end < 0 || source.indexOf(from, start + from.length) >= 0) {
    throw new Error("Starter marker drifted in " + file);
  }
  await writeFile(path, source.slice(0, start) + placeholder + source.slice(end));
}

await replace("contracts/Gacha.sol", "    function _mintCard(", "    function tokenURI(", `    function _mintCard(bytes32 winId, string memory metadataJson) private returns (uint256 tokenId) {
        // TODO 1: validate, remember and mint this win.
        revert("Complete _mintCard in the README");
    }

`);
await replace("contracts/Gacha.sol", "    function tokenURI(", "\n}", `    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        // TODO 2: return this token's base64-encoded JSON data URI.
        _requireOwned(tokenId);
        return "";
    }`);
await replace("web/cards.js", "export function cardMetadata(", "export function validateCard(", `export function cardMetadata(card) {
  // TODO 3: encode name, description, image and Rarity attribute as JSON.
  throw Error("Complete cardMetadata in the README");
}

`);
await replace("web/cards.js", "export function availableWeights(", "\n}", `export function availableWeights(cards) {
  // TODO 4: use a tier's weight only when the deck contains that tier.
  throw Error("Complete availableWeights in the README");
`);
await replace("web/cards.js", "export function drawCard(", "\n}", `export function drawCard(randomHex, cards) {
  // TODO 5: draw a represented rarity, then one card from that rarity.
  throw Error("Complete drawCard in the README");
`);
await replace("web/wallet.js", "export async function switchNetwork(", "\n}", `export async function switchNetwork(wallet, target) {
  // TODO 6: switch MetaMask to chain 97, adding the network if missing.
  throw Error("Complete switchNetwork in the README");
`);
await replace("web/main.js", "async function connect() {", "async function verifyMint(", `async function connect() {
  // TODO 7: request MetaMask accounts, select chain 97, and return wallet + account.
  throw Error("Complete connect in the README");
}
`);

console.log("Created starter at " + target);
console.log("Open its README.md and begin at Step 3.");
