import { existsSync, readFileSync, mkdirSync, writeFileSync } from "node:fs";
import solc from "solc";

const contracts = [["Gacha", "contracts/Gacha.sol"]];
if (existsSync("examples/PaidGachaDemo.sol")) contracts.push(["PaidGachaDemo", "examples/PaidGachaDemo.sol"]);
const input = {
  language: "Solidity",
  sources: Object.fromEntries(contracts.map(([, source]) => [
    source, { content: readFileSync(source, "utf8") }
  ])),
  settings: {
    evmVersion: "cancun",
    optimizer: { enabled: true, runs: 200 },
    outputSelection: { "*": { "*": ["abi", "evm.bytecode.object"] } }
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
mkdirSync("artifacts", { recursive: true });
for (const [name, source] of contracts) {
  const contract = result.contracts[source][name];
  writeFileSync(`artifacts/${name}.json`, JSON.stringify({
    abi: contract.abi,
    bytecode: "0x" + contract.evm.bytecode.object
  }, null, 2) + "\n");
  console.log(`Compiled ${name} → artifacts/${name}.json`);
}
