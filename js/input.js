// input.js - UI状态更新(updateUI)与全局键盘输入处理

// ---- UI ----
function updateUI(){
  if(!player)return;
  const ratio=player.hp/player.maxHp;
  hud.hp=player.hp;hud.maxHp=player.maxHp;
  hud.hpPct=Math.max(0,ratio*100);
  hud.floor=floor;hud.kills=kills;
  hud.atk=player.atk;hud.def=player.def;
  hud.level=player.level;hud.gold=player.gold;
  hud.bombs=player.bombs||0;
  hud.curse=floorCurse?('咒: '+floorCurse.name):'';
}

// ---- Input ----
document.addEventListener('keydown',(e)=>{
  const key=e.key;
  const code=e.code;

  if(npcChatState.open){
    if(key==='Escape'){closeNPCChat();e.preventDefault()}
    else if(key==='Enter'){sendChatMessage();e.preventDefault()}
    return;
  }
  if(shopOpen||document.getElementById('soul-shop-overlay').classList.contains('show'))return;

  // ★ 调试功能（不显示在侧边栏；1/2/3 留给技能槽）★
  if(key==='0'){
    e.preventDefault();
    clearSave();
    debugInvincible=false;debugInstakill=false;
    addMsg('[调试] 存档已删除，调试模式已重置','special');
    return;
  }
  if(key==='9'){
    e.preventDefault();
    const input=prompt('传送楼层 (debug):','');
    if(input!==null&&input.trim()!==''){
      const n=parseInt(input.trim(),10);
      if(!Number.isNaN(n)&&n>=1){gotoFloor(n);}
      else{addMsg('[调试] 请输入有效的楼层正整数','warning');}
    }
    return;
  }
  if(key==='8'){
    e.preventDefault();
    debugInvincible=!debugInvincible;
    addMsg(debugInvincible?'[调试] 无敌模式 ON':'[调试] 无敌模式 OFF',debugInvincible?'special':'info');
    return;
  }
  if(key==='7'){
    e.preventDefault();
    debugInstakill=!debugInstakill;
    addMsg(debugInstakill?'[调试] 秒杀模式 ON':'[调试] 秒杀模式 OFF',debugInstakill?'special':'info');
    return;
  }
  if(key==='4'){
    e.preventDefault();
    summonEnemy('naiwa');
    return;
  }
  if(key==='5'){
    e.preventDefault();
    summonEnemy('nailong');
    return;
  }
  if(key==='6'){
    e.preventDefault();
    const input=prompt('调整血量 (debug):','');
    if(input!==null&&input.trim()!==''){
      const n=parseInt(input.trim(),10);
      if(Number.isNaN(n)||n<0){addMsg('[调试] 请输入有效的非负整数','warning');return;}
      if(n>player.maxHp){player.maxHp=n;addMsg(`[调试] 最大血量提升至 ${n}`,'special');}
      player.hp=n;
      spawnHealParticles(player.x*TILE+TILE/2,player.y*TILE+TILE/2);
      addMsg(`[调试] 当前血量设为 ${n} / ${player.maxHp}`,'special');
      updateUI();
    }
    return;
  }
  if(key==='-'){
    e.preventDefault();
    debugInvincible=false;debugInstakill=false;
    addMsg('[调试] 所有调试功能已关闭（仍在当前楼层）','info');
    return;
  }

  if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(key))e.preventDefault();

  if(key==='c'||key==='C'||code==='KeyC'){
    if(gameOver||actionDelay>0)return;
    let found=null;
    for(let i=0;i<npcs.length;i++){
      const n=npcs[i];
      if(Math.abs(n.x-player.x)<=1&&Math.abs(n.y-player.y)<=1){found=n;break}
    }
    if(found)openNPCChat(found);
    else addMsg('附近没有可以对话的NPC','info');
    return;
  }

  switch(key){
    case 'ArrowUp':case 'w':case 'W':movePlayer(0,-1);break;
    case 'ArrowDown':case 's':case 'S':movePlayer(0,1);break;
    case 'ArrowLeft':case 'a':case 'A':movePlayer(-1,0);break;
    case 'ArrowRight':case 'd':case 'D':movePlayer(1,0);break;
    case ' ':waitTurn();break;
    case 'g':case 'G':pickupItem();break;
    case 'f':case 'F':playerRangedAttack();break;
    case '1':useSkill(0);break;
    case '2':useSkill(1);break;
    case '3':useSkill(2);break;
    case 'q':case 'Q':useSkill(3);break;
    case 'e':case 'E':
      let foundNpc=false;
      for(const npc of npcs){
        if(Math.abs(npc.x-player.x)<=1&&Math.abs(npc.y-player.y)<=1){foundNpc=true;break}
      }
      if(foundNpc)interactNPC();
      else interactAltar();
      break;
    case 'r':case 'R':useSkill(4);break;
    case 't':case 'T':useSkill(5);break;
    case 'b':case 'B':openSoulShop();break;
    case 'x':case 'X':useBomb();break;
    case '>':case '.':if(map[player.y][player.x]===T_STAIRS)descend();break;
    case 'p':case 'P':{
      if(gameOver)break;
      const ok=saveGame();
      if(ok){
        addMsg('✓ 已手动存档（第'+floor+'层）','info');
        if(player&&player.x!==undefined)spawnParticles(player.x*TILE+TILE/2,player.y*TILE+TILE/2,'#64b5f6',8,{spread:1});
      }else{
        addMsg('✗ 存档失败（浏览器存储不可用）','warning');
      }
      break;
    }
    case 'l':case 'L':{
      if(gameOver)break;
      if(!hasSave()){addMsg('没有可读取的存档','warning');break;}
      const ok=loadGame();
      if(ok){
        addMsg('✓ 已读取存档','info');
        console.log('[存档] 手动读取成功，第'+floor+'层');
      }else{
        addMsg('✗ 读档失败','warning');
      }
      break;
    }
  }
});

// ===== 左键发射箭矢：朝点击的光标方向 =====
// 屏幕坐标 → 世界像素坐标（与 render.js 的 viewOrigin 换算一致）
function screenToWorld(sx, sy){
  const vx=(player.vx!==undefined?player.vx:player.x*TILE)+(player.stutterX||0)+TILE/2;
  const vy=(player.vy!==undefined?player.vy:player.y*TILE)+(player.stutterY||0)+TILE/2;
  const viewOriginX=clamp(vx-canvas.width/2,0,MAP_W*TILE-canvas.width);
  const viewOriginY=clamp(vy-canvas.height/2,0,MAP_H*TILE-canvas.height);
  return { wx: sx+viewOriginX, wy: sy+viewOriginY };
}

// 阻止 canvas 上的右键菜单
canvas.addEventListener('contextmenu', e=>{ e.preventDefault(); });

// 左键按下 → 朝光标方向射箭
canvas.addEventListener('mousedown', e=>{
  if(e.button!==0)return; // 仅左键
  if(gameOver||actionDelay>0)return;
  if(npcChatState.open||shopOpen||document.getElementById('soul-shop-overlay').classList.contains('show'))return;
  const rect=canvas.getBoundingClientRect();
  // canvas 实际尺寸 vs CSS 尺寸 的缩放
  const scaleX=canvas.width/rect.width, scaleY=canvas.height/rect.height;
  const sx=(e.clientX-rect.left)*scaleX;
  const sy=(e.clientY-rect.top)*scaleY;
  const {wx,wy}=screenToWorld(sx,sy);
  // 直接传世界像素坐标给攻击函数
  playerRangedAttack(wx, wy);
  e.preventDefault();
});
