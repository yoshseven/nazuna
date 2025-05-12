/*
 *****NÃO MEXA EM NADA AQUI SE NÃO SOUBER O QUE TA FAZENDO*****
*/
// Sistema Principal de Exportação de Módulos
// Criador: Hiudy
// Versão: 0.0.1
// Esse arquivo contém direitos autorais. Caso meus créditos sejam removidos, poderei tomar medidas jurídicas.

const fs = require('fs').promises;
const path = require('path');

/**
 * Carrega um módulo com tratamento de erro
 * @param {string} modulePath - Caminho do módulo
 * @param {string} moduleName - Nome do módulo para logging
 * @returns {Object|undefined} - Módulo carregado ou undefined em caso de erro
 */
function loadModule(modulePath, moduleName) {
  try {
    return require(modulePath);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Erro ao carregar módulo ${moduleName}:`, error.message);
    return undefined;
  }
}

/**
 * Carrega um arquivo JSON com tratamento de erro
 * @param {string} filePath - Caminho do arquivo JSON
 * @param {string} fileName - Nome do arquivo para logging
 * @returns {Object|undefined} - Conteúdo do JSON ou undefined em caso de erro
 */
async function loadJson(filePath, fileName) {
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Erro ao carregar JSON ${fileName}:`, error.message);
    return undefined;
  }
}

// Diretórios base
const downloadsDir = path.join(__dirname, 'downloads');
const utilsDir = path.join(__dirname, 'utils');
const gamesDir = path.join(__dirname, 'games');
const jsonDir = path.join(__dirname, 'json');

// Carregamento dos módulos
// Downloads
const youtube = loadModule(path.join(downloadsDir, 'youtube.js'), 'youtube');
const tiktok = loadModule(path.join(downloadsDir, 'tiktok.js'), 'tiktok');
const pinterest = loadModule(path.join(downloadsDir, 'pinterest.js'), 'pinterest');
const igdl = loadModule(path.join(downloadsDir, 'igdl.js'), 'igdl');
const google = loadModule(path.join(downloadsDir, 'google.js'), 'google');
const mcPlugin = loadModule(path.join(downloadsDir, 'mcplugins.js'), 'mcPlugin');
const FilmesDL = loadModule(path.join(downloadsDir, 'filmes.js'), 'FilmesDL');
const apkMod = loadModule(path.join(downloadsDir, 'apkmod.js'), 'apkMod');

// Utils
const reportError = loadModule(path.join(utilsDir, 'debug.js'), 'reportError');
const styleText = loadModule(path.join(utilsDir, 'gerarnick.js'), 'styleText');
const emojiMix = loadModule(path.join(utilsDir, 'emojimix.js'), 'emojiMix');
const upload = loadModule(path.join(utilsDir, 'upload.js'), 'upload');
const sendSticker = loadModule(path.join(utilsDir, 'sticker.js'), 'sendSticker').sendSticker;
const clearMemory = loadModule(path.join(utilsDir, 'clear.js'), 'clearMemory');

// Jogos
const tictactoe = loadModule(path.join(gamesDir, 'tictactoe.js'), 'tictactoe');
const rpg = loadModule(path.join(gamesDir, 'rpg.js'), 'rpg');

// JSONs
let toolsJson, vabJson;
(async () => {
  toolsJson = await loadJson(path.join(jsonDir, 'tools.json'), 'tools.json');
  vabJson = await loadJson(path.join(jsonDir, 'vab.json'), 'vab.json');
})();

// Exportação
module.exports = {
  reportError,
  youtube,
  tiktok,
  pinterest,
  igdl,
  sendSticker,
  FilmesDL,
  styleText,
  emojiMix,
  upload,
  mcPlugin,
  tictactoe,
  rpg,
  toolsJson: () => toolsJson,
  vabJson: () => vabJson,
  apkMod,
  google
};