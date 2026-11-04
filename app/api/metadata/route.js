export async function POST(request) {
  if (!process.env.PINATA_JWT) return Response.json({error:"Set PINATA_JWT in .env.local before minting."}, {status:503});
  const gateway = process.env.PINATA_GATEWAY_URL;
  if (!/^https:\/\/[a-z0-9-]+\.mypinata\.cloud\/?$/.test(gateway ?? "")) {
    return Response.json({error:"Set PINATA_GATEWAY_URL to your Pinata HTTPS gateway in .env.local."}, {status:503});
  }
  if (Number(request.headers.get("content-length")) > 8192) return Response.json({error:"Metadata exceeds 8 KiB."}, {status:413});

  const json = await request.text();
  if (new TextEncoder().encode(json).length > 8192) return Response.json({error:"Metadata exceeds 8 KiB."}, {status:413});
  try {
    const card = JSON.parse(json);
    if (!card || typeof card.name !== "string" || typeof card.description !== "string" ||
        typeof card.image !== "string" || !Array.isArray(card.attributes)) throw Error();
  } catch {
    return Response.json({error:"Invalid card metadata."}, {status:400});
  }

  const form = new FormData();
  form.set("network", "public");
  form.set("file", new File([json], "card.json", {type:"application/json"}));
  try {
    const response = await fetch("https://uploads.pinata.cloud/v3/files", {
      method:"POST", headers:{Authorization:`Bearer ${process.env.PINATA_JWT}`}, body:form
    });
    if (!response.ok) throw Error("Pinata upload failed");
    const {data} = await response.json();
    if (!/^b[a-z2-7]{20,}$/.test(data?.cid ?? "")) throw Error("Pinata returned an invalid CID");
    return Response.json({uri:`${gateway.replace(/\/$/, "")}/ipfs/${data.cid}`});
  } catch {
    return Response.json({error:"Could not upload metadata to Pinata. Try again."}, {status:502});
  }
}
