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
      <a className="brand" href="/" aria-label="Cryptita Plays home"><Image src="/cryptita-logo.png" alt="Cryptita Plays" width={2902} height={857} preload/></a>
      <div className="mast-right">
        <span className="header-label">EVM Workshop</span>
        <a className="github-button" href="https://github.com/owenlim225/CryptitaEVM_Workshop" aria-label="View project on GitHub" title="View project on GitHub">
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.4 7.86 10.92.57.1.78-.25.78-.55v-2.14c-3.2.7-3.88-1.36-3.88-1.36-.52-1.33-1.27-1.69-1.27-1.69-1.04-.71.08-.7.08-.7 1.15.08 1.75 1.18 1.75 1.18 1.02 1.75 2.68 1.25 3.33.96.1-.74.4-1.25.73-1.54-2.56-.29-5.25-1.28-5.25-5.72 0-1.26.45-2.3 1.18-3.11-.12-.29-.51-1.47.11-3.07 0 0 .96-.31 3.15 1.19A10.95 10.95 0 0 1 12 6.12c.97 0 1.95.13 2.86.39 2.19-1.5 3.15-1.19 3.15-1.19.62 1.6.23 2.78.11 3.07.73.81 1.18 1.85 1.18 3.11 0 4.45-2.69 5.43-5.26 5.72.41.35.77 1.04.77 2.1v3.05c0 .3.21.66.79.55A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z"/></svg>
        </a>
        <div className="wallet-controls"><span id="wallet-address" hidden/><button id="connect-wallet" type="button" className="minor">Connect MetaMask</button><button id="disconnect-wallet" type="button" className="minor" hidden>Disconnect</button></div>
      </div>
    </header>
    <main>
      <section className="press" aria-labelledby="title">
        <div className="controls">
          <h1 id="title">MARSU<br/><i>Roulette</i></h1>
          <p>Create a deck, pay 0.0001 test ETH to mint a card, then spin to reveal it.</p>
          <span id="spin-action" className="spin-action" hidden><button id="spin" type="button">Pay to spin</button><span id="spin-price">0.0001 test ETH + gas</span></span>
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
      <dialog id="spin-dialog" aria-labelledby="spin-dialog-title" aria-describedby="spin-dialog-description">
        <div className="spin-dialog-body">
          <button id="close-spin-dialog" type="button" className="minor" aria-label="Close">Close</button>
          <span className="spin-success" aria-hidden="true">✓</span>
          <h2 id="spin-dialog-title">Transaction complete</h2>
          <p id="spin-dialog-description">Your NFT is minted. Spin to reveal your card.</p>
          <button id="spin-confirmed" type="button">Spin</button>
        </div>
      </dialog>
      <dialog id="result-dialog" aria-labelledby="result-heading">
        <div className="result-shell">
          <div className="result-head"><h2 id="result-heading">Your winning card</h2><button type="button" className="minor" id="close-result" aria-label="Close result">Close</button></div>
          <div className="result-stage"><div id="reflective-root"/></div>
          <div className="result-details">
            <section id="receipt" className="receipt" aria-labelledby="receipt-title" hidden>
              <h2 id="receipt-title">Mint receipt</h2>
              <p>The NFT was minted to your wallet on Base Sepolia.</p>
              <dl><dt>Contract</dt><dd id="receipt-address"/><dt>Token ID</dt><dd id="token"/></dl>
              <details><summary>NFT not showing in MetaMask?</summary>
                <p>MetaMask may need help displaying it. This does not mint or transfer another NFT.</p>
                <button type="button" id="import" className="minor"><Image src="/metamask-icon.svg" alt="" width={22} height={22}/>Show NFT in MetaMask</button><p id="import-status" className="status" role="status"/>
                <p>If that does not work, use MetaMask’s NFT import form with the contract address and token ID above.</p>
              </details>
              <details><summary>More receipt details</summary>
                <dl><dt>Network</dt><dd id="receipt-network"/><dt>Owner</dt><dd id="owner"/><dt>Transaction</dt><dd id="tx"/></dl>
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
