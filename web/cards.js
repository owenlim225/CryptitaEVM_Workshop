export const tierNames = ["N", "R", "SR", "SSR", "UR"];
export const tierWeights = [55, 28, 12, 4, 1];
const deckKey = "cryptita.finished-deck.v1";

export function imageSrc(uri) {
  if (typeof uri !== "string") return "";
  if (/^ipfs:\/\/[a-zA-Z0-9]+(?:\/[^\s]*)?$/.test(uri)) return "https://ipfs.io/ipfs/" + uri.slice(7);
  if (/^data:image\/(?:jpeg|png|webp|svg\+xml);base64,[A-Za-z0-9+/]+=*$/.test(uri)) return uri;
  try {
    const url = new URL(uri);
    if (url.protocol === "https:" && !url.username && !url.password) return url.href;
  } catch { /* Invalid or partial URL while editing. */ }
  return "";
}

export function cardMetadata(card) {
  return JSON.stringify({
    name: card.name, description: card.description, image: card.image,
    attributes: [{ trait_type: "Rarity", value: tierNames[card.rarity] }]
  });
}

export function validateCard(card, index) {
  const label = "Card " + (index + 1);
  if (!card || typeof card.name !== "string" || !card.name.trim() ||
      typeof card.description !== "string" || !card.description.trim() || !imageSrc(card.image) ||
      !Number.isInteger(card.rarity) || !tierNames[card.rarity]) {
    throw Error(label + " needs a title, a picture, details and a rarity.");
  }
  if (new TextEncoder().encode(cardMetadata(card)).length > 8192) {
    throw Error(label + " exceeds 8 KiB. Use a shorter description or a permanent photo URL.");
  }
}

function validateDeck(cards) {
  if (!Array.isArray(cards) || cards.length < 1 || cards.length > 25) throw Error("Add between 1 and 25 cards to play.");
  cards.forEach(validateCard);
  return cards;
}

export function saveDeck(cards) {
  localStorage.setItem(deckKey, JSON.stringify(validateDeck(cards)));
}

export function readDeck() {
  const saved = localStorage.getItem(deckKey);
  return saved ? validateDeck(JSON.parse(saved)) : [];
}

export function availableWeights(cards) {
  return tierWeights.map((weight, tier) => cards.some(card => card.rarity === tier) ? weight : 0);
}

export function drawCard(randomHex, cards) {
  const weights = availableWeights(cards);
  const total = BigInt(weights.reduce((sum, weight) => sum + weight, 0));
  if (!total) throw Error("Create at least one card before spinning.");
  const seed = BigInt(randomHex);
  let roll = Number(seed % total);
  const tier = weights.findIndex(weight => {
    if (roll < weight) return true;
    roll -= weight;
    return false;
  });
  const pool = cards.map((card, i) => card.rarity === tier ? i : -1).filter(i => i >= 0);
  return pool[Number((seed / total) % BigInt(pool.length))];
}
