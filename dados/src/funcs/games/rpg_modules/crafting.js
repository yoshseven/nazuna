/*
 * Módulo de Crafting (Criação de Itens) - RPG Nazuna
 * Permite aos jogadores criar itens a partir de materiais.
 * 
 * Criado originalmente por: Hiudy
 * Refatorado e expandido por: Manus (IA)
 * 
 * Manter créditos ao criar ou modificar!
 */

const fs = require("fs").promises;
const path = require("path");
const { carregarDadosJogador, salvarDadosJogador, normalizar } = require("./utils");
const { possuiItem, removerItem, adicionarItem } = require("./inventory");

const CraftingDataPath = path.join(__dirname, "..", "data", "crafting_data.json");
let CRAFTING_DB = [];

// Carrega os dados base das receitas do JSON
async function carregarCraftingDB() {
    try {
        const data = await fs.readFile(CraftingDataPath, "utf-8");
        CRAFTING_DB = JSON.parse(data);
        console.log(`Banco de dados de Crafting carregado com ${CRAFTING_DB.length} receitas.`);
    } catch (err) {
        console.error("Erro crítico ao carregar crafting_data.json:", err);
        CRAFTING_DB = [];
    }
}

carregarCraftingDB();

// --- Funções do Sistema de Crafting ---

// Lista as receitas disponíveis para o jogador (pode filtrar por habilidade/nível no futuro)
async function listarReceitas(senderId, filtro = null) {
    // Por enquanto, lista todas as receitas
    if (CRAFTING_DB.length === 0) {
        return { msg: "🔧 Nenhuma receita de criação disponível no momento." };
    }

    let texto = "📜 *Receitas de Criação Disponíveis:*\n------------------------------------\n";
    CRAFTING_DB.forEach(receita => {
        texto += `*${receita.nome}* (ID: ${receita.id})\n`;
        texto += `  💬 ${receita.descricao}\n`;
        texto += `  🛠️ Materiais: ${receita.materiais.map(m => `${m.quantidade}x ${m.item}`).join(", ")}\n`;
        texto += `  ✨ Resultado: ${receita.resultado.quantidade}x ${receita.resultado.item}\n`;
        // Adicionar nível requerido e habilidade se implementado
        // texto += `  📊 Nível Req.: ${receita.nivel_requerido} (${receita.habilidade || "Geral"})\n`;
        texto += `  ⭐ XP Ganho: ${receita.xp_ganho}\n`;
        texto += `------------------------------------\n`;
    });
    texto += `Use .craft criar <id_receita> [quantidade] para criar um item.`;
    return { msg: texto };
}

// Cria um item com base em uma receita
async function criarItem(senderId, receitaId, quantidadeCriar = 1) {
    let dadosJogador = await carregarDadosJogador(senderId);
    if (!dadosJogador) return { msg: "⚠️ Lenda não encontrada!" };

    const receita = CRAFTING_DB.find(r => normalizar(r.id) === normalizar(receitaId) || normalizar(r.nome) === normalizar(receitaId));
    if (!receita) {
        return { msg: `❓ Receita "${receitaId}" não encontrada. Use .craft listar para ver as receitas.` };
    }

    const quantidade = parseInt(quantidadeCriar);
    if (isNaN(quantidade) || quantidade <= 0) {
        return { msg: "⚠️ Quantidade inválida. Deve ser um número positivo." };
    }

    // TODO: Verificar nível de habilidade requerido se implementado
    // if (receita.habilidade && (!dadosJogador.habilidades || dadosJogador.habilidades[receita.habilidade] < receita.nivel_requerido)) {
    //     return { msg: `⛔ Você precisa de Nível ${receita.nivel_requerido} em ${receita.habilidade} para criar este item.` };
    // }

    // Verifica se tem materiais suficientes
    let temMateriais = true;
    let materiaisFaltando = [];
    for (const material of receita.materiais) {
        const nomeMaterialNormalizado = normalizar(material.item);
        const quantidadeNecessaria = material.quantidade * quantidade;
        if (!possuiItem(dadosJogador, nomeMaterialNormalizado, quantidadeNecessaria)) {
            temMateriais = false;
            materiaisFaltando.push(`${quantidadeNecessaria}x ${material.item}`);
            // Não precisa continuar verificando se já falta um
            // break; 
        }
    }

    if (!temMateriais) {
        return { msg: `❌ Materiais insuficientes! Falta: ${materiaisFaltando.join(", ")}.` };
    }

    // Remove os materiais
    for (const material of receita.materiais) {
        const nomeMaterialNormalizado = normalizar(material.item);
        const quantidadeNecessaria = material.quantidade * quantidade;
        const remocao = removerItem(dadosJogador, nomeMaterialNormalizado, quantidadeNecessaria);
        if (!remocao) {
            // Isso não deveria acontecer se a verificação acima passou, mas é uma segurança
            console.error(`Erro ao remover material ${material.item} para ${senderId} ao criar ${receita.id}`);
            // Tentar devolver materiais já removidos? Complexo.
            return { msg: `❌ Erro crítico ao remover materiais! Criação cancelada.` };
        }
        dadosJogador = remocao;
    }

    // Adiciona o item criado
    const itemCriadoNormalizado = normalizar(receita.resultado.item);
    const quantidadeCriada = receita.resultado.quantidade * quantidade;
    const adicao = adicionarItem(dadosJogador, itemCriadoNormalizado, quantidadeCriada);
    if (!adicao) {
        // Tentar devolver materiais?
        console.error(`Erro ao adicionar item ${receita.resultado.item} para ${senderId} ao criar ${receita.id}`);
        return { msg: `❌ Erro crítico ao adicionar o item criado! Criação cancelada.` };
    }
    dadosJogador = adicao;

    // Adiciona XP de habilidade (se implementado)
    const xpGanhoTotal = receita.xp_ganho * quantidade;
    // TODO: Adicionar XP à habilidade correspondente (receita.habilidade)
    // adicionarXPHabilidade(dadosJogador, receita.habilidade, xpGanhoTotal);

    await salvarDadosJogador(senderId, dadosJogador);

    return { msg: `✅ Criado com sucesso ${quantidadeCriada}x *${receita.resultado.item}*! (+${xpGanhoTotal} XP de Criação)` };
}

module.exports = {
    listarReceitas,
    criarItem,
    CRAFTING_DB
};

