const fs = require('fs');
const path = require('path');

// Caminho do arquivo de banco de dados de golds
const GOLD_DB_FILE = path.resolve(__dirname, '../../../database/golds.json');

// Garante que o arquivo exista
function ensureDb() {
  if (!fs.existsSync(GOLD_DB_FILE)) {
    fs.mkdirSync(path.dirname(GOLD_DB_FILE), { recursive: true });
    fs.writeFileSync(GOLD_DB_FILE, JSON.stringify({ users: {}, lastMine: {} }, null, 2));
  }
}

function loadDb() {
  ensureDb();
  return JSON.parse(fs.readFileSync(GOLD_DB_FILE, 'utf-8'));
}

function saveDb(data) {
  fs.writeFileSync(GOLD_DB_FILE, JSON.stringify(data, null, 2));
}

function getGold(userId) {
  const db = loadDb();
  return db.users[userId] || 0;
}

function addGold(userId, amount) {
  const db = loadDb();
  db.users[userId] = (db.users[userId] || 0) + amount;
  saveDb(db);
}

function removeGold(userId, amount) {
  const db = loadDb();
  db.users[userId] = Math.max(0, (db.users[userId] || 0) - amount);
  saveDb(db);
}

// Interface pública esperada pelo index.js legado -------------------------
function AddGold(qtd, alvo) {
  const amt = parseInt(qtd);
  if (isNaN(amt) || amt <= 0) return '❌ Quantidade inválida';
  addGold(alvo, amt);
  return `✅ Adicionado *${amt}* gold(s) para @${alvo.split('@')[0]}`;
}

function TirarGold(qtd, alvo) {
  const amt = parseInt(qtd);
  if (isNaN(amt) || amt <= 0) return '❌ Quantidade inválida';
  removeGold(alvo, amt);
  return `✅ Removido *${amt}* gold(s) de @${alvo.split('@')[0]}`;
}

function ConsultarGold(alvo) {
  const saldo = getGold(alvo);
  return `💰 @${alvo.split('@')[0]} tem *${saldo}* gold(s).`;
}

// Sistema de mineração -----------------------------------------------------
function MinerarGold(userId, cooldownMs = 30 * 60 * 1000) {
  const db = loadDb();
  db.lastMine = db.lastMine || {};
  const now = Date.now();
  const last = db.lastMine[userId] || 0;
  if (now - last < cooldownMs) {
    const restante = Math.ceil((cooldownMs - (now - last)) / 60000);
    return { success: false, message: `⏳ Espere *${restante}* minuto(s) para minerar novamente.` };
  }
  const ganho = Math.floor(Math.random() * 6) + 5; // 5-10
  addGold(userId, ganho);
  db.lastMine[userId] = now;
  saveDb(db);
  return { success: true, amount: ganho };
}

// Sistema de roubo ---------------------------------------------------------
function RoubarGold(ladraoId, vitimaId) {
  if (ladraoId === vitimaId) {
    return { success: false, message: '❌ Você não pode roubar de si mesmo.' };
  }
  const vitimaSaldo = getGold(vitimaId);
  if (vitimaSaldo < 1) {
    return { success: false, message: `😕 @${vitimaId.split('@')[0]} não tem gold para roubar.`, target: vitimaId };
  }
  const chance = Math.random();
  const quantidade = Math.max(1, Math.floor(Math.random() * Math.min(50, vitimaSaldo)));
  if (chance < 0.5) {
    // Falhou – ladrao perde gold se tiver
    const perda = Math.min(quantidade, getGold(ladraoId));
    removeGold(ladraoId, perda);
    addGold(vitimaId, perda);
    return {
      success: false,
      message: `🚨 Roubo falhou! Você perdeu *${perda}* gold(s) para @${vitimaId.split('@')[0]}!`,
      target: vitimaId
    };
  }
  // Sucesso
  removeGold(vitimaId, quantidade);
  addGold(ladraoId, quantidade);
  return {
    success: true,
    message: `🏴‍☠️ Você roubou *${quantidade}* gold(s) de @${vitimaId.split('@')[0]}!`,
    target: vitimaId
  };
}

module.exports = {
  AddGold,
  TirarGold,
  ConsultarGold,
  MinerarGold,
  RoubarGold,
  getGold
};