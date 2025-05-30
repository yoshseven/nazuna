/*
 * Módulo de Trocas Seguras - RPG Nazuna
 * Gerencia o sistema de troca de itens e moeda entre jogadores.
 * 
 * Criado originalmente por: Hiudy
 * Refatorado e expandido por: Manus (IA)
 * 
 * Manter créditos ao criar ou modificar!
 */

const { carregarDadosJogador, salvarDadosJogador, normalizar, formatarMoeda } = require("./utils");
const { GERAL, MOEDA, LIMITES } = require("./config");
const { possuiItem, removerItem, adicionarItem } = require("./inventory");

// Armazena as sessões de troca ativas
// Estrutura: { "id_troca_unica": { sender1: "id1", sender2: "id2", oferta1: { itens: {}, moeda: 0 }, oferta2: { itens: {}, moeda: 0 }, status: "pendente" | "confirmado1" | "confirmado2" | "concluido" | "cancelado", timestamp: Date.now() } }
let sessoesTrocaAtivas = {};

// Limpa sessões de troca antigas ou inativas
function limparSessoesAntigas() {
    const agora = Date.now();
    const limiteTempo = (LIMITES.TRADE_TIMEOUT_MINUTES || 5) * 60 * 1000;
    for (const idTroca in sessoesTrocaAtivas) {
        if (agora - sessoesTrocaAtivas[idTroca].timestamp > limiteTempo) {
            delete sessoesTrocaAtivas[idTroca];
            console.log(`${GERAL.NOME_BOT} Info: Sessão de troca ${idTroca} expirou e foi removida.`);
        }
    }
}
// Limpa periodicamente (ex: a cada 5 minutos)
setInterval(limparSessoesAntigas, 5 * 60 * 1000);

// Encontra uma sessão de troca ativa envolvendo um jogador
function encontrarSessaoPorJogador(senderId) {
    for (const idTroca in sessoesTrocaAtivas) {
        const sessao = sessoesTrocaAtivas[idTroca];
        if ((sessao.sender1 === senderId || sessao.sender2 === senderId) && sessao.status !== "concluido" && sessao.status !== "cancelado") {
            return { idTroca, sessao };
        }
    }
    return null;
}

// Inicia uma nova solicitação de troca
async function iniciarTroca(senderId1, senderId2) {
    // Verifica se algum dos jogadores já está em uma troca
    if (encontrarSessaoPorJogador(senderId1)) {
        return { success: false, msg: "⚠️ Você já está em uma troca ativa. Conclua ou cancele antes de iniciar outra." };
    }
    if (encontrarSessaoPorJogador(senderId2)) {
        return { success: false, msg: "⚠️ O jogador que você convidou já está em outra troca." };
    }

    const [dados1, dados2] = await Promise.all([carregarDadosJogador(senderId1), carregarDadosJogador(senderId2)]);
    if (!dados1) return { success: false, msg: `❓ ${GERAL.NOME_BOT} não te reconhece... Registre-se primeiro!` };
    if (!dados2) return { success: false, msg: `❓ Jogador alvo não encontrado ou não registrado no RPG.` };

    const idTroca = `trade_${senderId1}_${senderId2}_${Date.now()}`;
    sessoesTrocaAtivas[idTroca] = {
        sender1: senderId1,
        sender2: senderId2,
        nome1: dados1.nome || "Jogador 1",
        nome2: dados2.nome || "Jogador 2",
        oferta1: { itens: {}, moeda: 0 }, // { "nome_item": quantidade }
        oferta2: { itens: {}, moeda: 0 },
        status: "pendente", // Esperando aceitação do sender2
        timestamp: Date.now()
    };

    // Notifica o sender2
    const msgConvite = `🤝 *${dados1.nome || senderId1}* convidou você para uma troca!
Use ${GERAL.PREFIXO_BOT}troca aceitar para iniciar ou ${GERAL.PREFIXO_BOT}troca recusar.`;
    
    // A notificação real deve ser feita pelo handler principal do bot
    // Aqui retornamos a mensagem para o sender1 e a mensagem para o sender2
    return {
        success: true,
        msgSender1: `✅ Convite de troca enviado para *${dados2.nome || senderId2}*. Aguardando aceitação...`,
        msgSender2: msgConvite,
        idTroca: idTroca // Para referência futura, se necessário
    };
}

// Aceita um convite de troca pendente
async function aceitarTroca(senderId2) {
    const sessaoInfo = encontrarSessaoPorJogador(senderId2);
    if (!sessaoInfo || sessaoInfo.sessao.sender2 !== senderId2 || sessaoInfo.sessao.status !== "pendente") {
        return { success: false, msg: "⚠️ Você não tem nenhum convite de troca pendente para aceitar." };
    }

    const { idTroca, sessao } = sessaoInfo;
    sessao.status = "ativa"; // Troca iniciada
    sessao.timestamp = Date.now(); // Atualiza timestamp

    const msgConfirmacao = `✅ Troca com *${sessao.nome1}* iniciada!
Use os comandos:
  - ${GERAL.PREFIXO_BOT}troca additem [nome_item] [quantidade]
  - ${GERAL.PREFIXO_BOT}troca addmoeda [valor]
  - ${GERAL.PREFIXO_BOT}troca ver
  - ${GERAL.PREFIXO_BOT}troca confirmar
  - ${GERAL.PREFIXO_BOT}troca cancelar`;

    return {
        success: true,
        msgAmbos: msgConfirmacao, // Mensagem para ambos os jogadores
        sender1: sessao.sender1,
        sender2: sessao.sender2
    };
}

// Recusa um convite de troca pendente
async function recusarTroca(senderId2) {
    const sessaoInfo = encontrarSessaoPorJogador(senderId2);
    if (!sessaoInfo || sessaoInfo.sessao.sender2 !== senderId2 || sessaoInfo.sessao.status !== "pendente") {
        return { success: false, msg: "⚠️ Você não tem nenhum convite de troca pendente para recusar." };
    }

    const { idTroca, sessao } = sessaoInfo;
    delete sessoesTrocaAtivas[idTroca]; // Remove a sessão

    const nomeRecusou = (await carregarDadosJogador(senderId2))?.nome || senderId2;

    return {
        success: true,
        msgSender1: `❌ *${nomeRecusou}* recusou seu convite de troca.`,
        msgSender2: `❌ Você recusou o convite de troca de *${sessao.nome1}*.`,
        sender1: sessao.sender1,
        sender2: sessao.sender2
    };
}

// Adiciona um item à oferta na troca ativa
async function adicionarItemTroca(senderId, nomeItem, quantidade) {
    const sessaoInfo = encontrarSessaoPorJogador(senderId);
    if (!sessaoInfo || sessaoInfo.sessao.status !== "ativa") {
        return { success: false, msg: "⚠️ Você não está em uma troca ativa para adicionar itens." };
    }

    const { idTroca, sessao } = sessaoInfo;
    const itemNorm = normalizar(nomeItem);
    const qtd = parseInt(quantidade);

    if (isNaN(qtd) || qtd <= 0) {
        return { success: false, msg: "⚠️ Quantidade inválida. Deve ser um número positivo." };
    }

    const dadosJogador = await carregarDadosJogador(senderId);
    if (!dadosJogador) return { success: false, msg: `❓ ${GERAL.NOME_BOT} não te reconhece...` };

    if (!possuiItem(dadosJogador, itemNorm, qtd)) {
        return { success: false, msg: `🎒 Você não tem ${qtd}x ${nomeItem} para oferecer.` };
    }

    const oferta = (sessao.sender1 === senderId) ? sessao.oferta1 : sessao.oferta2;
    oferta.itens[itemNorm] = (oferta.itens[itemNorm] || 0) + qtd;

    // Reseta confirmações se a oferta mudar
    sessao.status = "ativa"; 
    sessao.timestamp = Date.now();

    const nomeExibicaoItem = ITENS_LOJA.find(i => normalizar(i.nome) === itemNorm)?.nomeExibicao || nomeItem;
    const msgConfirmacao = `➕ *${dadosJogador.nome}* adicionou ${qtd}x ${nomeExibicaoItem} à oferta.`;

    return {
        success: true,
        msgAmbos: msgConfirmacao + `\n${await formatarVisaoTroca(sessao)}`,
        sender1: sessao.sender1,
        sender2: sessao.sender2
    };
}

// Adiciona moeda à oferta na troca ativa
async function adicionarMoedaTroca(senderId, valor) {
    const sessaoInfo = encontrarSessaoPorJogador(senderId);
    if (!sessaoInfo || sessaoInfo.sessao.status !== "ativa") {
        return { success: false, msg: "⚠️ Você não está em uma troca ativa para adicionar moeda." };
    }

    const { idTroca, sessao } = sessaoInfo;
    const val = parseInt(valor);

    if (isNaN(val) || val <= 0) {
        return { success: false, msg: "⚠️ Valor inválido. Deve ser um número positivo." };
    }
    if (!MOEDA.PERMITE_DECIMAIS && !Number.isInteger(val)) {
         return { success: false, msg: `⚠️ ${MOEDA.NOME} não permite centavos nesta economia.` };
    }

    const dadosJogador = await carregarDadosJogador(senderId);
    if (!dadosJogador) return { success: false, msg: `❓ ${GERAL.NOME_BOT} não te reconhece...` };

    if (dadosJogador.dinheiro < val) {
        return { success: false, msg: `💸 Você não tem ${formatarMoeda(val)} para oferecer.` };
    }

    const oferta = (sessao.sender1 === senderId) ? sessao.oferta1 : sessao.oferta2;
    oferta.moeda = (oferta.moeda || 0) + val;

    // Reseta confirmações se a oferta mudar
    sessao.status = "ativa";
    sessao.timestamp = Date.now();

    const msgConfirmacao = `💰 *${dadosJogador.nome}* adicionou ${formatarMoeda(val)} à oferta.`;

    return {
        success: true,
        msgAmbos: msgConfirmacao + `\n${await formatarVisaoTroca(sessao)}`,
        sender1: sessao.sender1,
        sender2: sessao.sender2
    };
}

// Formata a visão atual da troca para exibição
async function formatarVisaoTroca(sessao) {
    let visao = `
--- 🔄 Visão da Troca ---`;

    const formatarOferta = (nome, oferta) => {
        let txt = `
*Oferta de ${nome}:*
`;
        let temItem = false;
        for (const itemNorm in oferta.itens) {
            const qtd = oferta.itens[itemNorm];
            const nomeExibicaoItem = ITENS_LOJA.find(i => normalizar(i.nome) === itemNorm)?.nomeExibicao || itemNorm;
            txt += `  - ${qtd}x ${nomeExibicaoItem}\n`;
            temItem = true;
        }
        if (!temItem) txt += `  (Nenhum item)\n`;
        txt += `  - Moeda: ${formatarMoeda(oferta.moeda)}
`;
        return txt;
    };

    visao += formatarOferta(sessao.nome1, sessao.oferta1);
    visao += formatarOferta(sessao.nome2, sessao.oferta2);

    // Status da confirmação
    if (sessao.status === "ativa") visao += `
Status: Aguardando confirmação de ambos...`;
    else if (sessao.status === "confirmado1") visao += `
Status: ${sessao.nome1} confirmou. Aguardando ${sessao.nome2}...`;
    else if (sessao.status === "confirmado2") visao += `
Status: ${sessao.nome2} confirmou. Aguardando ${sessao.nome1}...`;

    visao += `
Use ${GERAL.PREFIXO_BOT}troca confirmar para aceitar ou ${GERAL.PREFIXO_BOT}troca cancelar.`;
    return visao;
}

// Mostra a visão atual da troca para o jogador
async function verTroca(senderId) {
    const sessaoInfo = encontrarSessaoPorJogador(senderId);
    if (!sessaoInfo || (sessaoInfo.sessao.status !== "ativa" && sessaoInfo.sessao.status !== "confirmado1" && sessaoInfo.sessao.status !== "confirmado2")) {
        return { success: false, msg: "⚠️ Você não está em uma troca ativa para visualizar." };
    }
    return { success: true, msg: await formatarVisaoTroca(sessaoInfo.sessao) };
}

// Confirma a oferta atual da troca
async function confirmarTroca(senderId) {
    const sessaoInfo = encontrarSessaoPorJogador(senderId);
    if (!sessaoInfo || (sessaoInfo.sessao.status !== "ativa" && sessaoInfo.sessao.status !== "confirmado1" && sessaoInfo.sessao.status !== "confirmado2")) {
        return { success: false, msg: "⚠️ Você não está em uma troca ativa para confirmar." };
    }

    const { idTroca, sessao } = sessaoInfo;
    const nomeConfirmou = (await carregarDadosJogador(senderId))?.nome || senderId;
    let msgAmbos = `✅ *${nomeConfirmou}* confirmou a oferta atual.`;
    let executarTroca = false;

    if (sessao.sender1 === senderId) {
        if (sessao.status === "confirmado1") return { success: false, msg: "⚠️ Você já confirmou esta oferta." };
        if (sessao.status === "confirmado2") {
            sessao.status = "concluido";
            executarTroca = true;
        } else {
            sessao.status = "confirmado1";
        }
    } else { // sender2
        if (sessao.status === "confirmado2") return { success: false, msg: "⚠️ Você já confirmou esta oferta." };
        if (sessao.status === "confirmado1") {
            sessao.status = "concluido";
            executarTroca = true;
        } else {
            sessao.status = "confirmado2";
        }
    }
    sessao.timestamp = Date.now();

    if (executarTroca) {
        msgAmbos += `\n🤝 Ambos confirmaram! Executando a troca...`;
        const resultadoExecucao = await executarTrocaFinal(sessao);
        if (resultadoExecucao.success) {
            msgAmbos += `\n🎉 Troca concluída com sucesso!`;
            delete sessoesTrocaAtivas[idTroca]; // Remove sessão concluída
        } else {
            msgAmbos += `\n❌ ERRO CRÍTICO: ${resultadoExecucao.msg}. A troca foi cancelada.`;
            sessao.status = "cancelado"; // Marca como cancelada devido a erro
        }
    } else {
         msgAmbos += `\nAguardando confirmação do outro jogador...`;
    }

    return {
        success: true,
        msgAmbos: msgAmbos,
        sender1: sessao.sender1,
        sender2: sessao.sender2
    };
}

// Executa a transferência de itens e moeda após ambos confirmarem
async function executarTrocaFinal(sessao) {
    const [dados1, dados2] = await Promise.all([carregarDadosJogador(sessao.sender1), carregarDadosJogador(sessao.sender2)]);
    if (!dados1 || !dados2) return { success: false, msg: "Falha ao carregar dados de um dos jogadores." };

    // 1. Verificar se ambos ainda possuem os itens/moeda ofertados
    // Verificar oferta 1 (sender1)
    for (const itemNorm in sessao.oferta1.itens) {
        if (!possuiItem(dados1, itemNorm, sessao.oferta1.itens[itemNorm])) {
            return { success: false, msg: `${sessao.nome1} não possui mais os itens ofertados.` };
        }
    }
    if (dados1.dinheiro < sessao.oferta1.moeda) {
        return { success: false, msg: `${sessao.nome1} não possui mais a moeda ofertada.` };
    }
    // Verificar oferta 2 (sender2)
    for (const itemNorm in sessao.oferta2.itens) {
        if (!possuiItem(dados2, itemNorm, sessao.oferta2.itens[itemNorm])) {
            return { success: false, msg: `${sessao.nome2} não possui mais os itens ofertados.` };
        }
    }
    if (dados2.dinheiro < sessao.oferta2.moeda) {
        return { success: false, msg: `${sessao.nome2} não possui mais a moeda ofertada.` };
    }

    // 2. Executar as transferências
    try {
        // Transferir de 1 para 2
        dados1.dinheiro -= sessao.oferta1.moeda;
        dados2.dinheiro += sessao.oferta1.moeda;
        for (const itemNorm in sessao.oferta1.itens) {
            const qtd = sessao.oferta1.itens[itemNorm];
            removerItem(dados1, itemNorm, qtd); // Assume que a verificação já garantiu sucesso
            adicionarItem(dados2, itemNorm, qtd);
        }

        // Transferir de 2 para 1
        dados2.dinheiro -= sessao.oferta2.moeda;
        dados1.dinheiro += sessao.oferta2.moeda;
        for (const itemNorm in sessao.oferta2.itens) {
            const qtd = sessao.oferta2.itens[itemNorm];
            removerItem(dados2, itemNorm, qtd);
            adicionarItem(dados1, itemNorm, qtd);
        }

        // 3. Salvar os dados atualizados
        await Promise.all([salvarDadosJogador(sessao.sender1, dados1), salvarDadosJogador(sessao.sender2, dados2)]);
        return { success: true };

    } catch (err) {
        console.error(`${GERAL.NOME_BOT} Erro CRÍTICO ao executar troca ${sessao.idTroca}:`, err);
        // TODO: Implementar rollback ou notificar admins?
        return { success: false, msg: "Erro interno durante a transferência. A troca foi cancelada." };
    }
}

// Cancela a troca ativa
async function cancelarTroca(senderId) {
    const sessaoInfo = encontrarSessaoPorJogador(senderId);
    if (!sessaoInfo) {
        return { success: false, msg: "⚠️ Você não está em nenhuma troca ativa para cancelar." };
    }

    const { idTroca, sessao } = sessaoInfo;
    const nomeCancelou = (await carregarDadosJogador(senderId))?.nome || senderId;
    
    // Remove a sessão ativa
    delete sessoesTrocaAtivas[idTroca];

    const msgCancelamento = `❌ A troca entre *${sessao.nome1}* e *${sessao.nome2}* foi cancelada por *${nomeCancelou}*.`;

    return {
        success: true,
        msgAmbos: msgCancelamento,
        sender1: sessao.sender1,
        sender2: sessao.sender2
    };
}

module.exports = {
    iniciarTroca,
    aceitarTroca,
    recusarTroca,
    adicionarItemTroca,
    adicionarMoedaTroca,
    verTroca,
    confirmarTroca,
    cancelarTroca
};

