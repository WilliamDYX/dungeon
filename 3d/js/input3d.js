// input3d.js - UI状态更新与全局键盘/鼠标输入处理（3D版）
// 复用原版游戏逻辑，替换 updateUI 渲染目标 + 移除 2D 画布射箭，改用相机旋转

// ---- UI（指向 3D HUD） ----
function updateUI(){
  if(!player) return;
  const ratio = player.hp / player.maxHp;
  hud.hp = player.hp; hud.maxHp = player.maxHp;
  hud.hpPct = Math.max(0, ratio * 100);
  hud.floor = floor; hud.kills = kills;
  hud.atk = player.atk; hud.def = player.def;
  hud.level = player.level; hud.gold = player.gold;
  hud.bombs = player.bombs || 0;
  hud.curse = floorCurse ? ('咒: ' + floorCurse.name) : '';
  updateHUD3D();
}

// ---- WASD 相对相机朝向的格子移动 ----
function moveByCameraDir(forward, right){
  if(gameOver || actionDelay > 0) return;
  // 相机朝向 3D 方向：forward = (-sin(yaw), 0, -cos(yaw))，映射到 tile（player.x→X, player.y→Z）
  const yaw = cameraYaw;
  const fwdX = -Math.sin(yaw) * forward + Math.cos(yaw) * right;
  const fwdY = -Math.cos(yaw) * forward - Math.sin(yaw) * right;
  // 四舍五入到格子方向
  let dx = 0, dy = 0;
  if(Math.abs(fwdX) > Math.abs(fwdY)){
    dx = fwdX > 0 ? 1 : -1;
  } else {
    dy = fwdY > 0 ? 1 : -1;
  }
  movePlayer(dx, dy);
}

// ---- 左键近战攻击：朝准星方向攻击范围内的敌人 ----
// 跳跃中或落地瞬间攻击 → 跳劈暴击（1.5x 伤害，由 playerAttack 的 dmgMult 处理）
const MELEE_REACH = 2.9;  // 攻击距离（世界单位，约 1.45 格）
function meleeAttackTowardCam(){
  if(gameOver || meleeCd > 0) return;
  meleeCd = 8;
  const fx = -Math.sin(cameraYaw), fz = -Math.cos(cameraYaw);
  const pwx = player.x * CELL, pwz = player.y * CELL;
  let best = null, bestScore = Infinity;
  for(const e of entities){
    if(e.dead) continue;
    const dx = e.x * CELL - pwx, dz = e.y * CELL - pwz;
    const d = Math.hypot(dx, dz);
    if(d > MELEE_REACH || d < 1e-4) continue;
    const dot = (dx * fx + dz * fz) / d;
    if(dot < 0.35) continue;   // 需大致在正前方
    const score = d / (0.2 + dot);
    if(score < bestScore){ bestScore = score; best = e; }
  }
  const swingAngle = Math.atan2(-Math.cos(cameraYaw), -Math.sin(cameraYaw));
  if(best){
    const dmgMult = (jumpY > 0 || landingWindow > 0) ? 1.5 : undefined;
    playerAttack(best, dmgMult);
    cleanupDead();
    slashEffects.push({
      type:'line', x: player.x * TILE, y: player.y * TILE,
      angle: swingAngle, length: 26, life: 10, maxLife: 10,
      color:'#e0e0e0', width: 3,
    });
  } else {
    slashEffects.push({
      type:'line', x: player.x * TILE, y: player.y * TILE,
      angle: swingAngle, length: 22, life: 8, maxLife: 8,
      color:'#cfd8dc', width: 2.5,
    });
    screenShake = Math.max(screenShake, 1);
  }
}

// ---- 右键：朝准星方向选择面前的 NPC 打开对话界面 ----
const NPC_REACH = 4.2;  // 交互距离（世界单位，约 2.1 格）
function openNPCChatTowardCam(){
  if(gameOver || npcChatState.open) return;
  const fx = -Math.sin(cameraYaw), fz = -Math.cos(cameraYaw);
  const pwx = player.x * CELL + CELL / 2, pwz = player.y * CELL + CELL / 2;
  let best = null, bestPerp = Infinity;
  for(let i = 0; i < npcs.length; i++){
    const n = npcs[i];
    const dx = n.x * CELL + CELL / 2 - pwx, dz = n.y * CELL + CELL / 2 - pwz;
    const d = Math.hypot(dx, dz);
    if(d > NPC_REACH || d < 1e-4) continue;
    const fwd = dx * fx + dz * fz;
    if(fwd < 0.3) continue;   // 必须在面前
    if(fwd / d < 0.35) continue;  // 需大致对准准星（与近战锥角一致）
    const perp = Math.sqrt(Math.max(0, d * d - fwd * fwd));
    if(perp < bestPerp){ bestPerp = perp; best = n; }
  }
  if(best && bestPerp < 1.4) openNPCChat(best);
  else addMsg('面前没有可以对话的NPC','info');
}

// ---- 朝准星方向（相机朝向在地面的投影）射箭 ----
function playerRangedAttackTowardCam(){
  if(gameOver || actionDelay > 0) return;
  // 起点用视觉位置（平滑），保证箭从人物身上发出
  const px = (typeof player.vx === 'number' ? player.vx : player.x * TILE) + TILE / 2;
  const py = (typeof player.vy === 'number' ? player.vy : player.y * TILE) + TILE / 2;
  // 相机朝向（3D）：(-sin(yaw), -cos(yaw))，映射到像素空间作为目标点方向
  const fx = -Math.sin(cameraYaw);
  const fz = -Math.cos(cameraYaw);
  playerRangedAttack(px + fx * 500, py + fz * 500);
}

// ---- 键盘输入 ----
document.addEventListener('keydown', (e) => {
  const key = e.key;
  const code = e.code;

  if(npcChatState.open){
    if(key === 'Escape'){ closeNPCChat(); e.preventDefault(); }
    else if(key === 'Enter'){ sendChatMessage(); e.preventDefault(); }
    return;
  }
  if(shopOpen || document.getElementById('soul-shop-overlay').classList.contains('show')) return;

  // 调试功能
  if(key === '0'){
    e.preventDefault();
    clearSave();
    debugInvincible = false; debugInstakill = false;
    addMsg('[调试] 存档已删除，调试模式已重置','special');
    return;
  }
  if(key === '9'){
    e.preventDefault();
    const input = prompt('传送楼层 (debug):', '');
    if(input !== null && input.trim() !== ''){
      const n = parseInt(input.trim(), 10);
      if(!Number.isNaN(n) && n >= 1){ gotoFloor(n); }
      else { addMsg('[调试] 请输入有效的楼层正整数','warning'); }
    }
    return;
  }
  if(key === '8'){
    e.preventDefault();
    debugInvincible = !debugInvincible;
    addMsg(debugInvincible ? '[调试] 无敌模式 ON' : '[调试] 无敌模式 OFF', debugInvincible ? 'special' : 'info');
    return;
  }
  if(key === '7'){
    e.preventDefault();
    debugInstakill = !debugInstakill;
    addMsg(debugInstakill ? '[调试] 秒杀模式 ON' : '[调试] 秒杀模式 OFF', debugInstakill ? 'special' : 'info');
    return;
  }
  if(key === '4'){
    e.preventDefault();
    summonEnemy('naiwa');
    return;
  }
  if(key === '5'){
    e.preventDefault();
    summonEnemy('nailong');
    return;
  }
  if(key === '6'){
    e.preventDefault();
    const input = prompt('调整血量 (debug):', '');
    if(input !== null && input.trim() !== ''){
      const n = parseInt(input.trim(), 10);
      if(Number.isNaN(n) || n < 0){ addMsg('[调试] 请输入有效的非负整数','warning'); return; }
      if(n > player.maxHp){ player.maxHp = n; addMsg(`[调试] 最大血量提升至 ${n}`,'special'); }
      player.hp = n;
      addMsg(`[调试] 当前血量设为 ${n} / ${player.maxHp}`,'special');
      updateUI();
    }
    return;
  }
  if(key === '-'){
    e.preventDefault();
    debugInvincible = false; debugInstakill = false;
    addMsg('[调试] 所有调试功能已关闭','info');
    return;
  }

  if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(key)) e.preventDefault();

  if(key === 'c' || key === 'C' || code === 'KeyC'){
    if(gameOver || actionDelay > 0) return;
    let found = null;
    for(let i = 0; i < npcs.length; i++){
      const n = npcs[i];
      if(Math.abs(n.x - player.x) <= 1 && Math.abs(n.y - player.y) <= 1){ found = n; break; }
    }
    if(found) openNPCChat(found);
    else addMsg('附近没有可以对话的NPC','info');
    return;
  }

  switch(key){
    case 'ArrowUp': case 'w': case 'W': moveByCameraDir(1, 0); break;
    case 'ArrowDown': case 's': case 'S': moveByCameraDir(-1, 0); break;
    case 'ArrowLeft': case 'a': case 'A': moveByCameraDir(0, -1); break;
    case 'ArrowRight': case 'd': case 'D': moveByCameraDir(0, 1); break;
    case ' ': if(!e.repeat) playerJump(); break;
    case 'z': case 'Z': waitTurn(); break;
    case 'g': case 'G': pickupItem(); break;
    case 'f': case 'F': playerRangedAttackTowardCam(); break;
    case '1': useSkill(0); break;
    case '2': useSkill(1); break;
    case '3': useSkill(2); break;
    case 'q': case 'Q': useSkill(3); break;
    case 'e': case 'E':
      let foundNpc = false;
      for(const npc of npcs){
        if(Math.abs(npc.x - player.x) <= 1 && Math.abs(npc.y - player.y) <= 1){ foundNpc = true; break; }
      }
      if(foundNpc) interactNPC();
      else interactAltar();
      break;
    case 'r': case 'R': useSkill(4); break;
    case 't': case 'T': useSkill(5); break;
    case 'b': case 'B': openSoulShop(); break;
    case 'x': case 'X': useBomb(); break;
    case '>': case '.': if(map[player.y][player.x] === T_STAIRS) descend(); break;
    case 'p': case 'P': {
      if(gameOver) break;
      const ok = saveGame();
      if(ok){
        addMsg('✓ 已手动存档（第'+floor+'层）','info');
      } else {
        addMsg('✗ 存档失败（浏览器存储不可用）','warning');
      }
      break;
    }
    case 'l': case 'L': {
      if(gameOver) break;
      if(!hasSave()){ addMsg('没有可读取的存档','warning'); break; }
      const ok = loadGame();
      if(ok){
        addMsg('✓ 已读取存档','info');
      } else {
        addMsg('✗ 读档失败','warning');
      }
      break;
    }
  }
});

// ---- MC 风格指针锁定鼠标控制 ----
const canvasWrapper = document.getElementById('canvas-wrapper');

canvasWrapper.addEventListener('click', () => {
  if(npcChatState.open || shopOpen || document.getElementById('soul-shop-overlay').classList.contains('show')) return;
  if(gameOver) return;
  if(document.pointerLockElement !== canvasWrapper){
    canvasWrapper.requestPointerLock();
  }
});

// 左键近战攻击（指针锁定后生效；未锁定时点击用于锁定鼠标）
// 右键打开面前 NPC 对话界面（在 mousedown 中处理，指针锁定/未锁定均可靠触发）
document.addEventListener('mousedown', (e) => {
  if(e.button === 0){
    if(document.pointerLockElement === canvasWrapper){
      meleeAttackTowardCam();
    }
  } else if(e.button === 2){
    e.preventDefault();
    openNPCChatTowardCam();
  }
});

document.addEventListener('pointerlockchange', () => {
  const locked = document.pointerLockElement === canvasWrapper;
  // 可以在此显示/隐藏准星提示
});

document.addEventListener('mousemove', (e) => {
  if(document.pointerLockElement !== canvasWrapper) return;
  // MC 风格：鼠标移动控制朝向
  // 鼠标右移(movementX>0)→向右转头(yaw减小)；鼠标上移(movementY<0)→向上看(pitch增大)
  cameraYaw -= e.movementX * 0.0022;
  cameraPitch -= e.movementY * 0.0022;
  // 限制 pitch 在 -80° ~ +80°
  cameraPitch = Math.max(-Math.PI * 0.44, Math.min(Math.PI * 0.44, cameraPitch));
});

// 仅拦截浏览器右键菜单/手势（对话已在 mousedown 中打开）
document.addEventListener('contextmenu', (e) => {
  if(canvasWrapper.contains(e.target)) e.preventDefault();
});
