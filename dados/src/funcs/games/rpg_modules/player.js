/*
 * Módulo do Jogador - RPG Nazuna
 * Gerencia dados e status dos jogadores.
 * 
 * Criado originalmente por: Hiudy
 * 
 * Manter créditos ao criar ou modificar!
 */

const path = require("path");
const { salvarDadosJogador, carregarDadosJogador, RpgPath } = require("./utils");
const { VALORES_INICIAIS_JOGADOR, ITENS_LOJA, ITENS_VENDA } = require("./config");
const { verificarPetFugiu } = require("./pets"); // Dependência futura, adicionar tratamento de erro se pets.js não existir ainda
const { formatarInventario } = require("./inventory"); // Dependência futura

// Registra um novo jogador
async function registrarJogador(senderId, nome = "") {
    try {
        const dadosExistentes = await carregarDadosJogador(senderId);
        if (dadosExistentes) {
            return { msg: `🛡️ ${nome || "Herói"}, sua lenda já está escrita neste reino!` };
        }

        const novosDados = {
            id: senderId,
            nome: nome || `Herói_${senderId.substring(0, 4)}`, // Nome padrão se não fornecido
            ...JSON.parse(JSON.stringify(VALORES_INICIAIS_JOGADOR)) // Deep copy dos valores iniciais
        };

        await salvarDadosJogador(senderId, novosDados);
        return { msg: `🌟 *${novosDados.nome}*, sua lenda começa agora! Ganhou R$${VALORES_INICIAIS_JOGADOR.saldo.carteira} para forjar sua saga!` };
    } catch (err) {
        console.error(`Erro ao registrar jogador ${senderId}:`, err);
        return { msg: "⚠️ Falha crítica ao tentar forjar sua lenda! O destino parece incerto." };
    }
}

// Deleta um jogador
async function deletarJogador(senderId) {
    try {
        const caminho = path.join(RpgPath, `${senderId}.json`);
        // Verifica se o ficheiro existe antes de tentar apagar
        if (await require("fs").promises.access(caminho).then(() => true).catch(() => false)) {
            await require("fs").promises.unlink(caminho);
            // TODO: Remover jogador dos rankings e outras estruturas de dados globais
            return { msg: "😢 Sua lenda foi apagada dos anais deste reino. Que os ventos levem suas histórias.", success: true };
        }
        return { msg: "⚠️ Nenhuma lenda com seu nome foi encontrada para ser apagada.", success: false };
    } catch (err) {
        console.error(`Erro ao deletar jogador ${senderId}:`, err);
        return { msg: "⚠️ Uma força sombria impediu que sua lenda fosse apagada!", success: false };
    }
}

// Adiciona saldo (carteira ou banco)
function adicionarSaldo(dadosJogador, valor, banco = false) {
    if (isNaN(valor) || valor === null) return null;
    const tipo = banco ? "banco" : "carteira";
    dadosJogador.saldo[tipo] = (dadosJogador.saldo[tipo] || 0) + valor;
    return dadosJogador;
}

// Remove saldo (carteira ou banco)
function removerSaldo(dadosJogador, valor, banco = false) {
    return adicionarSaldo(dadosJogador, -valor, banco);
}

// Adiciona XP
function adicionarXP(dadosJogador, valor) {
    if (isNaN(valor) || valor <= 0) return dadosJogador;
    dadosJogador.xp = (dadosJogador.xp || 0) + valor;
    // TODO: Implementar sistema de níveis baseado na curva de XP do config.js
    return dadosJogador;
}

// Modifica HP
function modificarHP(dadosJogador, valor) {
    if (isNaN(valor)) return dadosJogador;
    dadosJogador.status.hp = (dadosJogador.status.hp || 0) + valor;
    dadosJogador.status.hp = Math.max(0, Math.min(100, dadosJogador.status.hp)); // Garante que HP fique entre 0 e 100
    return dadosJogador;
}

// Modifica Fadiga
function modificarFadiga(dadosJogador, valor) {
    if (isNaN(valor)) return dadosJogador;
    dadosJogador.status.fadiga = (dadosJogador.status.fadiga || 0) + valor;
    dadosJogador.status.fadiga = Math.max(0, Math.min(100, dadosJogador.status.fadiga)); // Garante que Fadiga fique entre 0 e 100
    return dadosJogador;
}

// Modifica Moral
function modificarMoral(dadosJogador, valor) {
    if (isNaN(valor)) return dadosJogador;
    dadosJogador.status.moral = (dadosJogador.status.moral || 100) + valor;
    dadosJogador.status.moral = Math.max(0, Math.min(100, dadosJogador.status.moral)); // Garante que Moral fique entre 0 e 100
    return dadosJogador;
}

// Obtém o perfil formatado do jogador
async function verPerfil(senderId) {
    try {
        let dados = await carregarDadosJogador(senderId);
        if (!dados) return { msg: "⚠️ Lenda não encontrada! Use `#registrar [nome]` para começar sua jornada." };

        // Verifica se o pet fugiu (dependência de pets.js)
        let petFugiuMsg = null;
        try {
            const resultadoPet = await verificarPetFugiu(dados);
            if (resultadoPet) {
                petFugiuMsg = resultadoPet.msg;
                await salvarDadosJogador(senderId, dados); // Salva o estado atualizado (sem pet)
            }
        } catch (e) { /* Ignora erro se pets.js não existir ainda */ }

        // Formata inventário (dependência de inventory.js)
        let invTexto = "Nenhum item";
        try {
            invTexto = formatarInventario(dados) || "Nenhum item";
        } catch (e) { /* Ignora erro se inventory.js não existir ainda */ }

        const guilda = dados.guilda ? `Faz parte da guilda *${dados.guilda}*` : "Sem guilda";
        const petNome = dados.pet?.nome;
        const petInfo = petNome ? ITENS_LOJA.find(i => i.nome === petNome) : null;
        const pet = petInfo ? `Companheiro: *${petInfo.nomeExibicao || petNome}*` : "Sem companheiro";
        const titulo = dados.titulo ? `\n🏆 Título: *${dados.titulo}*` : "";

        const perfilTexto = `🛡️ *Lenda de ${dados.nome || "Herói"}* 🛡️
---------------------------------
📛 *Nome*: ${dados.nome || "Desconhecido"}${titulo}
💼 *Caminho*: ${dados.emprego || "Andarilho"}
📊 *XP*: ${dados.xp || 0}
🩺 *Vida*: ${dados.status.hp !== undefined ? dados.status.hp : 100}%
😴 *Fadiga*: ${dados.status.fadiga !== undefined ? dados.status.fadiga : 0}%
😊 *Moral*: ${dados.status.moral !== undefined ? dados.status.moral : 100}%

🏦 *Ouro no Banco*: R$${dados.saldo.banco || 0}
💰 *Ouro na Mochila*: R$${dados.saldo.carteira || 0}

🎒 *Mochila*:
${invTexto}

🏰 *Guilda*: ${guilda}
🐾 *Pet*: ${pet}
---------------------------------`;

        // Adiciona a mensagem de pet fugitivo, se houver
        const finalMsg = petFugiuMsg ? `${petFugiuMsg}\n\n${perfilTexto}` : perfilTexto;

        return { msg: finalMsg.trim() };
    } catch (err) {
        console.error(`Erro ao ver perfil ${senderId}:`, err);
        return { msg: "⚠️ Sua lenda está envolta em névoa! Não consigo ver seus detalhes." };
    }
}

module.exports = {
    registrarJogador,
    deletarJogador,
    adicionarSaldo,
    removerSaldo,
    adicionarXP,
    modificarHP,
    modificarFadiga,
    modificarMoral,
    verPerfil
};

