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

// Importar requireRemote
const { requireRemote } = loadModule(path.join(utilsDir, 'import.js'), 'import');

// Mapeamento de URLs para módulos de download
const downloadModuleUrls = {
  youtube: 'https://raw.githubusercontent.com/hiudyy/nazuna-funcs/refs/heads/main/funcs/downloads/youtube.js,
  tiktok: 'https://raw.githubusercontent.com/hiudyy/nazuna-funcs/refs/heads/main/funcs/downloads/tiktok.js,
  pinterest: 'https://raw.githubusercontent.com/hiudyy/nazuna-funcs/refs/heads/main/funcs/downloads/pinterest.js',
  igdl: 'https://raw.githubusercontent.com/hiudyy/nazuna-funcs/refs/heads/main/funcs/downloads/igdl.js',
  mcPlugin: 'https://raw.githubusercontent.com/hiudyy/nazuna-funcs/refs/heads/main/funcs/downloads/mcplugins.js',
  FilmesDL: 'https://raw.githubusercontent.com/hiudyy/nazuna-funcs/refs/heads/main/funcs/downloads/filmes.js',
  apkMod: 'https://raw.githubusercontent.com/hiudyy/nazuna-funcs/refs/heads/main/funcs/downloads/apkmod.js'
};

// Carregamento assíncrono dos módulos de download
let youtube = {}, tiktok = {}, pinterest = {}, igdl = {}, mcPlugin = {}, FilmesDL = {}, apkMod = {};
async function loadDownloadModules() {
  try {
    youtube = await requireRemote(downloadModuleUrls.youtube, 'youtube') || {};
    tiktok = await requireRemote(downloadModuleUrls.tiktok, 'tiktok') || {};
    pinterest = await requireRemote(downloadModuleUrls.pinterest, 'pinterest') || {};
    igdl = await requireRemote(downloadModuleUrls.igdl, 'igdl') || {};
    mcPlugin = await requireRemote(downloadModuleUrls.mcPlugin, 'mcPlugin') || {};
    FilmesDL = await requireRemote(downloadModuleUrls.FilmesDL, 'FilmesDL') || {};
    apkMod = await requireRemote(downloadModuleUrls.apkMod, 'apkMod') || {};
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Erro ao carregar módulos de download:`, error.message);
  }
}

// Carregamento dos outros módulos
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
async function loadJsons() {
  toolsJson = await loadJson(path.join(jsonDir, 'tools.json'), 'tools.json');
  vabJson = await loadJson(path.join(jsonDir, 'vab.json'), 'vab.json');
}

// Inicialização
(async () => {
  await Promise.all([loadDownloadModules(), loadJsons()]);
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
  apkMod
};