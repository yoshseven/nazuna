# 📱 Brazilian Phone Number Commands - Nazuna Bot

## Overview
I've added comprehensive Brazilian phone number data extraction capabilities to your Nazuna WhatsApp Bot. These commands can validate, analyze, format, and extract detailed information from Brazilian phone numbers.

## 🚀 New Commands Available

### 1. `/analisar` - Complete Phone Number Analysis
**Aliases:** `/analisarnumero`, `/phonedata`

Performs complete analysis of a Brazilian phone number, extracting:
- Geographic location (state, region, timezone)
- Phone type (mobile/landline)
- Carrier detection (when possible)
- WhatsApp link generation
- Proper formatting

**Usage:**
```
/analisar 11999887766
/analisar (11) 9 9988-7766
/analisar +55 11 99988-7766
```

### 2. `/validar` - Phone Number Validation
**Aliases:** `/validarnumero`, `/validphone`

Validates if a phone number is a proper Brazilian format and provides basic information.

**Usage:**
```
/validar 11999887766
/validar 1133334444
```

### 3. `/lote` - Batch Analysis
**Aliases:** `/loteanalise`, `/batchphone`

Analyzes multiple phone numbers at once (up to 10), providing statistics and grouping by state.

**Usage:**
```
/lote 11999887766 21988776655 31977665544
/lote (11)99988-7766 (21)98877-6655 (31)97766-5544
```

### 4. `/formatar` - Phone Number Formatting
**Aliases:** `/formatarnumero`, `/formatphone`

Formats phone numbers in the standard Brazilian format and generates WhatsApp links for mobile numbers.

**Usage:**
```
/formatar 11999887766
/formatar 1133334444
```

### 5. `/horario` - Business Hours Check
**Aliases:** `/horariocomercial`, `/businesshours`

Checks the current local time in the region of the phone number and indicates if it's business hours.

**Usage:**
```
/horario 11999887766
/horario 85988776655
```

### 6. `/estado` - Filter by State
**Aliases:** `/filtroestado`, `/filterstate`

Filters a list of phone numbers to show only those from a specific Brazilian state.

**Usage:**
```
/estado SP 11999887766 21988776655 11977665544
/estado RJ 21988776655 11999887766 21977665544
```

## 📊 Data Extracted

The Brazilian phone utility provides 15 different types of data extraction:

### Geographic Data
- **State:** All 26 Brazilian states + Federal District
- **Region:** Specific cities/regions for each area code
- **Timezone:** Correct timezone for each region
- **Area Code:** 2-digit area code validation

### Phone Information
- **Type Detection:** Mobile vs Landline identification
- **Format Validation:** Proper Brazilian number format
- **Carrier Detection:** Basic carrier identification (approximated)
- **WhatsApp Compatibility:** Automatic WhatsApp link generation

### Business Intelligence
- **Business Hours:** Local time and business hours status
- **Batch Processing:** Multiple number analysis
- **State Filtering:** Geographic filtering capabilities
- **Statistics:** Validation and grouping statistics

## 🗺️ Supported Regions

The system supports all Brazilian area codes:

### Major Cities Covered
- **São Paulo (SP):** 11, 12, 13, 14, 15, 16, 17, 18, 19
- **Rio de Janeiro (RJ):** 21, 22, 24
- **Minas Gerais (MG):** 31, 32, 33, 34, 35, 37, 38
- **Paraná (PR):** 41, 42, 43, 44, 45, 46
- **Rio Grande do Sul (RS):** 51, 53, 54, 55
- **Bahia (BA):** 71, 73, 74, 75, 77
- **Ceará (CE):** 85, 88
- **And all other Brazilian states...**

## 💡 Use Cases

### For Business
- **Lead Qualification:** Validate phone numbers before calling
- **Geographic Targeting:** Identify customer locations
- **Time Zone Management:** Respect business hours across Brazil
- **Data Cleaning:** Format and validate phone databases

### For Personal Use
- **Contact Verification:** Check if numbers are valid
- **WhatsApp Links:** Generate direct chat links
- **Regional Information:** Learn about phone number origins
- **Number Formatting:** Standardize contact formats

## 🔧 Technical Features

### Validation Rules
- Country code handling (+55)
- Area code validation (all Brazilian codes)
- Mobile number detection (9 + 8 digits)
- Landline number detection (8 digits)
- Format flexibility (accepts various input formats)

### Error Handling
- Graceful error messages in Portuguese
- Input validation and sanitization
- Comprehensive error reporting
- User-friendly feedback

### Performance
- Fast local processing
- No external API dependencies for basic validation
- Efficient batch processing
- Minimal memory footprint

## 📝 Example Outputs

### Complete Analysis Example
```
📱 Análise do Número Brasileiro

📞 Número Original: 11999887766
📱 Número Limpo: 11999887766
✨ Formatado: (11) 9 9988-7766
📋 Tipo: 📱 Celular

🗺️ Localização:
• Estado: SP
• Região: São Paulo (Capital)
• Código de Área: 11
• País: Brasil
• Código do País: +55

⏰ Fuso Horário: America/Sao_Paulo

💬 Link WhatsApp: https://wa.me/5511999887766
```

### Batch Analysis Example
```
📊 Análise em Lote - 3 números

✅ Válidos: 3
❌ Inválidos: 0

🗺️ Por Estado:
• SP (São Paulo Capital): 2 número(s)
• RJ (Rio de Janeiro Capital): 1 número(s)

📱 Números Válidos:
1. (11) 9 9988-7766 - SP
2. (11) 9 7766-5544 - SP
3. (21) 9 8877-6655 - RJ
```

## 🛠️ Installation Notes

The Brazilian phone utilities are now fully integrated into your Nazuna Bot:

1. ✅ **BrazilianPhoneUtil** class added to `dados/src/funcs/utils/brazilian-phone.js`
2. ✅ **Command handlers** added to `dados/src/funcs/brazilian-phone-commands.js`
3. ✅ **Bot integration** added to main `dados/src/index.js`
4. ✅ **Exports configuration** updated in `dados/src/funcs/exports.js`

## 🚨 Important Notes

- Commands work with various input formats (with/without formatting)
- All responses are in Portuguese to match your bot's language
- No external API calls required for basic functionality
- Carrier detection is approximated (real detection would require API access)
- Maximum 10 numbers per batch analysis to prevent spam

## 🔮 Future Enhancements

The system is designed to be easily extensible:
- Real-time carrier detection via APIs
- Number portability checking
- Phone number history tracking
- Integration with CRM systems
- Advanced analytics and reporting

---

🎉 **Your Nazuna Bot now has powerful Brazilian phone number capabilities!** Users can validate, analyze, and extract comprehensive data from phone numbers with simple commands.