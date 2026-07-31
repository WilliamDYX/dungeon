// config.js - 常量、全局状态、安全存储封装（SAFE_STORE）、诅咒数据

// ============================================================
// SHADOW DUNGEON - 暗影地牢 (Pixel Roguelike)
// ============================================================

const TILE = 32;
const COLS = 25;
const ROWS = 20;
const MAP_W = 48;
const MAP_H = 36;

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

const T_WALL = 0;
const T_FLOOR = 1;
const T_STAIRS = 2;
const T_WATER = 3;
const T_CARPET = 4;

let map = [], explored = [], visible = [];
let entities = [], items = [], particles = [], floatTexts = [], projectiles = [];
let slashEffects = [];
let rooms = [], player = null;
let gameOver = false, floor = 1, kills = 0, turnCount = 0;
let animTime = 0;
let screenShake = 0, damageFlash = 0;
let floorTitleTimer = 0;
let msgHistory = [];
let enemyIdCounter = 0;
let actionDelay = 0;
let npcs = [];
let shopOpen = false;
let currentShop = null;
let skillSlots = [
  {id:'chainlightning',name:'闪电链',key:'1',icon:'⚡',color:'#ffd740',cd:0,cdMax:180,unlocked:true,desc:'闪电链弹跳5格',effect:null},
  {id:'frostnova',name:'冰霜新星',key:'2',icon:'❄',color:'#81d4fa',cd:0,cdMax:480,unlocked:true,desc:'冻结周围敌人1.5秒',effect:null},
  {id:'lifedrain',name:'生命汲取',key:'3',icon:'💜',color:'#ce93d8',cd:0,cdMax:300,unlocked:true,desc:'远程攻击并吸血',effect:null},
  {id:'whirlwind',name:'旋风斩',key:'Q',icon:'⚔',color:'#42a5f5',cd:0,cdMax:0,unlocked:true,desc:'近战范围攻击',effect:null},
  {id:'fireball',name:'火球术',key:'R',icon:'🔥',color:'#ff6f00',cd:0,cdMax:900,unlocked:false,desc:'发射爆炸火球（15秒CD）',effect:null},
  {id:'heal',name:'治愈术',key:'T',icon:'✚',color:'#66bb6a',cd:0,cdMax:900,unlocked:false,desc:'恢复50%生命',effect:null},
];
function getSkillIndex(id){for(let i=0;i<skillSlots.length;i++){if(skillSlots[i].id===id)return i;}return -1;}
function isSkillOwned(id){const i=getSkillIndex(id);return i>=0&&skillSlots[i].unlocked;}

// ★★★ 安全存储层（兼容 file:// 协议） ★★★
// file:// 下 localStorage 可能抛 SecurityError 或不可用，这里做安全封装，
// 不可用时自动降级到内存存储，保证游戏不会崩溃。
const SAFE_STORE = (() => {
  let mem = {};
  let lsOk = false;
  try { lsOk = !!window.localStorage; } catch (e) { lsOk = false; }
  return {
    available: lsOk,
    get(key) {
      if (lsOk) { try { return window.localStorage.getItem(key); } catch (e) {} }
      return (key in mem) ? mem[key] : null;
    },
    set(key, val) {
      if (lsOk) { try { window.localStorage.setItem(key, val); return; } catch (e) {} }
      mem[key] = val;
    },
    remove(key) {
      if (lsOk) { try { window.localStorage.removeItem(key); return; } catch (e) {} }
      delete mem[key];
    }
  };
})();

const SAVE_KEY = 'ds_save_v1';
let soulShards = parseInt(SAFE_STORE.get('ds_souls')||'0');
let soulBonusAtk = parseInt(SAFE_STORE.get('ds_bonusAtk')||'0');
let soulBonusDef = parseInt(SAFE_STORE.get('ds_bonusDef')||'0');
let soulBonusHp = parseInt(SAFE_STORE.get('ds_bonusHp')||'0');
// 已读过的剧情卷轴 id（持久化，每个玩家读到的内容不同）
let readLoreIds = [];
try { const r=SAFE_STORE.get('ds_readLore'); if(r) readLoreIds=JSON.parse(r); } catch(e){ readLoreIds=[]; }
let bossDefeated = false;
// 是否已触发堕天使隐藏剧情(击败后逃出地牢)。持久化：每个玩家只能触发一次结局
let fallenAngelUnlocked = false;
try { fallenAngelUnlocked = SAFE_STORE.get('ds_fallenAngel')==='1'; } catch(e){}
let realtimeTick = 0;

// ★★★ 箭矢射击冷却系统（main 分支原有 F 射击）★★★
let arrowCd = 0;
const arrowCdMax = 45;     // 0.75秒 @ 60fps = 45帧


const hud={hp:30,maxHp:30,hpPct:100,floor:1,kills:0,atk:6,def:2,level:1,gold:0,bombs:0,curse:''};

const CURSES=[
  {id:'darkness',name:'黑暗笼罩',desc:'视野减半',effect:()=>{}},
  {id:'frailty',name:'虚弱诅咒',desc:'攻击力-3',effect:()=>{}},
  {id:'poison_air',name:'毒雾弥漫',desc:'每移动5步损失1HP',effect:()=>{}},
  {id:'bloodlust',name:'血怒诅咒',desc:'怪物攻击+3',effect:()=>{}},
  {id:'heaviness',name:'沉重枷锁',desc:'闪避无效，防御-2',effect:()=>{}},
];

let floorCurse = null;
let curseStepCounter = 0;
let poisonMaskActive = false;

// ★ 调试模式开关 ★
let debugInvincible = false;   // 8: 无敌
let debugInstakill = false;    // 7: 秒杀怪物
