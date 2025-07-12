class TicTacToe {
    constructor() {
        this.board = ['', '', '', '', '', '', '', '', ''];
        this.currentPlayer = 'X';
        this.gameActive = true;
        this.cells = document.querySelectorAll('.cell');
        this.currentPlayerElement = document.getElementById('current-player');
        this.gameStatusElement = document.getElementById('game-status');
        this.resetButton = document.getElementById('reset-btn');
        this.gameBoard = document.getElementById('game-board');
        
        this.winningConditions = [
            { pattern: [0, 1, 2], type: 'row', position: 0 },
            { pattern: [3, 4, 5], type: 'row', position: 1 },
            { pattern: [6, 7, 8], type: 'row', position: 2 },
            { pattern: [0, 3, 6], type: 'col', position: 0 },
            { pattern: [1, 4, 7], type: 'col', position: 1 },
            { pattern: [2, 5, 8], type: 'col', position: 2 },
            { pattern: [0, 4, 8], type: 'diagonal-1', position: 0 },
            { pattern: [2, 4, 6], type: 'diagonal-2', position: 0 }
        ];
        
        this.initializeGame();
    }
    
    initializeGame() {
        this.cells.forEach((cell, index) => {
            cell.addEventListener('click', () => this.handleCellClick(index));
        });
        
        this.resetButton.addEventListener('click', () => this.resetGame());
        this.updateDisplay();
    }
    
    handleCellClick(index) {
        if (this.board[index] !== '' || !this.gameActive) {
            return;
        }
        
        this.board[index] = this.currentPlayer;
        this.updateCell(index);
        
        const winningCondition = this.checkWinner();
        if (winningCondition) {
            this.gameActive = false;
            this.gameStatusElement.textContent = `Player ${this.currentPlayer} wins!`;
            this.gameStatusElement.classList.add('winner');
            this.drawWinningLine(winningCondition);
            this.shakeBoard();
            this.disableBoard();
        } else if (this.checkDraw()) {
            this.gameActive = false;
            this.gameStatusElement.textContent = "It's a draw!";
            this.gameStatusElement.classList.add('draw');
            this.disableBoard();
        } else {
            this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
            this.updateDisplay();
        }
    }
    
    updateCell(index) {
        const cell = this.cells[index];
        cell.textContent = this.currentPlayer;
        cell.classList.add(this.currentPlayer.toLowerCase());
        cell.classList.add('disabled');
    }
    
    checkWinner() {
        return this.winningConditions.find(condition => {
            const [a, b, c] = condition.pattern;
            return this.board[a] && 
                   this.board[a] === this.board[b] && 
                   this.board[a] === this.board[c];
        });
    }
    
    checkDraw() {
        return this.board.every(cell => cell !== '');
    }
    
    disableBoard() {
        this.cells.forEach(cell => {
            cell.classList.add('disabled');
        });
    }
    
    updateDisplay() {
        this.currentPlayerElement.textContent = this.currentPlayer;
        if (this.gameActive) {
            this.gameStatusElement.textContent = 'Game in progress';
            this.gameStatusElement.classList.remove('winner', 'draw');
        }
    }
    
    drawWinningLine(winningCondition) {
        const line = document.createElement('div');
        line.className = `winning-line ${winningCondition.type} ${this.currentPlayer.toLowerCase()}`;
        
        // Set position based on winning condition
        if (winningCondition.type === 'row') {
            // For rows: top position should be at center of the row
            line.style.top = `${16.67 + (winningCondition.position * 33.33)}%`;
        } else if (winningCondition.type === 'col') {
            // For columns: left position should be at center of the column  
            line.style.left = `${16.67 + (winningCondition.position * 33.33)}%`;
        }
        // Diagonals don't need positioning - CSS handles it
        
        this.gameBoard.appendChild(line);
    }
    
    shakeBoard() {
        this.gameBoard.classList.add('shake');
        setTimeout(() => {
            this.gameBoard.classList.remove('shake');
        }, 600);
    }
    
    resetGame() {
        this.board = ['', '', '', '', '', '', '', '', ''];
        this.currentPlayer = 'X';
        this.gameActive = true;
        
        this.cells.forEach(cell => {
            cell.textContent = '';
            cell.classList.remove('x', 'o', 'disabled');
        });
        
        const existingLine = this.gameBoard.querySelector('.winning-line');
        if (existingLine) {
            existingLine.remove();
        }
        
        this.gameBoard.classList.remove('shake');
        this.gameStatusElement.classList.remove('winner', 'draw');
        this.updateDisplay();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new TicTacToe();
});