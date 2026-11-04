import assert from "node:assert/strict";
import { test } from "node:test";
import { BrowserProvider, ContractFactory, parseEther } from "ethers";
import hre from "hardhat";
import artifact from "../artifacts/PaidGachaDemo.json" with { type: "json" };

test("paid demo mint charges exactly 0.0001 native token and uses the fixed URI", async () => {
  hre.network.config.chainId = 84532;
  const provider = new BrowserProvider(hre.network.provider, undefined, {cacheTimeout:-1});
  const owner = await provider.getSigner(0);
  const other = await provider.getSigner(1);
  const factory = new ContractFactory(artifact.abi, artifact.bytecode, owner);
  const game = await factory.deploy();
  await game.waitForDeployment();
  const price = parseEther("0.0001");

  await assert.rejects(game.roll.staticCall(0), error =>
    error.data === factory.interface.encodeErrorResult("IncorrectPayment", [0]));
  const receipt = await (await game.connect(other).roll(3, {value: price})).wait();
  assert.equal(await game.ownerOf(0), await other.getAddress());
  assert.equal(await game.outcomeOf(0), 3n);
  assert.equal(await game.tokenURI(0), await game.CARD_URI());
  assert.equal(await provider.getBalance(await game.getAddress()), price);
  const rolled = game.interface.parseLog(receipt.logs[2]);
  assert.equal(rolled.name, "Rolled");
  assert.deepEqual([...rolled.args], [await other.getAddress(), 0n, 3n]);

  await (await game.roll(0, {value: price})).wait();
  assert.equal(await game.outcomeOf(1), 0n);
  assert.equal(await game.tokenURI(1), await game.CARD_URI());

  await assert.rejects(game.connect(other).withdraw());
  await (await game.withdraw()).wait();
  assert.equal(await provider.getBalance(await game.getAddress()), 0n);
});
