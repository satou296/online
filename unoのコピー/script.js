const colors = ['red', 'blue', 'green', 'yellow'];
const numbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
const specialTypes = ['Skip', 'Reverse', 'Draw2']; // 特殊カードの種類

let players = [];
let currentPlayerIndex = 0;
let playerCount = 0;
let discardCard = null;
let isReverse = false; // リバース状態の管理
let hasDrawn = false; // そのターンに既にカードを引いたかどうかのフラグ

function startGame(num) {
    playerCount = num;
    isReverse = false; // リバースを初期化
    currentPlayerIndex = 0;
    document.getElementById('setup-screen').style.display = 'none';
    document.getElementById('game-board').style.display = 'block';

    players = [];
    for (let i = 0; i < playerCount; i++) {
        let hand = [];
        for (let j = 0; j < 5; j++) hand.push(generateRandomCard());
        players.push(hand);
    }

    // 最初の場札は数字カードが出るまで引き直す（UNO公式ルールに近い形）
    do {
        discardCard = generateRandomCard();
    } while (typeof discardCard.value !== 'number');

    updateUI();
}

function generateRandomCard() {
    const isSpecial = Math.random() < 0.25; // 25%の確率で特殊カード
    const color = colors[Math.floor(Math.random() * colors.length)];
    let value;

    if (isSpecial) {
        value = specialTypes[Math.floor(Math.random() * specialTypes.length)];
    } else {
        value = numbers[Math.floor(Math.random() * numbers.length)];
    }

    return { color, value };
}

function updateUI() {
    document.getElementById('turn-display').textContent = 
        `プレイヤー ${currentPlayerIndex + 1} の番です ${isReverse ? '(リバース中)' : ''}`;

    const discardEl = document.getElementById('discard-pile');
    discardEl.textContent = discardCard.value;
    discardEl.className = `card ${discardCard.color}`;
    discardEl.style.fontSize = typeof discardCard.value === 'string' ? '14px' : '24px';

    const container = document.getElementById('player-hands-container');
    container.innerHTML = '';

    players.forEach((hand, pIndex) => {
        const isCurrentPlayer = (pIndex === currentPlayerIndex);
        const playerDiv = document.createElement('div');
        playerDiv.className = isCurrentPlayer ? 'player-area active' : 'player-area';
        playerDiv.innerHTML = `<h3>プレイヤー ${pIndex + 1} (${hand.length}枚)</h3>`;
        
        const handDiv = document.createElement('div');
        handDiv.className = 'hand';

        hand.forEach((card, cIndex) => {
            const cardEl = document.createElement('div');
            
            if (isCurrentPlayer) {
                // 自分の番：色と数字を表示
                cardEl.className = `card ${card.color}`;
                cardEl.textContent = card.value;
                cardEl.style.fontSize = typeof card.value === 'string' ? '14px' : '24px';
                cardEl.onclick = () => playCard(cIndex);
            } else {
                // 他人の番：裏返しにする
                cardEl.className = `card card-back`;
                cardEl.textContent = ''; // 文字を表示しない
            }
            
            handDiv.appendChild(cardEl);
        });
        playerDiv.appendChild(handDiv);
        container.appendChild(playerDiv);
    });

    // ボタンの表示制御
    const drawBtn = document.getElementById('draw-btn');
    const nextBtn = document.getElementById('next-btn');

    if (hasDrawn) {
        drawBtn.style.display = "none";    // 引いた後は「引く」を隠す
        nextBtn.style.display = "inline"; // 「次の番へ」を表示
    } else {
        drawBtn.style.display = "inline";
        nextBtn.style.display = "none";
    }

    // ...（残りのカード描画処理：前回の updateUI を参照）...
    renderHands(); // カード描画部分を関数化して呼び出すと綺麗です
}

function handleSpecialCard(value) {
    const msg = document.getElementById('message');
    
    if (value === 'Skip') {
        msg.textContent = "スキップ！次のプレイヤーを飛ばします。";
        moveNextPlayer(); // 1回余分に進める
        moveNextPlayer();
    } else if (value === 'Reverse') {
        msg.textContent = "リバース！順番が逆になります。";
        isReverse = !isReverse;
        if (playerCount === 2) {
            // 2人プレイ時のリバースはスキップと同じ扱い
            moveNextPlayer();
            moveNextPlayer();
        } else {
            moveNextPlayer();
        }
    } else if (value === 'Draw2') {
        msg.textContent = "ドロー2！次のプレイヤーは2枚引いて休みです。";
        moveNextPlayer();
        // 次のプレイヤーに2枚追加
        for(let i=0; i<2; i++) players[currentPlayerIndex].push(generateRandomCard());
        moveNextPlayer(); // 休み（飛ばす）
    } else {
        msg.textContent = "カードを出しました。";
        moveNextPlayer();
    }
    updateUI();
}

let drawStack = 0; // 累積しているDraw2の枚数

// playCard の最後でも nextTurn() を呼ぶように調整
function playCard(cardIndex) {
    const hand = players[currentPlayerIndex];
    const card = hand[cardIndex];

    // ルール判定
    if (drawStack > 0) {
        if (card.value !== 'Draw2') {
            alert("Draw2を重ねてください！");
            return;
        }
    } else if (!canPlay(card)) {
        alert("そのカードは出せません！");
        return;
    }

    // カードを出す
    discardCard = hand.splice(cardIndex, 1)[0];

    if (hand.length === 0) {
        alert(`プレイヤー ${currentPlayerIndex + 1} の勝利！`);
        location.reload();
        return;
    }

    handleSpecialEffect(card.value);
}

/**
 * 特殊カードの効果を処理する
 */
function handleSpecialEffect(value) {
    const msg = document.getElementById('message');
    
    if (value === 'Skip') {
        msg.textContent = "スキップ！次のプレイヤーを飛ばしました。";
        // 2回移動することで、次の人を飛ばしてその隣の人へ
        moveNextPlayer(); 
        moveNextPlayer();
    } 
    else if (value === 'Reverse') {
        // 1. まず方向を反転させる
        isReverse = !isReverse;
        msg.textContent = isReverse ? "リバース！左回りになります。" : "リバース！右回りになります。";
        
        // 2. 2人プレイかそれ以上かで挙動を変える（UNO公式ルール準拠）
        if (playerCount === 2) {
            // 2人の時はリバースは「スキップ」と同じ扱い
            moveNextPlayer(); 
            moveNextPlayer();
        } else {
            // 3人以上の時は、反転した後の「次の人」へ移動
            moveNextPlayer();
        }
    } 
    else if (value === 'Draw2') {
        drawStack += 1;
        msg.textContent = `Draw2! 現在 ${drawStack * 2} 枚のペナルティ。`;
        moveNextPlayer();
    } 
    else {
        // 数字カードの場合
        msg.textContent = "カードを出しました。";
        moveNextPlayer();
    }

    hasDrawn = false; // ターン終了なのでフラグをリセット
    updateUI();      // 画面更新（ここで次のプレイヤーの手札が表示される）
}

function handleSpecialCard(value) {
    const msg = document.getElementById('message');
    
    if (value === 'Skip') {
        msg.textContent = "スキップ！";
        moveNextPlayer();
        moveNextPlayer();
    } else if (value === 'Reverse') {
        msg.textContent = "リバース！";
        isReverse = !isReverse;
        if (playerCount === 2) {
            moveNextPlayer(); 
            moveNextPlayer();
        } else {
            moveNextPlayer();
        }
    } else if (value === 'Draw2') {
        drawStack += 1; // 累積枚数を増やす
        msg.textContent = `Draw2発生！ 現在 ${drawStack * 2} 枚のペナルティ！`;
        moveNextPlayer();
    } else {
        msg.textContent = "カードを出しました。";
        moveNextPlayer();
    }
    updateUI();
}

function drawCard() {
    const hand = players[currentPlayerIndex];
    const msg = document.getElementById('message');

    if (drawStack > 0) {
        // Draw2累積時の処理
        const penaltyCount = drawStack * 2;
        for (let i = 0; i < penaltyCount; i++) {
            hand.push(generateRandomCard());
        }
        msg.textContent = `${penaltyCount}枚引きました。次の人の番です。`;
        drawStack = 0;
        updateUI();
        setTimeout(nextTurn, 1500); // ペナルティ後は自動で次へ
        return;
    }

    if (hasDrawn) {
        alert("すでにカードを引いています。出すカードがない場合は「次の番へ」を押してください。");
        return;
    }

    // 通常のドロー：手札に加えるだけ
    const newCard = generateRandomCard();
    hand.push(newCard);
    hasDrawn = true; // 引いたフラグを立てる
    
    msg.textContent = "1枚引きました。出せるカードがあれば出してください。なければ「次の番へ」を押してください。";
    
    updateUI();
}

/**
 * 手動で次の番へ回る（カードを引いた後に出せない/出したくない場合）
 */
function manualNextTurn() {
    const msg = document.getElementById('message');
    msg.textContent = "";
    nextTurn();
}

/**
 * ターンを交代する際の共通処理
 */
function nextTurn() {
    hasDrawn = false; // フラグをリセット
    const direction = isReverse ? -1 : 1;
    currentPlayerIndex = (currentPlayerIndex + direction + playerCount) % playerCount;
    updateUI();
}



function canPlay(card) {
    // 累積中はDraw2のみ、通常時は色か値が一致
    if (drawStack > 0) return card.value === 'Draw2';
    return card.color === discardCard.color || card.value === discardCard.value;
}

/**
 * プレイヤーのインデックスを現在の方向に1つ進める
 */
function moveNextPlayer() {
    const direction = isReverse ? -1 : 1;
    // (現在の番号 + 方向 + 全人数) % 全人数 で、マイナスにならずにループ計算できます
    currentPlayerIndex = (currentPlayerIndex + direction + playerCount) % playerCount;
}