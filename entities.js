// entities.js - 敌人创建、战斗(攻击/远程/旋风斩/投射物)、敌人AI回合、可移动判定

function createEnemy(type,x,y,elite){
  const hard=Math.max(1,Math.floor(floor/8));
  const e={
    id:enemyIdCounter++,x,y,type,
    hp:1,maxHp:1,atk:1,def:0,
    detectRange:5,hitFlash:0,dead:false,
    animOffset:randF(0,Math.PI*2),
    elite:!!elite,attackCd:0,
  };
  const em=elite?1.5:1;
  switch(type){
    case 'slime':
      e.hp=Math.floor((6+floor+hard*3)*em);e.maxHp=e.hp;
      e.atk=Math.floor((3+Math.floor(floor/2)+hard)*em);
      e.def=0;e.detectRange=5;
      break;
    case 'bat':
      e.hp=Math.floor((4+floor*0.8+hard*2)*em);e.maxHp=e.hp;
      e.atk=Math.floor((4+Math.floor(floor/2)+hard)*em);
      e.def=0;e.detectRange=7;
      break;
    case 'skeleton':
      e.hp=Math.floor((10+floor*2+hard*5)*em);e.maxHp=e.hp;
      e.atk=Math.floor((5+floor+hard*2)*em);
      e.def=Math.floor((2+Math.floor(floor/2))*em);e.detectRange=6;
      break;
    case 'ghost':
      e.hp=Math.floor((7+floor*1.5+hard*3)*em);e.maxHp=e.hp;
      e.atk=Math.floor((4+floor+hard*2)*em);e.def=1;
      e.detectRange=8;
      break;
    case 'lich':
      e.hp=Math.floor((12+floor*2+hard*4)*em);e.maxHp=e.hp;
      e.atk=Math.floor((6+floor*1.2+hard)*em);e.def=1;
      e.detectRange=9;e.ranged=true;
      break;
    case 'mimic':
      e.hp=Math.floor((8+floor*1.5+hard*3)*em);e.maxHp=e.hp;
      e.atk=Math.floor((5+floor+hard)*em);e.def=Math.floor((1+Math.floor(floor/3))*em);
      e.detectRange=0;e.ambush=true;
      break;
    case 'demon':
      e.hp=Math.floor((25+floor*3+hard*6)*em);e.maxHp=e.hp;
      e.atk=Math.floor((8+floor*1.5+hard*2)*em);
      e.def=Math.floor((3+Math.floor(floor/2)+hard)*em);
      e.detectRange=9;
      break;
    case 'fallenAngel':
      // 堕天使 - 隐藏Boss，击败可逃出地牢(胜利结局)
      e.hp=Math.floor((40+floor*4+hard*8)*2);e.maxHp=e.hp;
      e.atk=Math.floor((10+floor*1.5+hard*2)*1.4);
      e.def=Math.floor((5+Math.floor(floor/2)+hard)*1.5);
      e.detectRange=11;
      break;
    case 'naiwa':{
      const naiwaCoef=floor>=20?2:1.5;
      e.hp=Math.floor(floor*naiwaCoef+30)*em;e.maxHp=e.hp;
      e.atk=Math.floor(floor*naiwaCoef+30)*em;
      e.def=Math.floor((2+Math.floor(floor/3))*em);
      e.detectRange=6;
      break;
    }
    case 'nailong':{
      const nailongCoef=floor>=20?2.5:2;
      e.hp=Math.floor(floor*nailongCoef+30)*em;e.maxHp=e.hp;
      e.atk=Math.floor(floor*nailongCoef+30)*em;
      e.def=Math.floor((3+Math.floor(floor/2))*em);
      e.detectRange=7;
      break;
    }
  }
  return e;
}

function spawnEnemies(){
  const count=rand(4+Math.floor(floor/2),7+Math.floor(floor/2));
  const bossFloor=floor%5===0;
  // ★ 生成概率随楼层提升（1层0.65 → 30层0.95）★
  const spawnChance=Math.min(0.95,0.65+floor*0.01);
  let placed=0;
  for(let i=0;i<rooms.length-1&&placed<count;i++){
    if(bossFloor&&i===rooms.length-2){
      const room=rooms[i];
      const x=rand(room.x+1,room.x+room.w-2);
      const y=rand(room.y+1,room.y+room.h-2);
      entities.push(createEnemy('demon',x,y));
      placed++;continue;
    }
    if(Math.random()<spawnChance||placed+1>=count){
      const ri=Math.random()<0.5?rand(1,rooms.length-2):i;
      const room=rooms[ri];
      if(!room)continue;
      const x=rand(room.x+1,room.x+room.w-2);
      const y=rand(room.y+1,room.y+room.h-2);
      let type;
      const avail=['slime','bat','skeleton','ghost'];
      if(floor>=7)avail.push('lich');
      if(floor>=4)avail.push('mimic');
      if(floor>=5)avail.push('naiwa');
      if(floor>=10)avail.push('nailong');
      type=choose(avail);
      if(floor<=2&&(type==='skeleton'||type==='ghost'||type==='mimic'))type='slime';
      if(floor<=4&&(type==='ghost'||type==='lich'))type='bat';
      if(type==='naiwa'&&floor<5)type='slime';
      if(type==='nailong'&&floor<10)type='slime';
      const isElite=floor>=5&&Math.random()<0.2+floor*0.01;
      entities.push(createEnemy(type,x,y,isElite));
      placed++;
    }
  }
  if(placed<count&&rooms.length>1){
    const room=rooms[rand(1,rooms.length-1)];
    const x=rand(room.x+1,room.x+room.w-2);
    const y=rand(room.y+1,room.y+room.h-2);
    entities.push(createEnemy('slime',x,y));
  }
  // ★ 隐藏Boss：堕天使 - 第10层后、读完解锁剧情、每层3%概率出现
  if(floor>=10&&fallenAngelUnlocked&&!bossDefeated&&Math.random()<0.03){
    const room=rooms[rand(1,rooms.length-1)];
    const x=rand(room.x+1,room.x+room.w-2);
    const y=rand(room.y+1,room.y+room.h-2);
    entities.push(createEnemy('fallenAngel',x,y));
    addMsg('✦ 一道刺目的金光划破黑暗...堕天使降临！✦','warning');
    bossWarning=true;
  }
}

// ★ 调试：在玩家附近召唤怪物（优先视野内空地，找不到则放弃） ★
function summonEnemy(type){
  if(!player||gameOver)return false;
  for(let r=1;r<=4;r++){
    const offsets=[];
    for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){
      if(dx===0&&dy===0)continue;
      if(Math.abs(dx)+Math.abs(dy)!==r)continue;
      offsets.push([dx,dy]);
    }
    offsets.sort(()=>Math.random()-0.5);
    for(const [dx,dy] of offsets){
      const nx=player.x+dx,ny=player.y+dy;
      if(nx<0||nx>=MAP_W||ny<0||ny>=MAP_H)continue;
      if(map[ny][nx]===T_WALL)continue;
      if(!visible[ny]||!visible[ny][nx])continue;
      let occupied=false;
      for(const en of entities){if(!en.dead&&en.x===nx&&en.y===ny){occupied=true;break}}
      if(occupied)continue;
      const e=createEnemy(type,nx,ny,false);
      entities.push(e);
      const cx=nx*TILE+TILE/2,cy=ny*TILE+TILE/2;
      spawnParticles(cx,cy,'#ce93d8',14,{spread:1.5});
      addFloatText(cx,cy-TILE/2,'召唤!','#ce93d8');
      addMsg(`[调试] 召唤了${enemyName(type)}（HP ${e.hp} / ATK ${e.atk}）`,'special');
      return true;
    }
  }
  addMsg('[调试] 附近没有可召唤的空位','warning');
  return false;
}

let bossWarning=false;

function spawnItems(){
  const potCount=rand(1,2);
  for(let i=0;i<potCount;i++){
    const ri=rand(1,rooms.length-1);
    const room=rooms[ri];
    const x=rand(room.x+1,room.x+room.w-2);
    const y=rand(room.y+1,room.y+room.h-2);
    items.push({x,y,type:'hpotion',name:'生命药剂'});
  }
  if(Math.random()<0.5){
    const ri=rand(1,rooms.length-1);
    const room=rooms[ri];
    const x=rand(room.x+1,room.x+room.w-2);
    const y=rand(room.y+1,room.y+room.h-2);
    items.push({x,y,type:'spotion',name:'力量药剂'});
  }
  if(floor>=2&&Math.random()<0.3){
    const ri=rand(1,rooms.length-1);
    const room=rooms[ri];
    const x=rand(room.x+1,room.x+room.w-2);
    const y=rand(room.y+1,room.y+room.h-2);
    items.push({x,y,type:'spotion',name:'力量药剂'});
  }
  const gc=rand(2,6);
  for(let i=0;i<gc;i++){
    const ri=rand(1,rooms.length-1);
    const room=rooms[ri];
    const x=rand(room.x+1,room.x+room.w-2);
    const y=rand(room.y+1,room.y+room.h-2);
    const val=5+rand(0,10);
    items.push({x,y,type:'gold',name:'金币',value:val});
  }
  if(Math.random()<0.25){
    const ri=rand(1,rooms.length-1);
    const room=rooms[ri];
    const x=rand(room.x+1,room.x+room.w-2);
    const y=rand(room.y+1,room.y+room.h-2);
    items.push({x,y,type:'scroll',name:'神秘卷轴'});
  }
  if(floor>=3&&Math.random()<0.35){
    const ri=rand(1,rooms.length-1);
    const room=rooms[ri];
    const x=rand(room.x+1,room.x+room.w-2);
    const y=rand(room.y+1,room.y+room.h-2);
    items.push({x,y,type:'bomb',name:'炸弹'});
  }
  if(floor>=2&&Math.random()<0.0){
    const ri=rand(1,rooms.length-1);
    const room=rooms[ri];
    const x=rand(room.x+1,room.x+room.w-2);
    const y=rand(room.y+1,room.y+room.h-2);
    items.push({x,y,type:'mapscroll',name:'地图卷轴'});
  }
  if(floor>=5&&Math.random()<0.2){
    const ri=rand(1,rooms.length-1);
    const room=rooms[ri];
    const x=rand(room.x+1,room.x+room.w-2);
    const y=rand(room.y+1,room.y+room.h-2);
    items.push({x,y,type:'tpscroll',name:'传送卷轴'});
  }
  // 剧情卷轴：从第2层起有概率出现，拾取后揭示隐藏剧情
  if(floor>=2&&Math.random()<0.4){
    const ri=rand(1,rooms.length-1);
    const room=rooms[ri];
    const x=rand(room.x+1,room.x+room.w-2);
    const y=rand(room.y+1,room.y+room.h-2);
    items.push({x,y,type:'loreScroll',name:'古老卷轴'});
  }
  if(floor>=3&&Math.random()<0.3){
    spawnEquipment();
  }
  spawnSoulGems();
}

function spawnEquipment(){
  const ri=rand(1,rooms.length-1);
  const room=rooms[ri];
  const x=rand(room.x+1,room.x+room.w-2);
  const y=rand(room.y+1,room.y+room.h-2);
  if(Math.random()<0.5){
    const bonus=1+Math.floor(floor/5);
    items.push({x,y,type:'weapon',name:`铁剑+${bonus}`,bonus,equipType:'atk'});
  }else{
    const bonus=1+Math.floor(floor/6);
    items.push({x,y,type:'armor',name:`皮甲+${bonus}`,bonus,equipType:'def'});
  }
}

// ---- Combat ----
function enemyName(t){
  return {slime:'史莱姆',bat:'蝙蝠',skeleton:'骷髅',ghost:'幽灵',demon:'恶魔',lich:'巫妖',mimic:'宝箱怪',fallenAngel:'堕天使·路西菲尔',naiwa:'奶蛙',nailong:'奶龙'}[t]||t;
}

function playerAttack(e, dmgMult){
  const isCrit=Math.random()<0.12;
  const jumpHit=dmgMult&&dmgMult!==1;
  const curseAtkPenalty=floorCurse&&floorCurse.id==='frailty'?3:0;
  const curseDefPenalty=floorCurse&&floorCurse.id==='heaviness'?2:0;
  const effectiveDef=Math.max(0,e.def+curseDefPenalty);
  let dmg=Math.max(1,(player.atk-curseAtkPenalty-effectiveDef+rand(-1,2))*(isCrit?2:1));
  if(jumpHit)dmg=Math.max(1,Math.floor(dmg*dmgMult)); // 跳劈：落地瞬间攻击 → 1.5x
  if(debugInstakill)dmg=e.hp+e.maxHp+1000;
  e.hp-=dmg;e.hitFlash=8;
  const nm=enemyName(e.type);
  screenShake=jumpHit?5:4;
  const cx=e.x*TILE+TILE/2,cy=e.y*TILE+TILE/2;
  spawnParticles(cx,cy,isCrit?'#ffd740':(jumpHit?'#ffb300':'#ff5252'),(isCrit||jumpHit)?12:7,{spread:(isCrit||jumpHit)?1.8:1.2});
  addFloatText(cx,cy-TILE/2,(jumpHit?'跳劈！':'')+(isCrit?'暴击！':'')+'-'+dmg,jumpHit?'#ffd740':(isCrit?'#ffd740':'#ff5252'));
  addMsg(`对${nm}${jumpHit?'跳劈！':''}${isCrit?'暴击！':''}造成 ${dmg} 点伤害！`,'damage');
  if(e.hp<=0){
    e.dead=true;
    spawnParticles(cx,cy,'#ff8a80',14,{spread:1.5});
    addMsg(`${nm}被击败！掉落金币！`,'warning');
    onEnemyKilled(e);
    return true;
  }
  return false;
}

// 箭矢：左键朝光标方向发射（像素级弹道，统一用像素坐标）
function playerRangedAttack(targetWorldPx,targetWorldPy){
  if(gameOver||actionDelay>0)return;
  // CD 检查
  if(arrowCd>0){
    const secLeft=Math.ceil(arrowCd/60*10)/10;
    addMsg(`箭矢冷却中（剩余 ${secLeft} 秒）`,'info');
    return;
  }
  // 起点用视觉位置 player.vx/vy（与 camera/screenToWorld 一致），保证箭从人物身上发出
  const vx=(player.vx!==undefined?player.vx:player.x*TILE)+(player.stutterX||0);
  const vy=(player.vy!==undefined?player.vy:player.y*TILE)+(player.stutterY||0);
  const px=vx+TILE/2, py=vy+TILE/2;
  let dx,dy;
  if(targetWorldPx!==undefined&&targetWorldPy!==undefined){
    dx=targetWorldPx-px; dy=targetWorldPy-py;
  }else{
    const ld=player.lastDir||{dx:0,dy:0}; dx=ld.dx; dy=ld.dy;
  }
  const len=Math.hypot(dx,dy);
  if(len<1)return;
  dx/=len; dy/=len; // 单位方向向量
  // 记录玩家朝向(用于火球术等其它逻辑)
  player.lastDir={dx:dx>0.3?1:dx<-0.3?-1:0,dy:dy>0.3?1:dy<-0.3?-1:0};
  actionDelay=8;
  arrowCd=arrowCdMax;
  const SPD=16; // 每帧飞行 16 像素
  spawnParticles(px+dx*10,py+dy*10,'#ffd740',6,{spread:0.6,gravity:-0.02});
  spawnParticles(px+dx*6,py+dy*6,'#fff176',4,{spread:0.4});
  damageFlash=2;
  screenShake=2;
  addFloatText(px+dx*20,py+dy*20,'🏹','#ffd740');
  // 弹道用像素坐标 fpx/fpy 表示中心位置(从玩家中心出发)
  projectiles.push({
    pixel:true,
    fpx:px+dx*(TILE/2), fpy:py+dy*(TILE/2),
    vx:dx*SPD, vy:dy*SPD,
    dx,dy, // 归一化方向(用于旋转/拖尾)
    life:48, dmg:Math.max(1,Math.floor(player.atk*1.1)), // 攻击力 110%
    fromPlayer:true,
  });
  addMsg('发射箭矢！','info');
  endTurn();
}

// ★ 旋风斩 - 近战范围攻击 + 刀光特效 ★
function playerSpecialAttack(){
  if(gameOver||actionDelay>0)return false;
  actionDelay=10;
  screenShake=8;
  damageFlash=4;
  const px=player.x*TILE+TILE/2,py=player.y*TILE+TILE/2;

  const arcLayers=[
    {color:'#ffffff',count:5,radiusMin:10,radiusMax:22,arcLen:1.4,rotSpeed:0.15,life:26,lineW:4},
    {color:'#42a5f5',count:6,radiusMin:16,radiusMax:30,arcLen:1.2,rotSpeed:0.10,life:24,lineW:5},
    {color:'#1e88e5',count:7,radiusMin:22,radiusMax:40,arcLen:1.0,rotSpeed:0.07,life:22,lineW:4},
    {color:'#90caf9',count:6,radiusMin:28,radiusMax:50,arcLen:0.85,rotSpeed:0.05,life:20,lineW:3},
    {color:'#ffd740',count:4,radiusMin:12,radiusMax:32,arcLen:0.7,rotSpeed:0.12,life:18,lineW:3},
  ];

  for(const layer of arcLayers){
    for(let i=0;i<layer.count;i++){
      const baseAngle=randF(0,Math.PI*2);
      slashEffects.push({
        type:'arc',
        x:px,y:py,
        radius:randF(layer.radiusMin,layer.radiusMax),
        arcLength:layer.arcLen,
        angle:baseAngle,
        rotationSpeed:layer.rotSpeed*(Math.random()<0.5?1:-1),
        life:rand(Math.floor(layer.life*0.8),layer.life),
        maxLife:layer.life,
        color:layer.color,
        lineWidth:layer.lineW,
      });
    }
  }

  const lineColors=['#ffffff','#42a5f5','#90caf9','#e3f2fd'];
  const lineCount=10;
  for(let i=0;i<lineCount;i++){
    const angle=(i/lineCount)*Math.PI*2+randF(-0.15,0.15);
    const len=randF(22,50);
    slashEffects.push({
      type:'line',
      x:px,y:py,
      angle:angle,
      length:len,
      life:rand(14,22),
      maxLife:22,
      color:choose(lineColors),
      width:randF(1.5,3.5),
    });
  }

  const lineCount2=8;
  for(let i=0;i<lineCount2;i++){
    const angle=(i/lineCount2)*Math.PI*2+randF(0.1,0.35);
    const len=randF(18,42);
    slashEffects.push({
      type:'line',
      x:px,y:py,
      angle:angle,
      length:len,
      life:rand(10,18),
      maxLife:18,
      color:choose(['#ffffff','#42a5f5','#1e88e5']),
      width:randF(1,2.5),
    });
  }

  spawnSlashArc(px,py,'#ffffff',20,10,30);
  spawnSlashArc(px,py,'#42a5f5',18,8,26);
  spawnSlashArc(px,py,'#90caf9',14,6,22);
  spawnSlashArc(px,py,'#1e88e5',12,7,24);
  spawnSlashArc(px,py,'#ffd740',8,4,16);

  for(let i=0;i<30;i++){
    const a=randF(0,Math.PI*2);
    const spd=randF(1.5,4);
    particles.push({
      x:px,y:py,
      vx:Math.cos(a)*spd,vy:Math.sin(a)*spd,
      life:randF(10,25),maxLife:25,
      size:rand(2,5),
      color:choose(['#42a5f5','#90caf9','#ffffff','#1e88e5']),
      gravity:0,shrink:true,
    });
  }

  for(let i=0;i<40;i++){
    const a=(i/40)*Math.PI*2;
    const r=randF(12,28);
    particles.push({
      x:px+Math.cos(a)*r,y:py+Math.sin(a)*r,
      vx:Math.cos(a)*randF(0.3,1.2),vy:Math.sin(a)*randF(0.3,1.2),
      life:randF(8,20),maxLife:20,
      size:rand(2,4),
      color:choose(['#42a5f5','#ffffff','#90caf9']),
      gravity:-0.01,shrink:true,
    });
  }

  addFloatText(px,py-20,'⚔ 旋风斩 ⚔','#42a5f5');

  const slashDmg=Math.max(1,Math.floor(player.atk*1.3));
  let hitCount=0;
  for(const e of entities){
    if(e.dead)continue;
    const dx = Math.abs(e.x - player.x);
    const dy = Math.abs(e.y - player.y);
    if(dx <= 1 && dy <= 1){
      let dmg=Math.max(1,slashDmg-e.def+rand(-1,3));
      if(debugInstakill)dmg=e.hp+e.maxHp+1000;
      e.hp-=dmg;e.hitFlash=8;
      const cx=e.x*TILE+TILE/2,cy=e.y*TILE+TILE/2;
      spawnParticles(cx,cy,'#42a5f5',8,{spread:1.2});
      spawnParticles(cx,cy,'#90caf9',5,{spread:0.8});
      spawnParticles(cx,cy,'#ffffff',3,{spread:0.6});
      addFloatText(cx,cy-TILE/2,'-'+dmg,'#42a5f5');
      addMsg(`旋风斩击中${enemyName(e.type)}造成 ${dmg} 点伤害！`,'damage');
      hitCount++;
      if(e.hp<=0){
        e.dead=true;
        spawnParticles(cx,cy,'#ff8a80',14,{spread:1.5});
        addMsg(`${enemyName(e.type)}被旋风斩斩灭！`,'warning');
        onEnemyKilled(e);
      }
    }
  }

  if(hitCount===0){
    addMsg('旋风斩挥出，但没有击中任何敌人','info');
  } else {
    addMsg(`旋风斩横扫！击中 ${hitCount} 个敌人！`,'special');
  }

  cleanupDead();
  updateUI();
  endTurn();
  return true;
}
function updateProjectiles(){
  for(let i=projectiles.length-1;i>=0;i--){
    const p=projectiles[i];
    if(!p.fromPlayer)continue;

    // ===== 像素级弹道(箭矢/右键发射) - 全部用像素坐标 =====
    if(p.pixel){
      p.fpx+=p.vx; p.fpy+=p.vy;
      const cellX=Math.floor(p.fpx/TILE), cellY=Math.floor(p.fpy/TILE);
      p.x=cellX; p.y=cellY;
      p.life--;
      // 撞墙
      if(map[cellY]&&map[cellY][cellX]===T_WALL){
        spawnParticles(p.fpx,p.fpy,'#9e9e9e',5,{spread:0.5});
        projectiles.splice(i,1);continue;
      }
      // 命中敌人(像素距离判定)
      let hit=false;
      for(const e of entities){
        if(e.dead)continue;
        const ecx=e.x*TILE+TILE/2, ecy=e.y*TILE+TILE/2;
        if(Math.hypot(ecx-p.fpx,ecy-p.fpy)<TILE*0.6){
          let dmg=Math.max(1,p.dmg-e.def+rand(-1,1));
          if(debugInstakill)dmg=e.hp+e.maxHp+1000;
          e.hp-=dmg;e.hitFlash=8;
          spawnParticles(ecx,ecy,'#ff5252',7,{spread:1});
          addFloatText(ecx,ecy-TILE/2,'-'+dmg,'#ff5252');
          addMsg(`箭矢击中${enemyName(e.type)}造成 ${dmg} 点伤害！`,'damage');
          screenShake=3;
          if(e.hp<=0){
            e.dead=true;
            spawnParticles(ecx,ecy,'#ff8a80',14,{spread:1.5});
            addMsg(`${enemyName(e.type)}被击败！`,'warning');
            onEnemyKilled(e);
          }
          hit=true;break;
        }
      }
      if(hit){projectiles.splice(i,1);continue;}
      if(p.life<=0){projectiles.splice(i,1);continue;}
      continue;
    }

    // ===== 格子弹道(火球术等) =====
    if(map[p.y]&&map[p.y][p.x]===T_WALL){
      if(p.type==='fireball'){fireballExplosion(p.x,p.y,p.dmg)}
      else if(p.type==='lifedrain'){spawnParticles(p.x*TILE+TILE/2,p.y*TILE+TILE/2,'#ce93d8',5,{spread:0.5})}
      else{spawnParticles(p.x*TILE+TILE/2,p.y*TILE+TILE/2,'#9e9e9e',5,{spread:0.5})}
      projectiles.splice(i,1);continue;
    }
    let hit=false;
    for(const e of entities){
      if(e.dead)continue;
      if(e.x===p.x&&e.y===p.y){
        if(p.type==='fireball'){
          fireballExplosion(p.x,p.y,p.dmg);
          hit=true;break;
        }
        if(p.type==='lifedrain'){
          let dmg=Math.max(1,p.dmg-e.def+rand(-1,1));
          if(debugInstakill)dmg=e.hp+e.maxHp+1000;
          e.hp-=dmg;e.hitFlash=8;
          const cx=e.x*TILE+TILE/2,cy=e.y*TILE+TILE/2;
          spawnParticles(cx,cy,'#ce93d8',7,{spread:1});
          addFloatText(cx,cy-TILE/2,'-'+dmg,'#ce93d8');
          addMsg(`生命汲取击中${enemyName(e.type)}造成 ${dmg} 点伤害！`,'damage');
          const healAmt=Math.floor(dmg*0.5);
          if(healAmt>0){
            player.hp=Math.min(player.maxHp,player.hp+healAmt);
            spawnHealParticles(player.x*TILE+TILE/2,player.y*TILE+TILE/2);
            addFloatText(player.x*TILE+TILE/2,player.y*TILE+TILE/2-12,'+'+healAmt,'#ce93d8');
            addMsg(`汲取生命恢复 ${healAmt} 点！`,'heal');
          }
          screenShake=3;
          if(e.hp<=0){
            e.dead=true;
            spawnParticles(cx,cy,'#ff8a80',14,{spread:1.5});
            addMsg(`${enemyName(e.type)}被生命汲取吞噬！`,'warning');
            onEnemyKilled(e);
          }
          hit=true;break;
        }
        let dmg=Math.max(1,p.dmg-e.def+rand(-1,1));
        if(debugInstakill)dmg=e.hp+e.maxHp+1000;
        e.hp-=dmg;e.hitFlash=8;
        const cx=e.x*TILE+TILE/2,cy=e.y*TILE+TILE/2;
        spawnParticles(cx,cy,'#ff5252',7,{spread:1});
        addFloatText(cx,cy-TILE/2,'-'+dmg,'#ff5252');
        addMsg(`箭矢击中${enemyName(e.type)}造成 ${dmg} 点伤害！`,'damage');
        screenShake=3;
        if(e.hp<=0){
          e.dead=true;
          spawnParticles(cx,cy,'#ff8a80',14,{spread:1.5});
          addMsg(`${enemyName(e.type)}被击败！`,'warning');
          onEnemyKilled(e);
        }
        hit=true;break;
      }
    }
    if(hit){projectiles.splice(i,1);continue;}
    p.life--;
    if(p.life<=0){projectiles.splice(i,1);continue;}
    p.x+=p.dx;p.y+=p.dy;
  }
}
function enemyAttack(e){
  const extraAtk=floorCurse&&floorCurse.id==='bloodlust'?3:0;
  const dmg=Math.max(1,Math.floor(e.atk*0.8)+extraAtk-player.def+rand(-1,1));
  if(debugInvincible){
    addMsg(`[无敌] ${enemyName(e.type)}的攻击被护盾挡下！`,'info');
    updateUI();return;
  }
  player.hp-=dmg;damageFlash=6;screenShake=6;
  const cx=player.x*TILE+TILE/2,cy=player.y*TILE+TILE/2;
  spawnParticles(cx,cy,'#ff5252',6,{spread:1});
  addFloatText(cx,cy-TILE/2,'-'+dmg,'#ff5252');
  addMsg(`${enemyName(e.type)}造成 ${dmg} 点伤害！`,'damage');
  if(player.hp<=0){player.hp=0;gameOver=true;showGameOver()}
  updateUI();
}

function lichRangedAttack(e){
  const cx=e.x*TILE+TILE/2,cy=e.y*TILE+TILE/2;
  spawnParticles(cx,cy,'#e94560',8,{spread:0.8});
  const extraAtk=floorCurse&&floorCurse.id==='bloodlust'?3:0;
  const dmg=Math.max(1,Math.floor(e.atk*0.8)+extraAtk-player.def+rand(-1,2));
  if(debugInvincible){
    addMsg('[无敌] 巫妖的法术被护盾抵消！','info');
    updateUI();return;
  }
  player.hp-=dmg;damageFlash=6;screenShake=5;
  addFloatText(player.x*TILE+TILE/2,player.y*TILE+TILE/2-12,'-'+dmg,'#e94560');
  spawnParticles(player.x*TILE+TILE/2,player.y*TILE+TILE/2,'#e94560',10,{spread:1.2});
  addMsg(`巫妖的法术造成 ${dmg} 点伤害！`,'damage');
  if(player.hp<=0){player.hp=0;gameOver=true;showGameOver();updateUI();return}
  updateUI();
}

// ---- AI ----
function takeEnemyTurns(){
  for(const e of entities){
    if(e.dead)continue;
    if(!visible[e.y]||!visible[e.y][e.x])continue;
    if((e.frozen||0)>0){e.frozen--;continue}
    if(e.attackCd>0){e.attackCd--;continue}
    const d=dist(e.x,e.y,player.x,player.y);
    if(e.ranged&&d>1.5&&d<=e.detectRange){
      lichRangedAttack(e);
      e.attackCd=12;
      continue;
    }
    if(e.ambush&&d<=1.5){
      addMsg(`${enemyName(e.type)}突然现形攻击！`,'warning');
      enemyAttack(e);
      e.attackCd=14;
      continue;
    }
    if(d<=1.5){
      enemyAttack(e);
      e.attackCd=10+rand(0,5);
      continue
    }
    if(d<=e.detectRange){
      const dirs=[
        {dx:0,dy:-1},{dx:0,dy:1},{dx:-1,dy:0},{dx:1,dy:0},
        {dx:-1,dy:-1},{dx:1,dy:-1},{dx:-1,dy:1},{dx:1,dy:1}
      ];
      dirs.sort((a,b)=>dist(e.x+a.dx,e.y+a.dy,player.x,player.y)-dist(e.x+b.dx,e.y+b.dy,player.x,player.y));
      for(const d of dirs){
        const nx=e.x+d.dx,ny=e.y+d.dy;
        if(nx===player.x&&ny===player.y){enemyAttack(e);break}
        if(canMove(nx,ny,e)){
          e.x=nx;e.y=ny;
          for(const item of items){
            if(item.type==='spikes'&&item.x===nx&&item.y===ny){
              const spikeDmg=debugInstakill?(e.hp+e.maxHp+1000):2;
              e.hp-=spikeDmg;e.hitFlash=6;
              spawnParticles(nx*TILE+TILE/2,ny*TILE+TILE/2,'#ff5252',5,{spread:0.8});
              addFloatText(nx*TILE+TILE/2,ny*TILE+TILE/2-8,'-'+spikeDmg,'#ff5252');
              if(e.hp<=0){e.dead=true;addMsg(`${enemyName(e.type)}被尖刺陷阱消灭！`,'warning');onEnemyKilled(e)}
            }
          }
          break
        }
      }
    }else if(Math.random()<0.25){
      const d=choose([{dx:0,dy:-1},{dx:0,dy:1},{dx:-1,dy:0},{dx:1,dy:0}]);
      const nx=e.x+d.dx,ny=e.y+d.dy;
      if(canMove(nx,ny,e)){e.x=nx;e.y=ny}
    }
  }
}

function canMove(x,y,e){
  if(x<0||x>=MAP_W||y<0||y>=MAP_H)return false;
  if(map[y][x]===T_WALL)return false;
  for(const en of entities)if(en!==e&&!en.dead&&en.x===x&&en.y===y)return false;
  if(player&&player.x===x&&player.y===y)return false;
  return true;
}

function canPlayerMove(x,y){
  return !(x<0||x>=MAP_W||y<0||y>=MAP_H)&&map[y][x]!==T_WALL;
}

// ---- Player Actions ----
