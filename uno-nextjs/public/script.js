const colors = ['red', 'blue', 'green', 'yellow'];
const numbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
const specialTypes = ['Skip', 'Reverse', 'Draw2']; 

let players = [];
let currentPlayerIndex = 0;
let playerCount = 0;
let discardCard = null;
let isReverse = false; 
let hasDrawn = false; 
let drawStack = 0; 
let isHidingHands = false; // 手札を一時的に全員裏返しにしているかどうかのフラグ
let pendingNextPlayerIndex = null; // 次のターンになる予定のプレイヤー

function startGame(num) {
    playerCount = num;
    isReverse = false; 
    currentPlayerIndex = 0;
    drawStack = 0; 
    hasDrawn = false;
    isHidingHands = false;
    pendingNextPlayerIndex = null;
    
    document.getElementById('setup-screen').style.display = 'none';
    document.getElementById('game-board').style.display = 'block';

    players = [];
    for (let i = 0; i < playerCount; i++) {
        let hand = [];
        for (let j = 0; j < 5; j++) hand.push(generateRandomCard());
        players.push(hand);
    }

    do {
        discardCard = generateRandomCard();
    } while (typeof discardCard.value !== 'number');

    document.getElementById('message').textContent = "ゲームが始まりました！";
    updateUI();
}

function generateRandomCard() {
    const isSpecial = Math.random() < 0.25; 
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
    // ターン中、または確認画面中かでメッセージを変える
    if (isHidingHands) {
        document.getElementById('turn-display').textContent = 
            `【確認画面】次は プレイヤー ${pendingNextPlayerIndex + 1} の番です`;
    } else {
        document.getElementById('turn-display').textContent = 
            `プレイヤー ${currentPlayerIndex + 1} の番です ${isReverse ? '(リバース中)' : ''}`;
    }

    const discardEl = document.getElementById('discard-pile');
    discardEl.textContent = discardCard.value;
    discardEl.className = `card ${discardCard.color}`;
    discardEl.style.fontSize = typeof discardCard.value === 'string' ? '14px' : '24px';

    const container = document.getElementById('player-hands-container');
    container.innerHTML = '';

    players.forEach((hand, pIndex) => {
        const isCurrentPlayer = (pIndex === currentPlayerIndex);
        const playerDiv = document.createElement('div');
        playerDiv.className = (!isHidingHands && isCurrentPlayer) ? 'player-area active' : 'player-area';
        playerDiv.innerHTML = `<h3>プレイヤー ${pIndex + 1} (${hand.length}枚)</h3>`;
        
        const handDiv = document.createElement('div');
        handDiv.className = 'hand';

        hand.forEach((card, cIndex) => {
            const cardEl = document.createElement('div');
            
            // 「手札を隠すモード」の時、または他人の番の時は裏返しにする
            if (isHidingHands || !isCurrentPlayer) {
                cardEl.className = `card card-back`;
                cardEl.textContent = '';
            } else {
                // 自分の番かつ隠してない時だけ表にする
                cardEl.className = `card ${card.color}`;
                cardEl.textContent = card.value;
                cardEl.style.fontSize = typeof card.value === 'string' ? '14px' : '24px';
                cardEl.onclick = () => playCard(cIndex);
            }
            
            handDiv.appendChild(cardEl);
        });
        playerDiv.appendChild(handDiv);
        container.appendChild(playerDiv);
    });

    // ボタンの表示制御用
    const drawBtn = document.getElementById('draw-btn');
    const nextBtn = document.getElementById('next-btn');
    const hideBtn = document.getElementById('hide-btn');
    const revealBtn = document.getElementById('reveal-btn');

    // 全てのボタンを一旦非表示に
    drawBtn.style.display = "none";
    nextBtn.style.display = "none";
    if(hideBtn) hideBtn.style.display = "none";
    if(revealBtn) revealBtn.style.display = "none";

    if (isHidingHands) {
        // 次のプレイヤーが手札を表にするためのボタンを表示
        if(revealBtn) revealBtn.style.display = "inline";
    } else if (pendingNextPlayerIndex !== null) {
        // カードを出し終わり、次の番へ行く前に「手札を裏返す」ボタンを表示
        if(hideBtn) hideBtn.style.display = "inline";
    } else {
        // 通常の手番中のボタン制御
        if (drawStack > 0) {
            drawBtn.style.display = "inline";
            drawBtn.textContent = `ペナルティカードを引く (${drawStack * 2}枚)`;
        } else {
            drawBtn.textContent = "カードを引く";
            if (hasDrawn) {
                nextBtn.style.display = "inline"; // 「次の番へ」を表示
            } else {
                drawBtn.style.display = "inline";
            }
        }
    }
}

function playCard(cardIndex) {
    const hand = players[currentPlayerIndex];
    const card = hand[cardIndex];

    if (drawStack > 0) {
        if (card.value !== 'Draw2') {
            alert("Draw2が累積しています！重ねるか引いてください。");
            return;
        }
    } else if (!canPlay(card)) {
        alert("そのカードは出せません！");
        return;
    }

    discardCard = hand.splice(cardIndex, 1)[0];

    if (hand.length === 0) {
        alert(`プレイヤー ${currentPlayerIndex + 1} の勝利！`);
        location.reload();
        return;
    }

    // 自動でプレイヤーを切り替えず、次のプレイヤーを「予約」する
    prepareNextPlayer(card.value);
}

/**
 * 特殊効果を計算し、次のプレイヤーを「予約（保留）」状態にする
 */
function prepareNextPlayer(value) {
    const msg = document.getElementById('message');
    let nextIndex = currentPlayerIndex;

    // 次のインデックスを計算する局所関数
    const getNextIndex = (current) => {
        const direction = isReverse ? -1 : 1;
        return (current + direction + playerCount) % playerCount;
    };

    if (value === 'Skip') {
        msg.textContent = `スキップ発動！次のプレイヤーは飛ばされます。「手札を裏返す」を押してください。`;
        nextIndex = getNextIndex(currentPlayerIndex); 
        nextIndex = getNextIndex(nextIndex); // 2回進める
    } 
    else if (value === 'Reverse') {
        isReverse = !isReverse;
        msg.textContent = `リバース発動！ ${isReverse ? '左回り' : 'right回り'} になります。「手札を裏返す」を押してください。`;
        
        if (playerCount === 2) {
            nextIndex = getNextIndex(currentPlayerIndex); 
            nextIndex = getNextIndex(nextIndex);
        } else {
            nextIndex = getNextIndex(currentPlayerIndex);
        }
    } 
    else if (value === 'Draw2') {
        drawStack += 1;
        msg.textContent = `Draw2発生！ 現在のペナルティ：${drawStack * 2}枚。「手札を裏返す」を押してください。`;
        nextIndex = getNextIndex(currentPlayerIndex);
    } 
    else {
        msg.textContent = `カードを出しました。「手札を裏返す」を押してください。`;
        nextIndex = getNextIndex(currentPlayerIndex);
    }

    pendingNextPlayerIndex = nextIndex; // 次の番になる人を予約
    updateUI(); // ボタンが「手札を裏返す」に変わる
}

/**
 * 現在のプレイヤーがボタンを押し、自分の手札を裏返す処理
 */
function hideCurrentHand() {
    isHidingHands = true;
    document.getElementById('message').textContent = `画面を プレイヤー ${pendingNextPlayerIndex + 1} に渡してください。準備ができたら下のボタンを押してください。`;
    updateUI(); // ボタンが「次のプレイヤーの手札を表示」に変わる
}

/**
 * 次のプレイヤーがボタンを押し、自分の手札を表にして手番を開始する処理
 */
function revealNextHand() {
    currentPlayerIndex = pendingNextPlayerIndex; // ここで正式にプレイヤー交代
    pendingNextPlayerIndex = null; // 予約クリア
    isHidingHands = false; // 裏返しモード解除
    hasDrawn = false; // フラグクリア
    
    document.getElementById('message').textContent = `プレイヤー ${currentPlayerIndex + 1} の番です。`;
    updateUI();
}

function drawCard() {
    const hand = players[currentPlayerIndex];
    const msg = document.getElementById('message');

    if (drawStack > 0) {
        const penaltyCount = drawStack * 2;
        for (let i = 0; i < penaltyCount; i++) {
            hand.push(generateRandomCard());
        }
        drawStack = 0; 
        
        // 自動で次に行かず、手札を裏返すプロセスへ進む
        msg.textContent = `ペナルティとして ${penaltyCount} 枚引きました。「手札を裏返す」を押してください。`;
        
        const direction = isReverse ? -1 : 1;
        pendingNextPlayerIndex = (currentPlayerIndex + direction + playerCount) % playerCount;
        updateUI();
        return;
    }

    if (hasDrawn) {
        alert("すでにカードを引いています。出すカードがない場合は「次の番へ」を押してください。");
        return;
    }

    const newCard = generateRandomCard();
    hand.push(newCard);
    hasDrawn = true;
    
    msg.textContent = "1枚引きました。出せるカードがあれば出してください。なければ「次の番へ」を押してください。";
    updateUI();
}

/**
 * 通常のドロー後に出せない/出さない場合の「次の番へ」
 */
function manualNextTurn() {
    const direction = isReverse ? -1 : 1;
    pendingNextPlayerIndex = (currentPlayerIndex + direction + playerCount) % playerCount;
    
    document.getElementById('message').textContent = "パスしました。「手札を裏返す」を押してください。";
    updateUI();
}

function canPlay(card) {
    if (drawStack > 0) return card.value === 'Draw2';
    return card.color === discardCard.color || card.value === discardCard.value;
}