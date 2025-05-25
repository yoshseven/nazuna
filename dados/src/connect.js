/*
═════════════════════════════
  Nazuna - Conexão WhatsApp
  Autor: Hiudy
  Revisão: 25/05/2025
═════════════════════════════
*/

const { Boom } = require('@hapi/boom');
const { 
    makeWASocket, 
    useMultiFileAuthState, 
    makeCacheableSignalKeyStore, 
    DisconnectReason, 
    proto, 
    makeInMemoryStore 
} = require('baileys');
const NodeCache = require('node-cache');
const readline = require('readline');
const pino = require('pino');
const fs = require('fs').promises;
const path = require('path');

// Carrega o módulo principal do bot
const indexModule = require(path.join(__dirname, 'index.js'));

// Configurações e diretórios
const logger = pino({ level: 'silent' });
const AUTH_DIR = path.join(__dirname, '..', 'database', 'qr-code');
const DATABASE_DIR = path.join(__dirname, '..', 'database', 'grupos');
const msgRetryCounterCache = new Map();
const { prefixo, nomebot, nomedono, numerodono } = require('./config.json');

// Função para perguntas no terminal
const ask = (question) => {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (answer) => { rl.close(); resolve(answer.trim()); }));
};

// Cache e Store
const groupCache = new NodeCache({ stdTTL: 300, useClones: false }); // Cache para metadados de grupo
const store = makeInMemoryStore({ logger: pino().child({ level: 'silent', stream: 'store' }) });

// Função principal para iniciar a conexão
async function startNazu() {
  try {
    await fs.mkdir(DATABASE_DIR, { recursive: true });
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);

    // Função para buscar mensagens (necessária para Baileys)
    async function getMessage(key) {
      if (!store) return proto.Message.fromObject({});
      const msg = await store.loadMessage(key.remoteJid, key.id).catch(() => null);
      return msg?.message || proto.Message.fromObject({});
    };

    // Criação do Socket WA
    const nazu = makeWASocket({
      auth: { 
        creds: state.creds, 
        keys: makeCacheableSignalKeyStore(state.keys, logger) 
      },
      printQRInTerminal: !process.argv.includes('--code'), // Imprime QR no terminal se não usar --code
      syncFullHistory: true,
      emitOwnEvents: true,
      markOnlineOnConnect: true,
      fireInitQueriesEarly: true,
      fireInitQueries: true,
      msgRetryCounterCache,
      connectTimeoutMs: 180000, // Timeout de conexão aumentado
      defaultQueryTimeoutMs: 30000, // Timeout de query padrão
      keepAliveIntervalMs: 10000, // Intervalo de keep-alive
      retryRequestDelayMs: 500, // Delay para tentar novamente requisições
      generateHighQualityLinkPreview: true,
      logger,
      getMessage,
      shouldSyncHistoryMessage: () => true, // Sincronizar histórico
      cachedGroupMetadata: (jid) => groupCache.get(jid) || null, // Usa cache para metadados de grupo
      browser: ['Ubuntu', 'Edge', '110.0.1587.56'] // Define o browser simulado
    });

    // Lógica para pareamento por código
    if (process.argv.includes('--code') && !nazu.authState.creds.registered) {
      let phoneNumber = await ask('📞 Digite seu número (com DDD e DDI, ex: +5511999999999): \n\n');
      phoneNumber = phoneNumber.replace(/\D/g, '');
      if (!/^\d{10,15}$/.test(phoneNumber)) {
        console.log('❌ Número inválido! Deve ter entre 10 e 15 dígitos.');
        process.exit(1);
      }
      const code = await nazu.requestPairingCode(phoneNumber, 'N4ZUN4V3');
      console.log(`🔢 Seu código de pareamento: ${code}`);
      console.log('📲 No WhatsApp, vá em "Aparelhos Conectados" -> "Conectar com Número de Telefone" e insira o código.');
    }

    // Vincula o store aos eventos do socket
    store.bind(nazu.ev);

    // Salva as credenciais quando atualizadas
    nazu.ev.on('creds.update', saveCreds);

    // Atualiza o cache de metadados de grupo
    nazu.ev.on('groups.update', async ([ev]) => {
      try {
        const meta = await nazu.groupMetadata(ev.id).catch(() => null);
        if (meta) groupCache.set(ev.id, meta);
      } catch (e) {
        console.error(`Erro ao atualizar metadados do grupo ${ev.id}:`, e);
      }
    });

    // Lida com atualizações de participantes (entrada, saída, promoção, etc.)
    nazu.ev.on('group-participants.update', async (inf) => {
      const from = inf.id;
      // Ignora eventos do próprio bot
      if (inf.participants[0].startsWith(nazu.user.id.split(':')[0])) return;

      try {
        // Busca metadados do grupo (cache ou API)
        let groupMetadata = groupCache.get(from);
        if (!groupMetadata) {
          groupMetadata = await nazu.groupMetadata(from).catch(() => null);
          if (!groupMetadata) return;
          groupCache.set(from, groupMetadata);
        }

        // Carrega dados específicos do grupo (JSON)
        const groupFilePath = path.join(DATABASE_DIR, `${from}.json`);
        let jsonGp = {};
        try {
          if (fs.existsSync(groupFilePath)) {
             jsonGp = JSON.parse(await fs.readFile(groupFilePath, 'utf-8'));
          } else {
             // Se o arquivo não existe, cria um objeto padrão
             jsonGp = {};
          }
        } catch (e) {
          console.error(`Erro ao carregar ou parsear JSON do grupo ${from}:`, e);
          jsonGp = {}; // Define como objeto vazio para evitar erros subsequentes
        }

        // Lógica para X9 (detecção de promoção/demote)
        if ((inf.action === 'promote' || inf.action === 'demote') && jsonGp.x9) {
          const action = inf.action === 'promote' ? 'promovido a administrador' : 'rebaixado de administrador';
          const by = inf.author || 'alguém';
          await nazu.sendMessage(from, {
            text: `🕵️ *X9 Mode* 🕵️\n\n@${inf.participants[0].split('@')[0]} foi ${action} por @${by.split('@')[0]}!`,
            mentions: [inf.participants[0], by],
          });
        }

        // Lógica Antifake
        if (inf.action === 'add' && jsonGp.antifake) {
          const participant = inf.participants[0];
          const countryCode = participant.split('@')[0].substring(0, 2);
          if (!['55', '35'].includes(countryCode)) { // Permite apenas Brasil (55) e portugal
            await nazu.groupParticipantsUpdate(from, [participant], 'remove');
            await nazu.sendMessage(from, {
              text: `🚫 @${participant.split('@')[0]} foi removido por ser de um país não permitido (antifake ativado)!`,
              mentions: [participant],
            });
          }
        }
        
        // Lógica AntiPT (Portugal)
        if (inf.action === 'add' && jsonGp.antipt) {
          const participant = inf.participants[0];
          const countryCode = participant.split('@')[0].substring(0, 3);
          if (countryCode === '351') { // Código de Portugal
            await nazu.groupParticipantsUpdate(from, [participant], 'remove');
            await nazu.sendMessage(from, {
              text: `🚫 @${participant.split('@')[0]} foi removido por ser de Portugal (antipt ativado)!`,
              mentions: [participant],
            });
          }
        }

        // Lógica Blacklist
        if (inf.action === 'add' && jsonGp.blacklist?.[inf.participants[0]]) {
          const sender = inf.participants[0];
          try {
            await nazu.groupParticipantsUpdate(from, [sender], 'remove');
            await nazu.sendMessage(from, {
              text: `🚫 @${sender.split('@')[0]} foi removido automaticamente por estar na blacklist.\nMotivo: ${jsonGp.blacklist[sender].reason}`,
              mentions: [sender],
            });
          } catch (e) {
            console.error(`Erro ao remover usuário da blacklist no grupo ${from}:`, e);
          }
          return; // Sai da função se removeu por blacklist
        }

        // Lógica de Boas-vindas
        if (inf.action === 'add' && jsonGp.bemvindo) {
          const sender = inf.participants[0];
          const textBv = jsonGp.textbv && jsonGp.textbv.length > 1
            ? jsonGp.textbv
            : 'Seja bem-vindo(a) #numerodele# ao #nomedogp#!\nVocê é nosso membro número: *#membros#*!';

          const welcomeText = textBv
            .replaceAll('#numerodele#', `@${sender.split('@')[0]}`)
            .replaceAll('#nomedogp#', groupMetadata.subject)
            .replaceAll('#desc#', groupMetadata.desc || '')
            .replaceAll('#membros#', groupMetadata.participants.length);

          try {
            const message = { text: welcomeText, mentions: [sender] };
            if (jsonGp.welcome?.image) {
              message.image = { url: jsonGp.welcome.image };
              delete message.text;
              message.caption = welcomeText;
            }
            await nazu.sendMessage(from, message);
          } catch (e) {
            console.error(`Erro ao enviar mensagem de boas-vindas no grupo ${from}:`, e);
          }
        }

        // Lógica de Saída
        if (inf.action === 'remove' && jsonGp.exit?.enabled) {
          const sender = inf.participants[0];
          const exitText = jsonGp.exit.text && jsonGp.exit.text.length > 1
            ? jsonGp.exit.text
            : 'Adeus #numerodele#! 👋\nO grupo *#nomedogp#* agora tem *#membros#* membros.';

          const formattedText = exitText
            .replaceAll('#numerodele#', `@${sender.split('@')[0]}`)
            .replaceAll('#nomedogp#', groupMetadata.subject)
            .replaceAll('#desc#', groupMetadata.desc || '')
            .replaceAll('#membros#', groupMetadata.participants.length);

          try {
            const message = { text: formattedText, mentions: [sender] };
            if (jsonGp.exit?.image) {
              message.image = { url: jsonGp.exit.image };
              message.caption = formattedText;
            }
            await nazu.sendMessage(from, message);
          } catch (e) {
            console.error(`Erro ao enviar mensagem de saída no grupo ${from}:`, e);
          }
        }
      } catch (err) {
        console.error('Erro no manipulador group-participants.update:', err);
      }
    });

    // Lida com novas mensagens recebidas
    nazu.ev.on('messages.upsert', async (m) => {
      // Verifica se é um evento válido de mensagem
      if (!m.messages || !Array.isArray(m.messages) || m.type !== 'notify') return;
      
      // Encaminha o evento completo para o módulo index.js
      try {
        if (typeof indexModule === 'function') {
          // Passa o socket (nazu), o evento (m), o store e o cache
          await indexModule(nazu, m, store, groupCache);
        } else {
          console.error('O módulo index.js não exporta uma função válida.');
        }
      } catch (err) {
        console.error('Erro ao chamar o módulo index.js:', err);
      }
    });

    // Lida com atualizações de conexão
    nazu.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (connection === 'open') {
        console.log(
          `============================================\nBot: ${nomebot}\nPrefix: ${prefixo}\nDono: ${nomedono}\nCriador: Hiudy\n============================================\n    ✅ BOT CONECTADO COM SUCESSO\n============================================`
        );
      }

      if (connection === 'close') {
        const reasonCode = new Boom(lastDisconnect?.error)?.output?.statusCode;
        const shouldReconnect = reasonCode !== DisconnectReason.loggedOut && reasonCode !== 401;
        
        const reasonMessages = {
          [DisconnectReason.loggedOut]: '🗑️ Desconectado pelo WhatsApp, QR inválido. Escaneie novamente.',
          401: '🗑️ Credenciais inválidas. Removendo autenticação e reiniciando.',
          408: '⏰ Timeout na conexão. Tentando reconectar...', // Connection Timeout
          411: '📄 Arquivo de sessão inválido. Tentando reconectar...', // Relay Error
          428: '📡 Conexão fechada externamente. Tentando reconectar...', // Connection Closed
          440: '🔗 Múltiplas conexões detectadas. Feche outras sessões e tente novamente.', // Connection Replaced
          500: '⚙️ Erro interno do servidor WhatsApp. Tentando reconectar...', // Internal Server Error
          503: '❓ Serviço indisponível. Tentando reconectar...', // Service Unavailable
          515: '🔄 Reiniciando para estabilizar conexão...', // Restart Required
          [DisconnectReason.timedOut]: '⏳ Conexão expirou. Tentando reconectar...',
          [DisconnectReason.connectionLost]: '📉 Conexão perdida com o servidor. Tentando reconectar...',
          [DisconnectReason.badSession]: '🚫 Sessão corrompida. Removendo autenticação e reiniciando.',
          [DisconnectReason.multideviceMismatch]: '📱 Incompatibilidade Multi-Device. Removendo autenticação e reiniciando.',
          [DisconnectReason.restricted]: '🔒 Conta restrita. Verifique seu WhatsApp.',
          [DisconnectReason.unlaunched]: '🚀 WhatsApp não iniciado no telefone. Verifique.',
          [DisconnectReason.unavailable]: '🔌 Serviço indisponível temporariamente. Tentando reconectar...'
        };

        const reasonText = reasonMessages[reasonCode] || `Motivo desconhecido (${reasonCode})`;
        console.log(`⚠️ Conexão fechada: ${reasonText}`);

        // Limpa autenticação se necessário
        if (reasonCode === DisconnectReason.loggedOut || reasonCode === 401) {
          console.log('Removendo diretório de autenticação...');
          await fs.rm(AUTH_DIR, { recursive: true, force: true }).catch(e => console.error("Erro ao remover AUTH_DIR:", e));
        }

        // Tenta reconectar se não for logout ou erro fatal
        if (shouldReconnect) {
          console.log('🔄 Tentando reconectar em 5 segundos...');
          setTimeout(startNazu, 5000); // Espera 5 segundos antes de tentar reconectar
        } else {
           console.log('🛑 Não será possível reconectar automaticamente. Verifique o motivo.');
        }
      }

      if (connection === 'connecting') {
        console.log('🔄 Conectando ao WhatsApp...');
      }
    });

  } catch (err) {
    console.error('❌ Erro fatal ao iniciar o bot:', err);
    // Tenta reiniciar após um erro fatal na inicialização
    console.log('🔄 Tentando reiniciar o bot em 10 segundos...');
    setTimeout(startNazu, 10000);
  }
}

// Inicia o bot
startNazu();