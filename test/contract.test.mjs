import assert from "node:assert/strict";
import { before, test } from "node:test";
import { BrowserProvider, ContractFactory, ZeroHash, id } from "ethers";
import hre from "hardhat";
import artifact from "../artifacts/Gacha.json" with { type: "json" };

let game, factory, player, other;
const firstWin = id("first win");
const firstCard = JSON.stringify({ name: "Lantern", description: "An illustrated card." });

before(async () => {
  hre.network.config.chainId = 97;
  const provider = new BrowserProvider(hre.network.provider);
  player = await provider.getSigner(0);
  other = await provider.getSigner(1);
  factory = new ContractFactory(artifact.abi, artifact.bytecode, player);
  game = await factory.deploy(firstWin, firstCard);
  await game.waitForDeployment();
});

function expectRevert(operation, name, args) {
  return assert.rejects(operation, (error) => {
    assert.equal(error.code, "CALL_EXCEPTION");
    assert.equal(error.data, factory.interface.encodeErrorResult(name, args));
    return true;
  });
}

test("recovering a previous win returns its original token, even after a transfer", async () => {
  const from = await player.getAddress();
  const to = await other.getAddress();
  assert.equal(await game.mintedToken(from, firstWin), 1n);
  await expectRevert(game.mint.staticCall(firstWin, '{"name":"edited"}'), "AlreadyMinted", [1]);
  await (await game.transferFrom(from, to, 1n)).wait();
  assert.equal(await game.ownerOf(1n), to);
  assert.equal(await game.mintedToken(from, firstWin), 1n);
  assert.equal(await game.tokenURI(1n), "data:application/json;base64," + Buffer.from(firstCard).toString("base64"));
  await expectRevert(game.mint.staticCall(firstWin, firstCard), "AlreadyMinted", [1]);
});

test("the same win identifier can be used independently by another account", async () => {
  const recipient = await other.getAddress();
  const card = JSON.stringify({ name: "Second learner", attributes: [{ trait_type: "Rarity", value: "UR" }] });
  assert.equal(await game.mintedToken(recipient, firstWin), 0n);
  await (await game.connect(other).mint(firstWin, card)).wait();
  const token = await game.mintedToken(recipient, firstWin);
  assert.ok(token > 1n);
  assert.equal(await game.ownerOf(token), recipient);
  assert.equal(await game.tokenURI(token), "data:application/json;base64," + Buffer.from(card).toString("base64"));
  await expectRevert(game.connect(other).mint.staticCall(firstWin, card), "AlreadyMinted", [token]);
});

test("deployment and later mints reject unusable IDs and out-of-range UTF-8 byte lengths", async () => {
  const win = id("input validation");
  const tooLong = "é".repeat(4096) + "!";
  for (const submit of [(key, json) => factory.deploy(key, json), (key, json) => game.mint(key, json)]) {
    await expectRevert(submit(ZeroHash, firstCard), "InvalidWinId", []);
    await expectRevert(submit(win, ""), "InvalidMetadataSize", [0]);
    await expectRevert(submit(win, tooLong), "InvalidMetadataSize", [8193]);
  }
  const atLimit = JSON.stringify("é".repeat(4095));
  assert.equal(Buffer.byteLength(atLimit), 8192);
  await (await game.mint(win, atLimit)).wait();
  assert.ok(await game.mintedToken(await player.getAddress(), win) > 0n);
  await assert.rejects(game.tokenURI(0));
  await assert.rejects(game.mint(id("paid"), firstCard, { value: 1n }));
});

