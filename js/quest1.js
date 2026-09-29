/* =========================================================================
   Quest 1 - Mission 2: 영양소 특징 분류 (탭 & 탭 + 드래그 지원 / 버그 수정판)
========================================================================= */

const NUTRIENTS = ['탄수화물', '단백질', '지방', '바이타민', '무기염류', '물'];
const CARD_DATA = [
    { id: 1, nutrient: '탄수화물', type: '특징', imgSrc: null, text: '주로 에너지원으로 이용된다.' },
    { id: 2, nutrient: '탄수화물', type: '특징', imgSrc: null, text: '포도당, 엿당, 설탕, 녹말 등이 있다.' },
    { id: 3, nutrient: '탄수화물', type: '그림', imgSrc: 'images/q1_m2_01.png', text: '밥, 국수, 빵, 감자, 고구마 등에 많이 들어 있다.' },
    { id: 4, nutrient: '단백질', type: '특징', imgSrc: null, text: '주로 몸을 구성하고 생명활동을 조절한다.' },
    { id: 5, nutrient: '단백질', type: '특징', imgSrc: null, text: '에너지원으로 이용된다.' },
    { id: 6, nutrient: '단백질', type: '그림', imgSrc: 'images/q1_m2_02.png', text: '살코기, 생선, 달걀, 두부, 콩 등에 많이 들어 있다.' },
    { id: 7, nutrient: '지방', type: '특징', imgSrc: null, text: '몸을 구성하는 성분이고, 에너지원으로 이용된다.' },
    { id: 8, nutrient: '지방', type: '특징', imgSrc: null, text: '체온을 유지하는 데 중요한 역할을 한다.' },
    { id: 9, nutrient: '지방', type: '그림', imgSrc: 'images/q1_m2_03.png', text: '땅콩, 깨, 버터, 참기름 등에 많이 들어 있다.' },
    { id: 10, nutrient: '바이타민', type: '특징', imgSrc: null, text: '적은 양으로 생명 활동을 조절한다.' },
    { id: 11, nutrient: '바이타민', type: '특징', imgSrc: null, text: '대부분 체내에서 합성할 수 없으므로 음식물을 통해 섭취해야 한다.' },
    { id: 12, nutrient: '바이타민', type: '그림', imgSrc: 'images/q1_m2_04.png', text: '과일, 채소 등에 많이 들어 있다.' },
    { id: 13, nutrient: '무기염류', type: '특징', imgSrc: null, text: '뼈와 이 등 몸을 구성하거나 생명 활동을 조절한다.' },
    { id: 14, nutrient: '무기염류', type: '특징', imgSrc: null, text: '대부분 체내에서 합성할 수 없으므로 음식물을 통해 섭취해야 한다.' },
    { id: 15, nutrient: '무기염류', type: '특징', imgSrc: null, text: '칼슘, 칼륨, 나트륨, 철, 마그네슘 등이 있다.' },
    { id: 16, nutrient: '무기염류', type: '그림', imgSrc: 'images/q1_m2_05.png', text: '멸치, 다시마, 우유, 치즈, 버섯 등에 많이 들어 있다.' },
    { id: 17, nutrient: '물', type: '특징', imgSrc: null, text: '몸의 구성 성분 중 가장 많다.' },
    { id: 18, nutrient: '물', type: '특징', imgSrc: null, text: '여러 가지 물질을 운반한다.' },
    { id: 19, nutrient: '물', type: '특징', imgSrc: null, text: '체온을 조절하는 데 도움을 준다.' },
    { id: 20, nutrient: '물', type: '그림', imgSrc: 'images/q1_m2_06.png', text: '우리가 매일 마시는 물' }
];

let deck = [];
let activeCard = null;
let baskets = {};
let currentPhase = 'play';
let isCardSelected = false;

const elDeck = document.getElementById('deck');
const elDeckCount = document.getElementById('deck-count');
const elActiveZone = document.getElementById('active-zone');
const elBasketsContainer = document.getElementById('baskets-container');
const elGuideText = document.getElementById('guide-text');

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function initGame() {
    deck = [...CARD_DATA];
    shuffle(deck);
    
    NUTRIENTS.forEach(nut => {
        baskets[nut] = [];
        const basketEl = document.createElement('div');
        basketEl.className = 'basket';
        basketEl.dataset.nutrient = nut;
        basketEl.innerHTML = `<div class="basket-title">${nut}</div><div class="basket-count" id="count-${nut}">0</div>`;
        
        basketEl.addEventListener('click', () => {
            if (currentPhase === 'check' && !basketEl.classList.contains('completed')) {
                openCheckModal(nut);
            } else if (currentPhase === 'play' && isCardSelected && activeCard) {
                const cardEl = elActiveZone.children[0];
                processDrop(basketEl, cardEl); 
            }
        });
        elBasketsContainer.appendChild(basketEl);
    });
    updateDeckUI();
}

elDeck.addEventListener('click', () => {
    if (currentPhase !== 'play') return;
    if (activeCard !== null) {
        const activeCardEl = elActiveZone.children[0];
        activeCardEl.style.animation = 'none';
        void activeCardEl.offsetWidth; 
        activeCardEl.style.animation = 'shake 0.3s';
        return;
    }
    if (deck.length === 0) return;

    const cardData = deck.pop();
    updateDeckUI();
    createActiveCard(cardData);
});

function updateDeckUI() {
    elDeckCount.innerText = `(${deck.length}장)`;
    if (deck.length === 0 && activeCard === null) {
        elDeck.classList.add('empty');
        elDeck.innerHTML = '스택 비어있음';
        checkPhaseTransition();
    } else {
        elDeck.classList.remove('empty');
        elDeck.innerHTML = `카드 뽑기<br><span style="font-size:1rem; margin-top:5px; font-weight:normal;">(${deck.length}장)</span>`;
    }
}

function createActiveCard(data) {
    activeCard = data;
    isCardSelected = false;
    elBasketsContainer.classList.remove('wait-for-tap');
    elActiveZone.innerHTML = '';
    
    const mediaHTML = data.imgSrc 
        ? `<img src="${data.imgSrc}" alt="카드이미지" class="card-img" onerror="this.style.display='none'">` 
        : ``;

    const cardEl = document.createElement('div');
    cardEl.className = 'game-card';
    cardEl.innerHTML = `
        <div class="card-type">${data.type}</div>${mediaHTML}
        <div class="card-content">${data.text}</div>
    `;
    elActiveZone.appendChild(cardEl);

    makeDraggable(cardEl);
}

function makeDraggable(cardEl) {
    let isDragging = false;
    let isMoved = false; 
    let startX, startY, initialX, initialY;

    cardEl.addEventListener('pointerdown', (e) => {
        isDragging = true;
        isMoved = false;
        cardEl.setPointerCapture(e.pointerId);
        
        const rect = cardEl.getBoundingClientRect();
        startX = e.clientX;
        startY = e.clientY;
        initialX = rect.left;
        initialY = rect.top;
    });

    cardEl.addEventListener('pointermove', (e) => {
        if (!isDragging) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;

        if (!isMoved && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
            isMoved = true;
            isCardSelected = false;
            cardEl.classList.remove('selected');
            elBasketsContainer.classList.remove('wait-for-tap');
            
            cardEl.style.position = 'fixed';
            cardEl.style.left = initialX + 'px';
            cardEl.style.top = initialY + 'px';
            cardEl.style.zIndex = 1000;
            cardEl.style.transform = 'scale(1.05) rotate(2deg)';
        }

        if (isMoved) {
            cardEl.style.left = initialX + dx + 'px';
            cardEl.style.top = initialY + dy + 'px';

            cardEl.style.pointerEvents = 'none';
            const elBelow = document.elementFromPoint(e.clientX, e.clientY);
            cardEl.style.pointerEvents = 'auto';

            document.querySelectorAll('.basket').forEach(b => b.classList.remove('drag-over'));
            if (elBelow) {
                const basket = elBelow.closest('.basket');
                if (basket) basket.classList.add('drag-over');
            }
        }
    });

    cardEl.addEventListener('pointerup', (e) => {
        if (!isDragging) return;
        isDragging = false;
        cardEl.releasePointerCapture(e.pointerId);

        if (!isMoved) {
            isCardSelected = !isCardSelected;
            if (isCardSelected) {
                cardEl.classList.add('selected');
                elBasketsContainer.classList.add('wait-for-tap');
            } else {
                cardEl.classList.remove('selected');
                elBasketsContainer.classList.remove('wait-for-tap');
            }
            return;
        }

        cardEl.style.pointerEvents = 'none';
        const elBelow = document.elementFromPoint(e.clientX, e.clientY);
        cardEl.style.pointerEvents = 'auto';
        
        document.querySelectorAll('.basket').forEach(b => b.classList.remove('drag-over'));
        const basket = elBelow ? elBelow.closest('.basket') : null;

        processDrop(basket, cardEl, initialX, initialY);
    });
}

function processDrop(basket, cardEl, originalX, originalY) {
    if (basket) {
        const targetNutrient = basket.dataset.nutrient;
        const currentBasketCards = baskets[targetNutrient];
        const hasSameContent = currentBasketCards.some(c => c.text === activeCard.text);
        
        if (hasSameContent) {
            alert(`앗! 이 바구니에는 이미 동일한 내용의 카드가 들어있어요.`);
            resetCardPosition(cardEl, originalX, originalY);
        } else {
            if (cardEl.style.position === 'fixed') {
                const rect = basket.getBoundingClientRect();
                cardEl.style.transition = 'all 0.3s ease-in';
                cardEl.style.left = (rect.left + rect.width / 2 - 75) + 'px'; 
                cardEl.style.top = (rect.top + rect.height / 2 - 110) + 'px';
                cardEl.style.transform = 'scale(0.2)';
                cardEl.style.opacity = '0';
            } else {
                cardEl.style.transition = 'all 0.3s ease-in';
                cardEl.style.transform = 'scale(0.2)';
                cardEl.style.opacity = '0';
            }

            setTimeout(() => {
                baskets[targetNutrient].push(activeCard);
                document.getElementById(`count-${targetNutrient}`).innerText = currentBasketCards.length;
                
                elBasketsContainer.classList.remove('wait-for-tap');
                elActiveZone.innerHTML = '';
                activeCard = null;
                isCardSelected = false;
                updateDeckUI();
            }, 300);
        }
    } else {
        resetCardPosition(cardEl, originalX, originalY);
    }
}

function resetCardPosition(cardEl, originalX, originalY) {
    cardEl.classList.remove('selected');
    isCardSelected = false;
    elBasketsContainer.classList.remove('wait-for-tap');

    if (cardEl.style.position === 'fixed' && originalX !== undefined) {
        cardEl.style.transition = 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        cardEl.style.left = originalX + 'px';
        cardEl.style.top = originalY + 'px';
        cardEl.style.transform = 'none';

        setTimeout(() => {
            cardEl.style.position = 'relative';
            cardEl.style.left = '0px';
            cardEl.style.top = '0px';
            cardEl.style.zIndex = '1';
            cardEl.style.transition = '';
        }, 300);
    } else {
        cardEl.style.transform = 'none';
    }
}

function checkPhaseTransition() {
    if (deck.length === 0 && activeCard === null) {
        currentPhase = 'check';
        elGuideText.innerText = "모두 분류했습니다! 깜빡이는 바구니를 터치하여 오답을 점검하세요.";
        elGuideText.style.color = "var(--color-coral)";
        
        document.querySelectorAll('.basket').forEach(b => {
            if (baskets[b.dataset.nutrient].length > 0) {
                b.classList.add('check-mode');
            }
        });
    }
}

function openCheckModal(nutrient) {
    const cardsInBasket = baskets[nutrient];
    if (cardsInBasket.length === 0) return;

    const modal = document.getElementById('check-modal');
    const modalCardsBox = document.getElementById('modal-cards');
    document.getElementById('modal-title').innerText = `${nutrient} 바구니 점검`;
    modalCardsBox.innerHTML = '';

    let isPerfect = true;
    let targetCount = CARD_DATA.filter(c => c.nutrient === nutrient).length;

    cardsInBasket.forEach((card, index) => {
        const el = document.createElement('div');
        el.className = 'modal-card';
        const isCorrect = card.nutrient === nutrient;
        
        const imgHTML = card.imgSrc ? `<img src="${card.imgSrc}" style="width:45px;height:45px;margin-bottom:5px; border-radius:4px;">` : ``;

        if (isCorrect) {
            el.classList.add('correct');
            el.innerHTML = `<div>${card.type}</div>${imgHTML}<div style="font-size:0.75rem">${card.text}</div>`;
        } else {
            el.classList.add('wrong');
            isPerfect = false;
            el.innerHTML = `<div style="color:var(--color-error)">오답!</div><div>${card.type}</div><div style="font-size:0.75rem">${card.text}</div>`;
            
            el.addEventListener('click', () => {
                baskets[nutrient].splice(index, 1);
                document.getElementById(`count-${nutrient}`).innerText = baskets[nutrient].length;
                deck.push(card);
                shuffle(deck);
                openCheckModal(nutrient); 
            });
        }
        modalCardsBox.appendChild(el);
    });

    if (isPerfect && cardsInBasket.length === targetCount) {
        const b = document.querySelector(`.basket[data-nutrient="${nutrient}"]`);
        b.classList.remove('check-mode');
        b.classList.add('completed');
    }

    modal.classList.add('visible');
}

document.getElementById('btn-modal-close').addEventListener('click', () => {
    document.getElementById('check-modal').classList.remove('visible');
    
    if (deck.length > 0) {
        currentPhase = 'play';
        elGuideText.innerHTML = "반납된 카드가 있습니다. <strong>탭</strong>하거나 <strong>드래그</strong>하여 알맞은 곳에 넣으세요!";
        elGuideText.style.color = "var(--text-sub)";
        document.querySelectorAll('.basket').forEach(b => b.classList.remove('check-mode'));
        updateDeckUI();
    } else {
        const allBaskets = Array.from(document.querySelectorAll('.basket'));
        const allCompleted = allBaskets.every(b => b.classList.contains('completed'));
        
        if (allCompleted) {
            elGuideText.innerText = "🎉 미션 2 클리어! 영양소의 기능과 특징을 완벽하게 분류했습니다! 🎉";
            elGuideText.style.color = "var(--color-mint)";
            document.querySelector('.mission-item.active').classList.replace('active', 'completed');
            setTimeout(() => alert("축하합니다! 보상 티켓을 획득했습니다! 🎟️"), 500);
        }
    }
});

initGame();