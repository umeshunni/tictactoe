class TicTacToe {
    constructor() {
        this.board = ['', '', '', '', '', '', '', '', ''];
        this.currentPlayer = 'X';
        this.gameActive = true;
        this.isOnlineMode = false;
        this.isConnected = false;
        this.playerRole = null; // 'X' or 'O' for online games
        this.roomCode = null;
        this.websocket = null;
        
        // DOM elements
        this.cells = document.querySelectorAll('.cell');
        this.currentPlayerElement = document.getElementById('current-player');
        this.gameStatusElement = document.getElementById('game-status');
        this.resetButton = document.getElementById('reset-btn');
        this.gameBoard = document.getElementById('game-board');
        
        // Mode selector elements
        this.localModeBtn = document.getElementById('local-mode-btn');
        this.onlineModeBtn = document.getElementById('online-mode-btn');
        this.onlineControls = document.getElementById('online-controls');
        this.connectionStatus = document.getElementById('connection-status');
        
        // Online game elements
        this.gameCodeInput = document.getElementById('game-code-input');
        this.joinGameBtn = document.getElementById('join-game-btn');
        this.createGameBtn = document.getElementById('create-game-btn');
        this.roomCodeDisplay = document.getElementById('room-code');
        this.codeDisplay = document.getElementById('code-display');
        
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
        
        // Mode selector event listeners
        this.localModeBtn.addEventListener('click', () => this.setGameMode('local'));
        this.onlineModeBtn.addEventListener('click', () => this.setGameMode('online'));
        
        // Online game event listeners
        this.createGameBtn.addEventListener('click', () => this.createGame());
        this.joinGameBtn.addEventListener('click', () => this.joinGame());
        this.gameCodeInput.addEventListener('input', (e) => this.handleCodeInput(e));
        this.gameCodeInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.joinGame();
        });
        
        this.updateDisplay();
    }
    
    setGameMode(mode) {
        this.isOnlineMode = (mode === 'online');
        
        // Update UI
        this.localModeBtn.classList.toggle('active', mode === 'local');
        this.onlineModeBtn.classList.toggle('active', mode === 'online');
        this.onlineControls.style.display = mode === 'online' ? 'block' : 'none';
        this.connectionStatus.style.display = mode === 'online' ? 'flex' : 'none';
        
        if (mode === 'local') {
            this.disconnectWebSocket();
            this.resetGame();
        } else {
            this.updateConnectionStatus('disconnected');
        }
    }
    
    handleCodeInput(e) {
        // Only allow alphanumeric characters and convert to uppercase
        e.target.value = e.target.value.replace(/[^A-Z0-9]/gi, '').toUpperCase();
    }
    
    createGame() {
        if (this.isConnected) return;
        
        // For now, generate a random 4-digit code (will be replaced by server)
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 4; i++) {
            code += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        
        this.roomCode = code;
        this.playerRole = 'X';
        this.codeDisplay.textContent = code;
        this.roomCodeDisplay.style.display = 'block';
        this.updateConnectionStatus('connecting');
        this.gameStatusElement.textContent = 'Waiting for opponent...';
        
        // TODO: Connect to WebSocket server
        this.connectWebSocket();
    }
    
    joinGame() {
        const code = this.gameCodeInput.value.trim();
        if (code.length !== 4) {
            alert('Please enter a 4-digit room code');
            return;
        }
        
        this.roomCode = code;
        this.playerRole = 'O';
        this.updateConnectionStatus('connecting');
        this.gameStatusElement.textContent = 'Joining game...';
        
        // TODO: Connect to WebSocket server and join room
        this.connectWebSocket();
    }
    
    connectWebSocket() {
        try {
            // Auto-detect WebSocket URL based on current page
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const host = window.location.host;
            const wsUrl = `${protocol}//${host}`;
            
            console.log(`Connecting to: ${wsUrl}`);
            this.websocket = new WebSocket(wsUrl);
            
            this.websocket.onopen = () => {
                console.log('Connected to game server');
                this.isConnected = true;
                this.updateConnectionStatus('connected');
                
                // Send appropriate message based on action
                if (this.playerRole === 'X') {
                    this.websocket.send(JSON.stringify({ type: 'CREATE_GAME' }));
                } else {
                    this.websocket.send(JSON.stringify({ 
                        type: 'JOIN_GAME', 
                        code: this.roomCode 
                    }));
                }
            };
            
            this.websocket.onmessage = (event) => {
                this.handleWebSocketMessage(JSON.parse(event.data));
            };
            
            this.websocket.onclose = () => {
                console.log('Disconnected from game server');
                this.isConnected = false;
                this.updateConnectionStatus('disconnected');
                this.gameStatusElement.textContent = 'Connection lost';
            };
            
            this.websocket.onerror = (error) => {
                console.error('WebSocket error:', error);
                this.updateConnectionStatus('disconnected');
                this.gameStatusElement.textContent = 'Connection failed';
            };
            
        } catch (error) {
            console.error('Failed to connect:', error);
            this.updateConnectionStatus('disconnected');
            this.gameStatusElement.textContent = 'Connection failed';
        }
    }
    
    handleWebSocketMessage(message) {
        switch (message.type) {
            case 'CONNECTED':
                console.log('Server confirmed connection');
                break;
                
            case 'GAME_CREATED':
                this.roomCode = message.code;
                this.playerRole = message.playerRole;
                this.codeDisplay.textContent = message.code;
                this.roomCodeDisplay.style.display = 'block';
                this.gameStatusElement.textContent = 'Waiting for opponent...';
                break;
                
            case 'GAME_JOINED':
                this.roomCode = message.code;
                this.playerRole = message.playerRole;
                this.board = message.board;
                this.currentPlayer = message.currentPlayer;
                this.gameStatusElement.textContent = this.playerRole === this.currentPlayer ? 
                    'Your turn' : 'Opponent\'s turn';
                this.updateBoardDisplay();
                break;
                
            case 'PLAYER_JOINED':
                this.gameStatusElement.textContent = this.playerRole === this.currentPlayer ? 
                    'Opponent joined! Your turn.' : 'Opponent joined! Their turn.';
                break;
                
            case 'MOVE_MADE':
                this.board = message.board;
                this.currentPlayer = message.currentPlayer;
                this.updateBoardDisplay();
                this.gameStatusElement.textContent = this.playerRole === this.currentPlayer ? 
                    'Your turn' : 'Opponent\'s turn';
                break;
                
            case 'GAME_WON':
                this.board = message.board;
                this.gameActive = false;
                this.updateBoardDisplay();
                this.gameStatusElement.textContent = this.playerRole === message.winner ? 
                    'You win!' : 'Opponent wins!';
                this.gameStatusElement.classList.add('winner');
                this.drawWinningLine(message.winningCondition);
                this.shakeBoard();
                this.disableBoard();
                break;
                
            case 'GAME_DRAW':
                this.board = message.board;
                this.gameActive = false;
                this.updateBoardDisplay();
                this.gameStatusElement.textContent = "It's a draw!";
                this.gameStatusElement.classList.add('draw');
                this.disableBoard();
                break;
                
            case 'GAME_RESET':
                this.board = message.board;
                this.currentPlayer = message.currentPlayer;
                this.gameActive = true;
                this.updateBoardDisplay();
                this.clearBoard();
                this.gameStatusElement.classList.remove('winner', 'draw');
                this.gameStatusElement.textContent = this.playerRole === this.currentPlayer ? 
                    'Your turn' : 'Opponent\'s turn';
                break;
                
            case 'PLAYER_DISCONNECTED':
                this.gameStatusElement.textContent = 'Opponent disconnected';
                this.gameActive = false;
                break;
                
            case 'ERROR':
                alert(message.message);
                this.updateConnectionStatus('disconnected');
                break;
        }
    }
    
    updateBoardDisplay() {
        this.cells.forEach((cell, index) => {
            const player = this.board[index];
            if (player && !cell.textContent) {
                this.updateCell(index, player);
            }
        });
    }
    
    clearBoard() {
        this.cells.forEach(cell => {
            cell.textContent = '';
            cell.classList.remove('x', 'o', 'disabled');
        });
        
        const existingLine = this.gameBoard.querySelector('.winning-line');
        if (existingLine) {
            existingLine.remove();
        }
        
        this.gameBoard.classList.remove('shake');
    }
    
    disconnectWebSocket() {
        if (this.websocket) {
            this.websocket.close();
            this.websocket = null;
        }
        this.isConnected = false;
        this.playerRole = null;
        this.roomCode = null;
        this.roomCodeDisplay.style.display = 'none';
        this.gameCodeInput.value = '';
    }
    
    updateConnectionStatus(status) {
        const indicator = this.connectionStatus.querySelector('.status-indicator');
        const text = this.connectionStatus.querySelector('.status-text');
        
        indicator.className = 'status-indicator';
        
        switch(status) {
            case 'connected':
                indicator.classList.add('connected');
                text.textContent = 'Connected';
                break;
            case 'connecting':
                indicator.classList.add('connecting');
                text.textContent = 'Connecting...';
                break;
            default:
                text.textContent = 'Disconnected';
        }
    }
    
    handleCellClick(index) {
        if (this.board[index] !== '' || !this.gameActive) {
            return;
        }
        
        // In online mode, check if it's the player's turn
        if (this.isOnlineMode && this.isConnected) {
            if (this.playerRole !== this.currentPlayer) {
                return; // Not this player's turn
            }
            // TODO: Send move to server instead of processing locally
            this.sendMove(index);
            return;
        }
        
        // Local game logic
        this.makeMove(index, this.currentPlayer);
    }
    
    makeMove(index, player) {
        this.board[index] = player;
        this.updateCell(index, player);
        
        const winningCondition = this.checkWinner();
        if (winningCondition) {
            this.gameActive = false;
            this.gameStatusElement.textContent = this.isOnlineMode ? 
                (this.playerRole === player ? 'You win!' : 'Opponent wins!') :
                `Player ${player} wins!`;
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
            
            if (this.isOnlineMode && this.isConnected) {
                this.gameStatusElement.textContent = this.playerRole === this.currentPlayer ? 
                    'Your turn' : 'Opponent\'s turn';
            }
        }
    }
    
    sendMove(index) {
        if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
            this.gameStatusElement.textContent = 'Connection lost';
            return;
        }
        
        this.gameStatusElement.textContent = 'Sending move...';
        this.websocket.send(JSON.stringify({
            type: 'MAKE_MOVE',
            index: index
        }));
    }
    
    updateCell(index, player = this.currentPlayer) {
        const cell = this.cells[index];
        cell.textContent = player;
        cell.classList.add(player.toLowerCase());
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
        if (this.isOnlineMode && this.isConnected && this.websocket) {
            // Send reset request to server
            this.websocket.send(JSON.stringify({ type: 'RESET_GAME' }));
            return;
        }
        
        // Local game reset
        this.board = ['', '', '', '', '', '', '', '', ''];
        this.currentPlayer = 'X';
        this.gameActive = true;
        
        this.clearBoard();
        this.gameStatusElement.classList.remove('winner', 'draw');
        this.updateDisplay();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new TicTacToe();
});