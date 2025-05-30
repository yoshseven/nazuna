/*
 * Módulo de Combate PvP (Jogador vs Jogador) - RPG Nazuna (Versão Aprimorada)
 * Gerencia duelos, desafios e a lógica de batalha entre jogadores.
 * 
 * Criado originalmente por: Hiudy
 * Refatorado e expandido por: Manus (IA)
 * 
 * Manter créditos ao criar ou modificar!
 */

const { carregarDadosJogador, salvarDadosJogador, normalizar, formatarMoeda } = require("./utils");
const { GERAL, MOEDA, DIFICULDADE } = require("./config");
const { atualizarRankingPvP } = require("./ranking"); // Para atualizar ranking após batalha

// Armazenamento temporário para desafios e batalhas em andamento
let DesafiosPendentes = {}; // { desafiadoId: { desafianteId: senderId, timestamp: Date.now() } }
let BatalhasPvPAtivas = {}; // { batalhaId: { jogador1: { id: id1, nome: n1, hp: h1, stats: {...}, turno: true }, jogador2: { id: id2, nome: n2, hp: h2, stats: {...}, turno: false }, log: [], timestamp: Date.now() } }

// Limpa desafios e batalhas antigas
function limparSessoesPvPAntigas() {
    const agora = Date.now();
    const limiteTempoDesafio = (DIFICULDADE.PVP_CHALLENGE_TIMEOUT_MINUTES || 5) * 60 * 1000;
    const limiteTempoBatalha = (DIFICULDADE.PVP_BATTLE_TIMEOUT_MINUTES || 15) * 60 * 1000;

    for (const idDesafiado in DesafiosPendentes) {
        if (agora - DesafiosPendentes[idDesafiado].timestamp > limiteTempoDesafio) {
            // TODO: Notificar jogadores sobre expiração?
            delete DesafiosPendentes[idDesafiado];
            console.log(`${GERAL.NOME_BOT} Info: Desafio PvP para ${idDesafiado} expirou.`);
        }
    }
    for (const idBatalha in BatalhasPvPAtivas) {
        if (agora - BatalhasPvPAtivas[idBatalha].timestamp > limiteTempoBatalha) {
            // TODO: Declarar empate ou penalidade por inatividade?
            const batalha = BatalhasPvPAtivas[idBatalha];
            delete BatalhasPvPAtivas[idBatalha];
            console.log(`${GERAL.NOME_BOT} Info: Batalha PvP ${idBatalha} expirou por inatividade.`);
            // Notificar jogadores?
        }
    }
}
setInterval(limparSessoesPvPAntigas, 5 * 60 * 1000); // Verifica a cada 5 minutos

// Encontra uma batalha ativa envolvendo um jogador
function encontrarBatalhaPorJogador(senderId) {
    for (const idBatalha in BatalhasPvPAtivas) {
        const batalha = BatalhasPvPAtivas[idBatalha];
        if (batalha.jogador1.id === senderId || batalha.jogador2.id === senderId) {
            return { idBatalha, batalha };
        }
    }
    return null;
}

// --- Funções do Sistema PvP ---

// Desafia outro jogador para um duelo
async function desafiarJogador(senderId, alvoId) {
    if (senderId === alvoId) return { success: false, msg: "❌ Você não pode desafiar a si mesmo para um duelo!" };

    const [dadosJogador, dadosAlvo] = await Promise.all([carregarDadosJogador(senderId), carregarDadosJogador(alvoId)]);

    if (!dadosJogador) return { success: false, msg: `❓ ${GERAL.NOME_BOT} não te reconhece... Registre-se primeiro!` };
    if (!dadosAlvo) return { success: false, msg: `❓ Jogador alvo (@${alvoId.split('@')[0]}) não encontrado ou não registrado no RPG.` };

    // Verificar se já há desafio pendente ou batalha ativa
    if (DesafiosPendentes[alvoId] || DesafiosPendentes[senderId]) {
        return { success: false, msg: "⏳ Já existe um desafio pendente envolvendo um de vocês. Aguarde ou cancele." };
    }
    if (encontrarBatalhaPorJogador(senderId) || encontrarBatalhaPorJogador(alvoId)) {
        return { success: false, msg: "⚔️ Um de vocês já está em uma batalha PvP ativa." };
    }

    // TODO: Adicionar verificações (nível mínimo? custo para desafiar?)
    // if (dadosJogador.nivel < DIFICULDADE.PVP_NIVEL_MINIMO) return { msg: `📉 Você precisa atingir o nível ${DIFICULDADE.PVP_NIVEL_MINIMO} para desafiar outros jogadores.` };
    // if (dadosAlvo.nivel < DIFICULDADE.PVP_NIVEL_MINIMO) return { msg: `📉 ${dadosAlvo.nome} ainda não atingiu o nível mínimo para PvP.` };

    DesafiosPendentes[alvoId] = { desafianteId: senderId, timestamp: Date.now() };

    const nomeDesafiante = dadosJogador.nome || senderId.split("@")[0];
    const nomeAlvo = dadosAlvo.nome || alvoId.split("@")[0];

    const msgParaAlvo = `⚔️ *${nomeDesafiante}* (@${senderId.split("@")[0]}) lançou um desafio de duelo PvP contra você!
Use ${GERAL.PREFIXO_BOT}pvp aceitar @${senderId.split("@")[0]} para aceitar ou ${GERAL.PREFIXO_BOT}pvp recusar @${senderId.split("@")[0]} para recusar.
O desafio expira em ${DIFICULDADE.PVP_CHALLENGE_TIMEOUT_MINUTES || 5} minutos.`;

    return {
        success: true,
        msgSender: `✅ Desafio de duelo enviado para *${nomeAlvo}*! Aguardando a resposta...`,
        msgTarget: msgParaAlvo,
        targetId: alvoId
    };
}

// Aceita um desafio de duelo
async function aceitarDesafio(senderId, desafianteId) {
    if (!DesafiosPendentes[senderId] || DesafiosPendentes[senderId].desafianteId !== desafianteId) {
        return { success: false, msg: "❓ Nenhum desafio válido encontrado deste jogador para aceitar." };
    }
    if (encontrarBatalhaPorJogador(senderId) || encontrarBatalhaPorJogador(desafianteId)) {
        return { success: false, msg: "⚔️ Um de vocês já está em outra batalha PvP." };
    }

    const [dadosJogador, dadosDesafiante] = await Promise.all([carregarDadosJogador(senderId), carregarDadosJogador(desafianteId)]);
    if (!dadosJogador || !dadosDesafiante) return { success: false, msg: `⚙️ ${GERAL.NOME_BOT} Erro: Falha ao carregar dados dos duelistas.` };

    // Limpa o desafio pendente
    delete DesafiosPendentes[senderId];

    const idBatalha = `pvp_${senderId}_${desafianteId}_${Date.now()}`;
    
    // Simplificado: Usa stats base. Idealmente, calcular stats com equipamentos.
    const statsJogador1 = { ...dadosDesafiante.stats }; 
    const statsJogador2 = { ...dadosJogador.stats };

    BatalhasPvPAtivas[idBatalha] = {
        jogador1: { id: desafianteId, nome: dadosDesafiante.nome || desafianteId.split('@')[0], hp: statsJogador1.hp_max, stats: statsJogador1, turno: true },
        jogador2: { id: senderId, nome: dadosJogador.nome || senderId.split('@')[0], hp: statsJogador2.hp_max, stats: statsJogador2, turno: false },
        log: [`⚔️ Duelo iniciado entre ${dadosDesafiante.nome} e ${dadosJogador.nome}!`],
        timestamp: Date.now()
    };

    const msgInicio = `🔥 Duelo Aceito! *${BatalhasPvPAtivas[idBatalha].jogador1.nome}* vs *${BatalhasPvPAtivas[idBatalha].jogador2.nome}*!

${formatarEstadoBatalha(BatalhasPvPAtivas[idBatalha])}

É o turno de *${BatalhasPvPAtivas[idBatalha].jogador1.nome}*.
Use ${GERAL.PREFIXO_BOT}pvp atacar ou ${GERAL.PREFIXO_BOT}pvp fugir.`;

    return {
        success: true,
        msgAmbos: msgInicio,
        sender1: desafianteId,
        sender2: senderId
    };
}

// Recusa um desafio de duelo
async function recusarDesafio(senderId, desafianteId) {
    if (!DesafiosPendentes[senderId] || DesafiosPendentes[senderId].desafianteId !== desafianteId) {
        return { success: false, msg: "❓ Nenhum desafio válido encontrado deste jogador para recusar." };
    }

    const nomeDesafiante = (await carregarDadosJogador(desafianteId))?.nome || desafianteId.split("@")[0];
    const nomeJogador = (await carregarDadosJogador(senderId))?.nome || senderId.split("@")[0];
    delete DesafiosPendentes[senderId];

    const msgRecusaSender = `❌ Você recusou o desafio de duelo de *${nomeDesafiante}*.`;
    const msgRecusaTarget = `❌ *${nomeJogador}* recusou seu desafio de duelo.`;

    return {
        success: true,
        msgSender: msgRecusaSender,
        msgTarget: msgRecusaTarget,
        targetId: desafianteId
    };
}

// Calcula o dano PvP (exemplo simples)
function calcularDanoPvP(atacanteStats, defensorStats) {
    const danoBase = atacanteStats.atk * (DIFICULDADE.PVP_ATK_MULTIPLIER || 1.5);
    const defesa = defensorStats.def * (DIFICULDADE.PVP_DEF_MULTIPLIER || 1.0);
    // Fórmula simples: Dano = Ataque * Multiplicador - Defesa * Multiplicador
    let dano = Math.max(1, Math.floor(danoBase - defesa)); 
    // Adiciona um pouco de aleatoriedade (ex: +/- 15%)
    dano = Math.floor(dano * (1 + (Math.random() * 0.3 - 0.15))); 
    return Math.max(1, dano); // Garante pelo menos 1 de dano
}

// Formata o estado atual da batalha para exibição
function formatarEstadoBatalha(batalha) {
    return `*${batalha.jogador1.nome}* ❤️ ${batalha.jogador1.hp}/${batalha.jogador1.stats.hp_max} HP
*${batalha.jogador2.nome}* ❤️ ${batalha.jogador2.hp}/${batalha.jogador2.stats.hp_max} HP`;
}

// Executa um ataque na batalha PvP
async function atacarPvP(senderId) {
    const batalhaInfo = encontrarBatalhaPorJogador(senderId);
    if (!batalhaInfo) {
        return { success: false, msg: "⚔️ Você não está em uma batalha PvP ativa." };
    }

    const { idBatalha, batalha } = batalhaInfo;
    const jogadorAtacante = (batalha.jogador1.id === senderId) ? batalha.jogador1 : batalha.jogador2;
    const jogadorDefensor = (batalha.jogador1.id === senderId) ? batalha.jogador2 : batalha.jogador1;

    if (!jogadorAtacante.turno) {
        return { success: false, msg: "⏳ Espere! Ainda não é o seu turno para atacar." };
    }

    // TODO: Implementar seleção de habilidades? Por enquanto, ataque básico.
    const danoCausado = calcularDanoPvP(jogadorAtacante.stats, jogadorDefensor.stats);
    jogadorDefensor.hp = Math.max(0, jogadorDefensor.hp - danoCausado);

    const logMsg = `💥 *${jogadorAtacante.nome}* ataca *${jogadorDefensor.nome}* causando ${danoCausado} de dano!`;
    batalha.log.push(logMsg);
    batalha.timestamp = Date.now(); // Atualiza timestamp da atividade

    let msgResultado = `${logMsg}

${formatarEstadoBatalha(batalha)}`;
    let fimDeBatalha = false;

    // Verifica se a batalha terminou
    if (jogadorDefensor.hp <= 0) {
        fimDeBatalha = true;
        msgResultado += `

🏆 *${jogadorAtacante.nome}* venceu o duelo!`;
        // Finaliza a batalha e atualiza ranking
        await finalizarBatalhaPvP(idBatalha, jogadorAtacante.id, jogadorDefensor.id);
    } else {
        // Passa o turno
        jogadorAtacante.turno = false;
        jogadorDefensor.turno = true;
        msgResultado += `

É o turno de *${jogadorDefensor.nome}*.`;
    }

    return {
        success: true,
        msgAmbos: msgResultado,
        sender1: batalha.jogador1.id,
        sender2: batalha.jogador2.id,
        batalhaTerminou: fimDeBatalha
    };
}

// Tenta fugir da batalha PvP
async function fugirPvP(senderId) {
    const batalhaInfo = encontrarBatalhaPorJogador(senderId);
    if (!batalhaInfo) {
        return { success: false, msg: "⚔️ Você não está em uma batalha PvP ativa para fugir." };
    }

    const { idBatalha, batalha } = batalhaInfo;
    const jogadorFugindo = (batalha.jogador1.id === senderId) ? batalha.jogador1 : batalha.jogador2;
    const jogadorOponente = (batalha.jogador1.id === senderId) ? batalha.jogador2 : batalha.jogador1;

    // Chance de fuga (exemplo: 50%)
    const chanceFuga = DIFICULDADE.PVP_FLEE_CHANCE || 0.5;
    let msgResultado = "";
    let fugaBemSucedida = false;

    if (Math.random() < chanceFuga) {
        fugaBemSucedida = true;
        msgResultado = `💨 *${jogadorFugindo.nome}* conseguiu fugir da batalha! O duelo termina sem vencedor.`;
        // Considerar penalidade no ranking por fugir?
        await finalizarBatalhaPvP(idBatalha, null, null); // Finaliza sem vencedor/perdedor
    } else {
        msgResultado = `🚫 *${jogadorFugindo.nome}* tentou fugir, mas *${jogadorOponente.nome}* impediu! A batalha continua.

É o turno de *${jogadorOponente.nome}*.`;
        // Passa o turno para o oponente
        jogadorFugindo.turno = false;
        jogadorOponente.turno = true;
        batalha.timestamp = Date.now();
    }

    return {
        success: true,
        msgAmbos: msgResultado,
        sender1: batalha.jogador1.id,
        sender2: batalha.jogador2.id,
        batalhaTerminou: fugaBemSucedida
    };
}

// Finaliza a batalha, atualiza dados e limpa estado
async function finalizarBatalhaPvP(idBatalha, vencedorId, perdedorId) {
    if (!BatalhasPvPAtivas[idBatalha]) return; // Já finalizada?

    // Atualiza ranking (se houver vencedor/perdedor)
    if (vencedorId && perdedorId) {
        try {
            await atualizarRankingPvP(vencedorId, perdedorId);
            console.log(`${GERAL.NOME_BOT} Info: Ranking PvP atualizado para batalha ${idBatalha}.`);
        } catch (err) {
            console.error(`${GERAL.NOME_BOT} Erro: Falha ao atualizar ranking PvP para batalha ${idBatalha}:`, err);
        }
        // TODO: Dar recompensas ao vencedor? (Opcional)
    }

    // Limpa a batalha ativa
    delete BatalhasPvPAtivas[idBatalha];
    console.log(`${GERAL.NOME_BOT} Info: Batalha PvP ${idBatalha} finalizada.`);
}

module.exports = {
    desafiarJogador,
    aceitarDesafio,
    recusarDesafio,
    atacarPvP,
    fugirPvP,
    encontrarBatalhaPorJogador // Para verificar status
};

