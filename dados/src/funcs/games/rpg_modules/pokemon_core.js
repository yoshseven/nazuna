/*
 * Módulo Core Pokémon - RPG Nazuna (Versão Refatorada e Polida)
 * Gerencia captura, treino, evolução e dados dos Pokémon dos jogadores.
 * 
 * Criado originalmente por: Hiudy
 * Refatorado e expandido por: Manus (IA)
 * 
 * Manter créditos ao criar ou modificar!
 */

const fs = require("fs").promises;
const path = require("path");
const { carregarDadosJogador, salvarDadosJogador, normalizar, formatarMoeda } = require("./utils"); // Adicionado formatarMoeda
const { DIFICULDADE, ITENS_LOJA, GERAL, MOEDA } = require("./config"); 
const { possuiItem, removerItem, adicionarItem } = require("./inventory");

const PokemonDataPath = path.join(__dirname, "..", "data", "pokemon_data.json");
const MovesDataPath = path.join(__dirname, "..", "data", "moves_data.json");
const PlayerPokemonPath = path.join("dados", "database", "pokemon");

let POKEMON_DB = []; // Armazena os dados base dos Pokémon carregados
let MOVES_DB = []; // Armazena os dados base dos movimentos

// Garante que o diretório de dados Pokémon dos jogadores exista
async function inicializarDiretorioPokemon() {
    try {
        await fs.mkdir(PlayerPokemonPath, { recursive: true });
    } catch (err) {
        console.error(`${GERAL.NOME_BOT} Erro: Falha crítica ao criar diretório de dados Pokémon:`, err);
    }
}

// Carrega os dados base dos Pokémon e Movimentos do JSON
async function carregarPokemonDB() {
    try {
        const [pokemonData, movesData] = await Promise.all([
            fs.readFile(PokemonDataPath, "utf-8").then(JSON.parse).catch(e => { console.error(`${GERAL.NOME_BOT} Erro: Falha ao carregar ${PokemonDataPath}:`, e); return []; }),
            fs.readFile(MovesDataPath, "utf-8").then(JSON.parse).catch(e => { console.error(`${GERAL.NOME_BOT} Erro: Falha ao carregar ${MovesDataPath}:`, e); return []; })
        ]);
        POKEMON_DB = pokemonData;
        MOVES_DB = movesData;
        console.log(`${GERAL.NOME_BOT} Info: Banco de dados Pokémon carregado (${POKEMON_DB.length} espécies, ${MOVES_DB.length} movimentos).`);
    } catch (err) {
        console.error(`${GERAL.NOME_BOT} Erro: Falha crítica ao carregar dados Pokémon/Movimentos:`, err);
        POKEMON_DB = []; 
        MOVES_DB = [];
    }
}

// Inicializa diretório e carrega DB ao iniciar
inicializarDiretorioPokemon();
carregarPokemonDB();

// --- Funções de Acesso a Dados Base ---
function getPokemonDataById(id) {
    return POKEMON_DB.find(p => p.id === id);
}

function getMoveDataByName(name) {
    const normalizedName = normalizar(name);
    return MOVES_DB.find(m => normalizar(m.nome) === normalizedName);
}

// --- Funções de Cálculo e Lógica --- 

// Calcula os stats de um Pokémon baseado no nível, base stats, IVs e EVs (simplificado)
function calcularStats(pokemonBase, nivel, ivs = {}) {
    // Fórmulas inspiradas nas gerações mais recentes (simplificadas, sem EVs por enquanto)
    const calcularStat = (base, iv = 0, nivel) => {
        const ivVal = iv || Math.floor(Math.random() * 32); // IVs 0-31
        return Math.floor(((2 * base + ivVal) * nivel) / 100 + 5);
    };

    const calcularHP = (base, iv = 0, nivel) => {
        const ivVal = iv || Math.floor(Math.random() * 32);
        return Math.floor(((2 * base + ivVal) * nivel) / 100 + nivel + 10);
    };

    return {
        hp: calcularHP(pokemonBase.stats_base.hp, ivs.hp, nivel),
        attack: calcularStat(pokemonBase.stats_base.attack, ivs.attack, nivel),
        defense: calcularStat(pokemonBase.stats_base.defense, ivs.defense, nivel),
        "special-attack": calcularStat(pokemonBase.stats_base["special-attack"], ivs["special-attack"], nivel),
        "special-defense": calcularStat(pokemonBase.stats_base["special-defense"], ivs["special-defense"], nivel),
        speed: calcularStat(pokemonBase.stats_base.speed, ivs.speed, nivel)
    };
}

// Calcula a quantidade de XP necessária para o próximo nível (curva de crescimento médio-rápido)
function xpParaProximoNivel(nivelAtual) {
    if (nivelAtual >= 100) return Infinity; // Nível máximo
    // Fórmula da curva médio-rápido: n^3
    return Math.pow(nivelAtual + 1, 3);
}

// Obtém os movimentos que um Pokémon aprende em um determinado nível (precisa ser implementado no script de fetch)
function obterMovimentosNivel(pokemonBase, nivel) {
    // TODO: A estrutura `movimentos_nivel` precisa ser populada no pokemon_data.json
    // Exemplo: pokemonBase.movimentos_nivel = { 5: ["growl"], 10: ["tackle"] }
    // return pokemonBase.movimentos_nivel?.[nivel] || [];
    // Simulação básica por enquanto:
    if (nivel % 5 === 0 && pokemonBase.movimentos_iniciais?.length > 0) {
        return [pokemonBase.movimentos_iniciais[Math.floor(Math.random() * pokemonBase.movimentos_iniciais.length)]];
    }
    return [];
}

// --- Funções de Gestão de Dados do Jogador ---

// Carrega os dados Pokémon de um jogador específico
async function carregarDadosPokemonJogador(senderId) {
    const filePath = path.join(PlayerPokemonPath, `${senderId}.json`);
    try {
        // Tenta ler o ficheiro
        const data = await fs.readFile(filePath, "utf-8");
        const dados = JSON.parse(data);
        // Garante que as estruturas básicas existam
        dados.time = dados.time || [];
        dados.pc = dados.pc || [];
        dados.pokedex = dados.pokedex || { vistos: [], capturados: [] };
        return dados;
    } catch (err) {
        // Se o erro for 'ficheiro não encontrado', cria um novo
        if (err.code === 'ENOENT') {
            const dadosIniciais = { time: [], pc: [], pokedex: { vistos: [], capturados: [] } }; 
            await salvarDadosPokemonJogador(senderId, dadosIniciais);
            return dadosIniciais;
        } else {
            // Outro erro de leitura/parse
            console.error(`${GERAL.NOME_BOT} Erro: Falha ao carregar dados Pokémon para ${senderId}:`, err);
            return { time: [], pc: [], pokedex: { vistos: [], capturados: [] } }; // Retorna vazio
        }
    }
}

// Salva os dados Pokémon de um jogador específico
async function salvarDadosPokemonJogador(senderId, dadosPokemon) {
    const filePath = path.join(PlayerPokemonPath, `${senderId}.json`);
    try {
        await fs.writeFile(filePath, JSON.stringify(dadosPokemon, null, 2));
        return true;
    } catch (err) {
        console.error(`${GERAL.NOME_BOT} Erro: Falha ao salvar dados Pokémon para ${senderId}:`, err);
        return false;
    }
}

// Encontra um Pokémon específico no time ou PC pelo ID único
function encontrarPokemonPorIdUnico(dadosPokemonJogador, idUnico) {
    const indexTime = dadosPokemonJogador.time.findIndex(p => p.id_unico === idUnico);
    if (indexTime !== -1) return { pokemon: dadosPokemonJogador.time[indexTime], local: "time", index: indexTime };
    
    const indexPc = dadosPokemonJogador.pc.findIndex(p => p.id_unico === idUnico);
    if (indexPc !== -1) return { pokemon: dadosPokemonJogador.pc[indexPc], local: "pc", index: indexPc };
    
    return null;
}

// --- Lógica do Sistema Pokémon --- 

// Encontra um Pokémon selvagem
async function encontrarPokemonSelvagem(senderId, local = "rota inicial") {
    const dadosJogador = await carregarDadosJogador(senderId);
    if (!dadosJogador) return { success: false, msg: `❓ ${GERAL.NOME_BOT} não te reconhece... Registre-se primeiro!` };

    // TODO: Implementar sistema de locais e encontros mais robusto
    // Por enquanto, seleciona aleatoriamente da DB
    if (POKEMON_DB.length === 0) {
        return { success: false, msg: `⚙️ ${GERAL.NOME_BOT} Erro: A base de dados Pokémon parece vazia... Contacte um admin!` };
    }
    const pokemonEncontradoBase = POKEMON_DB[Math.floor(Math.random() * POKEMON_DB.length)];
    
    // Define nível (ex: baseado no progresso do jogador ou aleatório)
    // Poderia usar o nível médio do time do jogador como base
    const nivel = Math.floor(Math.random() * 5) + 3; // Exemplo: Nível 3 a 7

    // Calcula stats
    const ivsAleatorios = {
        hp: Math.floor(Math.random() * 32),
        attack: Math.floor(Math.random() * 32),
        defense: Math.floor(Math.random() * 32),
        "special-attack": Math.floor(Math.random() * 32),
        "special-defense": Math.floor(Math.random() * 32),
        speed: Math.floor(Math.random() * 32)
    };
    const statsCalculados = calcularStats(pokemonEncontradoBase, nivel, ivsAleatorios);

    // Define movimentos iniciais (usando os do JSON)
    let movimentosIniciais = pokemonEncontradoBase.movimentos_iniciais || [];
    // Poderia adicionar mais movimentos baseados no nível aqui se a DB tivesse essa info

    const pokemonSelvagem = {
        especie_id: pokemonEncontradoBase.id,
        nome: pokemonEncontradoBase.nome_exibicao,
        tipos: pokemonEncontradoBase.tipos,
        nivel: nivel,
        stats: statsCalculados,
        hp_atual: statsCalculados.hp, // HP cheio inicialmente
        movimentos: movimentosIniciais,
        taxa_captura: pokemonEncontradoBase.taxa_captura || 45, // Taxa padrão se não definida
        xp_base: pokemonEncontradoBase.xp_base || 60, // XP base padrão
        ivs: ivsAleatorios // Guarda IVs para possível captura
    };

    // Armazena o encontro para captura/batalha
    dadosJogador.encontro_pokemon = pokemonSelvagem; 
    
    // Adiciona à Pokédex (vistos)
    let dadosPokemonJogador = await carregarDadosPokemonJogador(senderId);
    if (!dadosPokemonJogador.pokedex.vistos.includes(pokemonSelvagem.especie_id)) {
        dadosPokemonJogador.pokedex.vistos.push(pokemonSelvagem.especie_id);
        await salvarDadosPokemonJogador(senderId, dadosPokemonJogador);
    }
    
    await salvarDadosJogador(senderId, dadosJogador);

    return { success: true, msg: `🌲 Algo se move na relva... É um *${pokemonSelvagem.nome}* selvagem (Nv. ${nivel})!
O que você faz? (${GERAL.PREFIXO_BOT}pkm capturar | ${GERAL.PREFIXO_BOT}pkm batalhar | ${GERAL.PREFIXO_BOT}pkm fugir)` };
}

// Tenta capturar o Pokémon do encontro atual
async function capturarPokemon(senderId, tipoBola = "pokebola") {
    let dadosJogador = await carregarDadosJogador(senderId);
    if (!dadosJogador) return { success: false, msg: `❓ ${GERAL.NOME_BOT} não te reconhece... Registre-se primeiro!` };
    if (!dadosJogador.encontro_pokemon) return { success: false, msg: `💨 O Pokémon selvagem já partiu... Você precisa encontrar outro!` };

    const pokemonSelvagem = dadosJogador.encontro_pokemon;
    const itemBola = normalizar(tipoBola);
    const bolaInfo = ITENS_LOJA.find(i => normalizar(i.nome) === itemBola && i.tipo === "pokebola");

    if (!bolaInfo) {
        return { success: false, msg: `❓ Que tipo de bola é "${tipoBola}"? Use ${GERAL.PREFIXO_BOT}loja para ver as disponíveis.` };
    }

    if (!possuiItem(dadosJogador, itemBola)) {
        return { success: false, msg: `🎒 Você procurou na mochila, mas não encontrou nenhuma ${bolaInfo.nomeExibicao}!` };
    }
    
    // Usa a bola (remove do inventário)
    const remocao = removerItem(dadosJogador, itemBola, 1);
    if (!remocao) return { success: false, msg: `⚙️ ${GERAL.NOME_BOT} Erro: Falha ao usar a ${bolaInfo.nomeExibicao} do inventário!` };
    dadosJogador = remocao; // Atualiza dados do jogador com inventário modificado

    // Fórmula de captura (inspirada em gerações mais recentes)
    const taxaBase = pokemonSelvagem.taxa_captura;
    const hpMax = pokemonSelvagem.stats.hp;
    const hpAtual = pokemonSelvagem.hp_atual;
    const bonusBola = bolaInfo.bonus_captura || 1.0;
    const bonusStatus = 1.0; // TODO: Adicionar bônus para status (sleep=2.5, paralysis/poison/burn=1.5)

    const a = Math.floor((((3 * hpMax - 2 * hpAtual) * taxaBase * bonusBola) / (3 * hpMax)) * bonusStatus);
    const chance = (a >= 255) ? 1 : Math.pow(a / 255, 0.75); // Probabilidade

    let sucesso = Math.random() < chance;
    let msgResultado = `Você arremessou a ${bolaInfo.nomeExibicao} com precisão!
`;

    // Simulação das "balançadas" da pokébola
    if (a < 255) {
        const b = Math.floor(65536 / Math.pow(255 / a, 0.1875));
        let balancadas = 0;
        for (let i = 0; i < 3; i++) {
            if (Math.floor(Math.random() * 65536) < b) {
                balancadas++;
            }
        }
        if (balancadas < 3) sucesso = false;
        
        if (!sucesso) {
            if (balancadas === 0) msgResultado += `💨 Oh não! O *${pokemonSelvagem.nome}* escapou imediatamente!`;
            else if (balancadas === 1) msgResultado += `💨 Aaargh! Quase! O *${pokemonSelvagem.nome}* escapou após uma balançada!`;
            else if (balancadas === 2) msgResultado += `💨 Droga! Tão perto! O *${pokemonSelvagem.nome}* escapou após duas balançadas!`;
        }
    }

    if (sucesso) {
        const dadosPokemonJogador = await carregarDadosPokemonJogador(senderId);
        const novoPokemonCapturado = {
            id_unico: Date.now() + Math.floor(Math.random() * 1000), // ID único
            especie_id: pokemonSelvagem.especie_id,
            nome_apelido: null,
            nivel: pokemonSelvagem.nivel,
            xp_atual: 0, 
            xp_total_nivel: Math.pow(pokemonSelvagem.nivel, 3), // XP acumulado para este nível
            hp_atual: pokemonSelvagem.hp_atual, 
            stats: pokemonSelvagem.stats,
            ivs: pokemonSelvagem.ivs,
            movimentos: pokemonSelvagem.movimentos,
            felicidade: getPokemonDataById(pokemonSelvagem.especie_id)?.felicidade_base || 70, // Felicidade base da espécie
            item_segurado: null
        };

        // Adiciona ao time ou PC
        if (dadosPokemonJogador.time.length < 6) {
            dadosPokemonJogador.time.push(novoPokemonCapturado);
            msgResultado += `
🎉 Gotcha! *${pokemonSelvagem.nome}* (Nv. ${pokemonSelvagem.nivel}) foi capturado com sucesso! Adicionado ao seu time.`;
        } else {
            dadosPokemonJogador.pc.push(novoPokemonCapturado);
            msgResultado += `
🎉 Gotcha! *${pokemonSelvagem.nome}* (Nv. ${pokemonSelvagem.nivel}) foi capturado com sucesso! Enviado para o PC (Seu time está cheio).`;
        }
        
        // Adiciona à Pokédex (capturados)
        if (!dadosPokemonJogador.pokedex.capturados.includes(novoPokemonCapturado.especie_id)) {
            dadosPokemonJogador.pokedex.capturados.push(novoPokemonCapturado.especie_id);
        }
        
        await salvarDadosPokemonJogador(senderId, dadosPokemonJogador);
        dadosJogador.encontro_pokemon = null; // Limpa o encontro

    } else {
        // Mensagem de falha já adicionada na simulação das balançadas
        // O Pokémon pode fugir após uma tentativa falha?
        // if (Math.random() < 0.3) { // 30% chance de fugir
        //     msgResultado += `\nO *${pokemonSelvagem.nome}* selvagem fugiu assustado!`;
        //     dadosJogador.encontro_pokemon = null; 
        // }
    }

    await salvarDadosJogador(senderId, dadosJogador); // Salva o inventário atualizado e o estado do encontro
    return { success: sucesso, msg: msgResultado };
}

// Adiciona XP a um Pokémon específico e retorna o objeto Pokémon atualizado (sem salvar)
function adicionarXPPokemon(pokemon, xpGanho) {
    if (pokemon.nivel >= 100) return { pokemon, mensagens: [] }; // Já está no nível máximo

    const pokemonBase = getPokemonDataById(pokemon.especie_id);
    if (!pokemonBase) return { pokemon, mensagens: [`⚙️ ${GERAL.NOME_BOT} Erro: Dados base para ${pokemon.especie_id} não encontrados.`] };

    let mensagens = [];
    pokemon.xp_atual += xpGanho;
    pokemon.xp_total_nivel += xpGanho;
    mensagens.push(`✨ *${pokemon.nome_apelido || pokemonBase.nome_exibicao}* ganhou ${xpGanho} pontos de experiência!`);

    // Verifica se subiu de nível
    let xpNecessario = xpParaProximoNivel(pokemon.nivel);
    while (pokemon.xp_atual >= xpNecessario && pokemon.nivel < 100) {
        pokemon.nivel++;
        pokemon.xp_atual -= xpNecessario;
        mensagens.push(`
🎉🎊 NÍVEL ACIMA! 🎊🎉
*${pokemon.nome_apelido || pokemonBase.nome_exibicao}* alcançou o nível ${pokemon.nivel}!`);

        // Recalcula stats ao subir de nível
        const statsAntigos = { ...pokemon.stats };
        pokemon.stats = calcularStats(pokemonBase, pokemon.nivel, pokemon.ivs);
        // Recupera HP ao subir de nível (opcional)
        // pokemon.hp_atual = pokemon.stats.hp; 
        mensagens.push(`HP: ${statsAntigos.hp} -> ${pokemon.stats.hp} (+${pokemon.stats.hp - statsAntigos.hp})`);
        mensagens.push(`Atk: ${statsAntigos.attack} -> ${pokemon.stats.attack} (+${pokemon.stats.attack - statsAntigos.attack})`);
        mensagens.push(`Def: ${statsAntigos.defense} -> ${pokemon.stats.defense} (+${pokemon.stats.defense - statsAntigos.defense})`);
        mensagens.push(`Sp.Atk: ${statsAntigos["special-attack"]} -> ${pokemon.stats["special-attack"]} (+${pokemon.stats["special-attack"] - statsAntigos["special-attack"]})`);
        mensagens.push(`Sp.Def: ${statsAntigos["special-defense"]} -> ${pokemon.stats["special-defense"]} (+${pokemon.stats["special-defense"] - statsAntigos["special-defense"]})`);
        mensagens.push(`Speed: ${statsAntigos.speed} -> ${pokemon.stats.speed} (+${pokemon.stats.speed - statsAntigos.speed})`);


        // Verifica novos movimentos
        const novosMovimentos = obterMovimentosNivel(pokemonBase, pokemon.nivel);
        if (novosMovimentos.length > 0) {
            for (const moveName of novosMovimentos) {
                const moveData = getMoveDataByName(moveName);
                if (moveData) {
                    if (!pokemon.movimentos.includes(moveName)) {
                         if (pokemon.movimentos.length < 4) {
                            pokemon.movimentos.push(moveName);
                            mensagens.push(`
💡 Aprendeu um novo movimento: *${moveData.nome_exibicao}*!`);
                        } else {
                            // TODO: Implementar lógica para substituir movimentos
                            mensagens.push(`
❓ *${pokemon.nome_apelido || pokemonBase.nome_exibicao}* tentou aprender *${moveData.nome_exibicao}*, mas já conhece 4 movimentos! Use ${GERAL.PREFIXO_BOT}pkm moves para gerenciar.`);
                        }
                    }
                } else {
                     mensagens.push(`⚙️ ${GERAL.NOME_BOT} Aviso: Tentou aprender movimento desconhecido: ${moveName}`);
                }
            }
        }
        
        if (pokemon.nivel >= 100) break; // Nível máximo
        xpNecessario = xpParaProximoNivel(pokemon.nivel);
    }
    return { pokemon, mensagens };
}

// Verifica e executa a evolução de um Pokémon (chamado após level up ou uso de item)
async function verificarEvolucao(senderId, idUnico) {
    let dadosPokemonJogador = await carregarDadosPokemonJogador(senderId);
    const localizacao = encontrarPokemonPorIdUnico(dadosPokemonJogador, idUnico);
    if (!localizacao) return { sucesso: false, msg: "Pokémon não encontrado." };

    let { pokemon, local, index } = localizacao;
    const pokemonBase = getPokemonDataById(pokemon.especie_id);
    if (!pokemonBase || !pokemonBase.evolucoes || pokemonBase.evolucoes.length === 0) {
        return { sucesso: false, msg: "Este Pokémon não tem evoluções conhecidas ou não pode evoluir mais." };
    }

    let evoluiu = false;
    let msgEvolucao = "";

    for (const evo of pokemonBase.evolucoes) {
        let podeEvoluir = false;
        let itemConsumido = null;

        // Verifica condições de evolução
        switch (evo.metodo) {
            case "level-up":
                if (evo.nivel && pokemon.nivel >= evo.nivel) {
                    // Condições adicionais (ex: item segurado, hora do dia)
                    if (evo.item_segurado && pokemon.item_segurado !== evo.item_segurado) continue;
                    if (evo.hora_do_dia) { /* TODO: Verificar hora */ } 
                    podeEvoluir = true;
                }
                break;
            case "trade":
                // Evolução por troca precisa ser iniciada por outro comando
                continue;
            case "use-item":
                // Precisa ser iniciado pelo comando de usar item
                continue;
            case "shed": // Caso especial Shedinja
                // TODO: Implementar lógica específica (espaço no time, pokébola)
                continue;
            // TODO: Adicionar outros métodos (happiness, move_type, etc.)
        }

        if (podeEvoluir) {
            const novaEspecieBase = getPokemonDataById(evo.para);
            if (!novaEspecieBase) {
                console.error(`${GERAL.NOME_BOT} Erro: Espécie de evolução ${evo.para} não encontrada na DB.`);
                continue;
            }

            msgEvolucao = `
✨✨✨ O QUÊ?! ✨✨✨
*${pokemon.nome_apelido || pokemonBase.nome_exibicao}* está brilhando intensamente... Está evoluindo!`;
            
            // Atualiza os dados do Pokémon
            pokemon.especie_id = novaEspecieBase.id;
            // Mantém apelido, IVs, XP, felicidade, item (se não consumido)
            // Recalcula stats para o novo nível e espécie
            pokemon.stats = calcularStats(novaEspecieBase, pokemon.nivel, pokemon.ivs);
            // Recupera HP na evolução?
            pokemon.hp_atual = pokemon.stats.hp;
            
            // Atualiza na lista (time ou pc)
            dadosPokemonJogador[local][index] = pokemon;
            await salvarDadosPokemonJogador(senderId, dadosPokemonJogador);

            msgEvolucao += `

🎉 PARABÉNS! 🎉
Seu Pokémon evoluiu para um magnífico *${novaEspecieBase.nome_exibicao}*!`;
            evoluiu = true;

            // Adiciona nova espécie à Pokédex
            if (!dadosPokemonJogador.pokedex.vistos.includes(novaEspecieBase.id)) {
                dadosPokemonJogador.pokedex.vistos.push(novaEspecieBase.id);
            }
             if (!dadosPokemonJogador.pokedex.capturados.includes(novaEspecieBase.id)) {
                dadosPokemonJogador.pokedex.capturados.push(novaEspecieBase.id);
            }
            await salvarDadosPokemonJogador(senderId, dadosPokemonJogador); // Salva pokedex atualizada

            break; // Para após a primeira evolução bem-sucedida
        }
    }

    if (evoluiu) {
        return { sucesso: true, msg: msgEvolucao };
    } else {
        // Não retorna mensagem se não evoluiu por nível, pois é verificado a cada level up
        return { sucesso: false, msg: "" }; 
    }
}

// Função para usar um item de evolução
async function usarItemEvolucao(senderId, idUnico, nomeItem) {
    let dadosJogador = await carregarDadosJogador(senderId);
    let dadosPokemonJogador = await carregarDadosPokemonJogador(senderId);
    const localizacao = encontrarPokemonPorIdUnico(dadosPokemonJogador, idUnico);
    
    if (!localizacao) return { sucesso: false, msg: `❓ Pokémon com ID ${idUnico} não encontrado.` };
    
    const itemInfo = ITENS_LOJA.find(i => normalizar(i.nome) === normalizar(nomeItem) && i.tipo === "pedra_evolucao");
    if (!itemInfo) return { sucesso: false, msg: `❓ Item "${nomeItem}" não é uma pedra de evolução válida.` };
    
    if (!possuiItem(dadosJogador, itemInfo.nome)) return { sucesso: false, msg: `🎒 Você não possui ${itemInfo.nomeExibicao}.` };

    let { pokemon, local, index } = localizacao;
    const pokemonBase = getPokemonDataById(pokemon.especie_id);
    if (!pokemonBase || !pokemonBase.evolucoes || pokemonBase.evolucoes.length === 0) {
        return { sucesso: false, msg: `🤔 *${pokemon.nome_apelido || pokemonBase.nome_exibicao}* não parece reagir a ${itemInfo.nomeExibicao}.` };
    }

    const itemNormalizado = normalizar(itemInfo.nome);
    const evolucaoPorItem = pokemonBase.evolucoes.find(evo => evo.metodo === "use-item" && evo.item === itemNormalizado);

    if (!evolucaoPorItem) {
        return { sucesso: false, msg: `🤔 *${pokemon.nome_apelido || pokemonBase.nome_exibicao}* não evolui com ${itemInfo.nomeExibicao}.` };
    }

    const novaEspecieBase = getPokemonDataById(evolucaoPorItem.para);
    if (!novaEspecieBase) {
        console.error(`${GERAL.NOME_BOT} Erro: Espécie de evolução ${evolucaoPorItem.para} não encontrada na DB.`);
        return { sucesso: false, msg: `⚙️ ${GERAL.NOME_BOT} Erro: Falha interna ao encontrar dados da evolução.` };
    }

    // Consome o item
    const remocao = removerItem(dadosJogador, itemInfo.nome, 1);
    if (!remocao) return { sucesso: false, msg: `⚙️ ${GERAL.NOME_BOT} Erro: Falha ao usar ${itemInfo.nomeExibicao} do inventário.` };
    await salvarDadosJogador(senderId, remocao); // Salva inventário

    let msgEvolucao = `✨ Você usou ${itemInfo.nomeExibicao} em *${pokemon.nome_apelido || pokemonBase.nome_exibicao}*...

✨✨✨ O QUÊ?! ✨✨✨
*${pokemon.nome_apelido || pokemonBase.nome_exibicao}* está brilhando intensamente... Está evoluindo!`;

    // Atualiza os dados do Pokémon
    pokemon.especie_id = novaEspecieBase.id;
    pokemon.stats = calcularStats(novaEspecieBase, pokemon.nivel, pokemon.ivs);
    pokemon.hp_atual = pokemon.stats.hp;
    
    // Atualiza na lista (time ou pc)
    dadosPokemonJogador[local][index] = pokemon;
    
    // Adiciona nova espécie à Pokédex
    if (!dadosPokemonJogador.pokedex.vistos.includes(novaEspecieBase.id)) {
        dadosPokemonJogador.pokedex.vistos.push(novaEspecieBase.id);
    }
    if (!dadosPokemonJogador.pokedex.capturados.includes(novaEspecieBase.id)) {
        dadosPokemonJogador.pokedex.capturados.push(novaEspecieBase.id);
    }
    await salvarDadosPokemonJogador(senderId, dadosPokemonJogador);

    msgEvolucao += `

🎉 PARABÉNS! 🎉
Seu Pokémon evoluiu para um magnífico *${novaEspecieBase.nome_exibicao}*!`;

    return { sucesso: true, msg: msgEvolucao };
}


// --- Funções de Comando (Exemplos) ---

async function verTime(senderId) {
    const dadosPokemon = await carregarDadosPokemonJogador(senderId);
    if (dadosPokemon.time.length === 0) {
        return { msg: `🎒 Seu time Pokémon está vazio. Capture alguns Pokémon para começar sua jornada! (${GERAL.PREFIXO_BOT}pkm encontrar)` };
    }
    let msg = `🔰 --- Seu Time Pokémon Atual --- 🔰
`;
    dadosPokemon.time.forEach((p, index) => {
        const base = getPokemonDataById(p.especie_id);
        msg += `
${index + 1}. *${p.nome_apelido || base?.nome_exibicao || "Pokémon Desconhecido"}* (Nv. ${p.nivel})
   HP: ${p.hp_atual} / ${p.stats?.hp || "?"}
   Item: ${p.item_segurado || "Nenhum"}`; 
        // TODO: Adicionar status (ex: PAR, SLP)
    });
    msg += `

Use ${GERAL.PREFIXO_BOT}pkm info [numero] para mais detalhes.`;
    return { msg: msg.trim() };
}

async function verPC(senderId, pagina = 1) {
    const dadosPokemon = await carregarDadosPokemonJogador(senderId);
    if (dadosPokemon.pc.length === 0) {
        return { msg: `🖥️ Seu PC Pokémon está vazio. Capture mais Pokémon!` };
    }
    // TODO: Implementar paginação
    let msg = `🖥️ --- Seu PC Pokémon (Caixa 1) --- 🖥️
`;
    dadosPokemon.pc.forEach((p, index) => {
        const base = getPokemonDataById(p.especie_id);
        msg += `${index + 1}. *${p.nome_apelido || base?.nome_exibicao || "Pokémon Desconhecido"}* (Nv. ${p.nivel})
`;
    });
     msg += `
Use ${GERAL.PREFIXO_BOT}pkm info [ID_Unico_do_PC] para mais detalhes.`; // Precisa de um jeito de referenciar os do PC
    return { msg: msg.trim() };
}

async function verDetalhesPokemon(senderId, idOuNumeroTime) {
    const dadosPokemon = await carregarDadosPokemonJogador(senderId);
    let pokemonInfo = null;
    let idUnico = null;
    
    // Tenta encontrar pelo número do time
    const numeroTime = parseInt(idOuNumeroTime);
    if (!isNaN(numeroTime) && numeroTime > 0 && numeroTime <= dadosPokemon.time.length) {
        pokemonInfo = { pokemon: dadosPokemon.time[numeroTime - 1], local: 'time', index: numeroTime - 1 };
        idUnico = pokemonInfo.pokemon.id_unico;
    } else {
        // Tenta encontrar pelo ID único (pode ser do PC)
        // Assume que idOuNumeroTime é o ID único se não for número do time
        idUnico = idOuNumeroTime; 
        pokemonInfo = encontrarPokemonPorIdUnico(dadosPokemon, idUnico);
    }

    if (!pokemonInfo) {
        return { msg: `❓ Pokémon "${idOuNumeroTime}" não encontrado no seu time ou PC. Verifique o número ou ID.` };
    }

    const { pokemon } = pokemonInfo;
    const base = getPokemonDataById(pokemon.especie_id);
    if (!base) return { msg: `⚙️ ${GERAL.NOME_BOT} Erro: Falha ao obter dados base do Pokémon.` };

    let msg = `📊 --- Detalhes de ${pokemon.nome_apelido || base.nome_exibicao} --- 📊
`;
    msg += `🆔 ID Único: ${pokemon.id_unico}
`; // Mostra ID único para referência
    msg += `🐾 Espécie: ${base.nome_exibicao} (#${base.id})
`;
    msg += `📈 Nível: ${pokemon.nivel}
`;
    msg += `✨ XP Atual: ${pokemon.xp_atual} / ${xpParaProximoNivel(pokemon.nivel)} (Próx. Nível)
`;
    msg += `❤️ HP: ${pokemon.hp_atual} / ${pokemon.stats.hp}
`;
    msg += `🧬 Tipos: ${base.tipos.join(", ")}
`;
    msg += `💪 Stats:
`;
    msg += `   Ataque: ${pokemon.stats.attack}
`;
    msg += `   Defesa: ${pokemon.stats.defense}
`;
    msg += `   Ataque Especial: ${pokemon.stats["special-attack"]}
`;
    msg += `   Defesa Especial: ${pokemon.stats["special-defense"]}
`;
    msg += `   Velocidade: ${pokemon.stats.speed}
`;
    // msg += `🧬 IVs: (HP:${pokemon.ivs.hp}, Atk:${pokemon.ivs.attack}, Def:${pokemon.ivs.defense}, SpAtk:${pokemon.ivs["special-attack"]}, SpDef:${pokemon.ivs["special-defense"]}, Spd:${pokemon.ivs.speed})
`; // Mostrar IVs?
    msg += `😊 Felicidade: ${pokemon.felicidade || "?"}/255
`;
    msg += `🎒 Item Segurado: ${pokemon.item_segurado || "Nenhum"}
`;
    msg += `⚔️ Movimentos:
`;
    if (pokemon.movimentos && pokemon.movimentos.length > 0) {
        pokemon.movimentos.forEach(moveName => {
            const moveData = getMoveDataByName(moveName);
            msg += `   - ${moveData?.nome_exibicao || moveName} (${moveData?.tipo || "?"}, PP: ${moveData?.pp || "?"})\n`; // TODO: Mostrar PP atual
        });
    } else {
        msg += `   (Nenhum movimento aprendido)\n`;
    }
    // TODO: Adicionar informações de evolução

    return { msg: msg.trim() };
}

module.exports = {
    carregarDadosPokemonJogador,
    salvarDadosPokemonJogador,
    encontrarPokemonSelvagem,
    capturarPokemon,
    adicionarXPPokemon, // Retorna objeto atualizado, não salva diretamente
    verificarEvolucao, // Salva internamente
    usarItemEvolucao, // Salva internamente
    verTime,
    verPC,
    verDetalhesPokemon,
    getPokemonDataById, // Exporta para uso em outros módulos (batalha)
    getMoveDataByName // Exporta para uso em outros módulos (batalha)
};

