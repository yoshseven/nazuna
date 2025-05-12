// Export de Menus
// Sistema único, diferente de qualquer outro bot
// Criador: Hiudy
// Caso for usar, deixe os créditos por favor! <3

/**
 * Centraliza a exportação de todos os menus do bot
 * @module menus
 */

/**
 * Lista de menus disponíveis
 * @type {Object.<string, Object>}
 */
const menus = {
  menu: require('./menu'),
  menudown: require('./menudown'),
  menuadm: require('./menuadm'),
  menubn: require('./menubn'),
  menuDono: require('./menudono'),
  menuMembros: require('./menumemb'),
  menuFerramentas: require('./ferramentas'),
  menuSticker: require('./menufig'),
  menuIa: require('./menuia'),
  menuRpg: require('./menurpg')
};

/**
 * Valida se todos os menus foram carregados corretamente
 * @returns {boolean} - True se todos os menus estão válidos
 */
function validateMenus() {
  const invalidMenus = Object.entries(menus).filter(([name, menu]) => !menu || typeof menu !== 'function').map(([name]) => name);

  if (invalidMenus.length) {
    console.warn(`[${new Date().toISOString()}] Menus inválidos detectados: ${invalidMenus.join(', ')}`);
    return false;
  }
  return true;
}

// Executa validação ao carregar o módulo
if (!validateMenus()) {
  console.error(`[${new Date().toISOString()}] Erro: Um ou mais menus não foram carregados corretamente.`);
}

// Exporta todos os menus
module.exports = menus;