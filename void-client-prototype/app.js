// app.js - 主要交互逻辑（增强：HUD 编辑器吸附/网格/锁定/缩放）
(() => {
  const ls = {
    mods: 'void:mods:v0.1',
    profile: 'void:profile:v0.1',
    hud: 'void:hud:v0.1'
  }

  // Background stars
  function makeStars(){
    const c = document.getElementById('stars');
    const dpr = window.devicePixelRatio || 1;
    c.width = innerWidth * dpr; c.height = innerHeight * dpr; c.style.width = innerWidth+'px'; c.style.height = innerHeight+'px';
    const ctx = c.getContext('2d'); ctx.scale(dpr,dpr);
    ctx.clearRect(0,0,innerWidth,innerHeight);
    const count = 10; // 8-12
    for(let i=0;i<count;i++){
      const size = Math.random()*3 + (Math.random()>0.85?3:0); // a few bigger
      const x = Math.random()*innerWidth; const y = Math.random()*innerHeight*0.8 + innerHeight*0.05;
      const alpha = Math.random()*0.7 + 0.15;
      ctx.beginPath(); ctx.fillStyle = `rgba(157,220,236,${alpha})`; ctx.arc(x,y,size,0,Math.PI*2); ctx.fill();
    }
  }
  makeStars(); window.addEventListener('resize', makeStars);

  // Simple page toggles
  const modsPage = document.getElementById('modsPage');
  const aboutPage = document.getElementById('aboutPage');
  const playerEditor = document.getElementById('playerEditor');
  const hudEditor = document.getElementById('hudEditor');

  document.getElementById('modsBtn').addEventListener('click', ()=>modsPage.classList.remove('hidden'));
  document.getElementById('modsClose').addEventListener('click', ()=>modsPage.classList.add('hidden'));
  document.getElementById('planet').addEventListener('click', ()=>aboutPage.classList.remove('hidden'));
  document.getElementById('aboutClose').addEventListener('click', ()=>aboutPage.classList.add('hidden'));

  // Player card: first click selects, second click opens edit
  const playerCard = document.getElementById('playerCard');
  const playerNameEl = document.getElementById('playerName');
  const skinImg = document.getElementById('skinImage');
  let playerClickStage = 0;
  let clickTimer = null;

  const loadProfile = ()=>{
    const raw = localStorage.getItem(ls.profile);
    if(raw){
      try{const p=JSON.parse(raw); if(p.name) playerNameEl.textContent = p.name; if(p.skin) skinImg.src = p.skin}catch(e){}
    }
  }
  loadProfile();

  playerCard.addEventListener('click', ()=>{
    playerClickStage++;
    if(clickTimer) clearTimeout(clickTimer);
    clickTimer = setTimeout(()=>{playerClickStage=0},450);
    if(playerClickStage===1){
      playerCard.style.outline = '3px solid rgba(57,203,232,0.8)';
      playerCard.title = '再次点击以编辑';
    } else if(playerClickStage>=2){
      playerCard.style.outline = '';
      openPlayerEditor();
      playerClickStage=0;
    }
  })

  function openPlayerEditor(){
    document.getElementById('editName').value = playerNameEl.textContent;
    document.getElementById('previewImg').src = skinImg.src;
    playerEditor.classList.remove('hidden');
  }
  document.getElementById('cancelProfile').addEventListener('click', ()=>playerEditor.classList.add('hidden'));
  document.getElementById('saveProfile').addEventListener('click', ()=>{
    const name = document.getElementById('editName').value || '玩家名字';
    const skin = document.getElementById('previewImg').src;
    localStorage.setItem(ls.profile, JSON.stringify({name,skin}));
    loadProfile();
    playerEditor.classList.add('hidden');
  })

  // Skin upload
  document.getElementById('skinFile').addEventListener('change', (e)=>{
    const f = e.target.files[0]; if(!f) return;
    const reader = new FileReader(); reader.onload = ()=>{
      document.getElementById('previewImg').src = reader.result; }
    reader.readAsDataURL(f);
  })

  // Mods toggles and settings
  const mods = JSON.parse(localStorage.getItem(ls.mods) || '{}');
  const elToggleSprint = document.getElementById('mod-togglesprint');
  const elZoom = document.getElementById('mod-zoom');
  elToggleSprint.checked = !!mods.ToggleSprint;
  elZoom.checked = !!mods.Zoom;
  elToggleSprint.addEventListener('change', ()=>{mods.ToggleSprint = elToggleSprint.checked; localStorage.setItem(ls.mods, JSON.stringify(mods))});
  elZoom.addEventListener('change', ()=>{mods.Zoom = elZoom.checked; localStorage.setItem(ls.mods, JSON.stringify(mods))});

  document.getElementById('cfg-zoom').addEventListener('click', ()=>{
    alert('Zoom 设置（示例）: 在正式移植到 EaglerForge 时实现按键绑定与缩放等级设置。');
  });
  document.getElementById('cfg-togglesprint').addEventListener('click', ()=>{
    alert('ToggleSprint 设置（示例）: 可修改快捷键与 HUD 设置。');
  });

  // HUD Editor - Enhanced
  const hudCanvas = document.getElementById('hudCanvas');
  const hudGrid = document.getElementById('hudGrid');
  const hudModules = Array.from(hudCanvas.querySelectorAll('.hud-module'));
  const alignH = document.getElementById('alignH');
  const alignV = document.getElementById('alignV');
  const ctrlSize = document.getElementById('ctrlSize');
  const ctrlLock = document.getElementById('ctrlLock');
  const resetSelected = document.getElementById('resetSelected');

  const hudRaw = localStorage.getItem(ls.hud);
  const hudState = hudRaw ? JSON.parse(hudRaw) : {};

  function resizeGrid(){
    const c = hudGrid; c.width = c.clientWidth * devicePixelRatio; c.height = c.clientHeight * devicePixelRatio; c.style.width = c.clientWidth+'px'; c.style.height = c.clientHeight+'px';
    const ctx = c.getContext('2d'); ctx.scale(devicePixelRatio, devicePixelRatio);
    ctx.clearRect(0,0,c.clientWidth,c.clientHeight);
    const gap = 8; ctx.strokeStyle = 'rgba(57,203,232,0.04)'; ctx.lineWidth = 1;
    for(let x=0;x<c.clientWidth;x+=gap){ ctx.beginPath(); ctx.moveTo(x+0.5,0); ctx.lineTo(x+0.5,c.clientHeight); ctx.stroke(); }
    for(let y=0;y<c.clientHeight;y+=gap){ ctx.beginPath(); ctx.moveTo(0,y+0.5); ctx.lineTo(c.clientWidth,y+0.5); ctx.stroke(); }
  }
  resizeGrid(); window.addEventListener('resize', resizeGrid);

  let selectedModule = null;

  function clampAndSnap(x,y,w,h){
    const pad = 8; const rect = hudCanvas.getBoundingClientRect();
    // clamp
    let nx = Math.min(rect.width - w - pad, Math.max(pad, x));
    let ny = Math.min(rect.height - h - pad, Math.max(pad, y));
    // snap to grid (8px)
    const grid = 8; nx = Math.round(nx / grid) * grid; ny = Math.round(ny / grid) * grid;
    // snap to center/edges if close
    const thresh = 10;
    // center X
    const centerX = Math.round((rect.width - w)/2);
    if(Math.abs(nx - centerX) < thresh) nx = centerX, showAlign('vert', centerX + w/2);
    // center Y
    const centerY = Math.round((rect.height - h)/2);
    if(Math.abs(ny - centerY) < thresh) ny = centerY, showAlign('horiz', centerY + h/2);
    // left/right/top/bottom
    if(Math.abs(nx - pad) < thresh) nx = pad, showAlign('vert', pad);
    if(Math.abs(nx - (rect.width - w - pad)) < thresh) nx = rect.width - w - pad, showAlign('vert', nx + w);
    if(Math.abs(ny - pad) < thresh) ny = pad, showAlign('horiz', pad);
    if(Math.abs(ny - (rect.height - h - pad)) < thresh) ny = rect.height - h - pad, showAlign('horiz', ny + h);
    return {x: nx, y: ny};
  }

  function showAlign(type, pos){
    if(type==='horiz'){alignH.style.top = pos+'px'; alignH.classList.remove('hidden'); setTimeout(()=>alignH.classList.add('hidden'),400)}
    if(type==='vert'){alignV.style.left = pos+'px'; alignV.classList.remove('hidden'); setTimeout(()=>alignV.classList.add('hidden'),400)}
  }

  hudModules.forEach(mod=>{
    const id = mod.id;
    // restore
    if(hudState[id]){
      mod.style.left = hudState[id].x + 'px'; mod.style.top = hudState[id].y + 'px';
      mod.style.transform = `scale(${hudState[id].scale||1})`;
      if(hudState[id].locked) mod.classList.add('locked');
    } else {
      if(id==='mod-fps'){mod.style.left='20px';mod.style.top='20px'}
      if(id==='mod-cps'){mod.style.left='120px';mod.style.top='20px'}
    }

    // select on click
    mod.addEventListener('pointerdown', (e)=>{
      e.stopPropagation();
      selectModule(mod);
      // if locked, don't drag
      if(mod.classList.contains('locked')) return;
      mod.setPointerCapture(e.pointerId);
      mod.classList.add('dragging');
      const startX = e.clientX; const startY = e.clientY;
      const rect = mod.getBoundingClientRect(); const offsetX = startX - rect.left; const offsetY = startY - rect.top;
      function move(ev){
        const parentRect = hudCanvas.getBoundingClientRect();
        const x = ev.clientX - parentRect.left - offsetX; const y = ev.clientY - parentRect.top - offsetY;
        const cl = clampAndSnap(x,y,rect.width,rect.height);
        mod.style.left = cl.x + 'px'; mod.style.top = cl.y + 'px';
      }
      function up(ev){
        document.removeEventListener('pointermove', move); document.removeEventListener('pointerup', up);
        mod.classList.remove('dragging');
      }
      document.addEventListener('pointermove', move);
      document.addEventListener('pointerup', up);
    });

    // double click reset selected
    mod.addEventListener('dblclick', ()=>{
      hudState[id] = {x: parseInt(mod.style.left||0), y: parseInt(mod.style.top||0), scale:1};
      mod.style.transform='scale(1)'; localStorage.setItem(ls.hud, JSON.stringify(hudState));
    });
  });

  // click outside to deselect
  hudCanvas.addEventListener('pointerdown', ()=>{ selectModule(null); });

  function selectModule(el){
    if(selectedModule) selectedModule.classList.remove('selected');
    selectedModule = el;
    if(el){ el.classList.add('selected');
      const id = el.id; const st = hudState[id] || {scale:1,locked:false};
      ctrlSize.value = st.scale || 1; ctrlLock.checked = !!st.locked;
    } else { ctrlSize.value = 1; ctrlLock.checked = false; }
  }

  // controls
  ctrlSize.addEventListener('input', ()=>{
    if(!selectedModule) return;
    const s = parseFloat(ctrlSize.value);
    selectedModule.style.transform = `scale(${s})`;
    const id = selectedModule.id; hudState[id] = hudState[id] || {};
    hudState[id].scale = s;
  });
  ctrlLock.addEventListener('change', ()=>{
    if(!selectedModule) return;
    const id = selectedModule.id; hudState[id] = hudState[id] || {};
    hudState[id].locked = !!ctrlLock.checked;
    if(ctrlLock.checked) selectedModule.classList.add('locked'); else selectedModule.classList.remove('locked');
  });
  resetSelected.addEventListener('click', ()=>{
    if(!selectedModule) return;
    const id = selectedModule.id;
    delete hudState[id];
    selectedModule.style.left='20px'; selectedModule.style.top='20px'; selectedModule.style.transform='scale(1)'; selectedModule.classList.remove('locked');
  });

  document.getElementById('saveHud').addEventListener('click', ()=>{
    // capture current positions and scales
    const state = {};
    hudModules.forEach(mod=>{ state[mod.id] = { x: parseInt(mod.style.left||0), y: parseInt(mod.style.top||0), scale: parseFloat((mod.style.transform.match(/scale\(([^)]+)\)/)||[null,1])[1]), locked: mod.classList.contains('locked') } });
    localStorage.setItem(ls.hud, JSON.stringify(state));
    alert('HUD 已保存（localStorage）');
    hudEditor.classList.add('hidden');
  });
  document.getElementById('cancelHud').addEventListener('click', ()=>{hudEditor.classList.add('hidden');});
  document.getElementById('resetHud').addEventListener('click', ()=>{
    localStorage.removeItem(ls.hud); alert('已重置 HUD（刷新后生效）'); location.reload();
  });

  // open HUD editor via settings button for demo
  document.getElementById('settingsBtn').addEventListener('click', ()=>hudEditor.classList.remove('hidden'));

  // initial bind for demo buttons
  document.getElementById('singleBtn').addEventListener('click', ()=>alert('开始 单人 世界（示例）'));
  document.getElementById('multiBtn').addEventListener('click', ()=>alert('开始 多人 世界（示例）'));

})();
