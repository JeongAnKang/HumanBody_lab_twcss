/* Universal Pointer/Keyboard Drag-and-Drop Engine (Overlap & Swap Fix Ver) */
(function () {
  'use strict';
  
  const ITEM_SELECTOR = '.dnd-item';
  const ZONE_SELECTOR = '.dnd-zone';
  
  let selected = null, gesture = null, activeMode = 'pending', suppressClickUntil = 0;

  function isLocked(item) {
    return item.classList.contains('dnd-locked') || item.dataset.dndLocked === 'true';
  }

  function accepts(item, zone) {
    if (typeof window.ZziritDnD?.customAccept === 'function') {
      const customResult = window.ZziritDnD.customAccept(item, zone);
      if (typeof customResult === 'boolean') return customResult;
    }
    const itemGroup = item.dataset.dndGroup || 'default';
    const zoneAccept = zone.dataset.dndAccept;
    
    if (!zoneAccept || zoneAccept === '*') return true;
    return zoneAccept.split(',').map(s => s.trim()).includes(itemGroup);
  }

  function sourcePool(item) {
    const originId = item.dataset.dndOrigin;
    if (originId) {
      const originZone = document.getElementById(originId);
      if (originZone && originZone.matches(ZONE_SELECTOR)) return originZone;
    }
    return document.querySelector('.dnd-pool') || item.parentElement;
  }

  function clear() {
    document.querySelectorAll('.dnd-selected, .dnd-over').forEach(el => el.classList.remove('dnd-selected', 'dnd-over'));
    selected = null;
  }

  function move(item, zone) {
    if (!item || !zone || !accepts(item, zone)) return false;
    
    const capacity = parseInt(zone.dataset.dndCapacity, 10) || 0;
    const isSingle = capacity === 1 || zone.classList.contains('dnd-single-slot');
    
    // [버그 픽스] 밀려나는 기존 아이템(old)이 돌아갈 곳을 잃어 겹쳐서 사라지는 현상 방지
    if (isSingle) {
      const old = Array.from(zone.children).find(el => el !== item && el.matches(ITEM_SELECTOR));
      if (old) {
        let pool = sourcePool(old);
        // 만약 돌아갈 풀이 현재 슬롯(zone)과 같다면 강제로 공통 풀(.dnd-pool)로 밀어냄
        if (!pool || pool === zone) pool = document.querySelector('.dnd-pool');
        if (pool && pool !== zone) {
            pool.appendChild(old);
        }
      }
    }
    
    zone.appendChild(item); 
    clear();
    
    zone.classList.add('drop-success');
    setTimeout(() => zone.classList.remove('drop-success'), 220);
    
    item.dispatchEvent(new CustomEvent('dnd-dropped', { bubbles: true, detail: { item, zone } }));
    return true;
  }

  function zoneAt(x, y) { 
    const hit = document.elementFromPoint(x, y); 
    return hit && hit.closest(ZONE_SELECTOR); 
  }

  function createGhost(item, x, y) {
    const rect = item.getBoundingClientRect();
    const ghost = item.cloneNode(true);
    ghost.removeAttribute('id');
    ghost.removeAttribute('role');
    ghost.classList.add('dnd-ghost');
    
    // [버그 픽스] 고스트가 포인터를 가려서 정확히 겹칠 때 드롭존(Zone) 인식을 방해하는 것 차단
    ghost.style.pointerEvents = 'none'; 
    ghost.style.zIndex = '9999';
    
    ghost.style.width = `${rect.width}px`;
    ghost.style.height = `${rect.height}px`;
    ghost.style.left = `${x - rect.width / 2}px`;
    ghost.style.top = `${y - rect.height / 2}px`;
    
    document.body.appendChild(ghost);
    return ghost;
  }

  function positionGhost(ghost, x, y) {
    if (!ghost) return;
    const width = ghost.offsetWidth;
    const height = ghost.offsetHeight;
    ghost.style.left = `${x - width / 2}px`;
    ghost.style.top = `${y - height / 2 - 12}px`; 
  }

  function finishGesture(state) {
    state?.ghost?.remove();
    state?.item?.classList.remove('dnd-source-dragging');
    document.body.classList.remove('dnd-active');
    document.querySelectorAll('.dnd-over').forEach(el => el.classList.remove('dnd-over'));
  }

  /* --- Pointer Events --- */
  function pointerDown(e) {
    if (e.button !== undefined && e.button !== 0) return;
    // [버그 픽스] 드래그 중 다른 손가락이 닿았을 때 아이템이 영원히 투명해지는 현상(증발) 차단
    if (gesture) return; 
    
    const item = e.target.closest(ITEM_SELECTOR); 
    if (!item || isLocked(item)) return;
    
    gesture = { item, id: e.pointerId, x: e.clientX, y: e.clientY, moved: false, ghost: null };
    item.setPointerCapture?.(e.pointerId);
  }

  function pointerMove(e) {
    if (!gesture || gesture.id !== e.pointerId) return;
    if (Math.hypot(e.clientX - gesture.x, e.clientY - gesture.y) < 7) return;
    
    if (!gesture.moved) {
      gesture.moved = true;
      gesture.ghost = createGhost(gesture.item, e.clientX, e.clientY);
      gesture.item.classList.add('dnd-source-dragging');
      document.body.classList.add('dnd-active');
    }
    e.preventDefault();
    positionGhost(gesture.ghost, e.clientX, e.clientY);
    document.querySelectorAll('.dnd-over').forEach(el => el.classList.remove('dnd-over'));
    const zone = zoneAt(e.clientX, e.clientY);
    if (zone && accepts(gesture.item, zone)) zone.classList.add('dnd-over');
  }

  function pointerUp(e) {
    if (!gesture || gesture.id !== e.pointerId) return;
    const state = gesture; 
    gesture = null;
    const zone = zoneAt(e.clientX, e.clientY);
    finishGesture(state);
    
    if (state.moved) {
      suppressClickUntil = Date.now() + 350;
      e.preventDefault();
      move(state.item, zone);
    }
  }

  /* --- Engine Initializers --- */
  function enablePointerMode() {
    activeMode = 'pointer';
    document.addEventListener('pointerdown', pointerDown);
    document.addEventListener('pointermove', pointerMove, { passive: false });
    document.addEventListener('pointerup', pointerUp);
    document.addEventListener('pointercancel', () => {
      const state = gesture; gesture = null; finishGesture(state); clear();
    });
  }

  function enableNativeMode() {
    activeMode = 'drag-drop-touch';
    document.querySelectorAll(ITEM_SELECTOR).forEach(el => { el.draggable = true; });
    document.addEventListener('dragstart', e => {
      const item = e.target.closest(ITEM_SELECTOR);
      if (!item || isLocked(item)) { e.preventDefault(); return; }
      
      // [버그 픽스] 순서 변동 시 잘못된 뱃지가 선택되어 사라지는 현상을 방지하는 고유 ID 부여
      if (!item.dataset.dndTempId) {
          item.dataset.dndTempId = 'dnd_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
      }
      e.dataTransfer.setData('text/plain', item.dataset.dndTempId);
      e.dataTransfer.effectAllowed = 'move';
      item.classList.add('dnd-source-dragging');
      document.body.classList.add('dnd-active');
    }, true);
    
    document.addEventListener('dragover', e => {
      const zone = e.target.closest(ZONE_SELECTOR);
      if (!zone) return;
      e.preventDefault();
      document.querySelectorAll('.dnd-over').forEach(el => el.classList.remove('dnd-over'));
      const draggingItem = document.querySelector('.dnd-source-dragging');
      if (draggingItem && accepts(draggingItem, zone)) zone.classList.add('dnd-over');
    }, true);
    
    document.addEventListener('drop', e => {
      const zone = e.target.closest(ZONE_SELECTOR);
      const tempId = e.dataTransfer.getData('text/plain');
      const item = document.querySelector(`[data-dnd-temp-id="${tempId}"]`);
      if (!zone || !item) return;
      e.preventDefault(); e.stopImmediatePropagation();
      move(item, zone);
    }, true);
    
    document.addEventListener('dragend', () => {
      document.querySelectorAll('.dnd-source-dragging').forEach(el => el.classList.remove('dnd-source-dragging'));
      document.querySelectorAll('.dnd-over').forEach(el => el.classList.remove('dnd-over'));
      document.body.classList.remove('dnd-active');
    }, true);
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src; script.async = true;
      script.onload = resolve; script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  async function selectEngine() {
    if ('PointerEvent' in window) {
      enablePointerMode(); return;
    }
    try {
      await loadScript('https://unpkg.com/drag-drop-touch');
      enableNativeMode();
    } catch (error) {
      activeMode = 'tap-only';
    }
  }

  /* --- Click & Keyboard Fallbacks --- */
  document.addEventListener('click', e => {
    if (Date.now() < suppressClickUntil) { e.preventDefault(); return; }
    let item = e.target.closest(ITEM_SELECTOR);
    const zone = e.target.closest(ZONE_SELECTOR);
    
    if (item && isLocked(item)) item = null;

    // [버그 픽스 & UX 개선] 아이템을 선택한 상태에서 '다른 아이템이 들어있는 빈칸'을 탭하면, 선택이 바뀌는게 아니라 서로 교체(Swap)되도록 수정
    if (selected && item && selected !== item && zone && selected.parentElement !== zone) {
        e.preventDefault();
        if (move(selected, zone)) return;
    }

    if (item) {
      clear(); selected = item; item.classList.add('dnd-selected'); 
    } else if (zone && selected) { 
      e.preventDefault(); move(selected, zone); 
    }
  });

  document.addEventListener('keydown', e => {
    let item = e.target.closest(ITEM_SELECTOR);
    const zone = e.target.closest(ZONE_SELECTOR);
    if (item && isLocked(item)) item = null;

    if ((e.key === 'Enter' || e.key === ' ') && item) {
      e.preventDefault(); clear(); selected = item; item.classList.add('dnd-selected'); 
    } else if ((e.key === 'Enter' || e.key === ' ') && zone && selected) { 
      e.preventDefault(); move(selected, zone); 
    } else if (e.key === 'Escape') {
      clear();
    }
  });

  /* --- Initialization --- */
  function init() {
    document.querySelectorAll(ITEM_SELECTOR).forEach(el => { 
      if(el.dataset.dndInit) return;
      el.draggable = false; 
      el.tabIndex = 0; 
      el.setAttribute('role', 'button'); 
      el.style.touchAction = 'none'; 
      if (!el.dataset.dndOrigin && el.parentElement.id) {
        el.dataset.dndOrigin = el.parentElement.id;
      }
      el.dataset.dndInit = 'true';
    });
    
    document.querySelectorAll(ZONE_SELECTOR).forEach(el => { 
      if(el.dataset.dndInit) return;
      el.tabIndex = 0; 
      el.setAttribute('role', 'group'); 
      el.dataset.dndInit = 'true';
    });
    
    if(activeMode === 'pending') selectEngine();
  }

  document.addEventListener('DOMContentLoaded', init);
  
  window.humanBadyDnD = { 
    init, 
    move, 
    clear, 
    get activeMode() { return activeMode; },
    customAccept: null
  };
}());