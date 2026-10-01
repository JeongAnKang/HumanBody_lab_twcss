// ==========================================
// Universal rewards.js - 범용 퀘스트/미션 보상 엔진 (UI 및 계산 전담)
// ==========================================
(function () {
  'use strict';

  const CONFIG = {
    MAX_REWARD_SLOTS: 20,       
    REWARD_IMAGE_COUNT: 30,     
    REWARD_MODE: 'random',      
    IMAGE_PREFIX: 'images/img/reward', 
    IMAGE_EXT: '.png'
  };

  // 💡 데이터 관리는 완전히 main.js(window.getProgress)에 위임
  function readProgress() {
    if (typeof window.getProgress === 'function') {
      return window.getProgress();
    }
    return { completedMissions: [], rewards: [] };
  }

  function writeProgress(p) {
    if (typeof window.saveProgress === 'function') {
      window.saveProgress(p);
    }
  }

  // 사용 가능한(아직 뽑지 않은) 보상 티켓 개수 계산
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
      newRewardId = Math.floor(Math.random() * CONFIG.REWARD_IMAGE_COUNT) + 1;
    } else if (CONFIG.REWARD_MODE === 'sequential') {
      newRewardId = (p.rewards.length % CONFIG.REWARD_IMAGE_COUNT) + 1;
    }

    p.rewards.push(String(newRewardId).padStart(2, '0'));
    writeProgress(p);
    
    if (typeof window.launchConfetti === 'function') window.launchConfetti();
    renderRewards();
    return true;
  }

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

  // 글로벌 API 노출 (호환성 유지)
  window.UniversalReward = {
    claim: claimReward,
    render: renderRewards,
    getAvailable: getAvailableCount
  };

  document.addEventListener('DOMContentLoaded', renderRewards);
})();
