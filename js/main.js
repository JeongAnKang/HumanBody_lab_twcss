// ==========================================
// 1. 교사 설정 및 퀘스트 데이터
// ==========================================
const TEACHER_ACCESS = Object.freeze({
    unlockedQuest: 1,        
    lockedQuest: 3,          
    explicitLocks: []        
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

    if (TEACHER_ACCESS.explicitLocks.includes(`${questId}:${missionId}`)) {
        return { access: false, reason: 'explicit_lock' };
    }
    if (questId > TEACHER_ACCESS.lockedQuest) {
        return { access: false, reason: 'teacher_locked_quest' };
    }
    if (isMissionCompleted(questId, missionId)) {
        return { access: true, reason: 'completed' };
    }
    if (questId <= TEACHER_ACCESS.unlockedQuest && missionId === 1) {
        return { access: true, reason: 'teacher_unlocked' };
    }
    if (questId === 1 && missionId === 1) {
        return { access: true, reason: 'first_mission' };
    }
    if (missionId > 1 && isMissionCompleted(questId, missionId - 1)) {
        return { access: true, reason: 'next_mission' };
    }
    if (missionId === 1 && questId > 1 && isQuestFullyCompleted(questId - 1)) {
        return { access: true, reason: 'next_quest' };
    }

    return { access: false, reason: 'locked' };
}
window.canAccessMission = canAccessMission;

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
            const accessInfo = canAccessMission(questId, 1);
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

        // 퀘스트를 통째로 완료했을 경우 알림
        if (isQuestFullyCompleted(questId)) {
            const nextQuestAccess = canAccessMission(questId + 1, 1);
            
            if (!nextQuestAccess.access) {
                if (nextQuestAccess.reason === 'teacher_locked_quest') {
                    alert(`🎉 퀘스트 완료! 다음 단원은 아직 선생님이 잠가두셨습니다.`);
                } else if (nextQuestAccess.reason === 'not_created') {
                    alert(`🏆 모든 퀘스트를 완벽하게 완료했습니다! 대단해요!`);
                }
            } else {
                alert(`🎉 퀘스트 완료! 새로운 단원의 문이 열렸습니다.`);
            }
        }
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
        
        // 2. 단원의 첫 번째 미션 접근 권한 검사
        const accessCheck = canAccessMission(questId, 1);
        
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
