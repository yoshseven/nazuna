/*
 * Módulo de Batalha Pokémon - RPG Nazuna (Versão Refatorada)
 * Gerencia as batalhas por turnos entre Pokémon.
 * 
 * Criado originalmente por: Hiudy
 * Refatorado e expandido por: Manus (IA)
 * 
 * Manter créditos ao criar ou modificar!
 */

const fs = require("fs").promises;
const path = require("path");
const { carregarDadosJogador, salvarDadosJogador, normalizar, formatarMoeda } = require("./utils");
const { GERAL, MOEDA } = require("./config");
const { carregarDadosPokemonJogador, salvarDadosPokemonJogador, adicionarXPPokemon, getPokemonDataById, getMoveDataByName } = require("./pokemon_core"); 
const { adicionarItem, removerItem, possuiItem } = require("./inventory");

// --- Carregamento de Dados Essenciais ---
let POKEMON_DB = [];
let MOVES_DB = [];
let TYPE_CHART = {}; // Será preenchido com a eficácia dos tipos

async function carregarDadosBatalha() {
    try {
        const pokemonDataPath = path.join(__dirname, "..", "data", "pokemon_data.json");
        const movesDataPath = path.join(__dirname, "..", "data", "moves_data.json");
        // TODO: Criar e carregar type_chart.json
        // const typeChartPath = path.join(__dirname, "..", "data", "type_chart.json"); 

        const [pokemonData, movesData] = await Promise.all([
            fs.readFile(pokemonDataPath, "utf-8").then(JSON.parse).catch(e => { console.error("Erro ao carregar pokemon_data.json:", e); return []; }),
            fs.readFile(movesDataPath, "utf-8").then(JSON.parse).catch(e => { console.error("Erro ao carregar moves_data.json:", e); return []; })
            // fs.readFile(typeChartPath, "utf-8").then(JSON.parse).catch(e => { console.error("Erro ao carregar type_chart.json:", e); return {}; })
        ]);
        POKEMON_DB = pokemonData;
        MOVES_DB = movesData;
        // TYPE_CHART = typeChartData; 
        console.log(`Dados de batalha carregados: ${POKEMON_DB.length} Pokémon, ${MOVES_DB.length} Movimentos.`);
        // Simulação básica da tabela de tipos por enquanto
        TYPE_CHART = {
            normal: { rock: 0.5, steel: 0.5, ghost: 0 },
            fire: { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5, steel: 2 },
            water: { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
            electric: { water: 2, electric: 0.5, grass: 0.5, ground: 0, flying: 2, dragon: 0.5 },
            grass: { fire: 0.5, water: 2, grass: 0.5, poison: 0.5, ground: 2, flying: 0.5, bug: 0.5, rock: 2, dragon: 0.5, steel: 0.5 },
            ice: { fire: 0.5, water: 0.5, grass: 2, ice: 0.5, ground: 2, flying: 2, dragon: 2, steel: 0.5 },
            fighting: { normal: 2, ice: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, rock: 2, ghost: 0, dark: 2, steel: 2, fairy: 0.5 },
            poison: { grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0, fairy: 2 },
            ground: { fire: 2, electric: 2, grass: 0.5, poison: 2, flying: 0, bug: 0.5, rock: 2, steel: 2 },
            flying: { electric: 0.5, grass: 2, fighting: 2, bug: 2, rock: 0.5, steel: 0.5 },
            psychic: { fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5 },
            bug: { fire: 0.5, grass: 2, fighting: 0.5, poison: 0.5, flying: 0.5, psychic: 2, ghost: 0.5, dark: 2, steel: 0.5, fairy: 0.5 },
            rock: { fire: 2, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2, steel: 0.5 },
            ghost: { normal: 0, psychic: 2, ghost: 2, dark: 0.5 },
            dragon: { dragon: 2, steel: 0.5, fairy: 0 },
            dark: { fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, fairy: 0.5 },
            steel: { fire: 0.5, water: 0.5, electric: 0.5, ice: 2, rock: 2, steel: 0.5, fairy: 2 },
            fairy: { fire: 0.5, fighting: 2, poison: 0.5, dragon: 2, dark: 2, steel: 0.5 }
        };

    } catch (err) {
        console.error("Erro fatal ao carregar dados essenciais para batalha:", err);
    }
}
carregarDadosBatalha();

// --- Funções de Cálculo de Batalha ---

function calcularEficaciaTipo(moveType, targetTypes) {
    let effectiveness = 1;
    if (!TYPE_CHART[moveType]) return effectiveness; // Tipo do movimento não encontrado?

    for (const targetType of targetTypes) {
        const mod = TYPE_CHART[moveType][targetType];
        if (mod !== undefined) {
            effectiveness *= mod;
        }
    }
    return effectiveness;
}

function calcularDano(atacante, defensor, moveData) {
    if (!moveData || moveData.poder === null || moveData.poder === 0) return { dano: 0, critico: false, eficacia: 1 };

    const pkmAtacanteBase = getPokemonDataById(atacante.especie_id);
    const pkmDefensorBase = getPokemonDataById(defensor.especie_id);
    if (!pkmAtacanteBase || !pkmDefensorBase) return { dano: 0, critico: false, eficacia: 1 }; // Segurança

    const nivelAtacante = atacante.nivel;
    const poderBase = moveData.poder;
    const classeDano = moveData.classe_dano; // physical, special, status

    const atkStat = (classeDano === "physical") ? (atacante.stats?.attack || pkmAtacanteBase.stats_base.attack) 
                    : (atacante.stats?.special_attack || pkmAtacanteBase.stats_base["special-attack"]);
    const defStat = (classeDano === "physical") ? (defensor.stats?.defense || pkmDefensorBase.stats_base.defense)
                    : (defensor.stats?.special_defense || pkmDefensorBase.stats_base["special-defense"]);

    // Fórmula de dano simplificada (inspirada nas gerações mais recentes)
    let dano = Math.floor((((2 * nivelAtacante / 5 + 2) * poderBase * atkStat / defStat) / 50) + 2);

    // Modificador STAB (Same-type attack bonus)
    const stab = pkmAtacanteBase.tipos.includes(moveData.tipo) ? 1.5 : 1.0;
    dano = Math.floor(dano * stab);

    // Modificador de Tipo
    const eficacia = calcularEficaciaTipo(moveData.tipo, pkmDefensorBase.tipos);
    dano = Math.floor(dano * eficacia);

    // Modificador Crítico (chance simplificada)
    const chanceCritico = 0.0625; // ~6%
    const critico = Math.random() < chanceCritico;
    if (critico) {
        dano = Math.floor(dano * 1.5);
    }

    // Modificador Aleatório (85% a 100%)
    const randomMod = (Math.floor(Math.random() * 16) + 85) / 100;
    dano = Math.floor(dano * randomMod);

    // Garante dano mínimo de 1 se houver eficácia
    if (eficacia > 0 && dano === 0) {
        dano = 1;
    }

    return { dano, critico, eficacia };
}

function determinarOrdemTurno(pokemonJogador, pokemonOponente, moveJogador, moveOponente) {
    // Prioridade do movimento primeiro
    const prioJogador = moveJogador?.prioridade || 0;
    const prioOponente = moveOponente?.prioridade || 0;
    if (prioJogador !== prioOponente) {
        return prioJogador > prioOponente ? "jogador" : "oponente";
    }

    // Velocidade como desempate
    const velJogador = pokemonJogador.stats?.speed || getPokemonDataById(pokemonJogador.especie_id)?.stats_base?.speed || 1;
    const velOponente = pokemonOponente.stats?.speed || getPokemonDataById(pokemonOponente.especie_id)?.stats_base?.speed || 1;
    if (velJogador !== velOponente) {
        return velJogador > velOponente ? "jogador" : "oponente";
    }

    // Aleatório se tudo for igual
    return Math.random() < 0.5 ? "jogador" : "oponente";
}

// --- Funções Principais de Batalha ---

async function iniciarBatalhaSelvagem(senderId) {
    let dadosJogador = await carregarDadosJogador(senderId);
    if (!dadosJogador) return { success: false, msg: "⚠️ Lenda não encontrada!" };
    if (!dadosJogador.encontro_pokemon) return { success: false, msg: "⚠️ Você não encontrou nenhum Pokémon para batalhar!" };

    const dadosPokemonJogador = await carregarDadosPokemonJogador(senderId);
    if (!dadosPokemonJogador.time || dadosPokemonJogador.time.length === 0) {
        return { success: false, msg: "⚠️ Seu time Pokémon está vazio! Você não pode batalhar." };
    }

    let indicePokemonAtivo = dadosPokemonJogador.time.findIndex(p => p.hp_atual > 0);
    if (indicePokemonAtivo === -1) {
        return { success: false, msg: "⚠️ Todos os Pokémon do seu time estão fora de combate!" };
    }
    const pokemonAtivoJogador = { ...dadosPokemonJogador.time[indicePokemonAtivo] }; // Cria cópia para a batalha

    const pokemonSelvagemEncontrado = dadosJogador.encontro_pokemon;
    const pkmSelvagemBase = getPokemonDataById(pokemonSelvagemEncontrado.especie_id);
    if (!pkmSelvagemBase) return { success: false, msg: "⚠️ Erro ao obter dados do Pokémon selvagem!" };
    
    // Cria o objeto do oponente para a batalha
    const pokemonOponente = {
        ...pokemonSelvagemEncontrado, // id_unico, especie_id, nivel, hp_atual, etc.
        stats: pkmSelvagemBase.stats_base, // Usa stats base para selvagem
        movimentos: pkmSelvagemBase.movimentos_iniciais || ["tackle"] // Movimentos básicos
    };

    const nomePkmJogador = pokemonAtivoJogador.nome_apelido || getPokemonDataById(pokemonAtivoJogador.especie_id)?.nome_exibicao || "Pokémon";
    const nomePkmOponente = pkmSelvagemBase.nome_exibicao;

    // Configura o estado da batalha
    dadosJogador.batalha_pokemon = {
        tipo: "selvagem",
        oponente: pokemonOponente,
        pokemon_ativo_jogador: pokemonAtivoJogador,
        indice_pokemon_ativo_time: indicePokemonAtivo,
        turno: 1,
        estado: "escolha_acao_jogador", // jogador_escolhe, processando, oponente_escolhe, finalizada
        log: [],
        acao_jogador: null, // { tipo: "movimento", nome: "tackle" } ou { tipo: "trocar", indice: 1 } etc.
        acao_oponente: null
    };
    
    dadosJogador.encontro_pokemon = null; // Limpa o encontro

    const msgInicial = `🌲 Um *${nomePkmOponente}* selvagem (Nv. ${pokemonOponente.nivel}) surgiu!
` +
                     `▶️ Vai, *${nomePkmJogador}* (Nv. ${pokemonAtivoJogador.nivel})!
` +
                     `--------------------
` +
                     `O que fazer? (${GERAL.PREFIXO_BOT}pkm lutar | ${GERAL.PREFIXO_BOT}pkm trocar | ${GERAL.PREFIXO_BOT}pkm item | ${GERAL.PREFIXO_BOT}pkm fugir)`;
    
    dadosJogador.batalha_pokemon.log.push(msgInicial.split("\n")[0]);
    dadosJogador.batalha_pokemon.log.push(msgInicial.split("\n")[1]);
    await salvarDadosJogador(senderId, dadosJogador);

    return { success: true, msg: msgInicial };
}

async function escolherAcaoBatalha(senderId, tipoAcao, valorAcao = null) {
    let dadosJogador = await carregarDadosJogador(senderId);
    if (!dadosJogador || !dadosJogador.batalha_pokemon || dadosJogador.batalha_pokemon.estado !== "escolha_acao_jogador") {
        return { success: false, msg: "⚠️ Não é o momento de escolher uma ação." };
    }

    const pkmAtivoJogador = dadosJogador.batalha_pokemon.pokemon_ativo_jogador;
    const nomePkmJogador = pkmAtivoJogador.nome_apelido || getPokemonDataById(pkmAtivoJogador.especie_id)?.nome_exibicao || "Pokémon";
    let resultado = { success: false, msg: "Ação inválida." };

    switch (tipoAcao) {
        case "lutar":
            const movimentos = pkmAtivoJogador.movimentos || [];
            if (movimentos.length === 0) {
                resultado = { success: false, msg: `⚠️ *${nomePkmJogador}* não conhece nenhum movimento!` };
            } else {
                let textoMoves = `💥 Escolha um movimento: (${GERAL.PREFIXO_BOT}pkm ataque [nome_movimento])\n`;
                movimentos.forEach(moveName => {
                    const moveData = getMoveDataByName(moveName);
                    textoMoves += `- ${moveData?.nome_exibicao || moveName} (PP: ${moveData?.pp || "?"})\n`; // TODO: Mostrar PP atual
                });
                dadosJogador.batalha_pokemon.estado = "escolha_movimento_jogador";
                resultado = { success: true, msg: textoMoves.trim() };
            }
            break;

        case "ataque":
            if (dadosJogador.batalha_pokemon.estado !== "escolha_movimento_jogador") {
                 return { success: false, msg: "⚠️ Use `.pkm lutar` primeiro para ver os movimentos." };
            }
            const movimentoEscolhido = normalizar(valorAcao);
            const movimentosConhecidos = (pkmAtivoJogador.movimentos || []).map(m => normalizar(m));
            const moveData = getMoveDataByName(movimentoEscolhido);

            if (!movimentosConhecidos.includes(movimentoEscolhido) || !moveData) {
                resultado = { success: false, msg: `⚠️ *${nomePkmJogador}* não conhece o movimento "${valorAcao}".` };
            } else {
                // TODO: Verificar PP
                dadosJogador.batalha_pokemon.acao_jogador = { tipo: "movimento", nome: movimentoEscolhido, data: moveData };
                dadosJogador.batalha_pokemon.estado = "processando_turno";
                resultado = await processarTurno(senderId, dadosJogador); // Passa dadosJogador modificado
                return resultado; // Retorna diretamente o resultado do processamento
            }
            break;

        case "trocar":
            // TODO: Implementar troca
            resultado = { success: false, msg: "Troca ainda não implementada." };
            break;
        case "item":
            // TODO: Implementar uso de item
            resultado = { success: false, msg: "Uso de item ainda não implementado." };
            break;
        case "fugir":
            if (dadosJogador.batalha_pokemon.tipo !== "selvagem") {
                resultado = { success: false, msg: "⚠️ Não se pode fugir de batalhas de treinador!" };
            } else {
                // TODO: Implementar fórmula de fuga
                const sucessoFuga = Math.random() < 0.8; // Chance alta por enquanto
                if (sucessoFuga) {
                    const nomeOponente = getPokemonDataById(dadosJogador.batalha_pokemon.oponente.especie_id)?.nome_exibicao || "Oponente";
                    dadosJogador.batalha_pokemon = null; // Finaliza batalha
                    resultado = { success: true, msg: `💨 Você fugiu com sucesso da batalha contra *${nomeOponente}*!` };
                } else {
                    dadosJogador.batalha_pokemon.acao_jogador = { tipo: "fugir_falhou" };
                    dadosJogador.batalha_pokemon.estado = "processando_turno";
                    resultado = await processarTurno(senderId, dadosJogador);
                    return resultado; // Retorna diretamente
                }
            }
            break;
    }

    // Salva estado se não foi processado turno
    if (dadosJogador.batalha_pokemon && dadosJogador.batalha_pokemon.estado !== "processando_turno") {
        await salvarDadosJogador(senderId, dadosJogador);
    }
    return resultado;
}

async function processarTurno(senderId, dadosJogador) {
    // Esta função assume que dadosJogador.batalha_pokemon.acao_jogador já está definida
    // e que dadosJogador.batalha_pokemon.estado é "processando_turno"
    
    const batalha = dadosJogador.batalha_pokemon;
    const pkmJogador = batalha.pokemon_ativo_jogador;
    const pkmOponente = batalha.oponente;
    const nomePkmJogador = pkmJogador.nome_apelido || getPokemonDataById(pkmJogador.especie_id)?.nome_exibicao || "Pokémon";
    const nomePkmOponente = getPokemonDataById(pkmOponente.especie_id)?.nome_exibicao || "Oponente";
    let logTurno = [`
--- Turno ${batalha.turno} ---`];

    // --- Ação do Oponente (IA Simples) ---
    if (batalha.acao_jogador.tipo !== "fugir_falhou") { // Oponente não age se jogador falhou em fugir
        const movimentosOponente = pkmOponente.movimentos || ["tackle"];
        const indiceMoveAleatorio = Math.floor(Math.random() * movimentosOponente.length);
        const moveOponenteEscolhido = movimentosOponente[indiceMoveAleatorio];
        batalha.acao_oponente = { tipo: "movimento", nome: moveOponenteEscolhido, data: getMoveDataByName(moveOponenteEscolhido) };
    } else {
        batalha.acao_oponente = null; // Oponente não age
        logTurno.push(`Não foi possível fugir!`);
    }

    // --- Determinar Ordem --- 
    const primeiroAtacar = determinarOrdemTurno(pkmJogador, pkmOponente, batalha.acao_jogador?.data, batalha.acao_oponente?.data);
    const atacantes = (primeiroAtacar === "jogador") 
        ? [{ p: pkmJogador, acao: batalha.acao_jogador, nome: nomePkmJogador, defensor: pkmOponente, nomeDefensor: nomePkmOponente }, 
           { p: pkmOponente, acao: batalha.acao_oponente, nome: nomePkmOponente, defensor: pkmJogador, nomeDefensor: nomePkmJogador }]
        : [{ p: pkmOponente, acao: batalha.acao_oponente, nome: nomePkmOponente, defensor: pkmJogador, nomeDefensor: nomePkmJogador },
           { p: pkmJogador, acao: batalha.acao_jogador, nome: nomePkmJogador, defensor: pkmOponente, nomeDefensor: nomePkmOponente }];

    // --- Executar Ações --- 
    let batalhaFinalizada = false;
    for (const { p: atacante, acao, nome: nomeAtacante, defensor, nomeDefensor } of atacantes) {
        if (batalhaFinalizada || !acao || atacante.hp_atual <= 0 || defensor.hp_atual <= 0) continue; // Pula se HP zero ou sem ação

        if (acao.tipo === "movimento") {
            const moveData = acao.data;
            if (!moveData) {
                logTurno.push(`*${nomeAtacante}* tentou usar ${acao.nome}, mas falhou!`);
                continue;
            }
            // TODO: Verificar PP
            logTurno.push(`*${nomeAtacante}* usou *${moveData.nome_exibicao}*!`);
            
            // Calcular dano
            const { dano, critico, eficacia } = calcularDano(atacante, defensor, moveData);

            if (critico) logTurno.push("💥 Acerto Crítico!");
            if (eficacia > 1) logTurno.push("✨ É super efetivo!");
            if (eficacia < 1 && eficacia > 0) logTurno.push("🦴 Não é muito efetivo...");
            if (eficacia === 0) logTurno.push(`🛡️ Não afetou *${nomeDefensor}*...`);

            if (dano > 0) {
                defensor.hp_atual = Math.max(0, defensor.hp_atual - dano);
                logTurno.push(`*${nomeDefensor}* perdeu ${dano} HP! (${defensor.hp_atual} HP restante)`);
            }

            // TODO: Aplicar efeitos secundários do movimento

            // Verificar Faint
            if (defensor.hp_atual <= 0) {
                logTurno.push(`*${nomeDefensor}* desmaiou!`);
                batalhaFinalizada = true; // Encerra o turno após um faint
                
                // Lógica pós-faint
                if (defensor === pkmOponente) { // Oponente desmaiou
                    // TODO: Calcular XP
                    const xpGanho = getPokemonDataById(pkmOponente.especie_id)?.stats_base?.hp || 50; // XP baseado no HP base (exemplo)
                    logTurno.push(`*${nomePkmJogador}* ganhou ${xpGanho} XP!`);
                    // Adiciona XP ao Pokémon ativo no time real
                    const dadosPkm = await carregarDadosPokemonJogador(senderId);
                    dadosPkm.time[batalha.indice_pokemon_ativo_time] = adicionarXPPokemon(dadosPkm.time[batalha.indice_pokemon_ativo_time], xpGanho);
                    // TODO: Verificar level up aqui?
                    await salvarDadosPokemonJogador(senderId, dadosPkm);
                    
                    batalha.estado = "finalizada_vitoria";
                } else { // Pokémon do jogador desmaiou
                    // Atualiza HP no time real
                    const dadosPkm = await carregarDadosPokemonJogador(senderId);
                    dadosPkm.time[batalha.indice_pokemon_ativo_time].hp_atual = 0;
                    await salvarDadosPokemonJogador(senderId, dadosPkm);

                    // Verifica se há outros Pokémon
                    const proximoDisponivel = dadosPkm.time.some((p, idx) => p.hp_atual > 0 && idx !== batalha.indice_pokemon_ativo_time);
                    if (proximoDisponivel) {
                        batalha.estado = "escolha_proximo_pkm";
                        logTurno.push(`Escolha o próximo Pokémon (${GERAL.PREFIXO_BOT}pkm trocar [numero_time]).`);
                    } else {
                        logTurno.push("Todos os seus Pokémon desmaiaram! Você perdeu a batalha...");
                        batalha.estado = "finalizada_derrota";
                    }
                }
            }
        } else if (acao.tipo === "fugir_falhou") {
            // Mensagem já adicionada antes
        }
        // TODO: Lógica para outras ações (item, troca)
    }

    // --- Fim do Turno --- 
    batalha.log.push(...logTurno);
    
    let msgFinalTurno = logTurno.join("\n");

    if (batalha.estado === "finalizada_vitoria") {
        dadosJogador.batalha_pokemon = null; // Limpa estado da batalha
        msgFinalTurno += "\n🎉 Você venceu a batalha!";
    } else if (batalha.estado === "finalizada_derrota") {
        dadosJogador.batalha_pokemon = null;
        msgFinalTurno += "\n💔 Você foi derrotado...";
    } else if (batalha.estado === "escolha_proximo_pkm") {
        // Mensagem já está no log
    } else if (!batalhaFinalizada) {
        batalha.estado = "escolha_acao_jogador";
        batalha.turno += 1;
        msgFinalTurno += `\n--------------------
HP de ${nomePkmJogador}: ${pkmJogador.hp_atual} | HP de ${nomePkmOponente}: ${pkmOponente.hp_atual}
O que fazer? (${GERAL.PREFIXO_BOT}pkm lutar | ${GERAL.PREFIXO_BOT}pkm trocar | ${GERAL.PREFIXO_BOT}pkm item | ${GERAL.PREFIXO_BOT}pkm fugir)`;
    }

    // Salva o estado atualizado da batalha
    await salvarDadosJogador(senderId, dadosJogador);

    return { success: true, msg: msgFinalTurno };
}

// TODO: Implementar funções:
// - trocarPokemon(senderId, indicePokemon)
// - usarItemBatalha(senderId, nomeItem)
// - iniciarBatalhaTreinador(senderId, oponenteId)

module.exports = {
    iniciarBatalhaSelvagem,
    escolherAcaoBatalha
    // Exportar outras funções
};

