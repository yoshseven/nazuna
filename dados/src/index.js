// ====================
// Nazuna Bot - Index principal
// Criado por: Hiudy
// Versão: 3.0.0
// ====================

// Importações principais
const { downloadContentFromMessage, getAggregateVotesInPollMessage } = require('baileys');
const { exec, spawn, execSync } = require('child_process');
const axios = require('axios');
const pathz = require('path');
const fs = require('fs');
const os = require('os');

// Carrega a versão do bot do package.json
const { version: botVersion } = JSON.parse(fs.readFileSync(pathz.join(__dirname, '..', '..', 'package.json')));

// Importa os menus
const { menu, menudown, menuadm, menubn, menuDono, menuMembros, menuFerramentas, menuSticker, menuIa, menuRpg, menuAlterador, menuLogos, menuTopCmd } = require(`${__dirname}/menus/index.js`);

// Carrega as configurações do bot
const config = JSON.parse(fs.readFileSync(__dirname+'/config.json'));
const { numerodono, nomedono, nomebot, prefixo, debug } = config;
const prefix = prefixo; // Alias para compatibilidade

// Inicialização de diretórios e arquivos necessários
const DATABASE_DIR = __dirname + '/../database';
const GRUPOS_DIR = DATABASE_DIR + '/grupos';
const USERS_DIR = DATABASE_DIR + '/users';
const DONO_DIR = DATABASE_DIR + '/dono';

/**
 * Formata o tempo de atividade em uma string legível
 * @param {number} seconds - Tempo em segundos
 * @param {boolean} [longFormat=false] - Se true, usa formato longo (ex: "2 dias, 5 horas")
 * @param {boolean} [showZero=false] - Se true, mostra unidades zeradas
 * @returns {string} - Tempo formatado (ex: "2d 5h 30m 10s" ou "2 dias, 5 horas, 30 minutos, 10 segundos")
 */
function formatUptime(seconds, longFormat = false, showZero = false) {
  // Calcula as unidades de tempo
  const d = Math.floor(seconds / (24 * 3600));
  const h = Math.floor((seconds % (24 * 3600)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  
  // Define os formatos para cada unidade
  const formats = longFormat 
    ? {
        d: (val) => `${val} ${val === 1 ? 'dia' : 'dias'}`,
        h: (val) => `${val} ${val === 1 ? 'hora' : 'horas'}`,
        m: (val) => `${val} ${val === 1 ? 'minuto' : 'minutos'}`,
        s: (val) => `${val} ${val === 1 ? 'segundo' : 'segundos'}`
      }
    : {
        d: (val) => `${val}d`,
        h: (val) => `${val}h`,
        m: (val) => `${val}m`,
        s: (val) => `${val}s`
      };
  
  // Constrói a string de tempo
  const uptimeStr = [];
  
  if (d > 0 || showZero) uptimeStr.push(formats.d(d));
  if (h > 0 || showZero) uptimeStr.push(formats.h(h));
  if (m > 0 || showZero) uptimeStr.push(formats.m(m));
  if (s > 0 || showZero) uptimeStr.push(formats.s(s));
  
  // Retorna a string formatada ou "0s" se vazia
  return uptimeStr.length > 0 
    ? uptimeStr.join(longFormat ? ', ' : ' ') 
    : (longFormat ? '0 segundos' : '0s');
}

 /**
  * Normaliza um texto removendo acentos
  * @param {string} texto - Texto a ser normalizado
  * @returns {string} - Texto normalizado
  */
 /**
 * Normaliza um texto removendo acentos e convertendo para minúsculas
 * @param {string} texto - Texto a ser normalizado
 * @param {boolean} [keepCase=false] - Se true, mantém maiúsculas/minúsculas
 * @returns {string} - Texto normalizado
 */
const normalizar = (texto, keepCase = false) => {
  if (!texto || typeof texto !== 'string') return '';
  
  // Remove acentos
  const normalizedText = texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  
  // Converte para minúsculas se necessário
  return keepCase ? normalizedText : normalizedText.toLowerCase();
};

/**
 * Garante que um diretório existe, criando-o se necessário
 * @param {string} dirPath - Caminho do diretório
 * @returns {boolean} - true se o diretório já existia ou foi criado com sucesso
 */
function ensureDirectoryExists(dirPath) {
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`✅ Diretório criado: ${dirPath}`);
    }
    return true;
  } catch (error) {
    console.error(`❌ Erro ao criar diretório ${dirPath}:`, error);
    return false;
  }
}

/**
 * Garante que um arquivo JSON existe, criando-o com conteúdo padrão se necessário
 * @param {string} filePath - Caminho do arquivo JSON
 * @param {object} defaultContent - Conteúdo padrão caso o arquivo precise ser criado
 * @returns {boolean} - true se o arquivo já existia ou foi criado com sucesso
 */
function ensureJsonFileExists(filePath, defaultContent = {}) {
  try {
    if (!fs.existsSync(filePath)) {
      // Garante que o diretório pai existe
      const dirPath = pathz.dirname(filePath);
      ensureDirectoryExists(dirPath);
      
      // Cria o arquivo com conteúdo padrão
      fs.writeFileSync(filePath, JSON.stringify(defaultContent, null, 2));
      console.log(`✅ Arquivo JSON criado: ${filePath}`);
    }
    return true;
  } catch (error) {
    console.error(`❌ Erro ao criar arquivo JSON ${filePath}:`, error);
    return false;
  }
}

// Cria diretórios necessários
ensureDirectoryExists(GRUPOS_DIR);
ensureDirectoryExists(USERS_DIR);
ensureDirectoryExists(DONO_DIR);

// Cria arquivos JSON necessários
ensureJsonFileExists(DATABASE_DIR + '/antiflood.json');
ensureJsonFileExists(DATABASE_DIR + '/cmdlimit.json');
ensureJsonFileExists(DATABASE_DIR + '/antipv.json');
ensureJsonFileExists(DONO_DIR + '/premium.json');
ensureJsonFileExists(DONO_DIR + '/bangp.json');
ensureJsonFileExists(DATABASE_DIR + '/globalBlocks.json', { commands: {}, users: {} });
ensureJsonFileExists(DATABASE_DIR + '/botState.json', { status: 'on' });

async function NazuninhaBotExec(nazu, info, store, groupCache) {
  // Importa funções utilitárias
  const { 
    reportError, youtube, tiktok, pinterest, igdl, sendSticker, 
    FilmesDL, styleText, emojiMix, upload, mcPlugin, tictactoe, 
    rpg, toolsJson, vabJson, apkMod, google, Lyrics, imageCustom,
    commandStats
  } = await require(__dirname+'/funcs/exports.js');
  
  // Carrega dados de configuração
  const loadJsonFile = (path, defaultValue = {}) => {
    try {
      return fs.existsSync(path) ? JSON.parse(fs.readFileSync(path, 'utf-8')) : defaultValue;
    } catch (error) {
      console.error(`Erro ao carregar arquivo ${path}:`, error);
      return defaultValue;
    }
  };
  
  // Carrega arquivos de configuração
  const antipvData = loadJsonFile(DATABASE_DIR + '/antipv.json');
  const premiumListaZinha = loadJsonFile(DONO_DIR + '/premium.json');
  const banGpIds = loadJsonFile(DONO_DIR + '/bangp.json');
  const antifloodData = loadJsonFile(DATABASE_DIR + '/antiflood.json');
  const cmdLimitData = loadJsonFile(DATABASE_DIR + '/cmdlimit.json');
  const globalBlocks = loadJsonFile(DATABASE_DIR + '/globalBlocks.json', { commands: {}, users: {} });
  const botState = loadJsonFile(DATABASE_DIR + '/botState.json', { status: 'on' });
  
  // Carrega ou inicializa o arquivo modolite.json
  const modoLiteFile = DATABASE_DIR + '/modolite.json';
  let modoLiteGlobal = loadJsonFile(modoLiteFile, { status: false });
  
  // Garante que o arquivo modolite.json existe
  if (!fs.existsSync(modoLiteFile)) {
    fs.writeFileSync(modoLiteFile, JSON.stringify(modoLiteGlobal, null, 2));
  }

  global.autoStickerMode = global.autoStickerMode || 'default';

try {
  // Informações básicas da mensagem
 const from = info.key.remoteJid;
  
  // Debug especial para grupo específico (apenas para desenvolvimento)
  if(from === "120363399806601633@g.us" && debug) {
    await nazu.sendMessage(from, {text: JSON.stringify(info, null, 2) });
  }
  
  // Verificações de segurança
  const isGroup = from?.endsWith('@g.us') || false;
 if(!info.key.participant && !info.key.remoteJid) return;
  
  // Identificação do remetente
  const sender = isGroup 
    ? (info.key.participant?.includes(':') 
       ? info.key.participant.split(':')[0] + '@s.whatsapp.net'
       : info.key.participant)
    : info.key.remoteJid;
  
  // Verificação de status broadcast
  const isStatus = from?.endsWith('@broadcast') || false;
  
  // Verificação de dono do bot
  const nmrdn = numerodono.replace(/[^\d]/g, "") + '@s.whatsapp.net';
  const isOwner = (nmrdn === sender) || info.key.fromMe;
 
 // Obtém o tipo de conteúdo da mensagem
 const baileys = require('baileys');
 const type = baileys.getContentType(info.message);
 
 // Flags para tipos de mídia
 const isMedia = (type === "imageMessage" || type === "videoMessage" || type === "audioMessage");
 const isImage = type === 'imageMessage';
 const isVideo = type === 'videoMessage';
 const isVisuU2 = type === 'viewOnceMessageV2';
 const isVisuU = type === 'viewOnceMessage';
 
 // Nome do usuário
 const pushname = info.pushName || '';
 
 // Extrai o corpo da mensagem de vários tipos possíveis
 const body = info.message?.conversation || 
             info.message?.viewOnceMessageV2?.message?.imageMessage?.caption || 
             info.message?.viewOnceMessageV2?.message?.videoMessage?.caption || 
             info.message?.imageMessage?.caption || 
             info.message?.videoMessage?.caption || 
             info.message?.extendedTextMessage?.text || 
             info.message?.viewOnceMessage?.message?.videoMessage?.caption || 
             info.message?.viewOnceMessage?.message?.imageMessage?.caption || 
             info.message?.documentWithCaptionMessage?.message?.documentMessage?.caption || 
             info.message?.editedMessage?.message?.protocolMessage?.editedMessage?.extendedTextMessage?.text || 
             info.message?.editedMessage?.message?.protocolMessage?.editedMessage?.imageMessage?.caption || 
             info?.text || '';
 
 // Processamento do texto da mensagem
 const args = body.trim().split(/ +/).slice(1);
 const q = args.join(' ');
 const budy2 = normalizar(body);
 
 // Informações de menção
 const menc_prt = info.message?.extendedTextMessage?.contextInfo?.participant;
 const menc_jid = args.join(" ").replace("@", "") + "@s.whatsapp.net";
 const menc_jid2 = info.message?.extendedTextMessage?.contextInfo?.mentionedJid;
 const menc_os2 = q.includes("@") ? menc_jid : menc_prt;
 const sender_ou_n = q.includes("@") ? menc_jid : (menc_prt || sender);

 // Verificação de comando e extração do comando
 const isCmd = body.trim().startsWith(prefix);
 const command = isCmd ? budy2.trim().slice(1).split(/ +/).shift().trim().replace(/\s+/g, '') : null;
 
 // SISTEMA DE ANTIPV - Controle de uso do bot em conversas privadas
 if (!isGroup) {
   // Modo antipv: ignora completamente mensagens privadas
   if (antipvData.mode === 'antipv' && !isOwner) {
     return;
   }
   
   // Modo antipv2: permite mensagens privadas, mas não comandos
   if (antipvData.mode === 'antipv2' && isCmd && !isOwner) {
     await reply('🚫 Este comando só funciona em grupos!');
     return;
   }
   
   // Modo antipv3: bloqueia usuários que tentam usar comandos no privado
   if (antipvData.mode === 'antipv3' && isCmd && !isOwner) {
  await nazu.updateBlockStatus(sender, 'block');
     await reply('🚫 Você foi bloqueado por usar comandos no privado!');
     return;
   }
 }

   // SISTEMA DE PREMIUM - Verifica se o usuário ou grupo tem status premium
 const isPremium = !!premiumListaZinha[sender] || !!premiumListaZinha[from] || isOwner;
 
  // SISTEMA DE BAN DE GRUPOS - Verifica se o grupo está banido
  if (isGroup && !!banGpIds[from] && !isOwner && !isPremium) {
    // Grupo banido e usuário não é premium nem dono
    return;
  }
 
   // INFORMAÇÕES DE GRUPO
  // Carrega metadados do grupo se estiver em um grupo
  const groupMetadata = !isGroup ? {} : await nazu.groupMetadata(from).catch(() => ({}));
  const groupName = isGroup && groupMetadata.subject ? groupMetadata.subject : '';
  const AllgroupMembers = !isGroup ? [] : groupMetadata.participants?.map(p => p.id) || [];
  const groupAdmins = !isGroup ? [] : groupMetadata.participants?.filter(p => p.admin).map(p => p.id) || [];
  
  // Informações do bot
  const botNumber = nazu.user.id.split(':')[0] + '@s.whatsapp.net';
  const isBotAdmin = !isGroup ? false : groupAdmins.includes(botNumber);
  
  // Carrega ou cria arquivo de dados do grupo
  const groupFile = pathz.join(__dirname, '..', 'database', 'grupos', `${from}.json`);
  let groupData = {};
  if (isGroup) {
    
    // Cria arquivo de grupo se não existir
    if (!fs.existsSync(groupFile)) {
      fs.writeFileSync(groupFile, JSON.stringify({ 
        mark: {},
        createdAt: new Date().toISOString(),
        groupName: groupName
      }, null, 2));
    }
    
    // Carrega dados do grupo
    try {
      groupData = JSON.parse(fs.readFileSync(groupFile));
    } catch (error) {
      console.error(`Erro ao carregar dados do grupo ${from}:`, error);
      groupData = { mark: {} };
    }
    
    // Garante que campos importantes existam
  groupData.moderators = groupData.moderators || [];
  groupData.allowedModCommands = groupData.allowedModCommands || [];
    groupData.mutedUsers = groupData.mutedUsers || {};
    
    // Atualiza o nome do grupo se mudou
    if (groupName && groupData.groupName !== groupName) {
      groupData.groupName = groupName;
      fs.writeFileSync(groupFile, JSON.stringify(groupData, null, 2));
    }
  }
  
  // Status do usuário no grupo
  const isGroupAdmin = !isGroup ? false : 
    groupAdmins.includes(sender) || 
    isOwner || 
    (groupData.moderators?.includes(sender) && groupData.allowedModCommands?.includes(command));
  
  // Configurações do grupo
  const isModoBn = !!groupData.modobrincadeira;
  const isOnlyAdmin = !!groupData.soadm;
  const isAntiPorn = !!groupData.antiporn;
  const isMuted = !!(groupData.mutedUsers && groupData.mutedUsers[sender]);
  const isAntiLinkGp = !!groupData.antilinkgp;
  const isModoRpg = isGroup && !!groupData.modorpg;
  
  // SISTEMA MODO LITE - Controle de conteúdo sensível
  const isModoLiteGlobal = modoLiteGlobal.status || false;
  const isModoLiteGrupo = isGroup && !!groupData.modolite;
  const isModoLite = (isModoLiteGrupo && !modoLiteGlobal.hasOwnProperty('forceOff')) || 
                    (isModoLiteGlobal && !groupData.hasOwnProperty('modoliteOff'));
  
  // VERIFICAÇÕES DE PERMISSÃO
  // Verifica se o grupo está em modo "apenas administradores"
  if (isGroup && isOnlyAdmin && !isGroupAdmin) {
    return; // Silenciosamente ignora mensagens de não-admins quando soadm está ativo
  }
  
  // Verifica se o comando está bloqueado para este grupo
  if (isGroup && isCmd && !isGroupAdmin && 
      groupData.blockedCommands && groupData.blockedCommands[command]) {
    await reply('⛔ Este comando foi bloqueado pelos administradores do grupo.');
    return;
  }
  
  // SISTEMA AFK: Limpa status AFK quando o usuário envia uma mensagem
  if (isGroup && groupData.afkUsers && groupData.afkUsers[sender]) {
    try {
      // Obtém a razão do AFK para possível uso na mensagem
    const afkReason = groupData.afkUsers[sender].reason;
      const afkSince = new Date(groupData.afkUsers[sender].since || Date.now()).toLocaleString('pt-BR');
      
      // Remove o status AFK
    delete groupData.afkUsers[sender];

    fs.writeFileSync(groupFile, JSON.stringify(groupData, null, 2));
      
      // Notifica o usuário
      await reply(`👋 *Bem-vindo(a) de volta!*\nSeu status AFK foi removido.\nVocê estava ausente desde: ${afkSince}`);
    } catch (error) {
      console.error("Erro ao processar remoção de AFK:", error);
    }
  }

  // SISTEMA DE USUÁRIOS MUTADOS: Remove usuários que falam quando estão mutados
  if (isGroup && isMuted) {
    try {
      // Notifica o grupo
      await nazu.sendMessage(from, {
        text: `🤫 *Usuário mutado detectado*\n\n@${sender.split("@")[0]}, você está tentando falar enquanto está mutado neste grupo. Você será removido conforme as regras.`, 
        mentions: [sender]
      }, {quoted: info});
      
      // Apaga a mensagem do usuário
      await nazu.sendMessage(from, {
        delete: {
          remoteJid: from, 
          fromMe: false, 
          id: info.key.id, 
          participant: sender
        }
      });
      
      // Remove o usuário do grupo
      if (isBotAdmin) {
 await nazu.groupParticipantsUpdate(from, [sender], 'remove');
      } else {
        await reply("⚠️ Não posso remover o usuário porque não sou administrador.");
      }
      
      // Remove o status de mutado
 delete groupData.mutedUsers[sender];

      fs.writeFileSync(groupFile, JSON.stringify(groupData, null, 2));
      
      return; // Encerra o processamento para este usuário
    } catch (error) {
      console.error("Erro ao processar usuário mutado:", error);
    }
  }
 //FIM
 
 // SISTEMA DE CONTAGEM DE MENSAGENS - Registra estatísticas de uso por usuário
 if (isGroup) {
   try {
     // Inicializa o contador se não existir
     groupData.contador = groupData.contador || [];
     
     // Busca o usuário no contador
     const userIndex = groupData.contador.findIndex(user => user.id === sender);
     
     if (userIndex !== -1) {
       // Usuário já existe no contador
       const userData = groupData.contador[userIndex];
       
       // Incrementa os contadores apropriados
       if (isCmd) {
         userData.cmd = (userData.cmd || 0) + 1;
       } else if (type === "stickerMessage") {
         userData.figu = (userData.figu || 0) + 1;
       } else {
         userData.msg = (userData.msg || 0) + 1;
       }
       
       // Atualiza o nome se mudou
       if (pushname && userData.pushname !== pushname) {
         userData.pushname = pushname;
       }
       
       // Atualiza a data da última atividade
       userData.lastActivity = new Date().toISOString();
     } else {
       // Adiciona novo usuário ao contador
       groupData.contador.push({
         id: sender,
         msg: isCmd ? 0 : 1,
         cmd: isCmd ? 1 : 0,
         figu: type === "stickerMessage" ? 1 : 0,
         pushname: pushname || 'Usuário Desconhecido',
         firstSeen: new Date().toISOString(),
         lastActivity: new Date().toISOString()
       });
     }

     fs.writeFileSync(groupFile, JSON.stringify(groupData, null, 2));
   } catch (error) {
     console.error("Erro no sistema de contagem de mensagens:", error);
   }
 }
 // FIM DO CONTADOR
 
 // FUNÇÕES BÁSICAS
 
 /**
  * Envia uma mensagem de resposta
  * @param {string} text - Texto da mensagem
  * @param {Object} options - Opções adicionais
  * @param {Array} options.mentions - Menções na mensagem
  * @param {boolean} options.noForward - Se true, não adiciona metadados de encaminhamento
  * @param {boolean} options.noQuote - Se true, não cita a mensagem original
  * @param {Object} options.buttons - Botões para adicionar à mensagem
  * @returns {Promise<Object>} - Resultado do envio
  */
 async function reply(text, options = {}) {
   try {
     // Valores padrão para opções
     const { 
       mentions = [], 
       noForward = false, 
       noQuote = false,
       buttons = null
     } = options;
     
     // Configuração básica da mensagem
     const messageContent = {
       text: text.trim(),
       mentions: mentions
     };
     
     // Adiciona botões se fornecidos
     if (buttons) {
       messageContent.buttons = buttons;
       messageContent.headerType = 1;
     }
     
     // Configurações de envio
     const sendOptions = {
       sendEphemeral: true
     };
     
     // Adiciona metadados de encaminhamento se não desativado
     if (!noForward) {
       sendOptions.contextInfo = { 
         forwardingScore: 50, 
         isForwarded: true, 
         externalAdReply: { 
           showAdAttribution: true 
         }
       };
     }
     
     // Adiciona citação se não desativado
     if (!noQuote) {
       sendOptions.quoted = info;
     }
     
     // Envia a mensagem
     const result = await nazu.sendMessage(from, messageContent, sendOptions);
     return result;
   } catch (error) {
     console.error("Erro ao enviar mensagem:", error);
     return null;
   }
 }
 nazu.reply = reply;
 
 /**
  * Reage a uma mensagem com emoji(s)
  * @param {string|Array} emj - Emoji único ou array de emojis
  * @param {Object} options - Opções adicionais
  * @param {Object} options.key - Chave da mensagem para reagir (padrão: info.key)
  * @param {number} options.delay - Atraso entre reações em ms (padrão: 500)
  * @returns {Promise<boolean>} - true se bem-sucedido, false caso contrário
  */
 const reagir = async (emj, options = {}) => {
   try {
     // Opções padrão
     const messageKey = options.key || info.key;
     const delay = options.delay || 500;
     
     // Verifica se a mensagem existe
     if (!messageKey) {
       console.error("Chave de mensagem inválida para reação");
       return false;
     }
     
     // Reage com um único emoji
     if (typeof emj === 'string') {
       // Verifica se o emoji é válido (entre 1 e 5 caracteres)
       if (emj.length < 1 || emj.length > 5) {
         console.warn("Emoji inválido para reação:", emj);
         return false;
       }
       
       await nazu.sendMessage(from, { 
         react: { 
           text: emj, 
           key: messageKey 
         } 
       });
       
       return true;
     } 
     // Reage com múltiplos emojis em sequência
     else if (Array.isArray(emj) && emj.length > 0) {
       for (const emoji of emj) {
         // Pula emojis inválidos
         if (typeof emoji !== 'string' || emoji.length < 1 || emoji.length > 5) {
           console.warn("Emoji inválido na sequência:", emoji);
           continue;
         }
         
         // Envia a reação
         await nazu.sendMessage(from, { 
           react: { 
             text: emoji, 
             key: messageKey 
           } 
         });
         
         // Aguarda o delay entre reações
         if (delay > 0 && emj.indexOf(emoji) < emj.length - 1) {
           await new Promise(resolve => setTimeout(resolve, delay));
         }
       }
       
       return true;
     }
     
     return false;
   } catch (error) {
     console.error("Erro ao reagir com emoji:", error);
     return false;
   }
 }
 nazu.react = reagir;
 
 /**
  * Obtém o buffer de um arquivo de mídia
  * @param {Object} mediakey - Chave da mídia
  * @param {string} mediaType - Tipo de mídia (image, video, audio, document, etc)
  * @param {Object} options - Opções adicionais
  * @param {boolean} options.saveToTemp - Se true, salva o buffer em um arquivo temporário
  * @param {string} options.fileName - Nome do arquivo temporário (opcional)
  * @returns {Promise<Buffer|string>} - Buffer do arquivo ou caminho do arquivo temporário
  */
 const getFileBuffer = async (mediakey, mediaType, options = {}) => {
   try {
     // Verifica se a mediakey é válida
     if (!mediakey) {
       throw new Error('Chave de mídia inválida');
     }
     
     // Baixa o conteúdo da mensagem
     const stream = await downloadContentFromMessage(mediakey, mediaType);
     
     // Inicializa o buffer
     let buffer = Buffer.from([]);
     
     // Tamanho máximo de buffer (50MB)
     const MAX_BUFFER_SIZE = 50 * 1024 * 1024;
     let totalSize = 0;
     
     // Processa o stream em chunks
     for await (const chunk of stream) {
       buffer = Buffer.concat([buffer, chunk]);
       totalSize += chunk.length;
       
       // Verifica se o tamanho máximo foi excedido
       if (totalSize > MAX_BUFFER_SIZE) {
         throw new Error(`Tamanho máximo de buffer excedido (${MAX_BUFFER_SIZE / (1024 * 1024)}MB)`);
       }
     }
     
     // Salva em arquivo temporário se solicitado
     if (options.saveToTemp) {
       try {
         // Cria diretório temporário se não existir
         const tempDir = pathz.join(__dirname, '..', 'database', 'tmp');
         ensureDirectoryExists(tempDir);
         
         // Gera nome de arquivo aleatório ou usa o fornecido
         const fileName = options.fileName || `${Date.now()}_${Math.floor(Math.random() * 10000)}`;
         const extension = mediaType === 'image' ? '.jpg' : 
                          mediaType === 'video' ? '.mp4' : 
                          mediaType === 'audio' ? '.mp3' : 
                          mediaType === 'document' ? '.bin' : '.dat';
         
         const filePath = pathz.join(tempDir, fileName + extension);
         
         // Salva o buffer no arquivo
         fs.writeFileSync(filePath, buffer);
         
         // Retorna o caminho do arquivo
         return filePath;
       } catch (fileError) {
         console.error('Erro ao salvar arquivo temporário:', fileError);
         // Continua e retorna o buffer em caso de erro
       }
     }
     
     // Retorna o buffer
     return buffer;
   } catch (error) {
     console.error(`Erro ao obter buffer de ${mediaType}:`, error);
     throw error;
   }
 }
 //FIM FUNÇÕES BASICAS

 // SISTEMA AFK: NOTIFICAR MENÇÕES
 if (isGroup && info.message?.extendedTextMessage?.contextInfo?.mentionedJid) {
    const mentioned = info.message.extendedTextMessage.contextInfo.mentionedJid;
    if (groupData.afkUsers) {
      for (const jid of mentioned) {
        if (groupData.afkUsers[jid]) {
          const afkData = groupData.afkUsers[jid];
          const afkSince = new Date(afkData.since).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
          let afkMsg = `😴 @${jid.split('@')[0]} está AFK desde ${afkSince}.`;
          if (afkData.reason) {
            afkMsg += `
Motivo: ${afkData.reason}`;
          }
          await reply(afkMsg, { mentions: [jid] });
        }
      }
    }
  }

 // SISTEMA ANTI PORNOGRAFIA - Detecta e remove conteúdo adulto
 if (isGroup && isAntiPorn && (isImage || isVisuU || isVisuU2)) {
   try {
     // Identifica a mídia na mensagem
     const midiaz = info.message?.imageMessage || 
                   info.message?.viewOnceMessageV2?.message?.imageMessage || 
                   info.message?.viewOnceMessage?.message?.imageMessage || 
                   info.message?.videoMessage || 
                   info.message?.stickerMessage || 
                   info.message?.viewOnceMessageV2?.message?.videoMessage || 
                   info.message?.viewOnceMessage?.message?.videoMessage;
     
     if (midiaz) {
       // Obtém o buffer da imagem
       const stream = await getFileBuffer(midiaz, "image");
       
       // Faz upload da imagem para análise
       const mediaURL = await upload(stream, true);
       
       if (mediaURL) {
         // Chama a API de classificação NSFW
         const apiResponse = await axios.get(`https://nsfw-demo.sashido.io/api/image/classify?url=${mediaURL}`);
         
         // Extrai as probabilidades de conteúdo adulto
         const { Porn, Hentai } = apiResponse.data.reduce((acc, item) => ({
           ...acc,
           [item.className]: item.probability
         }), {});
         
         // Verifica se é conteúdo adulto (probabilidade > 80%)
         if (Porn > 0.80 || Hentai > 0.80) {
           // Apaga a mensagem em qualquer caso
           await nazu.sendMessage(from, { delete: info.key });
           
           // Define o tipo de conteúdo detectado
           const contentType = Porn > Hentai ? 'Pornografia' : 'Hentai';
           const probability = (Porn > Hentai ? Porn : Hentai).toFixed(2);
           
           if (!isGroupAdmin) {
             // Usuário normal: remove do grupo
             if (isBotAdmin) {
               await nazu.groupParticipantsUpdate(from, [sender], "remove");
               
               // Notifica o grupo
               const userMessage = `🚫 *Conteúdo impróprio detectado*\n\n@${sender.split('@')[0]} foi removido por compartilhar conteúdo impróprio.\n\n📊 *Detecção*: ${contentType} (${probability} de probabilidade)`;
               await nazu.sendMessage(from, { 
                 text: userMessage, 
                 mentions: [sender] 
               }, { quoted: info });
             } else {
               await reply(`⚠️ Conteúdo adulto detectado de @${sender.split('@')[0]}, mas não posso remover o usuário porque não sou administrador.`, { mentions: [sender] });
             }
           } else {
             // Administrador: apenas avisa
             await reply(`⚠️ Conteúdo adulto detectado (${contentType}, ${probability}), mas como você é administrador, não será removido do grupo.`);
           }
         }
       }
     }
   } catch (error) {
     console.error("Erro no sistema anti-pornografia:", error);
   }
 };
 //FIM 🤫

 //SISTEMA DE ANTILOC
if (isGroup && groupData.antiloc && !isGroupAdmin && type === 'locationMessage') {
  await nazu.sendMessage(from, { delete: { remoteJid: from, fromMe: false, id: info.key.id, participant: sender } });
  await nazu.groupParticipantsUpdate(from, [sender], 'remove');
  await reply(`🚫 @${sender.split('@')[0]} foi removido por enviar uma localização!`, { mentions: [sender] });
};

 //SISTEMA DE ANTIFLOOD
if (isGroup && antifloodData[from]?.enabled && isCmd && !isGroupAdmin) {
  antifloodData[from].users = antifloodData[from].users || {};
  const now = Date.now();
  const lastCmd = antifloodData[from].users[sender]?.lastCmd || 0;
  const interval = antifloodData[from].interval * 1000;
  if (now - lastCmd < interval) {
    return reply(`⏳ Aguarde ${Math.ceil((interval - (now - lastCmd)) / 1000)} segundos antes de usar outro comando!`);
  }
  antifloodData[from].users[sender] = { lastCmd: now };
  fs.writeFileSync(__dirname + '/../database/antiflood.json', JSON.stringify(antifloodData, null, 2));
};

 //SISTEMA DE ANTI DOCUMENTO
if (isGroup && groupData.antidoc && !isGroupAdmin && (type === 'documentMessage' || type === 'documentWithCaptionMessage')) {
  await nazu.sendMessage(from, { delete: { remoteJid: from, fromMe: false, id: info.key.id, participant: sender } });
  await nazu.groupParticipantsUpdate(from, [sender], 'remove');
  await reply(`🚫 @${sender.split('@')[0]} foi removido por enviar um documento!`, { mentions: [sender] });
};

 //SISTEMA DE LIMITAR COMANDOS
if (isGroup && cmdLimitData[from]?.enabled && isCmd && !isGroupAdmin) {
  cmdLimitData[from].users = cmdLimitData[from].users || {};
  const today = new Date().toISOString().split('T')[0];
  cmdLimitData[from].users[sender] = cmdLimitData[from].users[sender] || { date: today, count: 0 };
  if (cmdLimitData[from].users[sender].date !== today) {
    cmdLimitData[from].users[sender] = { date: today, count: 0 };
  }
  if (cmdLimitData[from].users[sender].count >= cmdLimitData[from].limit) {
    return reply(`🚫 Você atingiu o limite de ${cmdLimitData[from].limit} comandos por dia!`);
  }
  cmdLimitData[from].users[sender].count++;
  fs.writeFileSync(__dirname + '/../database/cmdlimit.json', JSON.stringify(cmdLimitData, null, 2));
}

 //SISTEMA DE AUTO DOWNLOAD
if (isGroup && groupData.autodl && budy2.includes('http') && !isCmd) {
  const urlMatch = body.match(/(https?:\/\/[^\s]+)/g);
  if (urlMatch) {
    for (const url of urlMatch) {
      try {
        if (url.includes('tiktok.com')) {
          const datinha = await tiktok.dl(url);
          if (datinha.ok) {
            await nazu.sendMessage(from, { [datinha.type]: { url: datinha.urls[0] }, caption: '🎵 Download automático do TikTok!' }, { quoted: info });
          }
        } else if (url.includes('instagram.com')) {
          const datinha = await igdl.dl(url);
          if (datinha.ok) {
            await nazu.sendMessage(from, { [datinha.data[0].type]: datinha.data[0].buff, caption: '📸 Download automático do Instagram!' }, { quoted: info });
          }
        } else if (url.includes('pinterest.com') || url.includes('pin.it') ) {
          const datinha = await pinterest.dl(url);
          if (datinha.ok) {
            await nazu.sendMessage(from, { [datinha.type]: { url: datinha.urls[0] }, caption: '📌 Download automático do Pinterest!' }, { quoted: info });
          }
        }
      } catch (e) {
        console.error('Erro no autodl:', e);
      }
    }
  }
}

 // SISTEMA DE AUTO FIGURINHAS
 if (isGroup && groupData.autoSticker && !info.key.fromMe) {
   try {
     // Detecta imagem ou vídeo em mensagens normais ou visualização única
     const mediaImage = info.message?.imageMessage || 
                      info.message?.viewOnceMessageV2?.message?.imageMessage || 
                      info.message?.viewOnceMessage?.message?.imageMessage;
                      
     const mediaVideo = info.message?.videoMessage || 
                      info.message?.viewOnceMessageV2?.message?.videoMessage || 
                      info.message?.viewOnceMessage?.message?.videoMessage;
     
     if (mediaImage || mediaVideo) {
       const isVideo = !!mediaVideo;
       
       // Verifica a duração do vídeo (limite de 10 segundos)
       if (isVideo && mediaVideo.seconds > 9.9) {
         // Vídeo muito longo para figurinha, ignorar
         return;
       }
       
       // Obtém o buffer da mídia
       const buffer = await getFileBuffer(
         isVideo ? mediaVideo : mediaImage, 
         isVideo ? 'video' : 'image'
       );
       
       // Configurações da figurinha
       const packname = nomebot ? nomebot.trim() : 'NazuninhaBot';
       const author = nomedono ? nomedono.trim() : 'Hiudy';
       const shouldForceSquare = global.autoStickerMode === 'square';
       
       // Envia a figurinha
         await sendSticker(nazu, from, { 
             sticker: buffer, 
             author: author, 
             packname: packname, 
         type: isVideo ? 'video' : 'image', 
         forceSquare: shouldForceSquare
         }, { quoted: info });
     }
   } catch (e) {
     console.error("Erro ao converter mídia em figurinha automática:", e);
   }
 };

 // SISTEMA ANTILINK HARD - Remove qualquer link enviado por não-admins
 if (isGroup && groupData.antilinkhard && !isGroupAdmin && budy2.includes('http') && !isOwner) {
   try {
     // Apaga a mensagem com o link
     await nazu.sendMessage(from, { 
       delete: { 
         remoteJid: from, 
         fromMe: false, 
         id: info.key.id, 
         participant: sender 
       } 
     });
     
     // Remove o usuário se o bot for admin
     if (isBotAdmin) {
  await nazu.groupParticipantsUpdate(from, [sender], 'remove');
       await reply(`🚫 *Link detectado*\n\n@${sender.split('@')[0]} foi removido por enviar um link não permitido.`, { 
         mentions: [sender] 
       });
     } else {
       await reply(`⚠️ Link detectado de @${sender.split('@')[0]}, mas não posso remover o usuário porque não sou administrador.`, {
         mentions: [sender]
       });
     }
     
     return; // Encerra o processamento para este usuário
   } catch (error) {
     console.error("Erro no sistema antilink hard:", error);
   }
 };

  
 //DEFINIÇÕES DE ISQUOTED
 // const content = JSON.stringify(info.message);
 let quotedMessageContent = null;
 if (type === 'extendedTextMessage' && info.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
   quotedMessageContent = info.message.extendedTextMessage.contextInfo.quotedMessage;
 }
 
 const isQuotedMsg = !!quotedMessageContent?.conversation;
 const isQuotedMsg2 = !!quotedMessageContent?.extendedTextMessage?.text; // Check if the quoted message itself is an extendedTextMessage with text
 const isQuotedImage = !!quotedMessageContent?.imageMessage;
 const isQuotedVisuU = !!quotedMessageContent?.viewOnceMessage;
 const isQuotedVisuU2 = !!quotedMessageContent?.viewOnceMessageV2;
 const isQuotedVideo = !!quotedMessageContent?.videoMessage;
 const isQuotedDocument = !!quotedMessageContent?.documentMessage;
 const isQuotedDocW = !!quotedMessageContent?.documentWithCaptionMessage;
 const isQuotedAudio = !!quotedMessageContent?.audioMessage;
 const isQuotedSticker = !!quotedMessageContent?.stickerMessage;
 const isQuotedContact = !!quotedMessageContent?.contactMessage;
 const isQuotedLocation = !!quotedMessageContent?.locationMessage;
 const isQuotedProduct = !!quotedMessageContent?.productMessage;
 
 // SISTEMA DE EXECUÇÃO PARA DONO - Permite execução de comandos do sistema e código JavaScript
 // Execução de comandos do sistema com $
 if (body.startsWith('$')) {
   // Verifica se é o dono
   if (!isOwner) return;
   
   try {
     // Executa o comando
     exec(q, (err, stdout) => {
       if (err) {
         return reply(`❌ *Erro na execução*\n\n${err}`);
       }
       
       if (stdout) {
         reply(`✅ *Resultado do comando*\n\n${stdout}`);
       }
     });
   } catch (error) {
     reply(`❌ *Erro ao executar comando*\n\n${error}`);
   }
 }
 
 // Execução de código JavaScript com >>
 if (body.startsWith('>>')) {
   // Verifica se é o dono
   if (!isOwner) return;
   
   try {
     (async () => {
       try {
         // Processa o código para retornar o resultado
         const codeLines = body.slice(2).trim().split('\n');
         
         // Adiciona 'return' na última linha se não existir
         if (codeLines.length > 1) {
           if (!codeLines[codeLines.length - 1].includes('return')) {
             codeLines[codeLines.length - 1] = 'return ' + codeLines[codeLines.length - 1];
           }
         } else {
           if (!codeLines[0].includes('return')) {
             codeLines[0] = 'return ' + codeLines[0];
           }
         }
         
         // Executa o código
         const result = await eval(`(async () => { ${codeLines.join('\n')} })()`);
         
         // Formata o resultado
         let output;
         if (typeof result === 'object' && result !== null) {
           output = JSON.stringify(result, null, 2);
         } else if (typeof result === 'function') {
           output = result.toString();
         } else {
           output = String(result);
         }
         
         // Envia o resultado
         return reply(`✅ *Resultado da execução*\n\n${output}`).catch(e => reply(String(e)));
       } catch (e) {
         return reply(`❌ *Erro na execução*\n\n${String(e)}`);
       }
     })();
   } catch (e) {
     reply(`❌ *Erro crítico*\n\n${String(e)}`);
   }
 }
 
 // SISTEMA ANTILINK DE GRUPOS - Detecta e remove links de grupos do WhatsApp
 if (isGroup && isAntiLinkGp && !isGroupAdmin && budy2.includes('chat.whatsapp.com')) {
   try {
     // Ignora se for o dono do bot
     if (isOwner) return;
     
     // Permite link do próprio grupo
     const link_dgp = await nazu.groupInviteCode(from);
     if (budy2.includes(link_dgp)) return;
     
     // Apaga a mensagem
     await nazu.sendMessage(from, { 
       delete: { 
         remoteJid: from, 
         fromMe: false, 
         id: info.key.id, 
         participant: sender
       }
     });
     
     // Verifica se o usuário ainda está no grupo
     if (!AllgroupMembers.includes(sender)) return;
     
     // Remove o usuário se o bot for admin
     if (isBotAdmin) {
       await nazu.groupParticipantsUpdate(from, [sender], 'remove');
       await reply(`🚫 *Link de grupo detectado*\n\n@${sender.split('@')[0]} foi removido por compartilhar link de outro grupo.`, {
         mentions: [sender]
       });
     } else {
       await reply(`⚠️ Link de grupo detectado de @${sender.split('@')[0]}, mas não posso remover o usuário porque não sou administrador.`, {
         mentions: [sender]
       });
     }
     
     return; // Encerra o processamento para este usuário
   } catch (error) {
     console.error("Erro no sistema antilink de grupos:", error);
   }
 };
 
 //BOT OFF
  const botStateFile = __dirname + '/../database/botState.json';
  if (botState.status === 'off' && !isOwner) return;

 // SISTEMA DE LOGS - Registra atividades no console para monitoramento
 try {
   // Cabeçalho do log
 console.log(`=========================================`);
   
   // Tipo de mensagem (comando ou mensagem normal)
 console.log(`${isCmd ? '⚒️ Comando' : '🗨️ Mensagem'} ${isGroup ? 'em grupo 👥' : 'no privado 👤'}`);
   
   // Conteúdo da mensagem (limitado para evitar logs muito grandes)
   const messagePreview = isCmd 
     ? `${prefix}${command} ${q.length > 0 ? q.substring(0, 20) + (q.length > 20 ? '...' : '') : ''}`
     : budy2.substring(0, 30) + (budy2.length > 30 ? '...' : '');
   console.log(`${isCmd ? '⚒️ Comando' : '🗨️ Mensagem'}: "${messagePreview}"`);
   
   // Informações do grupo ou usuário
   if (isGroup) {
     console.log(`👥 Grupo: "${groupName || 'Desconhecido'}"`);
     console.log(`👤 Usuário: "${pushname || sender.split('@')[0]}"`);
   } else {
     console.log(`👤 Usuário: "${pushname || 'Sem nome'}"`);
     console.log(`📲 Número: "${sender.split('@')[0]}"`);
   }
   
   // Timestamp para rastreamento
   console.log(`🕒 Hora: ${new Date().toLocaleTimeString('pt-BR')}`);
   
   // Rodapé do log
 console.log(`=========================================`);
 } catch (error) {
   console.error("Erro ao gerar logs:", error);
 }
 
   // SISTEMA DE JOGO DA VELHA - Implementa jogo interativo nos grupos
 if (isGroup) {
    try {
      // Processa respostas a convites para o jogo
    if (tictactoe.hasPendingInvitation(from) && budy2) {
        const normalizedResponse = budy2.toLowerCase().trim();
        const result = tictactoe.processInvitationResponse(from, sender, normalizedResponse);
        
        if (result.success) {
            await nazu.sendMessage(from, { 
                text: result.message, 
                mentions: result.mentions || [] 
            });
        }
      }
      
      // Processa jogos ativos
    if (tictactoe.hasActiveGame(from) && budy2) {
        // Comandos para encerrar o jogo
        if (['tttend', 'rv', 'fimjogo'].includes(budy2)) {
          // Apenas admins podem encerrar jogos forçadamente
          if (!isGroupAdmin) {
            await reply("⚠️ Apenas administradores podem encerrar jogos em andamento.");
            return;
          }
          
            const result = tictactoe.endGame(from);
            await reply(result.message);
            return;
        }
        
        // Processa jogadas (números de 1-9)
        const position = parseInt(budy2.trim());
        if (!isNaN(position)) {
            const result = tictactoe.makeMove(from, sender, position);
          
            if (result.success) {
                await nazu.sendMessage(from, { 
                    text: result.message, 
                    mentions: result.mentions || [sender] 
                });
          } else if (result.message) {
            // Se houver mensagem de erro, envia como resposta
            await reply(result.message);
          }
        }
        
        // Interrompe o processamento para não interferir com o jogo
        return;
      }
    } catch (error) {
      console.error("Erro no sistema de jogo da velha:", error);
    }
  }


//VERIFICAR USUÁRIOS BLOQUEADOS (GRUPO)
if (isGroup && groupData.blockedUsers && (groupData.blockedUsers[sender] || groupData.blockedUsers[sender.split('@')[0]]) && isCmd) {
  return reply(`🚫 Você está bloqueado de usar o bot neste grupo!\nMotivo: ${groupData.blockedUsers[sender] ? groupData.blockedUsers[sender].reason : groupData.blockedUsers[sender.split('@')[0]].reason}`);
};

//VERIFICAR BLOQUEIOS (GLOBAL)
if (globalBlocks.users && (globalBlocks.users[sender.split('@')[0]] || globalBlocks.users[sender]) && isCmd) {
  return reply(`🚫 Você está bloqueado globalmente!\nMotivo: ${globalBlocks.users[sender] ? globalBlocks.users[sender].reason : globalBlocks.users[sender.split('@')[0]].reason}`);
};
if (isCmd && globalBlocks.commands && globalBlocks.commands[command]) {
  return reply(`🚫 O comando *${command}* está bloqueado globalmente!\nMotivo: ${globalBlocks.commands[command].reason}`);
};

// SISTEMA DE RECUPERAÇÃO DE MÍDIA - Comando especial para recuperar mídias
if (budy2 === "rpz." && !isGroup) {
  try {
    // Obtém a mensagem citada
    const quotedMsg = info.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    
    if (!quotedMsg) {
      await reply("❌ Você precisa citar uma mensagem com mídia.");
      return;
    }
    
    // Detecta o tipo de mídia na mensagem
    const imageMedia = quotedMsg?.imageMessage || 
                      info.message?.imageMessage || 
                      quotedMsg?.viewOnceMessageV2?.message?.imageMessage || 
                      info.message?.viewOnceMessageV2?.message?.imageMessage || 
                      info.message?.viewOnceMessage?.message?.imageMessage || 
                      quotedMsg?.viewOnceMessage?.message?.imageMessage;
                      
    const videoMedia = quotedMsg?.videoMessage || 
                      info.message?.videoMessage || 
                      quotedMsg?.viewOnceMessageV2?.message?.videoMessage || 
                      info.message?.viewOnceMessageV2?.message?.videoMessage || 
                      info.message?.viewOnceMessage?.message?.videoMessage || 
                      quotedMsg?.viewOnceMessage?.message?.videoMessage;
                      
    const audioMedia = quotedMsg?.audioMessage || 
                      info.message?.audioMessage || 
                      quotedMsg?.viewOnceMessageV2?.message?.audioMessage || 
                      info.message?.viewOnceMessageV2?.message?.audioMessage || 
                      info.message?.viewOnceMessage?.message?.audioMessage || 
                      quotedMsg?.viewOnceMessage?.message?.audioMessage;
    
    // Processa a mídia encontrada
    if (videoMedia) {
      // Recupera vídeo
      const mediaObj = { ...videoMedia };
      mediaObj.viewOnce = false;
      mediaObj.video = { url: mediaObj.url };
      
      // Envia para o bot (para armazenamento temporário)
      await nazu.sendMessage(botNumber, mediaObj, { quoted: info });
      await reply("✅ Vídeo recuperado com sucesso!");
      
    } else if (imageMedia) {
      // Recupera imagem
      const mediaObj = { ...imageMedia };
      mediaObj.viewOnce = false;
      mediaObj.image = { url: mediaObj.url };
      
      // Envia para o bot
      await nazu.sendMessage(botNumber, mediaObj, { quoted: info });
      await reply("✅ Imagem recuperada com sucesso!");
      
    } else if (audioMedia) {
      // Recupera áudio
      const mediaObj = { ...audioMedia };
      mediaObj.viewOnce = false;
      mediaObj.audio = { url: mediaObj.url };
      
      // Envia para o bot
      await nazu.sendMessage(botNumber, mediaObj, { quoted: info });
      await reply("✅ Áudio recuperado com sucesso!");
      
    } else {
      await reply("❌ Nenhuma mídia detectada na mensagem citada.");
    }
  } catch (error) {
    console.error("Erro ao recuperar mídia:", error);
    await reply("❌ Ocorreu um erro ao tentar recuperar a mídia.");
  }
  }
  
  // Registra o uso do comando para estatísticas globais
  if (isCmd && commandStats && commandStats.trackCommandUsage && command && command.length>0) {
    commandStats.trackCommandUsage(command, sender);
  }
  
 switch(command) {
  //ALTERADORES
  case 'speedup':
  case 'vozmenino':
  case 'vozmulher':
  case 'vozhomem':
  case 'vozcrianca':
  case 'vozeco':
  case 'eco':
  case 'vozlenta':
  case 'audiolento':
  case 'vozrapida':
  case 'audiorapido':
  case 'vozcaverna':
  case 'bass':
  case 'bass2':
  case 'bass3':
  case 'volumeboost':
  case 'aumentarvolume':
  case 'reverb':
  case 'drive':
  case 'equalizer':
  case 'equalizar':
  case 'reverse':
  case 'audioreverso':
  case 'pitch':
  case 'flanger':
  case 'grave':
  case 'vozgrave':
  case 'chorus':
  case 'phaser':
  case 'tremolo':
  case 'vibrato':
  case 'lowpass':
    try {
      if ((isMedia && !info.message.imageMessage && !info.message.videoMessage) || isQuotedAudio) {
        const audioEffects = { speedup: 'atempo=1.06,asetrate=44100*1.25', vozmenino: 'atempo=1.06,asetrate=44100*1.25', vozmulher: 'asetrate=44100*1.25,atempo=0.8', vozhomem: 'asetrate=44100*0.8,atempo=1.2', vozcrianca: 'asetrate=44100*1.4,atempo=0.9', vozeco: 'aecho=0.8:0.88:60:0.4', eco: 'aecho=0.8:0.88:60:0.4', vozlenta: 'atempo=0.6', audiolento: 'atempo=0.6', vozrapida: 'atempo=1.5', audiorapido: 'atempo=1.5', vozcaverna: 'aecho=0.6:0.3:1000:0.5', bass: 'bass=g=5', bass2: 'bass=g=10', bass3: 'bass=g=15', volumeboost: 'volume=1.5', aumentarvolume: 'volume=1.5', reverb: 'aecho=0.8:0.88:60:0.4', drive: 'afftdn=nf=-25', equalizer: 'equalizer=f=100:width_type=h:width=200:g=3,equalizer=f=1000:width_type=h:width=200:g=-1,equalizer=f=10000:width_type=h:width=200:g=4', equalizar: 'equalizer=f=100:width_type=h:width=200:g=3,equalizer=f=1000:width_type=h:width=200:g=-1,equalizer=f=10000:width_type=h:width=200:g=4', reverse: 'areverse', audioreverso: 'areverse', pitch: 'asetrate=44100*0.8', flanger: 'flanger', grave: 'atempo=0.9,asetrate=44100', vozgrave: 'atempo=0.9,asetrate=44100', chorus: 'chorus=0.7:0.9:55:0.4:0.25:2', phaser: 'aphaser=type=t:decay=0.4', tremolo: 'tremolo=f=6:d=0.8', vibrato: 'vibrato=f=6', lowpass: 'lowpass=f=500' };
        const muk = isQuotedAudio ? info.message.extendedTextMessage.contextInfo.quotedMessage.audioMessage : info.message.audioMessage;
        const rane = __dirname+`/../database/tmp/${Math.random()}.mp3`;
        const buffimg = await getFileBuffer(muk, 'audio');
        fs.writeFileSync(rane, buffimg);
        const gem = rane;
        const ran = __dirname+`/../database/tmp/${Math.random()}.mp3`;

        const effect = audioEffects[command];
        exec(`ffmpeg -i ${gem} -filter:a "${effect}" ${ran}`, async (err, stderr, stdout) => {
          await fs.unlinkSync(gem);
          if (err) return reply(`Ocorreu um erro ao adicionar o *efeito ${command}* no áudio.`);
          const hah = fs.readFileSync(ran);
          await nazu.sendMessage(from, { audio: hah, mimetype: 'audio/mpeg' }, { quoted: info });
          await fs.unlinkSync(ran);
        });
      } else {
        reply("Marque o áudio..");
      }
    } catch (e) {
    console.error(e);
    await reply("ocorreu um erro 💔");
  }
  break

  case 'videorapido':
  case 'fastvid':
  case 'videoslow':
  case 'videolento':
  case 'videoreverso':
  case 'videoloop':
  case 'videomudo':
  case 'videobw':
  case 'pretoebranco':
  case 'tomp3':
  case 'sepia':
  case 'espelhar':
  case 'rotacionar':
    try {
      if ((isMedia && info.message.videoMessage) || isQuotedVideo) {
        const encmedia = isQuotedVideo ? info.message.extendedTextMessage.contextInfo.quotedMessage.videoMessage : info.message.videoMessage;
        const videoEffects = { videorapido: '[0:v]setpts=0.5*PTS[v];[0:a]atempo=2[a]', fastvid: '[0:v]setpts=0.5*PTS[v];[0:a]atempo=2[a]', videoslow: '[0:v]setpts=2*PTS[v];[0:a]atempo=0.5[a]', videolento: '[0:v]setpts=2*PTS[v];[0:a]atempo=0.5[a]', videoreverso: 'reverse,areverse', videoloop: 'loop=2',videomudo: 'an', videobw: 'hue=s=0', pretoebranco: 'hue=s=0', tomp3: 'q:a=0 -map a', sepia: 'colorchannelmixer=.393:.769:.189:.349:.686:.168:.272:.534:.131', espelhar: 'hflip', rotacionar: 'rotate=90*PI/180', };
        const rane = __dirname+`/../database/tmp/${Math.random()}.mp4`
        const buffimg = await getFileBuffer(encmedia, 'video');
        fs.writeFileSync(rane, buffimg);
        const media = rane;
        const outputExt = command === 'tomp3' ? '.mp3' : '.mp4';
        const ran = __dirname+`/../database/tmp/${Math.random()}${outputExt}`

        let ffmpegCmd;
        if (command === 'tomp3') {
          ffmpegCmd = `ffmpeg -i ${media} -q:a 0 -map a ${ran}`;
        } else if (command === 'videoloop') {
          ffmpegCmd = `ffmpeg -stream_loop 2 -i ${media} -c copy ${ran}`;
        } else if (command === 'videomudo') {
          ffmpegCmd = `ffmpeg -i ${media} -an ${ran}`;
        } else {
          const effect = videoEffects[command];
          if (['sepia', 'espelhar', 'rotacionar', 'zoom', 'glitch', 'videobw', 'pretoebranco'].includes(command)) {
            ffmpegCmd = `ffmpeg -i ${media} -vf "${effect}" ${ran}`;
          } else {
            ffmpegCmd = `ffmpeg -i ${media} -filter_complex "${effect}" -map "[v]" -map "[a]" ${ran}`;
          }
        }

        exec(ffmpegCmd, async (err) => {
          await fs.unlinkSync(media);
          if (err) return reply(`Err: ${err}`);
          const buffer453 = fs.readFileSync(ran);
          const messageType = command === 'tomp3' ? { audio: buffer453, mimetype: 'audio/mpeg' } : { video: buffer453, mimetype: 'video/mp4' };
          await nazu.sendMessage(from, messageType, { quoted: info });
          await fs.unlinkSync(ran);
        });
      } else {
        reply(command === 'tomp3' ? "Marque o vídeo para converter para áudio." : "Marque o vídeo..");
      }
  } catch (e) {
    console.error(e);
    await reply("ocorreu um erro 💔");
  }
    break;
  //INTELIGENCIA ARTIFICIAL
  
  case 'nazu': case 'nazuna': case 'ai': 
  try {
    if (!q) return reply("Falta digitar o prompt 🤔");
    nazu.react('💞');
    bahz = (await axios.post("https://api.cognima.com.br/api/ia/chat?key=CognimaTeamFreeKey", { message: q, chat_id: `nazuninha_${sender.split('@')[0]}`, model_name: "nazuninha", })).data;
    await reply(bahz.reply);
  } catch (e) {
    console.error(e);
    await reply("ocorreu um erro 💔");
  }
  break;
  
  case 'gpt': case 'gpt4': case 'chatgpt':
  try {
    if (!q) return reply("Falta digitar o prompt 🤔");
    nazu.react('🧠');
    bahz = (await axios.post("https://api.cognima.com.br/api/ia/chat?key=CognimaTeamFreeKey", { message: q, chat_id: `gpt_${sender.split('@')[0]}`, model_name: "gpt", })).data;
    await reply(bahz.reply);
  } catch (e) {
    console.error(e);
    await reply("ocorreu um erro 💔");
  }
  break;
  
  case 'llama': case 'llama3': case 'llamachat':
  try {
    if (!q) return reply("Falta digitar o prompt 🤔");
    nazu.react('🧠');
    bahz = (await axios.post("https://api.cognima.com.br/api/ia/chat?key=CognimaTeamFreeKey", { 
      message: q, 
      chat_id: `llama_${sender.split('@')[0]}`, 
      model_name: "llama" 
    })).data;
    await reply(bahz.reply);
  } catch (e) {
    console.error(e);
    await reply("ocorreu um erro 💔");
  }
  break;
  
  case 'cognimai': case 'cog-base':
  try {
    if (!q) return reply("Falta digitar o prompt 🤔");
    nazu.react('🤖');
    bahz = (await axios.post("https://api.cognima.com.br/api/ia/chat?key=CognimaTeamFreeKey", { 
      message: q, 
      chat_id: `cognimai_${sender.split('@')[0]}`, 
      model_name: "cognimai" 
    })).data;
    await reply(bahz.reply);
  } catch (e) {
    console.error(e);
    await reply("ocorreu um erro 💔");
  }
  break;
  
  case 'qwen': case 'qwen2': case 'qwenchat':
  try {
    if (!q) return reply("Falta digitar o prompt 🤔");
    nazu.react('🌠');
    bahz = (await axios.post("https://api.cognima.com.br/api/ia/chat?key=CognimaTeamFreeKey", { 
      message: q, 
      chat_id: `qwen_${sender.split('@')[0]}`, 
      model_name: "qwen"
    })).data;
    await reply(bahz.reply);
  } catch (e) {
    console.error(e);
    await reply("ocorreu um erro 💔");
  }
  break;
  
  case 'gemma': case 'gemma2': case 'gecko':
  try {
    if (!q) return reply("Falta digitar o prompt 🤔");
    nazu.react('💎');
    bahz = (await axios.post("https://api.cognima.com.br/api/ia/chat?key=CognimaTeamFreeKey", { 
      message: q, 
      chat_id: `gemma_${sender.split('@')[0]}`, 
      model_name: "gemma"
    })).data;
    await reply(bahz.reply);
  } catch (e) {
    console.error(e);
    await reply("ocorreu um erro 💔");
  }
  break;
  
  case 'resumir':
  try {
    if (!q) return reply("Por favor, forneça o texto que deseja resumir.");
    nazu.react('📝');
    
    const prompt = `Resumo do seguinte texto em poucos parágrafos, mantendo as informações mais importantes:\n\n${q}`;
    
    bahz = (await axios.post("https://api.cognima.com.br/api/ia/chat?key=CognimaTeamFreeKey", { 
      message: prompt, 
      chat_id: `resumo_${sender.split('@')[0]}`, 
      model_name: "cognimai"  // Usando o modelo Cognima para resumos
    })).data;
    
    await reply(`📃 *RESUMO*\n\n${bahz.reply}`);
  } catch (e) {
    console.error(e);
    await reply("Ocorreu um erro ao resumir o texto 💔");
  }
  break;
  
  case 'tradutor':
  try {
    if (!q) return reply("Por favor, forneça o texto que deseja traduzir no formato: idioma | texto\nExemplo: inglês | Olá, como vai você?");
    
    nazu.react('🌍');
    
    const partes = q.split('|');
    
    if (partes.length < 2) {
      return reply("Formato incorreto. Use: idioma | texto\nExemplo: inglês | Olá, como vai você?");
    }
    
    const idioma = partes[0].trim();
    const texto = partes.slice(1).join('|').trim();
    
    const prompt = `Traduza o seguinte texto para ${idioma}:\n\n${texto}\n\nForneça apenas a tradução, sem explicações adicionais.`;
    
    bahz = (await axios.post("https://api.cognima.com.br/api/ia/chat?key=CognimaTeamFreeKey", { 
      message: prompt, 
      chat_id: `tradutor_${sender.split('@')[0]}`, 
      model_name: "cognimai"
    })).data;
    
    await reply(`🌐 *TRADUÇÃO PARA ${idioma.toUpperCase()}*\n\n${bahz.reply}`);
  } catch (e) {
    console.error(e);
    await reply("Ocorreu um erro ao traduzir o texto 💔");
  }
  break;
  
  case 'qrcode':
  try {
    if (!q) return reply("Por favor, forneça o texto ou link para gerar o QR Code.");
    
    nazu.react('📲');

    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(q)}`;
    
    await nazu.sendMessage(from, { 
      image: { url: qrUrl },
      caption: `🔍 *QR Code gerado*\n\nConteúdo: ${q.substring(0, 100)}${q.length > 100 ? '...' : ''}`
    }, { quoted: info });
    
  } catch (e) {
    console.error(e);
    await reply("Ocorreu um erro ao gerar o QR Code 💔");
  }
  break;
  
  case 'wikipedia':
  try {
    if (!q) return reply("Por favor, forneça um termo para buscar na Wikipédia.");
    
    nazu.react('📚');
    reply("🔍 Buscando informações na Wikipédia...");

    try {
      const respPT = await axios.get(`https://pt.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(q)}`);
      
      if (respPT.data && respPT.data.extract) {
        const titulo = respPT.data.title || q;
        const descricao = respPT.data.extract;
        const link = respPT.data.content_urls?.desktop?.page || '';
        const thumbnail = respPT.data.thumbnail?.source || '';
        
        let mensagem = `📖 *${titulo}*\n\n${descricao}\n\n`;
        
        if (link) {
          mensagem += `🔗 *Link:* ${link}\n`;
        }
        
        if (thumbnail) {
          await nazu.sendMessage(from, { 
            image: { url: thumbnail },
            caption: mensagem
          }, { quoted: info });
        } else {
          await reply(mensagem);
        }
        
        return;
      }
    } catch (err) {
      console.log("Erro na busca PT Wikipedia, tentando EN:", err.message);
    }

    try {
      const respEN = await axios.get(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(q)}`);
      
      if (respEN.data && respEN.data.extract) {
        const titulo = respEN.data.title || q;
        const descricao = respEN.data.extract;
        const link = respEN.data.content_urls?.desktop?.page || '';
        const thumbnail = respEN.data.thumbnail?.source || '';
        
        let mensagem = `📖 *${titulo}* (Inglês)\n\n${descricao}\n\n`;
        
        if (link) {
          mensagem += `🔗 *Link:* ${link}\n`;
        }
        
        if (thumbnail) {
          await nazu.sendMessage(from, { 
            image: { url: thumbnail },
            caption: mensagem
          }, { quoted: info });
        } else {
          await reply(mensagem);
        }
        
        return;
      }
    } catch (err) {
      console.log("Erro na busca EN Wikipedia:", err.message);
    }

    await reply("❌ Não foi possível encontrar informações sobre esse termo na Wikipédia. Tente usar palavras-chave diferentes.");
    
  } catch (e) {
    console.error(e);
    await reply("Ocorreu um erro ao buscar na Wikipédia 💔");
  }
  break;
  
  case 'dicionario':
  try {
    if (!q) return reply("Por favor, forneça uma palavra para buscar no dicionário.");
    
    nazu.react('📔');
    reply("🔍 Buscando significado no dicionário...");

    const palavra = q.trim().toLowerCase();

    const resp = await axios.get(`https://significado.herokuapp.com/${encodeURIComponent(palavra)}`);
    
    if (resp.data && resp.data.length > 0) {
      const significados = resp.data[0];
      
      let mensagem = `📘 *${palavra.toUpperCase()}*\n\n`;

      if (significados.class) {
        mensagem += `*Classe:* ${significados.class}\n\n`;
      }

      if (significados.meanings && significados.meanings.length > 0) {
        mensagem += `*Significados:*\n`;
        significados.meanings.forEach((significado, index) => {
          mensagem += `${index + 1}. ${significado}\n`;
        });
        mensagem += '\n';
      }

      if (significados.etymology) {
        mensagem += `*Etimologia:* ${significados.etymology}\n\n`;
      }
      
      await reply(mensagem);
    } else {
      const prompt = `Defina a palavra "${palavra}" em português. Forneça significado, classe gramatical e exemplos de uso.`;
      
      const bahz = (await axios.post("https://api.cognima.com.br/api/ia/chat?key=CognimaTeamFreeKey", { 
        message: prompt, 
        chat_id: `dicionario_${sender.split('@')[0]}`, 
        model_name: "cognimai"
      })).data;
      
      await reply(`📔 *${palavra.toUpperCase()}*\n\n${bahz.reply}`);
    }
  } catch (e) {
    console.error(e);
    try {
      const prompt = `Defina a palavra "${q}" em português. Forneça significado, classe gramatical e exemplos de uso.`;
      
      const bahz = (await axios.post("https://api.cognima.com.br/api/ia/chat?key=CognimaTeamFreeKey", { 
        message: prompt, 
        chat_id: `dicionario_${sender.split('@')[0]}`, 
        model_name: "cognimai"
      })).data;
      
      await reply(`📔 *${q.toUpperCase()}*\n\n${bahz.reply}`);
    } catch (err) {
      await reply("Ocorreu um erro ao buscar no dicionário 💔");
    }
  }
  break;
  
  
  case 'backupgp':
  try {
    if (!isGroup) return reply("Este comando só pode ser usado em grupos!");
    if (!isGroupAdmin && !isOwner) return reply("Apenas administradores podem fazer backup do grupo!");
    
    nazu.react('💾');
    reply("📦 Criando backup do grupo, aguarde...");
    
    // Diretório de backup
    const backupDir = pathz.join(__dirname, '..', 'database', 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    if (!fs.existsSync(groupFile)) {
      return reply("❌ Não há dados deste grupo para fazer backup!");
    }
    
    // Obter os dados do grupo
    const groupData = JSON.parse(fs.readFileSync(groupFile, 'utf-8'));
    
    // Obter informações detalhadas do grupo
    const completeGroupInfo = await nazu.groupMetadata(from);
    const groupDesc = completeGroupInfo.desc || '';
    const adminList = groupAdmins.map(admin => {
      const adminName = completeGroupInfo.participants.find(p => p.id === admin)?.name || admin.split('@')[0];
      return {
        id: admin,
        name: adminName
      };
    });
    
    // Metadata do grupo
    const metadata = {
      id: from,
      name: groupName,
      description: groupDesc,
      createdAt: new Date().toISOString(),
      memberCount: AllgroupMembers.length,
      admins: adminList,
      createdBy: pushname || sender.split('@')[0]
    };
    
    // Criar o objeto de backup
    const backup = {
      metadata,
      configs: groupData, // Dados de configuração do grupo
      internalData: true, // Indicador de que este backup inclui dados internos
      version: "2.0"
    };
    
    // Nome do arquivo de backup
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `${from.split('@')[0]}_${timestamp}.json`;
    const backupFilePath = pathz.join(backupDir, backupFileName);
    
    // Salvar o backup
    fs.writeFileSync(backupFilePath, JSON.stringify(backup, null, 2));
    
    // Enviar o arquivo de backup
    await nazu.sendMessage(from, {
      document: fs.readFileSync(backupFilePath),
      mimetype: 'application/json',
      fileName: backupFileName,
      caption: `✅ *Backup do Grupo Concluído*\n\n*Nome do Grupo:* ${groupName}\n*Data:* ${new Date().toLocaleString('pt-BR')}\n*Membros:* ${AllgroupMembers.length}\n*Admins:* ${adminList.length}\n*Descrição:* ${groupDesc.substring(0, 50)}${groupDesc.length > 50 ? '...' : ''}\n\nPara restaurar, use o comando *${prefix}restaurargp*`
    }, { quoted: info });
    
  } catch (e) {
    console.error(e);
    await reply("Ocorreu um erro ao criar o backup do grupo 💔");
  }
  break;
  
  case 'restaurargp':
  try {
    if (!isGroup) return reply("Este comando só pode ser usado em grupos!");
    if (!isGroupAdmin && !isOwner) return reply("Apenas administradores podem restaurar o grupo!");
    
    if (!isQuotedDocument) {
      return reply(`Por favor, marque o arquivo de backup JSON enviado anteriormente pelo comando ${prefix}backupgp`);
    }
    
    nazu.react('🔄');
    reply("🔄 Restaurando backup, aguarde...");
    
    // Obter o arquivo de backup
    const backupMsg = info.message.extendedTextMessage.contextInfo.quotedMessage.documentMessage;
    if (!backupMsg.fileName.endsWith('.json')) {
      return reply("❌ O arquivo marcado não é um backup válido! (deve ter extensão .json)");
    }
    
    const backupBuffer = await getFileBuffer(backupMsg, "document");
    let backupData;
    
    try {
      backupData = JSON.parse(backupBuffer.toString());
    } catch (err) {
      return reply("❌ O arquivo de backup está corrompido ou não é um JSON válido!");
    }
    
    // Verificar se é um backup válido (compatível com versões antigas e novas)
    const isLegacyBackup = backupData.data && backupData.metadata;
    const isNewBackup = backupData.configs && backupData.metadata;
    
    if (!isLegacyBackup && !isNewBackup) {
      return reply("❌ O arquivo de backup não é válido!");
    }
    
    // Mapear para o formato correto se for backup legado
    if (isLegacyBackup) {
      backupData.configs = backupData.data;
      backupData.version = "1.0";
    }
    
    // Verificar se o backup é para este grupo
    if (backupData.metadata.id !== from) {
      return reply(`⚠️ Este backup pertence a outro grupo (${backupData.metadata.name || 'desconhecido'}).\n\nDeseja restaurar mesmo assim? Responda com *sim* para confirmar.`);
      // Você pode adicionar uma confirmação aqui se quiser
    }
    
    let currentData = {};
    if (fs.existsSync(groupFile)) {
      currentData = JSON.parse(fs.readFileSync(groupFile, 'utf-8'));
    }
    
    // Criar um backup dos dados atuais antes de restaurar
    const backupDir = pathz.join(__dirname, '..', 'database', 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const autoBackupFileName = `auto_${from.split('@')[0]}_${timestamp}.json`;
    const autoBackupFilePath = pathz.join(backupDir, autoBackupFileName);
    
    // Obter informações do grupo atual para o backup automático
    const completeGroupInfo = await nazu.groupMetadata(from);
    const groupDesc = completeGroupInfo.desc || '';
    const adminList = groupAdmins.map(admin => {
      const adminName = completeGroupInfo.participants.find(p => p.id === admin)?.name || admin.split('@')[0];
      return {
        id: admin,
        name: adminName
      };
    });
    
    const autoBackup = {
      metadata: {
        id: from,
        name: groupName,
        description: groupDesc,
        createdAt: new Date().toISOString(),
        memberCount: AllgroupMembers.length,
        admins: adminList,
        createdBy: 'auto_backup_before_restore',
        note: 'Este é um backup automático criado antes de uma restauração'
      },
      configs: currentData,
      internalData: true,
      version: "2.0"
    };
    
    fs.writeFileSync(autoBackupFilePath, JSON.stringify(autoBackup, null, 2));
    
    // Restaurar os dados (backup.configs contém as configurações do grupo)
    fs.writeFileSync(groupFile, JSON.stringify(backupData.configs, null, 2));
    
    // Aplicar configurações adicionais caso o backup contenha essa informação
    try {
      // Tentar atualizar nome do grupo se diferente e bot for admin
      if (isBotAdmin && 
          backupData.metadata.name && 
          backupData.metadata.name !== groupName) {
        await nazu.groupUpdateSubject(from, backupData.metadata.name);
      }
      
      // Tentar atualizar descrição do grupo se diferente e bot for admin
      if (isBotAdmin && 
          backupData.metadata.description && 
          backupData.metadata.description !== groupDesc) {
        await nazu.groupUpdateDescription(from, backupData.metadata.description);
      }
      
      if (isBotAdmin && 
          backupData.metadata.admins && 
          backupData.metadata.admins !== adminList) {
          for(user of backupData.metadata.admins) {
          if(!adminList.includes(user)) {
        await nazu.groupParticipantsUpdate(from, [user.id], "promote");
        }}
      }
    } catch (err) {
      console.log("Erro ao atualizar nome/descrição:", err);
    }
    
    // Gerar resumo das alterações
    let alteracoes = [];
    
    // Verificar mudanças nas configurações
    const configDiffs = {
      antilinkgp: currentData.antilinkgp !== backupData.configs.antilinkgp ? "Proteção contra links" : null,
      antiporn: currentData.antiporn !== backupData.configs.antiporn ? "Proteção contra conteúdo adulto" : null,
      antiflood: currentData.antiflood !== backupData.configs.antiflood ? "Proteção contra flood" : null,
      soadm: currentData.soadm !== backupData.configs.soadm ? "Modo só administradores" : null,
      modobrincadeira: currentData.modobrincadeira !== backupData.configs.modobrincadeira ? "Modo brincadeira" : null,
      modorpg: currentData.modorpg !== backupData.configs.modorpg ? "Modo RPG" : null,
      autoSticker: currentData.autoSticker !== backupData.configs.autoSticker ? "Auto figurinhas" : null,
      autodl: currentData.autodl !== backupData.configs.autodl ? "Download automático" : null
    };
    
    // Adicionar mudanças encontradas
    Object.entries(configDiffs).forEach(([key, value]) => {
      if (value) {
        const status = backupData.configs[key] ? "ativado" : "desativado";
        alteracoes.push(`- ${value}: ${status}`);
      }
    });
    
    // Nome do grupo e descrição se foram alterados
    if (isBotAdmin && backupData.metadata.name && backupData.metadata.name !== groupName) {
      alteracoes.push(`- Nome do grupo: alterado para "${backupData.metadata.name}"`);
    }
    
    if (isBotAdmin && backupData.metadata.description && backupData.metadata.description !== groupDesc) {
      alteracoes.push(`- Descrição do grupo: atualizada`);
    }
    
    if (isBotAdmin && 
          backupData.metadata.admins && 
          backupData.metadata.admins !== adminList) {
        alteracoes.push(`- Administradores: restaurados`);
      }
      
    // Informações sobre o backup
    const backupDate = new Date(backupData.metadata.createdAt || Date.now()).toLocaleString('pt-BR');
    
    let mensagem = `✅ *Backup Restaurado com Sucesso*\n\n`;
    mensagem += `*Nome do Grupo:* ${backupData.metadata.name || groupName}\n`;
    mensagem += `*Data do Backup:* ${backupDate}\n\n`;
    
    if (alteracoes.length > 0) {
      mensagem += `*Alterações aplicadas:*\n${alteracoes.join('\n')}\n\n`;
    } else {
      mensagem += `*Observação:* Nenhuma alteração significativa nas configurações.\n\n`;
    }
    
    mensagem += `⚠️ Um backup automático dos dados anteriores foi criado caso precise reverter.`;
    
    await reply(mensagem);
    
  } catch (e) {
    console.error(e);
    await reply("Ocorreu um erro ao restaurar o backup do grupo 💔");
  }
  break;
  
  case 'imagine': case 'img':
  try {
    const modelos = [
      "cognimai-realism",
      "cognimai-anime", 
      "cognimai-3d",
      "cognimai-cablyai",
      "cognimai-turbo",
      "cognimai-pro",
      "cognimai"
    ];
    if (!q) {
      let ajuda = `🖼️ *GERADOR DE IMAGENS* 🖼️\n\n`+`⚠️ Use: *${prefix}imagine modelo/prompt*\n\n`+`📝 *Modelos disponíveis:*\n`+`• realism (Padrão)\n`+`• anime\n`+`• 3d\n`+`• cablyai\n`+`• turbo\n`+`• pro\n\n`+`Exemplo: *${prefix}imagine anime/gato samurai*`;
      return reply(ajuda);
    };
    nazu.react('🔄');
    const [inputModelo, ...promptArray] = q.split('/');
    const prompt = promptArray.join('/').trim() || inputModelo.trim();
    const modeloEscolhido = inputModelo.trim().toLowerCase();
    const modelosParaTestar = modeloEscolhido && modelos.includes(`cognimai-${modeloEscolhido}`)
      ? [`cognimai-${modeloEscolhido}`]
      : modelos;
    for (const model of modelosParaTestar) {
      try {
        const url = `https://api.cognima.com.br/api/ia/image/generate?key=CognimaTeamFreeKey&prompt=${encodeURIComponent(prompt)}&model_name=${model}`;
        await nazu.sendMessage(from, { image: { url }, caption: `🎨 Modelo: ${model.replace('cognimai-', '') || 'padrão'}\n📌 Prompt: ${prompt}`});
        nazu.react('✅');
        return;
      } catch (e) {
        console.log(`❌ ${model} falhou, tentando próximo...`);
      }
    }

    await reply('❌ Todos os modelos falharam. Tente um prompt diferente.');
    nazu.react('❌');

  } catch (e) {
    console.error('Erro grave:', e);
    reply("ocorreu um erro 💔");
  }
  break;
  
  case 'code-gen': try {
  if(!isPremium) return reply('Apenas usuários premium.');
  if(!q) return reply("Falta digitar o prompt 🤔");
  nazu.react('✅');
  const response = await axios.get(`https://api.cognima.com.br/api/ia/code-gen?key=CognimaTeamFreeKey&q=${q}`, { responseType: 'arraybuffer' });
  const mimeType = response.headers['content-type'];
  const contentDisposition = response.headers['content-disposition'];
  let nomeArquivo = Date.now();
  if (contentDisposition) {
    const match = contentDisposition.match(/filename="?([^"]+)"?/);
    if (match) nomeArquivo = match[1];
  };
  if (!nomeArquivo.includes('.')) {
    const extensoes = { 'application/json': 'json', 'text/plain': 'txt', 'application/javascript': 'js', 'application/zip': 'zip', 'application/pdf': 'pdf' };
    nomeArquivo += '.' + (extensoes[mimeType] || 'bin');
  };
  await nazu.sendMessage(from, { document: response.data, mimetype: mimeType, fileName: nomeArquivo }, { quoted: info });
  } catch(e) {
  console.error(e);
  await reply("ocorreu um erro 💔");
  };
  break
  
  case 'cog':
  try {
    if(!isPremium) return reply('Apenas usuários premium.');
    if (!q) return nazu.react('❌');

    await nazu.react('⚒️');

    const response = await axios.post("https://api.cognima.com.br/api/ia/chat?key=CognimaTeamFreeKey", {
      message: q,
      chat_id: `cog_ultra_${sender.split('@')[0]}`,
      model_name: "cognimai-ultra",
    });

    const resultPriv = response.data;
    if (!resultPriv.success) return reply("ocorreu um erro 💔");

    let responseText = resultPriv.reply;
    if (resultPriv.sources.length > 0) {
      responseText += `\n\nFontes utilizadas:\n${resultPriv.sources.join('\n')}`;
    };

    if (resultPriv.file?.content) {
      await nazu.sendMessage(from, {
        document: Buffer.from(resultPriv.file.content, "utf-8"),
        fileName: resultPriv.file.filename,
        mimetype: resultPriv.file.mimetype,
        caption: responseText
    }, { quoted: info });
    } else {
      await reply(responseText);
    }
  } catch (e) {
    console.error(e);
    await reply("ocorreu um erro 💔");
  }
  break;
  
  
  //FERRAMENTAS
  case 'encurtalink': case 'tinyurl': try {
  if(!q) return reply(`❌️ *Forma incorreta, use está como exemplo:* ${prefix + command} https://instagram.com/hiudyyy_`);
  anu = await axios.get(`https://tinyurl.com/api-create.php?url=${q}`);
  reply(`${anu.data}`);
  } catch(e) {
  console.error(e);
  await reply("ocorreu um erro 💔");
  };
  break

  case 'nick': case 'gerarnick': try {
  if(!q) return reply('Digite o nick após o comando.');
  datzn = await styleText(q);
  await reply(datzn.join('\n'));
  } catch(e) {
  console.error(e);
  await reply("ocorreu um erro 💔");
  };
  break
  
  case 'printsite': case 'ssweb': try{
  if(!q) return reply(`Cade o link?`)
  await nazu.react('✅');
  await nazu.sendMessage(from, {image: {url: `https://image.thum.io/get/fullpage/${q}`}}, {quoted: info})
  } catch(e) {
  console.error(e);
  await reply("ocorreu um erro 💔");
  };
  break
  
  case 'upload':case 'imgpralink':case 'videopralink':case 'gerarlink': try {
  if(!isQuotedImage && !isQuotedVideo && !isQuotedDocument && !isQuotedAudio) return reply(`Marque um video, uma foto, um audio ou um documento`);
  var foto1 = isQuotedImage ? info.message.extendedTextMessage.contextInfo.quotedMessage.imageMessage : {};
  var video1 = isQuotedVideo ? info.message.extendedTextMessage.contextInfo.quotedMessage.videoMessage : {};
  var docc1 = isQuotedDocument ? info.message.extendedTextMessage.contextInfo.quotedMessage.documentMessage: {};
  var audio1 = isQuotedAudio ? info.message.extendedTextMessage.contextInfo.quotedMessage.audioMessage : "";
  let media = {};
  if(isQuotedDocument) {
  media = await getFileBuffer(docc1, "document");
  } else if(isQuotedVideo) {
  media = await getFileBuffer(video1, "video");
  } else if(isQuotedImage) {
  media = await getFileBuffer(foto1, "image");
  } else if(isQuotedAudio) {
  media = await getFileBuffer(audio1, "audio");
  };
  let linkz = await upload(media);
  await reply(`${linkz}`);
  } catch(e) {
  console.error(e);
  await reply("ocorreu um erro 💔");
  }
  break

  
  //DOWNLOADS
  case 'assistir': try {
  if(!q) return reply('Cadê o nome do filme ou episódio de série? 🤔');
  await reply('Um momento, estou buscando as informações para você 🕵️‍♂️');
  datyz = await FilmesDL(q);
  if(!datyz || !datyz.url) return reply('Desculpe, não consegui encontrar nada. Tente com outro nome de filme ou série. 😔');
  await nazu.sendMessage(from, {image: { url: datyz.img },caption: `Aqui está o que encontrei! 🎬\n\n*Nome*: ${datyz.name}\n\nSe tudo estiver certo, você pode assistir no link abaixo:\n${datyz.url}`}, { quoted: info });
  } catch(e) {
  console.error(e);
  await reply("ocorreu um erro 💔");
  };
  break;
  
  case 'apkmod':
case 'mod':
try {
if (!q) return reply('Digite o nome do aplicativo.');
datinha = await apkMod(q);
if (datinha.error) return reply(datinha.error);
anu = await axios.get(`https://tinyurl.com/api-create.php?url=${datinha.download}`);
linkEncurtado = anu.data;
await nazu.sendMessage(from, { image: { url: datinha.image }, caption: `\n💻 *Informações do Aplicativo*\n\n🔸 *Título:* ${datinha.title}\n🔹 *Descrição:*  \n_${datinha.description}_\n\n📋 *Detalhes Técnicos:*  \n- 📛 *Nome:* ${datinha.details.name}  \n- 🗓️ *Última Atualização:* ${datinha.details.updated}  \n- 🆚 *Versão:* ${datinha.details.version}  \n- 🏷️ *Categoria:* ${datinha.details.category}  \n- 🛠️ *Modificação:* ${datinha.details.modinfo}  \n- 📦 *Tamanho:* ${datinha.details.size}  \n- ⭐ *Classificação:* ${datinha.details.rate}  \n- 📱 *Requer Android:* ${datinha.details.requires}  \n- 👨‍💻 *Desenvolvedor:* ${datinha.details.developer}  \n- 🔗 *Google Play:* ${datinha.details.googleplay}  \n- 📥 *Downloads:* ${datinha.details.downloads}  \n\n⬇️ *Download do APK:*  \n📤 _Tentando enviar o APK para você..._  \nCaso não seja enviado, use o link abaixo:  \n🔗 ${linkEncurtado}` }, { quoted: info });
await nazu.sendMessage(from, { document: { url: datinha.download }, mimetype: 'application/vnd.android.package-archive', fileName: `${datinha.details.name}.apk`, caption: `🔒 *Instalação Bloqueada pelo Play Protect?* 🔒\n\nCaso a instalação do aplicativo seja bloqueada pelo Play Protect, basta seguir as instruções do vídeo abaixo:\n\n🎥 https://youtu.be/FqQB2vojzlU?si=9qPnu_PGj3GU3L4_`}, {quoted: info});
  } catch (e) {
console.log(e);
await reply("ocorreu um erro 💔");
};
break;
  
  case 'mcplugin':case 'mcplugins': try {
  if(!q) return reply('Cadê o nome do plugin para eu pesquisar? 🤔');
  await nazu.react('🔍');
  datz = await mcPlugin(q);
  if(!datz.ok) return reply(datz.msg);
  await nazu.sendMessage(from, {image: {url: datz.image}, caption: `🔍 Encontrei esse plugin aqui:\n\n*Nome*: _${datz.name}_\n*Publicado por*: _${datz.creator}_\n*Descrição*: _${datz.desc}_\n*Link para download*: _${datz.url}_\n\n> 💖 `}, {quoted: info});
  } catch(e) {
  console.error(e);
  await reply("ocorreu um erro 💔");
  };
  break
  
  case 'play':
case 'ytmp3':
  try {
    // Verificar se o usuário forneceu uma consulta
    if (!q) {
      return reply(`📝 Digite o nome da música ou um link do YouTube.\n\n📌 *Exemplo:* ${prefix + command} Back to Black`);
    }
    
    // Reagir à mensagem para indicar processamento
    await nazu.react('🔍');
    
    // Determinar se é um link ou uma pesquisa
    let videoUrl;
    let videoInfo;
    
    if (q.includes('youtube.com') || q.includes('youtu.be')) {
      // É um link direto do YouTube
      videoUrl = q;
      videoInfo = await youtube.search(q);
    } else {
      // É uma pesquisa por texto
      videoInfo = await youtube.search(q);
      if (!videoInfo.ok) {
        await nazu.react('❌');
        return reply(`❌ Erro na pesquisa: ${videoInfo.msg}`);
      }
      videoUrl = videoInfo.data.url;
    }
    
    // Verificar se encontrou informações do vídeo
    if (!videoInfo.ok) {
      await nazu.react('❌');
      return reply(`❌ Não foi possível encontrar informações sobre o vídeo: ${videoInfo.msg}`);
    }
    
    // Verificar se o vídeo não é muito longo (limite de 30 minutos)
    if (videoInfo.data.seconds > 1800) {
      await nazu.react('⏱️');
      return reply(`⚠️ Este vídeo é muito longo (${videoInfo.data.timestamp}).\nPor favor, escolha um vídeo com menos de 30 minutos.`);
    }
    
    // Formatar visualizações com pontos para melhor legibilidade
    const views = typeof videoInfo.data.views === 'number' 
      ? videoInfo.data.views.toLocaleString('pt-BR')
      : videoInfo.data.views;
    
    // Preparar a descrição (limitada a 100 caracteres)
    const description = videoInfo.data.description
      ? videoInfo.data.description.slice(0, 100) + (videoInfo.data.description.length > 100 ? '...' : '')
      : 'Sem descrição disponível';
    
    // Criar uma mensagem informativa sobre o vídeo encontrado
    const caption = `
🎵 *Música Encontrada* 🎵

📌 *Título:* ${videoInfo.data.title}
👤 *Artista/Canal:* ${videoInfo.data.author.name}
⏱ *Duração:* ${videoInfo.data.timestamp} (${videoInfo.data.seconds} segundos)
👀 *Visualizações:* ${views}
📅 *Publicado:* ${videoInfo.data.ago}
📜 *Descrição:* ${description}
🔗 *Link:* ${videoInfo.data.url}

🎧 *Baixando e processando sua música, aguarde...*`;

    // Enviar mensagem com thumbnail e informações
    await nazu.sendMessage(from, { 
      image: { url: videoInfo.data.thumbnail }, 
      caption: caption, 
      footer: `${nomebot} • Versão ${botVersion}` 
    }, { quoted: info });
    
    // Atualizar reação para indicar download
    await nazu.react('⬇️');
    
    // Baixar o áudio
    const dlRes = await youtube.mp3(videoUrl);
    if (!dlRes.ok) {
      await nazu.react('❌');
      return reply(`❌ Erro ao baixar o áudio: ${dlRes.msg}`);
    }
    
    // Tentar enviar como áudio (preferencial)
    try {
      await nazu.react('🎵');
      await nazu.sendMessage(from, {
        audio: { url: dlRes.url }, 
        fileName: `${videoInfo.data.title}.mp3`, 
        mimetype: 'audio/mp4'
      }, { quoted: info });
    } catch (audioError) {
      // Se falhar devido ao tamanho, tentar enviar como documento
      if (String(audioError).includes("ENOSPC") || String(audioError).includes("size")) {
        await reply('📦 Arquivo muito grande para enviar como áudio, enviando como documento...');
        await nazu.sendMessage(from, {
          document: { url: dlRes.url }, 
          fileName: `${videoInfo.data.title}.mp3`, 
          mimetype: 'audio/mpeg'
        }, { quoted: info });
      } else {
        // Se for outro erro, relançar para tratamento no catch externo
        throw audioError;
      }
    }
    
    // Reação final de sucesso
    await nazu.react('✅');
    
  } catch (error) {
    // Tratamento de erros específicos
    if (String(error).includes("age")) {
      await nazu.react('🔞');
      return reply(`🔞 Este conteúdo possui restrição de idade e não pode ser baixado.`);
    }
    
    // Log do erro e resposta genérica
    console.error('Erro no comando play/ytmp3:', error);
    await nazu.react('❌');
    reply("❌ Ocorreu um erro ao processar sua solicitação. Por favor, tente novamente mais tarde.");
  }
  break;

case 'playvid':
case 'ytmp4':
  try {
    if (!q) return reply(`Digite o nome do vídeo ou um link do YouTube.\n> Ex: ${prefix + command} Back to Black`);
    nazu.react(['💖']);
    let videoUrl;
    if (q.includes('youtube.com') || q.includes('youtu.be')) {
      videoUrl = q;
    } else {
      const searchResult = await youtube.search(q);
      if (!searchResult.ok) return reply(searchResult.msg);
      videoUrl = searchResult.data.url;
    }
    const videoInfo = (await youtube.search(q));
    if (!videoInfo.ok) return reply(videoInfo.msg);
    const caption = `
🎬 *Vídeo Encontrado* 🎬

📌 *Título:* ${videoInfo.data.title}
👤 *Artista/Canal:* ${videoInfo.data.author.name}
⏱ *Duração:* ${videoInfo.data.timestamp} (${videoInfo.data.seconds} segundos)
👀 *Visualizações:* ${videoInfo.data.views.toLocaleString()}
📅 *Publicado:* ${videoInfo.data.ago}
📜 *Descrição:* ${videoInfo.data.description.slice(0, 100)}${videoInfo.data.description.length > 100 ? '...' : ''}
🔗 *Link:* ${videoInfo.data.url}

📹 *Enviando seu vídeo, aguarde!*`;
    await nazu.sendMessage(from, { 
      image: { url: videoInfo.data.thumbnail }, 
      caption: caption, 
      footer: `By: ${nomebot}` 
    }, { quoted: info });
    const dlRes = await youtube.mp4(videoUrl);
    if (!dlRes.ok) return reply(dlRes.msg);
    try {
      await nazu.sendMessage(from, {
        video: { url: dlRes.url }, 
        fileName: `${videoInfo.data.title}.mp4`, 
        mimetype: 'video/mp4'
      }, { quoted: info });
    } catch (videoError) {
      if (String(videoError).includes("ENOSPC") || String(videoError).includes("size")) {
        await reply('Arquivo muito grande, enviando como documento...');
        await nazu.sendMessage(from, {
          document: { url: dlRes.url }, 
          fileName: `${videoInfo.data.title}.mp4`, 
          mimetype: 'video/mp4'
        }, { quoted: info });
      } else {
        throw videoError;
      }
    }
  } catch (e) {
    console.error(e);
    reply("Ocorreu um erro 💔");
  }
  break;

case 'play2':
case 'ytmp32':
  try {
    if (!q) return reply(`Digite o nome da música ou um link do YouTube.\n> Ex: ${prefix + command} Back to Black`);
    nazu.react(['💖']);
    let videoUrl;
    if (q.includes('youtube.com') || q.includes('youtu.be')) {
      videoUrl = q;
    } else {
      const searchResult = await youtube.search(q);
      if (!searchResult.ok) return reply(searchResult.msg);
      videoUrl = searchResult.data.url;
    }
    const videoInfo = (await youtube.search(q));
    if (!videoInfo.ok) return reply(videoInfo.msg);
    const caption = `
🎵 *Música Encontrada* 🎵

📌 *Título:* ${videoInfo.data.title}
👤 *Artista/Canal:* ${videoInfo.data.author.name}
⏱ *Duração:* ${videoInfo.data.timestamp} (${videoInfo.data.seconds} segundos)
👀 *Visualizações:* ${videoInfo.data.views.toLocaleString()}
📅 *Publicado:* ${videoInfo.data.ago}
📜 *Descrição:* ${videoInfo.data.description.slice(0, 100)}${videoInfo.data.description.length > 100 ? '...' : ''}
🔗 *Link:* ${videoInfo.data.url}

🎧 *Enviando sua música, aguarde!*`;
    await nazu.sendMessage(from, { 
      image: { url: videoInfo.data.thumbnail }, 
      caption: caption, 
      footer: `By: ${nomebot}` 
    }, { quoted: info });
    const dlRes = await youtube.mp3v2(videoUrl);
    if (!dlRes.ok) return reply(dlRes.msg);
    try {
      await nazu.sendMessage(from, {
        audio: { url: dlRes.url }, 
        fileName: `${videoInfo.data.title}.mp3`, 
        mimetype: 'audio/mp4'
      }, { quoted: info });
    } catch (audioError) {
      if (String(audioError).includes("ENOSPC") || String(audioError).includes("size")) {
        await reply('Arquivo muito grande, enviando como documento...');
        await nazu.sendMessage(from, {
          document: { url: dlRes.url }, 
          fileName: `${videoInfo.data.title}.mp3`, 
          mimetype: 'audio/mpeg'
        }, { quoted: info });
      } else {
        throw audioError;
      }
    }
  } catch (e) {
    console.error(e);
    reply("Ocorreu um erro 💔");
  }
  break;

case 'playvid2':
case 'ytmp42':
  try {
    if (!q) return reply(`Digite o nome do vídeo ou um link do YouTube.\n> Ex: ${prefix + command} Back to Black`);
    nazu.react(['💖']);
    let videoUrl;
    if (q.includes('youtube.com') || q.includes('youtu.be')) {
      videoUrl = q;
    } else {
      const searchResult = await youtube.search(q);
      if (!searchResult.ok) return reply(searchResult.msg);
      videoUrl = searchResult.data.url;
    }
    const videoInfo = (await youtube.search(q));
    if (!videoInfo.ok) return reply(videoInfo.msg);
    const caption = `
🎬 *Vídeo Encontrado* 🎬

📌 *Título:* ${videoInfo.data.title}
👤 *Artista/Canal:* ${videoInfo.data.author.name}
⏱ *Duração:* ${videoInfo.data.timestamp} (${videoInfo.data.seconds} segundos)
👀 *Visualizações:* ${videoInfo.data.views.toLocaleString()}
📅 *Publicado:* ${videoInfo.data.ago}
📜 *Descrição:* ${videoInfo.data.description.slice(0, 100)}${videoInfo.data.description.length > 100 ? '...' : ''}
🔗 *Link:* ${videoInfo.data.url}

📹 *Enviando seu vídeo, aguarde!*`;
    await nazu.sendMessage(from, { 
      image: { url: videoInfo.data.thumbnail }, 
      caption: caption, 
      footer: `By: ${nomebot}` 
    }, { quoted: info });
    const dlRes = await youtube.mp4v2(videoUrl);
    if (!dlRes.ok) return reply(dlRes.msg);
    try {
      await nazu.sendMessage(from, {
        video: { url: dlRes.url }, 
        fileName: `${videoInfo.data.title}.mp4`, 
        mimetype: 'video/mp4'
      }, { quoted: info });
    } catch (videoError) {
      if (String(videoError).includes("ENOSPC") || String(videoError).includes("size")) {
        await reply('Arquivo muito grande, enviando como documento...');
        await nazu.sendMessage(from, {
          document: { url: dlRes.url }, 
          fileName: `${videoInfo.data.title}.mp4`, 
          mimetype: 'video/mp4'
        }, { quoted: info });
      } else {
        throw videoError;
      }
    }
  } catch (e) {
    console.error(e);
    reply("Ocorreu um erro 💔");
  }
  break;
  
  case 'letra': case 'lyrics': try {
  if(!q) return reply('cade o nome da musica?');
  await reply(await Lyrics(q));
  } catch (e) {
    console.error(e);
    reply("ocorreu um erro 💔");
  };
  break;
  
  case 'tiktok': case 'tiktokaudio': case 'tiktokvideo': case 'tiktoks': case 'tiktoksearch': case 'ttk': case 'tkk':
   try {
    if (!q) return reply(`Digite um nome ou o link de um vídeo.\n> Ex: ${prefix}${command} Gato`);
    nazu.react(['💖']);
    let isTikTokUrl = /^https?:\/\/(?:www\.|m\.|vm\.|t\.)?tiktok\.com\//.test(q);
    let datinha = await (isTikTokUrl ? tiktok.dl(q) : tiktok.search(q));
    if (!datinha.ok) return reply(datinha.msg);
    let bahzz = [];
    if(datinha.urls.length > 1) {
    for (const urlz of datinha.urls) {
        bahzz.push({type: datinha.type, [datinha.type]: { url: urlz }});
    };
    await nazu.sendAlbumMessage(from, bahzz, { quoted: info });
    } else {
    await nazu.sendMessage(from, { [datinha.type]: { url: datinha.urls[0] }}, {quoted: info});
    }
    if (datinha.audio) await nazu.sendMessage(from, { audio: { url: datinha.audio }, mimetype: 'audio/mp4' }, { quoted: info });
   } catch (e) {
    console.error(e);
    reply("ocorreu um erro 💔");
   }
   break;
   
   case 'instagram': case 'igdl': case 'ig': case 'instavideo': case 'igstory':
  try {
    if (!q) return reply(`Digite um link do Instagram.\n> Ex: ${prefix}${command} https://www.instagram.com/reel/DFaq_X7uoiT/?igsh=M3Q3N2ZyMWU1M3Bo`);
    nazu.react(['📌']);
    const datinha = await igdl.dl(q);
    if (!datinha.ok) return reply(datinha.msg);
    let bahzz = [];
    if(datinha.data.length > 1) {
    await Promise.all(datinha.data.map(urlz => bahzz.push({type: urlz.type, [urlz.type]: urlz.buff})));
    await nazu.sendAlbumMessage(from, bahzz, { quoted: info });
    } else {
    await nazu.sendMessage(from, {[datinha.data[0].type]: datinha.data[0].buff}, {quoted: info});
    };
  } catch (e) {
    console.error(e);
    reply("ocorreu um erro 💔");
  }
  break;
    
  case 'pinterest': case 'pin': case 'pinterestdl': case 'pinterestsearch':
   try {
    if (!q) return reply(`Digite um nome ou envie um link do Pinterest.\n> Ex: ${prefix}${command} Gatos\n> Ex: ${prefix}${command} https://www.pinterest.com/pin/123456789/`);  
    nazu.react(['📌']); 
    let datinha = await (/^https?:\/\/(?:[a-zA-Z0-9-]+\.)?pinterest\.\w{2,6}(?:\.\w{2})?\/pin\/\d+|https?:\/\/pin\.it\/[a-zA-Z0-9]+/.test(q) ? pinterest.dl(q) : pinterest.search(q));
    if (!datinha.ok) return reply(datinha.msg);
    slakk = [];
    for (const urlz of datinha.urls) {
     slakk.push({[datinha.type]: {url: urlz}});
    };
    await nazu.sendAlbumMessage(from, slakk, { quoted: info });
   } catch (e) {
    console.error(e);
    reply("ocorreu um erro 💔");
   }
   break;
   
   
   // MENUS DO BOT
  case 'menu': case 'help':
    try {
      // Verificar se existe mídia personalizada para o menu
      const menuVideoPath = __dirname + '/../midias/menu.mp4';
      const menuImagePath = __dirname + '/../midias/menu.jpg';
      
      // Determinar se vamos usar vídeo ou imagem
      const useVideo = fs.existsSync(menuVideoPath);
      const mediaPath = useVideo ? menuVideoPath : menuImagePath;
      
      // Verificar se pelo menos um dos arquivos existe
      if (!fs.existsSync(mediaPath)) {
        // Usar uma imagem padrão se nenhuma mídia for encontrada
        const defaultImage = { url: 'https://i.ibb.co/Wpm9xvV/20230710-221917.jpg' };
        const menuText = await menu(prefix, nomebot, pushname);
        
        await nazu.sendMessage(from, {
          image: defaultImage,
          caption: menuText,
        }, { quoted: info });
        
        return;
      }
      
      // Carregar a mídia do menu
      const mediaBuffer = fs.readFileSync(mediaPath);
      
      // Obter o texto do menu
      const menuText = await menu(prefix, nomebot, pushname);
      
      // Adicionar informações extras ao menu
      const enhancedMenuText = `${menuText}`;
      
      // Enviar o menu com a mídia apropriada
      await nazu.sendMessage(from, {
        [useVideo ? 'video' : 'image']: mediaBuffer,
        caption: enhancedMenuText,
        gifPlayback: useVideo,
        mimetype: useVideo ? 'video/mp4' : 'image/jpeg'
      }, { quoted: info });
      
      // Reagir à mensagem
      await nazu.react('📚');
      
    } catch (error) {
      console.error('Erro ao enviar menu:', error);
      
      // Fallback: enviar apenas o texto do menu se houver erro com a mídia
      const menuText = await menu(prefix, nomebot, pushname);
      await reply(`${menuText}\n\n⚠️ *Nota*: Ocorreu um erro ao carregar a mídia do menu.`);
    }
  break;
  // MENUS ESPECÍFICOS
  case 'alteradores': case 'menualterador': case 'menualteradores':
    try {
      await nazu.react(['🔄']);
      await sendMenuWithMedia('alteradores', menuAlterador);
    } catch (error) {
      console.error('Erro ao enviar menu de alteradores:', error);
      await reply("❌ Ocorreu um erro ao carregar o menu de alteradores");
    }
  break;

  case 'rpg': case 'menurpg':
    try {
      await nazu.react(['🎮']);
      await sendMenuWithMedia('rpg', menuRpg);
    } catch (error) {
      console.error('Erro ao enviar menu de RPG:', error);
      await reply("❌ Ocorreu um erro ao carregar o menu de RPG");
    }
  break;
    
  case 'menuia': case 'aimenu': case 'menuias':
    try {
      await nazu.react(['🤖']);
      await sendMenuWithMedia('ia', menuIa);
    } catch (error) {
      console.error('Erro ao enviar menu de IA:', error);
      await reply("❌ Ocorreu um erro ao carregar o menu de IA");
    }
  break;
    
  case 'menubn': case 'menubrincadeira': case 'menubrincadeiras':
    try {
      await nazu.react(['🎯']);
      
      // Obtém o conteúdo do menu
      let menuContent = await menubn(prefix, nomebot, pushname);
      
      // Filtra conteúdo impróprio se modo lite estiver ativado
  if (isModoLite) {
        // Remove seção de interações "hot"
        menuContent = menuContent.replace(/│╭─▸ \*Interações "Hot" 🔥:\*[\s\S]*?│(\n|$)/g, '│$1');
        
        // Lista de comandos impróprios para filtrar
        const comandosImpróprios = [
          'sexo', 'surubao', 'goza', 'gozar', 'mamar', 'mamada', 'beijob', 'beijarb',
          'pirocudo', 'bucetuda', 'tapar', 'racista', 'nazista', 'gostosa', 'machista',
          'homofobica', 'gostoso', 'nazista', 'machista', 'homofobico', 'racista',
          'rankgostosa', 'rankgostosas', 'ranknazista', 'rankgostoso', 'rankgostosos'
        ];
        
        // Remove cada comando impróprio do menu
    comandosImpróprios.forEach(cmd => {
          const regex = new RegExp(`││◕⁠➜ ${prefix}${cmd}\\n`, 'g');
          menuContent = menuContent.replace(regex, '');
        });
        
        // Adiciona aviso de modo lite ativado
        menuContent += '\n\n⚠️ *Nota:* Alguns comandos foram ocultados pelo Modo Lite';
      }
      
      await sendMenuWithMedia('brincadeiras', async () => menuContent);
    } catch (error) {
      console.error('Erro ao enviar menu de brincadeiras:', error);
      await reply("❌ Ocorreu um erro ao carregar o menu de brincadeiras");
    }
  break;
    
  case 'menudown': case 'menudownload': case 'menudownloads':
    try {
      await nazu.react(['⬇️']);
      await sendMenuWithMedia('downloads', menudown);
    } catch (error) {
      console.error('Erro ao enviar menu de downloads:', error);
      await reply("❌ Ocorreu um erro ao carregar o menu de downloads");
    }
  break;
    
  case 'ferramentas': case 'menuferramentas': case 'menuferramenta':
    try {
      await nazu.react(['🔧']);
      await sendMenuWithMedia('ferramentas', menuFerramentas);
    } catch (error) {
      console.error('Erro ao enviar menu de ferramentas:', error);
      await reply("❌ Ocorreu um erro ao carregar o menu de ferramentas");
    }
  break;
    
  case 'menuadm': case 'menuadmin': case 'menuadmins':
    try {
      await nazu.react(['👑']);
      await sendMenuWithMedia('admin', menuadm);
    } catch (error) {
      console.error('Erro ao enviar menu de administração:', error);
      await reply("❌ Ocorreu um erro ao carregar o menu de administração");
    }
  break;
    
  case 'menumembros': case 'menumemb': case 'menugeral':
    try {
      await nazu.react(['👥']);
      await sendMenuWithMedia('membros', menuMembros);
    } catch (error) {
      console.error('Erro ao enviar menu de membros:', error);
      await reply("❌ Ocorreu um erro ao carregar o menu de membros");
    }
  break;
    
  case 'menudono': case 'ownermenu':
    try {
      if (!isOwner) {
        await reply("⚠️ Este menu é exclusivo para o dono do bot.");
        return;
      }
      
      await nazu.react(['👑']);
      await sendMenuWithMedia('dono', menuDono);
    } catch (error) {
      console.error('Erro ao enviar menu do dono:', error);
      await reply("❌ Ocorreu um erro ao carregar o menu do dono");
    }
  break;
    
  case 'stickermenu': case 'menusticker': case 'menufig':
    try {
      await nazu.react(['🖼️']);
      await sendMenuWithMedia('stickers', menuSticker);
    } catch (error) {
      console.error('Erro ao enviar menu de stickers:', error);
      await reply("❌ Ocorreu um erro ao carregar o menu de stickers");
    }
  break;
    
  // Função auxiliar para enviar menus com mídia
  async function sendMenuWithMedia(menuType, menuFunction) {
    // Verificar se existe mídia personalizada para o menu
    const menuVideoPath = __dirname + '/../midias/menu.mp4';
    const menuImagePath = __dirname + '/../midias/menu.jpg';
    
    // Determinar se vamos usar vídeo ou imagem
    const useVideo = fs.existsSync(menuVideoPath);
    const mediaPath = useVideo ? menuVideoPath : menuImagePath;
    
    // Verificar se pelo menos um dos arquivos existe
    if (!fs.existsSync(mediaPath)) {
      // Usar uma imagem padrão se nenhuma mídia for encontrada
      const defaultImage = { url: 'https://i.ibb.co/Wpm9xvV/20230710-221917.jpg' };
      const menuText = await menuFunction(prefix, nomebot, pushname);
      
      await nazu.sendMessage(from, {
        image: defaultImage,
        caption: menuText,
      }, { quoted: info });
      
      return;
    }
    
    // Carregar a mídia do menu
    const mediaBuffer = fs.readFileSync(mediaPath);
    
    // Obter o texto do menu
    const menuText = typeof menuFunction === 'function' ? 
      (typeof menuFunction.then === 'function' ? await menuFunction : await menuFunction(prefix, nomebot, pushname)) : 
      'Menu não disponível';
    
    // Adicionar informações extras ao menu
    const enhancedMenuText = `${menuText}`
    
    // Enviar o menu com a mídia apropriada
    await nazu.sendMessage(from, {
      [useVideo ? 'video' : 'image']: mediaBuffer,
      caption: enhancedMenuText,
      gifPlayback: useVideo,
      mimetype: useVideo ? 'video/mp4' : 'image/jpeg'
    }, { quoted: info });
  }
   
   
  //COMANDOS DE DONO BB
  case 'antipv3':
  try {
    if (!isOwner) return reply("Este comando é apenas para o meu dono 💔");
    antipvData.mode = antipvData.mode === 'antipv3' ? null : 'antipv3'; // Update in-memory variable
    fs.writeFileSync(__dirname + '/../database/antipv.json', JSON.stringify(antipvData, null, 2));
    await reply(`✅ Antipv3 ${antipvData.mode ? 'ativado' : 'desativado'}! O bot agora ${antipvData.mode ? 'bloqueia usuários que usam comandos no privado' : 'responde normalmente no privado'}.`);
    nazu.react('🔒');
  } catch (e) {
    console.error(e);
    await reply("Ocorreu um erro 💔");
  }
  break;
  
  case 'antipv2':
  try {
    if (!isOwner) return reply("Este comando é apenas para o meu dono 💔");
    antipvData.mode = antipvData.mode === 'antipv2' ? null : 'antipv2'; // Update in-memory variable
    fs.writeFileSync(__dirname + '/../database/antipv.json', JSON.stringify(antipvData, null, 2));
    await reply(`✅ Antipv2 ${antipvData.mode ? 'ativado' : 'desativado'}! O bot agora ${antipvData.mode ? 'avisa que comandos só funcionam em grupos no privado' : 'responde normalmente no privado'}.`);
    nazu.react('🔒');
  } catch (e) {
    console.error(e);
    await reply("Ocorreu um erro 💔");
  }
  break;
  case 'antipv':
  try {
    if (!isOwner) return reply("Este comando é apenas para o meu dono 💔");
    antipvData.mode = antipvData.mode === 'antipv' ? null : 'antipv';
    fs.writeFileSync(__dirname + '/../database/antipv.json', JSON.stringify(antipvData, null, 2));
    await reply(`✅ Antipv ${antipvData.mode ? 'ativado' : 'desativado'}! O bot agora ${antipvData.mode ? 'ignora mensagens no privado' : 'responde normalmente no privado'}.`);
    nazu.react('🔒');
  } catch (e) {
    console.error(e);
    await reply("Ocorreu um erro 💔");
  }
  break;
  
  case 'entrar':
  try {
    if (!isOwner) return reply("Este comando é apenas para o meu dono 💔");
    if (!q || !q.includes('chat.whatsapp.com')) return reply('Digite um link de convite válido! Exemplo: !entrar https://chat.whatsapp.com/...');
    const code = q.split('https://chat.whatsapp.com/')[1];
    await nazu.groupAcceptInvite(code).then((res) => {
      reply(`✅ Entrei no grupo com sucesso! ID: ${res}`);
      nazu.react('🎉');
    }).catch((err) => {
      reply('❌ Erro ao entrar no grupo. Link inválido ou permissão negada.');
    });
  } catch (e) {
    console.error(e);
    await reply("Ocorreu um erro 💔");
  }
  break;
  
  case 'tm':
  try {
    if (!isOwner) return reply("Este comando é apenas para o meu dono 💔");
    if (!q && !isQuotedImage && !isQuotedVideo) return reply('Digite uma mensagem ou marque uma imagem/vídeo! Exemplo: !tm Olá a todos!');
    let message = {};
    if (isQuotedImage) {
      const image = await getFileBuffer(info.message.extendedTextMessage.contextInfo.quotedMessage.imageMessage, 'image');
      message = { image, caption: q || 'Transmissão do dono!' };
    } else if (isQuotedVideo) {
      const video = await getFileBuffer(info.message.extendedTextMessage.contextInfo.quotedMessage.videoMessage, 'video');
      message = { video, caption: q || 'Transmissão do dono!' };
    } else {
      message = { text: q };
    }
    const groups = await nazu.groupFetchAllParticipating();
    for (const group of Object.values(groups)) {
      await new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * (30000 - 10000) + 10000)));
      await nazu.sendMessage(group.id, message);
    }
    await reply(`✅ Transmissão enviada para ${Object.keys(groups).length} grupos!`);
    nazu.react('📢');
  } catch (e) {
    console.error(e);
    await reply("Ocorreu um erro 💔");
  }
  break;
  
  case 'cases':
  if (!isOwner) return reply("Este comando é apenas para o meu dono");
  try {
    const indexContent = fs.readFileSync(__dirname + '/index.js', 'utf-8');
    const caseRegex = /case\s+'([^']+)'\s*:/g;
    const cases = new Set();
    let match;
    while ((match = caseRegex.exec(indexContent)) !== null) {
      cases.add(match[1]);
    };
    const multiCaseRegex = /case\s+'([^']+)'\s*:\s*case\s+'([^']+)'\s*:/g;
    while ((match = multiCaseRegex.exec(indexContent)) !== null) {
      cases.add(match[1]);
      cases.add(match[2]);
    };
    const caseList = Array.from(cases).sort();
    await reply(`📜 *Lista de Comandos (Cases)*:\n\n${caseList.join('\n')}\n\nTotal: ${caseList.length} comandos`);
    await nazu.react('✅');
  } catch (e) {
    console.error(e);
    await reply("ocorreu um erro 💔");
  }
  break;

  case 'getcase':
  if (!isOwner) return reply("Este comando é apenas para o meu dono");
  try {
    if (!q) return reply('❌ Digite o nome do comando. Exemplo: !getcase menu');
    const caseName = q.trim().toLowerCase();
    const indexContent = fs.readFileSync(__dirname + '/index.js', 'utf-8');
    const caseStartRegex = new RegExp(`case\\s+'${caseName}'\\s*:`, 'g');
    if (!caseStartRegex.test(indexContent)) {
      const multiCaseRegex = new RegExp(`case\\s+'[^']+'\\s*:\\s*case\\s+'${caseName}'\\s*:`, 'g');
      if (!multiCaseRegex.test(indexContent)) {
        return reply(`❌ O comando *${caseName}* não foi encontrado.`);
      };
    };
    const switchStart = indexContent.indexOf('switch(command) {');
    const switchEnd = indexContent.lastIndexOf('}');
    const switchBlock = indexContent.slice(switchStart, switchEnd + 1);
    const caseBlocks = switchBlock.split(/case\s+'/);
    let targetCase = null;
    for (const block of caseBlocks) {
      if (block.startsWith(`${caseName}'`) || block.includes(`case '${caseName}'`)) {
        targetCase = block;
        break;
      };
    };
    if (!targetCase) return reply(`❌ O comando *${caseName}* não foi encontrado.`);
    const caseEndIndex = targetCase.indexOf('break;');
    let caseCode = targetCase;
    if (caseEndIndex !== -1) {
      caseCode = targetCase.slice(0, caseEndIndex + 6);
    };
    caseCode = `case '${caseName}':${caseCode}`;
    await nazu.sendMessage(from, { document: Buffer.from(caseCode, 'utf-8'), mimetype: 'text/plain', fileName: `${caseName}.txt` }, { quoted: info });
    await reply(`✅ Código do comando *${caseName}* enviado como documento!`);
    await nazu.react('✅');
  } catch (e) {
    console.error(e);
    await reply("ocorreu um erro 💔");
  }
  break;
  
  case 'boton':
case 'botoff':
  if (!isOwner) return reply("Este comando é apenas para o meu dono");
  try {
    const botStateFile = __dirname + '/../database/botState.json';
    // botState is already loaded and will be updated directly

    const isOn = botState.status === 'on';
    if (command === 'boton' && isOn) {
      return reply('🌟 O bot já está ativado!');
    }
    if (command === 'botoff' && !isOn) {
      return reply('🌙 O bot já está desativado!');
    }

    botState.status = command === 'boton' ? 'on' : 'off'; // Update in-memory variable
    fs.writeFileSync(botStateFile, JSON.stringify(botState, null, 2));

    const message = command === 'boton'
      ? '✅ *Bot ativado!* Agora todos podem usar os comandos.'
      : '✅ *Bot desativado!* Apenas o dono pode usar comandos.';
    
    await reply(message);
    await nazu.react('🔄');
  } catch (e) {
    console.error(e);
    await reply("ocorreu um erro 💔");
  }
break;

  case 'blockcmdg':
  if (!isOwner) return reply("Este comando é apenas para o meu dono");
  try {
    const cmdToBlock = q?.toLowerCase().split(' ')[0];
    const reason = q?.split(' ').slice(1).join(' ') || 'Sem motivo informado';
    if (!cmdToBlock) return reply('❌ Informe o comando a bloquear! Ex.: !blockcmd sticker');
    const blockFile = __dirname + '/../database/globalBlocks.json';
    globalBlocks.commands = globalBlocks.commands || {};
    globalBlocks.commands[cmdToBlock] = { reason, timestamp: Date.now() }; // Update in-memory variable
    fs.writeFileSync(blockFile, JSON.stringify(globalBlocks, null, 2));
    await reply(`✅ Comando *${cmdToBlock}* bloqueado globalmente!\nMotivo: ${reason}`);
    await nazu.react('🔒');
  } catch (e) {
    console.error(e);
    await reply("ocorreu um erro 💔");
  }
  break;

  case 'unblockcmdg':
  if (!isOwner) return reply("Este comando é apenas para o meu dono");
  try {
    const cmdToUnblock = q?.toLowerCase().split(' ')[0];
    if (!cmdToUnblock) return reply('❌ Informe o comando a desbloquear! Ex.: !unblockcmd sticker');
    const blockFile = __dirname + '/../database/globalBlocks.json';
    // globalBlocks is already loaded
    if (!globalBlocks.commands || !globalBlocks.commands[cmdToUnblock]) {
      return reply(`❌ O comando *${cmdToUnblock}* não está bloqueado!`);
    }
    delete globalBlocks.commands[cmdToUnblock]; // Update in-memory variable
    fs.writeFileSync(blockFile, JSON.stringify(globalBlocks, null, 2));
    await reply(`✅ Comando *${cmdToUnblock}* desbloqueado globalmente!`);
    await nazu.react('🔓');
  } catch (e) {
    console.error(e);
    await reply("ocorreu um erro 💔");
  }
  break;

  case 'blockuserg':
  if (!isOwner) return reply("Este comando é apenas para o meu dono");
  try {
    reason = q ? q.includes('@') ? q.includes(' ') ? q.split(' ').slice(1).join(' ') : "Não informado" : q : 'Não informado';
    menc_os3 = menc_os2.includes(' ') ? menc_os2.split(' ')[0] : menc_os2;
    if(!menc_os3) return reply("Marque alguém 🙄");
    const blockFile = __dirname + '/../database/globalBlocks.json';
    globalBlocks.users = globalBlocks.users || {};
    globalBlocks.users[menc_os3] = { reason, timestamp: Date.now() }; // Update in-memory variable
    fs.writeFileSync(blockFile, JSON.stringify(globalBlocks, null, 2));
    await reply(`✅ Usuário @${menc_os3.split('@')[0]} bloqueado globalmente!\nMotivo: ${reason}`, { mentions: [menc_os3] });
    await nazu.react('🔒');
  } catch (e) {
    console.error(e);
    await reply("ocorreu um erro 💔");
  }
  break;

  case 'unblockuserg':
  if (!isOwner) return reply("Este comando é apenas para o meu dono");
  try {
    if(!menc_os2) return reply("Marque alguém 🙄");
    const blockFile = __dirname + '/../database/globalBlocks.json';
    // globalBlocks is already loaded
    if (!globalBlocks.users || (!globalBlocks.users[menc_os2] && !globalBlocks.users[menc_os2.split('@')[0]])) {
      return reply(`❌ O usuário @${menc_os2.split('@')[0]} não está bloqueado!`, { mentions: [menc_os2] });
    }
    if (globalBlocks.users[menc_os2]) {
    delete globalBlocks.users[menc_os2]; // Update in-memory variable
    } else if (globalBlocks.users[menc_os2.split('@')[0]]) {
    delete globalBlocks.users[menc_os2.split('@')[0]]; // Update in-memory variable
    }
    fs.writeFileSync(blockFile, JSON.stringify(globalBlocks, null, 2));
    await reply(`✅ Usuário @${menc_os2.split('@')[0]} desbloqueado globalmente!`, { mentions: [menc_os2] });
    await nazu.react('🔓');
  } catch (e) {
    console.error(e);
    await reply("ocorreu um erro 💔");
  }
  break;

  case 'listblocks':
  if (!isOwner) return reply("Este comando é apenas para o meu dono");
  try {
    const blockFile = __dirname + '/../database/globalBlocks.json';
    // globalBlocks is already loaded
    const blockedCommands = globalBlocks.commands ? Object.entries(globalBlocks.commands).map(([cmd, data]) => `🔧 *${cmd}* - Motivo: ${data.reason}`).join('\n') : 'Nenhum comando bloqueado.';
    const blockedUsers = globalBlocks.users ? Object.entries(globalBlocks.users).map(([user, data]) => {const userId = user.split('@')[0]; return `👤 *${userId}* - Motivo: ${data.reason}`;}).join('\n') : 'Nenhum usuário bloqueado.';
    const message = `🔒 *Bloqueios Globais - ${nomebot}* 🔒\n\n📜 *Comandos Bloqueados*:\n${blockedCommands}\n\n👥 *Usuários Bloqueados*:\n${blockedUsers}`;    
    await reply(message);
    await nazu.react('✅');
  } catch (e) {
    console.error(e);
    await reply("ocorreu um erro 💔");
  }
  break;

  case 'seradm': try {
  if(!isOwner) return reply("Este comando é apenas para o meu dono");
  await nazu.groupParticipantsUpdate(from, [sender], "promote");
  await nazu.react('✅');
  } catch(e) {
  console.error(e);
  await reply("ocorreu um erro 💔");
  };
  break

  case 'sermembro': try {
  if(!isOwner) return reply("Este comando é apenas para o meu dono");
  await nazu.groupParticipantsUpdate(from, [sender], "demote");
  await nazu.react('✅');
  } catch(e) {
  console.error(e);
  await reply("ocorreu um erro 💔");
  };
  break

   case 'prefixo':case 'numerodono':case 'nomedono':case 'nomebot': try {
    if(!isOwner) return reply("Este comando é apenas para o meu dono");
    if (!q) return reply(`Uso correto: ${prefix}${command} <valor>`);
     let config = JSON.parse(fs.readFileSync(__dirname + '/config.json'));
     config[command] = q;
     fs.writeFileSync(__dirname + '/config.json', JSON.stringify(config, null, 2));
     reply(`✅ ${command} atualizado para: *${q}*`);
   } catch (e) {
   console.error(e);
   reply("ocorreu um erro 💔");
   };
  break;
  
  case 'fotomenu':case 'videomenu':case 'mediamenu':case 'midiamenu': try {
   if(!isOwner) return reply("Este comando é apenas para o meu dono");
   if(fs.existsSync(__dirname+'/../midias/menu.jpg')) fs.unlinkSync(__dirname+'/../midias/menu.jpg');
   if(fs.existsSync(__dirname+'/../midias/menu.mp4')) fs.unlinkSync(__dirname+'/../midias/menu.mp4');
   var RSM = info.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    var boij2 = RSM?.imageMessage || info.message?.imageMessage || RSM?.viewOnceMessageV2?.message?.imageMessage || info.message?.viewOnceMessageV2?.message?.imageMessage || info.message?.viewOnceMessage?.message?.imageMessage || RSM?.viewOnceMessage?.message?.imageMessage;
   var boij = RSM?.videoMessage || info.message?.videoMessage || RSM?.viewOnceMessageV2?.message?.videoMessage || info.message?.viewOnceMessageV2?.message?.videoMessage || info.message?.viewOnceMessage?.message?.videoMessage || RSM?.viewOnceMessage?.message?.videoMessage;
    if (!boij && !boij2) return reply(`Marque uma imagem ou um vídeo, com o comando: ${prefix + command} (mencionando a mídia)`);
    var isVideo2 = !!boij;
    var buffer = await getFileBuffer(isVideo2 ? boij : boij2, isVideo2 ? 'video' : 'image');
    fs.writeFileSync(__dirname+'/../midias/menu.' + (isVideo2 ? 'mp4' : 'jpg'), buffer);
    await reply('✅ Mídia do menu atualizada com sucesso.');
  } catch(e) {
   console.error(e);
   reply("ocorreu um erro 💔");
  }
  break
  
  case 'bangp':case 'unbangp':case 'desbangp': try {
  if(!isGroup) return reply("isso so pode ser usado em grupo 💔");
  if(!isOwner) return reply("Este comando é apenas para o meu dono");
  banGpIds[from] = !banGpIds[from]; // Update in-memory variable
  if(banGpIds[from]) {
  await reply('🚫 Grupo banido, apenas usuarios premium ou meu dono podem utilizar o bot aqui agora.');
  } else {
  await reply('✅ Grupo desbanido, todos podem utilizar o bot novamente.');
  };
  fs.writeFileSync(__dirname + `/../database/dono/bangp.json`, JSON.stringify(banGpIds));
  } catch(e) {
  console.error(e);
  await reply("ocorreu um erro 💔");
  };
  break
  
  case 'addpremium':case 'addvip':
  try {
    if (!isOwner) return reply("Este comando é apenas para o meu dono");
    if (!menc_os2) return reply("Marque alguém 🙄");
    if(!!premiumListaZinha[menc_os2]) return reply('O usuário ja esta na lista premium.');
    premiumListaZinha[menc_os2] = true; // Update in-memory variable
    await nazu.sendMessage(from, {text: `✅ @${menc_os2.split('@')[0]} foi adicionado(a) a lista premium.`, mentions: [menc_os2] }, { quoted: info });
    fs.writeFileSync(__dirname + `/../database/dono/premium.json`, JSON.stringify(premiumListaZinha));
  } catch (e) {
    console.error(e);
    reply("ocorreu um erro 💔");
  }
  break;
  
  case 'delpremium':case 'delvip':case 'rmpremium':case 'rmvip':
  try {
    if(!isOwner) return reply("Este comando é apenas para o meu dono");
    if(!menc_os2) return reply("Marque alguém 🙄");
    if(!premiumListaZinha[menc_os2]) return reply('O usuário não esta na lista premium.');
    delete premiumListaZinha[menc_os2]; // Update in-memory variable
    await nazu.sendMessage(from, {text: `🫡 @${menc_os2.split('@')[0]} foi removido(a) da lista premium.`, mentions: [menc_os2] }, { quoted: info });
    fs.writeFileSync(__dirname + `/../database/dono/premium.json`, JSON.stringify(premiumListaZinha));
  } catch (e) {
    console.error(e);
    reply("ocorreu um erro 💔");
  }
  break;
  
  case 'addpremiumgp':case 'addvipgp':
  try {
    if (!isOwner) return reply("Este comando é apenas para o meu dono");
    if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
    if(!!premiumListaZinha[from]) return reply('O grupo ja esta na lista premium.');
    premiumListaZinha[from] = true; // Update in-memory variable
    await nazu.sendMessage(from, {text: `✅ O grupo foi adicionado a lista premium.` }, { quoted: info });
    fs.writeFileSync(__dirname + `/../database/dono/premium.json`, JSON.stringify(premiumListaZinha));
  } catch (e) {
    console.error(e);
    reply("ocorreu um erro 💔");
  }
  break;
  
  case 'delpremiumgp':case 'delvipgp':case 'rmpremiumgp':case 'rmvipgp':
  try {
    if(!isOwner) return reply("Este comando é apenas para o meu dono");
    if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
    if(!premiumListaZinha[from]) return reply('O grupo não esta na lista premium.');
    delete premiumListaZinha[from]; // Update in-memory variable
    await nazu.sendMessage(from, {text: `🫡 O grupo foi removido da lista premium.` }, { quoted: info });
    fs.writeFileSync(__dirname + `/../database/dono/premium.json`, JSON.stringify(premiumListaZinha));
  } catch (e) {
    console.error(e);
    reply("ocorreu um erro 💔");
  }
  break;
  
  
  //COMANDOS GERAIS
  case 'rvisu':case 'open':case 'revelar': try {
  await nazu.react("👀");
  var RSMM = info.message?.extendedTextMessage?.contextInfo?.quotedMessage
  var boij22 = RSMM?.imageMessage || info.message?.imageMessage || RSMM?.viewOnceMessageV2?.message?.imageMessage || info.message?.viewOnceMessageV2?.message?.imageMessage || info.message?.viewOnceMessage?.message?.imageMessage || RSMM?.viewOnceMessage?.message?.imageMessage;
  var boijj = RSMM?.videoMessage || info.message?.videoMessage || RSMM?.viewOnceMessageV2?.message?.videoMessage || info.message?.viewOnceMessageV2?.message?.videoMessage || info.message?.viewOnceMessage?.message?.videoMessage || RSMM?.viewOnceMessage?.message?.videoMessage;
  var boij33 = RSMM?.audioMessage || info.message?.audioMessage || RSMM?.viewOnceMessageV2?.message?.audioMessage || info.message?.viewOnceMessageV2?.message?.audioMessage || info.message?.viewOnceMessage?.message?.audioMessage || RSMM?.viewOnceMessage?.message?.audioMessage;
  if(boijj) {
  var px = boijj;
  px.viewOnce = false;
  px.video = {url: px.url};
  await nazu.sendMessage(from,px,{quoted:info});
  } else if(boij22) {
  var px = boij22;
  px.viewOnce = false;
  px.image = {url: px.url};
  await nazu.sendMessage(from,px,{quoted:info});
  } else if(boij33) {
  var px = boij33;
  px.viewOnce = false;
  px.audio = {url: px.url};
  await nazu.sendMessage(from,px,{quoted:info});
  } else {
  return reply('Por favor, *mencione uma imagem, video ou áudio em visualização única* para executar o comando.');
  };
  } catch(e) {
  console.error(e);
  await reply("ocorreu um erro 💔");
  };
  break
  
  case 'rankativog':
  try {
    const userTotals = {};

    const groupFiles = fs.readdirSync(__dirname + '/../database/grupos').filter(file => file.endsWith('.json'));
    for (const file of groupFiles) {
      try {
        const groupData = JSON.parse(fs.readFileSync(__dirname + `/../database/grupos/${file}`));
        if (groupData.contador && Array.isArray(groupData.contador)) {
          groupData.contador.forEach(user => {
            const userId = user.id;
            if (!userTotals[userId]) {
              userTotals[userId] = {
                name: user.pushname || userId.split('@')[0],
                messages: 0,
                commands: 0,
                stickers: 0
              };
            }
            userTotals[userId].messages += (user.msg || 0);
            userTotals[userId].commands += (user.cmd || 0);
            userTotals[userId].stickers += (user.figu || 0);
          });
        }
      } catch (e) {
        console.error(`Erro ao ler ${file}:`, e);
      };
    };

    const rankedUsers = Object.entries(userTotals) .map(([id, data]) => ({ id, name: data.name, total: data.messages + data.commands + data.stickers, messages: data.messages, commands: data.commands, stickers: data.stickers})).filter(user => user.total > 0).sort((a, b) => b.total - a.total).slice(0, 5);
      
    const rankMessage = rankedUsers.length > 0 ? rankedUsers.map((user, index) => { const emoji = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🏅'; return `${emoji} *${index + 1}. @${user.id.split('@')[0]}* - ${user.total} interações\n` + `   💬 Msgs: ${user.messages} | ⚒️ Cmds: ${user.commands} | 🎨 Figus: ${user.stickers}`; }).join('\n\n') : 'Nenhum dado de atividade registrado.';

    const finalMessage = `🏆 *Ranking Global de Atividade - ${nomebot}* 🏆\n\n${rankMessage}\n\n✨ *Total de Usuários*: ${Object.keys(userTotals).length}\n📊 *Bot*: ${nomebot} by ${nomedono} ✨`;

    await nazu.sendMessage(from, { text: finalMessage, mentions: rankedUsers.map(user => user.id).filter(id => id.includes('@s.whatsapp.net')) }, { quoted: info });
  } catch (e) {
    console.error(e);
    await reply("ocorreu um erro 💔");
  }
break;

  case 'rankativos': 
  case 'rankativo': try {
    if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
    blue67 = groupData.contador.sort((a, b) => ((a.figu == undefined ? a.figu = 0 : a.figu + a.msg + a.cmd) < (b.figu == undefined ? b.figu = 0 : b.figu + b.cmd + b.msg)) ? 0 : -1);
    menc = [];
    blad = `*🏆 Rank dos ${blue67.length < 10 ? blue67.length : 10} mais ativos do grupo:*\n`;
    for (i6 = 0; i6 < (blue67.length < 10 ? blue67.length : 10); i6++) {
        if (i6 != null) blad += `\n*🏅 ${i6 + 1}º Lugar:* @${blue67[i6].id.split('@')[0]}\n- mensagens encaminhadas: *${blue67[i6].msg}*\n- comandos executados: *${blue67[i6].cmd}*\n- Figurinhas encaminhadas: *${blue67[i6].figu}*\n`;
        if(!groupData.mark) groupData.mark = {};
        if(!['0', 'marca'].includes(groupData.mark[blue67[i6].id])) {
        menc.push(blue67[i6].id);
        };
    };
    await nazu.sendMessage(from, {text: blad, mentions: menc}, {quoted: info});
  } catch(e) {
  console.error(e);
  await reply("ocorreu um erro 💔");
  };
  break;
  
  case 'rankinativos': 
  case 'rankinativo': try {
    if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
    blue67 = groupData.contador.sort((a, b) => (a.msg + a.cmd) - (b.msg + b.cmd));
    menc = [];
    blad = `*🗑️ Rank dos ${blue67.length < 10 ? blue67.length : 10} mais inativos do grupo:*\n`;
    for (i6 = 0; i6 < (blue67.length < 10 ? blue67.length : 10); i6++) {
        if (i6 != null) blad += `\n*🏅 ${i6 + 1}º Lugar:* @${blue67[i6].id.split('@')[0]}\n- mensagens encaminhadas: *${blue67[i6].msg}*\n- comandos executados: *${blue67[i6].cmd}*\n- Figurinhas encaminhadas: *${blue67[i6].figu}*\n`;
        if(!groupData.mark) groupData.mark = {};
        if(!['0', 'marca'].includes(groupData.mark[blue67[i6].id])) {
        menc.push(blue67[i6].id);
        };
    };
    await nazu.sendMessage(from, {text: blad, mentions: menc}, {quoted: info});
  } catch(e) {
  console.error(e);
  reply("ocorreu um erro 💔");
  };
  break;
  
  case 'totalcmd':
  case 'totalcomando': try {
    fs.readFile(__dirname + '/index.js', 'utf8', async (err, data) => {
      if (err) throw err;
      const comandos = [...data.matchAll(/case [`'"](\w+)[`'"]/g)].map(m => m[1]);
      await nazu.sendMessage(from, {image: {url: `https://api.cognima.com.br/api/banner/counter?key=CognimaTeamFreeKey&num=${String(comandos.length)}&theme=miku`}, caption: `╭〔 🤖 *Meus Comandos* 〕╮\n`+`┣ 📌 Total: *${comandos.length}* comandos\n`+`╰━━━━━━━━━━━━━━━╯`}, { quoted: info });
    });
    } catch(e) {
    console.error(e);
    await reply("ocorreu um erro 💔");
    }
  break;
 
 case 'meustatus':
  try {
    let groupMessages = 0;
    let groupCommands = 0;
    let groupStickers = 0;
    if (isGroup && groupData.contador && Array.isArray(groupData.contador)) {
      const userData = groupData.contador.find(u => u.id === sender);
      if (userData) {
        groupMessages = userData.msg || 0;
        groupCommands = userData.cmd || 0;
        groupStickers = userData.figu || 0;
      };
    };
    let totalMessages = 0;
    let totalCommands = 0;
    let totalStickers = 0;
    const groupFiles = fs.readdirSync(__dirname + '/../database/grupos').filter(file => file.endsWith('.json'));
    for (const file of groupFiles) {
      try {
        const groupData = JSON.parse(fs.readFileSync(__dirname + `/../database/grupos/${file}`));
        if (groupData.contador && Array.isArray(groupData.contador)) {
          const userData = groupData.contador.find(u => u.id === sender);
          if (userData) {
            totalMessages += (userData.msg || 0);
            totalCommands += (userData.cmd || 0);
            totalStickers += (userData.figu || 0);
          };
        };
      } catch (e) {
        console.error(`Erro ao ler ${file}:`, e);
      };
    };
    const userName = pushname || sender.split('@')[0];
    const userStatus = isOwner ? 'Dono' : isPremium ? 'Premium' : isGroupAdmin ? 'Admin' : 'Membro';
    let profilePic = null;
    try {
      profilePic = await nazu.profilePictureUrl(sender, 'image');
    } catch (e) {};
    const statusMessage = `📊 *Meu Status - ${userName}* 📊\n\n👤 *Nome*: ${userName}\n📱 *Número*: @${sender.split('@')[0]}\n⭐ *Status*: ${userStatus}\n\n${isGroup ? `\n📌 *No Grupo: ${groupName}*\n💬 Mensagens: ${groupMessages}\n⚒️ Comandos: ${groupCommands}\n🎨 Figurinhas: ${groupStickers}\n` : ''}\n\n🌐 *Geral (Todos os Grupos)*\n💬 Mensagens: ${totalMessages}\n⚒️ Comandos: ${totalCommands}\n🎨 Figurinhas: ${totalStickers}\n\n✨ *Bot*: ${nomebot} by ${nomedono} ✨`;
    if (profilePic) {
      await nazu.sendMessage(from, { image: { url: profilePic }, caption: statusMessage, mentions: [sender] }, { quoted: info });
    } else {
      await nazu.sendMessage(from, { text: statusMessage, mentions: [sender] }, { quoted: info });
    };
  } catch (e) {
    console.error(e);
    await reply("ocorreu um erro 💔");
  };
  break;
  
  case 'statusbot':
  try {
    const uptime = process.uptime();
    const uptimeStr = `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${Math.floor(uptime % 60)}s`;
    const groups = await nazu.groupFetchAllParticipating();
    const totalGroups = Object.keys(groups).length;
    let totalMessages = 0;
    let totalCommands = 0;
    let totalStickers = 0;
    const groupFiles = fs.readdirSync(__dirname + '/../database/grupos').filter(file => file.endsWith('.json'));
    for (const file of groupFiles) {
      try {
        const groupData = JSON.parse(fs.readFileSync(__dirname + `/../database/grupos/${file}`));
        if (groupData.contador && Array.isArray(groupData.contador)) {
          groupData.contador.forEach(user => {
            totalMessages += (user.msg || 0);
            totalCommands += (user.cmd || 0);
            totalStickers += (user.figu || 0);
          });
        };
      } catch (e) {
        console.error(`Erro ao ler ${file}:`, e);
      };
    };
    const memoryUsage = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
    const { version } = JSON.parse(fs.readFileSync(__dirname + '/../../package.json'));
    const statusMessage = `📡 *Status do ${nomebot}* 📡\n\n⏳ *Tempo Online*: ${uptimeStr}\n👥 *Grupos*: ${totalGroups}\n💬 *Mensagens Totais*: ${totalMessages}\n⚒️ *Comandos Executados*: ${totalCommands}\n🎨 *Figurinhas Enviadas*: ${totalStickers}\n🧠 *Ram Usada*: ${memoryUsage} MB\n📌 *Versão*: ${version}\n\n✨ *Criado por*: ${nomedono} ✨
    `;
    await nazu.sendMessage(from, { text: statusMessage }, { quoted: info });
  } catch (e) {
    console.error(e);
    await reply("ocorreu um erro 💔");
  };
  break;
  
  case 'topcmd':
  case 'topcmds':
  case 'comandosmaisusados':
  try {
    await nazu.react('📊');
    
    // Obtém os comandos mais usados
    const topCommands = commandStats.getMostUsedCommands(10);
    
    // Gera o menu com os comandos mais usados
    const menu = await menuTopCmd(prefix, nomebot, pushname, topCommands);
    
    // Envia o menu
    await reply(menu);
  } catch (e) {
    console.error(e);
    await reply("ocorreu um erro 💔");
  }
  break;
  
  case 'cmdinfo':
  case 'comandoinfo':
  try {
    if (!q) return reply(`Por favor, especifique um comando para ver suas estatísticas.\nExemplo: ${prefix}cmdinfo menu`);
    
    // Remove o prefixo se o usuário incluiu
    const cmdName = q.startsWith(prefix) ? q.slice(prefix.length) : q;
    
    // Obtém as estatísticas do comando
    const stats = commandStats.getCommandStats(cmdName);
    
    if (!stats) {
      return reply(`❌ Comando *${cmdName}* não encontrado ou nunca foi usado.`);
    }
    
    // Formata os usuários que mais usaram o comando
    const topUsersText = stats.topUsers.length > 0 
      ? stats.topUsers.map((user, index) => {
          return `${index + 1}º @${user.userId.split('@')[0]} - ${user.count} usos`;
        }).join('\n')
      : 'Nenhum usuário registrado';
    
    // Formata a data da última utilização
    const lastUsed = new Date(stats.lastUsed).toLocaleString('pt-BR');
    
    // Monta a mensagem
    const infoMessage = `📊 *Estatísticas do Comando: ${prefix}${stats.name}* 📊\n\n` +
      `📈 *Total de Usos*: ${stats.count}\n` +
      `👥 *Usuários Únicos*: ${stats.uniqueUsers}\n` +
      `🕒 *Último Uso*: ${lastUsed}\n\n` +
      `🏆 *Top Usuários*:\n${topUsersText}\n\n` +
      `✨ *Bot*: ${nomebot} by ${nomedono} ✨`;
    
    // Envia a mensagem com menções aos usuários
    await nazu.sendMessage(from, { 
      text: infoMessage, 
      mentions: stats.topUsers.map(u => u.userId)
    }, { quoted: info });
    
    await nazu.react('📈');
  } catch (e) {
    console.error(e);
    await reply("ocorreu um erro 💔");
  }
  break;
  
  case 'statusgp': case 'dadosgp': try {
    if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
    const groupInfo = await nazu.groupMetadata(from);
    const totalMembers = groupInfo.participants.length;
    const totalAdmins = groupAdmins.length;
    const groupCreated = groupInfo.creation ? new Date(groupInfo.creation * 1000).toLocaleDateString('pt-BR') : 'Desconhecida';
    let totalMessages = 0;
    let totalCommands = 0;
    let totalStickers = 0;
    if (groupData.contador && Array.isArray(groupData.contador)) {
      groupData.contador.forEach(user => {
        totalMessages += (user.msg || 0);
        totalCommands += (user.cmd || 0);
        totalStickers += (user.figu || 0);
      });
    };
    const settings = [
      `🔞 Antiporn: ${isAntiPorn ? 'Ativado' : 'Desativado'}`,
      `🔗 Antilink: ${isAntiLinkGp ? 'Ativado' : 'Desativado'}`,
      `🎲 Modo Brincadeira: ${isModoBn ? 'Ativado' : 'Desativado'}`,
      `🧙 Modo RPG: ${isModoRpg ? 'Ativado' : 'Desativado'}`,
      `👑 Apenas Admins: ${isOnlyAdmin ? 'Ativado' : 'Desativado'}`
    ].join('\n');
    const statsMessage = `\n📊 *Estatísticas do Grupo: ${groupName}* 📊\n\n👥 *Total de Membros*: ${totalMembers}\n👑 *Administradores*: ${totalAdmins}\n📅 *Criado em*: ${groupCreated}\n💬 *Mensagens Totais*: ${totalMessages}\n⚒️ *Comandos Usados*: ${totalCommands}\n🎨 *Figurinhas Enviadas*: ${totalStickers}\n\n⚙️ *Configurações*:\n${settings}\n\n✨ *Bot*: ${nomebot} by ${nomedono} ✨`;
    await nazu.sendMessage(from, { text: statsMessage }, { quoted: info });
  } catch (e) {
    console.error(e);
    await reply("ocorreu um erro 💔");
  }
break;

case 'dono':
  try {
    let donoInfo = `👑 *Informações do Dono & Bot* 👑\n\n`;
    donoInfo += `🤖 *Nome do Bot*: ${nomebot}\n`;
    donoInfo += `👤 *Dono*: ${nomedono}\n`;
    donoInfo += `📱 *Número do Dono*: wa.me/${numerodono.replace(/\D/g, '')}\n`;
    donoInfo += `👨‍💻 *Criador*: Hiudy\n`;
    donoInfo += `📡 *Prefixo*: ${prefix}\n`;
    await reply(donoInfo);
    await nazu.react('✅');
  } catch (e) {
    console.error(e);
    await reply("ocorreu um erro 💔");
  }
  break;

  case 'criador':
  try {
    let criadorInfo = `🧠 *Sobre o Criador* 🧠\n\n`;
    criadorInfo += `👨‍💻 *Nome*: Hiudy\n`;
    criadorInfo += `🌟 *Sobre*: Hiudy é um desenvolvedor apaixonado por tecnologia e automação, criador da Nazuna\n`;
    criadorInfo += `📜 *História do Bot*: A Nazuna foi criada em 2023 com o objetivo de trazer diversão, utilidades e um sistema de RPG interativo para grupos do WhatsApp. Inspirada em outros bots, ela foi desenvolvida com Node.js e a biblioteca Baileys para oferecer uma experiência única.\n`;
    criadorInfo += `💡 *Objetivo*: Proporcionar entretenimento, ferramentas úteis e um ambiente interativo para comunidades no WhatsApp.\n`;
    criadorInfo += `🔗 *GitHub*: https://github.com/hiudyy/nazuna\n`;
    criadorInfo += `💖 *Apoie*: Dê uma estrela no repositório para apoiar o projeto!\n`;
    await reply(criadorInfo);
    await nazu.react('✅');
  } catch (e) {
    console.error(e);
    await reply("ocorreu um erro 💔");
  }
  break;

case 'ping':
  try {
    await nazu.react(['🔄']);
    
    // Calcula a latência da mensagem
    const timestamp = Date.now();
    const speedConverted = (timestamp - (info.messageTimestamp * 1000)) / 1000;

    // Coleta informações do sistema
    const uptimeBot = formatUptime(process.uptime(), true);
    const uptimeSistema = formatUptime(os.uptime(), true);
    
    // Informações de memória
    const ramTotalGb = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
    const ramLivreGb = (os.freemem() / 1024 / 1024 / 1024).toFixed(2);
    const ramSistemaUsadaGb = (ramTotalGb - ramLivreGb).toFixed(2);
    const ramUsadaPorcentagem = ((ramSistemaUsadaGb / ramTotalGb) * 100).toFixed(0);
    const ramBotProcessoMb = (process.memoryUsage().rss / 1024 / 1024).toFixed(2);

    // Cria barras de progresso para visualização
    const criarBarra = (porcentagem, tamanho = 10) => {
      const preenchido = Math.round((porcentagem / 100) * tamanho);
      return '█'.repeat(preenchido) + '░'.repeat(tamanho - preenchido);
    };
    
    const ramBarra = criarBarra(ramUsadaPorcentagem);
    
    // Informações de CPU
    const cpuInfo = os.cpus()[0];
    const cpuModel = cpuInfo.model.replace(/\(R\)/g, '®').replace(/\(TM\)/g, '™');
    const cpuCores = os.cpus().length;
    const cpuLoad = os.loadavg()[0].toFixed(2);
    const nodeVersao = process.version;
    
    // Informações de grupos
    const getGroups = await nazu.groupFetchAllParticipating();
    const totalGrupos = Object.keys(getGroups).length;

    // Informações de disco
    const diskSpace = await getDiskSpaceInfo();
    const diskUsedPercentage = parseFloat(diskSpace.percentUsed);
    const diskBarra = criarBarra(diskUsedPercentage);
    
    // Status de resposta (baseado na latência)
    let statusEmoji = '🟢'; // Bom
    let statusTexto = 'Excelente';
    
    if (speedConverted > 2) {
      statusEmoji = '🟡';
      statusTexto = 'Bom';
    }
    if (speedConverted > 5) {
      statusEmoji = '🟠';
      statusTexto = 'Médio';
    }
    if (speedConverted > 8) {
      statusEmoji = '🔴';
      statusTexto = 'Ruim';
    }

    // Constrói a mensagem de resposta com design melhorado
    const mensagem = `
╭━━━「 ${statusEmoji} *STATUS DO BOT* ${statusEmoji} 」━━━
│
│ 🤖 *Informações do Bot*
│ ├ 📛 Nome: *${nomebot}*
│ ├ 🔰 Versão: *${botVersion}*
│ ├ 🔑 Prefixo: *${prefixo}*
│ ├ 👑 Dono: *${nomedono}*
│ ├ 📊 Grupos: *${totalGrupos}*
│ ╰ ⏱️ Online há: *${uptimeBot}*
│
│ 📡 *Conexão* ${statusEmoji}
│ ├ 📶 Latência: *${speedConverted.toFixed(3)}s*
│ ╰ 📊 Status: *${statusTexto}*
│
│ 💻 *Sistema*
│ ├ 🏢 OS: *${os.platform()} (${os.release()})*
│ ├ 🔩 Arquitetura: *${os.arch()}*
│ ├ 🧠 Processador: *${cpuModel}*
│ ├ 📊 Núcleos: *${cpuCores}*
│ ├ ⚙️ Carga CPU: *${cpuLoad}%*
│ ╰ ⏱️ Uptime: *${uptimeSistema}*
│
│ 📊 *Recursos*
│ ├ ${ramBarra} RAM: *${ramSistemaUsadaGb}/${ramTotalGb} GB (${ramUsadaPorcentagem}%)*
│ ├ 💾 RAM Bot: *${ramBotProcessoMb} MB*
│ ├ ${diskBarra} Disco: *${diskSpace.usedGb}/${diskSpace.totalGb} GB (${diskSpace.percentUsed})*
│ ╰ 🔄 Node.js: *${nodeVersao}*
│
╰━━━「 ${nomebot} 」━━━
    `.trim();

    // Gera imagem dinâmica para o ping
    const pingImageUrl = `https://api.cognima.com.br/api/banner/counter?key=CognimaTeamFreeKey&num=${String(speedConverted.toFixed(3)).replace('.', '')}&theme=original`;

    await nazu.sendMessage(from, { 
      image: { url: pingImageUrl }, 
      caption: mensagem 
    }, { quoted: info });

    await nazu.react(['🏓']);
  } catch (e) {
    console.error("Erro no comando ping:", e);
    await reply("❌ Ocorreu um erro ao processar o comando ping");
    await nazu.react(['❌']);
  };
  break;
  
  
  //COMANDOS DE FIGURINHAS
  case 'toimg':
  if(!isQuotedSticker) return reply('Por favor, *mencione um sticker* para executar o comando.');
  try {
  buff = await getFileBuffer(info.message.extendedTextMessage.contextInfo.quotedMessage.stickerMessage, 'sticker');
  await nazu.sendMessage(from, {image: buff}, {quoted: info});
  } catch(error) {
  await reply("ocorreu um erro 💔");
  };
  break

  case 'qc': try {
  if(!q) return reply('Falta o texto.');
   let ppimg = "";
   try {
   ppimg = await nazu.profilePictureUrl(sender, 'image');
   } catch {
   ppimg = 'https://telegra.ph/file/b5427ea4b8701bc47e751.jpg'
   };
  const json = {"type": "quote","format": "png","backgroundColor": "#FFFFFF","width": 512,"height": 768,"scale": 2,"messages": [{"entities": [],"avatar": true,"from": {"id": 1,"name": pushname,"photo": {"url": ppimg}},"text": q,"replyMessage": {}}]};
  res = await axios.post('https://bot.lyo.su/quote/generate', json, {headers: {'Content-Type': 'application/json'}});
  await sendSticker(nazu, from, { sticker: Buffer.from(res.data.result.image, 'base64'), author: 'Hiudy', packname: 'By:', type: 'image' }, {quoted: info });
  } catch(e) {
  console.error(e);
  await reply("ocorreu um erro 💔");
  };
  break;
  
  case 'emojimix': try {
  emoji1 = q.split(`/`)[0];emoji2 = q.split(`/`)[1];
  if(!q || !emoji1 || !emoji2) return reply(`Formato errado, utilize:\n${prefix}${command} emoji1/emoji2\nEx: ${prefix}${command} 🤓/🙄`);
  datzc = await emojiMix(emoji1, emoji2);
  await sendSticker(nazu, from, { sticker: {url: datzc}, author: 'Hiudy', packname: 'By:', type: 'image'}, { quoted: info });
  } catch(e) {
  console.error(e);
  await reply("ocorreu um erro 💔");
  };
  break;
  
  case 'ttp': try {
  if(!q) return reply('Cadê o texto?');
  cor = ["f702ff","ff0202","00ff2e","efff00","00ecff","3100ff","ffb400","ff00b0","00ff95","efff00"];
  fonte = ["Days%20One","Domine","Exo","Fredoka%20One","Gentium%20Basic","Gloria%20Hallelujah","Great%20Vibes","Orbitron","PT%20Serif","Pacifico"];
  cores = cor[Math.floor(Math.random() * (cor.length))];
  fontes = fonte[Math.floor(Math.random() * (fonte.length))];
  await sendSticker(nazu, from, { sticker: {url: `https://huratera.sirv.com/PicsArt_08-01-10.00.42.png?profile=Example-Text&text.0.text=${q}&text.0.outline.color=000000&text.0.outline.blur=0&text.0.outline.opacity=55&text.0.color=${cores}&text.0.font.family=${fontes}&text.0.background.color=ff0000`}, author: 'Hiudy', packname: 'By:', type: 'image'}, { quoted: info });
  } catch(e) {
  console.error(e);
  await reply("ocorreu um erro 💔");
  };
  break;
  
  case 'brat': try {
  if(!q) return reply('falta o texto');
  await sendSticker(nazu, from, { sticker: {url: `https://api.cognima.com.br/api/image/brat?key=CognimaTeamFreeKey&texto=${encodeURIComponent(q)}`}, author: 'Hiudy', packname: 'By:', type: 'image'}, { quoted: info });
  } catch(e) {
  console.error(e);
  };
  break;
  
  case 'st':case 'stk':case 'sticker':case 's': try {
    var RSM = info.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    var boij2 = RSM?.imageMessage || info.message?.imageMessage || RSM?.viewOnceMessageV2?.message?.imageMessage || info.message?.viewOnceMessageV2?.message?.imageMessage || info.message?.viewOnceMessage?.message?.imageMessage || RSM?.viewOnceMessage?.message?.imageMessage;
   var boij = RSM?.videoMessage || info.message?.videoMessage || RSM?.viewOnceMessageV2?.message?.videoMessage || info.message?.viewOnceMessageV2?.message?.videoMessage || info.message?.viewOnceMessage?.message?.videoMessage || RSM?.viewOnceMessage?.message?.videoMessage;
    if (!boij && !boij2) return reply(`Marque uma imagem ou um vídeo de até 9.9 segundos para fazer figurinha, com o comando: ${prefix + command} (mencionando a mídia)`);
    var isVideo2 = !!boij;
    if (isVideo2 && boij.seconds > 9.9) return reply(`O vídeo precisa ter no máximo 9.9 segundos para ser convertido em figurinha.`);
    var buffer = await getFileBuffer(isVideo2 ? boij : boij2, isVideo2 ? 'video' : 'image')
    await sendSticker(nazu, from, { sticker: buffer, author: 'Hiudy', packname: 'By:', type: isVideo2 ? 'video' : 'image'}, { quoted: info });
  } catch(e) {
  console.error(e);
  await reply("ocorreu um erro 💔");
  };
  break
  
  case 'st2':case 'stk2':case 'sticker2':case 's2': try {
    var RSM = info.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    var boij2 = RSM?.imageMessage || info.message?.imageMessage || RSM?.viewOnceMessageV2?.message?.imageMessage || info.message?.viewOnceMessageV2?.message?.imageMessage || info.message?.viewOnceMessage?.message?.imageMessage || RSM?.viewOnceMessage?.message?.imageMessage;
   var boij = RSM?.videoMessage || info.message?.videoMessage || RSM?.viewOnceMessageV2?.message?.videoMessage || info.message?.viewOnceMessageV2?.message?.videoMessage || info.message?.viewOnceMessage?.message?.videoMessage || RSM?.viewOnceMessage?.message?.videoMessage;
    if (!boij && !boij2) return reply(`Marque uma imagem ou um vídeo de até 9.9 segundos para fazer figurinha, com o comando: ${prefix + command} (mencionando a mídia)`);
    var isVideo2 = !!boij;
    if (isVideo2 && boij.seconds > 9.9) return reply(`O vídeo precisa ter no máximo 9.9 segundos para ser convertido em figurinha.`);
    var buffer = await getFileBuffer(isVideo2 ? boij : boij2, isVideo2 ? 'video' : 'image')
    await sendSticker(nazu, from, { sticker: buffer, author: 'Hiudy', packname: 'By:', type: isVideo2 ? 'video' : 'image', forceSquare: true}, { quoted: info });
  } catch(e) {
  console.error(e);
  await reply("ocorreu um erro 💔");
  };
  break

  case 'figualeatoria':case 'randomsticker': try {
    await nazu.sendMessage(from, { sticker: { url: `https://raw.githubusercontent.com/badDevelopper/Testfigu/main/fig (${Math.floor(Math.random() * 8051)}).webp`}}, {quoted: info});
  } catch(e) {
    console.error(e);
    await reply("ocorreu um erro 💔");
  };
  break;
  
  case 'rename':case 'roubar': try {
   if(!isQuotedSticker) return reply('Você usou de forma errada... Marque uma figurinha.')
   author = q.split(`/`)[0];packname = q.split(`/`)[1];
   if(!q || !author || !packname) return reply(`Formato errado, utilize:\n${prefix}${command} Autor/Pack\nEx: ${prefix}${command} By:/Hiudy`);
   encmediats = await getFileBuffer(info.message.extendedTextMessage.contextInfo.quotedMessage.stickerMessage, 'sticker');
   await sendSticker(nazu, from, { sticker: `data:image/jpeg;base64,${encmediats.toString('base64')}`, author: packname, packname: author, rename: true}, { quoted: info });
  } catch(e) {
  console.error(e);
  await reply("ocorreu um erro 💔");
  };
  break;
  
  case 'rgtake': try {
  const [author, pack] = q.split('/');
  if (!q || !author || !pack) return reply(`Formato errado, utilize:\n${prefix}${command} Autor/Pack\nEx: ${prefix}${command} By:/Hiudy`);
  const filePath = __dirname + '/../database/users/take.json';
  const dataTake = fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, 'utf-8')) : {};
  dataTake[sender] = { author, pack };
  fs.writeFileSync(filePath, JSON.stringify(dataTake, null, 2), 'utf-8');
  reply(`Autor e pacote salvos com sucesso!\nAutor: ${author}\nPacote: ${pack}`);
  } catch(e) {
  console.error(e);
  await reply("ocorreu um erro 💔");
  };
  break;
  
  case 'take': try {
  if (!isQuotedSticker) return reply('Você usou de forma errada... Marque uma figurinha.');
  const filePath = __dirname + '/../database/users/take.json';
  if (!fs.existsSync(filePath)) return reply('Nenhum autor e pacote salvos. Use o comando *rgtake* primeiro.');
  const dataTake = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  if (!dataTake[sender]) return reply('Você não tem autor e pacote salvos. Use o comando *rgtake* primeiro.');
  const { author, pack } = dataTake[sender];
  const encmediats = await getFileBuffer(info.message.extendedTextMessage.contextInfo.quotedMessage.stickerMessage, 'sticker');
  await sendSticker(nazu, from, { sticker: `data:image/jpeg;base64,${encmediats.toString('base64')}`, author: pack, packname: author, rename: true }, { quoted: info });
  } catch(e) {
  console.error(e);
  await reply("ocorreu um erro 💔");
  };
  break;
  
  //FIM COMANDOS DE FIGURINHAS
  
  
  case 'mention':
  try {
    if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
    if (!q) return reply(`📢 *Configuração de Marcações*\n\n🔧 Escolha como deseja ser mencionado:\n\n✅ *${prefix}mention all* → Marcado em tudo (marcações e jogos).\n📢 *${prefix}mention marca* → Apenas em marcações de administradores.\n🎮 *${prefix}mention games* → Somente em jogos do bot.\n🚫 *${prefix}mention 0* → Não será mencionado em nenhuma ocasião.`);
    let options = {  all: '✨ Você agora será mencionado em todas as interações do bot, incluindo marcações de administradores e os jogos!', marca: '📢 A partir de agora, você será mencionado apenas quando um administrador marcar.',games: '🎮 Você optou por ser mencionado somente em jogos do bot.', 0: '🔕 Silêncio ativado! Você não será mais mencionado pelo bot, nem em marcações nem em jogos.'};
    if (options[q.toLowerCase()] !== undefined) {
      if(!groupData.mark) groupData.mark = {};
      groupData.mark[sender] = q.toLowerCase();
      fs.writeFileSync(__dirname + `/../database/grupos/${from}.json`, JSON.stringify(groupData, null, 2));
      return reply(`*${options[q.toLowerCase()]}*`);
    }

    reply(`❌ Opção inválida! Use *${prefix}mention* para ver as opções.`);
  } catch (e) {
    console.error(e);
    reply("ocorreu um erro 💔");
  }
  break;
  
  //COMANDOS DE ADM
  case 'deletar': case 'delete': case 'del':  case 'd':
  if (!isGroupAdmin) return reply("Comando restrito a Administradores ou Moderadores com permissão. 💔");
  if(!menc_prt) return reply("Marque uma mensagem.");
  let stanzaId, participant;
    if (info.message.extendedTextMessage) {
        stanzaId = info.message.extendedTextMessage.contextInfo.stanzaId;
        participant = info.message.extendedTextMessage.contextInfo.participant || menc_prt;
    } else if (info.message.viewOnceMessage) {
        stanzaId = info.key.id;
        participant = info.key.participant || menc_prt;
    };
    try {
        await nazu.sendMessage(from, { delete: { remoteJid: from, fromMe: false, id: stanzaId, participant: participant } });
    } catch (error) {
        reply("ocorreu um erro 💔");
    };
  break

 case 'blockuser':
  if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
  if (!isGroupAdmin) return reply("você precisa ser adm 💔");
  try {
    if (!menc_os2) return reply("Marque alguém 🙄");
    reason = q  ? q.includes('@')  ? q.includes(' ') ? q.split(' ').slice(1).join(' ')  : "Não informado" : q : 'Não informado';
    menc_os3 = menc_os2.includes(' ') ? menc_os2.split(' ')[0] : menc_os2;
    groupData.blockedUsers = groupData.blockedUsers || {};
    groupData.blockedUsers[menc_os3] = { reason, timestamp: Date.now() };
    fs.writeFileSync(groupFile, JSON.stringify(groupData, null, 2));
    await reply(`✅ Usuário @${menc_os3.split('@')[0]} bloqueado no grupo!\nMotivo: ${reason}`, { mentions: [menc_os3] });
  } catch (e) {
    console.error(e);
    await reply("ocorreu um erro 💔");
  };
  break;

  case 'unblockuser':
  if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
  if (!isGroupAdmin) return reply("você precisa ser adm 💔");
  try {
    if (!menc_os2) return reply("Marque alguém 🙄");
    if (!groupData.blockedUsers || (!groupData.blockedUsers[menc_os2] && !groupData.blockedUsers[menc_os2.split('@')[0]])) return reply(`❌ O usuário @${menc_os2.split('@')[0]} não está bloqueado no grupo!`, { mentions: [menc_os2] });
    if (!delete groupData.blockedUsers[menc_os2]) {
    delete groupData.blockedUsers[menc_os2.split('@')[0]];
    }
    fs.writeFileSync(groupFile, JSON.stringify(groupData, null, 2));
    await reply(`✅ Usuário @${menc_os2.split('@')[0]} desbloqueado no grupo!`, { mentions: [menc_os2] });
  } catch (e) {
    console.error(e);
    await reply("ocorreu um erro 💔");
  }
  break;

  case 'listblocksgp':
  if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
  if (!isGroupAdmin) return reply("você precisa ser adm 💔");
  try {
    const blockedUsers = groupData.blockedUsers ? Object.entries(groupData.blockedUsers).map(([user, data]) => `👤 *${user.split('@')[0]}* - Motivo: ${data.reason}`).join('\n') : 'Nenhum usuário bloqueado no grupo.';
    const message = `🔒 *Usuários Bloqueados no Grupo - ${groupName}* 🔒\n\n${blockedUsers}`;
    await reply(message);
  } catch (e) {
    console.error(e);
    await reply("ocorreu um erro 💔");
  }
  break;

  case 'banir':
  case 'ban':
  case 'b':
  case 'kick':
  try {
    if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
    if (!isGroupAdmin) return reply("Comando restrito a Administradores ou Moderadores com permissão. 💔");
    if (!isBotAdmin) return reply("Eu preciso ser adm 💔");
    if (!menc_os2) return reply("Marque alguém 🙄");
    await nazu.groupParticipantsUpdate(from, [menc_os2], 'remove');
    reply(`✅ Usuário banido com sucesso!`);
  } catch (e) {
    console.error(e);
    reply("ocorreu um erro 💔");
  }
  break;
  
    case 'linkgp':
    case 'linkgroup': try {
    if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
    if (!isGroupAdmin) return reply("Comando restrito a Administradores ou Moderadores com permissão. 💔");
    if (!isBotAdmin) return reply("Eu preciso ser adm 💔");
    linkgc = await nazu.groupInviteCode(from)
    await reply('https://chat.whatsapp.com/'+linkgc)
    } catch(e) {
    console.error(e);
    await reply("ocorreu um erro 💔");
    };
    break

  case 'promover':
  try {
    if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
    if (!isGroupAdmin) return reply("Comando restrito a Administradores ou Moderadores com permissão. 💔");
    if (!isBotAdmin) return reply("Eu preciso ser adm 💔");
    if (!menc_os2) return reply("Marque alguém 🙄");
    await nazu.groupParticipantsUpdate(from, [menc_os2], 'promote');
    reply(`✅ Usuário promovido a administrador!`);
  } catch (e) {
    console.error(e);
    reply("ocorreu um erro 💔");
  }
  break;

  case 'rebaixar':
  try {
    if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
    if (!isGroupAdmin) return reply("Comando restrito a Administradores ou Moderadores com permissão. 💔");
    if (!isBotAdmin) return reply("Eu preciso ser adm 💔");
    if (!menc_os2) return reply("Marque alguém 🙄");
    await nazu.groupParticipantsUpdate(from, [menc_os2], 'demote');
    reply(`✅ Usuário rebaixado com sucesso!`);
  } catch (e) {
    console.error(e);
    reply("ocorreu um erro 💔");
  }
  break;

  case 'setname':
  try {
    if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
    if (!isGroupAdmin) return reply("Comando restrito a Administradores ou Moderadores com permissão. 💔");
    if (!isBotAdmin) return reply("Eu preciso ser adm 💔");
    const newName = q.trim();
    if (!newName) return reply('❌ Digite um novo nome para o grupo.');
    await nazu.groupUpdateSubject(from, newName);
    reply(`✅ Nome do grupo alterado para: *${newName}*`);
  } catch (e) {
    console.error(e);
    reply("ocorreu um erro 💔");
  }
  break;

  case 'setdesc':
  try {
    if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
    if (!isGroupAdmin) return reply("Comando restrito a Administradores ou Moderadores com permissão. 💔");
    if (!isBotAdmin) return reply("Eu preciso ser adm 💔");
    const newDesc = q.trim();
    if (!newDesc) return reply('❌ Digite uma nova descrição para o grupo.');
    await nazu.groupUpdateDescription(from, newDesc);
    reply(`✅ Descrição do grupo alterada!`);
  } catch (e) {
    console.error(e);
    reply("ocorreu um erro 💔");
  }
  break;
  
  case 'marcar':
  if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
  if (!isGroupAdmin) return reply("Comando restrito a Administradores ou Moderadores com permissão. 💔");
  if (!isBotAdmin) return reply("Eu preciso ser adm 💔");
  try {
    let path = __dirname + '/../database/grupos/' + from + '.json';
    let data = fs.existsSync(path) ? JSON.parse(fs.readFileSync(path)) : { mark: {} };
    if(!data.mark) data.mark = {};
    let membros = AllgroupMembers.filter(m => !['0', 'games'].includes(data.mark[m]));
    if (!membros.length) return reply('❌ Nenhum membro para mencionar.');
    let msg = `📢 *Membros mencionados:* ${q ? `\n💬 *Mensagem:* ${q}` : ''}\n\n`;
    await nazu.sendMessage(from, {text: msg + membros.map(m => `➤ @${m.split('@')[0]}`).join('\n'), mentions: membros});
  } catch (e) {
    console.error(e);
    reply("ocorreu um erro 💔");
  }
  break;
  
  case 'grupo': try {
  if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
  if (!isGroupAdmin) return reply("Comando restrito a Administradores ou Moderadores com permissão. 💔");
  if (!isBotAdmin) return reply("Eu preciso ser adm 💔");
  if(q.toLowerCase() === 'a' || q.toLowerCase() === 'abrir') {
  await nazu.groupSettingUpdate(from, 'not_announcement');
  await reply('Grupo aberto.');
  } else if(q.toLowerCase() === 'f' || q.toLowerCase() === 'fechar') {
  await nazu.groupSettingUpdate(from, 'announcement');
  await reply('Grupo fechado.');
  }} catch(e) {
  console.error(e);
  await reply("ocorreu um erro 💔");
  };
  break
  
  case 'totag':
  case 'cita':
  case 'hidetag': try {
  if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
  if (!isGroupAdmin) return reply("Comando restrito a Administradores ou Moderadores com permissão. 💔");
  if (!isBotAdmin) return reply("Eu preciso ser adm 💔");
    
    var DFC4 = "";
    var rsm4 = info.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    var pink4 = isQuotedImage ? rsm4?.imageMessage : info.message?.imageMessage;
    var blue4 = isQuotedVideo ? rsm4?.videoMessage : info.message?.videoMessage;
    var purple4 = isQuotedDocument ? rsm4?.documentMessage : info.message?.documentMessage;
    var yellow4 = isQuotedDocW ? rsm4?.documentWithCaptionMessage?.message?.documentMessage : info.message?.documentWithCaptionMessage?.message?.documentMessage;
    var aud_d4 = isQuotedAudio ? rsm4.audioMessage : "";
    var figu_d4 = isQuotedSticker ? rsm4.stickerMessage : "";
    var red4 = isQuotedMsg && !aud_d4 && !figu_d4 && !pink4 && !blue4 && !purple4 && !yellow4 ? rsm4.conversation : info.message?.conversation;
    var green4 = rsm4?.extendedTextMessage?.text || info?.message?.extendedTextMessage?.text;
    let path = __dirname + '/../database/grupos/' + from + '.json';
    let data = fs.existsSync(path) ? JSON.parse(fs.readFileSync(path)) : { mark: {} };
    if(!data.mark) data.mark = {};
    var MRC_TD4 = AllgroupMembers.filter(m => !['0', 'games'].includes(data.mark[m]));

    if (pink4 && !aud_d4 && !purple4) {
        var DFC4 = pink4;
        pink4.caption = q.length > 1 ? q : pink4.caption.replace(new RegExp(prefix + command, "gi"), ` `);
        pink4.image = { url: pink4.url };
        pink4.mentions = MRC_TD4;
    } else if (blue4 && !aud_d4 && !purple4) {
        var DFC4 = blue4;
        blue4.caption = q.length > 1 ? q.trim() : blue4.caption.replace(new RegExp(prefix + command, "gi"), ` `).trim();
        blue4.video = { url: blue4.url };
        blue4.mentions = MRC_TD4;
    } else if (red4 && !aud_d4 && !purple4) {
        var black4 = {};
        black4.text = red4.replace(new RegExp(prefix + command, "gi"), ` `).trim();
        black4.mentions = MRC_TD4;
        var DFC4 = black4;
    } else if (!aud_d4 && !figu_d4 && green4 && !purple4) {
        var brown4 = {};
        brown4.text = green4.replace(new RegExp(prefix + command, "gi"), ` `).trim();
        brown4.mentions = MRC_TD4;
        var DFC4 = brown4;
    } else if (purple4) {
        var DFC4 = purple4;
        purple4.document = { url: purple4.url };
        purple4.mentions = MRC_TD4;
    } else if (yellow4 && !aud_d4) {
        var DFC4 = yellow4;
        yellow4.caption = q.length > 1 ? q.trim() : yellow4.caption.replace(new RegExp(prefix + command, "gi"), `${pushname}\n\n`).trim();
        yellow4.document = { url: yellow4.url };
        yellow4.mentions = MRC_TD4;
    } else if (figu_d4 && !aud_d4) {
        var DFC4 = figu_d4;
        figu_d4.sticker = { url: figu_d4.url };
        figu_d4.mentions = MRC_TD4;
    } else if (aud_d4) {
        var DFC4 = aud_d4;
        aud_d4.audio = { url: aud_d4.url };
        aud_d4.mentions = MRC_TD4;
        aud_d4.ptt = true;
    };
    await nazu.sendMessage(from, DFC4).catch((error) => {});
    } catch(e) {
    console.error(e);
    await reply("ocorreu um erro 💔");
    };
    break;

    case 'onlines':
    if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
    if (!isGroupAdmin) return reply("você precisa ser adm 💔");

    try {
    const groupId = from;
    let onlineMembers = [];
    if (store.presences?.[groupId]) {
      onlineMembers = Object.keys(store.presences[groupId]).filter(memberId => {
        const presence = store.presences[groupId][memberId];
        return presence?.lastKnownPresence === 'available' || presence?.lastKnownPresence === 'composing';
      });
    };
    const mentions = onlineMembers.map(memberId => {
        const member = groupMetadata.participants.find(p => p.id === memberId);
        if (member) {
          return {
            id: memberId.replace('@c.us', '@s.whatsapp.net'),
            name: memberId.split('@')[0]
          };
        };
        return null;
      }).filter(Boolean);
    if (mentions.length > 0) {
      const message = ['✨ *Pessoas Online no Grupo:* ✨\n', mentions.map(v => `👤 • @${v.name}`).join('\n')].join('');
      await nazu.sendMessage(from, { text: message, mentions: mentions.map(v => v.id)}, {quoted: info});
    } else {
      reply('Nenhum membro online no momento.');
    };
  } catch (err) {
    console.error('Erro ao processar comando "onlines":', err);
    reply('Ocorreu um erro ao obter a lista de membros online.');
  };
  break;
   
   case 'antilinkhard':
  try {
    if (!isGroup) return reply("Isso só pode ser usado em grupo 💔");
    if (!isGroupAdmin) return reply("Você precisa ser adm 💔");
    if (!isBotAdmin) return reply("Eu preciso ser adm para isso 💔");
    groupData.antilinkhard = !groupData.antilinkhard;
    fs.writeFileSync(groupFile, JSON.stringify(groupData, null, 2));
    await reply(`✅ Antilinkhard ${groupData.antilinkhard ? 'ativado' : 'desativado'}! Qualquer link enviado resultará em banimento.`);
    nazu.react('🔗');
  } catch (e) {
    console.error(e);
    await reply("Ocorreu um erro 💔");
  }
  break;

  case 'autodl':
  try {
    if (!isGroup) return reply("Isso só pode ser usado em grupo 💔");
    if (!isGroupAdmin) return reply("Você precisa ser adm 💔");
    groupData.autodl = !groupData.autodl;
    fs.writeFileSync(groupFile, JSON.stringify(groupData, null, 2));
    await reply(`✅ Autodl ${groupData.autodl ? 'ativado' : 'desativado'}! Links suportados serão baixados automaticamente.`);
    nazu.react('📥');
  } catch (e) {
    console.error(e);
    await reply("Ocorreu um erro 💔");
  }
  break;
  
  case 'cmdlimit':
  try {
    if (!isGroup) return reply("Isso só pode ser usado em grupo 💔");
    if (!isGroupAdmin) return reply("Você precisa ser adm 💔");
    if (!q) return reply(`Digite o limite de comandos por dia ou "off" para desativar.\nExemplo: !cmdlimit 10`);
    cmdLimitData[from] = cmdLimitData[from] || { users: {} }; // Update in-memory variable (or initialize if group not present)
    if (q.toLowerCase() === 'off') {
      cmdLimitData[from].enabled = false;
      delete cmdLimitData[from].limit; // Update in-memory variable
    } else {
      const limit = parseInt(q);
      if (isNaN(limit) || limit < 1) return reply('Limite inválido! Use um número maior que 0 ou "off".');
      cmdLimitData[from].enabled = true;
      cmdLimitData[from].limit = limit;
    }
    fs.writeFileSync(__dirname + '/../database/cmdlimit.json', JSON.stringify(cmdLimitData, null, 2));
    await reply(`✅ Limite de comandos ${cmdLimitData[from].enabled ? `definido para ${cmdLimitData[from].limit} por dia` : 'desativado'}!`);
    nazu.react('📊');
  } catch (e) {
    console.error(e);
    await reply("Ocorreu um erro 💔");
  }
  break;
  
  case 'antipt':
  try {
    if (!isGroup) return reply("Isso só pode ser usado em grupo 💔");
    if (!isGroupAdmin) return reply("Você precisa ser adm 💔");
    if (!isBotAdmin) return reply("Eu preciso ser adm para isso 💔");
    groupData.antipt = !groupData.antipt;
    fs.writeFileSync(groupFile, JSON.stringify(groupData, null, 2));
    await reply(`✅ AntiPT ${groupData.antipt ? 'ativado' : 'desativado'}! Membros de Portugal serão banidos.`);
    nazu.react('🇵🇹');
  } catch (e) {
    console.error(e);
    await reply("Ocorreu um erro 💔");
  }
  break;
  
 case 'antifake':
  try {
    if (!isGroup) return reply("Isso só pode ser usado em grupo 💔");
    if (!isGroupAdmin) return reply("Você precisa ser adm 💔");
    if (!isBotAdmin) return reply("Eu preciso ser adm para isso 💔");
    groupData.antifake = !groupData.antifake;
    fs.writeFileSync(groupFile, JSON.stringify(groupData, null, 2));
    await reply(`✅ Antifake ${groupData.antifake ? 'ativado' : 'desativado'}! Membros de fora do Brasil/Portugal serão banidos.`);
    nazu.react('🇧🇷');
  } catch (e) {
    console.error(e);
    await reply("Ocorreu um erro 💔");
  }
  break;

  case 'antidoc':
  try {
    if (!isGroup) return reply("Isso só pode ser usado em grupo 💔");
    if (!isGroupAdmin) return reply("Você precisa ser adm 💔");
    if (!isBotAdmin) return reply("Eu preciso ser adm para isso 💔");
    groupData.antidoc = !groupData.antiloc;
    fs.writeFileSync(groupFile, JSON.stringify(groupData, null, 2));
    await reply(`✅ Antidoc ${groupData.antidoc ? 'ativado' : 'desativado'}! Documentos enviados resultarão em banimento.`);
    nazu.react('📄');
  } catch (e) {
    console.error(e);
    await reply("Ocorreu um erro 💔");
  }
  break;
  
  case 'x9':
  try {
    if (!isGroup) return reply("Isso só pode ser usado em grupo 💔");
    if (!isGroupAdmin) return reply("Você precisa ser adm 💔");
    groupData.x9 = !groupData.x9;
    fs.writeFileSync(groupFile, JSON.stringify(groupData, null, 2));
    await reply(`✅ Modo X9 ${groupData.x9 ? 'ativado' : 'desativado'}! Agora eu aviso sobre promoções e rebaixamentos.`);
    nazu.react('🕵️');
  } catch (e) {
    console.error(e);
    await reply("Ocorreu um erro 💔");
  }
  break;

  case 'antiflood':
  try {
    if (!isGroup) return reply("Isso só pode ser usado em grupo 💔");
    if (!isGroupAdmin) return reply("Você precisa ser adm 💔");
    if (!q) return reply(`Digite o intervalo em segundos ou "off" para desativar.\nExemplo: !antiflood 5`);
    antifloodData[from] = antifloodData[from] || { users: {} };
    if (q.toLowerCase() === 'off') {
      antifloodData[from].enabled = false;
      delete antifloodData[from].interval;
    } else {
      const interval = parseInt(q);
      if (isNaN(interval) || interval < 1) return reply('Intervalo inválido! Use um número maior que 0 ou "off".');
      antifloodData[from].enabled = true;
      antifloodData[from].interval = interval;
    }
    fs.writeFileSync(__dirname + '/../database/antiflood.json', JSON.stringify(antifloodData, null, 2));
    await reply(`✅ Antiflood ${antifloodData[from].enabled ? `ativado com intervalo de ${antifloodData[from].interval} segundos` : 'desativado'}!`);
    nazu.react('⏰');
  } catch (e) {
    console.error(e);
    await reply("Ocorreu um erro 💔");
  }
  break;

 case 'antiloc':
  try {
    if (!isGroup) return reply("Isso só pode ser usado em grupo 💔");
    if (!isGroupAdmin) return reply("Você precisa ser adm 💔");
    if (!isBotAdmin) return reply("Eu preciso ser adm para isso 💔");
    groupData.antiloc = !groupData.antiloc;
    fs.writeFileSync(groupFile, JSON.stringify(groupData, null, 2));
    await reply(`✅ Antiloc ${groupData.antiloc ? 'ativado' : 'desativado'}! Localizações enviadas resultarão em banimento.`);
    nazu.react('📍');
  } catch (e) {
    console.error(e);
    await reply("Ocorreu um erro 💔");
  }
  break;
  
    case 'modobrincadeira': case 'modobrincadeiras': case 'modobn': try {
    if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
    if (!isGroupAdmin) return reply("você precisa ser adm 💔");
    const groupFilePath = __dirname + `/../database/grupos/${from}.json`;
    if (!groupData.modobrincadeira || groupData.modobrincadeira === undefined) {
        groupData.modobrincadeira = true;
    } else {
        groupData.modobrincadeira = !groupData.modobrincadeira;
    };
    fs.writeFileSync(groupFilePath, JSON.stringify(groupData));
    if (groupData.modobrincadeira) {
        await reply('🎉 *Modo de Brincadeiras ativado!* Agora o grupo está no modo de brincadeiras. Divirta-se!');
    } else {
        await reply('⚠️ *Modo de Brincadeiras desativado!* O grupo não está mais no modo de brincadeiras.');
    }} catch(e) {
    console.error(e);
    await reply("ocorreu um erro 💔");
    };
    break;
    
    case 'bemvindo': case 'bv': case 'boasvindas': try {
    if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
    if (!isGroupAdmin) return reply("você precisa ser adm 💔");
    const groupFilePath = __dirname + `/../database/grupos/${from}.json`;   
    if (!groupData.bemvindo || groupData.bemvindo === undefined) {
        groupData.bemvindo = true;
    } else {
        groupData.bemvindo = !groupData.bemvindo;
    };
    fs.writeFileSync(groupFilePath, JSON.stringify(groupData));
    if (groupData.bemvindo) {
        await reply(`✅ *Boas-vindas ativadas!* Agora, novos membros serão recebidos com uma mensagem personalizada.\n📝 Para configurar a mensagem, use: *${prefixo}legendabv*`);
    } else {
        await reply('⚠️ *Boas-vindas desativadas!* O grupo não enviará mais mensagens para novos membros.');
    }} catch(e) {
    console.error(e);
    await reply("ocorreu um erro 💔");
    };
    break;
    
   case 'fotobv':
   case 'welcomeimg': {
  if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
  if (!isGroupAdmin) return reply("você precisa ser adm 💔");
  if (!isQuotedImage && !isImage) return reply('❌ Marque uma imagem ou envie uma imagem com o comando!');

  try {
      const imgMessage = isQuotedImage
        ? info.message.extendedTextMessage.contextInfo.quotedMessage.imageMessage
        : info.message.imageMessage;
      const media = await getFileBuffer(imgMessage, 'image');
      const uploadResult = await upload(media);
      if (!uploadResult) throw new Error('Falha ao fazer upload da imagem');
      if (!groupData.welcome) groupData.welcome = {};
      groupData.welcome.image = uploadResult;
      fs.writeFileSync(__dirname + `/../database/grupos/${from}.json`, JSON.stringify(groupData, null, 2));
    await reply('✅ Foto de boas-vindas configurada com sucesso!');
  } catch (error) {
    console.error(error);
    reply("ocorreu um erro 💔");
  }
}
break;

   case 'fotosaida': case 'fotosaiu': case 'imgsaiu': case 'exitimg': {
     if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
     if (!isGroupAdmin) return reply("você precisa ser adm 💔");
     if (!isQuotedImage && !isImage) return reply('❌ Marque uma imagem ou envie uma imagem com o comando!');
     try {
       const media = await getFileBuffer(
         isQuotedImage ? info.message.extendedTextMessage.contextInfo.quotedMessage.imageMessage : info.message.imageMessage,
         'image'
       );
       const uploadResult = await upload(media);
       if (!uploadResult) throw new Error('Falha ao fazer upload da imagem');
       if (!groupData.exit) groupData.exit = {};
       groupData.exit.image = uploadResult;
       fs.writeFileSync(__dirname + `/../database/grupos/${from}.json`, JSON.stringify(groupData, null, 2));
       await reply('✅ Foto de saída configurada com sucesso!');
     } catch (error) {
       console.error(error);
       reply("ocorreu um erro 💔");
     };
   };
   break;

case 'removerfotobv': case 'rmfotobv': case 'delfotobv':
  try {
    if (!isGroup) return reply("Isso só pode ser usado em grupo 💔");
    if (!isGroupAdmin) return reply("Você precisa ser administrador 💔");
    const groupFilePath = __dirname + `/../database/grupos/${from}.json`;
    let groupData = fs.existsSync(groupFilePath) ? JSON.parse(fs.readFileSync(groupFilePath)) : { welcome: {} };
    if (!groupData.welcome?.image) return reply("❌ Não há imagem de boas-vindas configurada.");
    delete groupData.welcome.image;
    fs.writeFileSync(groupFilePath, JSON.stringify(groupData, null, 2));
    reply("✅ A imagem de boas-vindas foi removida com sucesso!");
  } catch (e) {
    console.error(e);
    reply("Ocorreu um erro 💔");
  }
  break;

case 'removerfotosaiu': case 'rmfotosaiu': case 'delfotosaiu':
  try {
    if (!isGroup) return reply("Isso só pode ser usado em grupo 💔");
    if (!isGroupAdmin) return reply("Você precisa ser administrador 💔");
    const groupFilePath = __dirname + `/../database/grupos/${from}.json`;
    let groupData = fs.existsSync(groupFilePath) ? JSON.parse(fs.readFileSync(groupFilePath)) : { exit: {} };
    if (!groupData.exit?.image) return reply("❌ Não há imagem de saída configurada.");
    delete groupData.exit.image;
    fs.writeFileSync(groupFilePath, JSON.stringify(groupData, null, 2));
    reply("✅ A imagem de saída foi removida com sucesso!");
  } catch (e) {
    console.error(e);
    reply("Ocorreu um erro 💔");
  }
  break;
  
   case 'configsaida': case 'textsaiu': case 'legendasaiu': case 'exitmsg': {
     if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
     if (!isGroupAdmin) return reply("você precisa ser adm 💔");
     if (!q) return reply(`📝 Para configurar a mensagem de saída, use:\n${prefix}${command} <mensagem>\n\nVocê pode usar:\n#numerodele# - Menciona quem saiu\n#nomedogp# - Nome do grupo\n#membros# - Total de membros\n#desc# - Descrição do grupo`);
     try {
       if (!groupData.exit) groupData.exit = {};
       groupData.exit.enabled = true;
       groupData.exit.text = q;
       fs.writeFileSync(__dirname + `/../database/grupos/${from}.json`, JSON.stringify(groupData, null, 2));
       await reply('✅ Mensagem de saída configurada com sucesso!\n\n📝 Mensagem definida como:\n' + q);
     } catch (error) {
       console.error(error);
       await reply("ocorreu um erro 💔");
     }
   }
   break;

   case 'saida': case 'exit': {
     if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
     if (!isGroupAdmin) return reply("você precisa ser adm 💔");
     try {
       if (!groupData.exit) groupData.exit = {};
       groupData.exit.enabled = !groupData.exit.enabled;
       fs.writeFileSync(__dirname + `/../database/grupos/${from}.json`, JSON.stringify(groupData, null, 2));
       await reply(groupData.exit.enabled ? '✅ Mensagens de saída ativadas!' : '❌ Mensagens de saída desativadas!');
     } catch (error) {
       console.error(error);
       await reply("ocorreu um erro 💔");
     };
   };
   break;

  case 'addblacklist':
  try {
    if (!isGroup) return reply("Isso só pode ser usado em grupo 💔");
    if (!isGroupAdmin) return reply("Você precisa ser administrador 💔");
    if (!menc_os2) return reply("Marque um usuário 🙄");
    const reason = q.includes(' ') ? q.split(' ').slice(1).join(' ') : "Motivo não informado";
    const groupFilePath = __dirname + `/../database/grupos/${from}.json`;
    let groupData = fs.existsSync(groupFilePath) ? JSON.parse(fs.readFileSync(groupFilePath)) : { blacklist: {} };
    groupData.blacklist = groupData.blacklist || {};
    if (groupData.blacklist[menc_os2]) return reply("❌ Este usuário já está na blacklist.");
    groupData.blacklist[menc_os2] = { reason, timestamp: Date.now() };
    fs.writeFileSync(groupFilePath, JSON.stringify(groupData, null, 2));
    reply(`✅ @${menc_os2.split('@')[0]} foi adicionado à blacklist.\nMotivo: ${reason}`, { mentions: [menc_os2] });
  } catch (e) {
    console.error(e);
    reply("Ocorreu um erro 💔");
  }
  break;

case 'delblacklist':
  try {
    if (!isGroup) return reply("Isso só pode ser usado em grupo 💔");
    if (!isGroupAdmin) return reply("Você precisa ser administrador 💔");
    if (!menc_os2) return reply("Marque um usuário 🙄");
    const groupFilePath = __dirname + `/../database/grupos/${from}.json`;
    let groupData = fs.existsSync(groupFilePath) ? JSON.parse(fs.readFileSync(groupFilePath)) : { blacklist: {} };
    groupData.blacklist = groupData.blacklist || {};
    if (!groupData.blacklist[menc_os2]) return reply("❌ Este usuário não está na blacklist.");
    delete groupData.blacklist[menc_os2];
    fs.writeFileSync(groupFilePath, JSON.stringify(groupData, null, 2));
    reply(`✅ @${menc_os2.split('@')[0]} foi removido da blacklist.`, { mentions: [menc_os2] });
  } catch (e) {
    console.error(e);
    reply("Ocorreu um erro 💔");
  }
  break;

case 'listblacklist':
  try {
    if (!isGroup) return reply("Isso só pode ser usado em grupo 💔");
    if (!isGroupAdmin) return reply("Você precisa ser administrador 💔");
    const groupFilePath = __dirname + `/../database/grupos/${from}.json`;
    let groupData = fs.existsSync(groupFilePath) ? JSON.parse(fs.readFileSync(groupFilePath)) : { blacklist: {} };
    groupData.blacklist = groupData.blacklist || {};
    if (Object.keys(groupData.blacklist).length === 0) return reply("📋 A blacklist está vazia.");
    let text = "📋 *Lista de Usuários na Blacklist*\n\n";
    for (const [user, data] of Object.entries(groupData.blacklist)) {
      text += `👤 @${user.split('@')[0]}\n📝 Motivo: ${data.reason}\n🕒 Adicionado em: ${new Date(data.timestamp).toLocaleString()}\n\n`;
    }
    reply(text, { mentions: Object.keys(groupData.blacklist) });
  } catch (e) {
    console.error(e);
    reply("Ocorreu um erro 💔");
  }
  break;
  
  case 'adv':
case 'advertir':
  try {
    if (!isGroup) return reply("Isso só pode ser usado em grupo 💔");
    if (!isGroupAdmin) return reply("Você precisa ser administrador 💔");
    if (!menc_os2) return reply("Marque um usuário 🙄");
    if (menc_os2 === botNumber) return reply("❌ Não posso advertir a mim mesma!");
    const reason = q.includes(' ') ? q.split(' ').slice(1).join(' ') : "Motivo não informado";
    const groupFilePath = __dirname + `/../database/grupos/${from}.json`;
    let groupData = fs.existsSync(groupFilePath) ? JSON.parse(fs.readFileSync(groupFilePath)) : { warnings: {} };
    groupData.warnings = groupData.warnings || {};
    groupData.warnings[menc_os2] = groupData.warnings[menc_os2] || [];
    groupData.warnings[menc_os2].push({
      reason,
      timestamp: Date.now(),
      issuer: sender
    });
    const warningCount = groupData.warnings[menc_os2].length;
    fs.writeFileSync(groupFilePath, JSON.stringify(groupData, null, 2));
    if (warningCount >= 3) {
      await nazu.groupParticipantsUpdate(from, [menc_os2], 'remove');
      delete groupData.warnings[menc_os2];
      fs.writeFileSync(groupFilePath, JSON.stringify(groupData, null, 2));
      reply(`🚫 @${menc_os2.split('@')[0]} recebeu 3 advertências e foi banido!\nÚltima advertência: ${reason}`, { mentions: [menc_os2] });
    } else {
      reply(`⚠️ @${menc_os2.split('@')[0]} recebeu uma advertência (${warningCount}/3).\nMotivo: ${reason}`, { mentions: [menc_os2] });
    }
  } catch (e) {
    console.error(e);
    reply("Ocorreu um erro 💔");
  }
  break;

case 'removeradv': case 'rmadv':
  try {
    if (!isGroup) return reply("Isso só pode ser usado em grupo 💔");
    if (!isGroupAdmin) return reply("Você precisa ser administrador 💔");
    if (!menc_os2) return reply("Marque um usuário 🙄");
    const groupFilePath = __dirname + `/../database/grupos/${from}.json`;
    let groupData = fs.existsSync(groupFilePath) ? JSON.parse(fs.readFileSync(groupFilePath)) : { warnings: {} };
    groupData.warnings = groupData.warnings || {};
    if (!groupData.warnings[menc_os2] || groupData.warnings[menc_os2].length === 0) return reply("❌ Este usuário não tem advertências.");
    groupData.warnings[menc_os2].pop();
    if (groupData.warnings[menc_os2].length === 0) delete groupData.warnings[menc_os2];
    fs.writeFileSync(groupFilePath, JSON.stringify(groupData, null, 2));
    reply(`✅ Uma advertência foi removida de @${menc_os2.split('@')[0]}. Advertências restantes: ${groupData.warnings[menc_os2]?.length || 0}/3`, { mentions: [menc_os2] });
  } catch (e) {
    console.error(e);
    reply("Ocorreu um erro 💔");
  }
  break;

case 'listadv':
  try {
    if (!isGroup) return reply("Isso só pode ser usado em grupo 💔");
    if (!isGroupAdmin) return reply("Você precisa ser administrador 💔");
    const groupFilePath = __dirname + `/../database/grupos/${from}.json`;
    let groupData = fs.existsSync(groupFilePath) ? JSON.parse(fs.readFileSync(groupFilePath)) : { warnings: {} };
    groupData.warnings = groupData.warnings || {};
    if (Object.keys(groupData.warnings).length === 0) return reply("📋 Não há advertências ativas no grupo.");
    let text = "📋 *Lista de Advertências*\n\n";
    for (const [user, warnings] of Object.entries(groupData.warnings)) {
      text += `👤 @${user.split('@')[0]} (${warnings.length}/3)\n`;
      warnings.forEach((warn, index) => {
        text += `  ${index + 1}. Motivo: ${warn.reason}\n`;
        text += `     Por: @${warn.issuer.split('@')[0]}\n`;
        text += `     Em: ${new Date(warn.timestamp).toLocaleString()}\n`;
      });
      text += "\n";
    }
    reply(text, { mentions: [...Object.keys(groupData.warnings), ...Object.values(groupData.warnings).flatMap(w => w.map(warn => warn.issuer))] });
  } catch (e) {
    console.error(e);
    reply("Ocorreu um erro 💔");
  }
  break;
  
   case 'modorpg': try {
    if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
    if (!isGroupAdmin) return reply("você precisa ser adm 💔");
    if (!groupData.modorpg) {
      groupData.modorpg = true;
      fs.writeFileSync(__dirname + `/../database/grupos/${from}.json`, JSON.stringify(groupData, null, 2));
      reply('✅ *Modo RPG ativado!* Agora os comandos de RPG estão disponíveis no grupo.');
    } else {
      groupData.modorpg = false;
      fs.writeFileSync(__dirname + `/../database/grupos/${from}.json`, JSON.stringify(groupData, null, 2));
      reply('⚠️ *Modo RPG desativado!* Os comandos de RPG não estão mais disponíveis.');
    };
   } catch(e) {
   console.error(e);
   await reply("ocorreu um erro 💔");
   };
   break;
   
    case 'soadm': case 'onlyadm': case 'soadmin': try {
    if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
    if (!isGroupAdmin) return reply("você precisa ser adm 💔");
    const groupFilePath = __dirname + `/../database/grupos/${from}.json`;   
    if (!groupData.soadm || groupData.soadm === undefined) {
        groupData.soadm = true;
    } else {
        groupData.soadm = !groupData.soadm;
    };
    fs.writeFileSync(groupFilePath, JSON.stringify(groupData));
    if (groupData.soadm) {
        await reply(`✅ *Modo apenas adm ativado!* Agora apenas administrdores do grupo poderam utilizar o bot*`);
    } else {
        await reply('⚠️ *Modo apenas adm desativado!* Agora todos os membros podem utilizar o bot novamente.');
    }} catch(e) {
    console.error(e);
    reply("ocorreu um erro 💔");
    };
    break;
    
    case 'modolite': try {
      if (!isGroup) return reply("Isso só pode ser usado em grupo 💔");
      if (!isGroupAdmin) return reply("Você precisa ser administrador 💔");
      
      const groupFilePath = __dirname + `/../database/grupos/${from}.json`;
      
      if (!groupData.modolite) {
          groupData.modolite = true;
          if (groupData.hasOwnProperty('modoliteOff')) {
              delete groupData.modoliteOff;
          }
      } else {
          groupData.modolite = !groupData.modolite;
          if (!groupData.modolite) {
              groupData.modoliteOff = true;
          } else if (groupData.hasOwnProperty('modoliteOff')) {
              delete groupData.modoliteOff;
          }
      }
      
      fs.writeFileSync(groupFilePath, JSON.stringify(groupData, null, 2));
      
      if (groupData.modolite) {
          await reply('👶 *Modo Lite ativado!* O conteúdo inapropriado para crianças será filtrado neste grupo.');
      } else {
          await reply('🔞 *Modo Lite desativado!* O conteúdo do menu de brincadeiras será exibido completamente.');
      }
      await nazu.react('🔄');
    } catch(e) {
      console.error(e);
      await reply("Ocorreu um erro 💔");
    }
    break;
    
    case 'modoliteglobal': try {
      if (!isOwner) return reply("Este comando é apenas para o meu dono 💔");
      
      const modoLiteFile = __dirname + '/../database/modolite.json';
      
      modoLiteGlobal.status = !modoLiteGlobal.status;

      if (!modoLiteGlobal.status) {
        modoLiteGlobal.forceOff = true;
      } else if (modoLiteGlobal.hasOwnProperty('forceOff')) {
        delete modoLiteGlobal.forceOff;
      }
      
      fs.writeFileSync(modoLiteFile, JSON.stringify(modoLiteGlobal, null, 2));
      
      if (modoLiteGlobal.status) {
        await reply('👶 *Modo Lite ativado globalmente!* O conteúdo inapropriado para crianças será filtrado em todos os grupos (a menos que seja explicitamente desativado em algum grupo).');
      } else {
        await reply('🔞 *Modo Lite desativado globalmente!* O conteúdo do menu de brincadeiras será exibido completamente (a menos que seja explicitamente ativado em algum grupo).');
      }
      await nazu.react('🔄');
    } catch(e) {
      console.error(e);
      await reply("Ocorreu um erro 💔");
    }
    break;
    
    case 'antilinkgp':
    try {
    if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
    if (!isGroupAdmin) return reply("você precisa ser adm 💔");
    if (!isBotAdmin) return reply("Eu preciso ser adm 💔");
    const groupFilePath = __dirname + `/../database/grupos/${from}.json`;
    let groupData = fs.existsSync(groupFilePath) ? JSON.parse(fs.readFileSync(groupFilePath)) : { antilinkgp: false };
    groupData.antilinkgp = !groupData.antilinkgp;
    fs.writeFileSync(groupFilePath, JSON.stringify(groupData));
    const message = groupData.antilinkgp ? `✅ *Antilinkgp foi ativado com sucesso!*\n\nAgora, se alguém enviar links de outros grupos, será banido automaticamente. Mantenha o grupo seguro! 🛡️` : `✅ *Antilinkgp foi desativado.*\n\nLinks de outros grupos não serão mais bloqueados. Use com cuidado! ⚠️`;
     reply(`${message}`);
    } catch (e) {
     console.error(e);
     reply("ocorreu um erro 💔");
    }
    break;
    
    case 'antiporn':
    try {
    if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
    if (!isGroupAdmin) return reply("você precisa ser adm 💔");
    if (!isBotAdmin) return reply("Eu preciso ser adm 💔");
    const groupFilePath = __dirname + `/../database/grupos/${from}.json`;
    let groupData = fs.existsSync(groupFilePath) ? JSON.parse(fs.readFileSync(groupFilePath)) : { antiporn: false };
    groupData.antiporn = !groupData.antiporn;
    fs.writeFileSync(groupFilePath, JSON.stringify(groupData));
    const message = groupData.antiporn ? `✅ *Antiporn foi ativado com sucesso!*\n\nAgora, se alguém enviar conteúdo adulto (NSFW), será banido automaticamente. Mantenha o grupo seguro e adequado! 🛡️` : `✅ *Antiporn foi desativado.*\n\nConteúdo adulto não será mais bloqueado. Use com responsabilidade! ⚠️`;
    reply(`${message}`);
    } catch (e) {
     console.error(e);
     reply("ocorreu um erro 💔");
    }
    break;
    
    case 'autosticker':
    try {
    if (!isGroup) return reply("Isso só pode ser usado em grupo 💔");
    if (!isGroupAdmin) return reply("Você precisa ser administrador 💔");
    const groupFilePath = __dirname + `/../database/grupos/${from}.json`;
    let groupData = fs.existsSync(groupFilePath) ? JSON.parse(fs.readFileSync(groupFilePath)) : {};
    groupData.autoSticker = !groupData.autoSticker;
    fs.writeFileSync(groupFilePath, JSON.stringify(groupData, null, 2));
    reply(`✅ Auto figurinhas ${groupData.autoSticker ? 'ativadas' : 'desativadas'}! ${groupData.autoSticker ? 'Todas as imagens e vídeos serão convertidos em figurinhas.' : ''}`);
   } catch (e) {
    console.error(e);
    reply("Ocorreu um erro 💔");
   }
   break;
  
    case 'antigore':
    try {
    if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
    if (!isGroupAdmin) return reply("você precisa ser adm 💔");
    if (!isBotAdmin) return reply("Eu preciso ser adm 💔");
    const groupFilePath = __dirname + `/../database/grupos/${from}.json`;
    let groupData = fs.existsSync(groupFilePath) ? JSON.parse(fs.readFileSync(groupFilePath)) : { antigore: false };
    groupData.antigore = !groupData.antigore;
    fs.writeFileSync(groupFilePath, JSON.stringify(groupData));
    const message = groupData.antigore ? `✅ *Antigore foi ativado com sucesso!*\n\nAgora, se alguém enviar conteúdo gore, será banido automaticamente. Mantenha o grupo seguro e saudável! 🛡️` : `✅ *Antigore foi desativado.*\n\nConteúdo gore não será mais bloqueado. Use com cuidado! ⚠️`;
    reply(`${message}`);
  } catch (e) {
    console.error(e);
    reply("ocorreu um erro 💔");
  }
  break;
    
    case 'modonsfw':
    case 'modo+18':
    try {
    if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
    if (!isGroupAdmin) return reply("você precisa ser adm 💔");
    const groupFilePath = __dirname + `/../database/grupos/${from}.json`;
    let groupData = fs.existsSync(groupFilePath) ? JSON.parse(fs.readFileSync(groupFilePath)) : { nsfwMode: false };
    groupData.nsfwMode = !groupData.nsfwMode;
    fs.writeFileSync(groupFilePath, JSON.stringify(groupData));
    if (groupData.nsfwMode) {
      await nazu.sendMessage(from, {text: `🔞 *Modo +18 ativado!*`,}, { quoted: info });
    } else {
      await nazu.sendMessage(from, {text: `✅ *Modo +18 desativado!.*`,}, { quoted: info });
    }
    } catch (e) {
     console.error(e);
     reply("ocorreu um erro 💔");
    }
    break;
    
    case 'legendabv': case 'textbv': try {
    if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
    if (!isGroupAdmin) return reply("você precisa ser adm 💔");
    const groupFilePath = __dirname + `/../database/grupos/${from}.json`;
    if (!q) return reply(`📝 *Configuração da Mensagem de Boas-Vindas*\n\nPara definir uma mensagem personalizada, digite o comando seguido do texto desejado. Você pode usar as seguintes variáveis:\n\n- *#numerodele#* → Marca o novo membro.\n- *#nomedogp#* → Nome do grupo.\n- *#desc#* → Descrição do grupo.\n- *#membros#* → Número total de membros no grupo.\n\n📌 *Exemplo:*\n${prefixo}legendabv Bem-vindo(a) #numerodele# ao grupo *#nomedogp#*! Agora somos #membros# membros. Leia a descrição: #desc#`);
    groupData.textbv = q;
    fs.writeFileSync(groupFilePath, JSON.stringify(groupData));
    reply(`✅ *Mensagem de boas-vindas configurada com sucesso!*\n\n📌 Nova mensagem:\n"${groupData.textbv}"`);
    } catch(e) {
    console.error(e);
    await reply("ocorreu um erro 💔");
    };
  break;
  
  case 'mute':
  case 'mutar':
  try {
    if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
    if (!isGroupAdmin) return reply("você precisa ser adm 💔");
    if (!isBotAdmin) return reply("Eu preciso ser adm 💔");
    if (!menc_os2) return reply("Marque alguém 🙄");
    const groupFilePath = __dirname + `/../database/grupos/${from}.json`;
    let groupData = fs.existsSync(groupFilePath) ? JSON.parse(fs.readFileSync(groupFilePath)) : { mutedUsers: {} };
    groupData.mutedUsers = groupData.mutedUsers || {};
    groupData.mutedUsers[menc_os2] = true;
    fs.writeFileSync(groupFilePath, JSON.stringify(groupData));
    await nazu.sendMessage(from, {text: `✅ @${menc_os2.split('@')[0]} foi mutado. Se enviar mensagens, será banido.`, mentions: [menc_os2] }, { quoted: info });
  } catch (e) {
    console.error(e);
    reply("ocorreu um erro 💔");
  }
  break;
  
  case 'desmute':
  case 'desmutar':
  try {
    if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
    if (!isGroupAdmin) return reply("você precisa ser adm 💔");
    if (!menc_os2) return reply("Marque alguém 🙄");
    const groupFilePath = __dirname + `/../database/grupos/${from}.json`;
    let groupData = fs.existsSync(groupFilePath) ? JSON.parse(fs.readFileSync(groupFilePath)) : { mutedUsers: {} };
    groupData.mutedUsers = groupData.mutedUsers || {};
    if (groupData.mutedUsers[menc_os2]) {
      delete groupData.mutedUsers[menc_os2];
      fs.writeFileSync(groupFilePath, JSON.stringify(groupData));
      await nazu.sendMessage(from, {text: `✅ @${menc_os2.split('@')[0]} foi desmutado e pode enviar mensagens novamente.`, mentions: [menc_os2]}, { quoted: info });
    } else {
      reply('❌ Este usuário não está mutado.');
    }
  } catch (e) {
    console.error(e);
    reply("ocorreu um erro 💔");
  }
  break;
  
  case 'blockcmd':
  try {
    if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
    if (!isGroupAdmin) return reply("você precisa ser adm 💔");
    if (!q) return reply('❌ Digite o comando que deseja bloquear. Exemplo: /blockcmd sticker');
    const groupFilePath = __dirname + `/../database/grupos/${from}.json`;
    let groupData = fs.existsSync(groupFilePath) ? JSON.parse(fs.readFileSync(groupFilePath)) : { blockedCommands: {} };
    groupData.blockedCommands = groupData.blockedCommands || {};
    groupData.blockedCommands[q.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replaceAll(prefix, '')] = true;
    fs.writeFileSync(groupFilePath, JSON.stringify(groupData));
    reply(`✅ O comando *${q.trim()}* foi bloqueado e só pode ser usado por administradores.`);
  } catch (e) {
    console.error(e);
    reply("ocorreu um erro 💔");
  }
  break;
    
  case 'unblockcmd':
  try {
    if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
    if (!isGroupAdmin) return reply("você precisa ser adm 💔");
    if (!q) return reply('❌ Digite o comando que deseja desbloquear. Exemplo: /unblockcmd sticker');
    const groupFilePath = __dirname + `/../database/grupos/${from}.json`;
    let groupData = fs.existsSync(groupFilePath) ? JSON.parse(fs.readFileSync(groupFilePath)) : { blockedCommands: {} };
    groupData.blockedCommands = groupData.blockedCommands || {};
    if (groupData.blockedCommands[q.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replaceAll(prefix, '')]) {
      delete groupData.blockedCommands[q.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replaceAll(prefix, '')];
      fs.writeFileSync(groupFilePath, JSON.stringify(groupData));
      reply(`✅ O comando *${q.trim()}* foi desbloqueado e pode ser usado por todos.`);
    } else {
      reply('❌ Este comando não está bloqueado.');
    }
  } catch (e) {
    console.error(e);
    reply("ocorreu um erro 💔");
  }
  break;
    
    
    //JOGO DA VELHA
    case 'ttt': case 'jogodavelha': {
    if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
    if (!menc_os2) return reply("Marque alguém 🙄");
    const result = await tictactoe.invitePlayer(from, sender, menc_os2);
    await nazu.sendMessage(from, {
        text: result.message,
        mentions: result.mentions
    });
    break;
   };
   
    //COMANDOS DE BRINCADEIRAS
   
   case 'chance':
    try {
    if (!isGroup) return reply("Isso só pode ser usado em grupo 💔");
    if (!isModoBn) return reply('❌ O modo brincadeira não está ativo nesse grupo.');
    if (!q) return reply('Digite algo para eu calcular a chance! Exemplo: !chance chover hoje');
    const chance = Math.floor(Math.random() * 101);
    await reply(`📊 A chance de "${q}" acontecer é: *${chance}%*!`);
    nazu.react('🎲');
  } catch (e) {
    console.error(e);
    await reply("Ocorreu um erro 💔");
  }
  break;
  
  case 'quando':
  try {
    if (!isGroup) return reply("Isso só pode ser usado em grupo 💔");
    if (!isModoBn) return reply('❌ O modo brincadeira não está ativo nesse grupo.');
    if (!q) return reply('Digite algo para eu prever quando vai acontecer! Exemplo: !quando vou ficar rico');
    const tempos = ['hoje', 'amanhã', 'na próxima semana', 'no próximo mês', 'no próximo ano', 'nunca'];
    const tempo = tempos[Math.floor(Math.random() * tempos.length)];
    await reply(`🕒 "${q}" vai acontecer: *${tempo}*!`);
    nazu.react('⏳');
  } catch (e) {
    console.error(e);
    await reply("Ocorreu um erro 💔");
  }
  break;
  
  case 'casal':
  try {
    if (!isGroup) return reply("Isso só pode ser usado em grupo 💔");
    if (!isModoBn) return reply('❌ O modo brincadeira não está ativo nesse grupo.');
    if (AllgroupMembers.length < 2) return reply('❌ Preciso de pelo menos 2 membros no grupo!');
    let path = __dirname + '/../database/grupos/' + from + '.json';
    let data = fs.existsSync(path) ? JSON.parse(fs.readFileSync(path)) : { mark: {} };
    let membros = AllgroupMembers.filter(m => !['0', 'marca'].includes(data.mark[m]));
    const membro1 = membros[Math.floor(Math.random() * membros.length)];
    let membro2 = membros[Math.floor(Math.random() * membros.length)];
    while (membro2 === membro1) {
      membro2 = membros[Math.floor(Math.random() * membros.length)];
    };
    const shipLevel = Math.floor(Math.random() * 101);
    const chance = Math.floor(Math.random() * 101);
    await reply(`💕 *Casal do momento* 💕\n@${membro1.split('@')[0]} + @${membro2.split('@')[0]}\n\n🌟 Nível de ship: *${shipLevel}%*\n🎯 Chance de dar certo: *${chance}%*`, { mentions: [membro1, membro2] });
    nazu.react('💖');
  } catch (e) {
    console.error(e);
    await reply("Ocorreu um erro 💔");
  }
  break;
  
  case 'shipo':
   try {
    if (!isGroup) return reply("Isso só pode ser usado em grupo 💔");
    if (!isModoBn) return reply('❌ O modo brincadeira não está ativo nesse grupo.');
    if (!menc_os2) return reply('Marque alguém para eu encontrar um par! Exemplo: !shipo @fulano');
    if (AllgroupMembers.length < 2) return reply('❌ Preciso de pelo menos 2 membros no grupo!');
    let path = __dirname + '/../database/grupos/' + from + '.json';
    let data = fs.existsSync(path) ? JSON.parse(fs.readFileSync(path)) : { mark: {} };
    let membros = AllgroupMembers.filter(m => !['0', 'marca'].includes(data.mark[m]));
    let par = membros[Math.floor(Math.random() * membros.length)];
    while (par === menc_os2) {
      par = membros[Math.floor(Math.random() * membros.length)];
    };
    const shipLevel = Math.floor(Math.random() * 101);
    const chance = Math.floor(Math.random() * 101);
    await reply(`💞 *Ship perfeito* 💞\n@${menc_os2.split('@')[0]} + @${par.split('@')[0]}\n\n🌟 Nível de ship: *${shipLevel}%*\n🎯 Chance de dar certo: *${chance}%*`, { mentions: [menc_os2, par] });
    nazu.react('💘');
  } catch (e) {
    console.error(e);
    await reply("Ocorreu um erro 💔");
  }
  break;
  
  case 'sn':
  try {
    if (!isGroup) return reply("Isso só pode ser usado em grupo 💔");
    if (!isModoBn) return reply('❌ O modo brincadeira não está ativo nesse grupo.');
    if (!q) return reply('Faça uma pergunta! Exemplo: !sn Vou ganhar na loteria?');
    const resposta = Math.random() > 0.5 ? 'Sim' : 'Não';
    await reply(`🎯 ${resposta}!`);
    nazu.react(resposta === 'Sim' ? '✅' : '❌');
  } catch (e) {
    console.error(e);
    await reply("Ocorreu um erro 💔");
  }
  break;
  
  case 'perfil':
  try {
    const target = menc_os2 || sender;

    const targetId = target.split('@')[0];
    const targetName = `@${targetId}`;

    const levels = {
      puta: Math.floor(Math.random() * 101),
      gado: Math.floor(Math.random() * 101),
      corno: Math.floor(Math.random() * 101),
      sortudo: Math.floor(Math.random() * 101),
      carisma: Math.floor(Math.random() * 101),
      rico: Math.floor(Math.random() * 101),
      gostosa: Math.floor(Math.random() * 101),
      feio: Math.floor(Math.random() * 101)
    };

    const pacoteValue = `R$ ${(Math.random() * 10000 + 1).toFixed(2).replace('.', ',')}`;

    const humors = ['😎 Tranquilão', '🔥 No fogo', '😴 Sonolento', '🤓 Nerd mode', '😜 Loucura total', '🧘 Zen'];
    const randomHumor = humors[Math.floor(Math.random() * humors.length)];

    let profilePic = 'https://raw.githubusercontent.com/nazuninha/uploads/main/outros/1747053564257_bzswae.bin';
    try {
      profilePic = await nazu.profilePictureUrl(target, 'image');
    } catch (error) {
      console.warn(`Falha ao obter foto do perfil de ${targetName}:`, error.message);
    }

    let bio = 'Sem bio disponível';
    let bioSetAt = '';
    try {
      const statusData = await nazu.fetchStatus(target);
      const status = statusData?.[0]?.status;
      if (status) {
        bio = status.status || bio;
        bioSetAt = new Date(status.setAt).toLocaleString('pt-BR', {
          dateStyle: 'short',
          timeStyle: 'short'
        });
      };
    } catch (error) {
      console.warn(`Falha ao obter status/bio de ${targetName}:`, error.message);
    };

    const perfilText = `📋 Perfil de ${targetName} 📋\n\n👤 *Nome*: ${pushname || 'Desconhecido'}\n📱 *Número*: ${targetId}\n📜 *Bio*: ${bio}${bioSetAt ? `\n🕒 *Bio atualizada em*: ${bioSetAt}` : ''}\n💰 *Valor do Pacote*: ${pacoteValue} 🫦\n😸 *Humor*: ${randomHumor}\n\n🎭 *Níveis*:\n  • Puta: ${levels.puta}%\n  • Gado: ${levels.gado}%\n  • Corno: ${levels.corno}%\n  • Sortudo: ${levels.sortudo}%\n  • Carisma: ${levels.carisma}%\n  • Rico: ${levels.rico}%\n  • Gostosa: ${levels.gostosa}%\n  • Feio: ${levels.feio}%`.trim();

    await nazu.sendMessage(from, { image: { url: profilePic }, caption: perfilText, mentions: [target] }, { quoted: info });
    await nazu.react('📸');
  } catch (error) {
    console.error('Erro ao processar comando perfil:', error);
    await reply('Ocorreu um erro ao gerar o perfil 💔');
  }
  break;
  
  case 'ppt':
  try {
    if (!q) return reply('Escolha: pedra, papel ou tesoura! Exemplo: !ppt pedra');
    const escolhas = ['pedra', 'papel', 'tesoura'];
    if (!escolhas.includes(q.toLowerCase())) return reply('Escolha inválida! Use: pedra, papel ou tesoura.');
    const botEscolha = escolhas[Math.floor(Math.random() * 3)];
    const usuarioEscolha = q.toLowerCase();
    let resultado;
    if (usuarioEscolha === botEscolha) {
      resultado = 'Empate! 🤝';
    } else if (
      (usuarioEscolha === 'pedra' && botEscolha === 'tesoura') ||
      (usuarioEscolha === 'papel' && botEscolha === 'pedra') ||
      (usuarioEscolha === 'tesoura' && botEscolha === 'papel')
    ) {
      resultado = 'Você ganhou! 🎉';
    } else {
      resultado = 'Eu ganhei! 😎';
    }
    await reply(`🖐️ *Pedra, Papel, Tesoura* 🖐️\n\nVocê: ${usuarioEscolha}\nEu: ${botEscolha}\n\n${resultado}`);
    nazu.react('✂️');
  } catch (e) {
    console.error(e);
    await reply("Ocorreu um erro 💔");
  }
  break;
  
   case 'eununca': try {
    if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
    if (!isModoBn) return reply('❌ O modo brincadeira não esta ativo nesse grupo');
    await nazu.sendMessage(from, {poll: {name: toolsJson().iNever[Math.floor(Math.random() * toolsJson().iNever.length)],values: ["Eu nunca", "Eu ja"], selectableCount: 1}, messageContextInfo: { messageSecret: Math.random()}}, {from, options: {userJid: nazu?.user?.id}})
   } catch(e) {
   console.error(e);
   await reply("ocorreu um erro 💔");
   };
   break
   
   case 'vab': try {
   if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
   if (!isModoBn) return reply('❌ O modo brincadeira não esta ativo nesse grupo');
   const vabs = vabJson()[Math.floor(Math.random() * vabJson().length)];
   await nazu.sendMessage(from, {poll: {name: 'O que você prefere?',values: [vabs.option1, vabs.option2], selectableCount: 1}, messageContextInfo: { messageSecret: Math.random()}}, {from, options: {userJid: nazu?.user?.id}})
   } catch(e) {
   console.error(e);
   await reply("ocorreu um erro 💔");
   };
   break
   
   case 'surubao': case 'suruba': try {
   if (isModoLite) return nazu.react('❌');
   if(!isGroup) return reply(`Apenas em grupos`);
   if(!isModoBn) return reply('O modo brincadeira nao esta ativo no grupo')
   if (!q) return reply(`Eita, coloque o número de pessoas após o comando.`)
   if (Number(q) > 15) return reply("Coloque um número menor, ou seja, abaixo de *15*.")
   emojiskk = ["🥵", "😈", "🫣", "😏"];
   emojis2 = emojiskk[Math.floor(Math.random() * emojiskk.length)];
   frasekk = [`tá querendo relações sexuais a ${q}, topa?`, `quer que *${q}* pessoas venham de *chicote, algema e corda de alpinista*.`, `quer que ${q} pessoas der tapa na cara, lhe chame de cachorra e fud3r bem gostosinho...`]
   let path = __dirname + '/../database/grupos/' + from + '.json';
   let data = fs.existsSync(path) ? JSON.parse(fs.readFileSync(path)) : { mark: {} };
   let membros = AllgroupMembers.filter(m => !['0', 'marca'].includes(data.mark[m]));
   context = frasekk[Math.floor(Math.random() * frasekk.length)]  
   ABC = `${emojis2} @${sender.split('@')[0]} ${context}\n\n`
   mencts = [sender];
   for (var i = 0; i < q; i++) {
   menb = membros[Math.floor(Math.random() * membros.length)];
   ABC += `@${menb.split("@")[0]}\n`;
   mencts.push(menb);
  };
  await nazu.sendMessage(from, {image: {url: 'https://raw.githubusercontent.com/nazuninha/uploads/main/outros/1747545773146_rrv7of.bin'}, caption: ABC, mentions: mencts});
  } catch(e) {
  console.error(e);
  await reply("ocorreu um erro 💔");
  };
  break;

case 'suicidio': try {
await reply(`*É uma pena que tenha tomado essa decisão ${pushname}, vamos sentir saudades... 😕*`)
setTimeout(async() => { 
await nazu.groupParticipantsUpdate(from, [sender], "remove")  
}, 2000)
setTimeout(async() => {
await reply(`*Ainda bem que morreu, não aguentava mais essa praga kkkkkk*`)
}, 3000)
} catch(e) {
  console.error(e);
  await reply("ocorreu um erro 💔");
  };
  break;

   case 'gay': case 'burro': case 'inteligente': case 'otaku': case 'fiel': case 'infiel': case 'corno':  case 'gado': case 'gostoso': case 'feio': case 'rico': case 'pobre': case 'pirocudo': case 'pirokudo': case 'nazista': case 'ladrao': case 'safado': case 'vesgo': case 'bebado': case 'machista': case 'homofobico': case 'racista': case 'chato': case 'sortudo': case 'azarado': case 'forte': case 'fraco': case 'pegador': case 'otario': case 'macho': case 'bobo': case 'nerd': case 'preguicoso': case 'trabalhador': case 'brabo': case 'lindo': case 'malandro': case 'simpatico': case 'engracado': case 'charmoso': case 'misterioso': case 'carinhoso': case 'desumilde': case 'humilde': case 'ciumento': case 'corajoso': case 'covarde': case 'esperto': case 'talarico': case 'chorao': case 'brincalhao': case 'bolsonarista': case 'petista': case 'comunista': case 'lulista': case 'traidor': case 'bandido': case 'cachorro': case 'vagabundo': case 'pilantra': case 'mito': case 'padrao': case 'comedia': case 'psicopata': case 'fortao': case 'magrelo': case 'bombado': case 'chefe': case 'presidente': case 'rei': case 'patrao': case 'playboy': case 'zueiro': case 'gamer': case 'programador': case 'visionario': case 'billionario': case 'poderoso': case 'vencedor': case 'senhor': try {
    if (isModoLite && ['pirocudo', 'pirokudo', 'gostoso', 'nazista', 'machista', 'homofobico', 'racista'].includes(command)) return nazu.react('❌');
    if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
    if (!isModoBn) return reply('❌ O modo brincadeira não esta ativo nesse grupo');
    let gamesData = fs.existsSync(__dirname + '/funcs/json/games.json') ? JSON.parse(fs.readFileSync(__dirname + '/funcs/json/games.json')) : { games: {} };
    const target = menc_os2 ? menc_os2 : sender;
    const targetName = `@${target.split('@')[0]}`;
    const level = Math.floor(Math.random() * 101);
    let responses = fs.existsSync(__dirname + '/funcs/json/gamestext.json') ? JSON.parse(fs.readFileSync(__dirname + '/funcs/json/gamestext.json')) : {};
    const responseText = responses[command].replaceAll('#nome#', targetName).replaceAll('#level#', level) || `📊 ${targetName} tem *${level}%* de ${command}! 🔥`;
    const media = gamesData.games[command]
    if (media?.image) {
        await nazu.sendMessage(from, { image: media.image, caption: responseText, mentions: [target] });
    } else if (media?.video) {
        await nazu.sendMessage(from, { video: media.video, caption: responseText, mentions: [target], gifPlayback: true});
    } else {
        await nazu.sendMessage(from, {text: responseText, mentions: [target]});
    };
} catch(e) {
console.error(e);
await reply("ocorreu um erro 💔");
};
break;

   case 'lesbica': case 'burra': case 'inteligente': case 'otaku': case 'fiel': case 'infiel': case 'corna': case 'gado': case 'gostosa': case 'feia': case 'rica': case 'pobre': case 'bucetuda': case 'nazista': case 'ladra': case 'safada': case 'vesga': case 'bebada': case 'machista': case 'homofobica': case 'racista': case 'chata': case 'sortuda': case 'azarada': case 'forte': case 'fraca': case 'pegadora': case 'otaria': case 'boba': case 'nerd': case 'preguicosa': case 'trabalhadora': case 'braba': case 'linda': case 'malandra': case 'simpatica': case 'engracada': case 'charmosa': case 'misteriosa': case 'carinhosa': case 'desumilde': case 'humilde': case 'ciumenta': case 'corajosa': case 'covarde': case 'esperta': case 'talarica': case 'chorona': case 'brincalhona': case 'bolsonarista': case 'petista': case 'comunista': case 'lulista': case 'traidora': case 'bandida': case 'cachorra': case 'vagabunda': case 'pilantra': case 'mito': case 'padrao': case 'comedia': case 'psicopata': case 'fortona': case 'magrela': case 'bombada': case 'chefe': case 'presidenta': case 'rainha': case 'patroa': case 'playboy': case 'zueira': case 'gamer': case 'programadora': case 'visionaria': case 'bilionaria': case 'poderosa': case 'vencedora': case 'senhora': try {
    if (isModoLite && ['bucetuda', 'cachorra', 'vagabunda', 'racista', 'nazista', 'gostosa', 'machista', 'homofobica'].includes(command)) return nazu.react('❌');
    if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
    if (!isModoBn) return reply('❌ O modo brincadeira não esta ativo nesse grupo');
    let gamesData = fs.existsSync(__dirname + '/funcs/json/games.json') ? JSON.parse(fs.readFileSync(__dirname + '/funcs/json/games.json')) : { games: {} };
    const target = menc_os2 ? menc_os2 : sender;
    const targetName = `@${target.split('@')[0]}`;
    const level = Math.floor(Math.random() * 101);
    let responses = fs.existsSync(__dirname + '/funcs/json/gamestext2.json') ? JSON.parse(fs.readFileSync(__dirname + '/funcs/json/gamestext2.json')) : {};
    const responseText = responses[command].replaceAll('#nome#', targetName).replaceAll('#level#', level) || `📊 ${targetName} tem *${level}%* de ${command}! 🔥`;
    const media = gamesData.games[command]
    if (media?.image) {
        await nazu.sendMessage(from, { image: media.image, caption: responseText, mentions: [target] });
    } else if (media?.video) {
        await nazu.sendMessage(from, { video: media.video, caption: responseText, mentions: [target], gifPlayback: true});
    } else {
        await nazu.sendMessage(from, {text: responseText, mentions: [target]});
    };
} catch(e) {
console.error(e);
await reply("ocorreu um erro 💔");
};
break;

case 'rankgay': case 'rankburro': case 'rankinteligente': case 'rankotaku': case 'rankfiel': case 'rankinfiel': case 'rankcorno': case 'rankgado': case 'rankgostoso': case 'rankrico': case 'rankpobre': case 'rankforte': case 'rankpegador': case 'rankmacho': case 'ranknerd': case 'ranktrabalhador': case 'rankbrabo': case 'ranklindo': case 'rankmalandro': case 'rankengracado': case 'rankcharmoso': case 'rankvisionario': case 'rankpoderoso': case 'rankvencedor':case 'rankgays': case 'rankburros': case 'rankinteligentes': case 'rankotakus': case 'rankfiels': case 'rankinfieis': case 'rankcornos': case 'rankgados': case 'rankgostosos': case 'rankricos': case 'rankpobres': case 'rankfortes': case 'rankpegadores': case 'rankmachos': case 'ranknerds': case 'ranktrabalhadores': case 'rankbrabos': case 'ranklindos': case 'rankmalandros': case 'rankengracados': case 'rankcharmosos': case 'rankvisionarios': case 'rankpoderosos': case 'rankvencedores': try {
   if (isModoLite && ['rankgostoso', 'rankgostosos', 'ranknazista'].includes(command)) return nazu.react('❌');
    if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
    if (!isModoBn) return reply('❌ O modo brincadeira não está ativo nesse grupo.');
    let path = __dirname + '/../database/grupos/' + from + '.json';
    let gamesData = fs.existsSync(__dirname + '/funcs/json/games.json') ? JSON.parse(fs.readFileSync(__dirname + '/funcs/json/games.json')) : { ranks: {} };
    let data = fs.existsSync(path) ? JSON.parse(fs.readFileSync(path)) : { mark: {} };
    let membros = AllgroupMembers.filter(m => !['0', 'marca'].includes(data.mark[m]));
    if (membros.length < 5) return reply('❌ Membros insuficientes para formar um ranking.');
    let top5 = membros.sort(() => Math.random() - 0.5).slice(0, 5);
    let cleanedCommand = command.endsWith('s') ? command.slice(0, -1) : command;
    let ranksData = fs.existsSync(__dirname + '/funcs/json/ranks.json') ? JSON.parse(fs.readFileSync(__dirname + '/funcs/json/ranks.json')) : { ranks: {} };
    let responseText = ranksData[cleanedCommand] || `📊 *Ranking de ${cleanedCommand.replace('rank', '')}*:\n\n`;
    top5.forEach((m, i) => {
        responseText += `🏅 *#${i + 1}* - @${m.split('@')[0]}\n`;
    });
    let media = gamesData.ranks[cleanedCommand];
    if (media?.image) {
        await nazu.sendMessage(from, { image: media.image, caption: responseText, mentions: top5 });
    } else if (media?.video) {
        await nazu.sendMessage(from, { video: media.video, caption: responseText, mentions: top5, gifPlayback: true });
    } else {
        await nazu.sendMessage(from, { text: responseText, mentions: top5 });
    }
} catch(e) {
console.error(e);
await reply("ocorreu um erro 💔");
};
break;

case 'ranklesbica': case 'rankburra': case 'rankinteligente': case 'rankotaku': case 'rankfiel': case 'rankinfiel': case 'rankcorna': case 'rankgada': case 'rankgostosa': case 'rankrica': case 'rankpobre': case 'rankforte': case 'rankpegadora': case 'ranknerd': case 'ranktrabalhadora': case 'rankbraba': case 'ranklinda': case 'rankmalandra': case 'rankengracada': case 'rankcharmosa': case 'rankvisionaria': case 'rankpoderosa': case 'rankvencedora':case 'ranklesbicas': case 'rankburras': case 'rankinteligentes': case 'rankotakus': case 'rankfiels': case 'rankinfieis': case 'rankcornas': case 'rankgads': case 'rankgostosas': case 'rankricas': case 'rankpobres': case 'rankfortes': case 'rankpegadoras': case 'ranknerds': case 'ranktrabalhadoras': case 'rankbrabas': case 'ranklindas': case 'rankmalandras': case 'rankengracadas': case 'rankcharmosas': case 'rankvisionarias': case 'rankpoderosas': case 'rankvencedoras': try {
    if (isModoLite && ['rankgostosa', 'rankgostosas', 'ranknazista'].includes(command)) return nazu.react('❌');
    if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
    if (!isModoBn) return reply('❌ O modo brincadeira não está ativo nesse grupo.');
    let path = __dirname + '/../database/grupos/' + from + '.json';
    let gamesData = fs.existsSync(__dirname + '/funcs/json/games.json') ? JSON.parse(fs.readFileSync(__dirname + '/funcs/json/games.json')) : { ranks: {} };
    let data = fs.existsSync(path) ? JSON.parse(fs.readFileSync(path)) : { mark: {} };
    let membros = AllgroupMembers.filter(m => !['0', 'marca'].includes(data.mark[m]));
    if (membros.length < 5) return reply('❌ Membros insuficientes para formar um ranking.');
    let top5 = membros.sort(() => Math.random() - 0.5).slice(0, 5);
    let cleanedCommand = command.endsWith('s') ? command.slice(0, -1) : command;
    let ranksData = fs.existsSync(__dirname + '/funcs/json/ranks.json') ? JSON.parse(fs.readFileSync(__dirname + '/funcs/json/ranks.json')) : { ranks: {} };
    let responseText = ranksData[cleanedCommand]+'\n\n' || `📊 *Ranking de ${cleanedCommand.replace('rank', '')}*:\n\n`;
    top5.forEach((m, i) => {
        responseText += `🏅 *#${i + 1}* - @${m.split('@')[0]}\n`;
    });
    let media = gamesData.ranks[cleanedCommand];
    if (media?.image) {
        await nazu.sendMessage(from, { image: media.image, caption: responseText, mentions: top5 });
    } else if (media?.video) {
        await nazu.sendMessage(from, { video: media.video, caption: responseText, mentions: top5, gifPlayback: true });
    } else {
        await nazu.sendMessage(from, { text: responseText, mentions: top5 });
    }
} catch(e) {
console.error(e);
await reply("ocorreu um erro 💔");
};
break;

case 'chute': case 'chutar': case 'tapa': case 'soco': case 'socar': case 'beijo': case 'beijar': case 'beijob': case 'beijarb': case 'abraco': case 'abracar': case 'mata': case 'matar': case 'tapar': case 'goza': case 'gozar': case 'mamar': case 'mamada': case 'cafune': case 'morder': case 'mordida': case 'lamber': case 'lambida': case 'explodir': case 'sexo': try {
    const comandosImpróprios = ['sexo', 'surubao', 'goza', 'gozar', 'mamar', 'mamada', 'beijob', 'beijarb', 'tapar'];
    if (isModoLite && comandosImpróprios.includes(command)) return nazu.react('❌');
    
    if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
    if (!isModoBn) return reply('❌ O modo brincadeira não está ativo nesse grupo.');
    if(!menc_os2) return reply('Marque um usuário.');
    let gamesData = fs.existsSync(__dirname + '/funcs/json/games.json') ? JSON.parse(fs.readFileSync(__dirname + '/funcs/json/games.json')) : { games2: {} };
    let GamezinData = fs.existsSync(__dirname + '/funcs/json/markgame.json') ? JSON.parse(fs.readFileSync(__dirname + '/funcs/json/markgame.json')) : { ranks: {} };
    let responseText = GamezinData[command].replaceAll('#nome#', `@${menc_os2.split('@')[0]}`) || `Voce acabou de dar um(a) ${command} no(a) @${menc_os2.split('@')[0]}`;
    let media = gamesData.games2[command];
    if (media?.image) {
        await nazu.sendMessage(from, { image: media.image, caption: responseText, mentions: [menc_os2] });
    } else if (media?.video) {
        await nazu.sendMessage(from, { video: media.video, caption: responseText, mentions: [menc_os2], gifPlayback: true });
    } else {
        await nazu.sendMessage(from, { text: responseText, mentions: [menc_os2] });
    };
} catch(e) {
console.error(e);
await reply("ocorreu um erro 💔");
};
   break;






//SITEMA DE RPG EM TESTE
    case 'registrar':
    case 'reg':
        try {
            if (!isGroup) return reply('⚠️ Este comando só pode ser usado em grupos.');
            if (!isModoRpg) return reply('⚠️ O modo RPG precisa estar ativo.');
            const DadosRpReg = await rpg(sender);
            if (DadosRpReg) return reply(`🌟 Você já está registrado como ${DadosRpReg.nome}.`);
            if (!q) return reply(`📜 Digite seu nome.\nExemplo: ${prefix}registrar João`);
            if (q.length > 15) return reply('📛 O nome não pode ter mais de 15 caracteres.');
            const registrar = await rpg.rg(sender, q);
            return reply(registrar.msg);
    } catch (e) {
            console.error('Erro no comando registrar:', e);
            return reply('❌ Erro ao executar o comando registrar.');
        }
        break;

    case 'deletar':
    case 'delrg':
        try {
            if (!isGroup) return reply('⚠️ Este comando só pode ser usado em grupos.');
            if (!isModoRpg) return reply('⚠️ O modo RPG precisa estar ativo.');
            const DadosRpDel = await rpg(sender);
            if (!DadosRpDel) return reply('⚠️ Você não está registrado.');
            if (!q || q !== '1') return reply(`⚠️ Confirme a exclusão com: ${prefix}${command} 1`);
            const deletarRegistro = await rpg.del(sender);
            return reply(deletarRegistro.msg);
        } catch (e) {
            console.error('Erro no comando deletar:', e);
            return reply('❌ Erro ao executar o comando deletar.');
    }
    break;

    // Banco
    case 'saldo':
    case 'banco':
        try {
            if (!isGroup) return reply('⚠️ Este comando só pode ser usado em grupos.');
            if (!isModoRpg) return reply('⚠️ O modo RPG precisa estar ativo.');
            const DadosRpSaldo = await rpg(sender);
            if (!DadosRpSaldo) return reply('⚠️ Você não está registrado.');
            return reply(`🏦 *INFORMAÇÕES BANCÁRIAS* 🏦\n\nBanco: NazuBank\nNome: ${DadosRpSaldo.nome}\nSaldo no Banco: R$${DadosRpSaldo.saldo.banco}\nSaldo na Carteira: R$${DadosRpSaldo.saldo.carteira}`);
        } catch (e) {
            console.error('Erro no comando saldo:', e);
            return reply('❌ Erro ao executar o comando saldo.');
        }
        break;

    case 'depositar':
        try {
            if (!isGroup) return reply('⚠️ Este comando só pode ser usado em grupos.');
            if (!isModoRpg) return reply('⚠️ O modo RPG precisa estar ativo.');
            const DadosRpDep = await rpg(sender);
            if (!DadosRpDep) return reply('⚠️ Você não está registrado.');
            if (!q || isNaN(q)) return reply(`💰 Digite um valor válido.\nExemplo: ${prefix}depositar 50`);
            if (DadosRpDep.saldo.carteira < Number(q)) return reply('💸 Saldo insuficiente.');
            if (!await rpg.depositar(sender, Number(q))) return reply('❌ Erro ao depositar.');
            return reply(`💰 Você depositou R$${q}.`);
        } catch (e) {
            console.error('Erro no comando depositar:', e);
            return reply('❌ Erro ao executar o comando depositar.');
        }
        break;

    case 'sacar':
        try {
            if (!isGroup) return reply('⚠️ Este comando só pode ser usado em grupos.');
            if (!isModoRpg) return reply('⚠️ O modo RPG precisa estar ativo.');
            const DadosRpSacar = await rpg(sender);
            if (!DadosRpSacar) return reply('⚠️ Você não está registrado.');
            if (!q || isNaN(q)) return reply(`💰 Digite um valor válido.\nExemplo: ${prefix}sacar 50`);
            if (DadosRpSacar.saldo.banco < Number(q)) return reply('💸 Saldo insuficiente no banco.');
            if (!await rpg.sacar(sender, Number(q))) return reply('❌ Erro ao sacar.');
            return reply(`💰 Você sacou R$${q}.`);
        } catch (e) {
            console.error('Erro no comando sacar:', e);
            return reply('❌ Erro ao executar o comando sacar.');
        }
        break;

    case 'depoall':
        try {
            if (!isGroup) return reply('⚠️ Este comando só pode ser usado em grupos.');
            if (!isModoRpg) return reply('⚠️ O modo RPG precisa estar ativo.');
            const DadosRpDepAll = await rpg(sender);
            if (!DadosRpDepAll) return reply('⚠️ Você não está registrado.');
            if (DadosRpDepAll.saldo.carteira <= 0) return reply('💸 Sem ouro na carteira para depositar.');
            if (!await rpg.depoall(sender)) return reply('❌ Erro ao depositar tudo.');
            return reply(`💰 Você depositou todo o saldo da carteira no banco.`);
        } catch (e) {
            console.error('Erro no comando depoall:', e);
            return reply('❌ Erro ao executar o comando depoall.');
        }
        break;

    case 'saqueall':
        try {
            if (!isGroup) return reply('⚠️ Este comando só pode ser usado em grupos.');
            if (!isModoRpg) return reply('⚠️ O modo RPG precisa estar ativo.');
            const DadosRpSaqueAll = await rpg(sender);
            if (!DadosRpSaqueAll) return reply('⚠️ Você não está registrado.');
            if (DadosRpSaqueAll.saldo.banco <= 0) return reply('💸 Sem ouro no banco para sacar.');
            if (!await rpg.saqueall(sender)) return reply('❌ Erro ao sacar tudo.');
            return reply(`💰 Você sacou todo o saldo do banco para a carteira.`);
        } catch (e) {
            console.error('Erro no comando saqueall:', e);
            return reply('❌ Erro ao executar o comando saqueall.');
        }
        break;

    case 'pix':
    case 'transferir':
        try {
            if (!isGroup) return reply('⚠️ Este comando só pode ser usado em grupos.');
            if (!isModoRpg) return reply('⚠️ O modo RPG precisa estar ativo.');
            const DadosRpPix = await rpg(sender);
            if (!DadosRpPix) return reply('⚠️ Você não está registrado.');
            if (!q) return reply(`💸 Digite o usuário e valor: ${prefix}pix @usuario/valor`);
            let destinatario, valor;
            if (q.includes('@')) {
                [destinatario, valor] = q.replace(/ /g, '').split('/');
                destinatario = destinatario.split('@')[1] + '@s.whatsapp.net';
      } else {
                if (!menc_os2) return reply('📌 Marque quem deseja enviar o pix.');
                destinatario = menc_os2;
                valor = q;
            }
            if (!destinatario) return reply('📌 Está faltando o destinatário.');
            if (!valor || isNaN(valor)) return reply(`💸 Valor inválido.\nExemplo: ${prefix}pix @usuario/200`);
            if (DadosRpPix.saldo.banco < Number(valor)) return reply('💸 Saldo insuficiente.');
            const userDestino = await rpg(destinatario);
            if (!userDestino) return reply('⚠️ Usuário não registrado no RPG.');
            const pix = await rpg.pix(sender, destinatario, Number(valor));
            return reply(pix.msg);
    } catch (e) {
            console.error('Erro no comando pix:', e);
            return reply('❌ Erro ao executar o comando pix.');
    }
    break;

    // Empregos
    case 'trabalhar':
        try {
            if (!isGroup) return reply('⚠️ Este comando só pode ser usado em grupos.');
            if (!isModoRpg) return reply('⚠️ O modo RPG precisa estar ativo.');
            const DadosRpTrabalhar = await rpg(sender);
            if (!DadosRpTrabalhar) return reply('⚠️ Você não está registrado.');
            if (!DadosRpTrabalhar.emprego || DadosRpTrabalhar.emprego === 'desempregado') return reply('😅 Andarilhos não trabalham! Escolha um caminho!');
            const trabalho = await rpg.trabalhar(sender);
            return reply(trabalho.msg);
        } catch (e) {
            console.error('Erro no comando trabalhar:', e);
            return reply('❌ Erro ao executar o comando trabalhar.');
        }
        break;

    case 'empregos':
        try {
            if (!isGroup) return reply('⚠️ Este comando só pode ser usado em grupos.');
            if (!isModoRpg) return reply('⚠️ O modo RPG precisa estar ativo.');
            const DadosRpEmpregos = await rpg(sender);
            if (!DadosRpEmpregos) return reply('⚠️ Você não está registrado.');
            const empregos = await rpg.empregos(sender);
            return reply(empregos.msg);
        } catch (e) {
            console.error('Erro no comando empregos:', e);
            return reply('❌ Erro ao executar o comando empregos.');
        }
        break;

    case 'addemprego':
        try {
            if (!isGroup) return reply('⚠️ Este comando só pode ser usado em grupos.');
            if (!isModoRpg) return reply('⚠️ O modo RPG precisa estar ativo.');
            const DadosRpAddEmprego = await rpg(sender);
            if (!DadosRpAddEmprego) return reply('⚠️ Você não está registrado.');
            if (DadosRpAddEmprego.emprego && DadosRpAddEmprego.emprego !== 'desempregado') return reply('⚠️ Você já tem um emprego. Demita-se primeiro.');
            if (!q) return reply(`📜 Digite o nome do emprego.\nExemplo: ${prefix}addemprego lixeiro`);
            const addEmprego = await rpg.emprego.add(sender, normalizar(q));
            return reply(addEmprego.msg);
        } catch (e) {
            console.error('Erro no comando addemprego:', e);
            return reply('❌ Erro ao executar o comando addemprego.');
        }
        break;

    case 'demissao':
        try {
            if (!isGroup) return reply('⚠️ Este comando só pode ser usado em grupos.');
            if (!isModoRpg) return reply('⚠️ O modo RPG precisa estar ativo.');
            const DadosRpDemissao = await rpg(sender);
            if (!DadosRpDemissao) return reply('⚠️ Você não está registrado.');
            if (!DadosRpDemissao.emprego || DadosRpDemissao.emprego === 'desempregado') return reply('😅 Você já vive como andarilho!');
            const demissao = await rpg.emprego.del(sender);
            return reply(demissao.msg);
        } catch (e) {
            console.error('Erro no comando demissao:', e);
            return reply('❌ Erro ao executar o comando demissao.');
        }
        break;

    // Loja e Inventário
    case 'loja':
        try {
            if (!isGroup) return reply('⚠️ Este comando só pode ser usado em grupos.');
            if (!isModoRpg) return reply('⚠️ O modo RPG precisa estar ativo.');
            const DadosRpLoja = await rpg(sender);
            if (!DadosRpLoja) return reply('⚠️ Você não está registrado.');
            const loja = await rpg.loja();
            return reply(loja.msg.replaceAll('#prefix#', prefix));
        } catch (e) {
            console.error('Erro no comando loja:', e);
            return reply('❌ Erro ao executar o comando loja.');
        }
        break;

    case 'comprar':
        try {
            if (!isGroup) return reply('⚠️ Este comando só pode ser usado em grupos.');
            if (!isModoRpg) return reply('⚠️ O modo RPG precisa estar ativo.');
            const DadosRpComprar = await rpg(sender);
            if (!DadosRpComprar) return reply('⚠️ Você não está registrado.');
            if (!q) return reply(`🛒 Digite o nome do item.\nExemplo: ${prefix}comprar picareta`);
            const [itemz, quantidadez] = q.split('/').map(v => v.trim());
            const compra = quantidadez ? await rpg.comprar(sender, normalizar(itemz), Number(quantidadez)) : await rpg.comprar(sender, normalizar(itemz));
            return reply(compra.msg.replaceAll('#prefix#', prefix));
        } catch (e) {
            console.error('Erro no comando comprar:', e);
            return reply('❌ Erro ao executar o comando comprar.');
        }
        break;

    case 'vender':
        try {
            if (!isGroup) return reply('⚠️ Este comando só pode ser usado em grupos.');
            if (!isModoRpg) return reply('⚠️ O modo RPG precisa estar ativo.');
            const DadosRpVender = await rpg(sender);
            if (!DadosRpVender) return reply('⚠️ Você não está registrado.');
            if (!q) return reply(`💰 Digite o item e quantidade: item/quantidade.\nExemplo: ${prefix}vender carvao/5`);
            const [item, quantidade] = q.split('/').map(v => v.trim());
            if (!item || !quantidade || isNaN(quantidade)) return reply('⚠️ Formato inválido. Exemplo: carvao/5');
            const venda = await rpg.vender(sender, normalizar(item), parseInt(quantidade));
            return reply(venda.msg);
    } catch (e) {
            console.error('Erro no comando vender:', e);
            return reply('❌ Erro ao executar o comando vender.');
    }
    break;

    case 'inventario':
        try {
            if (!isGroup) return reply('⚠️ Este comando só pode ser usado em grupos.');
            if (!isModoRpg) return reply('⚠️ O modo RPG precisa estar ativo.');
            const DadosRpInventario = await rpg(sender);
            if (!DadosRpInventario) return reply('⚠️ Você não está registrado.');
            const inventario = await rpg.itens(sender);
            return reply(inventario.msg);
        } catch (e) {
            console.error('Erro no comando inventario:', e);
            return reply('❌ Erro ao executar o comando inventario.');
        }
        break;

    case 'me':
        try {
            if (!isGroup) return reply('⚠️ Este comando só pode ser usado em grupos.');
            if (!isModoRpg) return reply('⚠️ O modo RPG precisa estar ativo.');
            const DadosRpMe = await rpg(sender);
            if (!DadosRpMe) return reply('⚠️ Você não está registrado.');
            const informacoes = await rpg.me(sender);
            return reply(informacoes.msg);
        } catch (e) {
            console.error('Erro no comando me:', e);
            return reply('❌ Erro ao executar o comando me.');
        }
        break;

    // Ações
    case 'pescar':
        try {
            if (!isGroup) return reply('⚠️ Este comando só pode ser usado em grupos.');
            if (!isModoRpg) return reply('⚠️ O modo RPG precisa estar ativo.');
            const DadosRpPescar = await rpg(sender);
            if (!DadosRpPescar) return reply('⚠️ Você não está registrado.');
            const pesca = await rpg.acao.pescar(sender);
            return reply(pesca.msg);
        } catch (e) {
            console.error('Erro no comando pescar:', e);
            return reply('❌ Erro ao executar o comando pescar.');
        }
        break;

    case 'minerar':
        try {
            if (!isGroup) return reply('⚠️ Este comando só pode ser usado em grupos.');
            if (!isModoRpg) return reply('⚠️ O modo RPG precisa estar ativo.');
            const DadosRpMinerar = await rpg(sender);
            if (!DadosRpMinerar) return reply('⚠️ Você não está registrado.');
            const mineracao = await rpg.acao.minerar(sender);
            return reply(mineracao.msg);
        } catch (e) {
            console.error('Erro no comando minerar:', e);
            return reply('❌ Erro ao executar o comando minerar.');
        }
        break;

    case 'cacar':
        try {
            if (!isGroup) return reply('⚠️ Este comando só pode ser usado em grupos.');
            if (!isModoRpg) return reply('⚠️ O modo RPG precisa estar ativo.');
            const DadosRpCacar = await rpg(sender);
            if (!DadosRpCacar) return reply('⚠️ Você não está registrado.');
            const caca = await rpg.acao.cacar(sender);
            return reply(caca.msg);
    } catch (e) {
            console.error('Erro no comando cacar:', e);
            return reply('❌ Erro ao executar o comando cacar.');
    }
    break;
  
    case 'plantar':
        try {
            if (!isGroup) return reply('⚠️ Este comando só pode ser usado em grupos.');
            if (!isModoRpg) return reply('⚠️ O modo RPG precisa estar ativo.');
            const DadosRpPlantar = await rpg(sender);
            if (!DadosRpPlantar) return reply('⚠️ Você não está registrado.');
            const plantar = await rpg.acao.plantar(sender);
            return reply(plantar.msg);
        } catch (e) {
            console.error('Erro no comando plantar:', e);
            return reply('❌ Erro ao executar o comando plantar.');
        }
  break;
  
    case 'cortar':
        try {
            if (!isGroup) return reply('⚠️ Este comando só pode ser usado em grupos.');
            if (!isModoRpg) return reply('⚠️ O modo RPG precisa estar ativo.');
            const DadosRpCortar = await rpg(sender);
            if (!DadosRpCortar) return reply('⚠️ Você não está registrado.');
            const cortar = await rpg.acao.cortar(sender);
            return reply(cortar.msg);
} catch (e) {
            console.error('Erro no comando cortar:', e);
            return reply('❌ Erro ao executar o comando cortar.');
        }
break;
  
    case 'lutar':
    case 'batalhar':
        try {
            if (!isGroup) return reply('⚠️ Este comando só pode ser usado em grupos.');
            if (!isModoRpg) return reply('⚠️ O modo RPG precisa estar ativo.');
            const DadosRpLutar = await rpg(sender);
            if (!DadosRpLutar) return reply('⚠️ Você não está registrado.');
            const batalha = await rpg.acao.batalhar(sender);
            return reply(batalha.msg);
  } catch (e) {
            console.error('Erro no comando lutar:', e);
            return reply('❌ Erro ao executar o comando lutar.');
  }
  break;
  
    case 'pocao':
        try {
            if (!isGroup) return reply('⚠️ Este comando só pode ser usado em grupos.');
            if (!isModoRpg) return reply('⚠️ O modo RPG precisa estar ativo.');
            const DadosRpPocao = await rpg(sender);
            if (!DadosRpPocao) return reply('⚠️ Você não está registrado.');
            const usarPocao = await rpg.acao.pocao(sender);
            return reply(usarPocao.msg);
  } catch (e) {
            console.error('Erro no comando pocao:', e);
            return reply('❌ Erro ao executar o comando pocao.');
  }
  break;
  
    case 'alimentar':
        try {
            if (!isGroup) return reply('⚠️ Este comando só pode ser usado em grupos.');
            if (!isModoRpg) return reply('⚠️ O modo RPG precisa estar ativo.');
            const DadosRpAlimentar = await rpg(sender);
            if (!DadosRpAlimentar) return reply('⚠️ Você não está registrado.');
            const alimentar = await rpg.acao.alimentarPet(sender);
            return reply(alimentar.msg);
  } catch (e) {
            console.error('Erro no comando alimentar:', e);
            return reply('❌ Erro ao executar o comando alimentar.');
  }
  break;
  
    case 'assaltar':
        try {
            if (!isGroup) return reply('⚠️ Este comando só pode ser usado em grupos.');
            if (!isModoRpg) return reply('⚠️ O modo RPG precisa estar ativo.');
            const DadosRpAssaltar = await rpg(sender);
            if (!DadosRpAssaltar) return reply('⚠️ Você não está registrado.');
            if (!menc_os2) return reply(`📌 Marque quem deseja assaltar.\nExemplo: ${prefix}assaltar @usuario`);
            if (menc_os2 === sender) return reply('⚠️ Você não pode se assaltar.');
            const assalto = await rpg.acao.assaltar(sender, menc_os2);
            return reply(assalto.msg);
  } catch (e) {
            console.error('Erro no comando assaltar:', e);
            return reply('❌ Erro ao executar o comando assaltar.');
  }
  break;
  
    // Missões
    case 'missao':
        try {
            if (!isGroup) return reply('⚠️ Este comando só pode ser usado em grupos.');
            if (!isModoRpg) return reply('⚠️ O modo RPG precisa estar ativo.');
            const DadosRpMissao = await rpg(sender);
            if (!DadosRpMissao) return reply('⚠️ Você não está registrado.');
            if (!q) return reply(`📜 Digite o nome da missão.\nExemplo: ${prefix}missao caça ao tesouro`);
            const iniciarMissao = await rpg.missao.iniciar(sender, normalizar(q));
            return reply(iniciarMissao.msg);
   } catch (e) {
            console.error('Erro no comando missao:', e);
            return reply('❌ Erro ao executar o comando missao.');
   }
   break;
   
    case 'completar':
        try {
            if (!isGroup) return reply('⚠️ Este comando só pode ser usado em grupos.');
            if (!isModoRpg) return reply('⚠️ O modo RPG precisa estar ativo.');
            const DadosRpCompletar = await rpg(sender);
            if (!DadosRpCompletar) return reply('⚠️ Você não está registrado.');
            if (!q) return reply(`📜 Digite o nome da missão.\nExemplo: ${prefix}completar caça ao tesouro`);
            const completarMissao = await rpg.missao.completar(sender, normalizar(q));
            return reply(completarMissao.msg);
  } catch (e) {
            console.error('Erro no comando completar:', e);
            return reply('❌ Erro ao executar o comando completar.');
  }
  break;
    
    // Guildas
    case 'criarguilda':
        try {
            if (!isGroup) return reply('⚠️ Este comando só pode ser usado em grupos.');
            if (!isModoRpg) return reply('⚠️ O modo RPG precisa estar ativo.');
            const DadosRpCriarGuilda = await rpg(sender);
            if (!DadosRpCriarGuilda) return reply('⚠️ Você não está registrado.');
            if (!q) return reply(`🏰 Digite o nome da guilda.\nExemplo: ${prefix}criarguilda Cavaleiros`);
            const criarGuilda = await rpg.guilda.criar(sender, normalizar(q));
            return reply(criarGuilda.msg);
   } catch (e) {
            console.error('Erro no comando criarguilda:', e);
            return reply('❌ Erro ao executar o comando criarguilda.');
   }
   break;
   
    case 'entrarguilda':
        try {
            if (!isGroup) return reply('⚠️ Este comando só pode ser usado em grupos.');
            if (!isModoRpg) return reply('⚠️ O modo RPG precisa estar ativo.');
            const DadosRpEntrarGuilda = await rpg(sender);
            if (!DadosRpEntrarGuilda) return reply('⚠️ Você não está registrado.');
            if (!q) return reply(`🏰 Digite o nome da guilda.\nExemplo: ${prefix}entrarguilda Cavaleiros`);
            const entrarGuilda = await rpg.guilda.entrar(sender, normalizar(q));
            return reply(entrarGuilda.msg);
        } catch (e) {
            console.error('Erro no comando entrarguilda:', e);
            return reply('❌ Erro ao executar o comando entrarguilda.');
        }
  break;

    case 'sairguilda':
        try {
            if (!isGroup) return reply('⚠️ Este comando só pode ser usado em grupos.');
            if (!isModoRpg) return reply('⚠️ O modo RPG precisa estar ativo.');
            const DadosRpSairGuilda = await rpg(sender);
            if (!DadosRpSairGuilda) return reply('⚠️ Você não está registrado.');
            const sairGuilda = await rpg.guilda.sair(sender);
            return reply(sairGuilda.msg);
        } catch (e) {
            console.error('Erro no comando sairguilda:', e);
            return reply('❌ Erro ao executar o comando sairguilda.');
        }
  break;
   
    // Duelos
    case 'duelar':
        try {
            if (!isGroup) return reply('⚠️ Este comando só pode ser usado em grupos.');
            if (!isModoRpg) return reply('⚠️ O modo RPG precisa estar ativo.');
            const DadosRpDuelar = await rpg(sender);
            if (!DadosRpDuelar) return reply('⚠️ Você não está registrado.');
            if (!q || !menc_os2) return reply(`⚔️ Digite o valor da aposta e marque o adversário.\nExemplo: ${prefix}duelar 100 @alvo`);
            const [aposta] = q.split('/').map(v => v.trim());
            if (isNaN(aposta) || Number(aposta) < 100) return reply('⚠️ Aposta mínima é R$100.');
            const duelo = await rpg.duelo.desafiar(sender, menc_os2, Number(aposta));
            return reply(duelo.msg);
  } catch (e) {
            console.error('Erro no comando duelar:', e);
            return reply('❌ Erro ao executar o comando duelar.');
  }
  break;
  
    case 'aceitarduelo':
        try {
            if (!isGroup) return reply('⚠️ Este comando só pode ser usado em grupos.');
            if (!isModoRpg) return reply('⚠️ O modo RPG precisa estar ativo.');
            const DadosRpAceitarDuelo = await rpg(sender);
            if (!DadosRpAceitarDuelo) return reply('⚠️ Você não está registrado.');
            const aceitarDuelo = await rpg.duelo.aceitar(sender);
            return reply(aceitarDuelo.msg);
  } catch (e) {
            console.error('Erro no comando aceitarduelo:', e);
            return reply('❌ Erro ao executar o comando aceitarduelo.');
  }
  break;

    // Ranking
    case 'ranking':
        try {
            if (!isGroup) return reply('⚠️ Este comando só pode ser usado em grupos.');
            if (!isModoRpg) return reply('⚠️ O modo RPG precisa estar ativo.');
            const DadosRpRanking = await rpg(sender);
            if (!DadosRpRanking) return reply('⚠️ Você não está registrado.');
            const ranking = await rpg.ranking(sender);
            return reply(ranking.msg);
  } catch (e) {
            console.error('Erro no comando ranking:', e);
            return reply('❌ Erro ao executar o comando ranking.');
  }
  break;
  
  // NOVOS COMANDOS AFK E REGRAS
  case 'afk':
    try {
      if (!isGroup) return reply("Este comando só funciona em grupos.");
      const reason = q.trim();
      groupData.afkUsers = groupData.afkUsers || {};
      groupData.afkUsers[sender] = {
        reason: reason || 'Não especificado',
        since: Date.now()
      };
      fs.writeFileSync(groupFile, JSON.stringify(groupData, null, 2));
      let afkSetMessage = `😴 Você está AFK.`;
      if (reason) afkSetMessage += `
Motivo: ${reason}`;
      await reply(afkSetMessage);
      await nazu.react('💤');
  } catch (e) {
      console.error('Erro no comando afk:', e);
      await reply("Ocorreu um erro ao definir AFK 💔");
  }
  break;
  
  case 'voltei':
    try {
      if (!isGroup) return reply("Este comando só funciona em grupos.");
      if (groupData.afkUsers && groupData.afkUsers[sender]) {
        delete groupData.afkUsers[sender];
        fs.writeFileSync(groupFile, JSON.stringify(groupData, null, 2));
        await reply(`👋 Bem-vindo(a) de volta! Seu status AFK foi removido.`);
        await nazu.react('👋');
    } else {
        await reply("Você não estava AFK.");
      }
  } catch (e) {
      console.error('Erro no comando voltei:', e);
      await reply("Ocorreu um erro ao remover AFK 💔");
  }
  break;
  
  case 'regras':
    try {
      if (!isGroup) return reply("Este comando só funciona em grupos.");
      if (!groupData.rules || groupData.rules.length === 0) {
        return reply("📜 Nenhuma regra definida para este grupo ainda.");
      }
      let rulesMessage = `📜 *Regras do Grupo ${groupName}* 📜

`;
      groupData.rules.forEach((rule, index) => {
        rulesMessage += `${index + 1}. ${rule}
`;
      });
      await reply(rulesMessage);
  } catch (e) {
      console.error('Erro no comando regras:', e);
      await reply("Ocorreu um erro ao buscar as regras 💔");
  }
  break;

  case 'addregra':
    try {
      if (!isGroup) return reply("Este comando só funciona em grupos.");
      if (!isGroupAdmin) return reply("Apenas administradores podem adicionar regras.");
      if (!q) return reply(`📝 Por favor, forneça o texto da regra. Ex: ${prefix}addregra Proibido spam.`);
      groupData.rules = groupData.rules || [];
      groupData.rules.push(q);
      fs.writeFileSync(groupFile, JSON.stringify(groupData, null, 2));
      await reply(`✅ Regra adicionada com sucesso!
${groupData.rules.length}. ${q}`);
      await nazu.react('➕');
  } catch (e) {
      console.error('Erro no comando addregra:', e);
      await reply("Ocorreu um erro ao adicionar a regra 💔");
  }
  break;
  
  case 'delregra':
    try {
      if (!isGroup) return reply("Este comando só funciona em grupos.");
      if (!isGroupAdmin) return reply("Apenas administradores podem remover regras.");
      if (!q || isNaN(parseInt(q))) return reply(`🔢 Por favor, forneça o número da regra a ser removida. Ex: ${prefix}delregra 3`);
      
      groupData.rules = groupData.rules || [];
      const ruleNumber = parseInt(q);
      if (ruleNumber < 1 || ruleNumber > groupData.rules.length) {
        return reply(`❌ Número de regra inválido. Use ${prefix}regras para ver a lista. Atualmente existem ${groupData.rules.length} regras.`);
      }
      const removedRule = groupData.rules.splice(ruleNumber - 1, 1);
      fs.writeFileSync(groupFile, JSON.stringify(groupData, null, 2));
      await reply(`🗑️ Regra "${removedRule}" removida com sucesso!`);
      await nazu.react('➖');
    } catch (e) {
      console.error('Erro no comando delregra:', e);
      await reply("Ocorreu um erro ao remover a regra 💔");
    }
    break;

  // SISTEMA DE MODERADORES
  case 'addmod':
    try {
      if (!isGroup) return reply("Este comando só funciona em grupos.");
      if (!isGroupAdmin) return reply("Apenas administradores podem adicionar moderadores.");
      if (!menc_os2) return reply(`Marque o usuário que deseja promover a moderador. Ex: ${prefix}addmod @usuario`);
      const modToAdd = menc_os2;
      if (groupData.moderators.includes(modToAdd)) {
        return reply(`@${modToAdd.split('@')[0]} já é um moderador.`, { mentions: [modToAdd] });
      }
      groupData.moderators.push(modToAdd);
      fs.writeFileSync(groupFile, JSON.stringify(groupData, null, 2));
      await reply(`✅ @${modToAdd.split('@')[0]} foi promovido a moderador do grupo!`, { mentions: [modToAdd] });
      await nazu.react('🛡️');
  } catch (e) {
      console.error('Erro no comando addmod:', e);
      await reply("Ocorreu um erro ao adicionar moderador 💔");
  }
break;

  case 'delmod':
    try {
      if (!isGroup) return reply("Este comando só funciona em grupos.");
      if (!isGroupAdmin) return reply("Apenas administradores podem remover moderadores.");
      if (!menc_os2) return reply(`Marque o usuário que deseja remover de moderador. Ex: ${prefix}delmod @usuario`);
      const modToRemove = menc_os2;
      const modIndex = groupData.moderators.indexOf(modToRemove);
      if (modIndex === -1) {
        return reply(`@${modToRemove.split('@')[0]} não é um moderador.`, { mentions: [modToRemove] });
      }
      groupData.moderators.splice(modIndex, 1);
      fs.writeFileSync(groupFile, JSON.stringify(groupData, null, 2));
      await reply(`✅ @${modToRemove.split('@')[0]} não é mais um moderador do grupo.`, { mentions: [modToRemove] });
      await nazu.react('🛡️');
  } catch (e) {
      console.error('Erro no comando delmod:', e);
      await reply("Ocorreu um erro ao remover moderador 💔");
  }
  break;

  case 'listmods': case 'modlist':
    try {
      if (!isGroup) return reply("Este comando só funciona em grupos.");
      if (groupData.moderators.length === 0) {
        return reply("🛡️ Não há moderadores definidos para este grupo.");
      }
      let modsMessage = `🛡️ *Moderadores do Grupo ${groupName}* 🛡️

`;
      const mentionedUsers = [];
      groupData.moderators.forEach((modJid) => {
        modsMessage += `➥ @${modJid.split('@')[0]}
`;
        mentionedUsers.push(modJid);
      });
      await reply(modsMessage, { mentions: mentionedUsers });
  } catch (e) {
      console.error('Erro no comando listmods:', e);
      await reply("Ocorreu um erro ao listar moderadores 💔");
  }
  break;

  case 'grantmodcmd': case 'addmodcmd':
    try {
      if (!isGroup) return reply("Este comando só funciona em grupos.");
      if (!isGroupAdmin) return reply("Apenas administradores podem gerenciar permissões de moderador.");
      if (!q) return reply(`Por favor, especifique o comando para permitir aos moderadores. Ex: ${prefix}grantmodcmd ban`);
      const cmdToAllow = q.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "").replaceAll(prefix, "");
      if (groupData.allowedModCommands.includes(cmdToAllow)) {
        return reply(`Comando "${cmdToAllow}" já está permitido para moderadores.`);
      }
      groupData.allowedModCommands.push(cmdToAllow);
      fs.writeFileSync(groupFile, JSON.stringify(groupData, null, 2));
      await reply(`✅ Moderadores agora podem usar o comando: ${prefix}${cmdToAllow}`);
      await nazu.react('🔧');
  } catch (e) {
      console.error('Erro no comando grantmodcmd:', e);
      await reply("Ocorreu um erro ao permitir comando para moderadores 💔");
  }
  break;

  case 'revokemodcmd': case 'delmodcmd':
    try {
      if (!isGroup) return reply("Este comando só funciona em grupos.");
      if (!isGroupAdmin) return reply("Apenas administradores podem gerenciar permissões de moderador.");
      if (!q) return reply(`Por favor, especifique o comando para proibir aos moderadores. Ex: ${prefix}revokemodcmd ban`);
      const cmdToDeny = q.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "").replaceAll(prefix, "");
      const cmdIndex = groupData.allowedModCommands.indexOf(cmdToDeny);
      if (cmdIndex === -1) {
        return reply(`Comando "${cmdToDeny}" não estava permitido para moderadores.`);
      }
      groupData.allowedModCommands.splice(cmdIndex, 1);
      fs.writeFileSync(groupFile, JSON.stringify(groupData, null, 2));
      await reply(`✅ Moderadores não podem mais usar o comando: ${prefix}${cmdToDeny}`);
      await nazu.react('🔧');
  } catch (e) {
      console.error('Erro no comando revokemodcmd:', e);
      await reply("Ocorreu um erro ao proibir comando para moderadores 💔");
  }
  break;

  case 'listmodcmds':
    try {
      if (!isGroup) return reply("Este comando só funciona em grupos.");
      if (groupData.allowedModCommands.length === 0) {
        return reply("🔧 Nenhum comando específico permitido para moderadores neste grupo.");
      }
      let cmdsMessage = `🔧 *Comandos Permitidos para Moderadores em ${groupName}* 🔧\n\n`;
      groupData.allowedModCommands.forEach((cmd) => {
        cmdsMessage += `➥ ${prefix}${cmd}\n`;
      });
      await reply(cmdsMessage);
  } catch (e) {
      console.error('Erro no comando listmodcmds:', e);
      await reply("Ocorreu um erro ao listar comandos de moderadores 💔");
  }
  break;
  // FIM DO SISTEMA DE MODERADORES

  case 'clima':
    try {
      if (!q) return reply('Digite o nome da cidade para pesquisar o clima.');
      await nazu.react('🌦️');
      const geocodingResponse = await axios.get(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=1`);
      if (!geocodingResponse.data.results || geocodingResponse.data.results.length === 0) {
        return reply(`Cidade "${q}" não encontrada.`);
      }
      const { latitude, longitude, name } = geocodingResponse.data.results[0];
      const weatherResponse = await axios.get(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=weathercode,temperature_2m,relativehumidity_2m,windspeed_10m,winddirection_10m`);
      const { temperature_2m: temperature, relativehumidity_2m: relativehumidity, windspeed_10m: windspeed, winddirection_10m: winddirection, weathercode } = weatherResponse.data.current;

      // Mapeamento da descrição do clima
      let weatherDescription;
      switch (weathercode) {
        case 0:
          weatherDescription = "Céu limpo";
          break;
        case 1:
          weatherDescription = "Predominantemente limpo";
          break;
        case 2:
          weatherDescription = "Parcialmente nublado";
          break;
        case 3:
          weatherDescription = "Nublado";
          break;
        case 45:
          weatherDescription = "Nevoeiro";
          break;
        case 48:
          weatherDescription = "Nevoeiro com geada";
          break;
        case 51:
          weatherDescription = "Chuvisco leve";
          break;
        case 53:
          weatherDescription = "Chuvisco moderado";
          break;
        case 55:
          weatherDescription = "Chuvisco intenso";
          break;
        case 56:
          weatherDescription = "Chuvisco leve com geada";
          break;
        case 57:
          weatherDescription = "Chuvisco intenso com geada";
          break;
        case 61:
          weatherDescription = "Chuva leve";
          break;
        case 63:
          weatherDescription = "Chuva moderada";
          break;
        case 65:
          weatherDescription = "Chuva intensa";
          break;
        case 66:
          weatherDescription = "Chuva leve com geada";
          break;
        case 67:
          weatherDescription = "Chuva intensa com geada";
          break;
        case 71:
          weatherDescription = "Neve leve";
          break;
        case 73:
          weatherDescription = "Neve moderada";
          break;
        case 75:
          weatherDescription = "Neve intensa";
          break;
        case 77:
          weatherDescription = "Grãos de neve";
          break;
        case 80:
          weatherDescription = "Pancadas de chuva leve";
          break;
        case 81:
          weatherDescription = "Pancadas de chuva moderada";
          break;
        case 82:
          weatherDescription = "Pancadas de chuva intensa";
          break;
        case 85:
          weatherDescription = "Pancadas de neve leve";
          break;
        case 86:
          weatherDescription = "Pancadas de neve intensa";
          break;
        case 95:
          weatherDescription = "Tempestade";
          break;
        case 96:
          weatherDescription = "Tempestade com granizo leve";
          break;
        case 99:
          weatherDescription = "Tempestade com granizo intenso";
          break;
        default:
          weatherDescription = "Condição desconhecida";
      }

      // Mapeamento do emoji do clima
      let weatherEmoji;
      switch (weathercode) {
        case 0:
          weatherEmoji = "☀️";
          break;
        case 1:
        case 2:
          weatherEmoji = "🌤️";
          break;
        case 3:
          weatherEmoji = "☁️";
          break;
        case 45:
        case 48:
          weatherEmoji = "🌫️";
          break;
        case 51:
        case 53:
        case 55:
        case 56:
        case 57:
          weatherEmoji = "🌧️";
          break;
        case 61:
        case 63:
        case 65:
        case 66:
        case 67:
          weatherEmoji = "🌧️";
          break;
        case 71:
        case 73:
        case 75:
        case 77:
        case 85:
        case 86:
          weatherEmoji = "❄️";
          break;
        case 80:
        case 81:
        case 82:
          weatherEmoji = "🌧️";
          break;
        case 95:
        case 96:
        case 99:
          weatherEmoji = "⛈️";
          break;
        default:
          weatherEmoji = "🌈";
      }

      // Mapeamento do emoji da direção do vento
      let windDirectionEmoji;
      if (winddirection >= 337.5 || winddirection < 22.5) {
        windDirectionEmoji = "⬆️"; // Norte
      } else if (winddirection >= 22.5 && winddirection < 67.5) {
        windDirectionEmoji = "↗️"; // Nordeste
      } else if (winddirection >= 67.5 && winddirection < 112.5) {
        windDirectionEmoji = "➡️"; // Leste
      } else if (winddirection >= 112.5 && winddirection < 157.5) {
        windDirectionEmoji = "↘️"; // Sudeste
      } else if (winddirection >= 157.5 && winddirection < 202.5) {
        windDirectionEmoji = "⬇️"; // Sul
      } else if (winddirection >= 202.5 && winddirection < 247.5) {
        windDirectionEmoji = "↙️"; // Sudoeste
      } else if (winddirection >= 247.5 && winddirection < 292.5) {
        windDirectionEmoji = "⬅️"; // Oeste
      } else {
        windDirectionEmoji = "↖️"; // Noroeste
      }

      const weatherInfo = `🌦️ *Clima em ${name}*

🌡️ *Temperatura:* ${temperature}°C
💧 *Umidade:* ${relativehumidity}%
💨 *Vento:* ${windspeed} km/h ${windDirectionEmoji}
${weatherEmoji} *${weatherDescription}*`;
      await reply(weatherInfo);
    } catch (e) {
      console.error(e);
      await reply("Ocorreu um erro ao pesquisar o clima 💔");
    }
    break;
    
 default:
 if(isCmd) await nazu.react('❌');
 };
 
 
  } catch(error) {
    // Log detalhado do erro para facilitar debugging
    console.error('==== ERRO NO PROCESSAMENTO DA MENSAGEM ====');
    console.error('Tipo de erro:', error.name);
    console.error('Mensagem:', error.message);
    console.error('Stack trace:', error.stack);
    
    // Informações adicionais que podem ajudar no diagnóstico
    try {
      console.error('Tipo de mensagem:', type);
      console.error('Comando (se aplicável):', isCmd ? command : 'N/A');
      console.error('Grupo:', isGroup ? groupName : 'Mensagem privada');
      console.error('Remetente:', sender);
    } catch (logError) {
      console.error('Erro ao registrar informações adicionais:', logError);
    }
    
    // Reportar erro se o modo debug estiver ativado
    if (debug) {
      try {
        reportError(error, botVersion);
      } catch (reportError) {
        console.error('Erro ao reportar erro:', reportError);
      }
    }
    
    // Em caso de erro crítico, tentar enviar mensagem para o dono
    if (debug && error.message && error.message.includes('critical')) {
      try {
        const errorMsg = `⚠️ *ERRO CRÍTICO*\n\n` +
                        `*Tipo:* ${error.name}\n` +
                        `*Mensagem:* ${error.message}\n` +
                        `*Comando:* ${isCmd ? command : 'N/A'}\n` +
                        `*Timestamp:* ${new Date().toISOString()}`;
        
        nazu.sendMessage(numerodono.replace(/\D/g, '') + '@s.whatsapp.net', { text: errorMsg });
      } catch (notifyError) {
        console.error('Erro ao notificar dono:', notifyError);
      }
    }
  };
};

/**
 * Obtém informações sobre o espaço em disco
 * @returns {Object} Informações de disco em GB (total, livre, usado)
 */
function getDiskSpaceInfo() {
  try {
    const platform = os.platform();
    let totalBytes = 0;
    let freeBytes = 0;
    const defaultResult = { totalGb: 'N/A', freeGb: 'N/A', usedGb: 'N/A', percentUsed: 'N/A' };

    // Windows
    if (platform === 'win32') {
      try {
        // Obter a letra do drive do diretório atual
      const scriptPath = __dirname;
      const driveLetter = pathz.parse(scriptPath).root.charAt(0);
      const command = `fsutil volume diskfree ${driveLetter}:`;
      const output = execSync(command).toString();
      const lines = output.split('\n');
        
        // Extrair informações de espaço livre e total
      const freeLine = lines.find(line => line.includes('Total # of free bytes'));
      const totalLine = lines.find(line => line.includes('Total # of bytes'));
        
      if (freeLine) freeBytes = parseFloat(freeLine.split(':')[1].trim().replace(/\./g, ''));
      if (totalLine) totalBytes = parseFloat(totalLine.split(':')[1].trim().replace(/\./g, ''));
      } catch (winError) {
        console.error("Erro ao obter espaço em disco no Windows:", winError);
        return defaultResult;
      }
    } 
    // Linux ou macOS
    else if (platform === 'linux' || platform === 'darwin') {
      try {
        // Usar df para verificar a partição atual
        const command = 'df -k .';
      const output = execSync(command).toString();
      const lines = output.split('\n');
        
      if (lines.length > 1) {
        const parts = lines[1].split(/\s+/);
          // Converter de KB para bytes
          totalBytes = parseInt(parts[1]) * 1024; // Total
          freeBytes = parseInt(parts[3]) * 1024;  // Disponível
        }
      } catch (unixError) {
        console.error("Erro ao obter espaço em disco no Linux/macOS:", unixError);
        return defaultResult;
      }
    } 
    // Plataforma não suportada
    else {
      console.warn(`Plataforma ${platform} não suportada para informações de disco`);
      return defaultResult;
    }

    // Verificar se temos dados válidos
    if (totalBytes > 0 && freeBytes >= 0) {
      const usedBytes = totalBytes - freeBytes;
      const totalGb = (totalBytes / 1024 / 1024 / 1024).toFixed(2);
      const freeGb = (freeBytes / 1024 / 1024 / 1024).toFixed(2);
      const usedGb = (usedBytes / 1024 / 1024 / 1024).toFixed(2);
      const percentUsed = ((usedBytes / totalBytes) * 100).toFixed(1) + '%';
      
      return { totalGb, freeGb, usedGb, percentUsed };
    } else {
      console.warn("Valores inválidos de espaço em disco:", { totalBytes, freeBytes });
      return defaultResult;
    }
    } catch (error) {
    console.error("Erro ao obter informações de disco:", error);
    return { totalGb: 'N/A', freeGb: 'N/A', usedGb: 'N/A', percentUsed: 'N/A' };
  }
}

// Sistema de auto-reload para desenvolvimento
const file = require.resolve(__filename);
fs.watchFile(file, () => {
  try {
    fs.unwatchFile(file);
    console.log(`✅ Alterações detectadas em '${pathz.basename(__filename)}', recarregando...`);
    delete require.cache[file];
    require(file);
  } catch (error) {
    console.error(`❌ Erro ao recarregar '${pathz.basename(__filename)}':`, error);
  }
});

// Exporta a função principal do bot
module.exports = NazuninhaBotExec;