
class SimpleAI {
    constructor(game, color, difficulty = 5) {
        this.game = game;
        this.color = color;
        this.difficulty = difficulty;
    }

    setDifficulty(level) {
        this.difficulty = level;
    }
    
    async makeMove() {

        if (this.game.currentPlayer !== this.color) {
            return false;
        }

        
        if (this.difficulty <= 2) {
            return this.makeLocalMove();
        } else {
            return this.makeEngineMove();
        }
    }

    
    async makeLocalMove() {
        const myPieces = [];
        for (let row = 1; row <= 8; row++) {
            for (let col = 1; col <= 8; col++) {
                const piece = this.game.getPiece(row, col);
                if (piece && piece.color === this.color) {
                    myPieces.push({ piece, row, col });
                }
            }
        }

        const validMoves = [];
        for (const { piece, row, col } of myPieces) {
            for (let toRow = 1; toRow <= 8; toRow++) {
                for (let toCol = 1; toCol <= 8; toCol++) {
                    if (this.game.isValidMove(row, col, toRow, toCol)) {
                        validMoves.push({
                            fromRow: row,
                            fromCol: col,
                            toRow: toRow,
                            toCol: toCol,
                            piece: piece
                        });
                    }
                }
            }
        }

        if (validMoves.length === 0) {
            return false;
        }

        
        let chosenMove;
        
        chosenMove = this.chooseBestMove(validMoves);

        
        const capturedPiece = this.game.getPiece(chosenMove.toRow, chosenMove.toCol);

        
        const success = this.game.movePiece(
            chosenMove.fromRow,
            chosenMove.fromCol,
            chosenMove.toRow,
            chosenMove.toCol
        );

        if (success) {
            return { success: true, captured: !!capturedPiece };
        }
        return { success: false, captured: false };
    }

    

    
    gameToFEN() {
        let fenRows = [];

        
        for (let fenRank = 8; fenRank >= 1; fenRank--) {
            const row = 9 - fenRank; 
            let emptyCount = 0;
            let fenRow = '';

            for (let col = 1; col <= 8; col++) {
                const piece = this.game.getPiece(row, col);
                if (!piece) {
                    emptyCount++;
                } else {
                    if (emptyCount > 0) {
                        fenRow += emptyCount;
                        emptyCount = 0;
                    }
                    const typeMap = {
                        'Pawn': 'p',
                        'Knight': 'n',
                        'Bishop': 'b',
                        'Rook': 'r',
                        'Queen': 'q',
                        'King': 'k'
                    };
                    const base = typeMap[piece.constructor.name] || 'p';
                    const isWhite = piece.color === 'branco';
                    fenRow += isWhite ? base.toUpperCase() : base;
                }
            }

            if (emptyCount > 0) {
                fenRow += emptyCount;
            }

            fenRows.push(fenRow);
        }

        const boardPart = fenRows.join('/');
        const turnPart = this.game.currentPlayer === 'branco' ? 'w' : 'b';

        
        const castlingPart = '-';
        const epPart = '-';
        const halfMove = '0';
        const moveNumber = '1';

        return `${boardPart} ${turnPart} ${castlingPart} ${epPart} ${halfMove} ${moveNumber}`;
    }

    
    async makeEngineMove() {
        const fen = this.gameToFEN();

        
        let depth;
        if (this.difficulty <= 4) {
            depth = 6;   
        } else if (this.difficulty <= 8) {
            depth = 10;  
        } else {
            depth = 14;  
        }

        let data;
        try {
            const response = await fetch("https:
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ fen, depth })
            });
            data = await response.json();
        } catch (e) {
            return { success: false, captured: false };
        }

        const messages = Array.isArray(data) ? data : [data];
        const moveMsg = messages.find(m => m.type === 'bestmove' || m.type === 'move') || messages[0];
        if (!moveMsg || !moveMsg.move) {
            return { success: false, captured: false };
        }

        const moveStr = moveMsg.move; 
        const fromFile = moveStr[0];
        const fromRank = parseInt(moveStr[1], 10);
        const toFile = moveStr[2];
        const toRank = parseInt(moveStr[3], 10);

        const fromCol = fromFile.charCodeAt(0) - 'a'.charCodeAt(0) + 1;
        const fromRow = 9 - fromRank; 
        const toCol = toFile.charCodeAt(0) - 'a'.charCodeAt(0) + 1;
        const toRow = 9 - toRank;

        if (!this.game.isValidMove(fromRow, fromCol, toRow, toCol)) {
            return { success: false, captured: false };
        }

        
        const capturedPiece = this.game.getPiece(toRow, toCol);

        const success = this.game.movePiece(fromRow, fromCol, toRow, toCol);
        if (success) {
            return { success: true, captured: !!capturedPiece };
        }
        return { success: false, captured: false };
    }

    chooseBestMove(moves) {
        
        const pieceValues = {
            'Pawn': 1,
            'Knight': 3,
            'Bishop': 3,
            'Rook': 5,
            'Queen': 9,
            'King': 1000
        };

        let bestMove = moves[0];
        let bestScore = -Infinity;

        for (const move of moves) {
            let score = 0;
            const capturedPiece = this.game.getPiece(move.toRow, move.toCol);
            
            if (capturedPiece) {
                score += pieceValues[capturedPiece.constructor.name] || 0;
            }

            
            const centerDistance = Math.abs(move.toRow - 4.5) + Math.abs(move.toCol - 4.5);
            score += (8 - centerDistance) * 0.1;

            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
        }

        return bestMove;
    }

    moveToString(move) {
        const fromCol = String.fromCharCode('a'.charCodeAt(0) + move.fromCol - 1);
        const fromRow = 9 - move.fromRow;
        const toCol = String.fromCharCode('a'.charCodeAt(0) + move.toCol - 1);
        const toRow = 9 - move.toRow;
        
        return `${fromCol}${fromRow}${toCol}${toRow}`;
    }

    destroy() {
    }
}

window.SimpleAI = SimpleAI;
