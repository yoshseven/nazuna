/*
 * Módulo de Habitação (Casas) - RPG Nazuna
 * Permite aos jogadores comprar e gerenciar casas.
 * 
 * Criado originalmente por: Hiudy
 * Refatorado e expandido por: Manus (IA)
 * 
 * Manter créditos ao criar ou modificar!
 */

const fs = require("fs").promises;
const path = require("path");
const { carregarDadosJogador, salvarDadosJogador, normalizar } = require("./utils");
const { adicionarDinheiro, removerDinheiro } = require("./economy");

const HousingDataPath = path.join(__dirname, "..", "data", "housing_data.json");
let HOUSING_DB = [];

// Carrega os dados base das casas do JSON
async function carregarHousingDB() {
    try {
        const data = await fs.readFile(HousingDataPath, "utf-8");
        HOUSING_DB = JSON.parse(data);
        console.log(`Banco de dados de Habitação carregado com ${HOUSING_DB.length} propriedades.`);
    } catch (err) {
        console.error("Erro crítico ao carregar housing_data.json:", err);
        HOUSING_DB = [];
    }
}

carregarHousingDB();

// --- Funções do Sistema de Habitação ---

// Lista as casas disponíveis para compra
async function listarCasas(senderId) {
    if (HOUSING_DB.length === 0) {
        return { msg: "🏘️ Nenhuma propriedade disponível no mercado imobiliário no momento." };
    }

    let texto = "🏡 *Propriedades à Venda:*\n------------------------------------\n";
    HOUSING_DB.forEach(casa => {
        texto += `*${casa.nome}* (ID: ${casa.id})\n`;
        texto += `  📍 Local: ${casa.localizacao}\n`;
        texto += `  💬 ${casa.descricao}\n`;
        texto += `  💰 Custo: ${casa.custo} moedas\n`;
        if (casa.bonus && casa.bonus.length > 0) {
            texto += `  ✨ Bônus: ${casa.bonus.map(b => `${b.tipo.replace(/_/g, " ")} (+${b.valor}${b.tipo.includes("bonus") ? "%" : ""})`).join(", ")}\n`;
        }
        texto += `------------------------------------\n`;
    });
    texto += `Use .casa comprar <id_casa> para adquirir uma propriedade.`;
    return { msg: texto };
}

// Compra uma casa
async function comprarCasa(senderId, casaId) {
    let dadosJogador = await carregarDadosJogador(senderId);
    if (!dadosJogador) return { msg: "⚠️ Lenda não encontrada!" };

    if (dadosJogador.casa) {
        const casaAtual = HOUSING_DB.find(c => c.id === dadosJogador.casa);
        return { msg: `🏡 Você já possui uma propriedade: ${casaAtual?.nome || "Casa Desconhecida"}. Venda-a primeiro se desejar outra.` };
        // Ou permitir múltiplas casas?
    }

    const casaParaComprar = HOUSING_DB.find(c => normalizar(c.id) === normalizar(casaId) || normalizar(c.nome) === normalizar(casaId));
    if (!casaParaComprar) {
        return { msg: `❓ Propriedade "${casaId}" não encontrada no mercado. Use .casa listar.` };
    }

    const custo = casaParaComprar.custo;
    if (dadosJogador.dinheiro < custo) {
        return { msg: `💰 Você precisa de ${custo} moedas para comprar a ${casaParaComprar.nome}. Você tem ${dadosJogador.dinheiro}.` };
    }

    // Remove dinheiro
    const remocao = removerDinheiro(dadosJogador, custo);
    if (!remocao) return { msg: "⚠️ Falha ao cobrar o valor da casa!" };
    dadosJogador = remocao;

    // Adiciona casa ao jogador
    dadosJogador.casa = casaParaComprar.id;
    dadosJogador.decoracoes_casa = {}; // Inicializa espaço para decorações

    // TODO: Aplicar bônus da casa? Ou verificar bônus dinamicamente?
    // É melhor verificar dinamicamente para evitar inconsistências.

    await salvarDadosJogador(senderId, dadosJogador);

    return { msg: `🎉 Parabéns! Você comprou a *${casaParaComprar.nome}* por ${custo} moedas! Use .casa ver para inspecioná-la.` };
}

// Vê a casa do jogador
async function verCasa(senderId) {
    let dadosJogador = await carregarDadosJogador(senderId);
    if (!dadosJogador) return { msg: "⚠️ Lenda não encontrada!" };

    if (!dadosJogador.casa) {
        return { msg: "💔 Você ainda não possui uma casa. Use .casa listar para ver as opções." };
    }

    const casaAtual = HOUSING_DB.find(c => c.id === dadosJogador.casa);
    if (!casaAtual) {
        // Corrigir dados do jogador se a casa não existir mais
        dadosJogador.casa = null;
        await salvarDadosJogador(senderId, dadosJogador);
        return { msg: "❓ Sua casa não foi encontrada nos registros atuais. Seu status foi corrigido." };
    }

    let texto = `🔑 *Sua Propriedade: ${casaAtual.nome}* 🔑\n`;
    texto += `------------------------------------\n`;
    texto += `📍 Local: ${casaAtual.localizacao}\n`;
    texto += `💬 Descrição: ${casaAtual.descricao}\n`;
    if (casaAtual.bonus && casaAtual.bonus.length > 0) {
        texto += `✨ Bônus Ativos:
`;
        casaAtual.bonus.forEach(b => {
            texto += `   - ${b.tipo.replace(/_/g, " ")} (+${b.valor}${b.tipo.includes("bonus") ? "%" : ""})
`;
        });
    }
    texto += `🛋️ Decoração: ${Object.keys(dadosJogador.decoracoes_casa || {}).length}/${casaAtual.slots_decoracao} slots usados.
`;
    texto += `------------------------------------\n`;
    // TODO: Adicionar comandos para decorar
    // texto += `Use .casa decorar <slot> <item_decoracao> para decorar.`;

    return { msg: texto };
}

// TODO: Implementar funções de decoração
// async function decorarCasa(senderId, slot, itemDecoracaoId) { ... }
// async function removerDecoracao(senderId, slot) { ... }
// async function venderCasa(senderId) { ... }

module.exports = {
    listarCasas,
    comprarCasa,
    verCasa,
    // Exportar outras funções
    HOUSING_DB
};

