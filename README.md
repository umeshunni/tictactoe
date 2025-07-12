# Multiplayer Tic-Tac-Toe

A real-time multiplayer tic-tac-toe game built with WebSockets, featuring both local and online gameplay modes.

## Features

- **Local Mode**: Play against someone on the same device
- **Online Mode**: Play against opponents over the internet using room codes
- **Real-time Synchronization**: Moves are instantly synchronized between players
- **4-Digit Room Codes**: Easy-to-share alphanumeric codes for joining games
- **Visual Effects**: Winning line animations and board shake effects
- **Responsive Design**: Works on desktop and mobile devices
- **Connection Status**: Visual indicators for connection state

## Setup Instructions

### Prerequisites
- Node.js (version 14 or higher)
- npm (comes with Node.js)

### Installation

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start the Server**
   ```bash
   npm start
   ```

3. **Open Your Browser**
   - Navigate to `http://localhost:3000`
   - The game will load automatically

## How to Play

### Local Mode (Default)
1. Click on the grid squares to place X's and O's
2. Players alternate turns automatically
3. First player to get three in a row wins
4. Use "Reset Game" to start over

### Online Mode
1. Click "Online Game" to switch modes
2. **To Create a Game:**
   - Click "Create Game"
   - Share the 4-digit room code with your opponent
   - Wait for them to join
3. **To Join a Game:**
   - Enter the 4-digit room code
   - Click "Join Game"
   - Start playing when connected

### Game Rules
- X always goes first
- Get three symbols in a row (horizontal, vertical, or diagonal) to win
- If all squares are filled without a winner, it's a draw
- In online mode, you can only play when it's your turn

## Technical Details

### Architecture
- **Frontend**: Vanilla HTML, CSS, and JavaScript
- **Backend**: Node.js with WebSocket server
- **Communication**: Real-time WebSocket messages
- **Game State**: Synchronized across all connected clients

### File Structure
```
tictactoe/
├── index.html          # Main game interface
├── style.css           # Game styling and animations
├── script.js          # Client-side game logic
├── server.js          # WebSocket server
├── package.json       # Dependencies and scripts
└── README.md          # This file
```

### WebSocket Messages
The game uses JSON messages for real-time communication:
- `CREATE_GAME` - Create a new game room
- `JOIN_GAME` - Join an existing room
- `MAKE_MOVE` - Send a move to the server
- `RESET_GAME` - Reset the current game
- `PLAYER_JOINED` - Notification when opponent joins
- `MOVE_MADE` - Broadcast moves to all players
- `GAME_WON` - Game over with winner
- `GAME_DRAW` - Game ended in a draw

## Development

### Running in Development Mode
```bash
npm run dev
```

### Customizing the Server Port
```bash
PORT=8080 npm start
```

### Browser Compatibility
- Modern browsers with WebSocket support
- Chrome 16+, Firefox 11+, Safari 7+, Edge 12+

## Troubleshooting

### Connection Issues
- Ensure the server is running on port 3000
- Check browser console for WebSocket errors
- Verify firewall settings allow WebSocket connections

### Game Not Loading
- Clear browser cache and reload
- Check that all files are in the same directory
- Ensure Node.js dependencies are installed

### Room Code Problems
- Room codes are case-sensitive
- Codes expire after 30 minutes of inactivity
- Maximum 2 players per room

## Contributing

Feel free to submit issues and enhancement requests!

## License

MIT License - feel free to use this code for your own projects.