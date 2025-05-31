/*
 * Handler Principal do RPG - RPG Nazuna
 * Recebe comandos do rpg_cases.js e direciona para os módulos corretos.
 * 
 * Criado originalmente por: Hiudy
 * 
 * Manter créditos ao criar ou modificar!
 */

// Importações dos Módulos
const player = require("./rpg_modules/player");
const inventory = require("./rpg_modules/inventory");
const economy = require("./rpg_modules/economy");
const activities = require("./rpg_modules/activities");
const pets = require("./rpg_modules/pets"); // Assumindo que existe ou será criado
const combat_pve = require("./rpg_modules/combat_pve");
const ranking = require("./rpg_modules/ranking");
const guilds = require("./rpg_modules/guilds_core");
const missions = require("./rpg_modules/missions");
const pokemon_core = require("./rpg_modules/pokemon_core");
const pokemon_battle = require("./rpg_modules/pokemon_battle");
const relationships = require("./rpg_modules/relationships");
const creator_hub = require("./rpg_modules/creator_hub");
const crafting = require("./rpg_modules/crafting");
const housing = require("./rpg_modules/housing");
const combat_pvp = require("./rpg_modules/combat_pvp");
const { normalizar } = require("./rpg_modules/utils");

// Função principal para processar comandos do RPG
async function processarComandoRPG(senderId, command, args, pushname, funcoesExternas = {}) {
    const { upload, getFileBuffer, m } = funcoesExternas; // Recebe funções externas
    const q = args.join(" "); // Recria a string de argumentos

    try {
        // Comandos que não exigem registro
        if (command === "registrar" || command === "rg") {
            return await player.registrarJogador(senderId, pushname);
        }
        if (command === "ajuda" || command === "help" || command === "comandos") {
            // Por enquanto, pode retornar uma mensagem genérica ou depender do menu
            return { msg: "Use .menurpg para ver todos os comandos disponíveis!" };
        }

        // Verifica se o jogador está registrado para os demais comandos
        const dadosJogador = await player.carregarDadosJogador(senderId);
        if (!dadosJogador) {
            return { msg: "⚠️ Você ainda não se registrou no RPG! Use `.registrar` para começar sua aventura." };
        }

        // Atualiza o nome do jogador se mudou
        if (pushname && dadosJogador.nome !== pushname) {
            dadosJogador.nome = pushname;
            await player.salvarDadosJogador(senderId, dadosJogador);
        }

        // Switch principal para direcionar comandos
        switch (command) {
            // --- Player ---
            case "perfil":
            case "profile":
            case "status":
            case "me":
                const alvoPerfil = args[0] ? args[0].replace("@", "") + "@s.whatsapp.net" : senderId;
                return await player.verPerfil(alvoPerfil);
            case "deletarconta":
                // Adicionar confirmação?
                return await player.deletarConta(senderId);

            // --- Inventory ---
            case "inventario":
            case "inv":
            case "mochila":
                return await inventory.verInventario(senderId);
            case "equipar": // Se implementado
                // Implementar lógica de equipar item
                return { msg: "Comando equipar ainda não implementado." };
            case "desequipar": // Se implementado
                // Implementar lógica de desequipar item
                return { msg: "Comando desequipar ainda não implementado." };
            case "usar": // Se implementado
                // Implementar lógica de usar item
                return { msg: "Comando usar ainda não implementado." };

            // --- Economy ---
            case "empregos":
            case "jobs":
                return await economy.listarEmpregos();
            case "entrar":
                if (!args[0]) return { msg: "Use `.entrar <nome_emprego>`" };
                return await economy.entrarEmprego(senderId, args.join(" "));
            case "sair":
            case "demitir":
                return await economy.sairEmprego(senderId);
            case "trabalhar":
            case "work":
                return await economy.trabalhar(senderId);
            case "loja":
            case "shop":
            case "mercado":
                return await economy.verLoja(args[0]); // args[0] pode ser categoria
            case "comprar":
            case "buy":
                if (args.length < 1) return { msg: "Use `.comprar <item> [quantidade]`" };
                const qtddComprar = args.length > 1 && !isNaN(parseInt(args[args.length - 1])) ? parseInt(args.pop()) : 1;
                const itemComprar = args.join(" ");
                return await economy.comprarItem(senderId, itemComprar, qtddComprar);
            case "vender":
            case "sell":
                if (args.length < 1) return { msg: "Use `.vender <item> [quantidade]`" };
                const qtddVender = args.length > 1 && !isNaN(parseInt(args[args.length - 1])) ? parseInt(args.pop()) : 1;
                const itemVender = args.join(" ");
                return await economy.venderItem(senderId, itemVender, qtddVender);
            case "depositar":
            case "dep":
                if (!args[0] || isNaN(parseInt(args[0]))) return { msg: "Use `.depositar <valor>`" };
                return await economy.depositarBanco(senderId, parseInt(args[0]));
            case "levantar":
            case "sacar":
            case "withdraw":
                if (!args[0] || isNaN(parseInt(args[0]))) return { msg: "Use `.sacar <valor>`" };
                return await economy.sacarBanco(senderId, parseInt(args[0]));

            // --- Activities ---
            case "minerar":
            case "mine":
                return await activities.minerar(senderId);
            case "pescar":
            case "fish":
                return await activities.pescar(senderId);
            case "cacar":
            case "hunt":
                return await activities.cacar(senderId);
            case "plantar":
            case "farm":
                return await activities.plantar(senderId);
            case "cortar":
            case "chop":
            case "lenhar":
                return await activities.cortarLenha(senderId);

            // --- Pets ---
            case "adotar":
                if (!args[0]) return { msg: "Use `.adotar <nome_pet>` para adotar um pet da loja." };
                return await pets.comprarPet(senderId, args.join(" "));
            case "verpet":
            case "pet":
                return await pets.verPet(senderId);
            case "alimentar":
            case "feed":
                return await pets.alimentarPet(senderId);
            case "interagir":
            case "brincar":
                return await pets.interagirPet(senderId);
            case "renomearpet":
            case "apelidarpet":
                if (!args[0]) return { msg: "Use `.renomearpet <novo_apelido>` para renomear seu pet." };
                return await pets.renomearPet(senderId, args.join(" "));

            // --- Combat PvE ---
            case "batalhar":
            case "lutar":
            case "huntmonster":
                const monstroAlvo = args.join(" ") || null;
                return await combat_pve.iniciarBatalha(senderId, monstroAlvo);
            case "pocao":
            case "potion":
                if (!args[0]) return { msg: "Use `.pocao <nome_pocao>`" };
                return await combat_pve.usarPocao(senderId, args.join(" "));
            case "atacar": // Dentro da batalha
                return await combat_pve.atacar(senderId);
            case "fugir": // Dentro da batalha
                return await combat_pve.fugir(senderId);

            // --- Ranking ---
            case "rank":
            case "ranking":
            case "top":
                const tipoRank = args[0] || "nivel"; // rank nivel, dinheiro, etc.
                return await ranking.verRanking(tipoRank);

            // --- Guilds ---
            case "guilda":
            case "guild":
                const subComandoGuilda = args[0] ? normalizar(args[0]) : "ver";
                const argGuilda1 = args[1];
                const argGuilda2 = args[2];
                switch (subComandoGuilda) {
                    case "criar":
                        if (!argGuilda1) return { msg: "Use `.guilda criar <nome_da_guilda>`" };
                        return await guilds.criarGuilda(senderId, args.slice(1).join(" "));
                    case "entrar":
                        if (!argGuilda1) return { msg: "Use `.guilda entrar <nome_da_guilda>`" };
                        return await guilds.entrarGuilda(senderId, args.slice(1).join(" "));
                    case "sair":
                        return await guilds.sairGuilda(senderId);
                    case "ver":
                        const nomeGuildaVer = args.slice(1).join(" ") || null;
                        return await guilds.verGuilda(senderId, nomeGuildaVer);
                    case "membros":
                        return await guilds.listarMembrosGuilda(senderId);
                    // Adicionar outros subcomandos (promover, expulsar, depositar, guerra, etc.)
                    default:
                        return { msg: "Subcomando de guilda inválido. Use: criar, entrar, sair, ver, membros..." };
                }

            // --- Missions ---
            case "missao":
            case "quest":
                const subComandoMissao = args[0] ? normalizar(args[0]) : "disponiveis";
                const argMissao1 = args.slice(1).join(" ");
                switch (subComandoMissao) {
                    case "disponiveis":
                    case "listar":
                        return await missions.listarMissoesDisponiveis(senderId);
                    case "ativas":
                        return await missions.listarMissoesAtivas(senderId);
                    case "iniciar":
                    case "aceitar":
                        if (!argMissao1) return { msg: "Use `.missao iniciar <id_ou_nome_missao>`" };
                        return await missions.iniciarMissao(senderId, argMissao1);
                    case "completar":
                    case "entregar":
                        if (!argMissao1) return { msg: "Use `.missao completar <id_ou_nome_missao>`" };
                        return await missions.completarMissao(senderId, argMissao1);
                    // case "abandonar":
                    default:
                        return { msg: "Subcomando de missão inválido. Use: disponiveis, ativas, iniciar, completar..." };
                }

            // --- Pokémon ---
            case "pkm_encontrar":
                const localEncontro = args.join(" ") || "Rota Inicial";
                return await pokemon_core.encontrarPokemonSelvagem(senderId, localEncontro);
            case "pkm_capturar":
                const tipoBola = args.join(" ") || "Pokebola";
                return await pokemon_core.capturarPokemon(senderId, tipoBola);
            case "pkm_time":
                return await pokemon_core.verTimePokemon(senderId);
            case "pkm_pc":
                const paginaPC = args[0] ? parseInt(args[0]) : 1;
                return await pokemon_core.verPC(senderId, paginaPC);
            case "pkm_pokedex":
                 return await pokemon_core.verPokedex(senderId);
            case "pkm_batalhar": // Inicia batalha contra selvagem
                return await pokemon_battle.iniciarBatalhaSelvagem(senderId);
            case "pkm_fugir": // Foge da batalha selvagem
                return await pokemon_battle.fugirBatalhaSelvagem(senderId);
            case "pkm_lutar": // Comando dentro da batalha
                if (!args[0]) return { msg: "Use `.pkm_lutar <numero_movimento>`" };
                return await pokemon_battle.usarMovimento(senderId, parseInt(args[0]) - 1);
            case "pkm_ataque": // Alias para pkm_lutar
                 if (!args[0]) return { msg: "Use `.pkm_ataque <numero_movimento>`" };
                 return await pokemon_battle.usarMovimento(senderId, parseInt(args[0]) - 1);
            case "pkm_trocar": // Troca Pokémon na batalha
                if (!args[0]) return { msg: "Use `.pkm_trocar <numero_pokemon_time>`" };
                return await pokemon_battle.trocarPokemonBatalha(senderId, parseInt(args[0]) - 1);
            case "pkm_item": // Usa item na batalha
                if (!args[0]) return { msg: "Use `.pkm_item <nome_item>`" };
                return await pokemon_battle.usarItemBatalha(senderId, args.join(" "));
            // case "pkm_evoluir": // Se evolução por item for manual
            // case "pkm_apelido":
            // case "pkm_moves":

            // --- Relationships ---
            case "conversar":
                if (!args[0]) return { msg: "Use `.conversar <nome_npc>`" };
                return await relationships.conversarComNpc(senderId, args.join(" "));
            case "presentear":
                if (args.length < 2) return { msg: "Use `.presentear <nome_npc> <nome_item> [quantidade]`" };
                const qtddPresente = args.length > 2 && !isNaN(parseInt(args[args.length - 1])) ? parseInt(args.pop()) : 1;
                const itemPresente = args.pop();
                const npcPresente = args.join(" ");
                return await relationships.presentearNpc(senderId, npcPresente, itemPresente, qtddPresente);
            case "afinidade":
                if (!args[0]) return { msg: "Use `.afinidade <nome_npc>`" };
                return await relationships.verAfinidade(senderId, args.join(" "));
            case "namorar":
                if (!args[0]) return { msg: "Use `.namorar <nome_npc>`" };
                return await relationships.iniciarNamoro(senderId, args.join(" "));
            case "casar":
                if (!args[0]) return { msg: "Use `.casar <nome_npc>`" };
                return await relationships.iniciarCasamento(senderId, args.join(" "));

            // --- Creator Hub ---
            case "criador":
                const subComandoCriador = args[0] ? normalizar(args[0]) : "perfil"; // Default action?
                const argCriador1 = args[1];
                const argCriadorRest = args.slice(1).join(" ");
                const argCriadorRest2 = args.slice(2).join(" ");
                switch (subComandoCriador) {
                    case "ativar":
                        if (!argCriador1 || isNaN(parseInt(argCriador1))) return { msg: "Use `.criador ativar <taxa_mensal>`" };
                        return await creator_hub.ativarPerfilCriador(senderId, parseInt(argCriador1));
                    case "postar":
                        // Passa funcoesExternas para postarConteudo
                        return await creator_hub.postarConteudo(senderId, argCriadorRest, funcoesExternas);
                    case "subscrever":
                    case "assinar":
                        if (!argCriador1) return { msg: "Use `.criador subscrever <nome_criador>`" };
                        return await creator_hub.subscreverCriador(senderId, argCriadorRest);
                    case "cancelar":
                        if (!argCriador1) return { msg: "Use `.criador cancelar <nome_criador>`" };
                        return await creator_hub.cancelarSubscricao(senderId, argCriadorRest);
                    // case "gorjeta":
                    // case "perfil": // Ver perfil de um criador
                    default:
                        return { msg: "Subcomando de criador inválido. Use: ativar, postar, subscrever, cancelar, feed..." };
                }
            case "feed":
                if (!args[0]) return { msg: "Use `.feed <nome_criador> [pagina]`" };
                const paginaFeed = args[1] ? parseInt(args[1]) : 1;
                return await creator_hub.verFeed(senderId, args[0], paginaFeed);

            // --- Crafting ---
            case "craft":
            case "criar": // Alias?
                const subComandoCraft = args[0] ? normalizar(args[0]) : "listar";
                const argCraft1 = args[1];
                const argCraft2 = args[2];
                switch (subComandoCraft) {
                    case "listar":
                        return await crafting.listarReceitas(senderId);
                    case "criar":
                        if (!argCraft1) return { msg: "Use `.craft criar <id_ou_nome_receita> [quantidade]`" };
                        const qtddCraft = argCraft2 ? parseInt(argCraft2) : 1;
                        return await crafting.criarItem(senderId, argCraft1, qtddCraft);
                    default:
                        return { msg: "Subcomando de craft inválido. Use: listar, criar..." };
                }

            // --- Housing ---
            case "casa":
                const subComandoCasa = args[0] ? normalizar(args[0]) : "ver";
                const argCasa1 = args.slice(1).join(" ");
                switch (subComandoCasa) {
                    case "listar":
                        return await housing.listarCasas(senderId);
                    case "comprar":
                        if (!argCasa1) return { msg: "Use `.casa comprar <id_ou_nome_casa>`" };
                        return await housing.comprarCasa(senderId, argCasa1);
                    case "ver":
                        return await housing.verCasa(senderId);
                    // case "vender":
                    // case "decorar":
                    // case "removerdecoracao":
                    default:
                        return { msg: "Subcomando de casa inválido. Use: listar, comprar, ver..." };
                }

            // --- Combat PvP ---
            case "pvp":
                const subComandoPvP = args[0] ? normalizar(args[0]) : "status";
                const alvoPvPId = args[1] ? args[1].replace("@", "") + "@s.whatsapp.net" : null;
                switch (subComandoPvP) {
                    case "desafiar":
                        if (!alvoPvPId) return { msg: "Use `.pvp desafiar @jogador`" };
                        return await combat_pvp.desafiarJogador(senderId, alvoPvPId);
                    case "aceitar":
                        if (!alvoPvPId) return { msg: "Use `.pvp aceitar @desafiante`" };
                        return await combat_pvp.aceitarDesafio(senderId, alvoPvPId);
                    case "recusar":
                        if (!alvoPvPId) return { msg: "Use `.pvp recusar @desafiante`" };
                        return await combat_pvp.recusarDesafio(senderId, alvoPvPId);
                    case "atacar":
                        return await combat_pvp.atacarPvP(senderId);
                    case "fugir":
                        return await combat_pvp.fugirPvP(senderId);
                    // case "status": // Ver batalha atual
                    // case "rank": // Ver ranking PvP
                    default:
                        return { msg: "Subcomando PvP inválido. Use: desafiar, aceitar, recusar, atacar, fugir..." };
                }

            // --- Default --- 
            default:
                // Se chegou aqui, o comando está no rpgCommandsSet mas não foi tratado
                console.warn(`Comando RPG não tratado no handler: ${command}`);
                return { msg: `❓ Comando RPG "${command}" ainda não implementado ou inválido.` };
        }

    } catch (error) {
        console.error(`Erro GERAL no processarComandoRPG para ${senderId} (${command}):`, error);
        return { msg: "⚔️ Ocorreu um erro catastrófico no reino do RPG! Os deuses estão investigando. Tente novamente mais tarde. 💔" };
    }
}

module.exports = {
    processarComandoRPG
};

