/*
 * Módulo de Interações Sociais - RPG Nazuna
 * Gerencia ações como presentear outros jogadores.
 * 
 * Criado originalmente por: Hiudy
 * Refatorado e expandido por: Manus (IA)
 * 
 * Manter créditos ao criar ou modificar!
 */

const { carregarDadosJogador, salvarDadosJogador, normalizar, formatarMoeda } = require("./utils");
const { GERAL, MOEDA, LIMITES } = require("./config");
const { possuiItem, removerItem, adicionarItem } = require("./inventory");

// Presenteia outro jogador com itens ou moeda
async function presentearJogador(senderId, targetId, tipo, nomeOuValor, quantidade = 1) {
    if (senderId === targetId) {
        return { success: false, msg: "🎁 Você não pode presentear a si mesmo!" };
    }

    const [dadosRemetente, dadosDestinatario] = await Promise.all([carregarDadosJogador(senderId), carregarDadosJogador(targetId)]);

    if (!dadosRemetente) return { success: false, msg: `❓ ${GERAL.NOME_BOT} não te reconhece... Registre-se primeiro!` };
    if (!dadosDestinatario) return { success: false, msg: `❓ Jogador alvo (@${targetId.split('@')[0]}) não encontrado ou não registrado no RPG.` };

    const nomeRemetente = dadosRemetente.nome || senderId.split('@')[0];
    const nomeDestinatario = dadosDestinatario.nome || targetId.split('@')[0];

    if (tipo === "item") {
        const itemNorm = normalizar(nomeOuValor);
        const qtd = parseInt(quantidade);

        if (isNaN(qtd) || qtd <= 0) {
            return { success: false, msg: "⚠️ Quantidade inválida. Deve ser um número positivo." };
        }

        if (!possuiItem(dadosRemetente, itemNorm, qtd)) {
            return { success: false, msg: `🎒 Você não tem ${qtd}x ${nomeOuValor} para presentear.` };
        }

        // Remove do remetente e adiciona ao destinatário
        try {
            removerItem(dadosRemetente, itemNorm, qtd);
            adicionarItem(dadosDestinatario, itemNorm, qtd);

            await Promise.all([salvarDadosJogador(senderId, dadosRemetente), salvarDadosJogador(targetId, dadosDestinatario)]);

            const nomeExibicaoItem = ITENS_LOJA.find(i => normalizar(i.nome) === itemNorm)?.nomeExibicao || nomeOuValor;
            const msgPresente = `🎁 *${nomeRemetente}* presenteou você com ${qtd}x ${nomeExibicaoItem}!`;
            
            return {
                success: true,
                msgSender: `✅ Você presenteou *${nomeDestinatario}* com ${qtd}x ${nomeExibicaoItem}!`,
                msgTarget: msgPresente,
                targetId: targetId
            };

        } catch (err) {
            console.error(`${GERAL.NOME_BOT} Erro ao presentear item de ${senderId} para ${targetId}:`, err);
            return { success: false, msg: `⚙️ ${GERAL.NOME_BOT} Erro: Falha ao transferir o item.` };
        }

    } else if (tipo === "moeda") {
        const valor = parseInt(nomeOuValor);

        if (isNaN(valor) || valor <= 0) {
            return { success: false, msg: "⚠️ Valor inválido. Deve ser um número positivo." };
        }
        if (!MOEDA.PERMITE_DECIMAIS && !Number.isInteger(valor)) {
            return { success: false, msg: `⚠️ ${MOEDA.NOME} não permite centavos nesta economia.` };
        }

        if (dadosRemetente.dinheiro < valor) {
            return { success: false, msg: `💸 Você não tem ${formatarMoeda(valor)} para presentear.` };
        }

        // Transfere a moeda
        try {
            dadosRemetente.dinheiro -= valor;
            dadosDestinatario.dinheiro += valor;

            await Promise.all([salvarDadosJogador(senderId, dadosRemetente), salvarDadosJogador(targetId, dadosDestinatario)]);

            const msgPresente = `💰 *${nomeRemetente}* presenteou você com ${formatarMoeda(valor)}!`;

            return {
                success: true,
                msgSender: `✅ Você presenteou *${nomeDestinatario}* com ${formatarMoeda(valor)}!`,
                msgTarget: msgPresente,
                targetId: targetId
            };

        } catch (err) {
            console.error(`${GERAL.NOME_BOT} Erro ao presentear moeda de ${senderId} para ${targetId}:`, err);
            return { success: false, msg: `⚙️ ${GERAL.NOME_BOT} Erro: Falha ao transferir a moeda.` };
        }

    } else {
        return { success: false, msg: "⚠️ Tipo de presente inválido. Use 'item' ou 'moeda'." };
    }
}

module.exports = {
    presentearJogador
};

