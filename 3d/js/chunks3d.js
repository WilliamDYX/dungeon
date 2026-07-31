// chunks3d.js - 3D 区块系统：构建玩家 20×20 视野窗口内的全部地形 + 已探索记忆区域
// 每帧更新：窗口内所有房间/走廊都构建；窗口外已探索过的区块也保留构建。无需整层重建。

const CHUNK_SIZE = 8;       // 每块边长（tile 数）
const VIEW_TILES = 10;      // 视野窗口半宽：玩家为中心 ±10 格（20×20 正方形）

// key "cx,cy" -> { cx, cy, meshes: [], lights: [] }
let chunks = new Map();

function chunkOfTile(tx, ty){
  return { cx: Math.floor(tx / CHUNK_SIZE), cy: Math.floor(ty / CHUNK_SIZE) };
}
function chunkKey(cx, cy){ return cx + ',' + cy; }

// 某块内是否已存在已探索格（决定是否值得构建）
function chunkHasExplored(cx, cy){
  const x0 = cx * CHUNK_SIZE, y0 = cy * CHUNK_SIZE;
  const x1 = Math.min(MAP_W, x0 + CHUNK_SIZE), y1 = Math.min(MAP_H, y0 + CHUNK_SIZE);
  for(let y = y0; y < y1; y++){
    const row = explored[y];
    if(!row) continue;
    for(let x = x0; x < x1; x++) if(row[x]) return true;
  }
  return false;
}

// 区块的 tile 范围是否与玩家为中心的 20×20 窗口相交
function chunkInView(cx, cy, px, py){
  const c0 = Math.max(0, px - VIEW_TILES);
  const c1 = Math.min(MAP_W - 1, px + VIEW_TILES);
  const r0 = Math.max(0, py - VIEW_TILES);
  const r1 = Math.min(MAP_H - 1, py + VIEW_TILES);
  const x0 = cx * CHUNK_SIZE, y0 = cy * CHUNK_SIZE;
  const x1 = Math.min(MAP_W, x0 + CHUNK_SIZE), y1 = Math.min(MAP_H, y0 + CHUNK_SIZE);
  return x0 < c1 && x1 > c0 && y0 < r1 && y1 > r0;
}

// 构建一个区块的地形（地板/墙壁/楼梯）+ 该范围内的装饰物
function buildChunkMesh(cx, cy){
  const key = chunkKey(cx, cy);
  if(chunks.has(key)) return;
  const entry = { cx, cy, meshes: [], lights: [] };
  const x0 = cx * CHUNK_SIZE, y0 = cy * CHUNK_SIZE;
  const x1 = Math.min(MAP_W, x0 + CHUNK_SIZE), y1 = Math.min(MAP_H, y0 + CHUNK_SIZE);

  for(let y = y0; y < y1; y++){
    for(let x = x0; x < x1; x++){
      const tile = map[y][x];
      const wx = x * CELL, wz = y * CELL;

      if(tile === T_WALL){
        const mat = (tileY(x, y) % 2 === 0) ? MAT.wall : MAT.wall2;
        const m = new THREE.Mesh(GEO.wallBox, mat);
        m.position.set(wx, (WALL_H + CELL) / 2, wz); // 墙加高一格，顶到天花板
        m.castShadow = true;
        m.receiveShadow = true;
        scene3d.add(m);
        wallMeshes.push(m);
        entry.meshes.push(m);
      } else {
        let fmat = MAT.floor;
        if(tile === T_CARPET) fmat = MAT.floorCarpet;
        else if(tile === T_WATER) fmat = MAT.water;
        const fm = new THREE.Mesh(GEO.floor, fmat);
        fm.rotation.x = -Math.PI / 2;
        fm.position.set(wx, 0, wz);
        fm.receiveShadow = true;
        scene3d.add(fm);
        floorMeshes.push(fm);
        entry.meshes.push(fm);

        if(tile === T_STAIRS){
          if(stairsMesh) scene3d.remove(stairsMesh);
          stairsMesh = new THREE.Mesh(GEO.stairs, MAT.stairs);
          stairsMesh.rotation.x = -Math.PI / 2;
          stairsMesh.position.set(wx, 0.02, wz);
          scene3d.add(stairsMesh);
          entry.meshes.push(stairsMesh);
        }
      }
    }
  }

  // 天花板：整个区块一块大平面（罩在墙上，遮挡雾效/天空）
  // 每边略微外扩 0.1 单位，避免相邻区块之间出现缝隙（同材质重叠无可见伪影）
  // 纹理与墙壁同步：按区块 tile 数重复墙像素图（每格一份）
  const cw = (x1 - x0) * CELL + 0.2, ch = (y1 - y0) * CELL + 0.2;
  let cmat = MAT.ceiling;
  if(cmat && cmat.clone){
    cmat = cmat.clone();
    if(cmat.map && cmat.map.clone){
      cmat.map = cmat.map.clone();
      cmat.map.wrapS = THREE.RepeatWrapping;
      cmat.map.wrapT = THREE.RepeatWrapping;
      cmat.map.repeat.set(x1 - x0, y1 - y0);
      cmat.map.needsUpdate = true;
      if(cmat.emissiveMap) cmat.emissiveMap = cmat.map;
    }
  }
  const ceil = new THREE.Mesh(
    new THREE.PlaneGeometry(cw, ch),
    cmat
  );
  ceil.rotation.x = Math.PI / 2;   // 法线朝下（-Y），从室内可见
  // 天花板比墙顶高一格（WALL_H + CELL），给跳跃留出竖向空间
  ceil.position.set((x0 + x1) / 2 * CELL, WALL_H + CELL, (y0 + y1) / 2 * CELL);
  scene3d.add(ceil);
  entry.meshes.push(ceil);

  // 该块内的装饰物（火炬/雕像/祭坛等）
  for(const item of items){
    if(item.x < x0 || item.x >= x1 || item.y < y0 || item.y >= y1) continue;
    if(!isDecorType(item.type)) continue;
    const mesh = buildDecorMesh(item);
    if(!mesh) continue;
    scene3d.add(mesh);
    decorMeshes.push(mesh);
    entry.meshes.push(mesh);
    if(mesh.userData.light) entry.lights.push(mesh.userData.light);
  }

  chunks.set(key, entry);
}

// 更新：每帧构建玩家 20×20 视野窗口内的全部地形 + 已探索记忆区域
// - 窗口内：所有房间/走廊都构建，3D 世界显得完整
// - 窗口外但已探索：保留为记忆（走进过就一直在）
// 已构建的区块永不卸载，走到哪里就补建到哪里。
function updateChunks3D(){
  if(!player) return;
  const px = player.x, py = player.y;
  const maxCx = Math.floor((MAP_W - 1) / CHUNK_SIZE);
  const maxCy = Math.floor((MAP_H - 1) / CHUNK_SIZE);
  for(let cy = 0; cy <= maxCy; cy++){
    for(let cx = 0; cx <= maxCx; cx++){
      if(chunkHasExplored(cx, cy) || chunkInView(cx, cy, px, py)){
        buildChunkMesh(cx, cy);
      }
    }
  }
}

// 清空所有区块（楼层重建时调用）
function clearChunks3D(){
  for(const entry of chunks.values()){
    for(const m of entry.meshes) scene3d.remove(m);
    for(const l of entry.lights) scene3d.remove(l);
  }
  chunks.clear();
  floorMeshes = [];
  wallMeshes = [];
  decorMeshes = [];
  stairsMesh = null;
}
