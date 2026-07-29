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
let playerSkills = {fireball:false,heal:false};

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
let bossDefeated = false;
let realtimeTick = 0;

// ★★★ 技能冷却系统 ★★★
let fireballCd = 0;
const fireballCdMax = 120; // 2秒 @ 60fps = 120帧
let healCd = 0;
const healCdMax = 900;     // 15秒 @ 60fps = 900帧

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
