// =====================================
// Quest 2 공통 / 미션 제어 로직
// =====================================
function launchConfettiEffect() {
    const duration = 1000; 
    const end = Date.now() + duration;
    (function frame() {
        confetti({ particleCount: 7, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#FF8FAB', '#82D1D9', '#FF9F1C'] });
        confetti({ particleCount: 7, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#FF8FAB', '#82D1D9', '#FF9F1C'] });
        if (Date.now() < end) requestAnimationFrame(frame);
    }());
}

function updateGuideText(defaultText) {
    const guide = document.getElementById('main-guide-text');
    if (guide) {
        guide.innerHTML = defaultText;
        guide.style.color = "var(--text-main)";
    }
}

function updateSidebarUI(activeNavId) {
    const missionTitles = { 1: "소화<br>계", 2: "소화의<br>종류", 3: "영양소<br>분해", 4: "영양소<br>흡수" };

    [1, 2, 3, 4].forEach(num => {
        const id = 'nav-m' + num;
        const el = document.getElementById(id);
        if (!el) return;
        
        el.className = 'mission-item w-full'; 
        let icon = '';
        
        const isCompleted = typeof isMissionCompleted === 'function' && isMissionCompleted(2, num);
        let isAccessible = false;
        
        // [수정: 피드백 3번 반영] M1은 기획 의도상 무조건 개방. M2~M4는 일관성 있게 canAccessMission 사용
        if (num === 1) {
            isAccessible = true;
        } else if (typeof canAccessMission === 'function') {
            const res = canAccessMission(2, num);
            if (res) isAccessible = res.access;
        } else if (isCompleted || (typeof isMissionCompleted === 'function' && isMissionCompleted(2, num - 1))) {
            isAccessible = true; // 안전장치 Fallback
        }
        
        if (id === activeNavId) { el.classList.add('active'); icon = '💓'; } 
        else if (isCompleted) { el.classList.add('completed'); icon = '✅'; } 
        else if (!isAccessible) { el.classList.add('locked'); icon = '🔒'; } 
        else { el.classList.add('available'); icon = '🔓'; }
        
        el.innerHTML = `
            <div class="mission-icon text-xl mb-2">${icon}</div>
            <div class="text-sm font-bold whitespace-nowrap">Mission ${num}</div>
            <div class="text-sm leading-snug mt-1">${missionTitles[num]}</div>
        `;
    });
}

document.addEventListener('DOMContentLoaded', () => {
    updateSidebarUI('nav-m1');
    updateGuideText("문장을 완성하여 음식물의 이동 과정을 알아보세요!");

    document.getElementById('nav-m1').addEventListener('click', () => {
        document.getElementById('mission2-section').style.display = 'none';
        document.getElementById('mission3-section').style.display = 'none';
        document.getElementById('mission4-section').style.display = 'none';
        document.getElementById('mission1-section').style.display = 'block';
        
        // [수정: 피드백 7번 반영] M1 재진입 시 상태 확인 기준을 hidden 클래스 유무로 변경
        if (!document.getElementById('m1-phase3-table').classList.contains('hidden')) {
            updateGuideText("정확합니다! 소화기관계의 구조와 경로를 완벽히 이해했습니다.");
        } else if (!document.getElementById('m1-phase2-animation').classList.contains('hidden')) {
            updateGuideText("정답입니다. 애니메이션을 체험해 보세요!");
        } else {
            updateGuideText("문장을 완성하여 음식물의 이동 과정을 알아보세요!");
        }
        updateSidebarUI('nav-m1');
    });

    document.getElementById('nav-m2').addEventListener('click', () => {
        if (typeof canAccessMission === 'function' && canAccessMission(2, 2).access) transitionToMission2();
        else alert("🔒 앞선 미션을 먼저 완료해야 열립니다!");
    });

    document.getElementById('nav-m3').addEventListener('click', () => {
        if (typeof canAccessMission === 'function' && canAccessMission(2, 3).access) transitionToMission3();
        else alert("🔒 앞선 미션을 먼저 완료해야 열립니다!");
    });

    document.getElementById('nav-m4').addEventListener('click', () => {
        if (typeof canAccessMission === 'function' && canAccessMission(2, 4).access) transitionToMission4();
        else alert("🔒 앞선 미션을 먼저 완료해야 열립니다!");
    });
});

// =====================================
// Mission 1 로직
// =====================================
function verifyM1Sentence() {
    const slots = document.querySelectorAll('.m1-sentence-slot');
    let isAllCorrect = true;
    let filledCount = 0;

    slots.forEach(slot => {
        const item = slot.querySelector('.dnd-item');
        if (item) {
            filledCount++;
            if (item.dataset.val === slot.dataset.answer) {
                slot.style.borderColor = 'var(--color-mint)';
                slot.style.background = '#EFFFFD';
                item.classList.add('dnd-locked');
            } else {
                slot.classList.add('error');
                isAllCorrect = false;
                setTimeout(() => slot.classList.remove('error'), 300);
            }
        } else {
            slot.classList.add('error');
            isAllCorrect = false;
            setTimeout(() => slot.classList.remove('error'), 300);
        }
    });

    if (filledCount < 5) {
        alert("5개의 빈칸에 알맞은 단어를 모두 넣어주세요!");
        return;
    }
    if (!isAllCorrect) {
        alert("빈칸에 알맞은 단어를 다시 확인해 보세요!");
        return;
    }

    document.getElementById('btn-check-m1-sentence').style.display = 'none';
    updateGuideText("정답입니다. 애니메이션 체험을 해보세요!");
    
    const pool1Wrap = document.getElementById('m1-pool-phase1-wrap');
    if (pool1Wrap) pool1Wrap.style.display = 'none';

    const phase2 = document.getElementById('m1-phase2-animation');
    phase2.classList.remove('hidden');
    setTimeout(() => { 
        phase2.classList.remove('opacity-0');
        phase2.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
}

function showM1Table() {
    document.getElementById('btn-show-table').style.display = 'none';
    initM1Phase2Badges(); 
    const phase3 = document.getElementById('m1-phase3-table');
    phase3.classList.remove('hidden');
    setTimeout(() => { 
        phase3.classList.remove('opacity-0');
        phase3.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
}

function initM1Phase2Badges() {
    const pool = document.getElementById('m1-badge-pool-2');
    if (!pool) return;
    
    // [수정: 피드백 7번 반영] 기존에 잠긴(정답) 배지들은 제외하고 풀 생성 (상태 복원)
    const lockedVals = Array.from(document.querySelectorAll('.m1-phase2-slot .dnd-locked')).map(el => el.dataset.val);
    let organs = ['입', '식도', '위', '작은창자', '큰창자', '항문', '침샘', '간', '쓸개', '이자'];
    lockedVals.forEach(v => { const idx = organs.indexOf(v); if(idx > -1) organs.splice(idx, 1); });

    pool.innerHTML = '';
    organs.sort(() => Math.random() - 0.5);
    organs.forEach(val => {
        const badge = document.createElement('div');
        badge.className = 'organ-badge dnd-item';
        badge.dataset.val = val;
        badge.innerText = val;
        pool.appendChild(badge);
    });
    if (window.humanBadyDnD) window.humanBadyDnD.init();
}

function verifyM1Phase2() {
    const slots = document.querySelectorAll('.m1-phase2-slot');
    slots.forEach(z => { z.style.borderColor = ''; z.style.backgroundColor = ''; z.classList.remove('error'); });

    let allCorrect = true; let filledCount = 0; let groups = {}; 
    
    slots.forEach(slot => {
        const item = slot.querySelector('.dnd-item');
        if (item) {
            filledCount++;
            const val = item.dataset.val;
            const expectedAnswers = slot.dataset.answer.split(',');
            const group = slot.dataset.group;

            if (group) {
                if (!groups[group]) groups[group] = { values: [], slots: [] };
                groups[group].values.push(val);
                groups[group].slots.push(slot);
            } else {
                if (expectedAnswers.includes(val)) {
                    slot.style.borderColor = 'var(--color-mint)'; slot.style.backgroundColor = '#EFFFFD'; item.classList.add('dnd-locked');
                } else {
                    slot.classList.add('error'); allCorrect = false; setTimeout(() => slot.classList.remove('error'), 300);
                }
            }
        } else {
            slot.classList.add('error'); allCorrect = false; setTimeout(() => slot.classList.remove('error'), 300);
        }
    });

    if (filledCount < 20) { alert("표와 아래 빈칸에 모든 소화 기관을 배치해주세요!"); return; }

    for (const [groupName, data] of Object.entries(groups)) {
        const expectedList = data.slots[0].dataset.answer.split(','); 
        const actualValues = data.values;
        const isUnique = new Set(actualValues).size === actualValues.length;
        const isAllValid = actualValues.every(v => expectedList.includes(v));

        if (isUnique && isAllValid) {
            data.slots.forEach(slot => { slot.style.borderColor = 'var(--color-mint)'; slot.style.backgroundColor = '#EFFFFD'; slot.querySelector('.dnd-item').classList.add('dnd-locked'); });
        } else {
            data.slots.forEach(slot => { slot.classList.add('error'); setTimeout(() => slot.classList.remove('error'), 300); }); allCorrect = false;
        }
    }

    if (!allCorrect) { alert("잘못 연결된 뱃지가 있습니다. 깜빡이는 빨간색 칸을 다시 확인해 보세요!"); return; }

    if (allCorrect) {
        // [수정: 피드백 1번 반영] UniversalReward -> completeMissionAction 교체
        if (window.completeMissionAction) window.completeMissionAction(2, 1);
        
        launchConfettiEffect();
        const pool2Wrap = document.getElementById('m1-pool-phase2-wrap');
        if (pool2Wrap) pool2Wrap.style.display = 'none';

        document.getElementById('btn-check-m1-phase2').style.display = 'none';
        document.getElementById('btn-next-m1').classList.remove('hidden');
        updateGuideText("완벽합니다! 소화기관계의 구조와 구성을 정확히 파악했습니다.");
        updateSidebarUI('nav-m1');
    }
}

// =====================================
// Mission 2 로직
// =====================================
function transitionToMission2() {
    document.getElementById('mission1-section').style.display = 'none'; document.getElementById('mission3-section').style.display = 'none'; document.getElementById('mission4-section').style.display = 'none';
    document.getElementById('mission2-section').style.display = 'block';
    updateGuideText("세포막 시뮬레이션 및 소화의 원리를 알아보세요!"); updateSidebarUI('nav-m2');
    if(window.humanBadyDnD) window.humanBadyDnD.init();
}

// [수정: 피드백 2번 반영] 누락되었던 showM2Summary 추가
window.showM2Summary = function() {
    document.getElementById('btn-show-m2-summary').classList.add('hidden');
    const summarySec = document.getElementById('m2-summary-section');
    summarySec.classList.remove('hidden');
    
    // Summary에 쓰일 초기 뱃지 생성 (재진입 고려)
    const lockedVals = Array.from(document.querySelectorAll('.m2-slot .dnd-locked')).map(el => el.dataset.val);
    const pool = document.getElementById('m2-s1-pool');
    if (pool) {
        let vals = ['못들어감', '소화', '들어감', '순환', '합성'];
        lockedVals.forEach(v => { const idx = vals.indexOf(v); if(idx>-1) vals.splice(idx,1); });
        pool.innerHTML = '';
        vals.forEach(val => {
            const badge = document.createElement('div'); badge.className = 'nutrient-badge dnd-item';
            badge.dataset.val = val; badge.innerText = val; pool.appendChild(badge);
        });
        if(window.humanBadyDnD) window.humanBadyDnD.init();
    }
    setTimeout(() => { summarySec.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 50);
};

let starchBounceCount = 0; let glucoseEnterCount = 0;
function checkM2SimProgress() { 
    if (starchBounceCount >= 1 && glucoseEnterCount >= 3) { 
        document.getElementById('btn-show-m2-summary').classList.remove('hidden'); 
    } 
}

function verifyM2Step1() {
    let isAllCorrect = true; let filledCount = 0; const s1Slots = document.querySelectorAll('.m2-slot');
    s1Slots.forEach(slot => {
        const s1Item = slot.querySelector('.dnd-item');
        if (s1Item) {
            filledCount++;
            if (s1Item.dataset.val === slot.dataset.answer) {
                slot.style.borderColor = 'var(--color-mint)'; slot.style.backgroundColor = '#EFFFFD'; s1Item.classList.add('dnd-locked');
            } else { slot.classList.add('error'); isAllCorrect = false; setTimeout(() => slot.classList.remove('error'), 300); }
        } else { slot.classList.add('error'); isAllCorrect = false; setTimeout(() => slot.classList.remove('error'), 300); }
    });
    if (filledCount < 3) { alert("Step 1의 빈칸 3개를 모두 채워주세요!"); return; }
    if (!isAllCorrect) { alert("오답이 있습니다. 빈칸을 다시 확인해주세요!"); return; }
    document.getElementById('btn-check-m2-step1').style.display = 'none';
    const poolM2 = document.getElementById('m2-s1-pool'); if(poolM2) poolM2.style.display = 'none';
    const step2 = document.getElementById('m2-step2-section'); step2.classList.remove('hidden');
    setTimeout(() => { step2.classList.remove('opacity-0'); step2.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 50);
}

function showLabMessage(msg, isError = false) {
    const msgEl = document.getElementById('lab-result-msg');
    msgEl.innerHTML = isError ? `<span style="color:#e74c3c;">${msg}</span>` : msg;
    if (isError) {
        msgEl.style.animation = 'shake 0.3s';
        setTimeout(() => msgEl.style.animation = '', 300);
    }
}

let labState2 = {
    starch: false, active: null,  
    tubes: { a: { add: null, ind: null }, b: { add: null, ind: null }, c: { add: null, ind: null }, d: { add: null, ind: null } }
};

function selectReagent(r, btnEl) {
    if (r === 'starch') {
        if (labState2.starch) return;
        labState2.starch = true; labState2.active = null; 
        ['a','b','c','d'].forEach(id => {
            const liq = document.getElementById('liquid-' + id);
            liq.style.height = '25%'; liq.style.backgroundColor = 'rgba(230, 230, 230, 0.8)';
            document.getElementById('td-sol-' + id).innerText = '녹말';
        });
        showLabMessage("🍚 모든 시험관(A, B, C, D)에 녹말 용액이 들어갔습니다.<br>이제 우측의 <b>비교 용액</b> 버튼을 클릭하고 넣을 <b>시험관</b>을 클릭하세요.");
        document.querySelectorAll('.reagent-btn').forEach(b => b.classList.remove('active-reagent'));
        btnEl.style.opacity = '0.5'; btnEl.style.cursor = 'default';
        return;
    }
    if (!labState2.starch) { showLabMessage('🚨 먼저 1번 [녹말 용액]을 전체 시험관에 넣어주세요!', true); return; }

    document.querySelectorAll('.reagent-btn').forEach(b => b.classList.remove('active-reagent'));
    btnEl.classList.add('active-reagent'); labState2.active = r;

    let reagentName = "";
    if (r === 'water') reagentName = "💧 증류수";
    else if (r === 'saliva') reagentName = "👅 침 용액";
    else if (r === 'iodine') reagentName = "🧪 아이오딘-아이오딘화 칼륨";
    else if (r === 'benedict') reagentName = "🔥 베네딕트 용액";
    showLabMessage(`[${reagentName}] 선택됨! 넣을 <b>시험관 모형</b>을 클릭하세요.`);
}

function applyReagent(id) {
    if (!labState2.active) {
        if (!labState2.starch) showLabMessage("🚨 먼저 우측의 [녹말 용액] 버튼을 클릭하세요!", true);
        else showLabMessage("🚨 우측 또는 위쪽의 시약 버튼을 먼저 선택해 주세요.", true);
        return; 
    }
    
    const tube = labState2.tubes[id];
    const group = (id === 'a' || id === 'b') ? ['a', 'b'] : ['c', 'd'];
    const otherId = group.find(x => x !== id);
    const otherTube = labState2.tubes[otherId];
    const r = labState2.active;
    const liq = document.getElementById('liquid-' + id);

    if (r === 'water') {
        if (tube.add) { showLabMessage(`🚨 시험관 ${id.toUpperCase()} 에는 이미 비교 용액이 들어있습니다.`, true); return; }
        if (otherTube.add === 'water') { showLabMessage(`🚨 해당 조(${group[0].toUpperCase()},${group[1].toUpperCase()})에 이미 증류수가 들어있는 시험관이 있습니다.<br>다른 시험관을 선택하세요.`, true); return; }
        tube.add = 'water'; liq.style.height = '40%'; document.getElementById('td-sol-' + id).innerText = '녹말 + 증류수';
        showLabMessage(`💧 시험관 ${id.toUpperCase()}에 증류수가 들어갔습니다. 다음 시약을 선택하세요.`);
    }
    else if (r === 'saliva') {
        if (tube.add) { showLabMessage(`🚨 시험관 ${id.toUpperCase()} 에는 이미 비교 용액이 들어있습니다.`, true); return; }
        if (otherTube.add === 'saliva') { showLabMessage(`🚨 해당 조(${group[0].toUpperCase()},${group[1].toUpperCase()})에 이미 침 용액이 들어있는 시험관이 있습니다.<br>다른 시험관을 선택하세요.`, true); return; }
        tube.add = 'saliva'; liq.style.height = '40%'; document.getElementById('td-sol-' + id).innerText = '녹말 + 침';
        showLabMessage(`👅 시험관 ${id.toUpperCase()}에 침 용액이 들어갔습니다. 다음 시약을 선택하세요.`);
    }
    else if (r === 'iodine') {
        if (id === 'c' || id === 'd') { showLabMessage("🚨 아이오딘-아이오딘화 칼륨 용액은 시험관 A, B에만 넣어야 합니다!", true); return; }
        if (!tube.add) { showLabMessage("🚨 먼저 비교 용액(증류수나 침)을 넣어주세요.", true); return; }
        if (tube.ind) { showLabMessage("🚨 이미 확인 시약이 들어있습니다.", true); return; }
        tube.ind = 'iodine'; liq.style.height = '55%';
        if (tube.add === 'water') {
            liq.style.backgroundColor = '#1a237e'; 
            document.getElementById('td-color-' + id).innerHTML = '<span style="color:#1a237e;font-weight:bold;">청람색</span>';
            document.getElementById('ans-slot-' + id).dataset.answer = "녹말 있음"; 
        } else {
            liq.style.backgroundColor = '#d2b48c'; 
            document.getElementById('td-color-' + id).innerHTML = '<span style="color:#d2b48c;font-weight:bold;">연한 갈색</span>';
            document.getElementById('ans-slot-' + id).dataset.answer = "녹말 없음"; 
        }
        document.getElementById('td-reagent-' + id).innerText = '아이오딘'; showLabMessage(`🧪 시험관 ${id.toUpperCase()}에 아이오딘 반응을 확인했습니다.`); checkLabComplete();
    }
    else if (r === 'benedict') {
        if (id === 'a' || id === 'b') { showLabMessage("🚨 베네딕트 용액은 시험관 C, D에만 넣어야 합니다!", true); return; }
        if (!tube.add) { showLabMessage("🚨 먼저 비교 용액(증류수나 침)을 넣어주세요.", true); return; }
        if (tube.ind) { showLabMessage("🚨 이미 확인 시약이 들어있습니다.", true); return; }
        tube.ind = 'benedict'; liq.classList.add('heating-effect'); setTimeout(() => liq.classList.remove('heating-effect'), 1200);
        liq.style.height = '55%';
        if (tube.add === 'water') {
            liq.style.backgroundColor = '#add8e6'; 
            document.getElementById('td-color-' + id).innerHTML = '<span style="color:#add8e6;font-weight:bold;">연한 푸른색</span>';
            document.getElementById('ans-slot-' + id).dataset.answer = "엿당 없음"; 
        } else {
            liq.style.backgroundColor = '#ff4500'; 
            document.getElementById('td-color-' + id).innerHTML = '<span style="color:#ff4500;font-weight:bold;">황적색</span>';
            document.getElementById('ans-slot-' + id).dataset.answer = "엿당 있음"; 
        }
        document.getElementById('td-reagent-' + id).innerText = '베네딕트(가열)'; showLabMessage(`🔥 시험관 ${id.toUpperCase()}에 가열 후 베네딕트 반응을 확인했습니다.`); checkLabComplete();
    }
}

function checkLabComplete() {
    if (labState2.tubes.a.ind && labState2.tubes.b.ind && labState2.tubes.c.ind && labState2.tubes.d.ind) {
        showLabMessage("🎉 실험이 완료되었습니다. 표 아래의 빈칸으로 뱃지를 드래그하여 결과를 채우고 확인버튼을 누르세요!");
        document.querySelectorAll('.reagent-btn').forEach(b => b.classList.remove('active-reagent')); labState2.active = null;
    }
}

function resetLab2() {
    labState2 = { starch: false, active: null, tubes: { a: { add: null, ind: null }, b: { add: null, ind: null }, c: { add: null, ind: null }, d: { add: null, ind: null } } };
    document.querySelectorAll('.reagent-btn').forEach(b => { b.classList.remove('active-reagent'); b.style.opacity = '1'; b.style.cursor = 'pointer'; });
    ['a','b','c','d'].forEach(id => {
        const liq = document.getElementById('liquid-' + id);
        liq.style.height = '0%'; liq.style.backgroundColor = 'transparent'; liq.classList.remove('heating-effect');
        document.getElementById('td-sol-' + id).innerText = '-'; document.getElementById('td-reagent-' + id).innerText = '-'; document.getElementById('td-color-' + id).innerText = '-';
    });
    
    // [수정: 피드백 7번 반영] 초기화 시 표기 클래스는 정리하되 고정 정답 데이터(data-answer)는 건드리지 않고 반환
    const tablePool = document.getElementById('m2-step2-table-pool');
    document.querySelectorAll('.m2-step2-slot .dnd-item').forEach(item => { item.classList.remove('error', 'dnd-locked'); tablePool.appendChild(item); });
    document.querySelectorAll('.m2-step2-slot').forEach(slot => { slot.style.borderColor = ''; slot.style.backgroundColor = ''; slot.classList.remove('error'); });

    const summaryPool = document.getElementById('m2-step2-summary-pool');
    document.querySelectorAll('.m2-step2-summary-slot .dnd-item').forEach(item => { item.classList.remove('error', 'dnd-locked'); summaryPool.appendChild(item); });
    document.querySelectorAll('.m2-step2-summary-slot').forEach(slot => { slot.style.borderColor = ''; slot.style.backgroundColor = ''; slot.classList.remove('error'); });

    document.getElementById('m2-step2-table-badge-wrap').style.display = 'block'; document.getElementById('btn-check-m2-table').style.display = 'block';
    document.getElementById('m2-step2-summary-section').classList.add('hidden'); document.getElementById('btn-check-m2-summary').style.display = 'block';
    if (summaryPool.parentElement) summaryPool.parentElement.style.display = 'block';

    showLabMessage("우측의 [녹말 용액]을 클릭하여 시험관 전체에 담아주세요.");
}

function verifyM2Step2Table() {
    if (!(labState2.tubes.a.ind && labState2.tubes.b.ind && labState2.tubes.c.ind && labState2.tubes.d.ind)) { alert("먼저 모든 시험관의 실험을 완료해주세요!"); return; }
    let isAllCorrect = true; let filledCount = 0; const slots = document.querySelectorAll('.m2-step2-slot');
    slots.forEach(slot => {
        const item = slot.querySelector('.dnd-item');
        if (item) {
            filledCount++;
            if (item.dataset.val === slot.dataset.answer) { slot.style.borderColor = 'var(--color-mint)'; slot.style.backgroundColor = '#EFFFFD'; item.classList.add('dnd-locked'); }
            else { slot.classList.add('error'); isAllCorrect = false; setTimeout(() => slot.classList.remove('error'), 300); }
        } else { slot.classList.add('error'); isAllCorrect = false; setTimeout(() => slot.classList.remove('error'), 300); }
    });
    if (filledCount < 4) { alert("표의 빈칸 4개를 모두 채워주세요!"); return; }
    if (!isAllCorrect) { alert("잘못 채워진 결과가 있습니다. 다시 확인해주세요!"); return; }
    document.getElementById('btn-check-m2-table').style.display = 'none'; document.getElementById('m2-step2-table-badge-wrap').style.display = 'none'; 
    const summarySec = document.getElementById('m2-step2-summary-section'); summarySec.classList.remove('hidden');
    setTimeout(() => { summarySec.classList.remove('opacity-0'); summarySec.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 50);
}

function verifyM2Step2Summary() {
    let isAllCorrect = true; let filledCount = 0; const slots = document.querySelectorAll('.m2-step2-summary-slot');
    slots.forEach(slot => {
        const item = slot.querySelector('.dnd-item');
        if (item) {
            filledCount++;
            if (item.dataset.val === slot.dataset.answer) { slot.style.borderColor = 'var(--color-mint)'; slot.style.backgroundColor = '#EFFFFD'; item.classList.add('dnd-locked'); } 
            else { slot.classList.add('error'); isAllCorrect = false; setTimeout(() => slot.classList.remove('error'), 300); }
        } else { slot.classList.add('error'); isAllCorrect = false; setTimeout(() => slot.classList.remove('error'), 300); }
    });
    if (filledCount < 7) { alert("정리 문장의 빈칸 7개를 모두 채워주세요!"); return; }
    if (!isAllCorrect) { alert("잘못 채워진 빈칸이 있습니다. 다시 확인해주세요!"); return; }
    document.getElementById('btn-check-m2-summary').style.display = 'none';
    const summaryPool = document.getElementById('m2-step2-summary-pool').parentElement; if(summaryPool) summaryPool.style.display = 'none';
    const step3 = document.getElementById('m2-step3-section'); step3.classList.remove('hidden');
    setTimeout(() => { step3.classList.remove('opacity-0'); step3.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 50);
}

function verifyM2() {
    let isAllCorrect = true; const baskets = document.querySelectorAll('.m2-basket'); let totalCardsInBaskets = 0;
    baskets.forEach(basket => {
        const answerType = basket.dataset.answer; const cards = basket.querySelectorAll('.dnd-item'); totalCardsInBaskets += cards.length;
        cards.forEach(card => {
            if (card.dataset.type === answerType) { card.classList.add('dnd-locked'); basket.classList.add('drop-success'); } 
            else { isAllCorrect = false; basket.classList.add('error'); setTimeout(() => basket.classList.remove('error'), 300); }
        });
    });
    if (totalCardsInBaskets < 8) { alert("모든 카드(8개)를 기계적/화학적 소화 바구니에 분류해주세요!"); return; }
    if (!isAllCorrect) { alert("잘못 분류된 카드가 있습니다. 다시 확인해주세요!"); return; }
    
    // [수정: 피드백 1번 반영] UniversalReward -> completeMissionAction
    if (window.completeMissionAction) window.completeMissionAction(2, 2); 
    launchConfettiEffect();
    
    document.getElementById('btn-check-m2').style.display = 'none';
    const m2Pool = document.getElementById('m2-pool'); if(m2Pool) m2Pool.style.display = 'none';
    document.getElementById('btn-next-m2').classList.remove('hidden');
    updateGuideText("완벽합니다! 소화의 원리를 잘 이해했네요."); updateSidebarUI('nav-m2');
    const container = document.getElementById('mission2-section'); setTimeout(() => container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' }), 100);
}

// =====================================
// Mission 3 로직
// =====================================
function transitionToMission3() {
    document.getElementById('mission1-section').style.display = 'none'; document.getElementById('mission2-section').style.display = 'none'; document.getElementById('mission4-section').style.display = 'none';
    document.getElementById('mission3-section').style.display = 'block';
    updateGuideText("소화 과정을 완성하고, 최종 분해 산물을 알아보세요!"); updateSidebarUI('nav-m3');
    initM3S1Badges();
}

let m3LayersClicked = { saliva: false, pepsin: false, bile: false, pancreas: false };
function toggleLayer(layerName) {
    m3LayersClicked[layerName] = true;
    document.getElementById('layer-' + layerName).classList.remove('opacity-0');
    
    const btn = document.getElementById('btn-layer-' + layerName);
    btn.style.backgroundColor = 'var(--color-mint)'; btn.style.borderColor = 'var(--color-mint)'; btn.style.color = 'white';
    
    if (Object.values(m3LayersClicked).every(val => val === true)) {
        const finalBtn = document.getElementById('btn-layer-elements');
        finalBtn.disabled = false; finalBtn.classList.remove('bg-gray-400', 'cursor-not-allowed', 'opacity-80');
        finalBtn.classList.add('bg-[#FF9F1C]', 'animate-[pulseBounce_1s_infinite]');
    }
}
function toggleFinalLayer() {
    document.getElementById('layer-elements').classList.remove('opacity-0');
    const finalBtn = document.getElementById('btn-layer-elements');
    finalBtn.classList.remove('animate-[pulseBounce_1s_infinite]'); finalBtn.style.backgroundColor = '#e67e22';
}

function initM3S1Badges() {
    const pool = document.getElementById('m3-s1-pool'); if (!pool) return;
    
    // [수정: 피드백 7번 반영] 상태 복원 (중복 배지 생성 방지)
    const lockedVals = Array.from(document.querySelectorAll('.m3-s1-slot .dnd-locked')).map(el => el.dataset.val);
    let vals = ['아밀레이스', '아밀레이스', '펩신', '트립신', '라이페이스'];
    lockedVals.forEach(v => { const idx = vals.indexOf(v); if(idx > -1) vals.splice(idx, 1); });

    pool.innerHTML = '';
    vals.sort(() => Math.random() - 0.5).forEach(val => {
        const clone = document.createElement('div'); clone.className = 'nutrient-badge dnd-item border-[#1864AB] text-[#1864AB]';
        clone.dataset.val = val; clone.innerText = val; pool.appendChild(clone);
    });
    if(window.humanBadyDnD) window.humanBadyDnD.init();
}

function verifyM3S1() {
    const slots = document.querySelectorAll('.m3-s1-slot'); let allCorrect = true; let filledCount = 0;
    slots.forEach(slot => {
        const item = slot.querySelector('.dnd-item');
        if (item) {
            filledCount++;
            if (item.dataset.val === slot.dataset.answer) { slot.style.borderColor = 'var(--color-mint)'; slot.style.backgroundColor = '#EFFFFD'; item.classList.add('dnd-locked'); } 
            else { slot.classList.add('error'); allCorrect = false; setTimeout(() => slot.classList.remove('error'), 300); }
        } else { slot.classList.add('error'); allCorrect = false; setTimeout(() => slot.classList.remove('error'), 300); }
    });

    if (filledCount < 5) { alert("모든 빈칸에 알맞은 효소를 배치해 주세요!"); return; }
    if (allCorrect) {
        document.getElementById('btn-check-m3-s1').style.display = 'none';
        const s2 = document.getElementById('m3-step2-section'); s2.classList.remove('hidden');
        initM3S2Badges();
        setTimeout(() => { s2.classList.remove('opacity-0'); s2.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 50);
    } else { alert("오답이 있습니다. 다시 확인해 보세요!"); }
}

function initM3S2Badges() {
    const pool = document.getElementById('m3-s2-pool'); if (!pool) return;
    
    // [수정: 피드백 7번 반영] 상태 복원 (중복 배지 생성 방지)
    const lockedVals = Array.from(document.querySelectorAll('.m3-s2-slot .dnd-locked')).map(el => el.dataset.val);
    let vals = ['포도당', '아미노산', '지방산', '모노글리세라이드', '아밀레이스', '펩신', '트립신', '라이페이스'];
    lockedVals.forEach(v => { const idx = vals.indexOf(v); if(idx > -1) vals.splice(idx, 1); });

    pool.innerHTML = '';
    vals.sort(() => Math.random() - 0.5).forEach(val => {
        const clone = document.createElement('div'); clone.className = 'nutrient-badge dnd-item';
        if (['아밀레이스', '펩신', '트립신', '라이페이스'].includes(val)) clone.classList.add('border-[#1864AB]', 'text-[#1864AB]');
        clone.dataset.val = val; clone.innerText = val; pool.appendChild(clone);
    });
    if(window.humanBadyDnD) window.humanBadyDnD.init();
}

function verifyM3S2() {
    const slots = document.querySelectorAll('.m3-s2-slot'); let allCorrect = true; let groupM3 = {}; 
    slots.forEach(slot => {
        const item = slot.querySelector('.dnd-item');
        if (!item) { slot.classList.add('error'); allCorrect = false; setTimeout(() => slot.classList.remove('error'), 300); return; }
        const val = item.dataset.val; const expectedAnswers = slot.dataset.answer.split(','); const group = slot.dataset.group;
        if (group) { 
            if (!groupM3[group]) groupM3[group] = { values: [], slots: [] };
            groupM3[group].values.push(val); groupM3[group].slots.push(slot);
        } else {
            if (expectedAnswers.includes(val)) { slot.style.borderColor = 'var(--color-mint)'; slot.style.backgroundColor = '#EFFFFD'; item.classList.add('dnd-locked'); } 
            else { slot.classList.add('error'); allCorrect = false; setTimeout(() => slot.classList.remove('error'), 300); }
        }
    });

    for (const [groupName, data] of Object.entries(groupM3)) {
        const expectedList = data.slots[0].dataset.answer.split(','); const actualValues = data.values;
        const isUnique = new Set(actualValues).size === actualValues.length;
        const isAllValid = actualValues.every(v => expectedList.includes(v));
        if (isUnique && isAllValid) {
            data.slots.forEach(slot => { slot.style.borderColor = 'var(--color-mint)'; slot.style.backgroundColor = '#EFFFFD'; slot.querySelector('.dnd-item').classList.add('dnd-locked'); });
        } else {
            data.slots.forEach(slot => { slot.classList.add('error'); setTimeout(() => slot.classList.remove('error'), 300); }); allCorrect = false;
        }
    }

    if (allCorrect) {
        document.getElementById('btn-check-m3-s2').style.display = 'none';
        const intro = document.getElementById('m3-step3-intro'); intro.classList.remove('hidden');
        setTimeout(() => { intro.classList.remove('opacity-0'); intro.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 50);
    } else { alert("빈칸을 모두 채웠는지, 또는 잘못 연결된 부분이 없는지 확인해 보세요!"); }
}

function showM3Step3Main() {
    document.getElementById('btn-check-m3-s3-intro').style.display = 'none';
    const main = document.getElementById('m3-step3-main'); main.classList.remove('hidden');
    initM3S3Badges();
    setTimeout(() => { main.classList.remove('opacity-0'); main.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 50);
}

function initM3S3Badges() {
    const pool = document.getElementById('m3-s3-pool'); if (!pool) return;
    
    // [수정: 피드백 7번 반영] 상태 복원 (중복 배지 생성 방지)
    const lockedVals = Array.from(document.querySelectorAll('.enzyme-drop-zone .dnd-locked')).map(el => el.dataset.val);
    let vals = [
        '침에 들어 있음', '이자액에 들어 있음', '위액에 들어 있음', 
        '녹말을 엿당으로 분해', '단백질을 더 작은 크기로 분해', '작은 크기 단백질을 더욱더 작은 크기로 분해', '지방을 지방산과 모노글리세라이드로 분해', 
        '입안에서 작용', '작은창자에서 작용', '위에서 작용', 
        '침샘에서 만듦', '이자에서 만듦'
    ];
    lockedVals.forEach(v => { const idx = vals.indexOf(v); if(idx > -1) vals.splice(idx, 1); });

    pool.innerHTML = '';
    vals.forEach(val => {
        const clone = document.createElement('div'); clone.className = 'enzyme-text-badge dnd-item';
        clone.dataset.val = val; clone.innerText = val; pool.appendChild(clone);
    });
    if(window.humanBadyDnD) window.humanBadyDnD.init();
}

function verifyM3S3() {
    const requiredAnswers = {
        'zone-amylase': ['침에 들어 있음', '이자액에 들어 있음', '녹말을 엿당으로 분해', '입안에서 작용', '작은창자에서 작용', '침샘에서 만듦', '이자에서 만듦'],
        'zone-pepsin': ['위액에 들어 있음', '단백질을 더 작은 크기로 분해', '위에서 작용'],
        'zone-trypsin': ['이자액에 들어 있음', '작은 크기 단백질을 더욱더 작은 크기로 분해', '작은창자에서 작용', '이자에서 만듦'],
        'zone-lipase': ['이자액에 들어 있음', '지방을 지방산과 모노글리세라이드로 분해', '작은창자에서 작용', '이자에서 만듦']
    };

    let isAllCorrect = true;

    for (const [zoneId, reqList] of Object.entries(requiredAnswers)) {
        const zone = document.getElementById(zoneId);
        const items = Array.from(zone.querySelectorAll('.dnd-item'));
        const values = items.map(item => item.dataset.val);
        
        const isExactSet = reqList.length === values.length && reqList.every(v => values.includes(v));
        
        if (isExactSet) {
            zone.classList.add('drop-success');
            items.forEach(item => item.classList.add('dnd-locked'));
        } else {
            isAllCorrect = false;
            zone.classList.add('error');
            setTimeout(() => zone.classList.remove('error'), 300);
        }
    }

    if (isAllCorrect) {
        // [수정: 피드백 1번 반영] UniversalReward -> completeMissionAction
        if (window.completeMissionAction) window.completeMissionAction(2, 3);
        launchConfettiEffect();
        document.getElementById('btn-check-m3-s3').style.display = 'none';
        
        const poolWrap = document.getElementById('m3-s3-pool').parentElement;
        if(poolWrap) poolWrap.style.display = 'none';
        
        document.getElementById('btn-next-m3').classList.remove('hidden');
        updateGuideText("정확합니다! 소화효소 4총사의 특징을 완벽하게 파악했네요.");
        updateSidebarUI('nav-m3');
    } else {
        alert("아직 부족한 특징이 있거나 잘못 들어간 특징이 있습니다.\n각 효소의 특징을 모두 찾아서 넣어주세요!");
    }
}

// =====================================
// Mission 4 로직
// =====================================
function transitionToMission4() {
    document.getElementById('mission1-section').style.display = 'none'; document.getElementById('mission2-section').style.display = 'none'; document.getElementById('mission3-section').style.display = 'none';
    document.getElementById('mission4-section').style.display = 'flex';
    updateGuideText("소화된 영양소가 작은창자에서 어떻게 흡수되는지 정리해 보세요!"); updateSidebarUI('nav-m4');
    initM4Badges();
}

function initM4Badges() {
    const pool = document.getElementById('m4-badge-pool'); if (!pool) return;
    
    // [수정: 피드백 7번 반영] 상태 복원 (중복 배지 생성 방지)
    const lockedVals = Array.from(document.querySelectorAll('.m4-quiz-slot .dnd-locked')).map(el => el.dataset.val);
    let vals = ['기계적', '화학적', '포도당', '아미노산', '지방산', '모노글리세라이드', '모세혈관', '암죽관'];
    lockedVals.forEach(v => { const idx = vals.indexOf(v); if(idx > -1) vals.splice(idx, 1); });

    pool.innerHTML = ''; 
    for (let i = vals.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [vals[i], vals[j]] = [vals[j], vals[i]]; }
    vals.forEach(val => {
        const badge = document.createElement('div'); badge.className = 'nutrient-badge dnd-item';
        badge.dataset.val = val; badge.innerText = val; pool.appendChild(badge);
    });
    if (window.humanBadyDnD) window.humanBadyDnD.init();
}

function verifyM4() {
    const slots = document.querySelectorAll('.m4-quiz-slot');
    slots.forEach(z => { z.style.borderColor = ''; z.style.backgroundColor = ''; z.classList.remove('error'); });
    let allCorrect = true; let groups = {}; 

    slots.forEach(slot => {
        const item = slot.querySelector('.dnd-item');
        if (!item) { slot.classList.add('error'); allCorrect = false; setTimeout(() => slot.classList.remove('error'), 300); return; }
        const val = item.dataset.val; const expectedAnswers = slot.dataset.answer.split(','); const group = slot.dataset.group;
        if (group) {
            if (!groups[group]) groups[group] = { values: [], slots: [] };
            groups[group].values.push(val); groups[group].slots.push(slot);
        } else {
            if (expectedAnswers.includes(val)) { slot.style.borderColor = 'var(--color-mint)'; slot.style.backgroundColor = '#EFFFFD'; } 
            else { slot.classList.add('error'); allCorrect = false; setTimeout(() => slot.classList.remove('error'), 300); }
        }
    });

    for (const [groupName, data] of Object.entries(groups)) {
        const expectedList = data.slots[0].dataset.answer.split(','); const actualValues = data.values;
        const isUnique = new Set(actualValues).size === actualValues.length;
        const isAllValid = actualValues.every(v => expectedList.includes(v));
        if (isUnique && isAllValid) { data.slots.forEach(slot => { slot.style.borderColor = 'var(--color-mint)'; slot.style.backgroundColor = '#EFFFFD'; }); } 
        else { data.slots.forEach(slot => { slot.classList.add('error'); setTimeout(() => slot.classList.remove('error'), 300); }); allCorrect = false; }
    }

    if (allCorrect) {
        // [수정: 피드백 1번 반영] UniversalReward -> completeMissionAction
        if (window.completeMissionAction) window.completeMissionAction(2, 4); 
        launchConfettiEffect();
        
        document.querySelectorAll('.m4-quiz-slot .dnd-item').forEach(badge => badge.classList.add('dnd-locked'));
        const badgePool = document.getElementById('m4-badge-pool'); if (badgePool && badgePool.parentElement) badgePool.parentElement.style.display = 'none';
        document.getElementById('btn-check-m4').style.display = 'none';
        updateSidebarUI('nav-m4'); updateGuideText("🎉 대단해요! Quest 2 소화를 완벽하게 클리어했습니다!");
        
        const successArea = document.getElementById('m4-success-area'); 
        if (successArea) { 
            successArea.classList.remove('hidden'); 
            successArea.classList.add('flex');
            setTimeout(() => { successArea.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, 150);
        }
    } else { alert("아직 채우지 않은 빈칸이 있거나 잘못 연결된 뱃지가 있습니다.\n깜빡이는 빨간색 칸을 다시 확인해 보세요!"); }
}

// =====================================
// Drag & Drop 공통 이벤트 (무한 복사 및 방어 로직)
// =====================================
document.addEventListener('dragstart', (e) => {
    if (e.target.classList && e.target.classList.contains('dnd-item')) { setTimeout(() => { e.target.style.opacity = '0.01'; }, 0); }
});
document.addEventListener('dragend', (e) => {
    if (e.target.classList && e.target.classList.contains('dnd-item')) { e.target.style.opacity = '1'; }
});

document.addEventListener('dnd-dropped', (e) => {
    const { item, zone } = e.detail;

    if (zone) {
        // [수정: 피드백 6번 반영] 이미 정답 체크가 완료되어 잠긴(locked) 아이템이 있는 슬롯에 새로운 뱃지 드롭 시 방어
        const lockedInZone = Array.from(zone.querySelectorAll('.dnd-locked')).filter(el => el !== item);
        if (lockedInZone.length > 0 && (zone.dataset.dndCapacity == "1" || zone.classList.contains('answer-slot'))) {
            item.remove();
            alert("이미 정답이 확정되어 잠긴 칸입니다!");
            return;
        }

        // Mission 3 - Step 3 (효소 4총사) 중복 뱃지 방지
        if (zone.classList.contains('enzyme-drop-zone')) {
            const existingItems = Array.from(zone.querySelectorAll('.dnd-item')).filter(child => child !== item && child.dataset.val === item.dataset.val);
            if (existingItems.length > 0) {
                alert('이 효소에는 이미 같은 특징이 등록되어 있습니다!');
                item.remove();
            }
        }
    }

    // Mission 2 - Step 3 (소화 종류 8개 카드 체크)
    setTimeout(() => {
        const m2PoolCheck = document.getElementById('m2-pool');
        if (m2PoolCheck && m2PoolCheck.querySelectorAll('.dnd-item').length === 0) {
            const btnM2 = document.getElementById('btn-check-m2'); if(btnM2) btnM2.classList.remove('hidden');
        } else if (m2PoolCheck) {
            const btnM2 = document.getElementById('btn-check-m2'); if(btnM2) btnM2.classList.add('hidden');
        }
    }, 50);

    // Mission 2 - 세포막 단백질 통로
    if (zone && zone.id === 'protein-door') {
        const itemVal = item.dataset.val;
        if (itemVal === '녹말') {
            starchBounceCount++; checkM2SimProgress();
            const xMark = document.getElementById('protein-x-mark'); xMark.classList.add('show'); zone.classList.add('error');
            document.getElementById('m2-cell-outside').appendChild(item); item.style.transform = 'none'; item.classList.add('error'); setTimeout(() => item.classList.remove('error'), 300);
            setTimeout(() => { xMark.classList.remove('show'); zone.classList.remove('error'); }, 2000);
        } else if (itemVal === '포도당') {
            glucoseEnterCount++; checkM2SimProgress();
            item.style.transition = 'opacity 0.3s ease, transform 0.3s ease'; item.style.opacity = '0'; item.style.transform = 'scale(0.5)';
            setTimeout(() => {
                document.getElementById('m2-cell-inside').appendChild(item);
                item.style.opacity = '1'; item.style.transform = 'translateX(-30px)'; item.classList.add('dnd-locked');
                item.style.backgroundColor = '#EFFFFD'; item.style.borderColor = 'var(--color-mint)';
            }, 300);
        } else { document.getElementById('m2-cell-outside').appendChild(item); item.style.transform = 'none'; }
    }  

    // 무한 생성 헬퍼
    const replenishPool = (poolId, classNames, expectedVals) => {
        const pool = document.getElementById(poolId);
        if (pool && (!pool.parentElement.style.display || pool.parentElement.style.display !== 'none')) {
            expectedVals.forEach(val => {
                const badgesInPool = Array.from(pool.children).filter(el => el.dataset.val === val && el.classList.contains('dnd-item'));
                if (badgesInPool.length === 0) {
                    let customClass = classNames;
                    if (poolId === 'm3-s2-pool' && ['아밀레이스', '펩신', '트립신', '라이페이스'].includes(val)) {
                        customClass += ' border-[#1864AB] text-[#1864AB]';
                    }
                    const clone = document.createElement('div'); clone.className = `${customClass} dnd-item`;
                    clone.dataset.val = val; clone.innerText = val; pool.appendChild(clone);
                } else if (badgesInPool.length > 1) {
                    for (let i = 1; i < badgesInPool.length; i++) badgesInPool[i].remove();
                }
            });
        }
    };

    replenishPool('m1-badge-pool-1', 'nutrient-badge', ['소화계', '순환계',  '분해', '흡수', '세포']);
    replenishPool('m1-badge-pool-2', 'organ-badge', ['입', '식도', '위', '작은창자', '큰창자', '항문', '침샘', '간', '쓸개', '이자']);
    if (document.getElementById('m2-summary-section') && !document.getElementById('m2-summary-section').classList.contains('hidden')) {
        replenishPool('m2-s1-pool', 'nutrient-badge', ['못들어감', '소화', '들어감', '순환', '합성']);
    }
    
    const m3s1Pool = document.getElementById('m3-s1-pool');
    if (m3s1Pool) {
        const currentAmylase = Array.from(m3s1Pool.children).filter(el => el.dataset.val === '아밀레이스').length;
        if (currentAmylase < 2) {
            for(let i=currentAmylase; i<2; i++) {
                const clone = document.createElement('div'); clone.className = 'nutrient-badge border-[#1864AB] text-[#1864AB] dnd-item';
                clone.dataset.val = '아밀레이스'; clone.innerText = '아밀레이스'; m3s1Pool.appendChild(clone);
            }
        } else if (currentAmylase > 2) {
            const amList = Array.from(m3s1Pool.children).filter(el => el.dataset.val === '아밀레이스');
            for (let i = 2; i < amList.length; i++) amList[i].remove();
        }
        replenishPool('m3-s1-pool', 'nutrient-badge border-[#1864AB] text-[#1864AB]', ['펩신', '트립신', '라이페이스']);
    }

    replenishPool('m3-s2-pool', 'nutrient-badge', ['포도당', '아미노산', '지방산', '모노글리세라이드', '아밀레이스', '펩신', '트립신', '라이페이스']);
    replenishPool('m3-s3-pool', 'enzyme-text-badge', [
        '침에 들어 있음', '이자액에 들어 있음', '위액에 들어 있음', 
        '녹말을 엿당으로 분해', '단백질을 더 작은 크기로 분해', '작은 크기 단백질을 더욱더 작은 크기로 분해', '지방을 지방산과 모노글리세라이드로 분해', 
        '입안에서 작용', '작은창자에서 작용', '위에서 작용', 
        '침샘에서 만듦', '이자에서 만듦'
    ]);
    replenishPool('m4-badge-pool', 'nutrient-badge', ['기계적', '화학적', '포도당', '아미노산', '지방산', '모노글리세라이드', '모세혈관', '암죽관']);
    
    if (window.humanBadyDnD) window.humanBadyDnD.init();
});

// =====================================
// 세포막 시뮬레이션 떠다니는 애니메이션
// =====================================
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('m2-cell-outside');
    if (!container) return;

    const badges = Array.from(container.querySelectorAll('.nutrient-badge'));
    const badgeData = badges.map(badge => {
        return {
            el: badge,
            w: badge.offsetWidth || (badge.dataset.val === '녹말' ? 180 : 70), 
            h: badge.offsetHeight || (badge.dataset.val === '녹말' ? 100 : 40), 
            x: Math.random() * 100, y: Math.random() * 100, 
            vx: (Math.random() - 0.5) * 1.5, vy: (Math.random() - 0.5) * 1.5
        };
    });

    function floatBadges() {
        const currentWidth = container.clientWidth || 300; 
        const currentHeight = container.clientHeight || 450;

        badgeData.forEach(data => {
            if (data.el.parentElement !== container) return;
            
            // [수정: 피드백 5번 반영] 드래그 중단 조건을 dnd-source-dragging으로 정확히 일치시킴
            if (data.el.style.opacity === '0.01' || data.el.classList.contains('dnd-source-dragging')) return;

            let maxX = Math.max(0, currentWidth - data.w - 50); 
            let maxY = Math.max(0, currentHeight - data.h);
            
            data.x += data.vx; data.y += data.vy;

            if (data.x <= 0) { data.x = 0; data.vx *= -1; }
            if (data.x >= maxX) { data.x = maxX; data.vx *= -1; }
            if (data.y <= 0) { data.y = 0; data.vy *= -1; }
            if (data.y >= maxY) { data.y = maxY; data.vy *= -1; }

            data.el.style.left = data.x + 'px'; data.el.style.top = data.y + 'px'; data.el.style.transform = 'none'; 
        });
        requestAnimationFrame(floatBadges);
    }
    floatBadges();
});