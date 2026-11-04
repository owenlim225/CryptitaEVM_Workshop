import test from "node:test";
import assert from "node:assert/strict";
import { revealRarity, wheelAngle } from "../web/roulette.js";

test("wheel stops with the winning card’s rarity at the top pointer", () => {
  for (let tier = 0; tier < 5; tier++) assert.equal((tier * 72 + wheelAngle(tier)) % 360, 0);
  for (const invalid of [-1, 5, 1.5]) assert.throws(() => wheelAngle(invalid), RangeError);
});

test("odds reflect only the rarities present in the edited deck", async () => {
  const {chanceLabels} = await import("../web/roulette.js");
  assert.deepEqual(chanceLabels([]), Array(5).fill("—"));
  assert.deepEqual(chanceLabels([{rarity:4}]), ["0%", "0%", "0%", "0%", "100%"]);
  assert.deepEqual(chanceLabels([{rarity:2}, {rarity:2}, {rarity:3}]), ["0%", "0%", "75%", "25%", "0%"]);
});

test("the wheel starts before its animation finishes", async () => {
  const originalDocument = globalThis.document;
  const originalWindow = globalThis.window;
  let finish, started = false;
  const finished = new Promise(resolve => { finish = resolve; });
  const title = {}, code = {style:{}}, disc = {
    style:{}, closest:() => ({scrollIntoView() {}}),
    animate:() => { started = true; return {finished, cancel() {}}; }
  };
  globalThis.document = {getElementById:id => ({"wheel-disc":disc, "plate-title":title, "plate-code":code})[id]};
  globalThis.window = {matchMedia:() => ({matches:false})};
  try {
    const reveal = revealRarity(2, "Winning card");
    assert.equal(started, true);
    assert.equal(title.textContent, "Spinning…");
    finish();
    await reveal;
    assert.equal(title.textContent, "Winning card");
  } finally {
    globalThis.document = originalDocument;
    globalThis.window = originalWindow;
  }
});
