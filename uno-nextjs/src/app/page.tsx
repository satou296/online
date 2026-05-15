"use client";

import Script from "next/script";

export default function UnoGame() {
  return (
    <>
      <div id="setup-screen">
        <h1>UNOへようこそ</h1>
        <p>プレイヤー人数を選んでください</p>
        <button onClick={() => (window as any).startGame(1)}>1人 (vs CPU)</button>
        <button onClick={() => (window as any).startGame(2)}>2人</button>
        <button onClick={() => (window as any).startGame(3)}>3人</button>
        <button onClick={() => (window as any).startGame(4)}>4人</button>
      </div>

      <div id="game-board" style={{ display: "none" }}>
        <h2 id="turn-display">プレイヤー 1 の番です</h2>

        <div className="field">
          <div id="discard-pile" className="card">--</div>
          <p>場札</p>
        </div>

        <div id="player-hands-container"></div>

        <div className="controls">
          <button id="draw-btn" onClick={() => (window as any).drawCard()}>山札から引く</button>
          <button id="next-btn" style={{ display: "none" }} onClick={() => (window as any).manualNextTurn()}>次の番へ</button>
          <p id="message"></p>
        </div>
      </div>

      <Script src="/script.js" strategy="afterInteractive" />
    </>
  );
}
