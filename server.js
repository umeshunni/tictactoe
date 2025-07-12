const WebSocket = require('ws');
const http = require('http');
const path = require('path');
const fs = require('fs');

class GameRoom {
    constructor(code) {
        this.code = code;
        this.players = [];
        this.board = ['', '', '', '', '', '', '', '', ''];
        this.currentPlayer = 'X';
        this.gameActive = true;
        this.createdAt = Date.now();
    }
    
    addPlayer(ws, playerId) {
        if (this.players.length >= 2) {
            return false;
        }
        
        const playerRole = this.players.length === 0 ? 'X' : 'O';
        const player = {
            ws,
            id: playerId,
            role: playerRole
        };
        
        this.players.push(player);
        return player;
    }
    
    removePlayer(playerId) {
        this.players = this.players.filter(p => p.id !== playerId);
    }
    
    getPlayer(playerId) {
        return this.players.find(p => p.id === playerId);
    }
    
    isFull() {
        return this.players.length === 2;
    }
    
    isEmpty() {
        return this.players.length === 0;
    }
    
    broadcast(message, excludePlayerId = null) {
        this.players.forEach(player => {
            if (player.id !== excludePlayerId && player.ws.readyState === WebSocket.OPEN) {
                player.ws.send(JSON.stringify(message));
            }
        });
    }
    
    makeMove(index, playerId) {
        const player = this.getPlayer(playerId);
        if (!player || player.role !== this.currentPlayer || this.board[index] !== '' || !this.gameActive) {
            return false;
        }
        
        this.board[index] = this.currentPlayer;
        
        const winningCondition = this.checkWinner();
        if (winningCondition) {
            this.gameActive = false;
            this.broadcast({
                type: 'GAME_WON',
                winner: this.currentPlayer,
                winningCondition,
                board: this.board
            });
        } else if (this.checkDraw()) {
            this.gameActive = false;
            this.broadcast({
                type: 'GAME_DRAW',
                board: this.board
            });
        } else {
            this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
            this.broadcast({
                type: 'MOVE_MADE',
                index,
                player: player.role,
                currentPlayer: this.currentPlayer,
                board: this.board
            });
        }
        
        return true;
    }
    
    checkWinner() {
        const winningConditions = [
            { pattern: [0, 1, 2], type: 'row', position: 0 },
            { pattern: [3, 4, 5], type: 'row', position: 1 },
            { pattern: [6, 7, 8], type: 'row', position: 2 },
            { pattern: [0, 3, 6], type: 'col', position: 0 },
            { pattern: [1, 4, 7], type: 'col', position: 1 },
            { pattern: [2, 5, 8], type: 'col', position: 2 },
            { pattern: [0, 4, 8], type: 'diagonal-1', position: 0 },
            { pattern: [2, 4, 6], type: 'diagonal-2', position: 0 }
        ];
        
        return winningConditions.find(condition => {
            const [a, b, c] = condition.pattern;
            return this.board[a] && 
                   this.board[a] === this.board[b] && 
                   this.board[a] === this.board[c];
        });
    }
    
    checkDraw() {
        return this.board.every(cell => cell !== '');
    }
    
    reset() {
        this.board = ['', '', '', '', '', '', '', '', ''];
        this.currentPlayer = 'X';
        this.gameActive = true;
        this.broadcast({
            type: 'GAME_RESET',
            board: this.board,
            currentPlayer: this.currentPlayer
        });
    }
}

class GameServer {
    constructor() {
        this.rooms = new Map();
        this.playerRooms = new Map(); // playerId -> roomCode
        this.cleanupInterval = setInterval(() => this.cleanupRooms(), 60000); // Cleanup every minute
    }
    
    generateRoomCode() {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code;
        do {
            code = '';
            for (let i = 0; i < 4; i++) {
                code += characters.charAt(Math.floor(Math.random() * characters.length));
            }
        } while (this.rooms.has(code));
        return code;
    }
    
    createRoom() {
        const code = this.generateRoomCode();
        const room = new GameRoom(code);
        this.rooms.set(code, room);
        return room;
    }
    
    getRoom(code) {
        return this.rooms.get(code);
    }
    
    joinRoom(code, ws, playerId) {
        const room = this.getRoom(code);
        if (!room) {
            return null;
        }
        
        const player = room.addPlayer(ws, playerId);
        if (player) {
            this.playerRooms.set(playerId, code);
        }
        return player;
    }
    
    leaveRoom(playerId) {
        const roomCode = this.playerRooms.get(playerId);
        if (roomCode) {
            const room = this.getRoom(roomCode);
            if (room) {
                room.removePlayer(playerId);
                room.broadcast({
                    type: 'PLAYER_DISCONNECTED',
                    playerId
                });
                
                if (room.isEmpty()) {
                    this.rooms.delete(roomCode);
                }
            }
            this.playerRooms.delete(playerId);
        }
    }
    
    cleanupRooms() {
        const now = Date.now();
        const ROOM_TIMEOUT = 30 * 60 * 1000; // 30 minutes
        
        for (const [code, room] of this.rooms.entries()) {
            if (now - room.createdAt > ROOM_TIMEOUT || room.isEmpty()) {
                this.rooms.delete(code);
            }
        }
    }
}

const server = http.createServer((req, res) => {
    // Serve static files
    const filePath = req.url === '/' ? '/index.html' : req.url;
    const fullPath = path.join(__dirname, filePath);
    
    // Security check - prevent directory traversal
    if (!fullPath.startsWith(__dirname)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }
    
    fs.readFile(fullPath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404);
                res.end('File not found');
            } else {
                res.writeHead(500);
                res.end('Server error');
            }
            return;
        }
        
        const ext = path.extname(fullPath).toLowerCase();
        const contentTypes = {
            '.html': 'text/html',
            '.js': 'text/javascript',
            '.css': 'text/css',
            '.json': 'application/json'
        };
        
        const contentType = contentTypes[ext] || 'text/plain';
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
    });
});

const wss = new WebSocket.Server({ server });
const gameServer = new GameServer();

wss.on('connection', (ws) => {
    const playerId = Math.random().toString(36).substr(2, 9);
    console.log(`Player ${playerId} connected`);
    
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            handleMessage(ws, playerId, data);
        } catch (error) {
            console.error('Invalid message:', error);
            ws.send(JSON.stringify({ type: 'ERROR', message: 'Invalid message format' }));
        }
    });
    
    ws.on('close', () => {
        console.log(`Player ${playerId} disconnected`);
        gameServer.leaveRoom(playerId);
    });
    
    // Send connection confirmation
    ws.send(JSON.stringify({ type: 'CONNECTED', playerId }));
});

function handleMessage(ws, playerId, data) {
    const roomCode = gameServer.playerRooms.get(playerId);
    const room = roomCode ? gameServer.getRoom(roomCode) : null;
    
    switch (data.type) {
        case 'CREATE_GAME':
            const newRoom = gameServer.createRoom();
            const creator = newRoom.addPlayer(ws, playerId);
            gameServer.playerRooms.set(playerId, newRoom.code);
            
            ws.send(JSON.stringify({
                type: 'GAME_CREATED',
                code: newRoom.code,
                playerRole: creator.role
            }));
            break;
            
        case 'JOIN_GAME':
            if (!data.code || data.code.length !== 4) {
                ws.send(JSON.stringify({ type: 'ERROR', message: 'Invalid room code' }));
                return;
            }
            
            const joiner = gameServer.joinRoom(data.code, ws, playerId);
            if (!joiner) {
                ws.send(JSON.stringify({ type: 'ERROR', message: 'Room not found or full' }));
                return;
            }
            
            const joinedRoom = gameServer.getRoom(data.code);
            ws.send(JSON.stringify({
                type: 'GAME_JOINED',
                code: data.code,
                playerRole: joiner.role,
                board: joinedRoom.board,
                currentPlayer: joinedRoom.currentPlayer
            }));
            
            // Notify other players
            joinedRoom.broadcast({
                type: 'PLAYER_JOINED',
                playerRole: joiner.role
            }, playerId);
            break;
            
        case 'MAKE_MOVE':
            if (!room) {
                ws.send(JSON.stringify({ type: 'ERROR', message: 'Not in a room' }));
                return;
            }
            
            const success = room.makeMove(data.index, playerId);
            if (!success) {
                ws.send(JSON.stringify({ type: 'ERROR', message: 'Invalid move' }));
            }
            break;
            
        case 'RESET_GAME':
            if (!room) {
                ws.send(JSON.stringify({ type: 'ERROR', message: 'Not in a room' }));
                return;
            }
            
            room.reset();
            break;
            
        default:
            ws.send(JSON.stringify({ type: 'ERROR', message: 'Unknown message type' }));
    }
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Game server running on port ${PORT}`);
    console.log(`Visit http://localhost:${PORT} to play`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    clearInterval(gameServer.cleanupInterval);
    wss.close();
    server.close();
});