import { availableWeights } from "./cards.js";

const slots = [
  { tier: "N", color: "#e5d9f1" },
  { tier: "R", color: "#d6bdf2" },
  { tier: "SR", color: "#bda2ed" },
  { tier: "SSR", color: "#a879e2" },
  { tier: "UR", color: "#f1bf75" },
];
const step = 360 / slots.length;

let rotation = 0;

export function wheelAngle(tierIndex) {
  if (!Number.isInteger(tierIndex) || !slots[tierIndex]) throw RangeError("Unknown rarity.");
  return (360 - tierIndex * step) % 360;
}

export function chanceLabels(cards) {
  const weights = availableWeights(cards);
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  return weights.map(weight => total ? Number((100 * weight / total).toFixed(2)) + "%" : "—");
}
export function initRoulette(cards) {
  const disc = document.getElementById("wheel-disc");
  const labels = chanceLabels(cards);
  document.querySelectorAll("tbody tr").forEach((row, index) => { row.lastElementChild.textContent = labels[index]; });
  // Each slot has an equal landing area. Its printed percentage determines its draw chance.
  disc.innerHTML = slots.map(({ tier, color }, index) => `
    <g transform="rotate(${index * step} 160 160)">
      <path d="M160 160 87.1 59.7a124 124 0 0 1 145.8 0Z" fill="${labels[index] === "0%" ? "#e8e1ed" : color}" stroke="#2d153f" stroke-width="1.5"/>
      <text class="slot-tier" x="160" y="75">${tier}</text>
      <text class="slot-chance" x="160" y="95">${labels[index]}</text>
    </g>`).join("");
}

export function resetRoulette() {
  rotation = 0;
  document.getElementById("wheel-disc").style.transform = "rotate(0deg)";
  document.getElementById("plate-title").textContent = "Waiting for paid mint…";
  const code = document.getElementById("plate-code");
  code.textContent = "—";
  code.style.backgroundColor = "";
}

export async function revealRarity(tierIndex, identityLabel, animate = true) {
  const slot = slots[tierIndex];
  if (!slot) throw RangeError("Unknown rarity.");
  const disc = document.getElementById("wheel-disc");
  const title = document.getElementById("plate-title");
  const code = document.getElementById("plate-code");
  title.textContent = "Spinning…";
  code.textContent = "…";
  if (animate) disc.closest("figure").scrollIntoView({block: "nearest", behavior: "instant"});
  // Slot zero starts under the fixed top pointer. Rotate the selected slot back to that position.
  const target = wheelAngle(tierIndex);
  const forward = (target - rotation + 360) % 360;
  if (animate && !window.matchMedia("(prefers-reduced-motion: reduce)").matches && disc.animate) {
    const spin = disc.animate(
      [{transform: `rotate(${rotation}deg)`}, {transform: `rotate(${rotation + forward + 720}deg)`}],
      {duration: 1450, easing: "cubic-bezier(.2,.7,.13,1)", fill: "forwards"}
    );
    try { await spin.finished; } finally { spin.cancel(); }
  }
  rotation = target;
  disc.style.transform = `rotate(${rotation}deg)`;
  title.textContent = identityLabel;
  code.textContent = slot.tier;
  code.style.backgroundColor = slot.color;
}
