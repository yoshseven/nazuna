/*
═════════════════════════════════════════════════
  Brazilian Phone Commands for Nazuna Bot
  Author: Enhanced by AI Assistant
  Created: 2025
  
  This module provides WhatsApp bot commands that use
  the Brazilian phone number utility for practical
  data extraction and user assistance.
═════════════════════════════════════════════════
*/

/**
 * Handle Brazilian phone number analysis command
 * @param {Object} nazu - WhatsApp socket instance
 * @param {Object} info - Message info
 * @param {string} q - Query/phone number to analyze
 * @param {Object} BrazilianPhoneUtil - Phone utility class
 * @returns {string} - Formatted response
 */
async function handlePhoneAnalysis(nazu, info, q, BrazilianPhoneUtil) {
  const from = info.key.remoteJid;
  
  if (!q) {
    return `📱 *Analisador de Números Brasileiros*

🔍 Use este comando para extrair dados de números de telefone brasileiros:

📋 *Exemplos de uso:*
• \`/analisar 11999887766\`
• \`/analisar (11) 9 9988-7766\`
• \`/analisar +55 11 99988-7766\`

📊 *Dados extraídos:*
• Estado e região 🗺️
• Tipo (móvel/fixo) 📞
• Operadora (quando possível) 📡
• Fuso horário ⏰
• Link do WhatsApp 💬
• Formatação padronizada ✨`;
  }

  try {
    const analysis = BrazilianPhoneUtil.analyzeNumber(q);
    
    if (analysis.error) {
      return `❌ *Erro na análise:*
${analysis.error}

💡 *Formatos aceitos:*
• 11999887766
• (11) 9 9988-7766
• +55 11 99988-7766`;
    }

    let responseMessage = `📱 *Análise do Número Brasileiro*

📞 *Número Original:* ${analysis.original}
📱 *Número Limpo:* ${analysis.cleaned}
✨ *Formatado:* ${analysis.formatted}
📋 *Tipo:* ${analysis.type === 'mobile' ? '📱 Celular' : '📞 Fixo'}

🗺️ *Localização:*
• *Estado:* ${analysis.geographic.state}
• *Região:* ${analysis.geographic.region}
• *Código de Área:* ${analysis.areaCode}
• *País:* ${analysis.geographic.country}
• *Código do País:* ${analysis.geographic.countryCode}

⏰ *Fuso Horário:* ${analysis.geographic.timezone}`;

    // Add carrier info for mobile numbers
    if (analysis.carrier && !analysis.carrier.error) {
      responseMessage += `\n\n📡 *Operadora:* ${analysis.carrier.carrier}`;
    }

    // Add WhatsApp link
    if (analysis.whatsapp.url) {
      responseMessage += `\n\n💬 *Link WhatsApp:* ${analysis.whatsapp.url}`;
    }

    return responseMessage;
    
  } catch (error) {
    console.error('Erro na análise de número:', error);
    return '❌ Erro interno ao analisar o número. Tente novamente.';
  }
}

/**
 * Handle phone number validation command
 * @param {Object} nazu - WhatsApp socket instance
 * @param {Object} info - Message info
 * @param {string} q - Query/phone number to validate
 * @param {Object} BrazilianPhoneUtil - Phone utility class
 * @returns {string} - Formatted response
 */
async function handlePhoneValidation(nazu, info, q, BrazilianPhoneUtil) {
  if (!q) {
    return `✅ *Validador de Números Brasileiros*

🔍 Valide se um número de telefone brasileiro está correto:

📋 *Exemplo de uso:*
• \`/validar 11999887766\`

✅ *Verificações realizadas:*
• Formato correto
• Código de área válido
• Tipo de número (móvel/fixo)
• Compatibilidade com WhatsApp`;
  }

  try {
    const validation = BrazilianPhoneUtil.validateBrazilianNumber(q);
    
    if (validation.valid) {
      const geographic = BrazilianPhoneUtil.getGeographicData(q);
      
      return `✅ *Número Válido!*

📱 *Número:* ${validation.formatted}
📋 *Tipo:* ${validation.type === 'mobile' ? '📱 Celular' : '📞 Fixo'}
🗺️ *Região:* ${geographic.region} - ${geographic.state}
💬 *WhatsApp:* ${validation.type === 'mobile' ? 'Compatível ✅' : 'Não compatível ❌'}`;
    } else {
      return `❌ *Número Inválido*

🚫 *Motivo:* ${validation.reason}

💡 *Dica:* Certifique-se de usar um número brasileiro válido.
📋 *Formatos aceitos:*
• 11999887766 (celular)
• 1133334444 (fixo)
• (11) 9 9988-7766 (formatado)`;
    }
    
  } catch (error) {
    console.error('Erro na validação de número:', error);
    return '❌ Erro interno ao validar o número. Tente novamente.';
  }
}

/**
 * Handle batch phone number analysis command
 * @param {Object} nazu - WhatsApp socket instance
 * @param {Object} info - Message info
 * @param {string} q - Query with multiple phone numbers
 * @param {Object} BrazilianPhoneUtil - Phone utility class
 * @returns {string} - Formatted response
 */
async function handleBatchAnalysis(nazu, info, q, BrazilianPhoneUtil) {
  if (!q) {
    return `📊 *Análise em Lote de Números*

🔍 Analise múltiplos números brasileiros de uma vez:

📋 *Exemplo de uso:*
• \`/lote 11999887766 21988776655 31977665544\`
• \`/lote (11)99988-7766 (21)98877-6655\`

📊 *Resultados incluem:*
• Status de validação
• Estados e regiões
• Agrupamento por estado
• Estatísticas gerais`;
  }

  try {
    // Split the query by spaces and common separators
    const phoneNumbers = q.split(/[\s,;]+/).filter(num => num.trim().length > 0);
    
    if (phoneNumbers.length === 0) {
      return '❌ Nenhum número encontrado. Separe os números por espaços.';
    }

    if (phoneNumbers.length > 10) {
      return '⚠️ Máximo de 10 números por análise. Por favor, reduza a quantidade.';
    }

    const results = BrazilianPhoneUtil.batchAnalyze(phoneNumbers);
    const validNumbers = results.filter(r => r.analysis.valid);
    const invalidNumbers = results.filter(r => r.analysis.error);
    
    let responseMessage = `📊 *Análise em Lote - ${phoneNumbers.length} números*

✅ *Válidos:* ${validNumbers.length}
❌ *Inválidos:* ${invalidNumbers.length}

`;

    // Show valid numbers grouped by state
    if (validNumbers.length > 0) {
      const groupedByState = BrazilianPhoneUtil.groupByState(validNumbers.map(r => r.input));
      
      responseMessage += `🗺️ *Por Estado:*\n`;
      
      Object.entries(groupedByState).forEach(([state, data]) => {
        responseMessage += `• *${state}* (${data.region}): ${data.numbers.length} número(s)\n`;
      });
      
      responseMessage += `\n📱 *Números Válidos:*\n`;
      validNumbers.slice(0, 5).forEach((result, index) => {
        const analysis = result.analysis;
        responseMessage += `${index + 1}. ${analysis.formatted} - ${analysis.geographic.state}\n`;
      });
      
      if (validNumbers.length > 5) {
        responseMessage += `... e mais ${validNumbers.length - 5} número(s)\n`;
      }
    }

    // Show invalid numbers
    if (invalidNumbers.length > 0) {
      responseMessage += `\n❌ *Números Inválidos:*\n`;
      invalidNumbers.slice(0, 3).forEach((result, index) => {
        responseMessage += `${index + 1}. ${result.input} - ${result.analysis.error}\n`;
      });
      
      if (invalidNumbers.length > 3) {
        responseMessage += `... e mais ${invalidNumbers.length - 3} inválido(s)\n`;
      }
    }

    return responseMessage;
    
  } catch (error) {
    console.error('Erro na análise em lote:', error);
    return '❌ Erro interno ao processar os números. Tente novamente.';
  }
}

/**
 * Handle phone number formatting command
 * @param {Object} nazu - WhatsApp socket instance
 * @param {Object} info - Message info
 * @param {string} q - Query/phone number to format
 * @param {Object} BrazilianPhoneUtil - Phone utility class
 * @returns {string} - Formatted response
 */
async function handlePhoneFormatting(nazu, info, q, BrazilianPhoneUtil) {
  if (!q) {
    return `✨ *Formatador de Números Brasileiros*

🔧 Formate números de telefone no padrão brasileiro:

📋 *Exemplo de uso:*
• \`/formatar 11999887766\`
• \`/formatar 1133334444\`

📱 *Resultado:*
• Celular: (11) 9 9988-7766
• Fixo: (11) 3333-4444
• Link WhatsApp (para celulares)`;
  }

  try {
    const validation = BrazilianPhoneUtil.validateBrazilianNumber(q);
    
    if (!validation.valid) {
      return `❌ *Não foi possível formatar*

🚫 *Motivo:* ${validation.reason}

💡 *Certifique-se de usar um número brasileiro válido.*`;
    }

    const formatted = BrazilianPhoneUtil.formatBrazilianNumber(q);
    const geographic = BrazilianPhoneUtil.getGeographicData(q);
    
    let responseMessage = `✨ *Número Formatado*

📱 *Original:* ${q}
📞 *Formatado:* ${formatted}
🗺️ *Região:* ${geographic.region} - ${geographic.state}
📋 *Tipo:* ${validation.type === 'mobile' ? '📱 Celular' : '📞 Fixo'}`;

    // Add WhatsApp link for mobile numbers
    if (validation.type === 'mobile') {
      const whatsappURL = BrazilianPhoneUtil.generateWhatsAppURL(q);
      responseMessage += `\n\n💬 *Link WhatsApp:*\n${whatsappURL}`;
    }

    return responseMessage;
    
  } catch (error) {
    console.error('Erro na formatação de número:', error);
    return '❌ Erro interno ao formatar o número. Tente novamente.';
  }
}

/**
 * Handle business hours check based on phone number timezone
 * @param {Object} nazu - WhatsApp socket instance
 * @param {Object} info - Message info
 * @param {string} q - Query/phone number to check
 * @param {Object} BrazilianPhoneUtil - Phone utility class
 * @returns {string} - Formatted response
 */
async function handleBusinessHours(nazu, info, q, BrazilianPhoneUtil) {
  if (!q) {
    return `⏰ *Verificador de Horário Comercial*

🕐 Verifique o horário local baseado no número de telefone:

📋 *Exemplo de uso:*
• \`/horario 11999887766\`
• \`/horario 85988776655\`

📊 *Informações fornecidas:*
• Horário local atual
• Status horário comercial
• Fuso horário da região`;
  }

  try {
    const businessHours = BrazilianPhoneUtil.getBusinessHours(q);
    
    if (businessHours.error) {
      return `❌ *Erro ao verificar horário:*
${businessHours.error}

💡 Use um número brasileiro válido.`;
    }

    const geographic = BrazilianPhoneUtil.getGeographicData(q);
    const isBusinessHours = businessHours.isBusinessHours;
    
    return `⏰ *Horário Local da Região*

🗺️ *Região:* ${geographic.region} - ${geographic.state}
🕐 *Horário Local:* ${businessHours.localTime}
🌍 *Fuso Horário:* ${businessHours.timezone}

${isBusinessHours ? '🟢' : '🔴'} *Status:* ${businessHours.businessHoursMessage}

💼 *Horário Comercial:* 08:00 às 18:00
${isBusinessHours ? '✅ É um bom momento para contato comercial!' : '⚠️ Fora do horário comercial padrão.'}`;
    
  } catch (error) {
    console.error('Erro na verificação de horário:', error);
    return '❌ Erro interno ao verificar horário. Tente novamente.';
  }
}

/**
 * Handle phone number region filtering
 * @param {Object} nazu - WhatsApp socket instance
 * @param {Object} info - Message info
 * @param {string} q - Query with state and numbers
 * @param {Object} BrazilianPhoneUtil - Phone utility class
 * @returns {string} - Formatted response
 */
async function handleRegionFilter(nazu, info, q, BrazilianPhoneUtil) {
  if (!q) {
    return `🗺️ *Filtro por Estado/Região*

🔍 Filtre números de telefone por estado brasileiro:

📋 *Exemplo de uso:*
• \`/estado SP 11999887766 21988776655 11977665544\`
• \`/estado RJ 21988776655 11999887766 21977665544\`

📊 *Resultado:*
• Lista apenas números do estado especificado
• Contagem total de números encontrados`;
  }

  try {
    const parts = q.trim().split(/\s+/);
    if (parts.length < 2) {
      return `❌ *Formato incorreto*

📋 *Use:* \`/estado [ESTADO] [números...]\`
📋 *Exemplo:* \`/estado SP 11999887766 21988776655\`

🗺️ *Estados válidos:* SP, RJ, MG, RS, PR, SC, BA, GO, etc.`;
    }

    const targetState = parts[0].toUpperCase();
    const phoneNumbers = parts.slice(1);

    if (phoneNumbers.length === 0) {
      return '❌ Nenhum número fornecido para filtrar.';
    }

    const results = phoneNumbers.map(number => {
      const isFromState = BrazilianPhoneUtil.isFromState(number, targetState);
      const analysis = BrazilianPhoneUtil.analyzeNumber(number);
      return { number, isFromState, analysis };
    });

    const matchingNumbers = results.filter(r => r.isFromState && r.analysis.valid);
    const nonMatchingNumbers = results.filter(r => !r.isFromState && r.analysis.valid);
    const invalidNumbers = results.filter(r => r.analysis.error);

    let responseMessage = `🗺️ *Filtro por Estado: ${targetState}*

📊 *Resultados:*
• Total analisados: ${phoneNumbers.length}
• Do estado ${targetState}: ${matchingNumbers.length}
• De outros estados: ${nonMatchingNumbers.length}
• Inválidos: ${invalidNumbers.length}

`;

    if (matchingNumbers.length > 0) {
      responseMessage += `✅ *Números do ${targetState}:*\n`;
      matchingNumbers.forEach((result, index) => {
        responseMessage += `${index + 1}. ${result.analysis.formatted} - ${result.analysis.geographic.region}\n`;
      });
    }

    if (nonMatchingNumbers.length > 0 && nonMatchingNumbers.length <= 3) {
      responseMessage += `\n📍 *Outros estados:*\n`;
      nonMatchingNumbers.forEach((result, index) => {
        responseMessage += `${index + 1}. ${result.analysis.formatted} - ${result.analysis.geographic.state}\n`;
      });
    }

    return responseMessage;
    
  } catch (error) {
    console.error('Erro no filtro por região:', error);
    return '❌ Erro interno ao filtrar por região. Tente novamente.';
  }
}

module.exports = {
  handlePhoneAnalysis,
  handlePhoneValidation,
  handleBatchAnalysis,
  handlePhoneFormatting,
  handleBusinessHours,
  handleRegionFilter
};