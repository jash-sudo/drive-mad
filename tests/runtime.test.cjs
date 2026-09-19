const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const source = fs.readFileSync(require('node:path').join(__dirname,'../mods/runtime.js'),'utf8');

test('speed changes preserve continuity and freeze does not accumulate catch-up time',()=>{
  let time = 100;
  const context = {window:{},performance:{now:()=>time},Date:{now:()=>1700000000000}};
  vm.runInNewContext(source,context);
  const mod=context.window.DriveMod;
  time+=100; assert.equal(mod.now(),200);
  mod.setSpeed(0.25);time+=400;assert.equal(mod.now(),300);
  mod.setPaused(true);time+=60000;assert.equal(mod.now(),300);
  mod.setPaused(false);time+=400;assert.equal(mod.now(),400);
  mod.setSpeed(2);time+=100;assert.equal(mod.now(),600);
  assert.equal(mod.dateNow(),1700000000500);
});

test('both game variants load mod hooks before the engine and retain level exports',()=>{
  for (const variant of ['classic','new']) {
    const base=require('node:path').join(__dirname,`../drive-mad-${variant}`);
    const html=fs.readFileSync(base+'/index.html','utf8');
    assert.ok(html.indexOf('../mods/runtime.js')<html.indexOf('webapp/index.js'));
    const js=fs.readFileSync(base+'/webapp/index.js','utf8');
    assert.ok(js.includes('window.DriveMod.now()'));
    assert.ok(js.includes('window.DriveMod.dateNow()'));
    assert.ok(js.includes('_level_select_menu_start_level'));
  }
});
