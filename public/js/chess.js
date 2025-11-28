class ChessGame {
    constructor() {
        this.board = this.initializeBoard();
        this.currentPlayer = 'branco';
        this.gameState = 'playing'; // playing, check, checkmate, stalemate, draw
        this.moveHistory = [];
        this.capturedPieces = { branco: [], preto: [] };
        this.castlingRights = {
            branco: { kingSide: true, queenSide: true },
            preto: { kingSide: true, queenSide: true }
        };
        // alvo de en passant (linha,coluna) ou null
        this.enPassantTarget = null;
    }

    initializeBoard() {
        const board = Array(9).fill(null).map(() => Array(9).fill(null));
        
        board[1][1] = new Rook('preto', 1, 1);
        board[1][2] = new Knight('preto', 1, 2);
        board[1][3] = new Bishop('preto', 1, 3);
        board[1][4] = new Queen('preto', 1, 4);
        board[1][5] = new King('preto', 1, 5);
        board[1][6] = new Bishop('preto', 1, 6);
        board[1][7] = new Knight('preto', 1, 7);
        board[1][8] = new Rook('preto', 1, 8);
        
        for (let col = 1; col <= 8; col++) {
            board[2][col] = new Pawn('preto', 2, col);
        }
        
        for (let col = 1; col <= 8; col++) {
            board[7][col] = new Pawn('branco', 7, col);
        }
        
        board[8][1] = new Rook('branco', 8, 1);
        board[8][2] = new Knight('branco', 8, 2);
        board[8][3] = new Bishop('branco', 8, 3);
        board[8][4] = new Queen('branco', 8, 4);
        board[8][5] = new King('branco', 8, 5);
        board[8][6] = new Bishop('branco', 8, 6);
        board[8][7] = new Knight('branco', 8, 7);
        board[8][8] = new Rook('branco', 8, 8);
        
        return board;
    }

    isValidPosition(row, col) {
        return row >= 1 && row <= 8 && col >= 1 && col <= 8;
    }

    getPiece(row, col) {
        if (!this.isValidPosition(row, col)) return null;
        return this.board[row][col];
    }

    isSquareEmpty(row, col) {
        return this.getPiece(row, col) === null;
    }

    isSquareOccupiedByEnemy(row, col, color) {
        const piece = this.getPiece(row, col);
        return piece !== null && piece.color !== color;
    }

    isSquareOccupiedByAlly(row, col, color) {
        const piece = this.getPiece(row, col);
        return piece !== null && piece.color === color;
    }

    movePiece(fromRow, fromCol, toRow, toCol) {
        const piece = this.getPiece(fromRow, fromCol);
        if (!piece) return false;

        if (piece.color !== this.currentPlayer) return false;

        let capturedPiece = this.getPiece(toRow, toCol);

        // captura en passant
        if (!capturedPiece && piece instanceof Pawn && this.enPassantTarget &&
            this.enPassantTarget.row === toRow && this.enPassantTarget.col === toCol &&
            fromCol !== toCol) {
            const pawnRow = piece.color === 'branco' ? toRow + 1 : toRow - 1;
            capturedPiece = this.getPiece(pawnRow, toCol);
            if (capturedPiece && capturedPiece instanceof Pawn && capturedPiece.color !== piece.color) {
                this.board[pawnRow][toCol] = null;
                this.capturedPieces[capturedPiece.color].push(capturedPiece);
            }
        } else if (capturedPiece) {
            this.capturedPieces[capturedPiece.color].push(capturedPiece);
        }

        // atualizar alvo de en passant
        this.enPassantTarget = null;
        if (piece instanceof Pawn && Math.abs(toRow - fromRow) === 2 && fromCol === toCol && !capturedPiece) {
            // casa "por cima" do peão que andou duas casas
            const middleRow = (fromRow + toRow) / 2;
            this.enPassantTarget = { row: middleRow, col: fromCol };
        }

        this.handleSpecialMoves(piece, fromRow, fromCol, toRow, toCol);

        piece.row = toRow;
        piece.col = toCol;
        piece.hasMoved = true;

        this.board[toRow][toCol] = piece;
        this.board[fromRow][fromCol] = null;

        this.handlePawnPromotion(piece, toRow, toCol);

        this.moveHistory.push({
            from: { row: fromRow, col: fromCol },
            to: { row: toRow, col: toCol },
            piece: piece.constructor.name,
            captured: capturedPiece ? capturedPiece.constructor.name : null,
            moveNumber: this.moveHistory.length + 1
        });

        // após o movimento, passa a vez para o outro jogador
        this.currentPlayer = this.currentPlayer === 'branco' ? 'preto' : 'branco';

        // e então atualiza o estado do jogo do ponto de vista de quem vai jogar
        this.updateGameState();

        return true;
    }

    handleSpecialMoves(piece, fromRow, fromCol, toRow, toCol) {
        // Roque
        if (piece instanceof King && Math.abs(toCol - fromCol) === 2) {
            const isKingSide = toCol > fromCol;
            // nosso tabuleiro usa colunas 1..8
            const rookCol = isKingSide ? 8 : 1;
            const newRookCol = isKingSide ? 6 : 4;
            
            const rook = this.getPiece(fromRow, rookCol);
            if (rook instanceof Rook) {
                rook.row = fromRow;
                rook.col = newRookCol;
                rook.hasMoved = true;
                this.board[fromRow][newRookCol] = rook;
                this.board[fromRow][rookCol] = null;
            }
        }

        // preciso implementar o en passant aqui
    }

    handlePawnPromotion(piece, toRow, toCol) {
        if (piece instanceof Pawn) {
            // a lógica visual de promoção é tratada em tabuleiro.html (função escolhe)
            // aqui não promovemos automaticamente para evitar conflito
        }
    }

    isValidMove(fromRow, fromCol, toRow, toCol) {
        const piece = this.getPiece(fromRow, fromCol);
        if (!piece) return false;

        if (!this.isValidPosition(toRow, toCol)) return false;

        if (this.isSquareOccupiedByAlly(toRow, toCol, piece.color)) return false;

        if (!piece.canMove(toRow, toCol, this)) return false;

        // não permitir movimentos que deixem o próprio rei em xeque
        if (this.wouldMovePutKingInCheck(fromRow, fromCol, toRow, toCol, piece.color)) {
            return false;
        }

        return true;
    }

    wouldMovePutKingInCheck(fromRow, fromCol, toRow, toCol, color) {
        const originalPiece = this.getPiece(fromRow, fromCol);
        const capturedPiece = this.getPiece(toRow, toCol);
        
        this.board[toRow][toCol] = originalPiece;
        this.board[fromRow][fromCol] = null;
        if (originalPiece) {
            originalPiece.row = toRow;
            originalPiece.col = toCol;
        }

        const kingInCheck = this.isKingInCheck(color);

        this.board[fromRow][fromCol] = originalPiece;
        this.board[toRow][toCol] = capturedPiece;
        if (originalPiece) {
            originalPiece.row = fromRow;
            originalPiece.col = fromCol;
        }

        return kingInCheck;
    }

    isKingInCheck(color) {
        const king = this.findKing(color);
        if (!king) return false;

        for (let row = 1; row <= 8; row++) {
            for (let col = 1; col <= 8; col++) {
                const piece = this.getPiece(row, col);
                if (piece && piece.color !== color) {
                    // Para o rei inimigo, consideramos apenas o movimento de 1 casa (sem roque)
                    if (piece instanceof King) {
                        const rowDiff = Math.abs(king.row - row);
                        const colDiff = Math.abs(king.col - col);
                        if (rowDiff <= 1 && colDiff <= 1 && (rowDiff + colDiff) > 0) {
                            return true;
                        }
                    } else {
                        if (piece.canMove(king.row, king.col, this)) {
                            return true;
                        }
                    }
                }
            }
        }
        return false;
    }

    findKing(color) {
        for (let row = 1; row <= 8; row++) {
            for (let col = 1; col <= 8; col++) {
                const piece = this.getPiece(row, col);
                if (piece && piece.color === color && piece instanceof King) {
                    return piece;
                }
            }
        }
        return null;
    }

    updateGameState() {
        const kingInCheck = this.isKingInCheck(this.currentPlayer);
        const hasValidMoves = this.hasValidMoves(this.currentPlayer);

        if (kingInCheck && !hasValidMoves) {
            this.gameState = 'checkmate';
        } else if (!kingInCheck && !hasValidMoves) {
            this.gameState = 'stalemate';
        } else if (kingInCheck) {
            this.gameState = 'check';
        } else {
            this.gameState = 'playing';
        }
    }

    hasValidMoves(color) {
        for (let row = 1; row <= 8; row++) {
            for (let col = 1; col <= 8; col++) {
                const piece = this.getPiece(row, col);
                if (piece && piece.color === color) {
                    for (let toRow = 1; toRow <= 8; toRow++) {
                        for (let toCol = 1; toCol <= 8; toCol++) {
                            if (this.isValidMove(row, col, toRow, toCol)) {
                                return true;
                            }
                        }
                    }
                }
            }
        }
        return false;
    }

    getGameStatus() {
        return {
            currentPlayer: this.currentPlayer,
            gameState: this.gameState,
            moveHistory: this.moveHistory,
            capturedPieces: this.capturedPieces
        };
    }
}

class Piece {
    constructor(color, row, col) {
        this.color = color;
        this.row = row;
        this.col = col;
        this.hasMoved = false;
    }

    canMove(toRow, toCol, game) {
        return false;
    }

    getSymbol() {
        return '';
    }
}

class King extends Piece {
    constructor(color, row, col) {
        super(color, row, col);
        this.value = 1000;
    }

    canMove(toRow, toCol, game) {
        const rowDiff = Math.abs(toRow - this.row);
        const colDiff = Math.abs(toCol - this.col);
        
        // Movimento de uma casa em qualquer direção
        if (rowDiff <= 1 && colDiff <= 1 && (rowDiff + colDiff) > 0) {
            return true;
        }

        // Roque
        if (this.canCastle(toRow, toCol, game)) {
            return true;
        }

        return false;
    }

    canCastle(toRow, toCol, game) {
        // roque: rei deve permanecer na mesma linha e mover exatamente 2 casas na horizontal
        if (toRow !== this.row || Math.abs(toCol - this.col) !== 2) return false;

        if (this.hasMoved) return false; // se o rei já se moveu, não pode rocar
        if (game.isKingInCheck(this.color)) return false;

        const row = this.row;
        const isKingSide = toCol > this.col;
        const rookCol = isKingSide ? 8 : 1;
        const rook = game.getPiece(row, rookCol);

        if (!rook || !(rook instanceof Rook) || rook.hasMoved) return false;
        if (rook.color !== this.color) return false;

        // Verificar se as casas entre rei e torre estão vazias
        const startCol = Math.min(this.col, rookCol) + 1;
        const endCol = Math.max(this.col, rookCol);
        for (let col = startCol; col < endCol; col++) {
            if (!game.isSquareEmpty(row, col)) return false;
        }

        // Verificar se o rei não passa por casas em xeque
        const kingDirection = isKingSide ? 1 : -1;
        for (let col = this.col; col !== toCol + kingDirection; col += kingDirection) {
            if (game.wouldMovePutKingInCheck(this.row, this.col, row, col, this.color)) {
                return false;
            }
        }

        return true;
    }

    getSymbol() {
        return this.color === 'branco' ? '♔' : '♚';
    }
}

class Queen extends Piece {
    constructor(color, row, col) {
        super(color, row, col);
        this.value = 9;
    }

    canMove(toRow, toCol, game) {
        const rowDiff = Math.abs(toRow - this.row);
        const colDiff = Math.abs(toCol - this.col);
        
        // Movimento em linha reta (horizontal, vertical ou diagonal)
        if (rowDiff === 0 || colDiff === 0 || rowDiff === colDiff) {
            return this.isPathClear(toRow, toCol, game);
        }
        
        return false;
    }

    isPathClear(toRow, toCol, game) {
        const rowStep = toRow > this.row ? 1 : toRow < this.row ? -1 : 0;
        const colStep = toCol > this.col ? 1 : toCol < this.col ? -1 : 0;
        
        let currentRow = this.row + rowStep;
        let currentCol = this.col + colStep;
        
        while (currentRow !== toRow || currentCol !== toCol) {
            if (!game.isSquareEmpty(currentRow, currentCol)) {
                return false;
            }
            currentRow += rowStep;
            currentCol += colStep;
        }
        
        return true;
    }

    getSymbol() {
        return this.color === 'branco' ? '♕' : '♛';
    }
}


class Rook extends Piece {
    constructor(color, row, col) {
        super(color, row, col);
        this.value = 5;
    }

    canMove(toRow, toCol, game) {
        const rowDiff = Math.abs(toRow - this.row);
        const colDiff = Math.abs(toCol - this.col);
        
        // Movimento horizontal ou vertical
        if ((rowDiff === 0 && colDiff > 0) || (colDiff === 0 && rowDiff > 0)) {
            return this.isPathClear(toRow, toCol, game);
        }
        
        return false;
    }

    isPathClear(toRow, toCol, game) {
        const rowStep = toRow > this.row ? 1 : toRow < this.row ? -1 : 0;
        const colStep = toCol > this.col ? 1 : toCol < this.col ? -1 : 0;
        
        let currentRow = this.row + rowStep;
        let currentCol = this.col + colStep;
        
        while (currentRow !== toRow || currentCol !== toCol) {
            if (!game.isSquareEmpty(currentRow, currentCol)) {
                return false;
            }
            currentRow += rowStep;
            currentCol += colStep;
        }
        
        return true;
    }

    getSymbol() {
        return this.color === 'branco' ? '♖' : '♜';
    }
}

class Bishop extends Piece {
    constructor(color, row, col) {
        super(color, row, col);
        this.value = 3;
    }

    canMove(toRow, toCol, game) {
        const rowDiff = Math.abs(toRow - this.row);
        const colDiff = Math.abs(toCol - this.col);
        
        // Movimento diagonal
        if (rowDiff === colDiff && rowDiff > 0) {
            return this.isPathClear(toRow, toCol, game);
        }
        
        return false;
    }

    isPathClear(toRow, toCol, game) {
        const rowStep = toRow > this.row ? 1 : -1;
        const colStep = toCol > this.col ? 1 : -1;
        
        let currentRow = this.row + rowStep;
        let currentCol = this.col + colStep;
        
        while (currentRow !== toRow || currentCol !== toCol) {
            if (!game.isSquareEmpty(currentRow, currentCol)) {
                return false;
            }
            currentRow += rowStep;
            currentCol += colStep;
        }
        
        return true;
    }

    getSymbol() {
        return this.color === 'branco' ? '♗' : '♝';
    }
}

class Knight extends Piece {
    constructor(color, row, col) {
        super(color, row, col);
        this.value = 3;
    }

    canMove(toRow, toCol, game) {
        const rowDiff = Math.abs(toRow - this.row);
        const colDiff = Math.abs(toCol - this.col);
        
        // Movimento em L: 2 casas em uma direção e 1 casa na perpendicular
        return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2);
    }

    getSymbol() {
        return this.color === 'branco' ? '♘' : '♞';
    }
}

class Pawn extends Piece {
    constructor(color, row, col) {
        super(color, row, col);
        this.value = 1;
        this.direction = color === 'branco' ? -1 : 1; // Brancos sobem, pretos descem
        this.startRow = color === 'branco' ? 7 : 2;
    }

    canMove(toRow, toCol, game) {
        const rowDiff = toRow - this.row;
        const colDiff = Math.abs(toCol - this.col);
        
        // Movimento para frente
        if (colDiff === 0) {
            // Movimento normal de uma casa
            if (rowDiff === this.direction && game.isSquareEmpty(toRow, toCol)) {
                return true;
            }
            // Movimento inicial de duas casas
            if (rowDiff === 2 * this.direction && this.row === this.startRow && 
                game.isSquareEmpty(toRow, toCol) && game.isSquareEmpty(this.row + this.direction, toCol)) {
                return true;
            }
        }
        // Captura diagonal
        else if (colDiff === 1 && rowDiff === this.direction) {
            // captura normal
            if (game.isSquareOccupiedByEnemy(toRow, toCol, this.color)) {
                return true;
            }
            // en passant: casa de destino é o alvo de en passant atual
            if (game.enPassantTarget &&
                game.enPassantTarget.row === toRow &&
                game.enPassantTarget.col === toCol) {
                return true;
            }
        }
        
        return false;
    }

    getSymbol() {
        return this.color === 'branco' ? '♙' : '♟';
    }
}

window.ChessGame = ChessGame;
window.Piece = Piece;
window.King = King;
window.Queen = Queen;
window.Rook = Rook;
window.Bishop = Bishop;
window.Knight = Knight;
window.Pawn = Pawn;
