"use client";

import { useEffect } from "react";

export default function Editor() {
  useEffect(() => {
    let active = true;
    import("../../web/editor.js").then(({ initEditor }) => { if (active) initEditor(); });
    return () => { active = false; };
  }, []);

  return <>
    <header className="mast"><a className="brand" href="/">← Rarity Roulette</a><span>Collection studio</span></header>
    <main className="studio">
      <h1>Create your collection</h1>
      <p>Give each card a title, a picture, details and a rarity. Your draft stays in this browser. Finish with one or more cards to play.</p>
      <fieldset id="composer">
        <legend className="sr">Collection draft</legend>
        <div className="studio-grid">
          <section><h2>Your cards</h2><div id="card-list"/><button type="button" className="minor" id="new-card">+ Add card</button></section>
          <section><h2>Edit card</h2>
            <img id="preview" alt="Card artwork preview" width="120" height="120" hidden/>
            <label>Title<input id="card-name" maxLength="80"/></label>
            <label>Details<textarea id="card-description" rows="3" maxLength="550"/></label>
            <label>Rarity<select id="card-rarity"><option>N</option><option>R</option><option>SR</option><option>SSR</option><option>UR</option></select></label>
            <label>Photo URL<input id="card-url" placeholder="https://… or ipfs://…" spellCheck="false"/></label>
            <label>Or upload a photo<input type="file" id="card-file" accept="image/jpeg,image/png,image/webp"/></label>
            <p className="status">Uploaded pictures are saved as small thumbnails. A permanent image URL keeps the full resolution.</p>
            <button type="button" id="save-card">Save card</button> <button className="minor" id="remove-card" type="button">Remove selected card</button>
          </section>
        </div>
      </fieldset>
      <p role="status" id="draft-status"/>
      <section className="finish"><h2>Ready to play?</h2><p>Finish your collection to open the wheel. You can connect MetaMask after you win a card.</p><button id="finish" type="button">Finish collection &amp; spin</button></section>
    </main>
  </>;
}
