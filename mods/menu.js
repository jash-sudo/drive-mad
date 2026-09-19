(() => {
  'use strict';
  const mod = window.DriveMod;
  const max = location.pathname.includes('classic') ? 100 : 200;
  const presets = [['Stock','#ffe400'],['Glacier','#5de9ff'],['Toxic','#a8ff32'],['Violet','#b185ff'],['Cherry','#ff4265'],['Ghost','#eeeeff']];
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem('drive-mod-style-v1')) || {}; } catch (_) {}
  let current = 1, autoTimer = null, ready = false;
  const toggle = document.createElement('button');
  toggle.id = 'mod-toggle'; toggle.textContent = 'MOD MENU  /  M';
  toggle.setAttribute('aria-expanded','false'); toggle.setAttribute('aria-controls','mod-panel');
  const panel = document.createElement('section');
  panel.id = 'mod-panel'; panel.hidden = true; panel.setAttribute('aria-label','Drive Mad mod menu');
  panel.innerHTML = `<span class="eyebrow">JASH'S GARAGE / ${max === 100 ? 'CLASSIC' : 'PLUS'}</span><h2>Make your own rules.</h2>
    <p>Practice any level. Find your pace. Pick your paint.</p>
    <h3>01 / LEVEL CONTROL</h3>
    <label for="mod-level">Jump to level <span>(1–${max})</span></label>
    <div class="row"><input id="mod-level" type="number" min="1" max="${max}" value="1"><button id="mod-go" data-engine>Go →</button></div>
    <div class="row"><button id="mod-restart" data-engine>Restart selected</button><button id="mod-next" data-engine>Next selected →</button></div>
    <h3>02 / CHEATS & PRACTICE</h3>
    <label class="row" for="mod-speed"><span>Game speed</span><select id="mod-speed"><option value="0.25">0.25×</option><option value="0.5">0.5×</option><option value="1" selected>1×</option><option value="1.5">1.5×</option><option value="2">2×</option></select></label>
    <label class="row"><span>Freeze game <small> / P</small></span><input id="mod-pause" type="checkbox"></label>
    <label class="row"><span>Auto-drive <small> / Q</small></span><input id="mod-auto" type="checkbox" data-engine></label>
    <p>Auto-drive holds forward; it doesn’t steer or guarantee a win. Level controls use your selected level.</p>
    <h3>03 / PALETTE SKINS</h3><div class="skins">${presets.map(([name,color])=>`<button class="skin" data-color="${color}" data-name="${name}" aria-pressed="false"><i style="--swatch:${color}"></i>${name}</button>`).join('')}</div>
    <label class="row"><span>Custom paint</span><input id="mod-color" aria-label="Custom paint color" type="color" value="#5de9ff"></label>
    <p>Recolors yellow truck materials and matching yellow scenery. Paint is saved on this browser.</p>
    <div class="row"><button id="mod-reset">Reset mods</button><a href="../">← Back to garage</a></div>
    <p class="status" id="mod-status" role="status">Waiting for the game…</p>`;
  document.body.append(toggle,panel);
  const $ = id => panel.querySelector('#mod-'+id);
  const status = message => { $('status').textContent = message; };
  const disable = value => panel.querySelectorAll('[data-engine]').forEach(el => el.disabled = value);
  disable(true);
  function show(open) {panel.hidden = !open;toggle.setAttribute('aria-expanded',String(open));if(open) toggle.focus();else document.getElementById('canvas').focus();}
  toggle.onclick = () => show(panel.hidden);
  // Prevent menu controls from driving the car, including touch gestures.
  for (const type of ['keydown','keyup','mousedown','mouseup','mousemove','touchstart','touchmove','touchend']) {
    panel.addEventListener(type, e => e.stopPropagation(), true);
  }
  function paint(name, hex, persist = true) {
    if (!/^#[0-9a-f]{6}$/i.test(hex)) return;
    mod.color = name === 'Stock' ? null : [1,3,5].map(i => parseInt(hex.slice(i,i+2),16)/255);
    panel.querySelectorAll('.skin').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.name===name)));
    $('color').value = hex;
    if (persist) {try{localStorage.setItem('drive-mod-style-v1',JSON.stringify({name,hex}));}catch(_){}}
    status(name + ' paint selected.');
  }
  panel.querySelectorAll('.skin').forEach(el=>el.onclick=()=>paint(el.dataset.name,el.dataset.color));
  $('color').oninput = e => paint('Custom',e.target.value);
  paint(saved.name || 'Stock',saved.hex || '#ffe400',false);
  function forward(down) {
    // The native engine reads a held key state from Emscripten's keyboard handlers.
    document.getElementById('canvas').dispatchEvent(new KeyboardEvent(down?'keydown':'keyup',{key:'ArrowRight',code:'ArrowRight',keyCode:39,which:39,bubbles:true}));
  }
  function auto(on) {
    clearInterval(autoTimer);autoTimer=null;forward(false);$('auto').checked=on;
    if(on) {if(!mod.paused)forward(true);autoTimer=setInterval(()=>{if(!mod.paused)forward(true);},100);}
  }
  function pause(on) {mod.setPaused(on);$('pause').checked=on;if(on)forward(false);}
  function jump(value) {
    const level = Number(value);
    if(!Number.isInteger(level)||level<1||level>max){status(`Choose a whole number from 1 to ${max}.`);return;}
    if(!ready){status('Wait for the game to finish loading.');return;}
    auto(false);pause(false);
    try {window.Module._level_select_menu_start_level(level-1);current=level;$('level').value=level;status(`Started level ${level}.`);show(false);}
    catch(error){status('Could not start this level. Reload the game and try again.');console.error(error);}
  }
  $('go').onclick=()=>jump($('level').value);
  $('restart').onclick=()=>jump(current);
  $('next').onclick=()=>jump(Math.min(max,current+1));
  $('speed').onchange=e=>{mod.setSpeed(Number(e.target.value));status(`Game speed: ${mod.speed}×.`);};
  $('auto').onchange=e=>auto(e.target.checked);
  $('pause').onchange=e=>pause(e.target.checked);
  $('reset').onclick=()=>{auto(false);pause(false);mod.setSpeed(1);$('speed').value='1';paint('Stock','#ffe400');status('Mods reset. Game progress kept.');};
  window.addEventListener('keydown',e=>{
    if(e.repeat || /INPUT|SELECT|TEXTAREA/.test(e.target.tagName))return;
    if(e.key.toLowerCase()==='m'){e.preventDefault();e.stopImmediatePropagation();show(panel.hidden);}
    if(e.key==='Escape'&&!panel.hidden){e.preventDefault();show(false);}
    if(e.key.toLowerCase()==='p'){e.preventDefault();e.stopImmediatePropagation();pause(!mod.paused);}
    if(e.key.toLowerCase()==='q'&&ready){e.preventDefault();e.stopImmediatePropagation();auto(!$('auto').checked);}
  },true);
  window.addEventListener('blur',()=>auto(false));
  document.addEventListener('visibilitychange',()=>{if(document.hidden)auto(false);});
  const loading = setInterval(()=>{
    if(window.gameStarted && window.Module?._level_select_menu_start_level){
      ready=true;disable(false);clearInterval(loading);status('Ready. M menu · P freeze · Q auto-drive.');
    }
  },250);
})();
