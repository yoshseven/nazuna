#!/bin/bash

# Nazuninha Bot - Script de Atualização
# Criado por Hiudy
# Mantenha os créditos, por favor! <3

# Configurações iniciais
set -e
BACKUP_DIR="./backup_$(date +%Y%m%d_%H%M%S)"
TEMP_DIR="./temp_nazuninha"
REPO_URL="https://github.com/hiudyy/nazuninha-bot.git"

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

# Verifica dependências
check_requirements() {
    command -v git >/dev/null 2>&1 || { print_warning "❌ Git não encontrado. Instale o Git."; exit 1; }
    command -v npm >/dev/null 2>&1 || { print_warning "❌ Node.js/NPM não encontrado. Instale o Node.js."; exit 1; }
}

# Confirmação do usuário com timeout de 5 segundos
confirm_update() {
    print_warning "⚠ Esta ação substituirá arquivos existentes (com backup dos dados)."
    print_warning "Pressione Ctrl+C para cancelar. Iniciando em 5 segundos..."
    
    # Timeout de 5 segundos
    for i in {5..1}; do
        printf "\rIniciando em %d..." "$i"
        sleep 1
    done
    printf "\r%-20s\n" ""
    
    # Prossegue automaticamente após o timeout
    print_message "✔ Prosseguindo com a atualização..."
}

# Criação do backup
create_backup() {
    print_message "📂 Criando backup dos dados..."
    mkdir -p "$BACKUP_DIR/dados/database" "$BACKUP_DIR/dados/src" "$BACKUP_DIR/dados/midias"
    
    cp -rp "./dados/database/." "$BACKUP_DIR/dados/database/" 2>/dev/null || true
    cp -p "./dados/src/config.json" "$BACKUP_DIR/dados/src/" 2>/dev/null || true
    cp -rp "./dados/midias/." "$BACKUP_DIR/dados/midias/" 2>/dev/null || true
    
    print_message "✔ Backup salvo em $BACKUP_DIR"
}

# Download da nova versão
download_update() {
    print_message "⬇️ Baixando versão mais recente..."
    rm -rf "$TEMP_DIR"
    git clone --depth 1 "$REPO_URL" "$TEMP_DIR" || {
        print_warning "❌ Falha ao baixar o repositório. Verifique sua conexão."
        exit 1
    }
    rm -f "$TEMP_DIR/README.md"
}

# Limpeza de arquivos antigos
clean_old_files() {
    print_message "🧹 Limpando arquivos antigos..."
    rm -rf .git package.json package-lock.json
    find ./dados/ -mindepth 1 -not -path "$BACKUP_DIR/*" -delete 2>/dev/null || true
}

# Aplicação da atualização
apply_update() {
    print_message "🚚 Aplicando atualização..."
    mv "$TEMP_DIR"/* ./
    rm -rf "$TEMP_DIR"
}

# Restauração do backup
restore_backup() {
    print_message "🔄 Restaurando dados do backup..."
    mkdir -p "./dados/database" "./dados/src" "./dados/midias"
    
    cp -rp "$BACKUP_DIR/dados/database/." "./dados/database/" 2>/dev/null || true
    cp -p "$BACKUP_DIR/dados/src/config.json" "./dados/src/" 2>/dev/null || true
    cp -rp "$BACKUP_DIR/dados/midias/." "./dados/midias/" 2>/dev/null || true
    
    print_message "✔ Dados restaurados com sucesso!"
}

# Instalação de dependências
install_dependencies() {
    print_message "📦 Instalando dependências..."
    npm install --no-bin-links --force || {
        print_warning "❌ Falha ao instalar dependências. Verifique package.json."
        exit 1
    }
    print_message "✔ Dependências instaladas!"
}

# Limpeza final
cleanup() {
    print_message "🧹 Finalizando..."
    rm -rf "$BACKUP_DIR" || true
}

# Main
main() {
    print_separator
    print_message "🔄 Atualização do Nazuninha Bot"
    print_message "🚀 Criado por Hiudy"
    print_separator
    echo

    check_requirements
    confirm_update
    create_backup
    download_update
    clean_old_files
    apply_update
    restore_backup
    install_dependencies
    cleanup

    print_separator
    print_message "🎉 Atualização concluída com sucesso!"
    print_message "🚀 Inicie o bot com: npm start"
    print_separator
}

# Executa com tratamento de erros
main || {
    print_warning "❌ Erro durante a atualização. Seu backup está em $BACKUP_DIR"
    exit 1
}