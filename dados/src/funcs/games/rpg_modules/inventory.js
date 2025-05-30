/*
 * Módulo de Inventário - RPG Nazuna
 * Gerencia o inventário dos jogadores.
 * 
 * Criado originalmente por: Hiudy
 * Refatorado e expandido por: Manus (IA)
 * 
 * Manter créditos ao criar ou modificar!
 */

const { ITENS_LOJA, ITENS_VENDA } = require("./config");

// Adiciona um item ao inventário do jogador
function adicionarItem(dadosJogador, nomeItem, quantidade = 1) {
    if (!dadosJogador || !nomeItem || isNaN(quantidade) || quantidade <= 0) {
        console.error("Erro ao adicionar item: Dados inválidos.", { nomeItem, quantidade });
        return dadosJogador; // Retorna os dados originais em caso de erro
    }
    dadosJogador.inv = dadosJogador.inv || {}; // Garante que o inventário exista
    dadosJogador.inv[nomeItem] = (dadosJogador.inv[nomeItem] || 0) + quantidade;
    return dadosJogador;
}

// Remove um item do inventário do jogador
// Retorna os dados atualizados ou null se a remoção falhar (item não existe ou quantidade insuficiente)
function removerItem(dadosJogador, nomeItem, quantidade = 1) {
    if (!dadosJogador || !nomeItem || isNaN(quantidade) || quantidade <= 0) {
        console.error("Erro ao remover item: Dados inválidos.", { nomeItem, quantidade });
        return null; 
    }
    if (!dadosJogador.inv || !dadosJogador.inv[nomeItem] || dadosJogador.inv[nomeItem] < quantidade) {
        //console.warn(`Tentativa de remover item inexistente ou em quantidade insuficiente: ${nomeItem} (Qtd: ${quantidade})`);
        return null; // Falha: Item não existe ou quantidade insuficiente
    }

    dadosJogador.inv[nomeItem] -= quantidade;
    if (dadosJogador.inv[nomeItem] <= 0) {
        delete dadosJogador.inv[nomeItem]; // Remove o item se a quantidade chegar a zero
    }
    return dadosJogador;
}

// Verifica se o jogador possui um item (e opcionalmente uma quantidade mínima)
function possuiItem(dadosJogador, nomeItem, quantidadeMinima = 1) {
    if (!dadosJogador || !dadosJogador.inv || !nomeItem) {
        return false;
    }
    return (dadosJogador.inv[nomeItem] || 0) >= quantidadeMinima;
}

// Formata o inventário para exibição
function formatarInventario(dadosJogador) {
    if (!dadosJogador || !dadosJogador.inv || Object.keys(dadosJogador.inv).length === 0) {
        return "🛒 *Mochila vazia!* Explore o mercado ou aventure-se para encontrar tesouros!";
    }

    let texto = "";
    for (const nomeItem in dadosJogador.inv) {
        const quantidade = dadosJogador.inv[nomeItem];
        if (quantidade > 0) {
            // Procura o nome de exibição primeiro na loja, depois nos itens vendáveis
            const itemInfoLoja = ITENS_LOJA.find(i => i.nome === nomeItem);
            const itemInfoVenda = ITENS_VENDA.find(i => i.nome === nomeItem);
            const nomeExibicao = itemInfoLoja?.nomeExibicao || itemInfoVenda?.nomeExibicao || nomeItem;
            texto += `- *${nomeExibicao}*: ${quantidade}\n`;
        }
    }

    return texto.trim() || "🛒 *Mochila vazia!* Algo estranho aconteceu."; // Fallback caso todos os itens tenham quantidade 0
}

module.exports = {
    adicionarItem,
    removerItem,
    possuiItem,
    formatarInventario
};

