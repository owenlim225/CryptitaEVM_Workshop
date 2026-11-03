import assert from "node:assert/strict";
import { test } from "node:test";
import { BrowserProvider, ContractFactory } from "ethers";
import hre from "hardhat";
import artifact from "../artifacts/Gacha.json" with { type: "json" };

test("the constructor refuses deployment on BSC mainnet (simulated chain 56)", async () => {
  hre.network.config.chainId = 56;
  const provider = new BrowserProvider(hre.network.provider);
  const factory = new ContractFactory(artifact.abi, artifact.bytecode, await provider.getSigner());
  await assert.rejects(factory.deploy("0x" + "01".repeat(32), "{}"), (error) => {
    assert.equal(error.code, "CALL_EXCEPTION");
    assert.equal(error.data, factory.interface.encodeErrorResult("UnsupportedChain", [56]));
    return true;
  });
});


