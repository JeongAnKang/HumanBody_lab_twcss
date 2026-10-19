/* Universal Pointer/Keyboard Drag-and-Drop Engine (Infinite Clone + Random Pool + Tap-Tap) */
(function () {
  'use strict';
  
  // 기존 dnd 요소에 복제형(clone) 요소까지 선택자에 추가
  const ITEM_SELECTOR = '.dnd-item, .clone-item';
  const ZONE_SELECTOR = '.dnd-zone, .clone-zone, .dnd-pool, [id*="-pool"]';
  
  let selected = null, gesture = null, activeMode = 'pending', suppressClickUntil = 0;

  function isLocked(item) {
    return item.classList.contains('dnd-locked') || item.dataset.dndLocked === 'true';
  }

  // 드롭존이 정규 존인지 복제용 존인지 판별
  function isCloneZone(el) {
    return el && (el.classList.contains('dnd-zone') || el.classList.contains('clone-zone'));
  }

  function accepts(item, zone) {
    if (typeof window.humanBadyDnD?.customAccept === 'function') {
      const customResult = window.humanBadyDnD.customAccept(item, zone);
      if (typeof customResult === 'boolean') return customResult;
    }
    
    // 풀(Pool) 영역은 원래 자리로 돌아오는 뱃지들을 항상 허용
    if (zone.classList.contains('dnd-pool') || zone.id.includes('-pool')) return true;

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
    return document.querySelector('.dnd-pool, [id*="-pool"]') || item.parentElement;
  }

  function clear() {
    document.querySelectorAll('.dnd-selected, .dnd-over').forEach(el => el.classList.remove('dnd-selected', 'dnd-over'));
    selected = null;
  }

  function move(item, zone) {
    if (!item || !zone || !accepts(item, zone)) return false;

    // ★ 추가된 안전장치: 이동하려는 아이템 자체가 잠금 상태라면 이동 무효화
    if (isLocked(item)) return false;

    const isCloneItem = item.classList.contains('clone-item');
    const isSourceZone = isCloneZone(item.parentElement);
    const isTargetZone = isCloneZone(zone);

    const capacity = parseInt(zone.dataset.dndCapacity, 10) || 0;
    // 복제 존(clone-zone)은 기본적으로 1개만 들어가는 싱글 슬롯으로 처리
    const isSingle = capacity === 1 || zone.classList.contains('dnd-single-slot') || zone.classList.contains('clone-zone');
    
    // 싱글 슬롯 밀어내기 처리
    if (isSingle && isTargetZone) {
      const old = Array.from(zone.children).find(el => el !== item && el.matches(ITEM_SELECTOR));
      if (old) {
        // ★ 핵심 반영: 타겟 존에 있는 기존 아이템이 잠금 상태라면 밀어내지 않고 이동 자체를 취소
        if (isLocked(old)) {
            return false;
        }

        if (old.classList.contains('clone-item')) {
          old.remove(); // 복제된 뱃지는 밀려나면 파괴됨
        } else {
          let pool = sourcePool(old);
          if (!pool || pool === zone) pool = document.querySelector('.dnd-pool, [id*="-pool"]');
          if (pool && pool !== zone) {
              pool.appendChild(old);
          }
        }
      }
    }

    // 🌟 무한 복제 (Clone) 특별 로직
    if (isCloneItem) {
      if (!isSourceZone && isTargetZone) {
        // [풀 -> 빈칸] 드롭/클릭 시 뱃지를 무한 복제해서 넣음
        const clone = item.cloneNode(true);
        clone.classList.remove('dnd-selected', 'dnd-source-dragging');
        clone.removeAttribute('id');
        delete clone.dataset.dndInit; 
        
        zone.appendChild(clone);
        clear();
        zone.classList.add('drop-success');
        setTimeout(() => zone.classList.remove('drop-success'), 220);
        
        clone.dispatchEvent(new CustomEvent('dnd-dropped', { bubbles: true, detail: { item: clone, zone } }));
        
        // 새로 생긴 복제본에 이벤트 리스너 입히기
        if (window.humanBadyDnD) window.humanBadyDnD.init();
        return true;
      } else if (isSourceZone && !isTargetZone) {
        // [빈칸 -> 풀] 드롭/클릭 시 복제본 파괴 (중복 방지)
        item.remove();
        clear();
        return true;
      }
    }
    
    // 일반 뱃지 이동 로직 (빈칸 -> 빈칸 이동 포함)
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
    
    ghost.style.position = 'fixed';
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

  function pointerDown(e) {
    if (e.button !== undefined && e.button !== 0) return;
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
      if (zone) {
         move(state.item, zone);
      } else if (state.item.classList.contains('clone-item') && isCloneZone(state.item.parentElement)) {
         // 허공에 버리면 파괴
         state.item.remove();
      }
    }
  }

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
    
    document.addEventListener('dragend', e => {
      const item = e.target.closest(ITEM_SELECTOR);
      document.querySelectorAll('.dnd-source-dragging').forEach(el => el.classList.remove('dnd-source-dragging'));
      document.querySelectorAll('.dnd-over').forEach(el => el.classList.remove('dnd-over'));
      document.body.classList.remove('dnd-active');
      
      // 데스크탑 네이티브 모드에서 허공에 버렸을 때 파괴 처리
      if (e.dataTransfer.dropEffect === 'none' && item && item.classList.contains('clone-item') && isCloneZone(item.parentElement)) {
          item.remove();
      }
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

  // 🌟 탭탭(클릭) 인터랙션 로직
  document.addEventListener('click', e => {
    if (Date.now() < suppressClickUntil) { e.preventDefault(); return; }
    let item = e.target.closest(ITEM_SELECTOR);
    const zone = e.target.closest(ZONE_SELECTOR);
    
    if (item && isLocked(item)) item = null;

    if (selected && item && selected !== item && zone && selected.parentElement !== zone) {
        e.preventDefault();
        if (move(selected, zone)) return;
    }

    if (item) {
      clear(); selected = item; item.classList.add('dnd-selected'); 
    } else if (zone && selected) { 
      e.preventDefault(); move(selected, zone); 
    } else {
      clear(); // 빈 공간 클릭 시 선택 해제
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

  function init() {
    document.querySelectorAll(ITEM_SELECTOR).forEach(el => { 
      if(el.dataset.dndInit) return;
      el.draggable = activeMode === 'drag-drop-touch'; // 네이티브 모드일때만 true
      el.tabIndex = 0; 
      el.setAttribute('role', 'button'); 
      el.style.touchAction = 'none'; 
      if (!el.dataset.dndOrigin && el.parentElement && el.parentElement.id) {
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

  // 🌟 모듈화된 랜덤 뱃지 풀 생성 API
  function createRandomPool(poolSelector, itemsArray, groupName = 'default') {
      const pool = document.querySelector(poolSelector);
      if (!pool || !Array.isArray(itemsArray)) return;

      // 무작위로 배열 섞기
      const shuffled = [...itemsArray].sort(() => Math.random() - 0.5);
      pool.innerHTML = ''; 

      shuffled.forEach(text => {
          const div = document.createElement('div');
          div.className = 'clone-item'; // 복제용 클래스 자동 부여
          div.dataset.id = text;
          div.dataset.answer = text;
          div.dataset.dndGroup = groupName;
          div.innerText = text;
          pool.appendChild(div);
      });
      init(); // 생성된 요소 활성화
  }

  document.addEventListener('DOMContentLoaded', init);
  
  // 외부에서 호출할 수 있도록 기능 노출
  window.humanBadyDnD = { 
    init, 
    move, 
    clear, 
    createRandomPool, 
    get activeMode() { return activeMode; },
    customAccept: null
  };
}());
