// main3d.js - 3D 游戏主循环、聊天事件监听、启动初始化

// ============================================================
// 粒子函数覆盖：将 2D 粒子调用重定向到 3D
// ============================================================
const _origSpawnParticles = spawnParticles;
spawnParticles = function(x, y, color, count, opts){
  if(typeof THREE !== 'undefined' && scene3d){
    for(let i = 0; i < count; i++){
      spawnParticle3D(x + randF(-8, 8), y + randF(-8, 8), color);
    }
    return;
  }
  _origSpawnParticles(x, y, color, count, opts);
};

const _origSpawnHealParticles = spawnHealParticles;
spawnHealParticles = function(x, y){
  if(typeof THREE !== 'undefined' && scene3d){
    for(let i = 0; i < 10; i++){
      spawnParticle3D(x + randF(-6, 6), y + randF(-6, 6), '#66bb6a');
    }
    return;
  }
  _origSpawnHealParticles(x, y);
};

const _origSpawnLevelUpParticles = spawnLevelUpParticles;
spawnLevelUpParticles = function(x, y){
  if(typeof THREE !== 'undefined' && scene3d){
    const colors = ['#ffd740','#ff6f00','#fff176','#ffab00'];
    for(let i = 0; i < 20; i++){
      spawnParticle3D(x + randF(-10, 10), y + randF(-10, 10), choose(colors));
    }
    return;
  }
  _origSpawnLevelUpParticles(x, y);
};

const _origSpawnGoldParticles = spawnGoldParticles;
spawnGoldParticles = function(x, y){
  if(typeof THREE !== 'undefined' && scene3d){
    for(let i = 0; i < 8; i++){
      spawnParticle3D(x + randF(-4, 4), y + randF(-4, 4), '#ffd740');
    }
    return;
  }
  _origSpawnGoldParticles(x, y);
};

// 浮动文字在 3D 中不显示粒子文本，用 addMsg 代替即可，保持 floatTexts 更新逻辑不崩
const _origAddFloatText = addFloatText;
addFloatText = function(x, y, text, color){
  // 3D 模式下跳过（消息栏已有文字反馈），但仍保持数组一致
  if(typeof THREE !== 'undefined' && scene3d){
    // 可选：简单转成消息
    return;
  }
  _origAddFloatText(x, y, text, color);
};

// drawCooldownIcon 在 2D HUD 中使用，3D 模式下不需要
drawCooldownIcon = function(){ /* no-op in 3D */ };

// ============================================================
// 游戏主循环
// ============================================================
function gameLoop(time){
  animTime = time / 1000;
  for(let i = 0; i < skillSlots.length; i++){ if(skillSlots[i].cd > 0) skillSlots[i].cd--; }
  if(arrowCd > 0) arrowCd--;
  if(actionDelay > 0) actionDelay--;
  if(!gameOver){
    spawnAmbientDust();
    realtimeTick++;
    if(realtimeTick >= 12){ // 怪物回合放缓（原 8 帧），移速慢一点
      realtimeTick = 0;
      takeEnemyTurns();
      cleanupDead();
    }
    if(time % 60 === 0 && player && player.hp > 0 && player.hp < player.maxHp){
      player.hp = Math.min(player.maxHp, player.hp + 1);
      updateUI();
    }
  }
  updateParticles();
  updateFloatTexts();
  updateProjectiles();
  updateSlashEffects();
  render();
  updateUI();
  requestAnimationFrame(gameLoop);
}

// ---- 聊天事件监听 ----
document.getElementById('npc-chat-send').addEventListener('click', sendChatMessage);
document.getElementById('npc-chat-input').addEventListener('keydown', (e) => {
  if(e.key === 'Enter'){ e.preventDefault(); e.stopPropagation(); sendChatMessage(); }
});
document.getElementById('npc-chat-bargain-btn').addEventListener('click', bargainWithNPC);

// ============================================================
// 启动初始化
// ============================================================
function start3D(){
  // 原版 main.js 才调用 initSprites；3D 版本需要自行初始化精灵像素数据
  try{ initSprites(); }catch(e){ console.warn('initSprites 失败:', e); }
  init3D();
  // 确保布局完成后重新计算尺寸
  setTimeout(onResize3D, 50);
  setTimeout(onResize3D, 200);
  try{
    if(hasSave()){
      const loaded = loadGame();
      if(loaded && player && player.x !== undefined){
        console.log('[存档] 读取成功，第'+floor+'层');
        buildFloor3D();
      } else {
        console.warn('[存档] 读取失败');
        clearSave();
        restartGame();
        buildFloor3D();
      }
    } else {
      restartGame();
      buildFloor3D();
    }
  } catch(e){
    console.error('[存档] 启动异常:', e);
    clearSave();
    restartGame();
    buildFloor3D();
  }
  gameLoop(0);
  console.log('暗影地牢 3D 已加载！点击画面锁定鼠标，方向键/WASD移动（第一人称）');
}

// 确保 npc.js 的 monkey-patch 不会出问题
if(typeof npcChatState === 'undefined'){
  // npc.js 已经定义了，但做一下安全保护
}

start3D();
