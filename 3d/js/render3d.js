// render3d.js - Three.js 3D 渲染引擎（替代 render.js 的 2D Canvas 渲染）

// ============================================================
// 场景 / 相机 / 渲染器初始化
// ============================================================
const CELL = 2.0;          // 每个 tile 的 3D 边长
const WALL_H = 3.0;        // 墙壁高度
const HALF = CELL / 2;

let renderer3d, scene3d, camera3d;
let cameraYaw = 0;        // 水平朝向（弧度）
let cameraPitch = 0;      // 垂直俯仰（弧度）
let cameraTargetX = 0, cameraTargetZ = 0;

// ---- 跳跃（空格）----
let jumpY = 0;            // 当前跳跃高度偏移
let jumpVel = 0;          // 垂直速度（向上为正）
const JUMP_VEL = 0.20;    // 起跳初速度
const JUMP_GRAVITY = 0.018; // 重力/帧
let landingWindow = 0;    // 落地瞬间的跳劈暴击窗口（帧）
let meleeCd = 0;          // 左键近战攻击冷却（帧）

function playerJump(){
  if(gameOver) return;
  if(jumpVel !== 0 || jumpY > 0) return; // 已在空中
  jumpVel = JUMP_VEL;
}

// 场景中的动态对象组（每次 initFloor 重建）
let floorMeshes = [], wallMeshes = [], decorMeshes = [];
let itemMeshes = [], enemyMeshes = [], npcMeshes = [];
let stairsMesh = null, playerMesh = null;
let particleGroups3d = [];
let floatTextGroups3d = [];
let projectileMeshes = [];
let lightPool = [];

// 共享几何 / 材质（避免重复创建）
const GEO = {};
const MAT = {};
const ENEMY_COLORS = {
  slime:0x66bb6a, bat:0x9c27b0, skeleton:0xe0e0e0, ghost:0xb3e5fc,
  lich:0x6a1b9a, mimic:0x8d6e63, demon:0xe53935, fallenAngel:0xffd700,
  naiwa:0xa5d6a7, nailong:0xffb74d,
};
const NPC_COLORS = {
  weaponsmith:0xff6f00, staffmaster:0x42a5f5, skillmaster:0xce93d8,
  healer:0x66bb6a, enchanter:0xab47bc,
};
const ITEM_COLORS = {
  hpotion:0x66bb6a, spotion:0xff5252, gold:0xffd740, scroll:0x90caf9,
  soalgem:0xce93d8, bomb:0xff6f00, mapscroll:0x81d4fa, tpscroll:0xba68c8,
  loreScroll:0xffd740, weapon:0xb0bec5, armor:0x78909c,
};

function init3D(){
  const wrapper = document.getElementById('canvas-wrapper');
  let w = wrapper.clientWidth || 800, h = wrapper.clientHeight || 640;
  if(h < 100) h = 640;
  if(w < 100) w = 800;

  renderer3d = new THREE.WebGLRenderer({antialias:true});
  renderer3d.setSize(w, h);
  renderer3d.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer3d.shadowMap.enabled = true;
  renderer3d.shadowMap.type = THREE.PCFSoftShadowMap;
  wrapper.appendChild(renderer3d.domElement);

  scene3d = new THREE.Scene();
  scene3d.background = new THREE.Color(0x222230);
  scene3d.fog = new THREE.Fog(0x222230, 25, 60);

  camera3d = new THREE.PerspectiveCamera(75, w/h, 0.1, 100);

  // ---- 共享几何 ----
  GEO.box = new THREE.BoxGeometry(CELL, WALL_H, CELL);
  GEO.wallBox = new THREE.BoxGeometry(CELL, WALL_H + CELL, CELL); // 墙加高一格
  GEO.floor = new THREE.PlaneGeometry(CELL, CELL);
  GEO.stairs = new THREE.PlaneGeometry(CELL * 0.8, CELL * 0.8);
  GEO.sphere = new THREE.SphereGeometry(HALF * 0.55, 12, 10);
  GEO.smallSphere = new THREE.SphereGeometry(0.25, 8, 6);
  GEO.cone = new THREE.ConeGeometry(HALF * 0.5, CELL * 0.8, 8);
  GEO.cylinder = new THREE.CylinderGeometry(HALF * 0.4, HALF * 0.5, CELL * 0.7, 8);
  GEO.particle = new THREE.SphereGeometry(0.15, 6, 4);
  GEO.pyramid = new THREE.ConeGeometry(HALF * 0.6, CELL * 0.9, 4);
  GEO.tetra = new THREE.TetrahedronGeometry(HALF * 0.6);
  GEO.octa = new THREE.OctahedronGeometry(HALF * 0.6);

  // ---- 共享材质 ----
  MAT.wall = new THREE.MeshStandardMaterial({color:0x6a5e4e, roughness:0.8, metalness:0.05, emissive:0x2a2620, emissiveIntensity:0.5});
  MAT.wall2 = new THREE.MeshStandardMaterial({color:0x605444, roughness:0.8, metalness:0.05, emissive:0x262218, emissiveIntensity:0.5});
  MAT.floor = new THREE.MeshStandardMaterial({color:0x7a6e54, roughness:0.75, emissive:0x2a2418, emissiveIntensity:0.4});
  MAT.floorCarpet = new THREE.MeshStandardMaterial({color:0x8a3858, roughness:0.6, emissive:0x301828, emissiveIntensity:0.4});
  MAT.water = new THREE.MeshStandardMaterial({color:0x1a4a7a, roughness:0.2, metalness:0.6, transparent:true, opacity:0.7});
  MAT.stairs = new THREE.MeshStandardMaterial({color:0xffd740, roughness:0.4, metalness:0.3, emissive:0x665020, emissiveIntensity:0.5});
  // 天花板纹理与墙壁同步（复用墙像素贴图，Nearest 采样保持像素风）
  MAT.ceiling = makeWallCeilingMaterial();
  MAT.player = new THREE.MeshStandardMaterial({color:0x4fc3f7, roughness:0.4, metalness:0.3, emissive:0x0a2a4a, emissiveIntensity:0.4});
  MAT.enemyBase = new THREE.MeshStandardMaterial({roughness:0.5, metalness:0.1});

  window.addEventListener('resize', onResize3D);
}

function onResize3D(){
  const wrapper = document.getElementById('canvas-wrapper');
  if(!wrapper) return;
  let w = wrapper.clientWidth || 800, h = wrapper.clientHeight || 640;
  if(h < 100) h = 640;
  if(w < 100) w = 800;
  if(!renderer3d || !camera3d) return;
  renderer3d.setSize(w, h);
  camera3d.aspect = w / h;
  camera3d.updateProjectionMatrix();
}

// ============================================================
// 颜色辅助
// ============================================================
function tileY(x, y){ return (x * 7 + y * 13) % 4; }

function darkenHex(hex, factor){
  const r = ((hex >> 16) & 0xff) * factor;
  const g = ((hex >> 8) & 0xff) * factor;
  const b = (hex & 0xff) * factor;
  return (Math.floor(r) << 16) | (Math.floor(g) << 8) | Math.floor(b);
}

// ============================================================
// 清空场景中的动态对象（楼层重建时调用）
// ============================================================
function clearScene(){
  // 地形/装饰由区块系统统一清理
  clearChunks3D();
  for(const m of itemMeshes) scene3d.remove(m);
  for(const m of enemyMeshes) scene3d.remove(m);
  for(const m of npcMeshes) scene3d.remove(m);
  for(const m of projectileMeshes) scene3d.remove(m);
  for(const g of particleGroups3d) scene3d.remove(g.mesh);
  for(const g of floatTextGroups3d) { if(g.mesh) scene3d.remove(g.mesh); }
  for(const l of lightPool){ scene3d.remove(l); }
  if(playerMesh) scene3d.remove(playerMesh);
  itemMeshes = []; enemyMeshes = []; npcMeshes = [];
  projectileMeshes = []; particleGroups3d = []; floatTextGroups3d = [];
  lightPool = [];
  playerMesh = null;
}

// ============================================================
// 构建当前楼层的 3D 场景
// ============================================================
function buildFloor3D(){
  clearScene();

  // ---- 地形 / 装饰由区块系统按探索进度动态构建 ----
  clearChunks3D();
  updateChunks3D();

  // ---- 可拾取物品（药水、金币等） ----
  rebuildItemMeshes();

  // ---- 敌人 ----
  rebuildEnemyMeshes();

  // ---- NPC ----
  rebuildNpcMeshes();

  // ---- 玩家（第一人称：不显示身体，仅用于位置追踪） ----
  playerMesh = new THREE.Group();
  playerMesh.position.set(rooms[0].cx * CELL, 0, rooms[0].cy * CELL);
  scene3d.add(playerMesh);
  cameraTargetX = playerMesh.position.x;
  cameraTargetZ = playerMesh.position.z;

  // ---- 环境光 ----
  const ambient = new THREE.AmbientLight(0x9090b0, 1.0);
  scene3d.add(ambient);
  lightPool.push(ambient);

  // 半球光（天空-地面），让整体更明亮
  const hemi = new THREE.HemisphereLight(0xa0a0c0, 0x504030, 0.8);
  scene3d.add(hemi);
  lightPool.push(hemi);

  // 方向光（模拟远处光源，整体照亮）
  const dir = new THREE.DirectionalLight(0xc0c0e0, 0.6);
  dir.position.set(10, 20, 10);
  scene3d.add(dir);
  lightPool.push(dir);

  // 玩家头顶聚光（第一人称：从眼睛位置发光）
  const playerLight = new THREE.PointLight(0xfff4e0, 3.0, CELL * 16, 1.0);
  playerLight.position.set(0, WALL_H * 0.6, 0);
  scene3d.add(playerLight);
  playerMesh.userData.light = playerLight;
  lightPool.push(playerLight);
}

// ---- 构建单个装饰物 mesh（由区块系统调用），返回 mesh 或 null ----
function buildDecorMesh(item){
  const wx = item.x * CELL, wz = item.y * CELL;
  let mesh = null;

  switch(item.type){
    case 'torch': {
      mesh = new THREE.Group();
      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.08, CELL * 0.7, 6),
        new THREE.MeshStandardMaterial({color:0x4a3020, roughness:0.9})
      );
      pole.position.y = CELL * 0.35;
      const flame = new THREE.Mesh(
        new THREE.SphereGeometry(0.2, 8, 6),
        new THREE.MeshBasicMaterial({color:0xff8800})
      );
      flame.position.y = CELL * 0.75;
      mesh.add(pole); mesh.add(flame);
      // 点光源
      const light = new THREE.PointLight(0xffaa44, 1.2, CELL * 5, 2);
      light.position.set(wx, CELL * 0.8, wz);
      scene3d.add(light);
      mesh.userData.light = light;
      mesh.userData.flame = flame;
      break;
    }
    case 'pillar': {
      mesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.45, 0.5, WALL_H * 0.85, 8),
        new THREE.MeshStandardMaterial({color:0x6a5a4a, roughness:0.8})
      );
      mesh.position.y = WALL_H * 0.425;
      mesh.castShadow = true;
      break;
    }
    case 'statue': {
      mesh = new THREE.Mesh(
        GEO.box,
        new THREE.MeshStandardMaterial({color:0x8a8a8a, roughness:0.6, metalness:0.3})
      );
      mesh.scale.set(0.6, 1.2, 0.6);
      mesh.position.y = CELL * 0.6;
      mesh.castShadow = true;
      break;
    }
    case 'altar': {
      const altarColor = item.cursed ? 0x800020 : 0xb09040;
      mesh = new THREE.Mesh(
        GEO.box,
        new THREE.MeshStandardMaterial({
          color:altarColor, roughness:0.4, metalness:0.5,
          emissive:altarColor, emissiveIntensity:0.15
        })
      );
      mesh.scale.set(0.7, 0.5, 0.7);
      mesh.position.y = CELL * 0.25;
      if(item.uses > 0){
        const light = new THREE.PointLight(item.cursed ? 0xff0000 : 0xffd740, 0.8, CELL * 4, 2);
        light.position.set(wx, CELL * 0.8, wz);
        scene3d.add(light);
        mesh.userData.light = light;
      }
      break;
    }
    case 'bookshelf': {
      mesh = new THREE.Mesh(
        GEO.box,
        new THREE.MeshStandardMaterial({color:0x4a3520, roughness:0.9})
      );
      mesh.scale.set(0.8, 1.5, 0.3);
      mesh.position.y = CELL * 0.75;
      break;
    }
    case 'barrel': {
      mesh = new THREE.Mesh(
        GEO.cylinder,
        new THREE.MeshStandardMaterial({color:0x6a4a2a, roughness:0.8})
      );
      mesh.position.y = CELL * 0.35;
      break;
    }
    case 'cage': {
      mesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.4, 0.4, CELL * 0.8, 6, 1, true),
        new THREE.MeshStandardMaterial({color:0x555555, roughness:0.6, metalness:0.7, side:THREE.DoubleSide})
      );
      mesh.position.y = CELL * 0.4;
      break;
    }
    case 'anvil': {
      mesh = new THREE.Mesh(
        GEO.box,
        new THREE.MeshStandardMaterial({color:0x333333, roughness:0.3, metalness:0.8})
      );
      mesh.scale.set(0.5, 0.3, 0.4);
      mesh.position.y = CELL * 0.15;
      break;
    }
    case 'chandelier': {
      mesh = new THREE.Group();
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.4, 0.06, 6, 12),
        new THREE.MeshStandardMaterial({color:0x8a6a30, metalness:0.8, roughness:0.3})
      );
      ring.position.y = WALL_H - 0.2;
      ring.rotation.x = Math.PI / 2;
      mesh.add(ring);
      const light = new THREE.PointLight(0xffaa44, 0.8, CELL * 4, 2);
      light.position.set(wx, WALL_H - 0.3, wz);
      scene3d.add(light);
      mesh.userData.light = light;
      break;
    }
    case 'bones': case 'blood': case 'cobweb': case 'marble':
    case 'mushroom': case 'urn': case 'candle': case 'wallChain': case 'painting':
    case 'spikes': {
      const decorColor = item.type==='blood'?0x6a1010:item.type==='mushroom'?0xce93d8:
        item.type==='spikes'?0x888888:item.type==='candle'?0xffcc66:0x555055;
      mesh = new THREE.Mesh(
        GEO.smallSphere,
        new THREE.MeshStandardMaterial({color:decorColor, roughness:0.7})
      );
      mesh.scale.set(0.6, item.type==='blood'?0.1:0.5, 0.6);
      mesh.position.y = item.type==='spikes'?0.3:0.1;
      if(item.type==='mushroom'){
        const ml = new THREE.PointLight(0xce93d8, 0.3, CELL * 2, 2);
        ml.position.set(wx, 0.4, wz);
        scene3d.add(ml);
        mesh.userData.light = ml;
      }
      break;
    }
  }

  if(mesh){
    mesh.position.x = wx;
    mesh.position.z = wz;
    mesh.userData.tileX = item.x;
    mesh.userData.tileY = item.y;
    mesh.userData.type = 'decor';
  }
  return mesh;
}

// ---- 重建可拾取物品 mesh ----
function rebuildItemMeshes(){
  for(const m of itemMeshes) scene3d.remove(m);
  itemMeshes = [];
  for(const item of items){
    if(isDecorType(item.type)) continue;
    const wx = item.x * CELL, wz = item.y * CELL;
    const color = ITEM_COLORS[item.type] || 0xffffff;
    let mesh;
    if(item.type === 'gold'){
      mesh = new THREE.Mesh(
        GEO.smallSphere,
        new THREE.MeshStandardMaterial({color:0xffd740, metalness:0.9, roughness:0.15, emissive:0x665020, emissiveIntensity:0.3})
      );
      mesh.scale.set(0.7, 0.4, 0.7);
      mesh.position.set(wx, 0.3, wz);
    } else if(item.type === 'weapon' || item.type === 'armor'){
      mesh = new THREE.Mesh(
        GEO.tetra,
        new THREE.MeshStandardMaterial({color:color, metalness:0.7, roughness:0.3})
      );
      mesh.position.set(wx, 0.6, wz);
    } else {
      mesh = new THREE.Mesh(
        GEO.octa,
        new THREE.MeshStandardMaterial({color:color, metalness:0.3, roughness:0.3, emissive:color, emissiveIntensity:0.3})
      );
      mesh.position.set(wx, 0.5, wz);
    }
    mesh.userData.tileX = item.x;
    mesh.userData.tileY = item.y;
    mesh.userData.type = 'item';
    scene3d.add(mesh);
    itemMeshes.push(mesh);
  }
}

// ---- 重建敌人 mesh ----
function rebuildEnemyMeshes(){
  for(const m of enemyMeshes) scene3d.remove(m);
  enemyMeshes = [];
  for(const e of entities){
    if(e.dead) continue;
    const mesh = createEnemyMesh(e);
    scene3d.add(mesh);
    enemyMeshes.push(mesh);
    e._px = e.x; e._py = e.y; // 记录上一格，供史莱姆跳跃触发
  }
}

function createEnemyMesh(e){
  const wx = e.x * CELL, wz = e.y * CELL;
  const color = ENEMY_COLORS[e.type] || 0xff5252;
  const group = new THREE.Group();
  group.position.set(wx, 0, wz);
  let bodyGeo = GEO.sphere;
  let bodyScaleY = 1;
  switch(e.type){
    case 'slime': bodyScaleY = 0.6; break;
    case 'bat': bodyGeo = GEO.tetra; break;
    case 'skeleton': bodyGeo = GEO.cylinder; bodyScaleY = 1.3; break;
    case 'ghost': bodyGeo = GEO.octa; break;
    case 'lich': bodyGeo = GEO.cone; break;
    case 'demon': bodyGeo = GEO.pyramid; break;
    case 'fallenAngel': bodyGeo = GEO.octa; break;
    case 'naiwa': bodyScaleY = 0.7; break;
    case 'nailong': bodyGeo = GEO.cone; break;
  }

  const body = new THREE.Mesh(
    bodyGeo,
    new THREE.MeshStandardMaterial({color:color, roughness:0.4, metalness:0.2, emissive:color, emissiveIntensity:0.15})
  );
  body.scale.y = bodyScaleY;
  body.position.y = CELL * 0.5;
  body.castShadow = true;
  group.add(body);
  group.userData.body = body;

  // 精英怪光环
  if(e.elite){
    const aura = new THREE.Mesh(
      new THREE.TorusGeometry(HALF, 0.05, 6, 16),
      new THREE.MeshBasicMaterial({color:0xffd700})
    );
    aura.rotation.x = Math.PI / 2;
    aura.position.y = 0.02;
    group.add(aura);
    group.userData.aura = aura;
  }

  // 血条
  if(e.hp < e.maxHp){
    const barBg = new THREE.Mesh(
      new THREE.PlaneGeometry(CELL * 0.8, 0.12),
      new THREE.MeshBasicMaterial({color:0x111111})
    );
    barBg.position.y = CELL * 1.2;
    barBg.userData.isBarBg = true;
    group.add(barBg);

    const barFg = new THREE.Mesh(
      new THREE.PlaneGeometry(CELL * 0.8, 0.1),
      new THREE.MeshBasicMaterial({color:0x66bb6a})
    );
    barFg.position.set(0, CELL * 1.2, 0.01);
    barFg.userData.isBarFg = true;
    group.add(barFg);
    group.userData.barFg = barFg;
  }

  // 2D 精灵贴图（billboard 始终面向相机，还原怪物像素造型）
  const tex = getEnemyTexture(e.type);
  if(tex){
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({map: tex, transparent: true, alphaTest: 0.05})
    );
    sprite.scale.set(CELL * 1.15, CELL * 1.15, 1);
    sprite.center.set(0.5, 0.05);
    sprite.position.y = CELL * 0.55;
    group.add(sprite);
    group.userData.sprite = sprite;
  }

  group.userData.entity = e;
  group.userData.type = 'enemy';
  group.userData.animOffset = e.animOffset || 0;
  // 史莱姆换格跳跃：在上一格与当前格不同时起跳
  group.userData.prevX = e.x;
  group.userData.prevY = e.y;
  if(e.type === 'slime' && e._px !== undefined && (e._px !== e.x || e._py !== e.y)){
    group.userData.hopVel = 0.18;
    group.userData.hopY = 0;
  }
  return group;
}

// ---- 敌人 2D 精灵贴图（复用 sprites.js 的 SPR / IMG） ----
const ENEMY_SPRITE_KEYS = {
  slime:'slime', bat:'bat', skeleton:'skeleton', ghost:'ghost',
  lich:'lich', mimic:'mimic', demon:'demon', fallenAngel:'fallenAngel',
  naiwa:'naiwa', nailong:'nailong',
};
const enemyTexCache = {};
function makeSpriteTex(src){
  const tex = new THREE.CanvasTexture(src);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  return tex;
}
// 天花板材质：复用墙像素纹理，与墙壁视觉同步；无墙图时退回纯色
function makeWallCeilingMaterial(){
  const spr = getSpriteCanvas('wall') || getSpriteCanvas('wallTop');
  if(spr){
    const tex = makeSpriteTex(spr);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(1, 1);
    return new THREE.MeshStandardMaterial({
      map: tex,
      emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.3,
      roughness: 0.9, metalness: 0.05, side: THREE.DoubleSide
    });
  }
  return new THREE.MeshStandardMaterial({
    color:0x2e2a26, roughness:0.9, metalness:0.05,
    emissive:0x141210, emissiveIntensity:0.4,
    side:THREE.DoubleSide
  });
}
function getEnemyTexture(type){
  const name = ENEMY_SPRITE_KEYS[type];
  if(!name) return null;
  if(enemyTexCache[type]) return enemyTexCache[type];
  let src;
  if(name === 'naiwa' || name === 'nailong'){
    const img = (typeof IMG !== 'undefined') ? IMG[name] : null;
    if(!img) return null; // 外部图片异步加载，稍后由 syncEnemyMeshes 触发重建
    src = img;
  } else {
    const spr = getSpriteCanvas(name);
    if(!spr) return null;
    src = spr;
  }
  enemyTexCache[type] = makeSpriteTex(src);
  return enemyTexCache[type];
}

// ---- NPC 2D 精灵贴图 ----
const NPC_SPRITE_KEYS = {
  weaponsmith:'npcWeapon', staffmaster:'npcStaff', skillmaster:'npcSkill',
  healer:'npcHealer', enchanter:'npcEnchanter',
};
const npcTexCache = {};
function getNpcTexture(type){
  const name = NPC_SPRITE_KEYS[type];
  if(!name) return null;
  if(npcTexCache[type]) return npcTexCache[type];
  const spr = getSpriteCanvas(name);
  if(!spr) return null;
  npcTexCache[type] = makeSpriteTex(spr);
  return npcTexCache[type];
}

// 从 SPR 中取画布（initSprites 收尾已是 canvas，兼容 ImageData）
function getSpriteCanvas(name){
  let spr = (typeof SPR !== 'undefined') ? SPR[name] : null;
  if(!spr) return null;
  if(typeof ImageData !== 'undefined' && spr instanceof ImageData){
    const c = document.createElement('canvas');
    c.width = TILE; c.height = TILE;
    c.getContext('2d').putImageData(spr, 0, 0);
    spr = c;
  }
  return spr;
}

// ---- 重建 NPC mesh ----
function rebuildNpcMeshes(){
  for(const m of npcMeshes) scene3d.remove(m);
  npcMeshes = [];
  for(const npc of npcs){
    const wx = npc.x * CELL, wz = npc.y * CELL;
    const color = NPC_COLORS[npc.type] || 0xffd740;
    const group = new THREE.Group();
    group.position.set(wx, 0, wz);

    const body = new THREE.Mesh(
      GEO.cylinder,
      new THREE.MeshStandardMaterial({color:color, roughness:0.4, emissive:color, emissiveIntensity:0.2})
    );
    body.position.y = CELL * 0.4;
    body.castShadow = true;
    group.add(body);

    // 头顶标记
    const marker = new THREE.Mesh(
      new THREE.ConeGeometry(0.15, 0.3, 4),
      new THREE.MeshBasicMaterial({color:color})
    );
    marker.position.y = CELL * 1.2;
    group.add(marker);

    // 2D 精灵贴图（billboard 始终面向相机）
    const tex = getNpcTexture(npc.type);
    if(tex){
      const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({map: tex, transparent: true, alphaTest: 0.05})
      );
      sprite.scale.set(CELL * 1.15, CELL * 1.15, 1);
      sprite.center.set(0.5, 0.05);
      sprite.position.y = CELL * 0.55;
      group.add(sprite);
      group.userData.sprite = sprite;
    }

    group.userData.npc = npc;
    group.userData.type = 'npc';
    scene3d.add(group);
    npcMeshes.push(group);
  }
}

function isDecorType(t){
  return t==='torch'||t==='barrel'||t==='statue'||t==='altar'||t==='spikes'||t==='bookshelf'||
    t==='cage'||t==='anvil'||t==='cobweb'||t==='marble'||t==='blood'||t==='candle'||t==='bones'||
    t==='mushroom'||t==='pillar'||t==='urn'||t==='chandelier'||t==='wallChain'||t==='painting';
}

// ============================================================
// 3D 粒子 / 浮动文字（覆盖在 3D 场景上）
// ============================================================
function spawnParticle3D(x, y, color){
  // 将 2D 像素坐标近似转换为 tile 坐标
  const tx = x / TILE, ty = y / TILE;
  const wx = tx * CELL, wz = ty * CELL;
  const mat = new THREE.MeshBasicMaterial({color:color, transparent:true, opacity:0.8});
  const m = new THREE.Mesh(GEO.particle, mat);
  m.position.set(wx + randF(-0.3, 0.3), randF(0.3, 1.2), wz + randF(-0.3, 0.3));
  m.userData.life = randF(20, 35);
  m.userData.maxLife = m.userData.life;
  m.userData.vy = randF(0.01, 0.04);
  m.userData.shrink = true;
  scene3d.add(m);
  particleGroups3d.push({mesh:m, vy:m.userData.vy});
}

// ============================================================
// 主渲染函数（替代 render.js 的 render()）
// ============================================================
function render(){
  if(screenShake > 0) screenShake *= 0.85;
  if(screenShake < 0.3) screenShake = 0;
  if(damageFlash > 0) damageFlash--;

  if(!scene3d || !player) return;

  // ---- 检查 canvas 尺寸是否需要更新 ----
  const wrapper = document.getElementById('canvas-wrapper');
  if(wrapper && renderer3d){
    const cw = wrapper.clientWidth, ch = wrapper.clientHeight;
    if(cw > 0 && ch > 0 && (cw !== renderer3d.domElement.width / renderer3d.getPixelRatio() || ch !== renderer3d.domElement.height / renderer3d.getPixelRatio())){
      onResize3D();
    }
  }


  // ---- 玩家平滑移动到格子中心（格子制移动 + 平滑动画） ----
  if(!gameOver){
    const targetX = player.x * CELL, targetZ = player.y * CELL;
    playerMesh.position.x += (targetX - playerMesh.position.x) * 0.25;
    playerMesh.position.z += (targetZ - playerMesh.position.z) * 0.25;
    // 同步视觉像素位置供射箭/弹道使用（从平滑位置发出）
    player.vx = playerMesh.position.x / CELL * TILE;
    player.vy = playerMesh.position.z / CELL * TILE;
  }

  // ---- 跳跃物理 ----
  const wasAirborne = jumpY > 0;
  if(jumpVel !== 0 || jumpY > 0){
    jumpY += jumpVel;
    jumpVel -= JUMP_GRAVITY;
    if(jumpY <= 0){ jumpY = 0; jumpVel = 0; }
  }
  // 落地瞬间：开启跳劈暴击窗口（持续数帧）
  if(wasAirborne && jumpY <= 0) landingWindow = 8;
  if(landingWindow > 0) landingWindow--;
  if(meleeCd > 0) meleeCd--;
  playerMesh.position.y = jumpY;
  if(playerMesh.userData.light){
    playerMesh.userData.light.position.set(playerMesh.position.x, WALL_H * 0.6 + jumpY, playerMesh.position.z);
  }

  // ---- 区块系统：每帧更新，探索到新区域即构建周边区块 ----
  updateChunks3D();

  // ---- 同步敌人 mesh 位置（敌人可能已经移动） ----
  syncEnemyMeshes();
  // ---- 同步物品 mesh（可能被拾取） ----
  syncItemMeshes();
  // ---- NPC 浮动 ----
  for(const m of npcMeshes){
    m.userData.body && (m.userData.body.rotation.y += 0.02);
  }

  // ---- 楼梯旋转发光 ----
  if(stairsMesh){
    stairsMesh.rotation.z += 0.01;
  }

  // ---- 火焰/光环动画 ----
  for(const m of decorMeshes){
    if(m.userData.flame){
      const s = 0.8 + Math.sin(animTime * 8 + m.position.x) * 0.2;
      m.userData.flame.scale.set(s, s, s);
    }
  }

  // ---- 物品旋转 / 浮动 ----
  for(const m of itemMeshes){
    m.rotation.y += 0.03;
    m.position.y = 0.5 + Math.sin(animTime * 2 + m.position.x) * 0.1;
  }

  // ---- 更新 3D 粒子 ----
  updateParticles3D();

  // ---- 投射物 ----
  syncProjectiles3D();

  // ---- 剑气/旋风斩特效 ----
  syncSlashEffects3D();

  // ---- 第一人称相机 ----
  cameraTargetX += (playerMesh.position.x - cameraTargetX) * 0.3;
  cameraTargetZ += (playerMesh.position.z - cameraTargetZ) * 0.3;

  // 屏幕震动
  const shakeX = screenShake > 0 ? randF(-1, 1) * screenShake * 0.08 : 0;
  const shakeY = screenShake > 0 ? randF(-1, 1) * screenShake * 0.08 : 0;

  // 相机位于玩家眼睛位置（跳跃时抬升）
  const eyeY = WALL_H * 0.55 + jumpY;
  camera3d.position.set(cameraTargetX + shakeX, eyeY + shakeY, cameraTargetZ);
  // 用欧拉角控制朝向：yaw 绕 Y 轴，pitch 绕 X 轴
  camera3d.rotation.order = 'YXZ';
  camera3d.rotation.y = cameraYaw;
  camera3d.rotation.x = cameraPitch;

  renderer3d.render(scene3d, camera3d);

  // ---- DOM overlay 效果 ----
  updateDomEffects();
}

// ---- 同步敌人 mesh ----
let lastEntitySnapshot = '';
function syncEnemyMeshes(){
  // 外部贴图（naiwa/nailong PNG）异步加载完成时触发一次重建（仅当楼层存在该类敌人）
  const hasExtTexEnemy = entities.some(e=>!e.dead && (e.type==='naiwa' || e.type==='nailong'));
  if(hasExtTexEnemy && typeof IMG !== 'undefined' && (
    (IMG.naiwa && !enemyTexCache['naiwa']) ||
    (IMG.nailong && !enemyTexCache['nailong'])
  )){
    lastEntitySnapshot = '';
  }
  // 检查敌人列表是否变化（只按身份 id，不含位置——位置由每帧平滑跟随，
  // 避免每移动一格就全量重建导致的"瞬移"感）
  const snap = entities.filter(e=>!e.dead).map(e => (e.id !== undefined ? e.id : e.type + ':' + e.x + ',' + e.y)).sort((a,b)=>String(a).localeCompare(String(b))).join(',');
  if(snap !== lastEntitySnapshot){
    lastEntitySnapshot = snap;
    // 全量重建
    rebuildEnemyMeshes();
  }
  // 浮动 / 旋转动画
  for(const m of enemyMeshes){
    const e = m.userData.entity;
    if(!e) continue;
    // 平滑跟随目标格（怪物移速放缓，不再瞬移）
    const tx = e.x * CELL, tz = e.y * CELL;
    m.position.x += (tx - m.position.x) * 0.12;
    m.position.z += (tz - m.position.z) * 0.12;
    const bobY = Math.sin(animTime * 2 + (m.userData.animOffset||0)) * 0.06;
    let liftY = 0;
    if(m.userData.body){
      if(e.type === 'slime'){
        // 史莱姆：换格时跳跃（起跳拉伸、下落压扁）
        const px = m.userData.prevX, py = m.userData.prevY;
        if(px !== undefined && (px !== e.x || py !== e.y)){
          m.userData.hopVel = 0.18; m.userData.hopY = 0;
        }
        m.userData.prevX = e.x; m.userData.prevY = e.y;
        const hopVel = m.userData.hopVel || 0;
        const hopY = m.userData.hopY || 0;
        if(hopVel !== 0 || hopY > 0){
          m.userData.hopY = hopY + hopVel;
          m.userData.hopVel = hopVel - JUMP_GRAVITY * 1.2;
          if(m.userData.hopY <= 0){ m.userData.hopY = 0; m.userData.hopVel = 0; }
        }
        liftY = m.userData.hopY || 0;
        m.userData.body.position.y = CELL * 0.5 + liftY;
        m.userData.body.scale.y = 0.6 * (1 + (m.userData.hopVel || 0) * 0.8);
      } else {
        m.userData.body.position.y = CELL * 0.5 + bobY;
        m.userData.body.rotation.y += 0.015;
        liftY = bobY;
      }
    }
    if(m.userData.sprite){
      m.userData.sprite.position.y = CELL * 0.55 + liftY * 0.7;
    }
    // 闪白
    if(e.hitFlash > 0){
      m.userData.body.material.emissiveIntensity = 0.8;
      e.hitFlash--;
    } else {
      m.userData.body.material.emissiveIntensity = 0.15;
    }
    // 精英光环旋转
    if(m.userData.aura){
      m.userData.aura.rotation.z += 0.05;
    }
    // 血条更新
    if(m.userData.barFg){
      const ratio = Math.max(0, e.hp / e.maxHp);
      m.userData.barFg.scale.x = ratio;
      m.userData.barFg.position.x = -(CELL * 0.8 * (1 - ratio)) / 2;
      m.userData.barFg.material.color.setHex(ratio > 0.5 ? 0x66bb6a : ratio > 0.25 ? 0xffa726 : 0xff5252);
    }
    // 血条和精英光环面向相机（billboard）
    if(m.children){
      for(const child of m.children){
        if(child.userData && (child.userData.isBarBg || child.userData.isBarFg)){
          child.lookAt(camera3d.position);
        }
      }
    }
    // 冻结效果
    if(e.frozen > 0){
      m.userData.body.material.emissive = 0x81d4fa;
    } else {
      const color = ENEMY_COLORS[e.type] || 0xff5252;
      m.userData.body.material.emissive = color;
    }
  }
}

// ---- 剑气/旋风斩 3D 特效 ----
let slashMeshes3d = [];
function syncSlashEffects3D(){
  // 清除上一帧
  for(const m of slashMeshes3d){ scene3d.remove(m); }
  slashMeshes3d = [];

  for(const s of slashEffects){
    const ratio = clamp(s.life / s.maxLife, 0, 1);
    if(ratio <= 0) continue;

    if(s.type === 'arc'){
      // 弧形刀光：用 TorusGeometry 部分弧
      const color = s.color || '#42a5f5';
      const torusGeo = new THREE.TorusGeometry(s.radius / TILE * CELL, 0.08 * s.lineWidth, 4, 16, s.arcLength);
      const mat = new THREE.MeshBasicMaterial({color:color, transparent:true, opacity:ratio * 0.8});
      const torus = new THREE.Mesh(torusGeo, mat);
      torus.position.set(s.x / TILE * CELL, 0.8, s.y / TILE * CELL);
      torus.rotation.x = -Math.PI / 2;
      torus.rotation.z = s.angle;
      scene3d.add(torus);
      slashMeshes3d.push(torus);
    } else if(s.type === 'line'){
      // 放射状光束：细长方块
      const color = s.color || '#42a5f5';
      const len = s.length / TILE * CELL;
      const boxGeo = new THREE.BoxGeometry(len, 0.06 * s.width, 0.06 * s.width);
      const mat = new THREE.MeshBasicMaterial({color:color, transparent:true, opacity:ratio * 0.7});
      const beam = new THREE.Mesh(boxGeo, mat);
      beam.position.set(s.x / TILE * CELL, 0.8, s.y / TILE * CELL);
      beam.position.x += Math.cos(s.angle) * len / 2;
      beam.position.z += Math.sin(s.angle) * len / 2;
      beam.rotation.y = -s.angle;
      scene3d.add(beam);
      slashMeshes3d.push(beam);
    }
  }
}

// ---- 同步物品 mesh ----
let lastItemSnapshot = '';
function syncItemMeshes(){
  // 检查物品列表是否变化
  const snap = items.filter(it=>!isDecorType(it.type)).map(it=>it.x+','+it.y+','+it.type).join('|');
  if(snap !== lastItemSnapshot){
    lastItemSnapshot = snap;
    rebuildItemMeshes();
  }
}

// ---- 同步投射物（每帧复用 mesh，不重建） ----
function syncProjectiles3D(){
  // 清除上一帧的投射物 mesh 及其光源
  for(const m of projectileMeshes){
    if(m.userData.light) scene3d.remove(m.userData.light);
    scene3d.remove(m);
  }
  projectileMeshes = [];
  for(const p of projectiles){
    if(!p.fromPlayer) continue;
    let px, py;
    if(p.pixel){
      px = p.fpx / TILE; py = p.fpy / TILE;
    } else {
      px = p.x; py = p.y;
    }
    const wx = px * CELL, wz = py * CELL;

    if(p.type === 'fireball'){
      // 火球：大发光球 + 点光源
      const grp = new THREE.Group();
      const core = new THREE.Mesh(
        new THREE.SphereGeometry(0.5, 12, 10),
        new THREE.MeshBasicMaterial({color:0xff6600})
      );
      grp.add(core);
      const glow = new THREE.Mesh(
        new THREE.SphereGeometry(0.8, 12, 10),
        new THREE.MeshBasicMaterial({color:0xffaa00, transparent:true, opacity:0.3})
      );
      grp.add(glow);
      const light = new THREE.PointLight(0xff6600, 3, CELL * 4, 2);
      light.position.set(wx, 0.8, wz);
      scene3d.add(light);
      grp.userData.light = light;
      grp.position.set(wx, 0.8, wz);
      scene3d.add(grp);
      projectileMeshes.push(grp);
      // 火球拖尾粒子
      for(let i = 0; i < 3; i++){
        spawnParticle3D(px * TILE, py * TILE, i === 0 ? '#ff6600' : '#ffaa00');
      }
    } else {
      // 箭矢/生命汲取：发光弹 + 拖尾
      const color = p.type === 'lifedrain' ? 0xce93d8 : 0xffd740;
      const grp = new THREE.Group();
      const core = new THREE.Mesh(
        new THREE.SphereGeometry(0.3, 10, 8),
        new THREE.MeshBasicMaterial({color:color})
      );
      grp.add(core);
      const glow = new THREE.Mesh(
        new THREE.SphereGeometry(0.5, 10, 8),
        new THREE.MeshBasicMaterial({color:color, transparent:true, opacity:0.35})
      );
      grp.add(glow);
      const light = new THREE.PointLight(color, 1.5, CELL * 3, 2);
      light.position.set(wx, 0.6, wz);
      scene3d.add(light);
      grp.userData.light = light;
      grp.position.set(wx, 0.6, wz);
      scene3d.add(grp);
      projectileMeshes.push(grp);
    }
  }
}

// ---- 更新 3D 粒子 ----
function updateParticles3D(){
  for(let i = particleGroups3d.length - 1; i >= 0; i--){
    const pg = particleGroups3d[i];
    pg.mesh.userData.life--;
    pg.mesh.position.y += pg.vy;
    const ratio = pg.mesh.userData.life / pg.mesh.userData.maxLife;
    pg.mesh.material.opacity = ratio * 0.8;
    pg.mesh.scale.setScalar(ratio);
    if(pg.mesh.userData.life <= 0){
      scene3d.remove(pg.mesh);
      particleGroups3d.splice(i, 1);
    }
  }
}

// ---- DOM overlay 效果更新 ----
function updateDomEffects(){
  // 伤害红屏
  const vignette = document.getElementById('damage-vignette');
  if(damageFlash > 0){
    const a = damageFlash * 0.04;
    vignette.style.boxShadow = `inset 0 0 120px rgba(255,0,0,${a})`;
  } else {
    vignette.style.boxShadow = 'inset 0 0 100px rgba(255,0,0,0)';
  }

  // 楼层标题
  if(floorTitleTimer > 0){
    floorTitleTimer--;
    const el = document.getElementById('floor-title');
    if(!el.classList.contains('show')) el.classList.add('show');
    const name = getFloorName(floor);
    el.innerHTML = `${name}<small>第 ${floor} 层</small>`;
    if(floorTitleTimer <= 0) el.classList.remove('show');
  }

  // Boss 警告
  const bossEl = document.getElementById('boss-warning');
  if(bossWarning && floor % 5 === 0 && !gameOver){
    bossEl.classList.add('show');
  } else {
    bossEl.classList.remove('show');
  }
}

// ============================================================
// HUD 更新（DOM overlay，替代 2D Canvas 上绘制的 HUD）
// ============================================================
function updateHUD3D(){
  if(!player) return;
  const ratio = player.hp / player.maxHp;
  const pct = Math.max(0, ratio * 100);
  const fill = document.getElementById('hp-bar-fill');
  fill.style.width = pct + '%';
  fill.className = pct > 60 ? '' : pct > 30 ? 'mid' : 'low';
  document.getElementById('hp-text').textContent = `${player.hp}/${player.maxHp}`;
  document.getElementById('hud-level').textContent = player.level;
  document.getElementById('hud-floor').textContent = floor;
  document.getElementById('hud-kills').textContent = kills;
  document.getElementById('hud-atk').textContent = player.atk;
  document.getElementById('hud-def').textContent = player.def;
  document.getElementById('hud-gold').textContent = player.gold;
  document.getElementById('hud-bombs').textContent = player.bombs || 0;
  document.getElementById('hud-curse').textContent = floorCurse ? ('咒: ' + floorCurse.name) : '';

  // 技能栏
  const skillBar = document.getElementById('skill-bar');
  let html = '';
  for(const slot of skillSlots){
    if(!slot.unlocked) continue;
    const onCd = slot.cdMax > 0 && slot.cd > 0;
    html += `<div class="skill-icon ${onCd ? '' : 'ready'}" style="border-color:${onCd?'rgba(255,255,255,0.15)':slot.color}">`;
    html += `<span class="si-icon">${slot.icon}</span>`;
    html += `<span class="si-key">${slot.key}</span>`;
    if(onCd){
      html += `<div class="si-cd">${Math.ceil(slot.cd / 60)}s</div>`;
    }
    html += '</div>';
  }
  skillBar.innerHTML = html;
}

// ============================================================
// 楼层切换 hook（game.js 的 initFloor 后调用）
// ============================================================
const _origInitFloor = initFloor;
initFloor = function(){
  _origInitFloor();
  if(scene3d) buildFloor3D();
  lastEntitySnapshot = '';
  lastItemSnapshot = '';
};

// ============================================================
// 读档 hook（loadGame 后重建场景）
// ============================================================
const _origLoadGame = loadGame;
loadGame = function(){
  const r = _origLoadGame();
  if(r && scene3d) buildFloor3D();
  return r;
};
