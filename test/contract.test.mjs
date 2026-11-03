import assert from "node:assert/strict";
import { before, test } from "node:test";
import { BrowserProvider, ContractFactory, ZeroHash, id } from "ethers";
import hre from "hardhat";
import artifact from "../artifacts/Gacha.json" with { type: "json" };

let game, factory, player, other;
const firstWin = id("first win");
const firstUri = "ipfs://bafybeigdyrzt5n5vy7z4hxgqstnqzz6p4d2t2qxj5qj3g5mbr4qle3x3yy";

before(async () => {
  hre.network.config.chainId = 97;
  const provider = new BrowserProvider(hre.network.provider);
  player = await provider.getSigner(0);
  other = await provider.getSigner(1);
  factory = new ContractFactory(artifact.abi, artifact.bytecode, player);
  game = await factory.deploy(firstWin, firstUri);
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
  await expectRevert(game.mint.staticCall(firstWin, "ipfs://bafyedited"), "AlreadyMinted", [1]);
  await (await game.transferFrom(from, to, 1n)).wait();
  assert.equal(await game.ownerOf(1n), to);
  assert.equal(await game.mintedToken(from, firstWin), 1n);
  assert.equal(await game.tokenURI(1n), firstUri);
  await expectRevert(game.mint.staticCall(firstWin, firstUri), "AlreadyMinted", [1]);
});

test("the same win identifier can be used independently by another account", async () => {
  const recipient = await other.getAddress();
  const uri = "ipfs://bafybeih2ejr7xgpgbnpk7j2tlpshrz5t6w5v32xvr6jeyg2p6x6cy6s6ia";
  assert.equal(await game.mintedToken(recipient, firstWin), 0n);
  await (await game.connect(other).mint(firstWin, uri)).wait();
  const token = await game.mintedToken(recipient, firstWin);
  assert.ok(token > 1n);
  assert.equal(await game.ownerOf(token), recipient);
  assert.equal(await game.tokenURI(token), uri);
  await expectRevert(game.connect(other).mint.staticCall(firstWin, uri), "AlreadyMinted", [token]);
});

test("deployment and later mints reject unusable IDs and metadata URIs", async () => {
  const win = id("input validation");
  for (const submit of [(key, uri) => factory.deploy(key, uri), (key, uri) => game.mint(key, uri)]) {
    await expectRevert(submit(ZeroHash, firstUri), "InvalidWinId", []);
    for (const uri of ["", "https://example.com/card.json", "ipfs://", "ipfs://" + "a".repeat(122)]) {
      await expectRevert(submit(win, uri), "InvalidMetadataURI", []);
    }
  }
  await (await game.mint(win, firstUri)).wait();
  assert.ok(await game.mintedToken(await player.getAddress(), win) > 0n);
  await assert.rejects(game.tokenURI(0));
  await assert.rejects(game.mint(id("paid"), firstUri, { value: 1n }));
});

