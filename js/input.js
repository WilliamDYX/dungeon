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
    case 'q':case 'Q':playerSpecialAttack();break;
    case 'e':case 'E':
      let foundNpc=false;
      for(const npc of npcs){
        if(Math.abs(npc.x-player.x)<=1&&Math.abs(npc.y-player.y)<=1){foundNpc=true;break}
      }
      if(foundNpc)interactNPC();
      else interactAltar();
      break;
    case 'r':case 'R':castFireball();break;
    case 't':case 'T':castHeal();break;
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
