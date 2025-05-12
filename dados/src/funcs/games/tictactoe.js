/**
 * Sistema de Jogo da Velha Premium
 * Desenvolvido por Hiudy
 * Versão: 2.0.0
 */

// Cache e configurações
const CONFIG = {
  INVITATION_TIMEOUT: 15 * 60 * 1000, // 15 minutos
  GAME_TIMEOUT: 30 * 60 * 1000,      // 30 minutos
  MAX_GAMES_PER_GROUP: 1,
  BOARD_SIZE: 9,
  SYMBOLS: { X: '❌', O: '⭕' }
};

// Gerenciamento de estado do jogo
const GameState = {
  activeGames: new Map(),
  pendingInvitations: new Map(),

  // Limpa jogos e convites expirados periodicamente
  cleanup() {
    const now = Date.now();
    
    // Limpa jogos inativos
    for (const [groupId, game] of this.activeGames) {
      if (now - game.startTime > CONFIG.GAME_TIMEOUT) {
        this.activeGames.delete(groupId);
      }
    }
    
    // Limpa convites expirados
    for (const [groupId, invitation] of this.pendingInvitations) {
      if (now - invitation.timestamp > CONFIG.INVITATION_TIMEOUT) {
        this.pendingInvitations.delete(groupId);
      }
    }
  }
};

// Executa limpeza a cada 5 minutos
setInterval(() => GameState.cleanup(), 5 * 60 * 1000);

class TicTacToe {
  constructor(player1, player2) {
    this.board = Array(CONFIG.BOARD_SIZE).fill(null);
    this.players = { X: player1, O: player2 };
    this.currentTurn = 'X';
    this.moves = 0;
    this.startTime = Date.now();
    this.lastMoveTime = Date.now();
  }

  makeMove(player, position) {
    // Validações básicas
    if (!this.isValidGame()) {
      return this.createResponse(false, '❌ Erro: Jogadores inválidos');
    }

    if (!this.isPlayerTurn(player)) {
      return this.createResponse(false, '❌ Não é sua vez!');
    }

    const index = this.validatePosition(position);
    if (index === -1) {
      return this.createResponse(false, '❌ Posição inválida! Use 1-9.');
    }

    if (this.board[index]) {
      return this.createResponse(false, '❌ Posição já ocupada!');
    }

    // Realiza a jogada
    this.board[index] = CONFIG.SYMBOLS[this.currentTurn];
    this.moves++;
    this.lastMoveTime = Date.now();

    // Verifica resultado
    if (this.checkWin()) {
      return this.createWinResponse();
    }

    if (this.moves === CONFIG.BOARD_SIZE) {
      return this.createDrawResponse();
    }

    // Próxima jogada
    this.currentTurn = this.currentTurn === 'X' ? 'O' : 'X';
    return this.createTurnResponse();
  }

  renderBoard() {
    const display = pos => this.board[pos] || (pos + 1);
    return [
      '```',
      `${display(0)} │ ${display(1)} │ ${display(2)}`,
      '──┼───┼──',
      `${display(3)} │ ${display(4)} │ ${display(5)}`,
      '──┼───┼──',
      `${display(6)} │ ${display(7)} │ ${display(8)}`,
      '```'
    ].join('\n');
  }

  checkWin() {
    const patterns = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];

    return patterns.some(([a, b, c]) =>
      this.board[a] && this.board[a] === this.board[b] && this.board[a] === this.board[c]
    );
  }

  // Métodos auxiliares
  isValidGame() {
    return this.players.X && this.players.O;
  }

  isPlayerTurn(player) {
    return player === this.players[this.currentTurn];
  }

  validatePosition(position) {
    const pos = parseInt(position);
    return (!isNaN(pos) && pos >= 1 && pos <= 9) ? pos - 1 : -1;
  }

  createResponse(success, message, extras = {}) {
    return { success, message, ...extras };
  }

  createWinResponse() {
    const winner = this.players[this.currentTurn];
    return this.createResponse(true, 
      `🎮 *JOGO DA VELHA - FIM*\n\n🎉 @${winner.split('@')[0]} venceu! 🏆\n\n${this.renderBoard()}`,
      {
        finished: true,
        winner,
        board: this.renderBoard(),
        mentions: [winner]
      }
    );
  }

  createDrawResponse() {
    return this.createResponse(true,
      `🎮 *JOGO DA VELHA - FIM*\n\n🤝 Empate!\n\n${this.renderBoard()}`,
      {
        finished: true,
        draw: true,
        board: this.renderBoard(),
        mentions: Object.values(this.players)
      }
    );
  }

  createTurnResponse() {
    const nextPlayer = this.players[this.currentTurn];
    return this.createResponse(true,
      `🎮 *JOGO DA VELHA*\n\n👉 Vez de @${nextPlayer.split('@')[0]}\n\n${this.renderBoard()}\n\n💡 Digite um número de 1 a 9.`,
      {
        finished: false,
        board: this.renderBoard(),
        mentions: [nextPlayer]
      }
    );
  }
}

// Interface pública
module.exports = {
  async invitePlayer(groupId, inviter, invitee) {
    // Validações
    if (!groupId || !inviter || !invitee || inviter === invitee) {
      return { success: false, message: '❌ Dados inválidos para o convite' };
    }

    if (GameState.activeGames.has(groupId)) {
      return { success: false, message: '❌ Já existe um jogo em andamento!' };
    }

    if (GameState.pendingInvitations.has(groupId)) {
      return { success: false, message: '❌ Já existe um convite pendente!' };
    }

    // Cria convite
    GameState.pendingInvitations.set(groupId, { 
      inviter, 
      invitee, 
      timestamp: Date.now() 
    });

    return {
      success: true,
      message: `🎮 *CONVITE JOGO DA VELHA*\n\n@${inviter.split('@')[0]} convidou @${invitee.split('@')[0]}!\n\n✅ Aceitar: "sim", "s", "yes", "y"\n❌ Recusar: "não", "n", "no"\n\n⏳ Expira em 15 minutos.`,
      mentions: [inviter, invitee]
    };
  },

  processInvitationResponse(groupId, invitee, response) {
    const invitation = GameState.pendingInvitations.get(groupId);
    
    if (!invitation || invitation.invitee !== invitee) {
      return { success: false, message: '❌ Nenhum convite pendente para você' };
    }

    const acceptResponses = ['s', 'sim', 'y', 'yes'];
    const rejectResponses = ['n', 'não', 'nao', 'no'];
    const normalizedResponse = response.toLowerCase().trim();

    GameState.pendingInvitations.delete(groupId);

    if (!acceptResponses.includes(normalizedResponse) && !rejectResponses.includes(normalizedResponse)) {
      return { success: false, message: '❌ Resposta inválida. Use "sim" ou "não"' };
    }

    if (rejectResponses.includes(normalizedResponse)) {
      return {
        success: true,
        accepted: false,
        message: '❌ Convite recusado. Jogo cancelado.',
        mentions: [invitation.inviter, invitee]
      };
    }

    // Inicia novo jogo
    const game = new TicTacToe(invitation.inviter, invitation.invitee);
    GameState.activeGames.set(groupId, game);

    return {
      success: true,
      accepted: true,
      message: `🎮 *JOGO DA VELHA*\n\n🎯 Iniciado!\n\n👥 Jogadores:\n➤ ❌: @${invitation.inviter.split('@')[0]}\n➤ ⭕: @${invitation.invitee.split('@')[0]}\n\n${game.renderBoard()}\n\n💡 Vez de @${invitation.inviter.split('@')[0]} (1-9).`,
      mentions: [invitation.inviter, invitation.invitee]
    };
  },

  makeMove(groupId, player, position) {
    const game = GameState.activeGames.get(groupId);
    
    if (!game) {
      return { success: false, message: '❌ Nenhum jogo em andamento!' };
    }

    if (Date.now() - game.startTime > CONFIG.GAME_TIMEOUT) {
      GameState.activeGames.delete(groupId);
      return { success: false, message: '❌ Jogo encerrado por inatividade (30 minutos)' };
    }

    const result = game.makeMove(player, position);
    
    if (result.finished) {
      GameState.activeGames.delete(groupId);
    }
    
    return result;
  },

  endGame(groupId) {
    const game = GameState.activeGames.get(groupId);
    
    if (!game) {
      return { success: false, message: '❌ Nenhum jogo em andamento!' };
    }

    const players = Object.values(game.players);
    GameState.activeGames.delete(groupId);
    
    return {
      success: true,
      message: '🎮 Jogo encerrado manualmente!',
      mentions: players
    };
  },

  hasActiveGame(groupId) {
    return GameState.activeGames.has(groupId);
  },

  hasPendingInvitation(groupId) {
    return GameState.pendingInvitations.has(groupId);
  }
};
