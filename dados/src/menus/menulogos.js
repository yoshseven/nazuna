/**
 * Menu de logos do bot que lista todos os comandos de criação de logos
 * @module menulogos
 * @param {string} prefix - Prefixo dos comandos do bot
 * @param {string} [botName="MeuBot"] - Nome do bot
 * @param {string} [userName="Usuário"] - Nome do usuário
 * @returns {Promise<string>} Menu formatado com lista de comandos de logos
 */
async function menuLogos(prefix, botName = "MeuBot", userName = "Usuário") {
  return `
╭═══ 🎨 *${botName}* 🎨 ═══╮
│ Olá, *${userName}*!
╰══════════════════════╯

╭═══ 🖼️ *MENU DE LOGOS* 🖼️ ═══╮
│
│╭─▸ *Logos de Texto (TextPro):*
││
││◕⁠➜ ${prefix}neon texto
││    ↳ Efeito neon brilhante
││◕⁠➜ ${prefix}matrix texto
││    ↳ Estilo Matrix digital
││◕⁠➜ ${prefix}glow texto
││    ↳ Brilho suave
││◕⁠➜ ${prefix}glow-advanced texto
││    ↳ Brilho avançado
││◕⁠➜ ${prefix}dropwater texto
││    ↳ Efeito de água
││◕⁠➜ ${prefix}glitch texto
││    ↳ Efeito glitch moderno
││◕⁠➜ ${prefix}glitch-tik-tok texto
││    ↳ Glitch estilo TikTok
││◕⁠➜ ${prefix}harry-potter texto
││    ↳ Inspirada em Harry Potter
││◕⁠➜ ${prefix}blackpink texto
││    ↳ Estilo Blackpink
││◕⁠➜ ${prefix}blackpink-roses texto
││    ↳ Blackpink com rosas
││◕⁠➜ ${prefix}blackpink-style texto
││    ↳ Estilo alternativo Blackpink
││◕⁠➜ ${prefix}blackpink-neon texto
││    ↳ Blackpink com neon
││◕⁠➜ ${prefix}thunder texto
││    ↳ Efeito de trovão
││◕⁠➜ ${prefix}thunder-generator texto
││    ↳ Trovão dinâmico
││◕⁠➜ ${prefix}green-horror texto
││    ↳ Tema de horror verde
││◕⁠➜ ${prefix}wolf-black-bear texto
││    ↳ Mascote lobo e urso
││◕⁠➜ ${prefix}wolf-galaxy texto
││    ↳ Lobo com tema galáctico
││◕⁠➜ ${prefix}wolf-black texto
││    ↳ Lobo preto e branco
││◕⁠➜ ${prefix}ninja texto
││    ↳ Tema ninja
││◕⁠➜ ${prefix}pornhub texto1/texto2
││    ↳ Estilo Pornhub (dois textos)
││◕⁠➜ ${prefix}marvel-studios texto
││    ↳ Estilo Marvel Studios
││◕⁠➜ ${prefix}marvel-studios-metal texto
││    ↳ Marvel com efeito metálico
││◕⁠➜ ${prefix}marvel-avengers texto
││    ↳ Estilo Vingadores
││◕⁠➜ ${prefix}marvel-thor texto
││    ↳ Inspirada em Thor
││◕⁠➜ ${prefix}deep texto
││    ↳ Efeito de mar profundo
││◕⁠➜ ${prefix}transformer texto
││    ↳ Estilo Transformers
││◕⁠➜ ${prefix}8-bit texto
││    ↳ Estilo 8-bit retrô
││◕⁠➜ ${prefix}retro-neon texto
││    ↳ Neon retrô anos 80
││◕⁠➜ ${prefix}cartoon texto
││    ↳ Estilo cartoon 3D
││◕⁠➜ ${prefix}shiny texto
││    ↳ Cristal brilhante
││◕⁠➜ ${prefix}chrome texto
││    ↳ Efeito cromo verde
││◕⁠➜ ${prefix}hologram texto
││    ↳ Efeito holográfico
││◕⁠➜ ${prefix}rainbow texto
││    ↳ Caligrafia colorida
││◕⁠➜ ${prefix}wall texto
││    ↳ Paredes quebradas
│
│╭─▸ *Logos Fotográficos (PhotoOxy):*
││
││◕⁠➜ ${prefix}neonphoto texto
││    ↳ Neon com estilo fotográfico
││◕⁠➜ ${prefix}neon-dark texto
││    ↳ Neon escuro elegante
││◕⁠➜ ${prefix}warface texto
││    ↳ Estilo Warface
││◕⁠➜ ${prefix}overwatch texto
││    ↳ Estilo Overwatch
││◕⁠➜ ${prefix}csgo texto
││    ↳ Estilo CS:GO
││◕⁠➜ ${prefix}pubg texto
││    ↳ Estilo PUBG
││◕⁠➜ ${prefix}battlefield texto
││    ↳ Estilo Battlefield
││◕⁠➜ ${prefix}flaming texto
││    ↳ Efeito de chamas
││◕⁠➜ ${prefix}cross-fire texto
││    ↳ Estilo Cross Fire
││◕⁠➜ ${prefix}google texto
││    ↳ Estilo Google
│
│╭─▸ *Logos Estilizados (EPhoto360 - Imagens):*
││
││◕⁠➜ ${prefix}glitch-ephoto texto
││    ↳ Glitch estilo EPhoto
││◕⁠➜ ${prefix}galaxy texto
││    ↳ Tema galáctico
││◕⁠➜ ${prefix}galaxy-light texto
││    ↳ Luz galáctica
││◕⁠➜ ${prefix}glossy texto
││    ↳ Efeito brilhante
││◕⁠➜ ${prefix}metallic texto
││    ↳ Efeito metálico
││◕⁠➜ ${prefix}graffiti texto
││    ↳ Estilo grafite
││◕⁠➜ ${prefix}mascote texto
││    ↳ Mascote preto e branco
││◕⁠➜ ${prefix}retro texto1[/texto2/texto3]
││    ↳ Neon retrô (até 3 textos)
││◕⁠➜ ${prefix}deadpool texto1/texto2
││    ↳ Estilo Deadpool (dois textos)
││◕⁠➜ ${prefix}vintage3d texto1/texto2
││    ↳ Vintage 3D (dois textos)
││◕⁠➜ ${prefix}goldpink texto
││    ↳ Tons dourado e rosa
││◕⁠➜ ${prefix}dragonfire texto
││    ↳ Fogo de dragão
││◕⁠➜ ${prefix}pubgavatar texto
││    ↳ Avatar estilo PUBG
││◕⁠➜ ${prefix}comics texto
││    ↳ Estilo de quadrinhos
││◕⁠➜ ${prefix}amongus texto
││    ↳ Estilo Among Us
││◕⁠➜ ${prefix}ffavatar texto
││    ↳ Avatar estilo Free Fire
││◕⁠➜ ${prefix}lolavatar texto
││    ↳ Avatar estilo League of Legends
││◕⁠➜ ${prefix}cemiterio texto
││    ↳ Tema de cemitério
││◕⁠➜ ${prefix}hallobat texto
││    ↳ Halloween com morcegos
││◕⁠➜ ${prefix}blood texto
││    ↳ Efeito de sangue
││◕⁠➜ ${prefix}halloween texto
││    ↳ Tema de Halloween
││◕⁠➜ ${prefix}titanium texto
││    ↳ Efeito titânio
││◕⁠➜ ${prefix}sunset texto
││    ↳ Efeito de pôr do sol
││◕⁠➜ ${prefix}snow texto
││    ↳ Efeito de neve
││◕⁠➜ ${prefix}america texto
││    ↳ Tema americano
││◕⁠➜ ${prefix}eraser texto
││    ↳ Efeito de borracha
││◕⁠➜ ${prefix}captain texto1/texto2
││    ↳ Estilo Capitão América (dois textos)
││◕⁠➜ ${prefix}mascoteneon texto
││    ↳ Mascote neon
││◕⁠➜ ${prefix}phlogo texto1/texto2
││    ↳ Estilo Pornhub (dois textos)
││◕⁠➜ ${prefix}doubleexposure texto
││    ↳ Dupla exposição
││◕⁠➜ ${prefix}metal texto
││    ↳ Efeito metálico
││◕⁠➜ ${prefix}3dcrack texto
││    ↳ Rachadura 3D
││◕⁠➜ ${prefix}multicolor texto
││    ↳ Cores vibrantes
││◕⁠➜ ${prefix}balloon texto
││    ↳ Estilo balão
││◕⁠➜ ${prefix}colorful texto
││    ↳ Efeito colorido
││◕⁠➜ ${prefix}frozen texto
││    ↳ Efeito congelado
│
│╭─▸ *Logos em Vídeo (EPhoto360 - Vídeos):*
││
││◕⁠➜ ${prefix}newyear texto
││    ↳ Vídeo de Ano Novo
││◕⁠➜ ${prefix}tiger texto
││    ↳ Vídeo com tema tigre
││◕⁠➜ ${prefix}pubgvideo texto
││    ↳ Vídeo estilo PUBG
│
╰══════════════════════╯
`;
}

module.exports = menuLogos;