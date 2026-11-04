import assert from "node:assert/strict";
import { test } from "node:test";
import { BrowserProvider, ContractFactory, ZeroAddress, id } from "ethers";
import hre from "hardhat";
import artifact from "../artifacts/Gacha.json" with { type: "json" };

test("the first wallet confirmation deploys and mints, the next mints into that same collection", async () => {
  hre.network.config.chainId = 97;
  const provider = new BrowserProvider(hre.network.provider);
  const player = await provider.getSigner();
  const recipient = await player.getAddress();
  const first = "https://ivory-additional-snail-831.mypinata.cloud/ipfs/bafkreibc7d3vnc24vsg3inh6s6qh6d2xlfhd62fexxt3n5pxtuoshsk7be";
  const next = "https://ivory-additional-snail-831.mypinata.cloud/ipfs/bafybeih2ejr7xgpgbnpk7j2tlpshrz5t6w5v32xvr6jeyg2p6x6cy6s6ia";
  const collection = await new ContractFactory(artifact.abi, artifact.bytecode, player).deploy(id("win 1"), first);
  const address = await collection.getAddress();
  const creation = await collection.deploymentTransaction().wait();
  assert.equal(creation.to, null);
  assert.equal(creation.contractAddress, address);
  const nextMint = await (await collection.mint(id("win 2"), next)).wait();
  assert.equal(nextMint.to, address);
  assert.equal(nextMint.contractAddress, null);

  for (const [receipt, win, token, uri] of [
    [creation, "win 1", 1n, first], [nextMint, "win 2", 2n, next]
  ]) {
    assert.equal(receipt.logs.length, 2);
    assert.equal(receipt.logs[0].address, address);
    const transfer = collection.interface.parseLog(receipt.logs[0]);
    assert.equal(transfer.name, "Transfer");
    assert.deepEqual([...transfer.args], [ZeroAddress, recipient, token]);
    const update = collection.interface.parseLog(receipt.logs[1]);
    assert.equal(update.name, "MetadataUpdate");
    assert.equal(update.args[0], token);
    assert.equal(await collection.mintedToken(recipient, id(win)), token);
    assert.equal(await collection.ownerOf(token), recipient);
    assert.equal(await collection.tokenURI(token), uri);
  }
  assert.equal(await collection.balanceOf(recipient), 2n);
});
