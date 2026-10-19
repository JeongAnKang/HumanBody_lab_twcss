// ==========================================
// Universal rewards.js - 범용 퀘스트/미션 보상 엔진
// ==========================================
(function () {
  'use strict';

  // ⚙️ 설정 구역 (필요에 따라 수정하세요)
  const CONFIG = {
    MAX_REWARD_SLOTS: 24,       // 유저가 모을 수 있는 최대 보상 칸 수 (24칸으로 수정)
    REWARD_IMAGE_COUNT: 30,     // 준비된 보상 이미지의 총 개수 (01~30)
    REWARD_MODE: 'random',      // 'random'(랜덤 뽑기) 또는 'sequential'(1번부터 순차적) 중 선택
    IMAGE_PREFIX: 'images/img/reward', // 이미지 경로 수정
    IMAGE_EXT: '.png'
  };

  // 데이터 구조 초기화
  function normalizeProgress(p) {
    if (!p || typeof p !== 'object') p = {};
    if (!Array.isArray(p.rewards)) p.rewards = [];
    if (!Array.isArray(p.completedMissions)) p.completedMissions = [];
    return p;
  }

  // 진행도 불러오기 (외부 함수가 없으면 localStorage 기본 사용)
  function readProgress() {
    if (typeof window.getProgress === 'function') {
      return normalizeProgress(window.getProgress());
    }
    const saved = localStorage.getItem('universal_reward_progress');
    return normalizeProgress(saved ? JSON.parse(saved) : {});
  }

  // 진행도 저장하기 (저장 성공 여부 반환 기능 추가)
  function writeProgress(p) {
    try {
      if (typeof window.saveProgress === 'function') {
        const result = window.saveProgress(p);
        return result !== false; // 명시적인 false 반환이 아니면 성공으로 간주
      } else {
        localStorage.setItem('universal_reward_progress', JSON.stringify(p));
        return true;
      }
    } catch (error) {
      console.error("[Rewards] 진행도 저장 실패:", error);
      alert("진행 기록을 저장하지 못했습니다. 기기 용량이나 브라우저 쿠키 설정을 확인해 주세요.");
      return false;
    }
  }

  // 🎯 미션 완료 처리 (정답을 맞혔을 때 호출)
  function completeMission(questId, missionId) {
    // 1. 미션 접근 가능 여부(잠금 상태) 우선 확인 (canAccessMission 함수가 있을 경우)
    if (typeof window.canAccessMission === 'function') {
      const accessInfo = window.canAccessMission(questId, missionId);
      if (accessInfo && !accessInfo.access) {
        console.warn(`[Rewards] 접근이 잠긴 미션입니다. 완료할 수 없습니다. (Q${questId}M${missionId})`);
        return false;
      }
    }

    const p = readProgress();
    const uniqueId = `${questId}_${missionId}`;

    // 2. 이미 성공해서 보상 권한을 받은 적이 있는 미션이라면 무시 (최초 1회만 인정)
    if (p.completedMissions.includes(uniqueId)) {
      return false; 
    }

    p.completedMissions.push(uniqueId);
    
    // 3. 저장이 정상적으로 성공했을 때만 완료 처리 반영
    if (!writeProgress(p)) {
      return false;
    }
    
    renderRewards();
    return true; // 성공적으로 새로운 보상 권한 획득
  }

  // 현재 사용 가능한(아직 뽑지 않은) 보상 티켓 개수 계산
  function getAvailableCount() {
    const p = readProgress();
    return Math.max(0, p.completedMissions.length - p.rewards.length);
  }

  // 🎁 보상 받기 (버튼 클릭 시 실행)
  function claimReward() {
    const p = readProgress();
    const available = getAvailableCount();

    if (available <= 0) {
      alert("사용 가능한 쿠폰이 없습니다. 미션을 완료하고 쿠폰을 획득하세요!");
      return false;
    }
    if (p.rewards.length >= CONFIG.MAX_REWARD_SLOTS) {
      alert(`🎉 ${CONFIG.MAX_REWARD_SLOTS}개의 보상을 모두 모았습니다! 대단해요!`);
      return false;
    }

    let newRewardId;

    if (CONFIG.REWARD_MODE === 'random') {
      // 랜덤 방식: 1 ~ REWARD_IMAGE_COUNT 사이의 무작위 숫자
      newRewardId = Math.floor(Math.random() * CONFIG.REWARD_IMAGE_COUNT) + 1;
    } else if (CONFIG.REWARD_MODE === 'sequential') {
      // 순차 방식: 현재 모은 보상 개수 다음 번호 지급 (1, 2, 3...)
      newRewardId = (p.rewards.length % CONFIG.REWARD_IMAGE_COUNT) + 1;
    }

    // 두 자리 문자열로 포맷팅 (예: 1 -> "01")
    p.rewards.push(String(newRewardId).padStart(2, '0'));
    
    if (!writeProgress(p)) {
      return false;
    }
    
    if (typeof window.launchConfetti === 'function') window.launchConfetti();
    renderRewards();
    return true;
  }

  // UI 화면 업데이트
  function renderRewards() {
    const p = readProgress();
    const rewardArea = document.getElementById('reward-area');
    const countSpan = document.getElementById('reward-count');
    const btnClaim = document.getElementById('btn-claim-reward');
    
    const available = getAvailableCount();

    if (countSpan) countSpan.innerText = available;

    if (btnClaim) {
      const enabled = available > 0 && p.rewards.length < CONFIG.MAX_REWARD_SLOTS;
      btnClaim.disabled = !enabled;
      btnClaim.style.background = enabled ? '#f57f17' : '#cfd8dc';
      btnClaim.style.color = enabled ? '#fff' : '#78909c';
      btnClaim.style.cursor = enabled ? 'pointer' : 'not-allowed';
      
      // 이벤트 리스너 중복 방지를 위해 기존 이벤트 제거 후 다시 추가
      btnClaim.removeEventListener('click', claimReward);
      btnClaim.addEventListener('click', claimReward);
    }

    if (!rewardArea) return;
    rewardArea.innerHTML = '';
    
    for (let i = 0; i < CONFIG.MAX_REWARD_SLOTS; i++) {
      const slot = document.createElement('div');
      slot.className = 'reward-slot';
      
      if (i < p.rewards.length) {
        const img = document.createElement('img');
        img.className = 'reward-item';
        img.src = `${CONFIG.IMAGE_PREFIX}${p.rewards[i]}${CONFIG.IMAGE_EXT}`;
        img.alt = `획득 보상 ${i + 1}`;
        img.onerror = function () { this.style.display = 'none'; };
        slot.appendChild(img);
      }
      rewardArea.appendChild(slot);
    }
  }

  function resetRewards() {
    if (writeProgress(normalizeProgress({}))) {
      renderRewards();
    }
  }

  // 글로벌 API 노출
  window.UniversalReward = {
    complete: completeMission,
    claim: claimReward,
    render: renderRewards,
    reset: resetRewards,
    getAvailable: getAvailableCount
  };

  // 초기화
  document.addEventListener('DOMContentLoaded', renderRewards);
})();
