// player.js - 玩家行为：移动、回合、物品处理、下楼、祭坛、拾取、交互NPC、升级

function levelUp(){
  player.level++;player.kills=0;
  player.nextLevel=Math.floor(player.nextLevel*1.15)+2;
  player.atk+=1;player.def+=1;
  player.maxHp+=5;player.hp=player.maxHp;
  const cx=player.x*TILE+TILE/2,cy=player.y*TILE+TILE/2;
  spawnLevelUpParticles(cx,cy);
  document.getElementById('lu-stats').textContent=`攻击力 +1 | 防御力 +1 | 生命上限 +5 | 等级 ${player.level}`;
  const lu=document.getElementById('level-up-notification');
  lu.classList.add('show');
  setTimeout(()=>lu.classList.remove('show'),2000);
  addMsg(`升级！达到等级 ${player.level}！`,'special');
  updateUI();
  saveGame(); // 升级自动存档
}
function movePlayer(dx,dy){
  if(gameOver||actionDelay>0)return;
  player.lastDir={dx,dy};
  player.moveStreak=Math.min((player.moveStreak||0)+1,6);
  if(player.moveStreak>=3){
    player.stutterX=(player.stutterX||0)-dx*1.2;
    player.stutterY=(player.stutterY||0)-dy*1.2;
  }
  const nx=player.x+dx,ny=player.y+dy;
  for(const item of items){
    if(item.type==='spikes'&&item.x===nx&&item.y===ny){
      addMsg('踩到尖刺陷阱！','warning');
      player.hp-=2;damageFlash=4;screenShake=4;
      spawnParticles(nx*TILE+TILE/2,ny*TILE+TILE/2,'#ff5252',8,{spread:1});
      addFloatText(nx*TILE+TILE/2,ny*TILE+TILE/2-12,'-2','#ff5252');
      if(player.hp<=0){player.hp=0;gameOver=true;showGameOver();updateUI();return}
      updateUI();
    }
  }
  for(const e of entities){
    if(e.dead)continue;
    if(e.x===nx&&e.y===ny){playerAttack(e);cleanupDead();endTurn();return}
  }
  if(!canPlayerMove(nx,ny))return;
  player.x=nx;player.y=ny;
  actionDelay=1;
  if(Math.random()<0.25)spawnParticles(player.x*TILE+TILE/2,player.y*TILE+TILE/2,'#8d6e63',2,{spread:0.5,gravity:0.1});
  if(floorCurse&&floorCurse.id==='poison_air'){
    curseStepCounter++;
    if(curseStepCounter>=5){
      curseStepCounter=0;
      player.hp-=1;
      spawnParticles(player.x*TILE+TILE/2,player.y*TILE+TILE/2,'#76ff03',5,{spread:0.8});
      addFloatText(player.x*TILE+TILE/2,player.y*TILE+TILE/2-12,'-1 毒','#76ff03');
      addMsg('毒雾侵蚀，受到1点伤害！','damage');
      if(player.hp<=0){player.hp=0;gameOver=true;showGameOver();updateUI();return}
    }
  }
  endTurn();
}

function endTurn(){
  turnCount++;
  if(npcChatState.bargainCooldown>0)npcChatState.bargainCooldown--;
  if(map[player.y][player.x]===T_STAIRS){descend();return}
  processItems();
  updateFOV(player.x,player.y,fovRadius());
  takeEnemyTurns();
  cleanupDead();
}

function processItems(){
  for(let i=items.length-1;i>=0;i--){
    const item=items[i];
    if(item.x!==player.x||item.y!==player.y)continue;
    const cx=item.x*TILE+TILE/2,cy=item.y*TILE+TILE/2;
    if(item.type==='hpotion'){
      const heal=Math.min(8,player.maxHp-player.hp);
      if(heal>0){player.hp+=heal;spawnHealParticles(cx,cy);addFloatText(cx,cy-12,'+'+heal,'#66bb6a')}
      addMsg('拾取生命药剂'+(heal>0?`,恢复${heal}点生命`:'但生命已满'),heal>0?'heal':'info');
    }else if(item.type==='spotion'){
      player.atk+=1;spawnLevelUpParticles(cx,cy);addMsg('拾取力量药剂！攻击力+1！','special');
    }else if(item.type==='gold'){
      const gv=item.value||5;player.gold+=gv;spawnGoldParticles(cx,cy);addFloatText(cx,cy-12,'+'+gv,'#ffd740');addMsg(`拾取 ${gv} 金币！`,'info');
    }else if(item.type==='scroll'){
      const heal=Math.min(5,player.maxHp-player.hp);
      if(heal>0){player.hp+=heal;spawnHealParticles(cx,cy)}addMsg('拾取神秘卷轴！','special');
    }else if(item.type==='soulgem'){
      collectSoul(1);
      spawnParticles(cx,cy,'#ce93d8',12,{spread:1.5,gravity:-0.03});
      addFloatText(cx,cy-12,'✦+1','#ce93d8');
    }else continue;
    items.splice(i,1);
  }
}

function cleanupDead(){
  for(const e of entities)if(e.dead)spawnParticles(e.x*TILE+TILE/2,e.y*TILE+TILE/2,'#9e9e9e',5,{spread:0.8});
  entities=entities.filter(e=>!e.dead);
}

function waitTurn(){if(!gameOver&&actionDelay<=0){actionDelay=6;endTurn()}}

function descend(){
  floor++;
  curseStepCounter=0;
  if(floor>=8){
    if(Math.random()<0.4||floorCurse===null){
      const newCurse=generateCurse();
      if(newCurse)floorCurse=newCurse;
    }
  }else{
    removeCurseEffects();
  }
  addMsg(`下到第 ${floor} 层...`,'info');
  bossWarning=false;
  if(floor%5===0)setTimeout(()=>{addMsg('⚡ 你感受到一股强大的邪恶气息...','warning');bossWarning=true},200);
  checkStoryEvent();
  initFloor();
  saveGame(); // 下楼自动存档
}

function interactAltar(){
  if(gameOver||actionDelay>0)return;
  for(let i=items.length-1;i>=0;i--){
    const item=items[i];
    if(item.type==='altar'&&Math.abs(item.x-player.x)<=1&&Math.abs(item.y-player.y)<=1){
      if(item.uses<=0){addMsg('祭坛的力量已经耗尽...','info');return;}
      const cx=item.x*TILE+TILE/2,cy=item.y*TILE+TILE/2;
      let offering=false;
      if(player.gold>=5){
        if(Math.random()<0.5){player.gold-=5;offering=true;spawnGoldParticles(cx,cy);addFloatText(cx,cy-12,'-5','#ffd740');addMsg('祭坛吸收了5枚金币，光芒大盛！','special');}
      }
      actionDelay=8;
      item.uses--;
      if(item.cursed){
        const r=Math.random();
        if(r<0.35){
          const dmg=rand(3,7);player.hp=Math.max(0,player.hp-dmg);
          spawnParticles(cx,cy,'#ef5350',10,{spread:1.5});
          addFloatText(cx,cy-12,'-'+dmg,'#ef5350');
          addMsg('祭坛释放出诅咒之力！损失'+dmg+'点生命！','damage');
          if(player.hp<=0){player.hp=0;gameOver=true;showGameOver();updateUI();return}
        }else if(r<0.6){
          player.atk=Math.max(1,player.atk-1);
          spawnParticles(cx,cy,'#9c27b0',8,{spread:1});
          addMsg('祭坛吸走了你的力量！攻击力-1！','warning');
        }else if(r<0.8){
          player.atk+=2;spawnLevelUpParticles(cx,cy);addMsg('祭坛赐予你禁忌之力！攻击力+2！','special');
        }else{
          player.def+=2;spawnLevelUpParticles(cx,cy);addMsg('祭坛赐予你暗影守护！防御力+2！','special');
        }
      }else if(offering){
        const r=Math.random();
        if(r<0.4){
          const heal=Math.min(15,player.maxHp-player.hp);
          if(heal>0){player.hp+=heal;spawnHealParticles(cx,cy);addFloatText(cx,cy-12,'+'+heal,'#66bb6a')}
          addMsg('祭坛绽放出璀璨的治愈之光！恢复'+heal+'点生命！','heal');
        }else if(r<0.7){
          player.atk+=2;spawnLevelUpParticles(cx,cy);addMsg('祭坛赐予你强大的力量！攻击力+2！','special');
        }else{
          player.def+=2;spawnLevelUpParticles(cx,cy);addMsg('祭坛赐予你坚固的守护！防御力+2！','special');
        }
      }else{
        const r=Math.random();
        if(r<0.5){
          const heal=Math.min(10,player.maxHp-player.hp);
          if(heal>0){player.hp+=heal;spawnHealParticles(cx,cy);addFloatText(cx,cy-12,'+'+heal,'#66bb6a')}
          addMsg('祭坛散发出治愈之光！','heal');
        }else if(r<0.8){
          player.atk+=1;spawnLevelUpParticles(cx,cy);addMsg('祭坛赐予你力量！攻击力+1！','special');
        }else{
          player.def+=1;spawnLevelUpParticles(cx,cy);addMsg('祭坛赐予你守护！防御力+1！','special');
        }
      }
      if(item.uses>0){addMsg('祭坛剩余使用次数: '+item.uses,'info');}else{addMsg('祭坛的力量已耗尽...','info');}
      endTurn();
      return;
    }
  }
  addMsg('附近没有祭坛','info');
}

function pickupItem(){
  if(gameOver)return;
  for(let i=items.length-1;i>=0;i--){
    const item=items[i];
    if(item.type==='torch'||item.type==='barrel'||item.type==='statue'||item.type==='altar'||item.type==='spikes'||item.type==='bookshelf'||item.type==='cage'||item.type==='anvil'||item.type==='cobweb'||item.type==='marble'||item.type==='blood'||item.type==='candle'||item.type==='bones'||item.type==='mushroom'||item.type==='pillar'||item.type==='urn'||item.type==='soulgem')continue;
    if(item.x===player.x&&item.y===player.y){processPickedItem(item,i);endTurn();return;}
  }
  addMsg('这里没有东西','info');
}

function processPickedItem(item,i){
  const cx=item.x*TILE+TILE/2,cy=item.y*TILE+TILE/2;
  if(item.type==='hpotion'){
    const heal=Math.min(8,player.maxHp-player.hp);
    if(heal>0){player.hp+=heal;spawnHealParticles(cx,cy);addFloatText(cx,cy-12,'+'+heal,'#66bb6a')}
    addMsg('拾取生命药剂'+(heal>0?`,恢复${heal}点生命`:'，但生命已满'),heal>0?'heal':'info');
  }else if(item.type==='spotion'){
    player.atk+=1;spawnLevelUpParticles(cx,cy);addMsg('拾取力量药剂！攻击力+1！','special');
  }else if(item.type==='gold'){
    const gv=item.value||5;player.gold+=gv;spawnGoldParticles(cx,cy);addFloatText(cx,cy-12,'+'+gv,'#ffd740');addMsg(`拾取 ${gv} 金币！`,'info');
  }else if(item.type==='scroll'){
    const heal=Math.min(5,player.maxHp-player.hp);
    if(heal>0){player.hp+=heal;spawnHealParticles(cx,cy)}addMsg('拾取神秘卷轴！','special');
  }else if(item.type==='bomb'){
    player.bombs=(player.bombs||0)+1;addMsg('拾取炸弹！按 X 使用（对3x3范围造成伤害）','special');
  }else if(item.type==='mapscroll'){
    for(let y=0;y<MAP_H;y++)for(let x=0;x<MAP_W;x++){if(visible[y]&&visible[y][x]!==undefined)visible[y][x]=true}
    addMsg('使用地图卷轴，全图已点亮！','special');
  }else if(item.type==='tpscroll'){
    const ri=rand(1,rooms.length-1);const room=rooms[ri];
    if(room){player.x=rand(room.x+1,room.x+room.w-2);player.y=rand(room.y+1,room.y+room.h-2)}
    addMsg('传送卷轴将你传送到了随机位置！','special');
  }else if(item.type==='weapon'){
    player.atk+=item.bonus;spawnLevelUpParticles(cx,cy);addMsg(`拾取${item.name}，攻击力+${item.bonus}！`,'special');
  }else if(item.type==='armor'){
    player.def+=item.bonus;spawnLevelUpParticles(cx,cy);addMsg(`拾取${item.name}，防御力+${item.bonus}！`,'special');
  }else addMsg(`拾取了${item.name}`,'info');
  items.splice(i,1);
}

function interactNPC(){
  if(gameOver||actionDelay>0||shopOpen)return;
  for(const npc of npcs){
    if(Math.abs(npc.x-player.x)<=1&&Math.abs(npc.y-player.y)<=1){openShop(npc);return;}
  }
  addMsg('附近没有商人','info');
}

