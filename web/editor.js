import { saveDeck, imageSrc, tierNames, validateCard } from "./cards.js";
import { seedDeck } from "./seed-deck.js";

const draftKey = "cryptita.creator.v2";
const cards = seedDeck.map(card => ({...card}));
let selected = 0;
const $ = id => document.getElementById(id);

function save() {
  let saved = true;
  try { localStorage.setItem(draftKey, JSON.stringify(cards)); } catch { saved = false; }
  $("draft-status").textContent = cards.length + " / 25 cards · " +
    (saved ? "Draft saved in this browser." : "Browser storage unavailable. Keep this page open.");
}

function thumbnail(element, uri) {
  const src = imageSrc(uri);
  element.hidden = !src;
  if (!src) element.removeAttribute("src");
  else if (element.getAttribute("src") !== src) element.src = src;
}

function renderList() {
  const buttons = cards.map((card, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "minor";
    button.setAttribute("aria-pressed", String(index === selected));
    const image = document.createElement("img");
    image.alt = "";
    image.referrerPolicy = "no-referrer";
    thumbnail(image, card.image);
    button.append(image, tierNames[card.rarity] + " · " + (card.name || "Untitled card"));
    button.addEventListener("click", () => { selected = index; render(); });
    return button;
  });
  $("card-list").replaceChildren(...buttons);
  $("new-card").disabled = cards.length >= 25;
  $("remove-card").disabled = cards.length === 1;
  thumbnail($("preview"), cards[selected].image);
}

function render() {
  const card = cards[selected];
  $("card-name").value = card.name;
  $("card-description").value = card.description;
  $("card-rarity").selectedIndex = card.rarity;
  $("card-url").value = card.image.startsWith("data:") ? "" : card.image;
  $("card-file").value = "";
  renderList();
}

async function thumbnailUpload(file) {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 10 * 1024 * 1024)
    throw Error("Choose a JPG, PNG or WebP image up to 10 MB.");
  const image = await createImageBitmap(file);
  try {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const crop = Math.min(image.width, image.height);
    for (const size of [144, 112, 80, 56, 40]) {
      canvas.width = canvas.height = size;
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(image, (image.width - crop) / 2, (image.height - crop) / 2, crop, crop, 0, 0, size, size);
      const uri = canvas.toDataURL("image/jpeg", .65);
      if (uri.length <= 5100) return uri;
    }
    throw Error("This photo needs a permanent URL. Paste its HTTPS or IPFS address instead.");
  } finally { image.close(); }
}

export function initEditor() {
  $("save-card").addEventListener("click", () => {
    try {
      validateCard(cards[selected], selected);
      localStorage.setItem(draftKey, JSON.stringify(cards));
      $("draft-status").textContent = "Saved " + cards[selected].name + ". Add another card or finish your collection.";
    } catch (error) { $("draft-status").textContent = error.message; }
  });
  $("finish").addEventListener("click", () => {
    try {
      saveDeck(cards);
      location.assign("./");
    } catch (error) { $("draft-status").textContent = error.message; }
  });
  try {
    const previous = JSON.parse(localStorage.getItem(draftKey));
    if (Array.isArray(previous) && previous.length > 0 && previous.length <= 25 && previous.every(card =>
      card && typeof card.name === "string" && typeof card.description === "string" && typeof card.image === "string" && Number.isInteger(card.rarity) && tierNames[card.rarity])) {
      cards.splice(0, cards.length, ...previous.map(({name, description, image, rarity}) => ({name, description, image, rarity})));
    }
  } catch { /* Start with the starter deck if browser storage is unavailable. */ }
  render();
  save();
  for (const [id, key] of [["card-name","name"],["card-description","description"],["card-url","image"],["card-rarity","rarity"]]) {
    $(id).addEventListener("input", event => {
      cards[selected][key] = key === "rarity" ? event.target.selectedIndex : event.target.value;
      renderList();
      save();
    });
  }
  $("new-card").addEventListener("click", () => {
    cards.push({ name:"", description:"", image:"", rarity:0 });
    selected = cards.length - 1;
    render(); save(); $("card-name").focus();
  });
  $("remove-card").addEventListener("click", () => {
    cards.splice(selected, 1);
    selected = Math.min(selected, cards.length - 1);
    render(); save();
  });
  $("card-file").addEventListener("change", async event => {
    const file = event.target.files[0];
    if (!file) return;
    $("composer").disabled = $("finish").disabled = true;
    try {
      cards[selected].image = await thumbnailUpload(file);
      render(); save();
    } catch (error) { $("draft-status").textContent = error.message; }
    finally { $("composer").disabled = $("finish").disabled = false; }
  });
}
