import assert from "node:assert/strict";
import { before, test } from "node:test";
import { BrowserProvider, ContractFactory, ZeroHash, id, parseEther } from "ethers";
import hre from "hardhat";
import artifact from "../artifacts/Gacha.json" with { type: "json" };
import { cardMetadataUri } from "../web/cards.js";

let game, factory, player, other, provider;
const firstWin = id("first win");
const firstUri = cardMetadataUri({name:"First card", description:"A winner", image:"https://example.com/card.png", rarity:0});
const price = parseEther("0.0001");

before(async () => {
  hre.network.config.chainId = 84532;
  provider = new BrowserProvider(hre.network.provider);
  player = await provider.getSigner(0);
  other = await provider.getSigner(1);
  factory = new ContractFactory(artifact.abi, artifact.bytecode, player);
  game = await factory.deploy(firstWin, firstUri, {value:price});
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
  await expectRevert(game.mint.staticCall(firstWin, cardMetadataUri({name:"Edited", description:"No", image:"https://example.com/card.png", rarity:0}), {value:price}), "AlreadyMinted", [1]);
  await (await game.transferFrom(from, to, 1n)).wait();
  assert.equal(await game.ownerOf(1n), to);
  assert.equal(await game.mintedToken(from, firstWin), 1n);
  assert.equal(await game.tokenURI(1n), firstUri);
  await expectRevert(game.mint.staticCall(firstWin, firstUri, {value:price}), "AlreadyMinted", [1]);
});

test("the same win identifier can be used independently by another account", async () => {
  const recipient = await other.getAddress();
  const uri = cardMetadataUri({name:"Second card", description:"Another winner", image:"https://example.com/other.png", rarity:3});
  assert.equal(await game.mintedToken(recipient, firstWin), 0n);
  await (await game.connect(other).mint(firstWin, uri, {value:price})).wait();
  const token = await game.mintedToken(recipient, firstWin);
  assert.ok(token > 1n);
  assert.equal(await game.ownerOf(token), recipient);
  assert.equal(await game.tokenURI(token), uri);
  await expectRevert(game.connect(other).mint.staticCall(firstWin, uri, {value:price}), "AlreadyMinted", [token]);
});

test("deployment and later mints reject unusable IDs and metadata URIs", async () => {
  const win = id("input validation");
  for (const submit of [(key, uri) => factory.deploy(key, uri, {value:price}), (key, uri) => game.mint(key, uri, {value:price})]) {
    await expectRevert(submit(ZeroHash, firstUri), "InvalidWinId", []);
    for (const uri of ["", "http://example.com/card.json", "ipfs://bafytest", "https://example.com/card.json", "data:application/json;base64,", "data:application/json;base64," + "a".repeat(10925)]) {
      await expectRevert(submit(win, uri), "InvalidMetadataURI", []);
    }
  }
  await (await game.mint(win, firstUri, {value:price})).wait();
  assert.ok(await game.mintedToken(await player.getAddress(), win) > 0n);
  await assert.rejects(game.tokenURI(0));
  await expectRevert(game.mint.staticCall(id("unpaid"), firstUri), "IncorrectPayment", [0]);
  await expectRevert(game.mint.staticCall(id("overpaid"), firstUri, {value:price + 1n}), "IncorrectPayment", [price + 1n]);
  await assert.rejects(game.connect(other).withdraw());
  await (await game.withdraw()).wait();
  assert.equal(await provider.getBalance(await game.getAddress()), 0n);
});

