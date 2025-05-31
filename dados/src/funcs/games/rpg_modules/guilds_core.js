/*
 * Módulo Core de Guildas - RPG Nazuna
 * Gerencia criação, membros, níveis, guerras e recursos de guildas.
 * 
 * Criado originalmente por: Hiudy
 * 
 * Manter créditos ao criar ou modificar!
 */

const fs = require("fs").promises;
const path = require("path");
const { carregarDadosJogador, salvarDadosJogador, normalizar, formatarMoeda } = require("./utils");
const { DIFICULDADE, LIMITES, GERAL, MOEDA } = require("./config"); // Adicionado LIMITES, GERAL, MOEDA
const { adicionarSaldo, removerSaldo } = require("./player"); // Usar funções de player para saldo

const GuildsPath = path.join("dados", "database", "guilds");
const GuildDataFile = path.join(GuildsPath, "guild_list.json");

let GUILD_LIST = {}; // Armazena dados básicos de todas as guildas { id: { nome, lider, membros_count } }

// Garante que o diretório de dados das guildas exista
async function inicializarDiretorioGuildas() {
    try {
        await fs.mkdir(GuildsPath, { recursive: true });
        // Carrega a lista de guildas ou cria se não existir
        if (await fs.access(GuildDataFile).then(() => true).catch(() => false)) {
            const data = await fs.readFile(GuildDataFile, "utf-8");
            GUILD_LIST = JSON.parse(data);
        } else {
            await fs.writeFile(GuildDataFile, JSON.stringify({}, null, 2));
        }
    } catch (err) {
        console.error("Erro crítico ao inicializar diretório/lista de guildas:", err);
    }
}

inicializarDiretorioGuildas();

// Salva a lista geral de guildas
async function salvarListaGuildas() {
    try {
        await fs.writeFile(GuildDataFile, JSON.stringify(GUILD_LIST, null, 2));
    } catch (err) {
        console.error("Erro ao salvar lista de guildas:", err);
    }
}

// Carrega os dados completos de uma guilda específica
async function carregarDadosGuilda(guildId) {
    const filePath = path.join(GuildsPath, `${guildId}.json`);
    try {
        if (await fs.access(filePath).then(() => true).catch(() => false)) {
            const data = await fs.readFile(filePath, "utf-8");
            const dados = JSON.parse(data);
            // Garante estruturas básicas
            dados.membros = dados.membros || {};
            dados.tesouraria = dados.tesouraria || 0;
            dados.nivel = dados.nivel || 1;
            dados.xp = dados.xp || 0;
            dados.guerra = dados.guerra || { ativa: false, oponente: null, placar: { nossa: 0, deles: 0 }, inicio: null };
            dados.missoes_ativas = dados.missoes_ativas || [];
            dados.territorios = dados.territorios || [];
            dados.config = dados.config || { recrutamento_aberto: true };
            dados.log = dados.log || []; // Garante que o log exista
            return dados;
        } else {
            return null; // Guilda não encontrada
        }
    } catch (err) {
        console.error(`Erro ao carregar dados da guilda ${guildId}:`, err);
        return null;
    }
}

// Salva os dados completos de uma guilda específica
async function salvarDadosGuilda(guildId, dadosGuilda) {
    const filePath = path.join(GuildsPath, `${guildId}.json`);
    try {
        await fs.writeFile(filePath, JSON.stringify(dadosGuilda, null, 2));
        // Atualiza contagem na lista geral
        if (GUILD_LIST[guildId]) {
            GUILD_LIST[guildId].membros_count = Object.keys(dadosGuilda.membros).length;
            await salvarListaGuildas();
        }
        return true;
    } catch (err) {
        console.error(`Erro ao salvar dados da guilda ${guildId}:`, err);
        return false;
    }
}

// Calcula XP necessário para o próximo nível da guilda
function xpParaProximoNivelGuilda(nivelAtual) {
    // Exemplo de curva: 1000 * (nivelAtual ^ 1.5)
    return Math.floor(1000 * Math.pow(nivelAtual, 1.5));
}

// Calcula limite de membros da guilda
function limiteMembrosGuilda(nivelAtual) {
    // Exemplo: 10 base + 5 por nível
    // TODO: Mover 10 e 5 para config.js?
    return 10 + (nivelAtual * 5);
}

// --- Funções de Gerenciamento de Guildas ---

// Cria uma nova guilda
async function criarGuilda(senderId, nomeGuilda) {
    let dadosJogador = await carregarDadosJogador(senderId);
    if (!dadosJogador) return { msg: "⚠️ Lenda não encontrada!" };
    if (dadosJogador.guilda) return { msg: `🛡️ Você já pertence à guilda "${GUILD_LIST[dadosJogador.guilda]?.nome || dadosJogador.guilda}"! Saia primeiro (${GERAL.PREFIXO_BOT}guilda sair).` };

    const nomeNormalizado = normalizar(nomeGuilda);
    if (nomeNormalizado.length < 3 || nomeNormalizado.length > 20) {
        return { msg: "⚠️ O nome da guilda deve ter entre 3 e 20 caracteres." };
    }
    if (Object.values(GUILD_LIST).some(g => normalizar(g.nome) === nomeNormalizado)) {
        return { msg: `⚠️ Já existe uma guilda com o nome "${nomeGuilda}".` };
    }

    const custoCriacao = DIFICULDADE.GUILD_CREATION_COST;
    if (LIMITES.ATIVAR_CUSTO_CRIAR_GUILDA) {
        if ((dadosJogador.saldo.carteira || 0) < custoCriacao) {
            return { msg: `💰 Você precisa de ${formatarMoeda(custoCriacao)} para fundar uma guilda. Você tem ${formatarMoeda(dadosJogador.saldo.carteira || 0)}.` };
        }
        // Remove dinheiro do jogador
        dadosJogador = removerSaldo(dadosJogador, custoCriacao, false); // Remove da carteira
        if (!dadosJogador) return { msg: "⚠️ Falha ao cobrar a taxa de criação!" };
    }

    const guildId = Date.now().toString(); // ID único baseado no timestamp
    const novaGuilda = {
        id: guildId,
        nome: nomeGuilda,
        lider: senderId,
        membros: {
            [senderId]: { cargo: "Líder", entrou_em: new Date().toISOString() }
        },
        tesouraria: 0,
        nivel: 1,
        xp: 0,
        guerra: { ativa: false, oponente: null, placar: { nossa: 0, deles: 0 }, inicio: null },
        missoes_ativas: [],
        territorios: [],
        config: { recrutamento_aberto: true },
        log: [`[${new Date().toLocaleDateString()}] Guilda "${nomeGuilda}" fundada por ${dadosJogador.nome || senderId.split("@")[0]}.`]
    };

    // Salva dados da nova guilda
    const saveGuild = await salvarDadosGuilda(guildId, novaGuilda);
    if (!saveGuild) {
        // Devolve dinheiro se falhar ao salvar guilda e se o custo foi ativado
        if (LIMITES.ATIVAR_CUSTO_CRIAR_GUILDA) {
            dadosJogador = adicionarSaldo(dadosJogador, custoCriacao, false);
            await salvarDadosJogador(senderId, dadosJogador);
        }
        return { msg: "❌ Erro ao salvar os dados da nova guilda. Tente novamente." };
    }

    // Atualiza lista geral
    GUILD_LIST[guildId] = { nome: nomeGuilda, lider: senderId, membros_count: 1 };
    await salvarListaGuildas();

    // Atualiza dados do jogador
    dadosJogador.guilda = guildId;
    await salvarDadosJogador(senderId, dadosJogador);

    return { msg: `🎉 Guilda "${nomeGuilda}" fundada com sucesso! Você é o Líder!` };
}

// Entra em uma guilda existente
async function entrarGuilda(senderId, nomeGuilda) {
    let dadosJogador = await carregarDadosJogador(senderId);
    if (!dadosJogador) return { msg: "⚠️ Lenda não encontrada!" };
    if (dadosJogador.guilda) return { msg: `🛡️ Você já pertence à guilda "${GUILD_LIST[dadosJogador.guilda]?.nome || dadosJogador.guilda}"! Saia primeiro (${GERAL.PREFIXO_BOT}guilda sair).` };

    const nomeNormalizado = normalizar(nomeGuilda);
    const guildEntry = Object.entries(GUILD_LIST).find(([id, data]) => normalizar(data.nome) === nomeNormalizado);

    if (!guildEntry) return { msg: `❓ Guilda "${nomeGuilda}" não encontrada.` };

    const [guildId, guildInfo] = guildEntry;
    let dadosGuilda = await carregarDadosGuilda(guildId);
    if (!dadosGuilda) return { msg: "❌ Erro ao carregar dados da guilda." };

    if (!dadosGuilda.config.recrutamento_aberto) {
        // TODO: Implementar sistema de convites
        return { msg: `⛔ A guilda "${guildInfo.nome}" não está aceitando novos membros no momento (recrutamento fechado).` };
    }

    // Limite de membros
    if (LIMITES.ATIVAR_LIMITE_MEMBROS_GUILDA) {
        const limite = limiteMembrosGuilda(dadosGuilda.nivel);
        if (Object.keys(dadosGuilda.membros).length >= limite) {
            return { msg: `🈵 A guilda "${guildInfo.nome}" está cheia (${Object.keys(dadosGuilda.membros).length}/${limite})!` };
        }
    }

    // Adiciona membro
    dadosGuilda.membros[senderId] = { cargo: "Membro", entrou_em: new Date().toISOString() };
    dadosGuilda.log.push(`[${new Date().toLocaleDateString()}] ${dadosJogador.nome || senderId.split("@")[0]} entrou na guilda.`);
    
    const saveGuild = await salvarDadosGuilda(guildId, dadosGuilda);
    if (!saveGuild) return { msg: "❌ Erro ao salvar dados da guilda após entrada." };

    // Atualiza dados do jogador
    dadosJogador.guilda = guildId;
    await salvarDadosJogador(senderId, dadosJogador);

    return { msg: `✅ Você entrou na guilda "${guildInfo.nome}"!` };
}

// Sai da guilda atual
async function sairGuilda(senderId) {
    let dadosJogador = await carregarDadosJogador(senderId);
    if (!dadosJogador) return { msg: "⚠️ Lenda não encontrada!" };
    if (!dadosJogador.guilda) return { msg: "🛡️ Você não pertence a nenhuma guilda." };

    const guildId = dadosJogador.guilda;
    let dadosGuilda = await carregarDadosGuilda(guildId);
    if (!dadosGuilda) {
        // Se dados da guilda não existem mas jogador acha que pertence, limpa o lado do jogador
        dadosJogador.guilda = null;
        await salvarDadosJogador(senderId, dadosJogador);
        return { msg: "❓ A guilda que você pertencia não foi encontrada. Seu status foi corrigido." };
    }

    if (dadosGuilda.lider === senderId && Object.keys(dadosGuilda.membros).length > 1) {
        return { msg: `👑 Você é o Líder! Transfira a liderança (${GERAL.PREFIXO_BOT}guilda promover <@novo_lider>) antes de sair, ou use ${GERAL.PREFIXO_BOT}guilda dissolver.` };
    }

    const nomeGuilda = GUILD_LIST[guildId]?.nome || "Guilda Desconhecida";
    const nomeJogador = dadosJogador.nome || senderId.split("@")[0];

    // Remove membro da guilda
    delete dadosGuilda.membros[senderId];
    dadosGuilda.log.push(`[${new Date().toLocaleDateString()}] ${nomeJogador} saiu da guilda.`);

    // Se era o último membro (líder saindo), dissolve a guilda
    if (Object.keys(dadosGuilda.membros).length === 0) {
        delete GUILD_LIST[guildId];
        await salvarListaGuildas();
        // Apaga o arquivo da guilda
        try {
            await fs.unlink(path.join(GuildsPath, `${guildId}.json`));
        } catch (err) {
            console.error(`Erro ao apagar arquivo da guilda dissolvida ${guildId}:`, err);
        }
        dadosJogador.guilda = null;
        await salvarDadosJogador(senderId, dadosJogador);
        return { msg: `🗑️ Você saiu da guilda "${nomeGuilda}" e, como era o último membro, ela foi dissolvida.` };
    } else {
        // Salva a guilda atualizada
        const saveGuild = await salvarDadosGuilda(guildId, dadosGuilda);
        if (!saveGuild) return { msg: "❌ Erro ao salvar dados da guilda após saída." };

        // Atualiza jogador
        dadosJogador.guilda = null;
        await salvarDadosJogador(senderId, dadosJogador);
        return { msg: `✅ Você saiu da guilda "${nomeGuilda}".` };
    }
}

// Ver informações da guilda (própria ou outra)
async function verGuilda(senderId, nomeGuildaAlvo = null) {
    let dadosJogador = await carregarDadosJogador(senderId);
    if (!dadosJogador) return { msg: "⚠️ Lenda não encontrada!" };

    let guildId;
    if (nomeGuildaAlvo) {
        const nomeNormalizado = normalizar(nomeGuildaAlvo);
        const guildEntry = Object.entries(GUILD_LIST).find(([id, data]) => normalizar(data.nome) === nomeNormalizado);
        if (!guildEntry) return { msg: `❓ Guilda "${nomeGuildaAlvo}" não encontrada.` };
        guildId = guildEntry[0];
    } else {
        if (!dadosJogador.guilda) return { msg: `🛡️ Você não pertence a nenhuma guilda. Use 
${GERAL.PREFIXO_BOT}guilda ver <nome_guilda>
 para ver outra.` };
        guildId = dadosJogador.guilda;
    }

    const dadosGuilda = await carregarDadosGuilda(guildId);
    if (!dadosGuilda) return { msg: "❌ Erro ao carregar dados da guilda." };

    const nomeGuilda = dadosGuilda.nome;
    const liderId = dadosGuilda.lider;
    // Tenta obter nome do líder (pode precisar carregar dados do líder)
    // const dadosLider = await carregarDadosJogador(liderId);
    // const nomeLider = dadosLider?.nome || liderId.split("@")[0];
    const nomeLider = liderId.split("@")[0]; // Simplificado por agora
    const numMembros = Object.keys(dadosGuilda.membros).length;
    const nivel = dadosGuilda.nivel;
    const xpAtual = dadosGuilda.xp;
    const xpProx = xpParaProximoNivelGuilda(nivel);
    const tesouraria = dadosGuilda.tesouraria;
    const recrutamento = dadosGuilda.config.recrutamento_aberto ? "Aberto" : "Fechado";
    const guerraStatus = dadosGuilda.guerra.ativa ? `Em guerra contra ${GUILD_LIST[dadosGuilda.guerra.oponente]?.nome || "??"}` : "Em paz";
    const limiteMembros = limiteMembrosGuilda(nivel);

    let msg = `🏰 *Informações da Guilda: ${nomeGuilda}* 🏰\n`;
    msg += `------------------------------------\n`;
    msg += `👑 Líder: ${nomeLider}\n`;
    msg += `👥 Membros: ${numMembros}${LIMITES.ATIVAR_LIMITE_MEMBROS_GUILDA ? `/${limiteMembros}` : ""}\n`;
    msg += `🌟 Nível: ${nivel}\n`;
    msg += `✨ XP: ${xpAtual} / ${xpProx}\n`;
    msg += `💰 Tesouraria: ${formatarMoeda(tesouraria)}\n`;
    msg += `🚪 Recrutamento: ${recrutamento}\n`;
    msg += `⚔️ Status de Guerra: ${guerraStatus}\n`;
    // TODO: Listar territórios?
    msg += `------------------------------------\n`;
    // TODO: Adicionar subcomandos para ver membros, log, etc.
    msg += `Use ${GERAL.PREFIXO_BOT}guilda membros para ver a lista de membros.`;

    return { msg };
}

// Lista membros da guilda
async function listarMembrosGuilda(senderId) {
    let dadosJogador = await carregarDadosJogador(senderId);
    if (!dadosJogador || !dadosJogador.guilda) return { msg: "🛡️ Você precisa estar em uma guilda para ver os membros." };

    const guildId = dadosJogador.guilda;
    const dadosGuilda = await carregarDadosGuilda(guildId);
    if (!dadosGuilda) return { msg: "❌ Erro ao carregar dados da sua guilda." };

    let msg = `👥 *Membros de ${dadosGuilda.nome}:*\n`;
    msg += `------------------------------------\n`;
    let count = 0;
    for (const [membroId, membroInfo] of Object.entries(dadosGuilda.membros)) {
        // Tentar obter nome do membro?
        const nomeMembro = membroId.split("@")[0]; // Simplificado
        msg += `${++count}. ${nomeMembro} (${membroInfo.cargo})\n`;
    }
    msg += `------------------------------------`;
    return { msg };
}

// TODO: Implementar mais funções:
// - promoverMembro(senderId, membroAlvoId, novoCargo)
// - rebaixarMembro(senderId, membroAlvoId)
// - expulsarMembro(senderId, membroAlvoId)
// - transferirLideranca(senderId, novoLiderId)
// - dissolverGuilda(senderId)
// - configurarGuilda(senderId, config, valor) (ex: recrutamento on/off)
// - depositarTesouraria(senderId, quantidade)
// - sacarTesouraria(senderId, quantidade) // Apenas líder/oficiais?
// - adicionarXPGuilda(guildId, xpGanho) -> verifica level up
// - iniciarGuerra(senderId, guildaAlvoNome)
// - aceitarGuerra(senderId)
// - recusarGuerra(senderId)
// - registrarVitoriaGuerra(guildId, pontos)
// - finalizarGuerra(guildId)
// - verRankingGuildas()

module.exports = {
    criarGuilda,
    entrarGuilda,
    sairGuilda,
    verGuilda,
    listarMembrosGuilda,
    // Exportar outras funções quando implementadas
    carregarDadosGuilda,
    salvarDadosGuilda,
    GUILD_LIST
};

