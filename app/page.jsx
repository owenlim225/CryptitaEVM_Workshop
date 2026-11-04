"use client";

import { useEffect } from "react";
import Image from "next/image";

const tiers = [
  ["N", "Normal", "55%"], ["R", "Rare", "28%"], ["SR", "Super Rare", "12%"],
  ["SSR", "Super Super Rare", "4%"], ["UR", "Ultra Rare", "1%"]
];

export default function Page() {
  useEffect(() => { import("../web/main.js"); }, []);

  return <>
    <header className="mast">
      <a className="brand" href="/"><Image src="/cryptita-logo.png" alt="Cryptita Plays" width={280} height={83}/></a>
      <div className="mast-right"><span>Base Sepolia builder workshop</span><div className="wallet-controls"><button id="connect-wallet" type="button" className="minor">Connect wallet</button><span id="wallet-address" hidden/><button id="disconnect-wallet" type="button" className="minor" hidden>Disconnect wallet</button></div></div>
    </header>
    <main>
      <section className="press" aria-labelledby="title">
        <div className="controls">
          <h1 id="title">MARSU<br/><i>Roulette</i></h1>
          <p>Create a deck, then pay 0.0001 test ETH to spin and mint a card into your wallet.</p>
          <span id="spin-action" className="spin-action" hidden><button id="spin" type="button">Pay &amp; spin</button><span id="spin-price">0.0001 test ETH + gas</span></span>
          <a id="edit" className="button-link" href="/deploy">Create a collection</a>
          <p id="deck-status" role="status" className="status">Loading deck…</p>
        </div>
        <figure className="plate" aria-label="MARSU Roulette wheel">
          <div className="plate-header"><span>CRYPTITA / GACHA</span><span id="deck-count">CARD DRAW</span></div>
          <div className="wheel-housing">
            <svg viewBox="0 0 320 320" role="img" aria-label="Rarity wheel with the chances for your saved deck.">
              <circle cx="160" cy="160" r="137" fill="#fcf9ff" stroke="#2d153f" strokeWidth="2"/>
              <circle cx="160" cy="160" r="131" fill="none" stroke="#9570b4" strokeWidth="4" strokeDasharray="1 7.23"/>
              <g id="wheel-disc"/>
              <circle cx="160" cy="160" r="23" fill="#fcf9ff" stroke="#2d153f" strokeWidth="2"/>
              <path d="m160 146 11 14-11 14-11-14z" fill="#2d153f"/>
              <path d="M149 14h22l-11 30z" fill="#2d153f" stroke="#fcf9ff" strokeWidth="2"/>
            </svg>
          </div>
          <figcaption role="status" aria-live="polite" aria-atomic="true"><span id="plate-title">Ready to spin</span><span id="plate-code">—</span></figcaption>
          <button id="win-link" type="button" className="minor" hidden>View winning card</button>
        </figure>
      </section>
      <dialog id="result-dialog" aria-labelledby="result-heading">
        <div className="result-shell">
          <div className="result-head"><h2 id="result-heading">Your winning card</h2><button type="button" className="minor" id="close-result" aria-label="Close result">Close</button></div>
          <div className="result-stage"><div id="reflective-root"/></div>
          <div className="result-details">
            <section id="receipt" className="receipt" aria-labelledby="receipt-title" hidden>
              <h2 id="receipt-title">Mint receipt</h2>
              <button type="button" id="import" className="minor"><Image src="/metamask-icon.svg" alt="" width={22} height={22}/>Add NFT to MetaMask</button><p id="import-status" className="status" role="status"/>
              <dl><dt>Contract</dt><dd id="receipt-address"/><dt>Token ID</dt><dd id="token"/></dl>
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
          <p className="mint-info">Each spin sends 0.0001 test ETH to your own ERC-721 contract on Base Sepolia, plus gas. The first paid spin creates that contract and mints your card in one transaction. The browser selects the card before payment; this is a classroom demo, not a fair prize draw.</p>
        </section>
        <section><h2>Drop rates</h2>
          <table><caption className="sr">Probability of each rarity per spin</caption><thead><tr><th>Tier</th><th>Rarity</th><th>Chance</th></tr></thead>
            <tbody>{tiers.map(([code, name, chance]) => <tr key={code}><th>{code}</th><td>{name}</td><td>{chance}</td></tr>)}</tbody>
          </table>
        </section>
      </div>
      <footer>Your deck and mint receipts are saved in this browser. A MetaMask wallet with Base Sepolia test ETH is needed to spin.</footer>
    </main>
  </>;
}
