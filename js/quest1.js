// ==========================================
// Quest 1: 영양소 JavaScript (최종 통합본)
// ==========================================

function openHelp() { document.getElementById('help-modal').classList.add('visible'); }
function closeHelp() { document.getElementById('help-modal').classList.remove('visible'); }

// 미션 재방문 시 가이드 텍스트 변경
function updateGuideText(missionNum, defaultText) {
    const guide = document.getElementById('main-guide-text');
    if (typeof isMissionCompleted === 'function' && isMissionCompleted(1, missionNum)) {
        guide.innerText = "[완료한 미션입니다]";
        guide.style.color = "var(--text-sub)";
    } else {
        guide.innerHTML = defaultText;
        guide.style.color = "var(--text-main)";
    }
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('mission1-section').style.display = 'block';
    document.getElementById('mission2-section').style.display = 'none';
    document.getElementById('mission3-section').style.display = 'none';
    
    updateSidebarUI('nav-m1');
    updateGuideText(1, "학생들의 대화 속에서 잘못된 점을 찾아보세요!");

    document.getElementById('nav-m1').addEventListener('click', () => {
        document.getElementById('mission2-section').style.display = 'none';
        document.getElementById('mission3-section').style.display = 'none';
        document.getElementById('mission1-section').style.display = 'block';
        
        updateGuideText(1, "학생들의 대화 속에서 잘못된 점을 찾아보세요!");
        updateSidebarUI('nav-m1');
    });

    document.getElementById('nav-m2').addEventListener('click', () => {
        if (typeof canAccessMission === 'function' && canAccessMission(1, 2).access) {
            transitionToMission2();
        } else {
            alert("🔒 앞선 미션을 먼저 완료해야 열립니다!");
        }
    });

    document.getElementById('nav-m3').addEventListener('click', () => {
        if (typeof canAccessMission === 'function' && canAccessMission(1, 3).access) {
            transitionToMission3();
        } else {
            alert("🔒 앞선 미션을 먼저 완료해야 열립니다!");
        }
    });
});

function updateSidebarUI(activeNavId) {
    const missionTitles = { 1: "영양소<br>종류", 2: "기능과<br>특징", 3: "영양소<br>검출" };

    [1, 2, 3].forEach(num => {
        const id = 'nav-m' + num;
        const el = document.getElementById(id);
        if (!el) return;
        
        el.className = 'mission-item'; 
        let icon = '';
        
        const isCompleted = typeof isMissionCompleted === 'function' && isMissionCompleted(1, num);
        const isAccessible = typeof canAccessMission === 'function' ? canAccessMission(1, num).access : (num === 1 || isCompleted);
        
        if (id === activeNavId) { el.classList.add('active'); icon = '💓'; } 
        else if (isCompleted) { el.classList.add('completed'); icon = '✅'; } 
        else if (!isAccessible) { el.classList.add('locked'); icon = '🔒'; } 
        else { el.classList.add('available'); icon = '🔓'; }
        
        el.innerHTML = `
            <div class="mission-icon text-3xl mb-2">${icon}</div>
            <div class="text-sm font-bold whitespace-nowrap">Mission ${num}</div>
            <div class="text-sm leading-snug mt-1">${missionTitles[num]}</div>
        `;
    });
}

// ==========================================
// Mission 1: 학생 대화 오류 찾기 & 모달 퀴즈
// ==========================================
const statusFlags = { A: false, B: false, C: false };

const explanations = {
    A: {
        text: "우리 몸에서 에너지원으로 이용되는 영양소는 탄수화물, 단백질, 지방입니다. 바이타민은 에너지원이 아니라 적은 양으로 생명 활동을 조절하는 역할을 합니다.",
        quiz: "바이타민은 에너지원이다 ( o, x )",
        type: "ox",
        answer: "x"
    },
    B: {
        text: "단백질이 몸을 구성하는 성분인 것은 맞지만, 인체의 구성 성분 중 가장 많은 비중을 차지하는 것은 물입니다.",
        quiz: "인체의 구성 성분 중 가장 많은 성분은 ( ㅁ )이다.",
        type: "text",
        answer: "물"
    },
    C: {
        text: "지방은 몸을 구성하는 성분이자 에너지원으로 이용됩니다. 세포막을 만드는데 매우 중요하고, 특히 체온을 유지하는 데 중요한 역할을 하므로 무조건 없애야 하는 적이 아닙니다.",
        quiz: "지방은 세포막 성분, 체온 유지에 필수이다. ( o, x )",
        type: "ox",
        answer: "o"
    }
};

let currentStudentModal = '';

function checkStudent(student) {
    currentStudentModal = student;
    const data = explanations[student];
    
    document.getElementById('modal-desc').innerText = data.text;
    document.getElementById('modal-quiz-text').innerText = "Q. " + data.quiz;
    
    document.getElementById('btn-modal-close-student').style.display = 'none';
    const quizArea = document.getElementById('modal-quiz-area');
    quizArea.style.borderColor = 'var(--color-coral-light)';
    quizArea.style.backgroundColor = '#f9f9f9';
    
    const inputEl = document.getElementById('modal-input-answer');
    inputEl.value = '';
    inputEl.classList.remove('error');

    if (data.type === 'ox') {
        document.getElementById('modal-quiz-ox').style.display = 'flex';
        document.getElementById('modal-quiz-text-input').style.display = 'none';
    } else {
        document.getElementById('modal-quiz-ox').style.display = 'none';
        document.getElementById('modal-quiz-text-input').style.display = 'flex';
    }
    
    document.getElementById('explanation-modal').classList.add('visible');
}

function checkModalAnswer(userAnswer) {
    const data = explanations[currentStudentModal];
    const quizArea = document.getElementById('modal-quiz-area');
    let isCorrect = false;

    if (data.type === 'ox') {
        isCorrect = (userAnswer === data.answer);
    } else {
        const inputEl = document.getElementById('modal-input-answer');
        const val = inputEl.value.trim().replace(/\s+/g, '');
        isCorrect = (val === data.answer);
        if (!isCorrect) {
            inputEl.classList.add('error');
            setTimeout(() => inputEl.classList.remove('error'), 300);
        }
    }

    if (isCorrect) {
        quizArea.style.borderColor = 'var(--color-mint)';
        quizArea.style.backgroundColor = '#EFFFFD';
        document.getElementById('modal-quiz-ox').style.display = 'none';
        document.getElementById('modal-quiz-text-input').style.display = 'none';
        document.getElementById('modal-quiz-text').innerHTML = `🎉 정답입니다!`;
        
        document.getElementById('btn-modal-close-student').style.display = 'block';
        
        document.getElementById(`btn-${currentStudentModal.toLowerCase()}`).classList.add('checked');
        statusFlags[currentStudentModal] = true;
    } else {
        quizArea.style.animation = 'none';
        void quizArea.offsetWidth;
        quizArea.style.animation = 'shake 0.3s';
        quizArea.style.borderColor = 'var(--color-error)';
    }
}

function closeModal() {
    document.getElementById('explanation-modal').classList.remove('visible');
    if (statusFlags.A && statusFlags.B && statusFlags.C) {
        setTimeout(() => {
            document.getElementById('quiz-area').classList.add('visible');
            const container = document.getElementById('mission1-section');
            container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
        }, 400);
    }
}

function verifyQ1() {
    const input = document.getElementById('q1-input');
    const userAnswer = input.value.replace(/\s+/g, '');
    const correctAnswer = input.dataset.answer;

    if (userAnswer === correctAnswer) {
        input.style.borderColor = 'var(--color-mint)';
        input.style.backgroundColor = '#EFFFFD';
        input.classList.remove('error');
        input.disabled = true;

        document.getElementById('btn-check-q1').style.display = 'none';
        document.getElementById('q2-area').style.display = 'flex';

        const container = document.getElementById('mission1-section');
        setTimeout(() => container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' }), 100);
    } else {
        input.classList.add('error');
        setTimeout(() => input.classList.remove('error'), 300);
    }
}

function verifyQ2() {
    const inputs = document.querySelectorAll('.q2-input');
    let isAllCorrect = true;

    inputs.forEach(input => {
        const userAnswer = input.value.replace(/\s+/g, '');
        if (userAnswer === input.dataset.answer) {
            input.style.borderColor = 'var(--color-mint)';
            input.style.backgroundColor = '#EFFFFD';
            input.classList.remove('error');
            input.disabled = true;
        } else {
            input.classList.add('error');
            isAllCorrect = false;
            setTimeout(() => input.classList.remove('error'), 300);
        }
    });

    if (isAllCorrect) {
        if (window.UniversalReward) window.UniversalReward.complete(1, 1);
        launchConfettiEffect();
        
        document.getElementById('btn-check-q2').style.display = 'none';
        document.getElementById('btn-next-mission').style.display = 'block';
        
        updateSidebarUI('nav-m1');
        
        const container = document.getElementById('mission1-section');
        setTimeout(() => container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' }), 100);
    }
}

function launchConfettiEffect() {
    const duration = 1000; 
    const end = Date.now() + duration;
    (function frame() {
        confetti({ particleCount: 7, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#FF8FAB', '#82D1D9', '#FF9F1C'] });
        confetti({ particleCount: 7, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#FF8FAB', '#82D1D9', '#FF9F1C'] });
        if (Date.now() < end) requestAnimationFrame(frame);
    }());
}

// ==========================================
// Mission 2: 카드 분류 및 뱃지 퀴즈
// ==========================================
function toggleM2Cards() {
    const cardArea = document.getElementById('m2-card-area');
    const btn = document.getElementById('btn-toggle-m2-cards');
    
    if (cardArea.style.display === 'none') {
        cardArea.style.display = 'flex';
        setTimeout(() => { cardArea.style.opacity = '1'; document.getElementById('mission2-section').scrollTo({ top: 0, behavior: 'smooth' }); }, 10);
        btn.innerHTML = '카드 분류 숨기기 ⬆️';
    } else {
        cardArea.style.opacity = '0';
        setTimeout(() => { cardArea.style.display = 'none'; document.getElementById('mission2-section').scrollTo({ top: 0, behavior: 'smooth' }); }, 400);
        btn.innerHTML = '카드 분류 다시 보기 🔄';
    }
}

function transitionToMission2() {
    document.getElementById('mission1-section').style.display = 'none';
    document.getElementById('mission3-section').style.display = 'none';
    document.getElementById('mission2-section').style.display = 'flex'; 
    
    updateSidebarUI('nav-m2');
    
    if (typeof isMissionCompleted === 'function' && isMissionCompleted(1, 2)) {
        updateGuideText(2, "완료한 미션입니다. 다시 풀어볼 수 있습니다!");
        
        document.getElementById('m2-card-area').style.display = 'none';
        document.getElementById('m2-card-area').style.opacity = '0';
        document.getElementById('btn-toggle-m2-cards').style.display = 'block';
        document.getElementById('m2-quiz-area').classList.add('visible');
        
        resetM2Quiz();
    } else {
        updateGuideText(2, "카드를 <strong>드래그</strong>하거나, <strong>탭</strong>하여 알맞은 바구니에 넣으세요!");
        
        document.getElementById('m2-card-area').style.display = 'flex';
        document.getElementById('m2-card-area').style.opacity = '1';
        document.getElementById('btn-toggle-m2-cards').style.display = 'none';
        document.getElementById('m2-quiz-area').classList.remove('visible');
        
        initGame();
        resetM2Quiz();
    }
}

function resetM2Quiz() {
    document.querySelectorAll('.m2-q1-zone, .m2-q2-zone').forEach(zone => {
        zone.innerHTML = '';
        zone.style.borderColor = '';
        zone.style.backgroundColor = '';
        zone.classList.remove('error', 'drop-success');
    });
    
    const pool = document.getElementById('badge-pool');
    if (pool) {
        pool.innerHTML = '';
        const nutrients = ['탄수화물', '단백질', '지방', '바이타민', '무기염류', '물'];
        nutrients.forEach(nut => {
            const badge = document.createElement('div');
            badge.className = 'nutrient-badge dnd-item';
            badge.dataset.nutrient = nut;
            badge.innerText = nut;
            pool.appendChild(badge);
        });
    }
    
    const checkBtn = document.getElementById('btn-check-m2-quiz');
    if (checkBtn) checkBtn.style.display = 'block';
    
    const nextBtn = document.getElementById('btn-next-m3-from-m2');
    if (nextBtn) nextBtn.style.display = 'none';

    if (window.humanBadyDnD) window.humanBadyDnD.init();
}

const NUTRIENTS = ['탄수화물', '단백질', '지방', '바이타민', '무기염류', '물'];
const CARD_DATA = [
    { id: 1, nutrient: '탄수화물', type: '특징', imgSrc: null, text: '주로 에너지원으로 이용된다.' },
    { id: 2, nutrient: '탄수화물', type: '특징', imgSrc: null, text: '포도당, 엿당, 설탕, 녹말 등이 있다.' },
    { id: 3, nutrient: '탄수화물', type: '그림', imgSrc: 'images/q1_m2_01.png', text: '밥, 국수, 빵, 감자, 고구마 등에 많이 들어 있다.' },
    { id: 4, nutrient: '단백질', type: '특징', imgSrc: null, text: '주로 몸을 구성하고 생명활동을 조절한다.' },
    { id: 5, nutrient: '단백질', type: '특징', imgSrc: null, text: '기아, 고강도 운동시 에너지원으로 이용된다.' },
    { id: 6, nutrient: '단백질', type: '그림', imgSrc: 'images/q1_m2_02.png', text: '살코기, 생선, 달걀, 두부, 콩 등에 많이 들어 있다.' },
    { id: 7, nutrient: '지방', type: '특징', imgSrc: null, text: '몸을 구성하는 성분이고, 탄수화물 부족시 에너지원으로 이용된다.' },
    { id: 8, nutrient: '지방', type: '특징', imgSrc: null, text: '단열층을 만들어 체온을 유지하는 데 중요한 역할을 한다.' },
    { id: 9, nutrient: '지방', type: '그림', imgSrc: 'images/q1_m2_03.png', text: '땅콩, 깨, 버터, 참기름 등에 많이 들어 있다.' },
    { id: 10, nutrient: '바이타민', type: '특징', imgSrc: null, text: '몸의 구성성분은 아니나, 적은 양으로 생명 활동을 조절한다.' },
    { id: 11, nutrient: '바이타민', type: '특징', imgSrc: null, text: '대부분 체내에서 합성할 수 없으므로 음식물을 통해 섭취해야 한다.' },
    { id: 12, nutrient: '바이타민', type: '그림', imgSrc: 'images/q1_m2_04.png', text: '과일, 채소 등에 많이 들어 있다.' },
    { id: 13, nutrient: '무기염류', type: '특징', imgSrc: null, text: '뼈와 이 등 몸을 구성하거나 생명 활동을 조절한다.' },
    { id: 14, nutrient: '무기염류', type: '특징', imgSrc: null, text: '대부분 체내에서 합성할 수 없으므로 음식물을 통해 섭취해야 한다.' },
    { id: 15, nutrient: '무기염류', type: '특징', imgSrc: null, text: '칼슘, 칼륨, 나트륨, 철, 마그네슘 등이 있다.' },
    { id: 16, nutrient: '무기염류', type: '그림', imgSrc: 'images/q1_m2_05.png', text: '멸치, 다시마, 우유, 치즈, 버섯 등에 많이 들어 있다.' },
    { id: 17, nutrient: '물', type: '특징', imgSrc: null, text: '몸의 구성 성분 중 차지하는 비율이 가장 높다.' },
    { id: 18, nutrient: '물', type: '특징', imgSrc: null, text: '체내에서 여러 가지 물질을 운반한다.' },
    { id: 19, nutrient: '물', type: '특징', imgSrc: null, text: '더울 때 땀으로 나와 인체가 정상 체온을 유지할 수 있도록 매일 마신다.' },
    { id: 20, nutrient: '물', type: '그림', imgSrc: 'images/q1_m2_06.png', text: '우리가 매일 마시는 액체' }
];

let deck = [];
let activeCard = null;
let baskets = {};
let currentPhase = 'play';
let isCardSelected = false;

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function initGame() {
    deck = [...CARD_DATA];
    shuffle(deck);
    const elBasketsContainer = document.getElementById('baskets-container');
    elBasketsContainer.innerHTML = '';
    
    NUTRIENTS.forEach(nut => {
        baskets[nut] = [];
        const basketEl = document.createElement('div');
        basketEl.className = 'basket';
        basketEl.dataset.nutrient = nut;
        basketEl.innerHTML = `<div class="basket-title">${nut}</div><div class="basket-count" id="count-${nut}">0</div>`;
        
        basketEl.addEventListener('click', () => {
            if (basketEl.classList.contains('completed')) { openCheckModal(nut); } 
            else if (currentPhase === 'check') { openCheckModal(nut); } 
            else if (currentPhase === 'play' && isCardSelected && activeCard) {
                const elActiveZone = document.getElementById('active-zone');
                const cardEl = elActiveZone.children[0];
                processDrop(basketEl, cardEl); 
            }
        });
        elBasketsContainer.appendChild(basketEl);
    });
    updateDeckUI();
}

document.addEventListener('DOMContentLoaded', () => {
    const elDeck = document.getElementById('deck');
    if (elDeck) {
        elDeck.addEventListener('click', () => {
            if (currentPhase !== 'play') return;
            const elActiveZone = document.getElementById('active-zone');
            if (activeCard !== null) {
                const activeCardEl = elActiveZone.children[0];
                activeCardEl.style.animation = 'none'; void activeCardEl.offsetWidth; 
                activeCardEl.style.animation = 'shake 0.3s';
                return;
            }
            if (deck.length === 0) return;
            createActiveCard(deck.pop());
            updateDeckUI();
        });
    }

    const btnModalClose = document.getElementById('btn-modal-close');
    if (btnModalClose) {
        btnModalClose.addEventListener('click', () => {
            document.getElementById('check-modal').classList.remove('visible');
            const guide = document.getElementById('main-guide-text');

            if (deck.length > 0) {
                currentPhase = 'play';
                guide.innerHTML = "반납된 카드가 있습니다. 알맞은 곳에 넣으세요!";
                document.querySelectorAll('.basket').forEach(b => b.classList.remove('check-mode'));
                updateDeckUI();
            } else {
                const allCompleted = Array.from(document.querySelectorAll('.basket')).every(b => b.classList.contains('completed'));
                
                if (allCompleted) {
                    guide.innerText = "모두 분류되었습니다! 아래의 빈칸을 채워주세요.";
                    
                    const cardArea = document.getElementById('m2-card-area');
                    cardArea.style.opacity = '0';
                    setTimeout(() => {
                        cardArea.style.display = 'none';
                        document.getElementById('btn-toggle-m2-cards').style.display = 'block';
                        
                        const quizArea = document.getElementById('m2-quiz-area');
                        if (!quizArea.classList.contains('visible')) {
                            quizArea.classList.add('visible');
                            resetM2Quiz();
                            const container = document.getElementById('mission2-section');
                            container.scrollTo({ top: 0, behavior: 'smooth' });
                        }
                    }, 400);
                }
            }
        });
    }
});

function updateDeckUI() {
    const elDeck = document.getElementById('deck');
    const elDeckCount = document.getElementById('deck-count');
    if(!elDeck || !elDeckCount) return;

    elDeckCount.innerText = `(${deck.length}장)`;
    if (deck.length === 0 && activeCard === null) {
        elDeck.classList.add('empty'); elDeck.innerHTML = '스택 비어있음';
        checkPhaseTransition();
    } else {
        elDeck.classList.remove('empty'); elDeck.innerHTML = `카드 뽑기<br><span style="font-size:1rem; margin-top:5px; font-weight:normal;">(${deck.length}장)</span>`;
    }
}

function createActiveCard(data) {
    const elActiveZone = document.getElementById('active-zone');
    const elBasketsContainer = document.getElementById('baskets-container');

    activeCard = data; isCardSelected = false;
    elBasketsContainer.classList.remove('wait-for-tap'); elActiveZone.innerHTML = '';
    
    const mediaHTML = data.imgSrc ? `<img src="${data.imgSrc}" alt="이미지" class="card-img" onerror="this.style.display='none'">` : ``;
    const cardEl = document.createElement('div');
    cardEl.className = 'game-card';
    cardEl.innerHTML = `<div class="card-type">${data.type}</div>${mediaHTML}<div class="card-content">${data.text}</div>`;
    
    elActiveZone.appendChild(cardEl);
    makeDraggable(cardEl);
}

function makeDraggable(cardEl) {
    let isDragging = false, isMoved = false; 
    let startX, startY, initialX, initialY;
    const elBasketsContainer = document.getElementById('baskets-container');

    cardEl.addEventListener('pointerdown', (e) => {
        isDragging = true; isMoved = false; cardEl.setPointerCapture(e.pointerId);
        const rect = cardEl.getBoundingClientRect();
        startX = e.clientX; startY = e.clientY; initialX = rect.left; initialY = rect.top;
    });

    cardEl.addEventListener('pointermove', (e) => {
        if (!isDragging) return;
        const dx = e.clientX - startX, dy = e.clientY - startY;
        if (!isMoved && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
            isMoved = true; isCardSelected = false; cardEl.classList.remove('selected');
            elBasketsContainer.classList.remove('wait-for-tap');
            cardEl.style.position = 'fixed'; cardEl.style.left = initialX + 'px'; cardEl.style.top = initialY + 'px';
            cardEl.style.zIndex = 1000; cardEl.style.transform = 'scale(1.05) rotate(2deg)';
        }
        if (isMoved) {
            cardEl.style.left = initialX + dx + 'px'; cardEl.style.top = initialY + dy + 'px';
            cardEl.style.pointerEvents = 'none';
            const elBelow = document.elementFromPoint(e.clientX, e.clientY);
            cardEl.style.pointerEvents = 'auto';
            document.querySelectorAll('.basket').forEach(b => b.classList.remove('drag-over'));
            if (elBelow) { const basket = elBelow.closest('.basket'); if (basket) basket.classList.add('drag-over'); }
        }
    });

    cardEl.addEventListener('pointerup', (e) => {
        if (!isDragging) return;
        isDragging = false; cardEl.releasePointerCapture(e.pointerId);
        if (!isMoved) {
            isCardSelected = !isCardSelected;
            isCardSelected ? (cardEl.classList.add('selected'), elBasketsContainer.classList.add('wait-for-tap')) : (cardEl.classList.remove('selected'), elBasketsContainer.classList.remove('wait-for-tap'));
            return;
        }
        cardEl.style.pointerEvents = 'none';
        const elBelow = document.elementFromPoint(e.clientX, e.clientY);
        cardEl.style.pointerEvents = 'auto';
        document.querySelectorAll('.basket').forEach(b => b.classList.remove('drag-over'));
        processDrop(elBelow ? elBelow.closest('.basket') : null, cardEl, initialX, initialY);
    });
}

function processDrop(basket, cardEl, originalX, originalY) {
    const elActiveZone = document.getElementById('active-zone');
    const elBasketsContainer = document.getElementById('baskets-container');

    if (basket) {
        const targetNutrient = basket.dataset.nutrient;
        const currentBasketCards = baskets[targetNutrient];
        if (currentBasketCards.some(c => c.text === activeCard.text)) {
            alert(`이미 같은 내용의 카드가 들어있습니다.`);
            resetCardPosition(cardEl, originalX, originalY);
        } else {
            cardEl.style.transition = 'all 0.3s ease-in';
            cardEl.style.transform = 'scale(0.2)'; cardEl.style.opacity = '0';
            if (cardEl.style.position === 'fixed') {
                const rect = basket.getBoundingClientRect();
                cardEl.style.left = (rect.left + rect.width / 2 - 75) + 'px'; 
                cardEl.style.top = (rect.top + rect.height / 2 - 110) + 'px';
            }
            setTimeout(() => {
                baskets[targetNutrient].push(activeCard);
                document.getElementById(`count-${targetNutrient}`).innerText = currentBasketCards.length;
                elBasketsContainer.classList.remove('wait-for-tap'); elActiveZone.innerHTML = '';
                activeCard = null; isCardSelected = false; updateDeckUI();
            }, 300);
        }
    } else { resetCardPosition(cardEl, originalX, originalY); }
}

function resetCardPosition(cardEl, originalX, originalY) {
    const elBasketsContainer = document.getElementById('baskets-container');
    cardEl.classList.remove('selected'); isCardSelected = false; elBasketsContainer.classList.remove('wait-for-tap');
    if (cardEl.style.position === 'fixed' && originalX !== undefined) {
        cardEl.style.transition = 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        cardEl.style.left = originalX + 'px'; cardEl.style.top = originalY + 'px'; cardEl.style.transform = 'none';
        setTimeout(() => { cardEl.style.position = 'relative'; cardEl.style.left = '0px'; cardEl.style.top = '0px'; cardEl.style.zIndex = '1'; cardEl.style.transition = ''; }, 300);
    } else { cardEl.style.transform = 'none'; }
}

function checkPhaseTransition() {
    if (deck.length === 0 && activeCard === null) {
        currentPhase = 'check';
        const guide = document.getElementById('main-guide-text');
        guide.innerText = "깜빡이는 바구니를 터치하여 오답을 점검하세요."; guide.style.color = "var(--color-coral)";
        document.querySelectorAll('.basket').forEach(b => {
            if (baskets[b.dataset.nutrient].length > 0) b.classList.add('check-mode');
        });
    }
}

function openCheckModal(nutrient) {
    const cardsInBasket = baskets[nutrient];
    if (cardsInBasket.length === 0) return;
    const modalCardsBox = document.getElementById('modal-cards');
    document.getElementById('modal-title').innerText = `${nutrient} 점검`;
    modalCardsBox.innerHTML = '';
    
    let isPerfect = true;
    let targetCount = CARD_DATA.filter(c => c.nutrient === nutrient).length;

    cardsInBasket.forEach((card, index) => {
        const el = document.createElement('div'); el.className = 'modal-card';
        
        let isCorrect = false;
        if (card.nutrient === nutrient) { isCorrect = true; } 
        else if ((card.id === 11 || card.id === 14) && (nutrient === '바이타민' || nutrient === '무기염류')) { isCorrect = true; }

        if (isCorrect) {
            el.classList.add('correct');
            el.innerHTML = `<div>${card.type}</div>${card.imgSrc ? `<img src="${card.imgSrc}" style="width:45px;height:45px;margin-bottom:5px;">` : ''}<div style="font-size:0.75rem">${card.text}</div>`;
        } else {
            el.classList.add('wrong'); isPerfect = false;
            el.innerHTML = `<div style="color:var(--color-error)">오답!</div><div>${card.type}</div><div style="font-size:0.75rem">${card.text}</div>`;
            el.addEventListener('click', () => {
                baskets[nutrient].splice(index, 1);
                document.getElementById(`count-${nutrient}`).innerText = baskets[nutrient].length;
                deck.push(card); shuffle(deck); openCheckModal(nutrient); 
            });
        }
        modalCardsBox.appendChild(el);
    });

    if (isPerfect && cardsInBasket.length === targetCount) {
        const b = document.querySelector(`.basket[data-nutrient="${nutrient}"]`);
        b.classList.remove('check-mode'); b.classList.add('completed');
    }
    document.getElementById('check-modal').classList.add('visible');
}

// 🌟 드래그 완료 후 뱃지 무한 복사 로직 (M2/M3 통합)
document.addEventListener('dnd-dropped', (e) => {
    // Mission 2 뱃지 복사
    const pool2 = document.getElementById('badge-pool');
    if (pool2) {
        const nutrients = ['탄수화물', '단백질', '지방', '바이타민', '무기염류', '물'];
        nutrients.forEach(nut => {
            const badgesInPool = Array.from(pool2.children).filter(el => el.dataset.nutrient === nut && el.classList.contains('dnd-item'));
            if (badgesInPool.length === 0) {
                const clone = document.createElement('div');
                clone.className = 'nutrient-badge dnd-item';
                clone.dataset.nutrient = nut;
                clone.innerText = nut;
                pool2.appendChild(clone);
            } else if (badgesInPool.length > 1) {
                for (let i = 1; i < badgesInPool.length; i++) badgesInPool[i].remove();
            }
        });
    }

    // Mission 3 뱃지 복사
    const pool3 = document.getElementById('m3-badge-pool');
    if (pool3) {
        const m3Vals = ['포도당', '녹말', '단백질', '지방', '베네딕트', '아이오딘', '뷰렛', '수단Ⅲ', '푸른색', '청람색', '선홍색', '연갈색', '투명색', '황적색', '보라색'];
        m3Vals.forEach(val => {
            const badgesInPool = Array.from(pool3.children).filter(el => el.dataset.val === val && el.classList.contains('dnd-item'));
            if (badgesInPool.length === 0) {
                const clone = document.createElement('div');
                clone.className = 'nutrient-badge dnd-item';
                clone.dataset.val = val;
                clone.innerText = val;
                pool3.appendChild(clone);
            } else if (badgesInPool.length > 1) {
                for (let i = 1; i < badgesInPool.length; i++) badgesInPool[i].remove();
            }
        });
    }
    
    if(window.humanBadyDnD) window.humanBadyDnD.init();
});

function verifyM2Quiz() {
    document.querySelectorAll('.m2-q1-zone, .m2-q2-zone').forEach(z => {
        z.style.borderColor = ''; z.style.backgroundColor = ''; z.classList.remove('error');
    });

    const q1Zones = document.querySelectorAll('.m2-q1-zone');
    const q1Answers = ['탄수화물', '단백질', '지방'];
    let q1Correct = true;
    let enteredQ1 = []; 

    q1Zones.forEach(zone => {
        const item = zone.querySelector('.dnd-item');
        if (item) {
            const val = item.dataset.nutrient;
            if (q1Answers.includes(val) && !enteredQ1.includes(val)) {
                enteredQ1.push(val);
                zone.style.borderColor = 'var(--color-mint)';
                zone.style.backgroundColor = '#EFFFFD';
            } else {
                zone.classList.add('error'); q1Correct = false;
                setTimeout(() => zone.classList.remove('error'), 300);
            }
        } else {
            zone.classList.add('error'); q1Correct = false;
            setTimeout(() => zone.classList.remove('error'), 300);
        }
    });

    const q2Zones = document.querySelectorAll('.m2-q2-zone');
    let q2Correct = true;

    q2Zones.forEach(zone => {
        const item = zone.querySelector('.dnd-item');
        if (item) {
            const val = item.dataset.nutrient;
            if (val === zone.dataset.answer) {
                zone.style.borderColor = 'var(--color-mint)';
                zone.style.backgroundColor = '#EFFFFD';
            } else {
                zone.classList.add('error'); q2Correct = false;
                setTimeout(() => zone.classList.remove('error'), 300);
            }
        } else {
            zone.classList.add('error'); q2Correct = false;
            setTimeout(() => zone.classList.remove('error'), 300);
        }
    });

    if (q1Correct && q2Correct) {
        if (window.UniversalReward) window.UniversalReward.complete(1, 2);
        launchConfettiEffect();
        
        document.querySelectorAll('.nutrient-badge').forEach(badge => badge.classList.add('dnd-locked'));
        document.getElementById('btn-check-m2-quiz').style.display = 'none';

        const nextBtn = document.getElementById('btn-next-m3-from-m2');
        if (nextBtn) nextBtn.style.display = 'block';

        updateSidebarUI('nav-m2');
        const container = document.getElementById('mission2-section');
        setTimeout(() => container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' }), 100);
    }
}

// ==========================================
// Mission 3: 가상 실험 로직 & 요약 퀴즈
// ==========================================
function transitionToMission3() {
    document.getElementById('mission1-section').style.display = 'none';
    document.getElementById('mission2-section').style.display = 'none';
    document.getElementById('mission3-section').style.display = 'flex';
    
    updateSidebarUI('nav-m3');
    updateGuideText(3, "용액을 선택한 후 첫째 칸에 아이오딘-아이오딘화 칼륨 용액, 둘째 칸에 뷰렛 용액, 셋째 칸에 수단 Ⅲ 용액을 떨어뜨리세요.<br>홈판 실험이 끝난 후 베네딕트 실험을 진행하세요.");
}

const Mission3Lab = (function() {
    const solutionsMap = {
        distilled: { name: '증류수', target: [] },
        glucose: { name: '포도당', target: ['glucose'] },
        starch: { name: '녹말', target: ['starch'] },
        protein: { name: '단백질', target: ['protein'] },
        fat: { name: '지방', target: ['fat'] },
        rice: { name: '밥물', target: ['starch'] },
        onion: { name: '양파즙', target: ['glucose'] },
        egg: { name: '달걀흰자', target: ['protein'] },
        oil: { name: '식용유', target: ['fat'] }
    };

    const reagentsMap = {
        benedict: { target: 'glucose', orig: '#4fc3f7', pos: '#ff9800', origText: '푸른색', posText: '황적색' },
        iodine: { target: 'starch', orig: '#d4a373', pos: '#1a1a4b', origText: '연갈색', posText: '청람색' }, // 수정됨
        biuret: { target: 'protein', orig: '#81d4fa', pos: '#9c27b0', origText: '푸른색', posText: '보라색' },
        sudan: { target: 'fat', orig: '#ff8a80', pos: '#d50000', origText: '붉은색', posText: '선홍색' }
    };

    const TOTAL_WELLS = 27; 
    const TOTAL_BATH_TUBES = 9;

    let rowIndex = 0; 
    let hasSolution = false; 
    let activeSolutionKey = null;
    let isProcessing = false; 
    let isBenedictDone = false; 
    
    let usedSolutions = [];
    const mandatorySequence = ['distilled', 'glucose', 'starch', 'protein', 'fat'];
    let usedReagentsForCurrent = [];

    const DOM = {};

    function init() {
        DOM.wellPlate = document.getElementById('m3-well-plate');
        DOM.waterBath = document.getElementById('m3-water-bath');
        DOM.tableBody = document.querySelector('.m3-result-table tbody');
        DOM.resetBtn = document.getElementById('m3-reset-btn');
        DOM.solBtns = document.querySelectorAll('.m3-solution-btn');
        DOM.regBtns = document.querySelectorAll('.m3-reagent-btn');

        if (DOM.wellPlate) {
            buildUI();
            attachEvents();
            resetExperiment();
        }
    }

    function buildUI() {
        DOM.wellPlate.innerHTML = '';
        for (let i = 0; i < TOTAL_WELLS; i++) {
            const well = document.createElement('div');
            well.className = 'm3-well';
            DOM.wellPlate.appendChild(well);
        }

        DOM.waterBath.innerHTML = '';
        for (let i = 0; i < TOTAL_BATH_TUBES; i++) {
            const tube = document.createElement('div');
            tube.className = 'm3-bath-tube';
            DOM.waterBath.appendChild(tube);
        }

        DOM.tableBody.innerHTML = '';
        Object.keys(solutionsMap).forEach(key => {
            const tr = document.createElement('tr');
            tr.dataset.sol = key;
            tr.innerHTML = `
                <td>${solutionsMap[key].name}</td>
                <td data-reg="benedict"></td>
                <td data-reg="iodine"></td>
                <td data-reg="biuret"></td>
                <td data-reg="sudan"></td>
            `;
            DOM.tableBody.appendChild(tr);
        });
    }

    function attachEvents() {
        DOM.solBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (isProcessing) return;
                
                if (hasSolution) {
                    alert("아직 현재 용액에 3가지 시약 반응 검사가 끝나지 않았습니다. 시약을 모두 넣어주세요.");
                    return;
                }
                if (rowIndex >= 9) {
                    alert("홈판이 모두 찼습니다. 아래의 [베네딕트 용액]을 눌러 가열 반응을 확인하세요.");
                    return;
                }

                const clickedSolKey = e.target.dataset.solution;

                if (usedSolutions.includes(clickedSolKey)) {
                    alert("이미 실험한 용액입니다. 다른 용액을 선택하세요.");
                    return;
                }

                if (usedSolutions.length < 5) {
                    const requiredSol = mandatorySequence[usedSolutions.length];
                    if (clickedSolKey !== requiredSol) {
                        const reqName = solutionsMap[requiredSol].name;
                        alert(`정해진 순서대로 실험해야 합니다. 지금은 '${reqName}'을(를) 선택해주세요.`);
                        return;
                    }
                }
                
                activeSolutionKey = clickedSolKey;
                hasSolution = true;
                usedReagentsForCurrent = [];
                usedSolutions.push(clickedSolKey);
                
                e.target.style.opacity = '0.5';
                e.target.style.cursor = 'not-allowed';
                
                setWellSolution(rowIndex, activeSolutionKey);
            });
        });

        DOM.regBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (isProcessing) return;
                
                const regKey = e.target.dataset.reagent;

                if (regKey === 'benedict') {
                    if (rowIndex < 9 || hasSolution) {
                        alert("먼저 홈판에 9가지 용액과 3가지 시약 실험을 모두 완료해주세요.");
                        return;
                    }
                    if (isBenedictDone) {
                        alert("이미 베네딕트 가열 반응을 완료했습니다.");
                        return;
                    }
                    processBenedictAllAtOnce();
                    return;
                }

                if (rowIndex >= 9) {
                    alert("홈판 실험이 모두 끝났습니다. 아래의 [베네딕트 용액] 버튼을 눌러주세요.");
                    return;
                }
                if (!hasSolution) {
                    alert("용액을 먼저 넣으세요. (왼쪽 패널의 반응 용액 버튼 클릭)");
                    return;
                }
                
                if (usedReagentsForCurrent.includes(regKey)) {
                    alert("이미 이 줄에 추가한 시약입니다. 섞이지 않도록 다른 시약을 선택하세요.");
                    return;
                }

                processReaction(regKey); 
            });
        });

        DOM.resetBtn.addEventListener('click', resetExperiment);
    }

    function setWellSolution(rIndex, solKey) {
        const name = solutionsMap[solKey].name;
        
        for (let i = 0; i < 3; i++) {
            const well = DOM.wellPlate.children[rIndex * 3 + i];
            well.dataset.label = name;
            well.classList.add('active-target');
        }
        
        const tube = DOM.waterBath.children[rIndex];
        tube.dataset.label = name;
    }

    function processReaction(regKey) {
        const solData = solutionsMap[activeSolutionKey];
        const regData = reagentsMap[regKey];
        
        const isPositive = solData.target.includes(regData.target);
        const finalColor = isPositive ? regData.pos : regData.orig;
        const finalResultText = isPositive ? regData.posText : regData.origText;
        
        usedReagentsForCurrent.push(regKey);

        const wellOffset = usedReagentsForCurrent.length - 1;
        const well = DOM.wellPlate.children[rowIndex * 3 + wellOffset];
        
        well.style.backgroundColor = finalColor;
        well.classList.remove('active-target');
        
        updateTable(activeSolutionKey, regKey, finalColor, finalResultText);
        checkRowCompletion();
    }

    function processBenedictAllAtOnce() {
        isProcessing = true;
        isBenedictDone = true;
        const regData = reagentsMap['benedict'];

        for (let i = 0; i < 9; i++) {
            const tube = DOM.waterBath.children[i];
            tube.style.backgroundColor = regData.orig;
            tube.classList.add('heating-active');
        }

        setTimeout(() => {
            for (let i = 0; i < 9; i++) {
                const tube = DOM.waterBath.children[i];
                const solKey = usedSolutions[i];
                const solData = solutionsMap[solKey];
                const isPositive = solData.target.includes(regData.target);
                const finalColor = isPositive ? regData.pos : regData.orig;
                const finalResultText = isPositive ? regData.posText : regData.origText;

                tube.style.backgroundColor = finalColor;
                tube.classList.remove('heating-active');
                
                updateTable(solKey, 'benedict', finalColor, finalResultText);
            }
            isProcessing = false;
            alert("🎉 모든 실험이 완료되었습니다!");
            
            // 💡 결과 요약창 자동 열기
            const summaryArea = document.getElementById('m3-final-summary');
            if (summaryArea) {
                summaryArea.classList.add('visible');
                setTimeout(() => {
                    const container = document.getElementById('mission3-section');
                    container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
                }, 100);
            }

        }, 2000); 
    }

    function updateTable(solKey, regKey, color, text) {
        const cell = document.querySelector(`tr[data-sol="${solKey}"] td[data-reg="${regKey}"]`);
        if (cell) {
            cell.style.backgroundColor = color;
            cell.style.color = '#fff';
            cell.style.textShadow = '1px 1px 2px rgba(0,0,0,0.8)';
            cell.innerText = text;
        }
    }

    function checkRowCompletion() {
        if (usedReagentsForCurrent.length === 3) {
            hasSolution = false;
            activeSolutionKey = null;
            rowIndex++;
            
            if (rowIndex === 9) {
                setTimeout(() => {
                    alert("홈판 실험이 모두 완료되었습니다! 이제 아래의 [베네딕트 용액] 버튼을 눌러 가열 반응을 한꺼번에 확인하세요.");
                }, 300);
            }
        }
    }

    function resetExperiment() {
        rowIndex = 0;
        isProcessing = false;
        
        activeSolutionKey = null;
        hasSolution = false;
        usedSolutions = [];
        usedReagentsForCurrent = [];
        isBenedictDone = false;
        
        DOM.solBtns.forEach(btn => {
            btn.style.opacity = '1';
            btn.style.cursor = 'pointer';
        });

        Array.from(DOM.wellPlate.children).forEach(well => {
            well.style.backgroundColor = '';
            well.dataset.label = '';
            well.classList.remove('active-target');
        });
        Array.from(DOM.waterBath.children).forEach(tube => {
            tube.style.backgroundColor = 'rgba(255,255,255,0.6)';
            tube.dataset.label = '';
            tube.classList.remove('heating-active');
            tube.classList.remove('active-target');
        });
        document.querySelectorAll('.m3-result-table td[data-reg]').forEach(cell => {
            cell.style.backgroundColor = '';
            cell.innerText = '';
        });

        const summaryArea = document.getElementById('m3-final-summary');
        if (summaryArea) {
            summaryArea.classList.remove('visible');
            
            // 미션3 퀴즈 초기화
            document.querySelectorAll('.m3-quiz-slot').forEach(z => {
                z.innerHTML = ''; z.style.borderColor = ''; z.style.backgroundColor = ''; z.classList.remove('error');
            });
            document.getElementById('btn-check-m3-quiz').style.display = 'block';
            document.getElementById('btn-next-m4-from-m3').style.display = 'none';
        }
    }

    return { init };
})();

window.addEventListener('load', () => {
    if(document.getElementById('m3-well-plate')) {
        Mission3Lab.init();
    }
});

// ==========================================
// Mission 3 정답 확인 및 Mission 4 이동
// ==========================================
function verifyM3Quiz() {
    const slots = document.querySelectorAll('.m3-quiz-slot');
    let allCorrect = true;

    slots.forEach(slot => {
        const item = slot.querySelector('.dnd-item');
        if (item) {
            const val = item.dataset.val; // m3에서는 val을 사용
            if (val === slot.dataset.answer) {
                slot.style.borderColor = 'var(--color-mint)';
                slot.style.backgroundColor = '#EFFFFD';
                slot.classList.remove('error');
            } else {
                slot.classList.add('error');
                allCorrect = false;
                setTimeout(() => slot.classList.remove('error'), 300);
            }
        } else {
            slot.classList.add('error');
            allCorrect = false;
            setTimeout(() => slot.classList.remove('error'), 300);
        }
    });

    if (allCorrect) {
        if (window.UniversalReward) window.UniversalReward.complete(1, 3);
        launchConfettiEffect();
        
        document.querySelectorAll('#m3-badge-pool .dnd-item, .m3-quiz-slot .dnd-item').forEach(badge => {
            badge.classList.add('dnd-locked');
        });
        
        document.getElementById('btn-check-m3-quiz').style.display = 'none';
        document.getElementById('btn-next-m4-from-m3').style.display = 'block';

        if (typeof updateSidebarUI === 'function') updateSidebarUI('nav-m3');
        
        const container = document.getElementById('mission3-section');
        setTimeout(() => container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' }), 100);
    }
}

function transitionToMission4() {
    alert("🚀 Mission 4로 이동합니다! (이후 추가 개발이 필요합니다)");
}
