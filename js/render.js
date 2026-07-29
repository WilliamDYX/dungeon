// render.js - 渲染主函数（地图、实体、特效、HUD绘制）

// ---- Rendering ----
function render(){
  if(screenShake>0)screenShake*=0.85;
  if(screenShake<0.3)screenShake=0;
  if(damageFlash>0)damageFlash--;

  const shakeX=screenShake>0?rand(-1,1)*Math.ceil(screenShake):0;
  const shakeY=screenShake>0?rand(-1,1)*Math.ceil(screenShake):0;

  const bgGrad=ctx.createRadialGradient(400,320,0,400,320,500);
  bgGrad.addColorStop(0,'#0d0d14');
  bgGrad.addColorStop(1,'#050508');
  ctx.fillStyle=bgGrad;
  ctx.fillRect(0,0,canvas.width,canvas.height);

  if(player&&!gameOver){
    const targetX=player.x*TILE,targetY=player.y*TILE;
    const streak=player.moveStreak||0;
    const lerpSpeed=streak>3?0.13:0.16;
    player.vx+=(targetX-player.vx)*lerpSpeed;
    player.vy+=(targetY-player.vy)*lerpSpeed;
    player.stutterX=(player.stutterX||0)*0.85;
    player.stutterY=(player.stutterY||0)*0.85;
    player.moveStreak=streak*0.92;
  }

  const viewOriginX=clamp(player.vx+(player.stutterX||0)+TILE/2-canvas.width/2,0,MAP_W*TILE-canvas.width);
  const viewOriginY=clamp(player.vy+(player.stutterY||0)+TILE/2-canvas.height/2,0,MAP_H*TILE-canvas.height);
  const vpL=Math.floor(viewOriginX/TILE);
  const vpT=Math.floor(viewOriginY/TILE);
  const vpOffX=viewOriginX-vpL*TILE;
  const vpOffY=viewOriginY-vpT*TILE;

  ctx.save();
  ctx.translate(-vpOffX+shakeX,-vpOffY+shakeY);

  const lCan=document.createElement('canvas');
  lCan.width=canvas.width;lCan.height=canvas.height;
  const lctx=lCan.getContext('2d');

  lctx.fillStyle='rgba(0,0,0,0.85)';
  lctx.fillRect(0,0,canvas.width,canvas.height);

  lctx.globalCompositeOperation='destination-out';

  const pxS=player.vx+TILE/2-viewOriginX;
  const pyS=player.vy+TILE/2-viewOriginY;
  const grad=lctx.createRadialGradient(pxS,pyS,0,pxS,pyS,7*TILE);
  grad.addColorStop(0,'rgba(0,0,0,1)');
  grad.addColorStop(0.35,'rgba(0,0,0,1)');
  grad.addColorStop(0.65,'rgba(0,0,0,0.5)');
  grad.addColorStop(1,'rgba(0,0,0,0)');
  lctx.fillStyle=grad;
  lctx.fillRect(0,0,canvas.width,canvas.height);

  for(const item of items){
    if(item.type!=='torch'&&item.type!=='chandelier'||!visible[item.y]||!visible[item.y][item.x])continue;
    const ix=(item.x-vpL)*TILE+TILE/2-vpOffX,iy=(item.y-vpT)*TILE+TILE/2-vpOffY;
    if(ix<-TILE||ix>canvas.width+TILE||iy<-TILE||iy>canvas.height+TILE)continue;
    const radius=item.type==='chandelier'?6*TILE:4*TILE;
    const flicker=0.85+Math.sin(animTime*5+item.x*7+item.y*13)*0.15;
    const tg=lctx.createRadialGradient(ix,iy,0,ix,iy,radius*flicker);
    tg.addColorStop(0,'rgba(0,0,0,0.6)');
    tg.addColorStop(0.5,'rgba(0,0,0,0.15)');
    tg.addColorStop(1,'rgba(0,0,0,0)');
    lctx.fillStyle=tg;
    lctx.fillRect(0,0,canvas.width,canvas.height);
  }

  lctx.globalCompositeOperation='source-over';

  for(let vy=vpT;vy<vpT+ROWS+1;vy++){
    for(let vx=vpL;vx<vpL+COLS+1;vx++){
      if(vy>=MAP_H||vx>=MAP_W)continue;
      const sx=(vx-vpL)*TILE,sy=(vy-vpT)*TILE;
      if(!explored[vy][vx])continue;
      const isVis=visible[vy][vx];
      ctx.globalAlpha=isVis?1:0.2;
      const tile=map[vy][vx];
      let spr;
      if(tile===T_WALL)spr=choose([SPR.wall,SPR.wall2,SPR.wall3,SPR.wall4]);
      else if(tile===T_STAIRS)spr=SPR.stairs;
      else if(tile===T_CARPET)spr=SPR.carpet;
      else if(tile===T_WATER){spr=SPR.water;ctx.fillStyle=`rgba(100,180,255,${0.04+Math.sin(animTime*2+vx*0.5+vy*0.7)*0.03})`;ctx.fillRect(sx,sy,TILE,TILE);}
      else spr=[SPR.floor,SPR.floor2,SPR.floor3,SPR.floor4][(vx*7+vy*13)%4];
      ctx.drawImage(spr,sx,sy);
      ctx.globalAlpha=1;
    }
  }

  for(const item of items){
    if(item.type==='torch'||item.type==='barrel')continue;
    if(!visible[item.y]||!visible[item.y][item.x])continue;
    const sx=(item.x-vpL)*TILE,sy=(item.y-vpT)*TILE;
    let spr;
    switch(item.type){
      case 'hpotion':spr=SPR.hPotion;break;
      case 'spotion':spr=SPR.sPotion;break;
      case 'gold':spr=SPR.gold;break;
      case 'scroll':spr=SPR.scroll;break;
      case 'soulgem':spr=SPR.soulGem;break;
      case 'bomb':spr=SPR.bomb;break;
      case 'mapscroll':spr=SPR.mapScroll;break;
      case 'tpscroll':spr=SPR.teleportScroll;break;
      case 'weapon':spr=SPR.equipSword;break;
      case 'armor':spr=SPR.equipShield;break;
      default:continue;
    }
    ctx.drawImage(spr,sx,sy-2);
    ctx.fillStyle='rgba(255,255,200,0.05)';
    ctx.fillRect(sx-2,sy-4,TILE+4,TILE+4);
  }

  for(const e of entities){
    if(e.dead||!visible[e.y]||!visible[e.y][e.x])continue;
    const sx=(e.x-vpL)*TILE,sy=(e.y-vpT)*TILE;
    if(e.hitFlash>0&&e.hitFlash%2===0){
      ctx.globalAlpha=0.5;ctx.fillStyle='#fff';ctx.fillRect(sx,sy,TILE,TILE);ctx.globalAlpha=1;
    }
    let spr;
    switch(e.type){
      case 'slime':spr=SPR.slime;break;
      case 'bat':spr=SPR.bat;break;
      case 'skeleton':spr=SPR.skeleton;break;
      case 'ghost':spr=SPR.ghost;break;
      case 'lich':spr=SPR.lich;break;
      case 'mimic':spr=SPR.mimic;break;
      case 'demon':spr=SPR.demon;break;
      default:spr=SPR.slime;
    }
    ctx.drawImage(spr,sx,sy);
    if(e.elite){
      ctx.strokeStyle=`rgba(255,215,0,${0.4+Math.sin(animTime*3+e.x+e.y)*0.3})`;
      ctx.lineWidth=2;ctx.strokeRect(sx-1,sy-1,TILE+2,TILE+2);
      ctx.strokeStyle='rgba(255,255,200,0.15)';
      ctx.lineWidth=1;ctx.strokeRect(sx,sy,TILE,TILE);
    }
    if(e.hp<e.maxHp){
      const bw=TILE-8,bh=4,bx=sx+4,by=sy-6;
      ctx.fillStyle='rgba(0,0,0,0.6)';ctx.fillRect(bx-1,by-1,bw+2,bh+2);
      ctx.fillStyle='#333';ctx.fillRect(bx,by,bw,bh);
      ctx.fillStyle=e.hp/e.maxHp>0.5?'#66bb6a':'#ff5252';
      ctx.fillRect(bx,by,bw*(e.hp/e.maxHp),bh);
    }
  }

  for(const item of items){
    if(item.type!=='torch'&&item.type!=='barrel'&&item.type!=='statue'&&item.type!=='altar'&&item.type!=='spikes'&&item.type!=='bookshelf'&&item.type!=='cage'&&item.type!=='anvil'&&item.type!=='cobweb'&&item.type!=='marble'&&item.type!=='blood'&&item.type!=='candle'&&item.type!=='bones'&&item.type!=='mushroom'&&item.type!=='pillar'&&item.type!=='urn'&&item.type!=='chandelier'&&item.type!=='wallChain'&&item.type!=='painting')continue;
    if(!visible[item.y]||!visible[item.y][item.x])continue;
    const sx=(item.x-vpL)*TILE,sy=(item.y-vpT)*TILE;
    if(item.type==='torch'){
      ctx.drawImage(SPR.torch,sx,sy);
      const flicker=0.85+Math.sin(animTime*5+item.x*7+item.y*13)*0.15;
      const tg=ctx.createRadialGradient(sx+TILE/2,sy+TILE/2,0,sx+TILE/2,sy+TILE/2,3*TILE*flicker);
      tg.addColorStop(0,'rgba(255,180,50,0.08)');
      tg.addColorStop(1,'rgba(255,180,50,0)');
      ctx.fillStyle=tg;ctx.fillRect(sx-3*TILE,sy-3*TILE,6*TILE,6*TILE);
    }else if(item.type==='barrel'){
      ctx.drawImage(SPR.barrel,sx,sy);
    }else if(item.type==='statue'){
      ctx.drawImage(SPR.statue,sx,sy-2);
      ctx.fillStyle='rgba(150,150,170,0.03)';
      ctx.fillRect(sx-2,sy-4,TILE+4,TILE+4);
    }else if(item.type==='altar'){
      if(item.uses<=0){
        ctx.drawImage(SPR.altarDepleted,sx,sy);
      }else if(item.cursed){
        ctx.drawImage(SPR.altarCursed,sx,sy);
        const glow=0.5+Math.sin(animTime*2+item.x*3+item.y*7)*0.5;
        const tg=ctx.createRadialGradient(sx+TILE/2,sy+TILE/2,0,sx+TILE/2,sy+TILE/2,2.5*TILE);
        tg.addColorStop(0,`rgba(255,50,50,${glow*0.1})`);
        tg.addColorStop(1,'rgba(255,50,50,0)');
        ctx.fillStyle=tg;ctx.fillRect(sx-3*TILE,sy-3*TILE,6*TILE,6*TILE);
      }else{
        ctx.drawImage(SPR.altar,sx,sy);
        const glow=0.5+Math.sin(animTime*2+item.x*3+item.y*7)*0.5;
        const tg=ctx.createRadialGradient(sx+TILE/2,sy+TILE/2,0,sx+TILE/2,sy+TILE/2,2.5*TILE);
        tg.addColorStop(0,`rgba(255,215,64,${glow*0.1})`);
        tg.addColorStop(1,'rgba(255,215,64,0)');
        ctx.fillStyle=tg;ctx.fillRect(sx-3*TILE,sy-3*TILE,6*TILE,6*TILE);
      }
    }else if(item.type==='spikes'){
      ctx.drawImage(SPR.spikes,sx,sy);
    }else if(item.type==='bookshelf'){
      ctx.drawImage(SPR.bookshelf,sx,sy-4);
    }else if(item.type==='cage'){
      ctx.drawImage(SPR.cage,sx,sy-4);
    }else if(item.type==='anvil'){
      ctx.drawImage(SPR.anvil,sx,sy-2);
    }else if(item.type==='cobweb'){
      ctx.drawImage(SPR.cobweb,sx,sy);
    }else if(item.type==='marble'){
      ctx.drawImage(SPR.marble,sx,sy);
    }else if(item.type==='blood'){
      ctx.drawImage(SPR.bloodFloor,sx,sy);
    }else if(item.type==='candle'){
      ctx.drawImage(SPR.candle,sx,sy);
      const flicker=0.9+Math.sin(animTime*6+item.x*5+item.y*11)*0.1;
      const tg=ctx.createRadialGradient(sx+TILE/2,sy+TILE/2,0,sx+TILE/2,sy+TILE/2,TILE*1.5*flicker);
      tg.addColorStop(0,'rgba(255,200,100,0.04)');
      tg.addColorStop(1,'rgba(255,200,100,0)');
      ctx.fillStyle=tg;ctx.fillRect(sx-TILE,sy-TILE,3*TILE,3*TILE);
    }else if(item.type==='bones'){
      ctx.drawImage(SPR.bones,sx,sy);
    }else if(item.type==='mushroom'){
      ctx.drawImage(SPR.mushroom,sx,sy);
      const glow=0.5+Math.sin(animTime*1.5+item.x*4+item.y*9)*0.5;
      const tg=ctx.createRadialGradient(sx+TILE/2,sy+TILE/2,0,sx+TILE/2,sy+TILE/2,TILE*1.5);
      tg.addColorStop(0,`rgba(206,147,216,${glow*0.06})`);
      tg.addColorStop(1,'rgba(206,147,216,0)');
      ctx.fillStyle=tg;ctx.fillRect(sx-TILE*2,sy-TILE*2,4*TILE,4*TILE);
    }else if(item.type==='pillar'){
      ctx.drawImage(SPR.pillar,sx,sy);
    }else if(item.type==='urn'){
      ctx.drawImage(SPR.urn,sx,sy);
    }else if(item.type==='chandelier'){
      ctx.drawImage(SPR.chandelier,sx,sy-6);
      const flicker=0.9+Math.sin(animTime*4+item.x*7+item.y*13)*0.1;
      const tg=ctx.createRadialGradient(sx+TILE/2,sy+TILE-4,0,sx+TILE/2,sy+TILE-4,2.5*TILE*flicker);
      tg.addColorStop(0,'rgba(255,200,100,0.07)');
      tg.addColorStop(1,'rgba(255,200,100,0)');
      ctx.fillStyle=tg;ctx.fillRect(sx-3*TILE,sy-3*TILE,6*TILE,6*TILE);
    }else if(item.type==='wallChain'){
      ctx.drawImage(SPR.wallChain,sx,sy);
    }else if(item.type==='painting'){
      ctx.drawImage(SPR.painting,sx,sy);
    }
  }

  for(const npc of npcs){
    if(!visible[npc.y]||!visible[npc.y][npc.x])continue;
    const sx=(npc.x-vpL)*TILE,sy=(npc.y-vpT)*TILE;
    let spr;
    switch(npc.type){
      case 'weaponsmith':spr=SPR.npcWeapon;break;
      case 'staffmaster':spr=SPR.npcStaff;break;
      case 'skillmaster':spr=SPR.npcSkill;break;
      case 'healer':spr=SPR.npcHealer;break;
      case 'enchanter':spr=SPR.npcEnchanter;break;
      default:continue;
    }
    ctx.drawImage(spr,sx,sy);
    ctx.fillStyle='rgba(0,0,0,0.6)';
    ctx.fillRect(sx+2,sy-12,TILE-4,10);
    ctx.fillStyle='#ffd740';
    ctx.font='8px monospace';
    ctx.textAlign='center';
    const npcNames={weaponsmith:'武器商',staffmaster:'法杖商',skillmaster:'技能商',healer:'祭司',enchanter:'附魔师'};
    ctx.fillText(npcNames[npc.type]||'商人',sx+TILE/2,sy-4);
    if(Math.abs(npc.x-player.x)<=1&&Math.abs(npc.y-player.y)<=1){
      ctx.fillStyle='rgba(255,215,64,0.3)';
      ctx.fillRect(sx-2,sy-2,TILE+4,TILE+4);
      ctx.fillStyle='#ffd740';
      ctx.font='bold 9px monospace';
      ctx.fillText('[E]',sx+TILE/2,sy+TILE+10);
    }
  }

  if(player&&!gameOver){
    const drawX=player.vx+(player.stutterX||0);
    const drawY=player.vy+(player.stutterY||0);
    const sx=drawX-(vpL*TILE),sy=drawY-(vpT*TILE);
    ctx.drawImage(SPR.player,sx,sy);
    ctx.fillStyle='rgba(79,195,247,0.05)';
    ctx.fillRect(sx-4,sy-4,TILE+8,TILE+8);

    const pcx=sx+TILE/2;
    const pcy=sy+TILE/2;

    for(const s of slashEffects){
      const alpha=clamp(s.life/s.maxLife,0,1);
      if(alpha<=0)continue;
      ctx.globalAlpha=alpha*0.9;

      if(s.type==='arc'){
        const startA=s.angle-s.arcLength/2;
        const endA=s.angle+s.arcLength/2;
        ctx.beginPath();
        ctx.arc(pcx,pcy,s.radius,startA,endA);
        ctx.strokeStyle=s.color;
        ctx.lineWidth=s.lineWidth*(0.7+alpha*0.3);
        ctx.lineCap='round';
        ctx.shadowColor=s.color;
        ctx.shadowBlur=8*alpha;
        ctx.stroke();
        ctx.shadowBlur=0;

        if(s.lineWidth>2){
          ctx.beginPath();
          ctx.arc(pcx,pcy,s.radius,startA,endA);
          ctx.strokeStyle='rgba(255,255,255,'+(alpha*0.5)+')';
          ctx.lineWidth=Math.max(0.5,s.lineWidth*0.4);
          ctx.stroke();
        }
      }else if(s.type==='line'){
        ctx.save();
        ctx.translate(pcx,pcy);
        ctx.rotate(s.angle);
        const grad=ctx.createLinearGradient(0,0,s.length,0);
        grad.addColorStop(0,'rgba(255,255,255,'+(alpha*0.9)+')');
        grad.addColorStop(0.15, hexToRgba(s.color, alpha * 0.85));
        grad.addColorStop(0.5,s.color);
        grad.addColorStop(1,'rgba(0,0,0,0)');
        ctx.strokeStyle=grad;
        ctx.lineWidth=s.width*alpha;
        ctx.lineCap='round';
        ctx.shadowColor=s.color;
        ctx.shadowBlur=6*alpha;
        ctx.beginPath();
        ctx.moveTo(4,0);
        ctx.lineTo(s.length,0);
        ctx.stroke();
        ctx.shadowBlur=0;

        ctx.fillStyle='rgba(255,255,255,'+(alpha*0.7)+')';
        ctx.beginPath();
        ctx.arc(s.length*0.3,0,Math.max(0.5,s.width*0.6),0,Math.PI*2);
        ctx.fill();
        ctx.restore();
      }
    }
    ctx.globalAlpha=1;
    ctx.shadowBlur=0;
  }

  for(const p of particles){
    const alpha=clamp(p.life/p.maxLife,0,1);
    ctx.globalAlpha=alpha*0.8;
    ctx.fillStyle=p.color;
    ctx.fillRect(p.x-(vpL*TILE),p.y-(vpT*TILE),Math.max(0.5,p.size),Math.max(0.5,p.size));
  }
  ctx.globalAlpha=1;

  for(const f of floatTexts){
    const alpha=clamp(f.life/45,0,1);
    ctx.globalAlpha=alpha;
    ctx.fillStyle=f.color;
    ctx.font='bold 12px monospace';
    ctx.textAlign='center';
    ctx.fillText(f.text,f.x-(vpL*TILE),f.y-(vpT*TILE));
  }
  ctx.globalAlpha=1;

  for(const p of projectiles){
    if(!p.fromPlayer)continue;
    if(!visible[p.y]||!visible[p.y][p.x])continue;
    const sx=(p.x-vpL)*TILE,sy=(p.y-vpT)*TILE;
    if(p.type==='fireball'){
      const cx=sx+TILE/2,cy=sy+TILE/2;
      const glowGrad=ctx.createRadialGradient(cx,cy,0,cx,cy,TILE);
      glowGrad.addColorStop(0,'rgba(255,100,0,0.35)');
      glowGrad.addColorStop(0.5,'rgba(255,50,0,0.15)');
      glowGrad.addColorStop(1,'rgba(255,0,0,0)');
      ctx.fillStyle=glowGrad;ctx.fillRect(sx-TILE,sy-TILE,TILE*3,TILE*3);
      for(let t=0;t<3;t++){
        ctx.fillStyle=`rgba(255,${80-t*20},0,${0.2-t*0.05})`;
        const tx=sx+8-TILE*p.dx*(t+1),ty=sy+8+TILE*0.1-TILE*p.dy*(t+1);
        ctx.fillRect(tx,ty,16,16);
      }
      ctx.drawImage(SPR.fireball,sx,sy);
      continue;
    }
    const cx=sx+TILE/2,cy=sy+TILE/2;
    const angle=Math.atan2(p.dy,p.dx);
    const glowGrad=ctx.createRadialGradient(cx,cy,0,cx,cy,TILE);
    glowGrad.addColorStop(0,'rgba(255,200,50,0.25)');
    glowGrad.addColorStop(1,'rgba(255,200,50,0)');
    ctx.fillStyle=glowGrad;ctx.fillRect(sx-TILE,sy-TILE,TILE*3,TILE*3);
    for(let t=0;t<3;t++){
      ctx.fillStyle=`rgba(255,200,50,${0.25-t*0.07})`;
      const s2=5-t;
      ctx.fillRect(cx-s2/2-TILE*p.dx*(t+1),cy-s2/2-TILE*p.dy*(t+1),s2,s2);
    }
    ctx.save();ctx.translate(cx,cy);ctx.rotate(angle);
    ctx.drawImage(SPR.arrow,-TILE/2,-TILE/2);
    ctx.restore();
  }

  ctx.restore();
  ctx.drawImage(lCan,0,0);

  if(floor>=3){
    const fogIntensity=Math.min(0.06,floor*0.008);
    const fogY=Math.sin(animTime*0.3)*8;
    const fogGrad=ctx.createLinearGradient(0,canvas.height-40+fogY,0,canvas.height-80+fogY);
    fogGrad.addColorStop(0,'rgba(100,120,140,0)');
    fogGrad.addColorStop(1,`rgba(100,120,140,${fogIntensity})`);
    ctx.fillStyle=fogGrad;
    ctx.fillRect(0,canvas.height-120,canvas.width,120);
  }

  if(damageFlash>0){
    ctx.fillStyle=`rgba(255,0,0,${damageFlash*0.025})`;
    ctx.fillRect(0,0,canvas.width,canvas.height);
  }

  if(bossWarning&&floor%5===0&&!gameOver){
    const pulse=0.5+Math.sin(animTime*3)*0.5;
    ctx.fillStyle=`rgba(255,0,0,${pulse*0.08})`;
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle=`rgba(255,50,50,${pulse*0.6})`;
    ctx.font='bold 20px monospace';
    ctx.textAlign='center';
    ctx.fillText('⚡ BOSS 降临 ⚡',canvas.width/2,66);
  }

  if(floorTitleTimer>0){
    floorTitleTimer--;
    const alpha=floorTitleTimer>100?1:floorTitleTimer/100;
    const name=getFloorName(floor);
    ctx.fillStyle=`rgba(255,215,64,${alpha*0.8})`;
    ctx.font='bold 18px monospace';
    ctx.textAlign='center';
    ctx.fillText(`┏ ${name} ┓`,canvas.width/2,96);
    ctx.fillStyle=`rgba(180,180,200,${alpha*0.4})`;
    ctx.font='12px monospace';
    ctx.fillText(`第 ${floor} 层`,canvas.width/2,118);
  }

  // ★★★ HUD绘制（含冷却图标） ★★★
  ctx.save();
  const H=50;
  ctx.fillStyle='rgba(8,8,16,0.85)';
  ctx.fillRect(0,0,canvas.width,H);
  ctx.fillStyle='rgba(50,50,70,0.3)';
  ctx.fillRect(0,H-1,canvas.width,1);

  ctx.textBaseline='middle';
  const clr=(p)=>p>60?'#43a047':p>30?'#ffa726':'#e53935';
  // 放大的血条
  const hpBarX=14, hpBarY=14, hpBarW=150, hpBarH=22;
  ctx.fillStyle='#1a1a28';
  ctx.fillRect(hpBarX,hpBarY,hpBarW,hpBarH);
  ctx.fillStyle=clr(hud.hpPct);
  ctx.fillRect(hpBarX,hpBarY,Math.max(0,hud.hpPct*(hpBarW/100)),hpBarH);
  ctx.fillStyle='rgba(255,255,255,0.12)';
  ctx.fillRect(hpBarX,hpBarY,Math.max(0,hud.hpPct*(hpBarW/100)),6);
  ctx.strokeStyle='rgba(255,255,255,0.2)';
  ctx.lineWidth=1;
  ctx.strokeRect(hpBarX,hpBarY,hpBarW,hpBarH);
  // HP文字（放大）
  ctx.fillStyle='#c8c8d0';
  ctx.font='bold 13px monospace';
  ctx.textAlign='left';
  ctx.fillText(`\u2665 ${hud.hp}/${hud.maxHp}`,hpBarX+hpBarW+10,hpBarY+hpBarH/2);
  // 等级（放大，独立位置，避免与CD图标重叠）
  ctx.fillStyle='#ffd740';
  ctx.font='bold 14px monospace';
  ctx.fillText(`Lv ${hud.level}`,320,hpBarY+hpBarH/2);

  // ★★★ 绘制技能冷却图标（右上角 - 等级右侧，不再遮盖等级） ★★★
  // 火球术CD图标
  if(playerSkills.fireball){
    drawCooldownIcon(420, 11, 30, 28, fireballCd, fireballCdMax, '#ff6f00', '🔥', 'R');
  }
  // 治愈术CD图标
  if(playerSkills.heal){
    drawCooldownIcon(456, 11, 30, 28, healCd, healCdMax, '#66bb6a', '✚', 'T');
  }

  const stats=[
    {l:'\u2302',v:hud.floor},{l:'\u2694',v:hud.kills},
    {l:'ATK',v:hud.atk},{l:'DEF',v:hud.def},
    {l:'G',v:hud.gold},{l:'\uD83D\uDCA3',v:hud.bombs},
  ];
  ctx.textAlign='center';
  let sx2=canvas.width-20;
  for(let i=stats.length-1;i>=0;i--){
    const s=stats[i];
    ctx.fillStyle='#6a6a7a';
    ctx.font='10px monospace';
    ctx.fillText(s.l,sx2,16);
    ctx.fillStyle='#e0e0e8';
    ctx.font='bold 13px monospace';
    ctx.fillText(s.v,sx2,32);
    sx2-=64;
  }
  if(hud.curse){
    ctx.textAlign='center';
    ctx.fillStyle='#ef5350';
    ctx.font='12px monospace';
    ctx.fillText(hud.curse,canvas.width/2,30);
  }
  ctx.restore();
}
