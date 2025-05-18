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
  youtube: 'https://raw.githubusercontent.com/hiudyy/nazuna-funcs/refs/heads/main/funcs/downloads/youtube.js',
  tiktok: 'https://raw.githubusercontent.com/hiudyy/nazuna-funcs/refs/heads/main/funcs/downloads/tiktok.js',
  pinterest: 'https://raw.githubusercontent.com/hiudyy/nazuna-funcs/refs/heads/main/funcs/downloads/pinterest.js',
  igdl: 'https://raw.githubusercontent.com/hiudyy/nazuna-funcs/refs/heads/main/funcs/downloads/igdl.js',
  mcPlugin: 'https://raw.githubusercontent.com/hiudyy/nazuna-funcs/refs/heads/main/funcs/downloads/mcplugins.js',
  FilmesDL: 'https://raw.githubusercontent.com/hiudyy/nazuna-funcs/refs/heads/main/funcs/downloads/filmes.js',
  apkMod: 'https://raw.githubusercontent.com/hiudyy/nazuna-funcs/refs/heads/main/funcs/downloads/apkmod.js'
};

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

// Inicialização
module.exports = (async () => {
  // Carregamento assíncrono dos módulos de download
  const modules = {
    youtube: undefined,
    tiktok: undefined,
    pinterest: undefined,
    igdl: undefined,
    mcPlugin: undefined,
    FilmesDL: undefined,
    apkMod: undefined
  };

  try {
    // Carrega todos os módulos de download em paralelo
    const downloadPromises = Object.entries(downloadModuleUrls).map(async ([key, url]) => {
      try {
        modules[key] = await requireRemote(url);
      } catch (error) {
        console.error(`[${new Date().toISOString()}] Erro ao carregar módulo ${key}:`, error.message);
        modules[key] = {};
      }
    });

    // Carrega os JSONs
    const jsonPromises = [
      loadJson(path.join(jsonDir, 'tools.json'), 'tools.json').then(data => ({ toolsJson: data })),
      loadJson(path.join(jsonDir, 'vab.json'), 'vab.json').then(data => ({ vabJson: data }))
    ];

    // Aguarda o carregamento de todos os módulos e JSONs
    await Promise.all([...downloadPromises, ...jsonPromises]);

    // Extrai os JSONs carregados
    const toolsJson = jsonPromises[0].then(data => data.toolsJson);
    const vabJson = jsonPromises[1].then(data => data.vabJson);

    return {
      reportError,
      ...modules,
      sendSticker,
      styleText,
      emojiMix,
      upload,
      tictactoe,
      rpg,
      toolsJson: () => toolsJson,
      vabJson: () => vabJson
    };
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Erro na inicialização:`, error.message);
    return {
      reportError,
      youtube: {},
      tiktok: {},
      pinterest: {},
      igdl: {},
      mcPlugin: {},
      FilmesDL: {},
      apkMod: {},
      sendSticker,
      styleText,
      emojiMix,
      upload,
      tictactoe,
      rpg,
      toolsJson: () => undefined,
      vabJson: () => undefined
    };
  }
})();