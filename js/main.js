// ==========================================
// 1. 교사 설정 및 퀘스트 데이터
// ==========================================
const TEACHER_ACCESS = Object.freeze({
    unlockedQuest: 1,        
    lockedQuest: 4,          
    explicitLocks: []        
});

const QUESTS = Object.freeze({
    1: { title: '영양소', missions: [{id: 1}, {id: 2}, {id: 3}, {id: 4}] }, //  4개 미션으로 quest1 완료 처리
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
    localStorage.setItem('humanbodyProgress', JSON.stringify(p));
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

// ==========================================
// 5. 메인 네비게이션 UI 업데이트
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
// 6. 퀘스트 화면 진입 및 완료 처리
// ==========================================
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

// 💡 퀘스트 완료 엔진: 여기서 진행도를 기록하고 보상 UI를 업데이트합니다.
window.completeMissionAction = function(questId, missionId) {
    const p = getProgress();
    const uniqueId = `${questId}_${missionId}`;
    
    if (!p.completedMissions.includes(uniqueId)) {
        p.completedMissions.push(uniqueId);
        saveProgress(p);
        
        if (window.UniversalReward && typeof window.UniversalReward.render === 'function') {
            window.UniversalReward.render();
        }

        if (isQuestFullyCompleted(questId)) {
            const nextQuestAccess = canAccessMission(questId + 1, 1);
            
            if (!nextQuestAccess.access) {
                if (nextQuestAccess.reason === 'teacher_locked_quest') {
                    alert(`🎉 퀘스트 완료! 다음 단원은 아직 선생님이 잠가두셨습니다. 여기까지 완료했습니다.`);
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
    if (window.UniversalReward) window.UniversalReward.render();
    
    if(location.pathname.includes('quest')) {
        location.href = 'index.html';
    } else {
        updateQuestNavigation();
    }
};

document.addEventListener('DOMContentLoaded', updateQuestNavigation);
