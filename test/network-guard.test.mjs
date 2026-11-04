import assert from "node:assert/strict";
import { test } from "node:test";
import { BrowserProvider, ContractFactory } from "ethers";
import hre from "hardhat";
import artifact from "../artifacts/Gacha.json" with { type: "json" };

test("the constructor refuses deployment on Base mainnet (simulated chain 8453)", async () => {
  hre.network.config.chainId = 8453;
  const provider = new BrowserProvider(hre.network.provider);
  const factory = new ContractFactory(artifact.abi, artifact.bytecode, await provider.getSigner());
  await assert.rejects(factory.deploy("0x" + "01".repeat(32), "https://example.com/card.json"), (error) => {
    assert.equal(error.code, "CALL_EXCEPTION");
    assert.equal(error.data, factory.interface.encodeErrorResult("UnsupportedChain", [8453]));
    return true;
  });
});


