/*
 * Módulo de Missões - RPG Nazuna
 * Gerencia missões disponíveis, progresso e recompensas.
 * 
 * Criado originalmente por: Hiudy
 * Refatorado e expandido por: Manus (IA)
 * 
 * Manter créditos ao criar ou modificar!
 */

const fs = require("fs").promises;
const path = require("path");
const { carregarDadosJogador, salvarDadosJogador, normalizar } = require("./utils");
const { adicionarDinheiro } = require("./economy");
const { adicionarItem, possuiItem } = require("./inventory");
const { NPC_DB } = require("./relationships"); // Para recompensas de afinidade

const MissionDataPath = path.join(__dirname, "..", "data", "mission_data.json");
let MISSION_DB = [];

// Carrega os dados base das missões do JSON
async function carregarMissionDB() {
    try {
        const data = await fs.readFile(MissionDataPath, "utf-8");
        MISSION_DB = JSON.parse(data);
        console.log(`Banco de dados de Missões carregado com ${MISSION_DB.length} missões.`);
    } catch (err) {
        console.error("Erro crítico ao carregar mission_data.json:", err);
        MISSION_DB = [];
    }
}

carregarMissionDB();

// --- Funções de Gestão de Missões do Jogador ---

// Obtém os dados de missões do jogador (cria se não existir)
function obterDadosMissoes(dadosJogador) {
    if (!dadosJogador.missoes) {
        dadosJogador.missoes = {
            ativas: {}, // { missaoId: { progresso: {...} } }
            concluidas: [] // [missaoId]
        };
    }
    // Garante que `ativas` seja um objeto
    if (Array.isArray(dadosJogador.missoes.ativas)) {
        dadosJogador.missoes.ativas = {};
    }
    dadosJogador.missoes.concluidas = dadosJogador.missoes.concluidas || [];
    return dadosJogador.missoes;
}

// Verifica se o jogador cumpre os pré-requisitos de uma missão
function verificarPreRequisitos(dadosJogador, missao) {
    if (!missao.pre_requisitos) return true; // Sem pré-requisitos

    const pre = missao.pre_requisitos;
    const dadosMissoes = obterDadosMissoes(dadosJogador);

    if (pre.nivel_minimo && dadosJogador.nivel < pre.nivel_minimo) return false;
    if (pre.missao_requerida && !dadosMissoes.concluidas.includes(pre.missao_requerida)) return false;
    
    if (pre.afinidade_minima) {
        const dadosRel = dadosJogador.relacionamentos?.[normalizar(pre.afinidade_minima.npcId)];
        if (!dadosRel || dadosRel.afinidade < pre.afinidade_minima.valor) return false;
    }
    
    // TODO: Adicionar verificação de habilidade mínima se implementado
    // if (pre.habilidade_minima && ...) return false;

    return true;
}

// Atualiza o progresso de uma missão ativa
function atualizarProgressoMissao(dadosJogador, tipoEvento, detalhesEvento) {
    const dadosMissoes = obterDadosMissoes(dadosJogador);
    let progressoFeito = false;

    for (const missaoId in dadosMissoes.ativas) {
        const missaoBase = MISSION_DB.find(m => m.id === missaoId);
        if (!missaoBase) continue;

        const progressoAtual = dadosMissoes.ativas[missaoId].progresso;

        missaoBase.objetivos.forEach((obj, index) => {
            const progressoObj = progressoAtual[index] || 0;
            let novoProgresso = progressoObj;

            if (obj.tipo === tipoEvento) {
                switch (tipoEvento) {
                    case "item":
                        if (normalizar(obj.item) === normalizar(detalhesEvento.item)) {
                            // Para coleta, verificamos o inventário ao completar
                            // Aqui podemos apenas marcar que o item é relevante
                        }
                        break;
                    case "craft":
                        if (normalizar(obj.item) === normalizar(detalhesEvento.item)) {
                            novoProgresso += detalhesEvento.quantidade || 1;
                        }
                        break;
                    case "kill":
                        if (normalizar(obj.monstro) === normalizar(detalhesEvento.monstro)) {
                            novoProgresso += detalhesEvento.quantidade || 1;
                        }
                        break;
                    case "flag": // Flags são marcadas externamente
                        if (obj.flag_id === detalhesEvento.flag_id && detalhesEvento.valor === true) {
                            novoProgresso = 1; // Marca como completo
                        }
                        break;
                    // Adicionar outros tipos (visitar local, falar com NPC, etc.)
                }
            }

            // Atualiza o progresso se mudou e não excedeu o objetivo
            if (novoProgresso > progressoObj && novoProgresso <= obj.quantidade) {
                progressoAtual[index] = novoProgresso;
                progressoFeito = true;
            }
        });
    }
    return progressoFeito; // Retorna true se algum progresso foi feito
}

// --- Funções do Sistema de Missões ---

// Lista missões disponíveis para o jogador
async function listarMissoesDisponiveis(senderId) {
    let dadosJogador = await carregarDadosJogador(senderId);
    if (!dadosJogador) return { msg: "⚠️ Lenda não encontrada!" };

    const dadosMissoes = obterDadosMissoes(dadosJogador);
    const missoesDisponiveis = MISSION_DB.filter(missao => 
        !dadosMissoes.ativas[missao.id] && 
        !dadosMissoes.concluidas.includes(missao.id) &&
        verificarPreRequisitos(dadosJogador, missao)
    );

    if (missoesDisponiveis.length === 0) {
        return { msg: "📜 Nenhuma nova missão disponível para você no momento." };
    }

    let texto = "📌 *Missões Disponíveis:*\n------------------------------------\n";
    missoesDisponiveis.forEach(missao => {
        texto += `*${missao.nome}* (ID: ${missao.id})\n`;
        texto += `  💬 ${missao.descricao}\n`;
        // Mostrar recompensas?
        texto += `  ⭐ XP: ${missao.recompensas.xp || 0} | 💰 Moedas: ${missao.recompensas.dinheiro || 0}\n`;
        texto += `------------------------------------\n`;
    });
    texto += `Use .missao iniciar <id_missao> para aceitar uma missão.`;
    return { msg: texto };
}

// Lista missões ativas do jogador
async function listarMissoesAtivas(senderId) {
    let dadosJogador = await carregarDadosJogador(senderId);
    if (!dadosJogador) return { msg: "⚠️ Lenda não encontrada!" };

    const dadosMissoes = obterDadosMissoes(dadosJogador);
    const idsAtivas = Object.keys(dadosMissoes.ativas);

    if (idsAtivas.length === 0) {
        return { msg: "▶️ Você não tem nenhuma missão ativa no momento." };
    }

    let texto = "🎯 *Suas Missões Ativas:*\n------------------------------------\n";
    for (const missaoId of idsAtivas) {
        const missaoBase = MISSION_DB.find(m => m.id === missaoId);
        if (!missaoBase) continue;
        const progresso = dadosMissoes.ativas[missaoId].progresso;

        texto += `*${missaoBase.nome}* (ID: ${missaoBase.id})\n`;
        texto += `  *Objetivos:*\n`;
        missaoBase.objetivos.forEach((obj, index) => {
            const progressoAtual = progresso[index] || 0;
            let objetivoTexto = "";
            switch (obj.tipo) {
                case "item": objetivoTexto = `Coletar ${obj.item}`; break;
                case "craft": objetivoTexto = `Criar ${obj.item}`; break;
                case "kill": objetivoTexto = `Derrotar ${obj.monstro}`; break;
                case "flag": objetivoTexto = `Realizar ${obj.flag_id}`; break;
                default: objetivoTexto = `Objetivo ${index + 1}`;
            }
            const completo = progressoAtual >= obj.quantidade;
            texto += `    ${completo ? "✅" : "⏳"} ${objetivoTexto} (${progressoAtual}/${obj.quantidade})\n`;
        });
        texto += `------------------------------------\n`;
    }
    texto += `Use .missao completar <id_missao> quando terminar os objetivos.`;
    return { msg: texto };
}

// Inicia uma missão
async function iniciarMissao(senderId, missaoId) {
    let dadosJogador = await carregarDadosJogador(senderId);
    if (!dadosJogador) return { msg: "⚠️ Lenda não encontrada!" };

    const missao = MISSION_DB.find(m => normalizar(m.id) === normalizar(missaoId) || normalizar(m.nome) === normalizar(missaoId));
    if (!missao) return { msg: `❓ Missão "${missaoId}" não encontrada.` };

    const dadosMissoes = obterDadosMissoes(dadosJogador);
    if (dadosMissoes.ativas[missao.id]) return { msg: `⏳ Você já está fazendo a missão "${missao.nome}".` };
    if (dadosMissoes.concluidas.includes(missao.id)) return { msg: `✅ Você já completou a missão "${missao.nome}".` };

    if (!verificarPreRequisitos(dadosJogador, missao)) {
        return { msg: `⛔ Você não cumpre os pré-requisitos para iniciar a missão "${missao.nome}".` };
    }

    // Inicializa o progresso
    const progressoInicial = {};
    missao.objetivos.forEach((obj, index) => {
        progressoInicial[index] = 0;
    });

    dadosMissoes.ativas[missao.id] = { progresso: progressoInicial };
    await salvarDadosJogador(senderId, dadosJogador);

    return { msg: `▶️ Missão "${missao.nome}" iniciada! Verifique seus objetivos com .missao ativas.` };
}

// Tenta completar uma missão
async function completarMissao(senderId, missaoId) {
    let dadosJogador = await carregarDadosJogador(senderId);
    if (!dadosJogador) return { msg: "⚠️ Lenda não encontrada!" };

    const missaoIdNormalizado = normalizar(missaoId);
    const missaoBase = MISSION_DB.find(m => normalizar(m.id) === missaoIdNormalizado || normalizar(m.nome) === missaoIdNormalizado);
    if (!missaoBase) return { msg: `❓ Missão "${missaoId}" não encontrada.` };

    const dadosMissoes = obterDadosMissoes(dadosJogador);
    if (!dadosMissoes.ativas[missaoBase.id]) return { msg: `❌ Você não está fazendo a missão "${missaoBase.nome}".` };

    const progresso = dadosMissoes.ativas[missaoBase.id].progresso;
    let objetivosCompletos = true;
    let itensFaltando = [];

    for (let i = 0; i < missaoBase.objetivos.length; i++) {
        const obj = missaoBase.objetivos[i];
        const progressoAtual = progresso[i] || 0;

        if (obj.tipo === "item") {
            // Verifica se tem o item no inventário AGORA
            if (!possuiItem(dadosJogador, normalizar(obj.item), obj.quantidade)) {
                objetivosCompletos = false;
                itensFaltando.push(`${obj.quantidade}x ${obj.item}`);
            }
        } else {
            if (progressoAtual < obj.quantidade) {
                objetivosCompletos = false;
                break; // Não precisa verificar o resto se um objetivo não está completo
            }
        }
    }

    if (!objetivosCompletos) {
        let msgErro = `⏳ Você ainda não completou todos os objetivos da missão "${missaoBase.nome}".`;
        if (itensFaltando.length > 0) {
            msgErro += `\n   - Falta entregar: ${itensFaltando.join(", ")}`;
        }
        return { msg: msgErro };
    }

    // Remove itens de coleta, se houver
    for (const obj of missaoBase.objetivos) {
        if (obj.tipo === "item") {
            const remocao = removerItem(dadosJogador, normalizar(obj.item), obj.quantidade);
            if (!remocao) {
                console.error(`Erro ao remover item ${obj.item} para completar missão ${missaoBase.id} por ${senderId}`);
                return { msg: `❌ Erro ao entregar o item ${obj.item}! Conclusão cancelada.` };
            }
            dadosJogador = remocao;
        }
    }

    // Remove missão das ativas e adiciona às concluídas
    delete dadosMissoes.ativas[missaoBase.id];
    if (!dadosMissoes.concluidas.includes(missaoBase.id)) {
        dadosMissoes.concluidas.push(missaoBase.id);
    }

    // Dar recompensas
    const rec = missaoBase.recompensas;
    let msgRecompensas = "";

    if (rec.xp) {
        dadosJogador.xp += rec.xp;
        msgRecompensas += `\n✨ +${rec.xp} XP`;
        // TODO: Chamar função de level up se existir
    }
    if (rec.dinheiro) {
        adicionarDinheiro(dadosJogador, rec.dinheiro);
        msgRecompensas += `\n💰 +${rec.dinheiro} Moedas`;
    }
    if (rec.itens && rec.itens.length > 0) {
        msgRecompensas += "\n🎁 Itens Recebidos:";
        rec.itens.forEach(itemRec => {
            const adicao = adicionarItem(dadosJogador, normalizar(itemRec.item), itemRec.quantidade);
            if (adicao) {
                dadosJogador = adicao;
                msgRecompensas += `\n   - ${itemRec.quantidade}x ${itemRec.item}`;
            }
        });
    }
    if (rec.afinidade) {
        const npc = NPC_DB.find(n => normalizar(n.id) === normalizar(rec.afinidade.npcId));
        if (npc && dadosJogador.relacionamentos?.[normalizar(npc.id)]) {
            dadosJogador.relacionamentos[normalizar(npc.id)].afinidade += rec.afinidade.valor;
            msgRecompensas += `\n❤️ +${rec.afinidade.valor} Afinidade com ${npc.nome}`;
        }
    }

    await salvarDadosJogador(senderId, dadosJogador);

    return { msg: `🎉 Missão "${missaoBase.nome}" completada com sucesso!\n${msgRecompensas}` };
}

// TODO: Implementar função para abandonar missão?
// async function abandonarMissao(senderId, missaoId) { ... }

module.exports = {
    listarMissoesDisponiveis,
    listarMissoesAtivas,
    iniciarMissao,
    completarMissao,
    atualizarProgressoMissao, // Para ser chamado por outros módulos (inventário, combate, etc.)
    MISSION_DB
};

