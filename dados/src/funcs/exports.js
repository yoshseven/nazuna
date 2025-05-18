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
    return undefined;
  }
}

/**
 * Tenta carregar um módulo remoto com até 5 tentativas e intervalo de 500ms
 * @param {string} url - URL do módulo
 * @param {string} moduleName - Nome do módulo para logging
 * @returns {Object|undefined} - Módulo carregado ou undefined em caso de erro
 */
async function loadRemoteModuleWithRetry(url, moduleName, maxRetries = 5, retryInterval = 500) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const module = await requireRemote(url);
      return module;
    } catch (error) {
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, retryInterval));
      } else {
        return {};
      }
    }
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
  Lyrics: 'https://raw.githubusercontent.com/hiudyy/nazuna-funcs/refs/heads/main/funcs/downloads/lyrics.js',
  mcPlugin: 'https://raw.githubusercontent.com/hiudyy/nazuna-funcs/refs/heads/main/funcs/downloads/mcplugins.js',
  FilmesDL: 'https://raw.githubusercontent.com/hiudyy/nazuna-funcs/refs/heads/main/funcs/downloads/filmes.js',
  apkMod: 'https://raw.githubusercontent.com/hiudyy/nazuna-funcs/refs/heads/main/funcs/downloads/apkmod.js',
  tictactoe: 'https://raw.githubusercontent.com/hiudyy/nazuna-funcs/refs/heads/main/funcs/games/tictactoe.js',
  rpg: 'https://raw.githubusercontent.com/hiudyy/nazuna-funcs/refs/heads/main/funcs/games/rpg.js'
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
    // Carrega todos os módulos de download em paralelo com retry
    const downloadPromises = Object.entries(downloadModuleUrls).map(async ([key, url]) => {
      modules[key] = await loadRemoteModuleWithRetry(url, key);
      modules[key] = modules[key].default ? modules[key].default : modules[key]
    });

    // Carrega os JSONs
    const jsonPromises = [
      loadJson(path.join(jsonDir, 'tools.json'), 'tools.json').then(data => ({ toolsJson: data })),
      loadJson(path.join(jsonDir, 'vab.json'), 'vab.json').then(data => ({ vabJson: data }))
    ];

    // Aguarda o carregamento de todos os módulos e JSONs
    await Promise.all([...downloadPromises, ...jsonPromises]);

    // Extrai os JSONs carregados
    const toolsJson = (await jsonPromises[0]).toolsJson;
    const vabJson = (await jsonPromises[1]).vabJson;

    return {
      reportError,
      ...modules,
      sendSticker,
      styleText,
      emojiMix,
      upload,
      toolsJson: () => toolsJson,
      vabJson: () => vabJson
    };
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Erro na inicialização:`, error.message);
    console.log(`[${new Date().toISOString()}] Retornando valores padrão após falha`);
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
      vabJson: () => undefined,
      Lyrics: () => undefined
    };
  }
})();