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
    // 💡 참조 버그 픽스: ZziritDnD -> humanBadyDnD로 통일
    if (typeof window.humanBadyDnD?.customAccept === 'function') {
      const customResult = window.humanBadyDnD.customAccept(item, zone);
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
    
    if (isSingle) {
      const old = Array.from(zone.children).find(el => el !== item && el.matches(ITEM_SELECTOR));
      if (old) {
        let pool = sourcePool(old);
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
    
    // 💡 포지션 버그 픽스: position: fixed 명시 적용
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
      move(state.item, zone);
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
