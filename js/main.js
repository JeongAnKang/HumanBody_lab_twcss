// ==========================================
// 1. 교사 설정 및 퀘스트 데이터
// ==========================================
// 💡 교사 설정: 수업 진도에 맞춰 아래 숫자만 바꾸면 됩니다.
const TEACHER_SETTINGS = Object.freeze({
    // ① 바로 열어 둘 퀘스트: 1번부터 이 번호까지는 앞 퀘스트를 끝내지 않아도 들어갈 수 있어요.
    //    그보다 뒤의 퀘스트는 앞 퀘스트를 모두 완료하면 차례로 열려요.
    openQuestsUpTo: 6,
    // ② 공개할 마지막 퀘스트: 이 번호보다 뒤의 퀘스트는 완료 여부와 상관없이 잠겨요. (전부 공개: 6)
    lastVisibleQuest: 6,
    // ③ 특정 미션만 잠그기: '퀘스트:미션' 형식 (예: ['3:2'] → 퀘스트 3의 미션 2 잠금)
    lockedMissions: []
});

const QUESTS = Object.freeze({
    1: { title: '영양소', missions: [{id: 1}, {id: 2}, {id: 3}, {id: 4}] },
    2: { title: '소화', missions: [{id: 1}, {id: 2}, {id: 3}, {id: 4}] },
    3: { title: '순환', missions: [{id: 1}, {id: 2}, {id: 3}, {id: 4}] },
    4: { title: '호흡', missions: [{id: 1}, {id: 2}, {id: 3}, {id: 4}] },
    5: { title: '배설', missions: [{id: 1}, {id: 2}, {id: 3}, {id: 4}] }, 
    6: { title: '종합', missions: [{id: 1}, {id: 2}, {id: 3}, {id: 4}] }
});

// ==========================================
// 2. 데이터 저장 및 불러오기 (무결성 검증 추가)
// ==========================================
function getProgress() {
    let p = { completedMissions: [], rewards: [] };
    try {
        const saved = localStorage.getItem('humanbodyProgress');
        if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed.completedMissions)) p.completedMissions = parsed.completedMissions;
            if (Array.isArray(parsed.rewards)) p.rewards = parsed.rewards;
        }
    } catch(e) {
        console.warn("진행도 데이터를 읽는 중 오류 발생, 빈 상태로 시작합니다.", e);
    }
    return p;
}

function saveProgress(p) {
    try {
        localStorage.setItem('humanbodyProgress', JSON.stringify(p));
    } catch (e) {
        console.warn("저장소 접근이 차단되어 진행도를 저장할 수 없습니다.", e);
    }
}

window.getProgress = getProgress;
window.saveProgress = saveProgress;

// ==========================================
// 3. 편의용 진행 판정 함수
// ==========================================
function isMissionCompleted(questId, missionId) {
    return getProgress().completedMissions.includes(`${questId}_${missionId}`);
}

function isQuestFullyCompleted(questId) {
    if (!QUESTS[questId] || QUESTS[questId].missions.length === 0) return false;
    const p = getProgress();
    return QUESTS[questId].missions.every(m => p.completedMissions.includes(`${questId}_${m.id}`));
}

window.isMissionCompleted = isMissionCompleted;
window.isQuestFullyCompleted = isQuestFullyCompleted;

// ==========================================
// 4. 핵심 접근 판정 로직
// ==========================================
function canAccessMission(questId, missionId) {
    questId = parseInt(questId);
    missionId = parseInt(missionId);

    if (!QUESTS[questId]) return { access: false, reason: 'not_created' };
    const missionExists = QUESTS[questId].missions.some(m => m.id === missionId);
    if (!missionExists) return { access: false, reason: 'not_created' };

    if (TEACHER_SETTINGS.lockedMissions.includes(`${questId}:${missionId}`)) {
        return { access: false, reason: 'explicit_lock' };
    }
    if (questId > TEACHER_SETTINGS.lastVisibleQuest) {
        return { access: false, reason: 'teacher_locked_quest' };
    }
    if (isMissionCompleted(questId, missionId)) {
        return { access: true, reason: 'completed' };
    }
    if (missionId === 1) {
        if (questId === 1) return { access: true, reason: 'first_mission' };
        if (questId <= TEACHER_SETTINGS.openQuestsUpTo) return { access: true, reason: 'teacher_open' };
        if (isQuestFullyCompleted(questId - 1)) return { access: true, reason: 'next_quest' };
        return { access: false, reason: 'locked' };
    }
    if (isMissionCompleted(questId, missionId - 1)) {
        return { access: true, reason: 'next_mission' };
    }
    return { access: false, reason: 'locked' };
}
window.canAccessMission = canAccessMission;

// 메인 지도(index.html)에서 퀘스트에 들어갈 수 있는지 = 그 퀘스트의 미션 1에 들어갈 수 있는지
function canAccessQuest(questId) {
    return canAccessMission(questId, 1);
}
window.canAccessQuest = canAccessQuest;

window.getLastAvailableMission = function(questId) {
    if (!QUESTS[questId]) return 1;
    const missions = QUESTS[questId].missions;
    let lastAvailable = 1;

    for (let i = 0; i < missions.length; i++) {
        const mId = missions[i].id;
        if (canAccessMission(questId, mId).access) {
            lastAvailable = mId; 
        } else {
            break; 
        }
    }
    return lastAvailable;
};

// ==========================================
// 5. 공통 UI 유틸리티 (축포 효과 등)
// ==========================================
window.launchConfettiEffect = function() {
    if (typeof confetti !== 'function') return;
    const duration = 1000; 
    const end = Date.now() + duration;
    (function frame() {
        confetti({ particleCount: 7, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#FF8FAB', '#82D1D9', '#FF9F1C'] });
        confetti({ particleCount: 7, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#FF8FAB', '#82D1D9', '#FF9F1C'] });
        if (Date.now() < end) requestAnimationFrame(frame);
    }());
};

// ==========================================
// 5-1. 퀘스트 화면 사이드바(미션 목록) 공통 렌더링
// ==========================================
// 모든 퀘스트(1~6)가 이 함수 하나로 사이드바를 그립니다.
//  - 현재 미션: active(💓) / 완료한 미션: completed(✅)
//  - 들어갈 수 있는 미션: available(🔓) / 잠긴 미션: locked(🔒)
// titles를 넘기지 않으면 기존 사이드바에 적힌 미션 이름을 그대로 사용합니다.
const MISSION_STATE_CLASSES = ['active', 'completed', 'available', 'locked'];
const MISSION_STATE_ICONS = { active: '💓', completed: '✅', available: '🔓', locked: '🔒' };

window.renderMissionNav = function(questId, activeMission, titles) {
    questId = parseInt(questId, 10);
    activeMission = parseInt(activeMission, 10);
    const missions = (QUESTS[questId] && QUESTS[questId].missions) || [];

    missions.forEach(({ id }) => {
        const el = document.getElementById('nav-m' + id);
        if (!el) return;

        let title = titles && titles[id];
        if (title === undefined) {
            const titleEl = el.querySelector('.mission-title') || el.children[2];
            title = titleEl ? titleEl.innerHTML : '';
        }

        let state;
        if (id === activeMission) state = 'active';
        else if (isMissionCompleted(questId, id)) state = 'completed';
        else if (canAccessMission(questId, id).access) state = 'available';
        else state = 'locked';

        el.classList.add('mission-item');
        el.classList.remove(...MISSION_STATE_CLASSES);
        el.classList.add(state);
        el.innerHTML = `
            <div class="mission-icon text-xl mb-2">${MISSION_STATE_ICONS[state]}</div>
            <div class="text-sm font-bold whitespace-nowrap">Mission ${id}</div>
            <div class="mission-title text-sm leading-snug mt-1">${title}</div>
        `;
    });
};

// ==========================================
// 6. 메인 네비게이션 UI 업데이트 (index.html용)
// ==========================================
function updateQuestNavigation() {
    const bubbles = document.querySelectorAll('.quest-bubble');
    if (bubbles.length === 0) return; 

    const questTitles = ["", "영양소", "소화", "순환", "호흡", "배설", "종합"];

    bubbles.forEach((bubble, index) => {
        const questId = index + 1;
        bubble.classList.remove('active', 'completed', 'locked');
        bubble.style.pointerEvents = 'auto'; 
        bubble.style.opacity = '1';

        let icon = '';
        if (isQuestFullyCompleted(questId)) {
            bubble.classList.add('completed'); icon = '✅';
        } else {
            // 👇 [수정됨] 새로 정의한 canAccessQuest를 사용하여 메인 맵 권한 검사
            const accessInfo = canAccessQuest(questId);
            if (accessInfo.access) {
                bubble.classList.add('active'); icon = '🔓'; 
            } else {
                bubble.classList.add('locked');
                bubble.style.pointerEvents = 'none'; bubble.style.opacity = '0.6'; icon = '🔒'; 
            }
        }
        
        bubble.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; line-height: 1.2;">
                <span style="font-size: 1.4rem; margin-bottom: 3px;">${icon}</span>
                <span style="font-size: 0.95rem;">${questId}. ${questTitles[questId]}</span>
            </div>
        `;
    });
}

// ==========================================
// 7. 퀘스트 화면 진입 보호 및 완료 처리 엔진
// ==========================================

// 💡 퀘스트 완료 엔진: 진행도를 기록, 보상 UI 갱신, 축포 발사를 일괄 처리
window.completeMissionAction = function(questId, missionId) {
    const p = getProgress();
    const uniqueId = `${questId}_${missionId}`;
    
    if (!p.completedMissions.includes(uniqueId)) {
        p.completedMissions.push(uniqueId);
        saveProgress(p);
        
        // 보상 갱신
        if (window.UniversalReward && typeof window.UniversalReward.render === 'function') {
            window.UniversalReward.render();
        } else if (typeof window.showReward === 'function') {
            window.showReward(questId);
        }

        // 공통 축포 애니메이션
        window.launchConfettiEffect();

        // 💡 퀘스트 완료 안내창은 표시하지 않음 (파이널 이미지에서 인체탐험지도로 돌아가기 안내)
        return true; 
    }
    return false;
};

window.resetAllProgress = function() {
    saveProgress({ completedMissions: [], rewards: [] });
    // 구형 로컬 저장소 기록 삭제 (안전장치)
    for(let i=1; i<=6; i++) {
        localStorage.removeItem(`quest${i}_cleared`);
        for(let j=1; j<=4; j++) localStorage.removeItem(`quest${i}_m${j}_completed`);
    }
    
    if (window.UniversalReward) window.UniversalReward.render();
    
    if(location.pathname.includes('quest')) {
        location.href = 'index.html';
    } else {
        updateQuestNavigation();
    }
};

// 💡 URL 우회 방지 가드 로직
document.addEventListener('DOMContentLoaded', () => {
    // 1. 현재 페이지가 특정 단원(questX.html)인지 확인
    const path = window.location.pathname;
    const match = path.match(/quest(\d+)\.html/);
    
    if (match) {
        const questId = parseInt(match[1], 10);
        
        // 2. 단원의 첫 번째 미션 접근 권한 검사 (수정된 canAccessQuest 활용)
        const accessCheck = canAccessQuest(questId);
        
        if (!accessCheck.access) {
            alert("🔒 아직 접근할 수 없는 단원입니다. 인체 탐험 지도로 이동합니다.");
            window.location.href = 'index.html';
            return;
        }
    } else {
        // index.html 이면 메인 화면 상태 업데이트
        updateQuestNavigation();
    }
});
