import assert from "node:assert/strict";
import { test } from "node:test";
import { POST } from "../app/api/metadata/route.js";

const cid = "bafybeigdyrzt5n5vy7z4hxgqstnqzz6p4d2t2qxj5qj3g5mbr4qle3x3yy";
const json = JSON.stringify({name:"Lantern", description:"A card", image:"https://example.com/a.png", attributes:[]});

test("uploads exact JSON to public IPFS and returns its URI without exposing the JWT", async () => {
  const originalFetch = globalThis.fetch;
  const originalJwt = process.env.PINATA_JWT;
  process.env.PINATA_JWT = "secret-test-jwt";
  try {
    globalThis.fetch = async (url, options) => {
      assert.equal(url, "https://uploads.pinata.cloud/v3/files");
      assert.equal(options.headers.Authorization, "Bearer secret-test-jwt");
      assert.equal(options.body.get("network"), "public");
      assert.equal(await options.body.get("file").text(), json);
      return Response.json({data:{cid}});
    };
    const response = await POST(new Request("http://localhost/api/metadata", {method:"POST", body:json}));
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {uri:"ipfs://" + cid});
  } finally {
    globalThis.fetch = originalFetch;
    if (originalJwt === undefined) delete process.env.PINATA_JWT;
    else process.env.PINATA_JWT = originalJwt;
  }
});

test("rejects invalid or oversized metadata before upload", async () => {
  const originalJwt = process.env.PINATA_JWT;
  process.env.PINATA_JWT = "secret-test-jwt";
  try {
    for (const [body, status] of [["{}", 400], [json + " ".repeat(8192), 413]]) {
      const response = await POST(new Request("http://localhost/api/metadata", {method:"POST", body}));
      assert.equal(response.status, status);
    }
  } finally {
    if (originalJwt === undefined) delete process.env.PINATA_JWT;
    else process.env.PINATA_JWT = originalJwt;
  }
});
