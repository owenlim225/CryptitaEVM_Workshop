import assert from "node:assert/strict";
import { test } from "node:test";
import { cardMetadata, cardMetadataUri, drawCard, readDeck, saveDeck } from "../web/cards.js";

test("a finished deck is a local snapshot and a partial deck draws only from its chosen tiers", () => {
  const data = new Map();
  globalThis.localStorage = {
    setItem: (key, value) => data.set(key, value),
    getItem: key => data.get(key) ?? null
  };
  const cards = [
    { name: "Fox", image: "https://example.com/fox.png", description: "First sketch", rarity: 0 },
    { name: "Owl", image: "https://example.com/owl.png", description: "Moonlit sketch", rarity: 4 }
  ];
  assert.deepEqual(readDeck(), []);
  saveDeck(cards);
  cards[0].name = "Draft revision";
  const deck = readDeck();
  assert.equal(deck[0].name, "Fox");
  const winners = Array.from({ length: 56 }, (_, roll) => drawCard(roll, deck));
  assert.equal(winners.filter(index => index === 0).length, 55);
  assert.equal(winners[55], 1);
  const json = cardMetadata(deck[winners[55]]);
  assert.equal(JSON.parse(json).name, "Owl");
  assert.ok(!json.includes("Fox"));
  saveDeck([deck[1]]);
  assert.equal(drawCard("0xabcd", readDeck()), 0);
  assert.throws(() => saveDeck([{ ...deck[0], description: "x".repeat(8200) }]), /8 KiB/);
  assert.equal(readDeck().length, 1);
});

test("encodes a card's UTF-8 metadata as a self-contained token URI", () => {
  const card = {name:"Lunà 🌙", description:"Moonlit sketch", image:"https://example.com/moon.png", rarity:4};
  const uri = cardMetadataUri(card);
  assert.ok(uri.startsWith("data:application/json;base64,"));
  assert.equal(Buffer.from(uri.split(",")[1], "base64").toString("utf8"), cardMetadata(card));
});
