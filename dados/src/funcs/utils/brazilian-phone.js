/*
═════════════════════════════════════════════════
  Brazilian Phone Number Data Extraction Utility
  Author: Enhanced by AI Assistant
  Created: 2025
  
  This module provides comprehensive cases for pulling
  data from Brazilian phone numbers including:
  - Validation and formatting
  - Area code identification
  - Carrier detection
  - Geographic location
  - Number type classification
═════════════════════════════════════════════════
*/

/**
 * Brazilian area codes and their corresponding states/regions
 */
const BRAZILIAN_AREA_CODES = {
  // São Paulo
  11: { state: 'SP', region: 'São Paulo (Capital)', timezone: 'America/Sao_Paulo' },
  12: { state: 'SP', region: 'Vale do Paraíba', timezone: 'America/Sao_Paulo' },
  13: { state: 'SP', region: 'Baixada Santista', timezone: 'America/Sao_Paulo' },
  14: { state: 'SP', region: 'Bauru', timezone: 'America/Sao_Paulo' },
  15: { state: 'SP', region: 'Sorocaba', timezone: 'America/Sao_Paulo' },
  16: { state: 'SP', region: 'Araraquara', timezone: 'America/Sao_Paulo' },
  17: { state: 'SP', region: 'São José do Rio Preto', timezone: 'America/Sao_Paulo' },
  18: { state: 'SP', region: 'Presidente Prudente', timezone: 'America/Sao_Paulo' },
  19: { state: 'SP', region: 'Campinas', timezone: 'America/Sao_Paulo' },
  
  // Rio de Janeiro
  21: { state: 'RJ', region: 'Rio de Janeiro (Capital)', timezone: 'America/Sao_Paulo' },
  22: { state: 'RJ', region: 'Campos dos Goytacazes', timezone: 'America/Sao_Paulo' },
  24: { state: 'RJ', region: 'Volta Redonda', timezone: 'America/Sao_Paulo' },
  
  // Espírito Santo
  27: { state: 'ES', region: 'Vitória', timezone: 'America/Sao_Paulo' },
  28: { state: 'ES', region: 'Cachoeiro de Itapemirim', timezone: 'America/Sao_Paulo' },
  
  // Minas Gerais
  31: { state: 'MG', region: 'Belo Horizonte', timezone: 'America/Sao_Paulo' },
  32: { state: 'MG', region: 'Juiz de Fora', timezone: 'America/Sao_Paulo' },
  33: { state: 'MG', region: 'Governador Valadares', timezone: 'America/Sao_Paulo' },
  34: { state: 'MG', region: 'Uberlândia', timezone: 'America/Sao_Paulo' },
  35: { state: 'MG', region: 'Poços de Caldas', timezone: 'America/Sao_Paulo' },
  37: { state: 'MG', region: 'Divinópolis', timezone: 'America/Sao_Paulo' },
  38: { state: 'MG', region: 'Montes Claros', timezone: 'America/Sao_Paulo' },
  
  // Paraná
  41: { state: 'PR', region: 'Curitiba', timezone: 'America/Sao_Paulo' },
  42: { state: 'PR', region: 'Ponta Grossa', timezone: 'America/Sao_Paulo' },
  43: { state: 'PR', region: 'Londrina', timezone: 'America/Sao_Paulo' },
  44: { state: 'PR', region: 'Maringá', timezone: 'America/Sao_Paulo' },
  45: { state: 'PR', region: 'Cascavel', timezone: 'America/Sao_Paulo' },
  46: { state: 'PR', region: 'Francisco Beltrão', timezone: 'America/Sao_Paulo' },
  
  // Santa Catarina
  47: { state: 'SC', region: 'Joinville', timezone: 'America/Sao_Paulo' },
  48: { state: 'SC', region: 'Florianópolis', timezone: 'America/Sao_Paulo' },
  49: { state: 'SC', region: 'Chapecó', timezone: 'America/Sao_Paulo' },
  
  // Rio Grande do Sul
  51: { state: 'RS', region: 'Porto Alegre', timezone: 'America/Sao_Paulo' },
  53: { state: 'RS', region: 'Pelotas', timezone: 'America/Sao_Paulo' },
  54: { state: 'RS', region: 'Caxias do Sul', timezone: 'America/Sao_Paulo' },
  55: { state: 'RS', region: 'Santa Maria', timezone: 'America/Sao_Paulo' },
  
  // Distrito Federal
  61: { state: 'DF', region: 'Brasília', timezone: 'America/Sao_Paulo' },
  
  // Goiás/Tocantins
  62: { state: 'GO', region: 'Goiânia', timezone: 'America/Sao_Paulo' },
  63: { state: 'TO', region: 'Palmas', timezone: 'America/Sao_Paulo' },
  64: { state: 'GO', region: 'Rio Verde', timezone: 'America/Sao_Paulo' },
  
  // Mato Grosso/Mato Grosso do Sul
  65: { state: 'MT', region: 'Cuiabá', timezone: 'America/Cuiaba' },
  66: { state: 'MT', region: 'Rondonópolis', timezone: 'America/Cuiaba' },
  67: { state: 'MS', region: 'Campo Grande', timezone: 'America/Campo_Grande' },
  
  // Acre/Rondônia
  68: { state: 'AC', region: 'Rio Branco', timezone: 'America/Rio_Branco' },
  69: { state: 'RO', region: 'Porto Velho', timezone: 'America/Porto_Velho' },
  
  // Bahia
  71: { state: 'BA', region: 'Salvador', timezone: 'America/Bahia' },
  73: { state: 'BA', region: 'Ilhéus', timezone: 'America/Bahia' },
  74: { state: 'BA', region: 'Juazeiro', timezone: 'America/Bahia' },
  75: { state: 'BA', region: 'Feira de Santana', timezone: 'America/Bahia' },
  77: { state: 'BA', region: 'Vitória da Conquista', timezone: 'America/Bahia' },
  
  // Sergipe
  79: { state: 'SE', region: 'Aracaju', timezone: 'America/Maceio' },
  
  // Pernambuco
  81: { state: 'PE', region: 'Recife', timezone: 'America/Recife' },
  87: { state: 'PE', region: 'Petrolina', timezone: 'America/Recife' },
  
  // Alagoas
  82: { state: 'AL', region: 'Maceió', timezone: 'America/Maceio' },
  
  // Paraíba
  83: { state: 'PB', region: 'João Pessoa', timezone: 'America/Fortaleza' },
  
  // Rio Grande do Norte
  84: { state: 'RN', region: 'Natal', timezone: 'America/Fortaleza' },
  
  // Ceará
  85: { state: 'CE', region: 'Fortaleza', timezone: 'America/Fortaleza' },
  88: { state: 'CE', region: 'Juazeiro do Norte', timezone: 'America/Fortaleza' },
  
  // Piauí
  86: { state: 'PI', region: 'Teresina', timezone: 'America/Fortaleza' },
  89: { state: 'PI', region: 'Picos', timezone: 'America/Fortaleza' },
  
  // Maranhão
  98: { state: 'MA', region: 'São Luís', timezone: 'America/Fortaleza' },
  99: { state: 'MA', region: 'Imperatriz', timezone: 'America/Fortaleza' },
  
  // Pará/Amapá
  91: { state: 'PA', region: 'Belém', timezone: 'America/Belem' },
  93: { state: 'PA', region: 'Santarém', timezone: 'America/Belem' },
  94: { state: 'PA', region: 'Marabá', timezone: 'America/Belem' },
  96: { state: 'AP', region: 'Macapá', timezone: 'America/Belem' },
  
  // Amazonas/Roraima
  92: { state: 'AM', region: 'Manaus', timezone: 'America/Manaus' },
  97: { state: 'AM', region: 'Tefé', timezone: 'America/Manaus' },
  95: { state: 'RR', region: 'Boa Vista', timezone: 'America/Boa_Vista' }
};

/**
 * Major mobile carriers in Brazil and their number ranges
 */
const BRAZILIAN_CARRIERS = {
  // Vivo
  vivo: {
    name: 'Vivo',
    ranges: ['9999', '9998', '9997', '9996', '9995', '9994', '9993', '9992', '9991'],
    color: '#660099'
  },
  // Claro
  claro: {
    name: 'Claro',
    ranges: ['9989', '9988', '9987', '9986', '9985', '9984', '9983', '9982', '9981'],
    color: '#E60000'
  },
  // TIM
  tim: {
    name: 'TIM',
    ranges: ['9979', '9978', '9977', '9976', '9975', '9974', '9973', '9972', '9971'],
    color: '#0066CC'
  },
  // Oi
  oi: {
    name: 'Oi',
    ranges: ['9969', '9968', '9967', '9966', '9965', '9964', '9963', '9962', '9961'],
    color: '#FFCC00'
  },
  // Other carriers
  other: {
    name: 'Outras Operadoras',
    ranges: [],
    color: '#999999'
  }
};

/**
 * Brazilian Phone Number Utility Class
 */
class BrazilianPhoneNumberUtil {
  
  /**
   * Case 1: Clean and normalize phone number
   * @param {string} phoneNumber - Raw phone number
   * @returns {string} - Cleaned phone number with only digits
   */
  static cleanPhoneNumber(phoneNumber) {
    if (!phoneNumber) return '';
    return phoneNumber.toString().replace(/\D/g, '');
  }

  /**
   * Case 2: Validate Brazilian phone number format
   * @param {string} phoneNumber - Phone number to validate
   * @returns {object} - Validation result with details
   */
  static validateBrazilianNumber(phoneNumber) {
    const cleaned = this.cleanPhoneNumber(phoneNumber);
    
    // Basic validation
    if (!cleaned) {
      return { valid: false, reason: 'Número vazio' };
    }

    // Remove country code if present
    let number = cleaned;
    if (number.startsWith('55') && number.length >= 12) {
      number = number.substring(2);
    }

    // Check if it's a valid Brazilian format
    if (number.length < 10 || number.length > 11) {
      return { valid: false, reason: 'Formato inválido - deve ter 10 ou 11 dígitos' };
    }

    // Extract area code
    const areaCode = parseInt(number.substring(0, 2));
    if (!BRAZILIAN_AREA_CODES[areaCode]) {
      return { valid: false, reason: 'Código de área brasileiro inválido' };
    }

    // Check mobile vs landline
    const isMobile = number.length === 11 && number[2] === '9';
    const isLandline = number.length === 10;

    if (!isMobile && !isLandline) {
      return { valid: false, reason: 'Não é um número móvel nem fixo válido' };
    }

    return {
      valid: true,
      type: isMobile ? 'mobile' : 'landline',
      areaCode: areaCode,
      number: number,
      formatted: this.formatBrazilianNumber(number)
    };
  }

  /**
   * Case 3: Format Brazilian phone number for display
   * @param {string} phoneNumber - Raw phone number
   * @returns {string} - Formatted phone number
   */
  static formatBrazilianNumber(phoneNumber) {
    const validation = this.validateBrazilianNumber(phoneNumber);
    if (!validation.valid) return phoneNumber;

    const number = validation.number;
    const areaCode = number.substring(0, 2);

    if (validation.type === 'mobile') {
      // Format: (11) 9 9999-9999
      const digit9 = number[2];
      const firstPart = number.substring(3, 7);
      const lastPart = number.substring(7);
      return `(${areaCode}) ${digit9} ${firstPart}-${lastPart}`;
    } else {
      // Format: (11) 9999-9999
      const firstPart = number.substring(2, 6);
      const lastPart = number.substring(6);
      return `(${areaCode}) ${firstPart}-${lastPart}`;
    }
  }

  /**
   * Case 4: Extract geographic data from phone number
   * @param {string} phoneNumber - Phone number
   * @returns {object} - Geographic information
   */
  static getGeographicData(phoneNumber) {
    const validation = this.validateBrazilianNumber(phoneNumber);
    if (!validation.valid) {
      return { error: validation.reason };
    }

    const areaInfo = BRAZILIAN_AREA_CODES[validation.areaCode];
    
    return {
      areaCode: validation.areaCode,
      state: areaInfo.state,
      region: areaInfo.region,
      timezone: areaInfo.timezone,
      country: 'Brasil',
      countryCode: '+55'
    };
  }

  /**
   * Case 5: Detect mobile carrier (approximation based on common patterns)
   * @param {string} phoneNumber - Mobile phone number
   * @returns {object} - Carrier information
   */
  static detectCarrier(phoneNumber) {
    const validation = this.validateBrazilianNumber(phoneNumber);
    if (!validation.valid || validation.type !== 'mobile') {
      return { error: 'Não é um número móvel válido' };
    }

    const number = validation.number;
    const lastFourDigits = number.substring(3, 7);

    // Simple carrier detection based on common patterns
    // Note: This is approximated as real carrier detection requires API access
    for (const [carrierId, carrier] of Object.entries(BRAZILIAN_CARRIERS)) {
      if (carrier.ranges.includes(lastFourDigits)) {
        return {
          carrier: carrier.name,
          carrierId: carrierId,
          color: carrier.color,
          confidence: 'medium'
        };
      }
    }

    return {
      carrier: 'Operadora Não Identificada',
      carrierId: 'unknown',
      color: '#999999',
      confidence: 'low'
    };
  }

  /**
   * Case 6: Generate WhatsApp URL for Brazilian number
   * @param {string} phoneNumber - Phone number
   * @param {string} message - Optional pre-filled message
   * @returns {string} - WhatsApp URL
   */
  static generateWhatsAppURL(phoneNumber, message = '') {
    const validation = this.validateBrazilianNumber(phoneNumber);
    if (!validation.valid) {
      return null;
    }

    const cleanNumber = '55' + validation.number;
    const encodedMessage = message ? `&text=${encodeURIComponent(message)}` : '';
    
    return `https://wa.me/${cleanNumber}?${encodedMessage}`;
  }

  /**
   * Case 7: Convert to WhatsApp JID format
   * @param {string} phoneNumber - Phone number
   * @returns {string} - WhatsApp JID format
   */
  static toWhatsAppJID(phoneNumber) {
    const validation = this.validateBrazilianNumber(phoneNumber);
    if (!validation.valid) {
      return null;
    }

    return `55${validation.number}@s.whatsapp.net`;
  }

  /**
   * Case 8: Extract number from WhatsApp JID
   * @param {string} jid - WhatsApp JID
   * @returns {string} - Extracted phone number
   */
  static fromWhatsAppJID(jid) {
    if (!jid || !jid.includes('@s.whatsapp.net')) {
      return null;
    }

    const number = jid.split('@')[0];
    if (number.startsWith('55')) {
      return number.substring(2);
    }
    
    return number;
  }

  /**
   * Case 9: Get complete phone number analysis
   * @param {string} phoneNumber - Phone number to analyze
   * @returns {object} - Complete analysis
   */
  static analyzeNumber(phoneNumber) {
    const validation = this.validateBrazilianNumber(phoneNumber);
    if (!validation.valid) {
      return { error: validation.reason };
    }

    const geographic = this.getGeographicData(phoneNumber);
    const carrier = validation.type === 'mobile' ? this.detectCarrier(phoneNumber) : null;

    return {
      original: phoneNumber,
      cleaned: validation.number,
      formatted: validation.formatted,
      type: validation.type,
      areaCode: validation.areaCode,
      geographic: geographic,
      carrier: carrier,
      whatsapp: {
        url: this.generateWhatsAppURL(phoneNumber),
        jid: this.toWhatsAppJID(phoneNumber)
      },
      valid: true
    };
  }

  /**
   * Case 10: Batch analyze multiple phone numbers
   * @param {Array} phoneNumbers - Array of phone numbers
   * @returns {Array} - Array of analysis results
   */
  static batchAnalyze(phoneNumbers) {
    if (!Array.isArray(phoneNumbers)) {
      return [];
    }

    return phoneNumbers.map(number => ({
      input: number,
      analysis: this.analyzeNumber(number)
    }));
  }

  /**
   * Case 11: Filter valid Brazilian numbers from array
   * @param {Array} phoneNumbers - Array of phone numbers
   * @returns {Array} - Valid Brazilian numbers only
   */
  static filterValidBrazilianNumbers(phoneNumbers) {
    if (!Array.isArray(phoneNumbers)) {
      return [];
    }

    return phoneNumbers.filter(number => {
      const validation = this.validateBrazilianNumber(number);
      return validation.valid;
    });
  }

  /**
   * Case 12: Group numbers by state/region
   * @param {Array} phoneNumbers - Array of phone numbers
   * @returns {object} - Numbers grouped by state
   */
  static groupByState(phoneNumbers) {
    const grouped = {};

    phoneNumbers.forEach(number => {
      const analysis = this.analyzeNumber(number);
      if (analysis.valid) {
        const state = analysis.geographic.state;
        if (!grouped[state]) {
          grouped[state] = {
            state: state,
            region: analysis.geographic.region,
            numbers: []
          };
        }
        grouped[state].numbers.push(analysis);
      }
    });

    return grouped;
  }

  /**
   * Case 13: Generate random valid Brazilian phone number for testing
   * @param {number} areaCode - Optional specific area code
   * @returns {string} - Random valid Brazilian phone number
   */
  static generateRandomBrazilianNumber(areaCode = null) {
    const areaCodes = Object.keys(BRAZILIAN_AREA_CODES);
    const selectedAreaCode = areaCode || areaCodes[Math.floor(Math.random() * areaCodes.length)];
    
    // Generate random mobile number
    const randomNumber = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
    
    return `${selectedAreaCode}9${randomNumber}`;
  }

  /**
   * Case 14: Check if number is from specific region/state
   * @param {string} phoneNumber - Phone number to check
   * @param {string} state - State code (SP, RJ, etc.)
   * @returns {boolean} - True if from specified state
   */
  static isFromState(phoneNumber, state) {
    const geographic = this.getGeographicData(phoneNumber);
    return geographic.state === state.toUpperCase();
  }

  /**
   * Case 15: Get business hours based on phone number timezone
   * @param {string} phoneNumber - Phone number
   * @returns {object} - Business hours information
   */
  static getBusinessHours(phoneNumber) {
    const geographic = this.getGeographicData(phoneNumber);
    if (geographic.error) {
      return { error: geographic.error };
    }

    const now = new Date();
    const formatter = new Intl.DateTimeFormat('pt-BR', {
      timeZone: geographic.timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });

    const localTime = formatter.format(now);
    const [hours, minutes] = localTime.split(':').map(Number);
    const currentHour = hours + (minutes / 60);

    return {
      timezone: geographic.timezone,
      localTime: localTime,
      isBusinessHours: currentHour >= 8 && currentHour <= 18,
      businessHoursMessage: currentHour >= 8 && currentHour <= 18 
        ? 'Horário comercial' 
        : 'Fora do horário comercial'
    };
  }
}

module.exports = BrazilianPhoneNumberUtil;