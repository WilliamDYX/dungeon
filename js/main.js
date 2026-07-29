// main.js - 游戏主循环、聊天事件监听、启动初始化

function gameLoop(time){
  animTime=time/1000;
  // ★★★ 技能冷却递减 ★★★
  if(fireballCd>0)fireballCd--;
  if(healCd>0)healCd--;
  if(actionDelay>0)actionDelay--;
  if(!gameOver){
    spawnAmbientDust();
    // Real-time enemy movement every 8 frames
    realtimeTick++;
    if(realtimeTick>=8){
      realtimeTick=0;
      takeEnemyTurns();
      cleanupDead();
    }
    // Slow HP regen every 60 frames (1/sec)
    if(time%60===0&&player&&player.hp>0&&player.hp<player.maxHp){
      player.hp=Math.min(player.maxHp,player.hp+1);
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

// Send button handler
document.getElementById('npc-chat-send').addEventListener('click', sendChatMessage);
document.getElementById('npc-chat-input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); sendChatMessage(); }
});

// ---- Start ----
initSprites();
try{
  if(hasSave()){
    const loaded=loadGame();
    if(loaded&&player&&player.x!==undefined){
      console.log('[存档] 读取成功，第'+floor+'层');
    }else{
      console.warn('[存档] 读取失败');
      clearSave();
      restartGame();
    }
  }else{
    restartGame();
  }
}catch(e){
  console.error('[存档] 启动异常:',e);
  clearSave();
  restartGame();
}
gameLoop(0);

console.log('暗影地牢已加载！方向键/WASD移动，Q旋风斩（含刀光特效），R火球术(2s CD)，T治愈术(15s CD)，F射击，>下楼');
