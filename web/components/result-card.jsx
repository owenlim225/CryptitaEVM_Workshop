import React from "react";
import { createRoot } from "react-dom/client";
import ReflectiveCard from "./ReflectiveCard.jsx";
import { imageSrc, tierNames } from "../cards.js";

const root = createRoot(document.getElementById("reflective-root"));

export function showResultCard(card) {
  root.render(
    <ReflectiveCard
      className="winner-card"
      theme="dark"
      width="100%"
      height="100%"
      tint="#c68aed"
      metalness={0.72}
      roughness={0.42}
      blurStrength={4}
      shine={1.3}
      glare={0.42}
      tiltStrength={8}
      radius={20}
      webcam={false}
      intro
    >
      <div className="winner-card__top">
        <span>CRYPTITA / GACHA</span>
        <strong>{tierNames[card.rarity]}</strong>
      </div>
      <img className="winner-card__art" src={imageSrc(card.image)} alt={card.name} referrerPolicy="no-referrer" />
      <div className="winner-card__bottom">
        <h3>{card.name}</h3>
        <p>{card.description}</p>
      </div>
    </ReflectiveCard>
  );
}
