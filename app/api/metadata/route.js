function configError() {
  if (!process.env.PINATA_JWT || process.env.PINATA_JWT === "replace-with-your-pinata-jwt") return "Set PINATA_JWT in .env.local before minting. Restart the dev server after saving it.";
  const gateway = process.env.PINATA_GATEWAY_URL;
  if (gateway === "https://replace-with-your-gateway.mypinata.cloud" || !/^https:\/\/[a-z0-9-]+\.mypinata\.cloud\/?$/.test(gateway ?? "")) {
    return "Set PINATA_GATEWAY_URL to your Pinata HTTPS gateway in .env.local. Restart the dev server after saving it.";
  }
}

export function GET() {
  const error = configError();
  return error ? Response.json({error}, {status:503}) : Response.json({ready:true});
}

export async function POST(request) {
  const error = configError();
  if (error) return Response.json({error}, {status:503});
  const gateway = process.env.PINATA_GATEWAY_URL;
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
