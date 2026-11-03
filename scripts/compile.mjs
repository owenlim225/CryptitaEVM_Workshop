import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import solc from "solc";

const source = "contracts/Gacha.sol";
const input = {
  language: "Solidity",
  sources: { [source]: { content: readFileSync(source, "utf8") } },
  settings: {
    evmVersion: "cancun",
    optimizer: { enabled: true, runs: 200 },
    outputSelection: { "*": { "Gacha": ["abi", "evm.bytecode.object"] } }
  }
};

const result = JSON.parse(solc.compile(JSON.stringify(input), {
  import(path) {
    try {
      return { contents: readFileSync("node_modules/" + path, "utf8") };
    } catch {
      return { error: "Missing Solidity import " + path };
    }
  }
}));
for (const item of result.errors ?? []) console.error(item.formattedMessage);
if (result.errors?.some((item) => item.severity === "error")) process.exit(1);
const contract = result.contracts[source].Gacha;
mkdirSync("artifacts", { recursive: true });
writeFileSync("artifacts/Gacha.json", JSON.stringify({
  abi: contract.abi,
  bytecode: "0x" + contract.evm.bytecode.object
}, null, 2) + "\n");
console.log("Compiled Gacha → artifacts/Gacha.json");
