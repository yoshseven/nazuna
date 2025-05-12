#!/bin/sh

# Função para exibir mensagens formatadas
mensagem() {
    printf "\033[1;32m$1\033[0m"
}

aviso() {
    printf "\033[1;31m$1\033[0m"
}

separador() {
    printf "\033[1;34m============================================\033[0m"
}

# Obtém a versão do package.json
versao=$(jq -r .version package.json 2>/dev/null || echo "Desconhecida")

# Caminho dos arquivos necessários
config="./dados/src/config.json"
node_modules="./node_modules"
qr_code_dir="./dados/database/qr-code"
connect_file="./dados/src/connect.js"

# Exibe o cabeçalho
separador
mensagem "   🚀 Inicializador da Nazuna 🚀        "
mensagem "   🔧 Criado por Hiudy - Versão: $versao 🔧"
separador
echo ""

# Verifica se a configuração já foi feita
if [ ! -f "$config" ]; then
    aviso "⚠ Opa! Parece que você ainda não configurou o bot."
    mensagem "🔹 Para configurar, execute: \033[1;34mnpm run config\033[0m"
    exit 1
fi

# Verifica se os módulos estão instalados
if [ ! -d "$node_modules" ]; then
    aviso "⚠ Opa! Parece que os módulos ainda não foram instalados."
    mensagem "📦 Para instalar, execute: \033[1;34mnpm run config:install\033[0m"
    exit 1
fi

# Verifica se há mais de 2 arquivos na pasta QR Code
if [ -d "$qr_code_dir" ] && [ "$(ls -1 "$qr_code_dir" 2>/dev/null | wc -l)" -gt 2 ]; then
    mensagem "📡 QR Code já detectado! Iniciando conexão automática..."
    while true; do
        node --expose-gc "$connect_file" || {
            aviso "⚠ O bot caiu! Reiniciando em 0.01 segundo..."
            sleep 0.01
        }
    done
    exit 0
fi

# Pergunta sobre o método de conexão
echo "🔗 Como deseja conectar o bot?"
echo "\033[1;33m1.\033[0m Conexão por QR Code"
echo "\033[1;33m2.\033[0m Conexão por Código"
echo "Escolha uma opção (1/2):"
read conexao

# Inicia conforme a escolha
case "$conexao" in
    1)
        mensagem "📡 Iniciando conexão por QR Code..."
        while true; do
            node --expose-gc "$connect_file" || {
                aviso "⚠ O bot caiu! Reiniciando em 0.01 segundo..."
                sleep 0.01
            }
        done
        ;;
    2)
        mensagem "🔑 Iniciando conexão por Código..."
        while true; do
            node --expose-gc "$connect_file" --code || {
                aviso "⚠ O bot caiu! Reiniciando em 0.01 segundo..."
                sleep 0.01
            }
        done
        ;;
    *)
        aviso "❌ Opção inválida! Reinicie o script e escolha 1 ou 2."
        exit 1
        ;;
esac