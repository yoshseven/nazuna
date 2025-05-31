/*
 * Módulo de Relacionamentos - RPG Nazuna (Versão Polida)
 * Gerencia interações, afinidade, namoro e casamento com NPCs.
 * 
 * Criado originalmente por: Hiudy
 * 
 * Manter créditos ao criar ou modificar!
 */

const fs = require("fs").promises;
const path = require("path");
const { carregarDadosJogador, salvarDadosJogador, normalizar, formatarMoeda } = require("./utils");
const { possuiItem, removerItem, adicionarItem } = require("./inventory"); // Para presentes e itens de casamento
const { GERAL, MOEDA, DIFICULDADE, ITENS_LOJA } = require("./config"); // Adicionado ITENS_LOJA

const NpcDataPath = path.join(__dirname, "..", "data", "npc_data.json");
let NPC_DB = [];

// Carrega os dados base dos NPCs do JSON
async function carregarNpcDB() {
    try {
        const data = await fs.readFile(NpcDataPath, "utf-8");
        NPC_DB = JSON.parse(data);
        console.log(`${GERAL.NOME_BOT} Info: Banco de dados de NPCs carregado (${NPC_DB.length} personagens).`);
    } catch (err) {
        console.error(`${GERAL.NOME_BOT} Erro: Falha crítica ao carregar ${NpcDataPath}:`, err);
        NPC_DB = [];
    }
}

carregarNpcDB();

// --- Funções de Gestão de Dados de Relacionamento ---

// Obtém os dados de relacionamento de um jogador (cria se não existir)
function obterDadosRelacionamento(dadosJogador) {
    if (!dadosJogador.relacionamentos) {
        dadosJogador.relacionamentos = {}; // Inicializa como objeto vazio
    }
    // Garante que a estrutura para cônjuge exista
    if (typeof dadosJogador.relacionamentos.conjuge === 'undefined') {
        dadosJogador.relacionamentos.conjuge = null; // ID do NPC casado
    }
    return dadosJogador.relacionamentos;
}

// Obtém os dados de um NPC específico para o jogador
function obterDadosNpcJogador(dadosRelacionamento, npcId) {
    const npcIdNormalizado = normalizar(npcId);
    if (!dadosRelacionamento[npcIdNormalizado]) {
        dadosRelacionamento[npcIdNormalizado] = {
            afinidade: 0,
            status: "neutro", // neutro, amigavel, namorando, casado
            presentes_recebidos_hoje: 0, // Resetar diariamente?
            conversas_hoje: 0, // Resetar diariamente?
            data_casamento: null
        };
    }
    return dadosRelacionamento[npcIdNormalizado];
}

// --- Lógica do Sistema de Relacionamentos ---

// Encontra um NPC pelo nome ou ID
function encontrarNPC(nomeOuId) {
    const nomeNormalizado = normalizar(nomeOuId);
    return NPC_DB.find(npc => normalizar(npc.id) === nomeNormalizado || normalizar(npc.nome) === nomeNormalizado);
}

// Conversa com um NPC
async function conversarComNpc(senderId, nomeNpc) {
    let dadosJogador = await carregarDadosJogador(senderId);
    if (!dadosJogador) return { msg: `❓ ${GERAL.NOME_BOT} não te reconhece... Registre-se primeiro!` };

    const npc = encontrarNPC(nomeNpc);
    if (!npc) return { msg: `❓ Não encontrei ninguém chamado "${nomeNpc}" por aqui.` };

    const dadosRelacionamento = obterDadosRelacionamento(dadosJogador);
    const dadosNpcJogador = obterDadosNpcJogador(dadosRelacionamento, npc.id);

    // Limitar conversas diárias? (Exemplo)
    // const hoje = new Date().toDateString();
    // if (dadosNpcJogador.ultimo_dia_conversa !== hoje) {
    //     dadosNpcJogador.conversas_hoje = 0;
    //     dadosNpcJogador.ultimo_dia_conversa = hoje;
    // }
    // if (dadosNpcJogador.conversas_hoje >= DIFICULDADE.MAX_CONVERSAS_NPC_DIA) {
    //     return { msg: `💬 ${npc.nome} parece ocupado(a) agora. Tente conversar novamente amanhã.` };
    // }
    // dadosNpcJogador.conversas_hoje++;

    let nivelDialogo = "neutro";
    if (dadosNpcJogador.status === "casado") {
        nivelDialogo = "casado";
    } else if (dadosNpcJogador.status === "namorando") {
        nivelDialogo = "romantico";
    } else if (dadosNpcJogador.afinidade >= (npc.condicao_namoro?.afinidade_minima || 200) / 2) { // Ex: Amigável na metade do caminho pro namoro
        nivelDialogo = "amigavel";
    }

    const dialogosDisponiveis = npc.dialogos?.[nivelDialogo] || npc.dialogos?.neutro || ["..." (silêncio)];
    let dialogo = dialogosDisponiveis[Math.floor(Math.random() * dialogosDisponiveis.length)];

    // Substitui placeholder pelo nome do jogador
    dialogo = dialogo.replace(/\{nome_jogador\}/g, dadosJogador.nome || "Aventureiro");

    // Pequeno aumento de afinidade por conversar
    dadosNpcJogador.afinidade += DIFICULDADE.AFINIDADE_GANHO_CONVERSA || 1;
    
    // Atualiza status se necessário (ex: neutro -> amigavel)
    atualizarStatusRelacionamento(dadosNpcJogador, npc); // Passa NPC para verificar condições

    await salvarDadosJogador(senderId, dadosJogador);

    return { msg: `*${npc.nome}:* "${dialogo}"` };
}

// Presenteia um NPC
async function presentearNpc(senderId, nomeNpc, nomeItem, quantidade = 1) {
    let dadosJogador = await carregarDadosJogador(senderId);
    if (!dadosJogador) return { msg: `❓ ${GERAL.NOME_BOT} não te reconhece... Registre-se primeiro!` };

    const npc = encontrarNPC(nomeNpc);
    if (!npc) return { msg: `❓ Não encontrei ninguém chamado "${nomeNpc}" por aqui.` };

    const itemNormalizado = normalizar(nomeItem);
    const qtd = parseInt(quantidade);
    if (isNaN(qtd) || qtd <= 0) {
        return { msg: "⚠️ Quantidade inválida. Deve ser um número positivo." };
    }
    
    if (!possuiItem(dadosJogador, itemNormalizado, qtd)) {
        return { msg: `🎒 Você não tem ${qtd}x ${nomeItem} para presentear!` };
    }

    const dadosRelacionamento = obterDadosRelacionamento(dadosJogador);
    const dadosNpcJogador = obterDadosNpcJogador(dadosRelacionamento, npc.id);

    // Limitar presentes diários? (Exemplo)
    // const hoje = new Date().toDateString();
    // if (dadosNpcJogador.ultimo_dia_presente !== hoje) {
    //     dadosNpcJogador.presentes_recebidos_hoje = 0;
    //     dadosNpcJogador.ultimo_dia_presente = hoje;
    // }
    // if (dadosNpcJogador.presentes_recebidos_hoje >= DIFICULDADE.MAX_PRESENTES_NPC_DIA) {
    //     return { msg: `🎁 ${npc.nome} já recebeu presentes suficientes hoje. Tente novamente amanhã.` };
    // }

    const remocao = removerItem(dadosJogador, itemNormalizado, qtd);
    if (!remocao) return { msg: `⚙️ ${GERAL.NOME_BOT} Erro: Falha ao usar o item do inventário!` };
    dadosJogador = remocao;
    // dadosNpcJogador.presentes_recebidos_hoje++;

    let ganhoAfinidade = 0;
    let reacao = "";
    const itemInfo = ITENS_LOJA.find(i => normalizar(i.nome) === itemNormalizado);
    const nomeExibicaoItem = itemInfo?.nomeExibicao || nomeItem;

    const presentesFavoritos = npc.presentes_favoritos?.map(p => normalizar(p)) || [];
    const presentesOdiados = npc.presentes_odiados?.map(p => normalizar(p)) || [];

    if (presentesFavoritos.includes(itemNormalizado)) {
        ganhoAfinidade = (DIFICULDADE.AFINIDADE_GANHO_PRESENTE_FAVORITO || 50) * qtd;
        reacao = npc.reacoes_presente?.favorito || `Uau! Adorei, {nome_jogador}! Muito obrigado(a)! ❤️`;
    } else if (presentesOdiados.includes(itemNormalizado)) {
        ganhoAfinidade = (DIFICULDADE.AFINIDADE_PERDA_PRESENTE_ODIADO || -25) * qtd;
        reacao = npc.reacoes_presente?.odiado || `Hã... Obrigado(a), eu acho... 😒`;
    } else {
        ganhoAfinidade = (DIFICULDADE.AFINIDADE_GANHO_PRESENTE_COMUM || 10) * qtd;
        reacao = npc.reacoes_presente?.comum || `Oh, um presente para mim? Que gentil, {nome_jogador}! 😊`;
    }

    dadosNpcJogador.afinidade += ganhoAfinidade;
    // Garante que a afinidade não fique negativa (ou define um limite mínimo)
    dadosNpcJogador.afinidade = Math.max(0, dadosNpcJogador.afinidade);
    
    // Atualiza status se necessário
    atualizarStatusRelacionamento(dadosNpcJogador, npc);

    await salvarDadosJogador(senderId, dadosJogador);

    reacao = reacao.replace(/\{nome_jogador\}/g, dadosJogador.nome || "Aventureiro");
    return { msg: `🎁 Você deu ${qtd}x ${nomeExibicaoItem} para ${npc.nome}.
*${npc.nome}:* "${reacao}" (Afinidade: ${ganhoAfinidade >= 0 ? "+" : ""}${ganhoAfinidade})` };
}

// Verifica e atualiza o status do relacionamento baseado na afinidade
function atualizarStatusRelacionamento(dadosNpcJogador, npc) {
    // Não rebaixa status automaticamente, apenas progride
    if (dadosNpcJogador.status === "neutro" && npc.condicao_namoro && dadosNpcJogador.afinidade >= (npc.condicao_namoro.afinidade_minima / 2)) {
        dadosNpcJogador.status = "amigavel";
    }
    // Lógica para namoro/casamento será tratada em funções específicas ao tentar iniciar
}

// Verifica a afinidade com um NPC
async function verAfinidade(senderId, nomeNpc) {
    let dadosJogador = await carregarDadosJogador(senderId);
    if (!dadosJogador) return { msg: `❓ ${GERAL.NOME_BOT} não te reconhece... Registre-se primeiro!` };

    const npc = encontrarNPC(nomeNpc);
    if (!npc) return { msg: `❓ Não encontrei ninguém chamado "${nomeNpc}" por aqui.` };

    const dadosRelacionamento = obterDadosRelacionamento(dadosJogador);
    const dadosNpcJogador = obterDadosNpcJogador(dadosRelacionamento, npc.id);

    let nivelRelacionamento = "";
    let emoji = "😐";
    if (dadosNpcJogador.status === "casado") { nivelRelacionamento = "Casados"; emoji = "💍"; }
    else if (dadosNpcJogador.status === "namorando") { nivelRelacionamento = "Namorando"; emoji = "💖"; }
    else if (dadosNpcJogador.status === "amigavel") { nivelRelacionamento = "Amigável"; emoji = "😊"; }
    else { nivelRelacionamento = "Neutro"; emoji = "😐"; }

    return { msg: `📊 *Relacionamento com ${npc.nome}:*
   ${emoji} Status: ${nivelRelacionamento}
   ❤️ Afinidade: ${dadosNpcJogador.afinidade}` };
}

// Tenta iniciar namoro com um NPC
async function iniciarNamoro(senderId, nomeNpc) {
    let dadosJogador = await carregarDadosJogador(senderId);
    if (!dadosJogador) return { msg: `❓ ${GERAL.NOME_BOT} não te reconhece... Registre-se primeiro!` };

    const npc = encontrarNPC(nomeNpc);
    if (!npc) return { msg: `❓ Não encontrei ninguém chamado "${nomeNpc}" por aqui.` };
    if (!npc.condicao_namoro) return { msg: `💔 ${npc.nome} não parece aberto(a) a relacionamentos românticos no momento.` };

    const dadosRelacionamento = obterDadosRelacionamento(dadosJogador);
    const dadosNpcJogador = obterDadosNpcJogador(dadosRelacionamento, npc.id);

    // Verifica se o jogador já está em um relacionamento sério
    if (dadosRelacionamento.conjuge) {
        const conjugeAtual = encontrarNPC(dadosRelacionamento.conjuge);
        return { msg: `🚫 Você já está casado(a) com ${conjugeAtual?.nome || "alguém"}! Termine seu relacionamento atual primeiro.` };
    }
    for (const npcId in dadosRelacionamento) {
        if (npcId !== "conjuge" && dadosRelacionamento[npcId].status === "namorando" && npcId !== normalizar(npc.id)) {
             const namoradoAtual = encontrarNPC(npcId);
             return { msg: `🚫 Você já está namorando ${namoradoAtual?.nome || "alguém"}! Termine seu relacionamento atual primeiro.` };
        }
    }

    if (dadosNpcJogador.status === "namorando" || dadosNpcJogador.status === "casado") {
        return { msg: `💖 Você já tem um relacionamento sério com ${npc.nome}!` };
    }

    const cond = npc.condicao_namoro;
    if (dadosNpcJogador.afinidade < cond.afinidade_minima) {
        return { msg: `📉 Sua afinidade com ${npc.nome} ainda precisa crescer um pouco mais para um passo tão importante! (${dadosNpcJogador.afinidade}/${cond.afinidade_minima}). Continue interagindo!` };
    }

    // Verificar outras condições (missão, tarefa)
    if (cond.missao_requerida) {
        const missaoRequerida = cond.missao_requerida;
        const missoesAtivas = dadosJogador.missoes?.ativas || {};
        if (!missoesAtivas[missaoRequerida]) {
            return { msg: `❓ ${npc.nome} mencionou que você precisa completar a missão "${missaoRequerida}" antes de poderem se aproximar mais.` };
        }
    }

    dadosNpcJogador.status = "namorando";
    await salvarDadosJogador(senderId, dadosJogador);

    const reacaoNamoro = npc.reacoes_relacionamento?.aceitar_namoro || `Sim, {nome_jogador}! Eu adoraria namorar com você! ❤️`;
    return { msg: `*${npc.nome}:* "${reacaoNamoro.replace(/\{nome_jogador\}/g, dadosJogador.nome || "Aventureiro")}"

💖 Parabéns! Você e ${npc.nome} agora estão namorando! Explore os novos diálogos românticos!` };
}

// Tenta casar com um NPC
async function iniciarCasamento(senderId, nomeNpc) {
    let dadosJogador = await carregarDadosJogador(senderId);
    if (!dadosJogador) return { msg: `❓ ${GERAL.NOME_BOT} não te reconhece... Registre-se primeiro!` };

    const npc = encontrarNPC(nomeNpc);
    if (!npc) return { msg: `❓ Não encontrei ninguém chamado "${nomeNpc}" por aqui.` };
    if (!npc.condicao_casamento) return { msg: `💔 ${npc.nome} não parece pronto(a) para um compromisso tão sério como casamento.` };

    const dadosRelacionamento = obterDadosRelacionamento(dadosJogador);
    const dadosNpcJogador = obterDadosNpcJogador(dadosRelacionamento, npc.id);

    // Verifica se o jogador já está casado
    if (dadosRelacionamento.conjuge) {
        const conjugeAtual = encontrarNPC(dadosRelacionamento.conjuge);
         return { msg: `🚫 Você já está casado(a) com ${conjugeAtual?.nome || "alguém"}!` };
    }

    if (dadosNpcJogador.status === "casado") {
        return { msg: `💍 Você já é casado(a) com ${npc.nome}!` };
    }

    if (dadosNpcJogador.status !== "namorando") {
        return { msg: `❓ Você precisa estar namorando ${npc.nome} antes de fazer a grande proposta!` };
    }

    const cond = npc.condicao_casamento;
    if (dadosNpcJogador.afinidade < cond.afinidade_minima) {
        return { msg: `📉 Sua afinidade com ${npc.nome} precisa ser ainda mais forte para um laço eterno! (${dadosNpcJogador.afinidade}/${cond.afinidade_minima}).` };
    }

    // Verifica item requerido (ex: anel)
    if (cond.item_requerido) {
        const itemInfo = ITENS_LOJA.find(i => normalizar(i.nome) === normalizar(cond.item_requerido));
        const nomeItemExibicao = itemInfo?.nomeExibicao || cond.item_requerido;
        if (!possuiItem(dadosJogador, cond.item_requerido)) {
            return { msg: `💍 Você precisa de um(a) "${nomeItemExibicao}" para fazer a proposta! Adquira um(a) e tente novamente.` };
        }
        // Consome o item ao propor
        const remocao = removerItem(dadosJogador, cond.item_requerido, 1);
        if (!remocao) return { msg: `⚙️ ${GERAL.NOME_BOT} Erro: Falha ao usar o item de casamento do inventário!` };
        dadosJogador = remocao;
    }

    // Define o status como casado para o NPC
    dadosNpcJogador.status = "casado";
    dadosNpcJogador.data_casamento = Date.now();
    // Define o cônjuge nos dados gerais de relacionamento do jogador
    dadosRelacionamento.conjuge = normalizar(npc.id);
    
    await salvarDadosJogador(senderId, dadosJogador);

    // Adicionar bônus de casamento (se houver)
    // Exemplo: bônus de XP e acesso a loja especial
    if (!dadosJogador.bonus) dadosJogador.bonus = {};
    dadosJogador.bonus.xp = (dadosJogador.bonus.xp || 0) + 10; // +10 XP bônus
    dadosJogador.bonus.acessoLojaEspecial = true;

    await salvarDadosJogador(senderId, dadosJogador);

    const reacaoCasamento = npc.reacoes_relacionamento?.aceitar_casamento || `SIM! Mil vezes sim, {nome_jogador}! Quero passar o resto da minha vida com você! 😭💍`;
    return { msg: `*${npc.nome}:* "${reacaoCasamento.replace(/\{nome_jogador\}/g, dadosJogador.nome || "Aventureiro")}"

🎉🔔 OS SINOS ESTÃO TOCANDO! 🔔🎉
Parabéns! Você e ${npc.nome} agora estão oficialmente casados! Que a felicidade e as aventuras compartilhadas durem para sempre!` };
}

// Termina um relacionamento (namoro ou casamento)
async function terminarRelacionamento(senderId, nomeNpc) {
    let dadosJogador = await carregarDadosJogador(senderId);
    if (!dadosJogador) return { msg: `❓ ${GERAL.NOME_BOT} não te reconhece... Registre-se primeiro!` };

    const npc = encontrarNPC(nomeNpc);
    if (!npc) return { msg: `❓ Não encontrei ninguém chamado "${nomeNpc}" por aqui.` };

    const dadosRelacionamento = obterDadosRelacionamento(dadosJogador);
    const dadosNpcJogador = obterDadosNpcJogador(dadosRelacionamento, npc.id);
    const npcIdNormalizado = normalizar(npc.id);

    if (dadosNpcJogador.status !== "namorando" && dadosNpcJogador.status !== "casado") {
        return { msg: `💔 Você não tem um relacionamento sério com ${npc.nome} para terminar.` };
    }

    const statusAntigo = dadosNpcJogador.status;
    dadosNpcJogador.status = "amigavel"; // Volta para amigável (ou neutro?)
    dadosNpcJogador.afinidade = Math.floor(dadosNpcJogador.afinidade * 0.5); // Reduz afinidade drasticamente
    dadosNpcJogador.afinidade = Math.max(0, dadosNpcJogador.afinidade); // Garante não ser negativo
    dadosNpcJogador.data_casamento = null;

    // Remove o cônjuge se estava casado
    if (statusAntigo === "casado" && dadosRelacionamento.conjuge === npcIdNormalizado) {
        dadosRelacionamento.conjuge = null;
        // Lidar com filhos? (Remover? Ficam com o jogador?)
        if (dadosJogador.filhos && Object.keys(dadosJogador.filhos).length > 0) {
            // Exemplo: remover filhos do relacionamento ou marcar como órfãos
            for (const filhoId in dadosJogador.filhos) {
                const filho = dadosJogador.filhos[filhoId];
                if (filho.pais && filho.pais.includes(npcIdNormalizado)) {
                    // Remove o NPC dos pais do filho
                    filho.pais = filho.pais.filter(p => p !== npcIdNormalizado);
                    // Se não restar nenhum pai, marca como órfão
                    if (filho.pais.length === 0) {
                        filho.orfaos = true;
                    }
                }
            }
        }
    }

    await salvarDadosJogador(senderId, dadosJogador);

    const reacaoTermino = npc.reacoes_relacionamento?.termino || `Entendo... {nome_jogador}. É uma pena. Espero que possamos continuar amigos. 😔`;
    let msgFinal = `*${npc.nome}:* "${reacaoTermino.replace(/\{nome_jogador\}/g, dadosJogador.nome || "Aventureiro")}"

`;

    if (statusAntigo === "casado") {
        msgFinal += `💔 O casamento entre você e ${npc.nome} chegou ao fim.`;
    } else {
        msgFinal += `💔 O namoro entre você e ${npc.nome} terminou.`;
    }

    return { msg: msgFinal };
}


module.exports = {
    conversarComNpc,
    presentearNpc,
    verAfinidade,
    iniciarNamoro,
    iniciarCasamento,
    terminarRelacionamento,
    encontrarNPC,
    NPC_DB // Exporta para listar NPCs, etc.
};

