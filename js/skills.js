// skills.js - 技能(火球/治愈/炸弹)、商店、灵魂系统与永久加成

// ---- Shop System ----
function openShop(npc){
  shopOpen=true;currentShop=npc;
  document.getElementById('shop-title').textContent='⚒ '+npc.name;
  document.getElementById('shop-gold').textContent='金币: '+player.gold;
  const desc=npc.type==='weaponsmith'?'"上好武器，冒险者？"':
    npc.type==='staffmaster'?'"法杖蕴含古老之力..."':
    npc.type==='skillmaster'?'"知识需要代价..."':
    npc.type==='healer'?'"圣光保佑你，孩子..."':
    '"星辰之力在此..."';
  document.getElementById('shop-desc').textContent=desc;
  const container=document.getElementById('shop-items');
  container.innerHTML='';
  for(const item of npc.shop){
    const div=document.createElement('div');
    div.className='shop-item';
    const isOwned=(item.id==='skill_fire'&&playerSkills.fireball)||(item.id==='skill_heal'&&playerSkills.heal);
    const canAfford=player.gold>=item.cost;
    if(isOwned){div.classList.add('disabled');div.innerHTML=`<span>${item.name}</span><span class="owned">已拥有</span>`}
    else if(!canAfford){div.classList.add('disabled');div.innerHTML=`<span>${item.name}</span><span class="cost" style="color:#ef5350">${item.cost}G</span>`}
    else{
      div.innerHTML=`<span>${item.name}<br><span style="font-size:11px;color:#6a6a7a">${item.desc}</span></span><span class="cost">${item.cost}G</span>`;
      div.onclick=()=>buyItem(item,npc);
    }
    container.appendChild(div);
  }
  document.getElementById('shop-overlay').classList.add('show');
}

function closeShop(){
  shopOpen=false;currentShop=null;
  document.getElementById('shop-overlay').classList.remove('show');
}

function buyItem(item,npc){
  if(player.gold<item.cost){addMsg('金币不足！','warning');return}
  if((item.id==='skill_fire'&&playerSkills.fireball)||(item.id==='skill_heal'&&playerSkills.heal)){
    addMsg('已掌握此技能','info');closeShop();return;
  }
  player.gold-=item.cost;
  spawnGoldParticles(player.x*TILE+TILE/2,player.y*TILE+TILE/2);
  addMsg(`花费 ${item.cost} 金币购买了 ${item.name}`,'info');
  item.effect();
  updateUI();
  closeShop();
  endTurn();
}
// ★★★ 技能冷却系统 - 火球术 ★★★
function castFireball(){
  if(gameOver||actionDelay>0)return;
  if(!playerSkills.fireball){addMsg('你不会火球术','info');return}

  // CD检查
  if(fireballCd>0){
    const secLeft=Math.ceil(fireballCd/60);
    addMsg(`火球术冷却中（剩余 ${secLeft} 秒）`,'info');
    return;
  }

  const {dx,dy}=player.lastDir;
  if(dx===0&&dy===0)return;

  actionDelay=14;
  fireballCd=fireballCdMax; // 设置2秒CD

  const px=player.x*TILE+TILE/2,py=player.y*TILE+TILE/2;
  spawnParticles(px+dx*10,py+dy*10,'#ff6f00',8,{spread:0.8,gravity:-0.02});
  addFloatText(px+dx*20,py+dy*20,'🔥','#ff6f00');
  addMsg('发射火球术！','info');
  projectiles.push({
    x:player.x+dx,y:player.y+dy,dx,dy,
    life:8,dmg:Math.max(1,Math.floor(player.atk*1.2)),
    fromPlayer:true,type:'fireball',
  });
  endTurn();
}

// ★★★ 技能冷却系统 - 治愈术 ★★★
function castHeal(){
  if(gameOver||actionDelay>0)return;
  if(!playerSkills.heal){addMsg('你不会治愈术','info');return}

  // HP检查（在CD检查之前，避免浪费CD）
  const healAmt=Math.floor(player.maxHp*0.5);
  const actual=Math.min(healAmt,player.maxHp-player.hp);
  if(actual<=0){addMsg('生命值已满','info');return}

  // CD检查
  if(healCd>0){
    const secLeft=Math.ceil(healCd/60);
    addMsg(`治愈术冷却中（剩余 ${secLeft} 秒）`,'info');
    return;
  }

  actionDelay=10;
  healCd=healCdMax; // 设置15秒CD

  player.hp+=actual;
  const cx=player.x*TILE+TILE/2,cy=player.y*TILE+TILE/2;
  spawnHealParticles(cx,cy);
  spawnParticles(cx,cy,'#66bb6a',10,{spread:1.5,gravity:-0.03});
  addFloatText(cx,cy-12,'+'+actual,'#66bb6a');
  addMsg(`治愈术恢复 ${actual} 点生命！`,'heal');
  screenShake=2;
  updateUI();
  endTurn();
}

function fireballExplosion(x,y,dmg){
  spawnParticles(x*TILE+TILE/2,y*TILE+TILE/2,'#ff6f00',15,{spread:2});
  spawnParticles(x*TILE+TILE/2,y*TILE+TILE/2,'#ffab00',10,{spread:1.8});
  spawnParticles(x*TILE+TILE/2,y*TILE+TILE/2,'#ff5252',8,{spread:1.5});
  screenShake=8;
  addFloatText(x*TILE+TILE/2,y*TILE+TILE/2-16,'💥 爆炸！','#ff6f00');
  for(const e of entities){
    if(e.dead)continue;
    if(Math.abs(e.x-x)<=1&&Math.abs(e.y-y)<=1){
      const d=Math.max(1,dmg-e.def+rand(-1,2));
      e.hp-=d;e.hitFlash=10;
      const cx=e.x*TILE+TILE/2,cy=e.y*TILE+TILE/2;
      spawnParticles(cx,cy,'#ff5252',10,{spread:1.5});
      addFloatText(cx,cy-TILE/2,'-'+d,'#ff5252');
      addMsg(`火球炸到${enemyName(e.type)}造成 ${d} 点伤害！`,'damage');
      if(e.hp<=0){
        e.dead=true;
        spawnParticles(cx,cy,'#ff8a80',20,{spread:2});
        addMsg(`${enemyName(e.type)}被火球烧成灰烬！`,'warning');
        onEnemyKilled(e);
      }
    }
  }
  cleanupDead();
}

// ---- Soul/Permanent System ----
function spawnSoulGems(){
  if(floor%5===0){
    const ri=rand(1,rooms.length-1);
    const room=rooms[ri];
    const x=rand(room.x+1,room.x+room.w-2);
    const y=rand(room.y+1,room.y+room.h-2);
    items.push({x,y,type:'soulgem',name:'灵魂碎片'});
  }
}

function collectSoul(count){
  soulShards+=count;
  SAFE_STORE.set('ds_souls',soulShards.toString());
  addMsg(`获得 ${count} 枚灵魂碎片！（共 ${soulShards}）`,'special');
}

function openSoulShop(){
  document.getElementById('soul-count').textContent='灵魂碎片: '+soulShards;
  const bonusText=`当前永久加成: +${soulBonusAtk} ATK, +${soulBonusDef} DEF, +${soulBonusHp} HP`;
  document.getElementById('soul-bonus').textContent=bonusText;
  const container=document.getElementById('soul-items');
  container.innerHTML='';
  const items=[
    {id:'sAtk',name:'⛆ 力量印记',desc:'永久攻击力+1（开局生效）',cost:3,
     effect:()=>{soulBonusAtk++;SAFE_STORE.set('ds_bonusAtk',soulBonusAtk.toString());addMsg('永久攻击力+1！','special')}},
    {id:'sDef',name:'⛆ 守护印记',desc:'永久防御力+1（开局生效）',cost:3,
     effect:()=>{soulBonusDef++;SAFE_STORE.set('ds_bonusDef',soulBonusDef.toString());addMsg('永久防御力+1！','special')}},
    {id:'sHp',name:'⛆ 生命印记',desc:'永久最大生命+10（开局生效）',cost:2,
     effect:()=>{soulBonusHp+=10;SAFE_STORE.set('ds_bonusHp',soulBonusHp.toString());addMsg('永久生命+10！','heal')}},
  ];
  for(const item of items){
    const div=document.createElement('div');
    div.className='soul-item';
    if(soulShards<item.cost){div.classList.add('disabled');div.innerHTML=`<span>${item.name}<br><span style="font-size:11px;color:#6a6a7a">${item.desc}</span></span><span class="cost" style="color:#ef5350">${item.cost}魂</span>`}
    else{
      div.innerHTML=`<span>${item.name}<br><span style="font-size:11px;color:#6a6a7a">${item.desc}</span></span><span class="cost">${item.cost}魂</span>`;
      div.onclick=()=>{if(soulShards>=item.cost){soulShards-=item.cost;SAFE_STORE.set('ds_souls',soulShards.toString());item.effect();updateUI();openSoulShop()}};
    }
    container.appendChild(div);
  }
  document.getElementById('soul-shop-overlay').classList.add('show');
}

function closeSoulShop(){
  document.getElementById('soul-shop-overlay').classList.remove('show');
}

function applySoulBonuses(){
  if(player){
    player.atk+=soulBonusAtk;
    player.def+=soulBonusDef;
    player.maxHp+=soulBonusHp;
    player.hp=player.maxHp;
  }
}
function useBomb(){
  if(gameOver||actionDelay>0)return;
  if(!player.bombs||player.bombs<=0){addMsg('没有炸弹！','info');return}
  player.bombs--;
  actionDelay=12;
  screenShake=12;
  damageFlash=6;
  const px=player.x*TILE+TILE/2,py=player.y*TILE+TILE/2;
  spawnParticles(px,py,'#ff6f00',20,{spread:3,gravity:-0.02});
  spawnParticles(px,py,'#ffab00',15,{spread:2.5,gravity:-0.01});
  spawnParticles(px,py,'#ff3d00',12,{spread:2,gravity:0});
  addFloatText(px,py-24,'💣 炸弹！','#ff6f00');
  addMsg('投掷炸弹！对周围3x3范围内所有敌人造成伤害！','warning');
  const bombDmg=Math.max(1,Math.floor(player.atk*1.5));
  for(const e of entities){
    if(e.dead)continue;
    if(Math.abs(e.x-player.x)<=1&&Math.abs(e.y-player.y)<=1){
      const dmg=bombDmg-e.def+rand(-1,3);
      const finalDmg=Math.max(1,dmg);
      e.hp-=finalDmg;e.hitFlash=10;
      const cx=e.x*TILE+TILE/2,cy=e.y*TILE+TILE/2;
      spawnParticles(cx,cy,'#ff5252',10,{spread:1.5});
      addFloatText(cx,cy-TILE/2,'-'+finalDmg,'#ff6f00');
      addMsg(`炸弹击中${enemyName(e.type)}造成 ${finalDmg} 点伤害！`,'damage');
      if(e.hp<=0){
        e.dead=true;
        spawnParticles(cx,cy,'#ff8a80',20,{spread:2});
        addMsg(`${enemyName(e.type)}被炸成碎片！`,'warning');
        onEnemyKilled(e);
      }
    }
  }
  cleanupDead();
  updateUI();
  endTurn();
}
