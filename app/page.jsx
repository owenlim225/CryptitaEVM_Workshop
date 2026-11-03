"use client";

import { useEffect } from "react";

const tiers = [
  ["N", "Normal", "55%"], ["R", "Rare", "28%"], ["SR", "Super Rare", "12%"],
  ["SSR", "Super Super Rare", "4%"], ["UR", "Ultra Rare", "1%"]
];

export default function Page() {
  useEffect(() => { import("../web/main.js"); }, []);

  return <>
    <header className="mast">
      <a className="brand" href="/" aria-label="Cryptita home"><svg aria-hidden="true" width="27" height="26" viewBox="0 0 27 26"><path fill="currentColor" d="M0 13 8 0h9L9 13l8 13H8zm12 0 8-13h7l-8 13 8 13h-7z"/></svg>Cryptita</a>
      <span>BNB Smart Chain builder workshop</span>
    </header>
    <main>
      <section className="press" aria-labelledby="title">
        <div className="controls">
          <h1 id="title">Rarity<br/><i>Roulette</i></h1>
          <p>Create a deck and spin for a card. You can keep the win here or mint it into your MetaMask wallet.</p>
          <button id="spin" type="button" hidden>Spin the wheel</button>
          <a id="edit" className="button-link" href="/deploy">Create a collection</a>
          <p id="deck-status" role="status" className="status">Loading deck…</p>
        </div>
        <figure className="plate" aria-label="Rarity roulette wheel">
          <div className="plate-header"><span>CRYPTITA / GACHA</span><span id="deck-count">CARD DRAW</span></div>
          <div className="wheel-housing">
            <svg viewBox="0 0 320 320" role="img" aria-label="Rarity wheel with the chances for your saved deck.">
              <circle cx="160" cy="160" r="137" fill="#f7f3d9" stroke="#17302f" strokeWidth="2"/>
              <circle cx="160" cy="160" r="131" fill="none" stroke="#506457" strokeWidth="4" strokeDasharray="1 7.23"/>
              <g id="wheel-disc"/>
              <circle cx="160" cy="160" r="23" fill="#f7f3d9" stroke="#17302f" strokeWidth="2"/>
              <path d="m160 146 11 14-11 14-11-14z" fill="#17302f"/>
              <path d="M149 14h22l-11 30z" fill="#17302f" stroke="#f7f3d9" strokeWidth="2"/>
            </svg>
          </div>
          <figcaption role="status" aria-live="polite" aria-atomic="true"><span id="plate-title">Ready to spin</span><span id="plate-code">—</span></figcaption>
          <button id="win-link" type="button" className="minor" hidden>View winning card</button>
        </figure>
      </section>
      <dialog id="result-dialog" aria-labelledby="result-heading">
        <div className="result-shell">
          <div className="result-head"><h2 id="result-heading">Your winning card</h2><button type="button" className="minor" id="close-result" aria-label="Close result">Close</button></div>
          <div id="reflective-root"/>
          <div className="result-details">
            <section id="win" className="win" aria-label="Winning card mint options" hidden>
              <p id="win-note"/>
              <button id="action" type="button">Mint this card with MetaMask</button>
              <p id="status" className="status" role="status"/>
            </section>
            <section id="receipt" className="receipt" aria-labelledby="receipt-title" hidden>
              <h2 id="receipt-title">Mint receipt</h2>
              <dl><dt>Contract</dt><dd id="receipt-address"/><dt>Token ID</dt><dd id="token"/></dl>
              <button type="button" id="import" className="minor">Add NFT to MetaMask</button><p id="import-status" className="status" role="status"/>
              <details><summary>More receipt details</summary>
                <dl><dt>Network</dt><dd id="receipt-network"/><dt>Owner</dt><dd id="owner"/><dt>Transaction</dt><dd id="tx"/></dl>
                <p>If MetaMask does not show the NFT, import it using the contract address and token ID above.</p>
                <details><summary>Token metadata</summary><pre id="metadata"/></details>
              </details>
            </section>
          </div>
        </div>
      </dialog>
      <div className="bench">
        <section><h2>Your deck</h2><p id="deck-summary">Finish editing a collection to unlock the wheel.</p>
          <p className="mint-info">Minting uses tBNB for gas on BNB Smart Chain Testnet. The first mint creates your ERC-721 contract and issues your winning card in one transaction. Later wins use that contract.</p>
        </section>
        <section><h2>Drop rates</h2>
          <table><caption className="sr">Probability of each rarity per spin</caption><thead><tr><th>Tier</th><th>Rarity</th><th>Chance</th></tr></thead>
            <tbody>{tiers.map(([code, name, chance]) => <tr key={code}><th>{code}</th><td>{name}</td><td>{chance}</td></tr>)}</tbody>
          </table>
        </section>
      </div>
      <footer>Your deck and current win are saved in this browser. You can spin and reveal cards without a wallet.</footer>
    </main>
  </>;
}
