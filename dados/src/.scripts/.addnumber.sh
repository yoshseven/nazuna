#!/bin/bash

# Nazuna Bot - Script de Inicialização com Múltiplas Conexões
# Criado por Hiudy
# Mantenha os créditos, por favor! <3

# Configurações iniciais
set -e
CONFIG_FILE="./dados/src/config.json"
NODE_MODULES="./node_modules"
QR_CODE_DIR="./dados/database/qr-code"
CONNECT_FILE="./dados/src/connect.js"
VERSION=$(jq -r .version package.json 2>/dev/null || echo "Desconhecida")

# Funções utilitárias
print_message() {
    printf "\033[1;32m%s\033[0m\n" "$1"
}

print_warning() {
    printf "\033[1;31m%s\033[0m\n" "$1"
}

print_separator() {
    printf "\033[1;34m============================================\033[0m\n"
}

# Verifica pré-requisitos
check_requirements() {
    [ -f "$CONFIG_FILE" ] || {
        print_warning "⚠ Configuração não encontrada!"
        print_message "🔹 Execute: npm run config"
        exit 1
    }

    [ -d "$NODE_MODULES" ] || {
        print_warning "⚠ Módulos não instalados!"
        print_message "🔹 Execute: npm run config:install"
        exit 1
    }

    command -v node >/dev/null 2>&1 || {
        print_warning "❌ Node.js não encontrado. Instale o Node.js."
        exit 1
    }
}

# Lista conexões existentes
list_connections() {
    if [ -d "$QR_CODE_DIR" ]; then
        find "$QR_CODE_DIR" -maxdepth 1 -type d -not -path "$QR_CODE_DIR" -exec basename {} \;
    fi
}

# Função para escolher método de conexão
choose_connection_method() {
    local choice
    print_message "🔗 Escolha o método de conexão:"
    printf "\033[1;33m1.\033[0m QR Code\n"
    printf "\033[1;33m2.\033[0m Código de Pareamento\n"
    printf "Opção (1/2): "
    
    read -r choice
    case "$choice" in
        1) echo "qr" ;;
        2) echo "code" ;;
        *) 
            print_warning "❌ Opção inválida! Escolha 1 ou 2."
            exit 1
            ;;
    esac
}

# Pergunta sobre nova conexão
ask_new_connection() {
    local response
    print_message "⚒️ Deseja adicionar uma nova conexão?"
    printf "Conexões existentes: %s\n" "$(list_connections | paste -sd, - || echo "Nenhuma")"
    printf "Adicionar nova? (S/n): "
    
    read -r response
    response=$(echo "${response:-s}" | tr '[:upper:]' '[:lower:]')
    [[ "$response" = "s" || -z "$response" ]] && echo "--add-number" || echo ""
}

# Executa o bot
run_bot() {
    local mode=$1
    local add_flag=$2
    local cmd="node --expose-gc $CONNECT_FILE $add_flag"
    [ -n "$mode" ] && cmd="$cmd --$mode"

    print_message "🚀 Iniciando Nazuna Bot..."
    while true; do
        $cmd || {
            print_warning "⚠ Bot caiu! Reiniciando em 1 segundo..."
            sleep 1
        }
    done
}

# Main
main() {
    print_separator
    print_message "🚀 Inicializador da Nazuna - v$VERSION"
    print_message "🔧 Criado por Hiudy"
    print_message "⚒️ Sistema de Múltiplas Conexões - v1.0"
    print_separator
    echo

    check_requirements

    local add_flag
    add_flag=$(ask_new_connection)
    
    if [ -z "$add_flag" ] && [ -z "$(list_connections)" ]; then
        print_warning "⚠ Nenhuma conexão encontrada! Adicione uma nova conexão."
        add_flag="--add-number"
    fi

    local mode
    [ -n "$add_flag" ] && mode=$(choose_connection_method) || mode=""
    
    run_bot "$mode" "$add_flag"
}

# Executa com tratamento de erros
main || {
    print_warning "❌ Erro ao iniciar o bot."
    exit 1
}