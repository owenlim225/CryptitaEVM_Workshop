import test from "node:test";
import assert from "node:assert/strict";
import { needsReveal } from "../web/spin-state.js";

test("only a confirmed, unrevealed mint is ready to spin", () => {
  assert.equal(needsReveal(), false);
  assert.equal(needsReveal({revealed:false}), false);
  assert.equal(needsReveal({pending:{hash:"0x1"}, revealed:false}), false);
  assert.equal(needsReveal({receipt:{token:"1"}, revealed:false}), true);
  assert.equal(needsReveal({receipt:{token:"1"}, revealed:true}), false);
  assert.equal(needsReveal({receipt:{token:"1"}}), false);
});
