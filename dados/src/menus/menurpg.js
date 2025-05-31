/**
 * Menu de RPG (Atualizado)
 * @module menurpg
 * @param {string} prefix - Prefixo dos comandos do bot
 * @param {string} [botName="MeuBot"] - Nome do bot
 * @param {string} [userName="Usuário"] - Nome do usuário
 * @returns {Promise<string>} Menu formatado com comandos de RPG
 * @description Lista os comandos relacionados ao sistema de RPG Nazuna.
 */
async function menuRpg(prefix, botName = "MeuBot", userName = "Usuário") {
  return `
╭═══ 🌸 ${botName} 🌸 ═══╮
│ Olá, ${userName}!
╰══════════════════════╯

╭═══ ⚔️ RPG NAZUNA ⚔️ ═══╮
│ Bem-vindo(a) à aventura!
│
│╭─▸ Sua Jornada (Jogador):
││
││◕⁠➜ ${prefix}registrar / ${prefix}rg
││    ↳ Comece sua aventura!
││◕⁠➜ ${prefix}perfil / ${prefix}me
││    ↳ Veja seu status ou de @outro.
││◕⁠➜ ${prefix}deletarconta
││    ↳ Apague seu personagem (cuidado!).
│
│╭─▸ Economia & Finanças:
││
││◕⁠➜ ${prefix}empregos / ${prefix}jobs
││    ↳ Veja os empregos disponíveis.
││◕⁠➜ ${prefix}entrar <emprego>
││    ↳ Consiga um novo emprego.
││◕⁠➜ ${prefix}sair / ${prefix}demitir
││    ↳ Peça demissão.
││◕⁠➜ ${prefix}trabalhar / ${prefix}work
││    ↳ Ganhe seu sustento.
││◕⁠➜ ${prefix}loja [categoria]
││    ↳ Visite o mercado.
││◕⁠➜ ${prefix}comprar <item> [qtd]
││    ↳ Adquira novos itens.
││◕⁠➜ ${prefix}vender <item> [qtd]
││    ↳ Venda seus pertences.
││◕⁠➜ ${prefix}depositar <valor>
││    ↳ Guarde ouro no banco.
││◕⁠➜ ${prefix}sacar <valor>
││    ↳ Retire ouro do banco.
│
│╭─▸ Inventário & Equipamentos:
││
││◕⁠➜ ${prefix}inventario / ${prefix}inv
││    ↳ Verifique sua mochila.
││    ↳ (Equipar/Usar em breve!)
│
│╭─▸ Atividades & Coleta:
││
││◕⁠➜ ${prefix}minerar / ${prefix}mine
││    ↳ Extraia minérios valiosos.
││◕⁠➜ ${prefix}pescar / ${prefix}fish
││    ↳ Busque tesouros aquáticos.
││◕⁠➜ ${prefix}cacar / ${prefix}hunt
││    ↳ Cace feras e colete recursos.
││◕⁠➜ ${prefix}cortar / ${prefix}lenhar
││    ↳ Obtenha madeira.
││◕⁠➜ ${prefix}plantar
││    ↳ (Sistema de plantação em breve!)
│
│╭─▸ Combate & Desafios:
││
││◕⁠➜ ${prefix}batalhar [monstro]
││    ↳ Enfrente criaturas (PvE).
││◕⁠➜ ${prefix}pocao <nome>
││    ↳ Use uma poção de cura.
││◕⁠➜ ${prefix}pvp desafiar @jogador
││    ↳ Duelo contra outro jogador.
││◕⁠➜ ${prefix}pvp aceitar @jogador
││    ↳ Aceite um desafio PvP.
││◕⁠➜ ${prefix}pvp recusar @jogador
││    ↳ Recuse um desafio PvP.
│
│╭─▸ Guildas & Comunidade:
││
││◕⁠➜ ${prefix}guilda criar <nome>
││    ↳ Forme sua própria guilda.
││◕⁠➜ ${prefix}guilda entrar <nome>
││    ↳ Junte-se a uma guilda.
││◕⁠➜ ${prefix}guilda sair
││    ↳ Deixe sua guilda atual.
││◕⁠➜ ${prefix}guilda ver [nome]
││    ↳ Veja informações da guilda.
││◕⁠➜ ${prefix}guilda membros
││    ↳ Liste os membros da sua guilda.
│
│╭─▸ Missões & Aventuras:
││
││◕⁠➜ ${prefix}missao listar
││    ↳ Veja missões disponíveis.
││◕⁠➜ ${prefix}missao ativas
││    ↳ Suas missões em andamento.
││◕⁠➜ ${prefix}missao iniciar <id/nome>
││    ↳ Aceite uma nova missão.
││◕⁠➜ ${prefix}missao completar <id/nome>
││    ↳ Conclua uma missão.
│
│╭─▸ Pokémon (Beta):
││
││◕⁠➜ ${prefix}pkm_encontrar [local]
││    ↳ Ache Pokémon selvagens.
││◕⁠➜ ${prefix}pkm_capturar [bola]
││    ↳ Tente capturar um Pokémon.
││◕⁠➜ ${prefix}pkm_time
││    ↳ Veja seu time Pokémon.
││◕⁠➜ ${prefix}pkm_pc [pág]
││    ↳ Acesse seus Pokémon no PC.
││◕⁠➜ ${prefix}pkm_pokedex
││    ↳ Consulte sua Pokédex.
││◕⁠➜ ${prefix}pkm_batalhar
││    ↳ Lute contra Pokémon selvagem.
││◕⁠➜ ${prefix}pkm_lutar <movimento>
││    ↳ Use um ataque na batalha.
││◕⁠➜ ${prefix}pkm_trocar <pokémon>
││    ↳ Troque de Pokémon na batalha.
││◕⁠➜ ${prefix}pkm_item <item>
││    ↳ Use um item na batalha.
││◕⁠➜ ${prefix}pkm_fugir
││    ↳ Fuja de uma batalha Pokémon.
│
│╭─▸ Social & Interações:
││
││◕⁠➜ ${prefix}conversar <npc>
││    ↳ Interaja com personagens.
││◕⁠➜ ${prefix}presentear <npc> <item>
││    ↳ Dê presentes para NPCs.
││◕⁠➜ ${prefix}afinidade <npc>
││    ↳ Veja sua relação com NPCs.
│
│╭─▸ Hub de Criadores:
││
││◕⁠➜ ${prefix}criador ativar <taxa>
││    ↳ Torne-se um criador de conteúdo.
││◕⁠➜ ${prefix}criador postar <conteúdo>
││    ↳ Publique para seus assinantes.
││◕⁠➜ ${prefix}criador subscrever <criador>
││    ↳ Assine o conteúdo de alguém.
││◕⁠➜ ${prefix}criador cancelar <criador>
││    ↳ Cancele uma assinatura.
││◕⁠➜ ${prefix}feed <criador> [pág]
││    ↳ Veja o feed de um criador.
│
│╭─▸ Criação & Moradia:
││
││◕⁠➜ ${prefix}craft listar
││    ↳ Veja receitas de criação.
││◕⁠➜ ${prefix}craft criar <receita> [qtd]
││    ↳ Crie novos itens.
││◕⁠➜ ${prefix}casa listar
││    ↳ Veja casas à venda.
││◕⁠➜ ${prefix}casa comprar <casa>
││    ↳ Adquira sua moradia.
││◕⁠➜ ${prefix}casa ver
││    ↳ Veja sua casa atual.
│
│╭─▸ Rankings & Prestígio:
││
││◕⁠➜ ${prefix}ranking [tipo]
││    ↳ Veja os melhores jogadores.
│
╰══════════════════════╯
`;
}

module.exports = menuRpg;
