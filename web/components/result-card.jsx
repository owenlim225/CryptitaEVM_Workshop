import React from "react";
import { createRoot } from "react-dom/client";
import { imageSrc, tierNames } from "../cards.js";
import "./ReflectiveCard.css";

const root = createRoot(document.getElementById("reflective-root"));

export function showResultCard(card) {
  root.render(
    <article className="winner-card">
      <div className="winner-card__top">
        <span>CRYPTITA / GACHA</span>
        <strong>{tierNames[card.rarity]}</strong>
      </div>
      <img className="winner-card__art" src={imageSrc(card.image)} alt={card.name} referrerPolicy="no-referrer" />
      <div className="winner-card__bottom">
        <h3>{card.name}</h3>
        <p>{card.description}</p>
      </div>
    </article>
  );
}
