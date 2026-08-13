// app.js - 主要交互逻辑（简化原型实现）
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

  // HUD Editor - 简化版拖拽和保存
  const hudCanvas = document.getElementById('hudCanvas');
  const hudModules = Array.from(hudCanvas.querySelectorAll('.hud-module'));
  const hudRaw = localStorage.getItem(ls.hud);
  const hudState = hudRaw ? JSON.parse(hudRaw) : {};

  function clampPos(x,y,w,h){
    const pad = 8; const rect = hudCanvas.getBoundingClientRect();
    let nx = Math.min(rect.width - w - pad, Math.max(pad, x));
    let ny = Math.min(rect.height - h - pad, Math.max(pad, y));
    return {x: nx, y: ny};
  }

  hudModules.forEach(mod=>{
    const id = mod.id;
    // restore
    if(hudState[id]){
      mod.style.left = hudState[id].x + 'px'; mod.style.top = hudState[id].y + 'px';
    } else {
      // place default positions
      if(id==='mod-fps'){mod.style.left='20px';mod.style.top='20px'}
      if(id==='mod-cps'){mod.style.left='120px';mod.style.top='20px'}
    }
    // drag
    mod.addEventListener('pointerdown', (e)=>{
      mod.setPointerCapture(e.pointerId);
      mod.classList.add('dragging');
      const startX = e.clientX; const startY = e.clientY;
      const rect = mod.getBoundingClientRect(); const offsetX = startX - rect.left; const offsetY = startY - rect.top;
      function move(ev){
        const parentRect = hudCanvas.getBoundingClientRect();
        const x = ev.clientX - parentRect.left - offsetX; const y = ev.clientY - parentRect.top - offsetY;
        const cl = clampPos(x,y,rect.width,rect.height);
        mod.style.left = cl.x + 'px'; mod.style.top = cl.y + 'px';
      }
      function up(ev){
        document.removeEventListener('pointermove', move); document.removeEventListener('pointerup', up);
        mod.classList.remove('dragging');
      }
      document.addEventListener('pointermove', move);
      document.addEventListener('pointerup', up);
    });
  });

  document.getElementById('saveHud').addEventListener('click', ()=>{
    const state = {};
    hudModules.forEach(mod=>{state[mod.id]={x: parseInt(mod.style.left||0), y: parseInt(mod.style.top||0)}});
    localStorage.setItem(ls.hud, JSON.stringify(state));
    alert('HUD 已保存（localStorage）');
    hudEditor.classList.add('hidden');
  });
  document.getElementById('cancelHud').addEventListener('click', ()=>{hudEditor.classList.add('hidden');});
  document.getElementById('resetHud').addEventListener('click', ()=>{
    localStorage.removeItem(ls.hud); alert('已重置 HUD'); location.reload();
  });

  // open HUD editor via settings button for demo
  document.getElementById('settingsBtn').addEventListener('click', ()=>hudEditor.classList.remove('hidden'));

  // initial bind for demo buttons
  document.getElementById('singleBtn').addEventListener('click', ()=>alert('开始 单人 世界（示例）'));
  document.getElementById('multiBtn').addEventListener('click', ()=>alert('开始 多人 世界（示例）'));

})();
