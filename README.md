# Battleship Game

A single-player Battleship game built with React, TypeScript, and Tailwind CSS. Play against an AI opponent with hunt/target targeting modes.

## 🚀 Live Demo

**Play the game here:** [https://battleship-game.vercel.app](https://battleship-game.vercel.app)

## 📸 Screenshots

![Battleship Game](https://via.placeholder.com/800x400/1e40af/ffffff?text=Battleship+Game+Screenshot)

## 🛠️ Tech Stack

- **Frontend:** React 18 + TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **Deployment:** Vercel
- **State Management:** React useReducer

## 🎮 Game Features

- **Classic Battleship gameplay** on 10×10 grids
- **Smart AI opponent** with hunt and target modes
- **Visual feedback** for hits, misses, and sunk ships
- **Mobile-responsive** design
- **Random ship placement** with re-roll option
- **Turn-based gameplay** with automatic AI turns

### AI Difficulty

The AI uses a two-mode targeting system:
- **Hunt Mode:** Fires at random untried cells using a checkerboard pattern
- **Target Mode:** After a hit, systematically targets adjacent cells until the ship is sunk

## 🚀 Local Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/battleship-game.git
   cd battleship-game
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173`

## 🏗️ Architecture

### State Management
- **Game state** is managed with a single useReducer hook in `src/gameReducer.ts`
- **Actions** define all possible game state transitions (shots, ship placement, game start/reset)

### Key Modules
- **`src/gameReducer.ts`** - Core game logic and state management
- **`src/aiPlayer.ts`** - AI targeting logic with hunt/target modes
- **`src/shipPlacement.ts`** - Random ship placement algorithm
- **`src/types.ts`** - TypeScript type definitions
- **`src/components/`** - React components (Board, Cell)

### Game Flow
1. **Setup Phase:** Ships are randomly placed for both player and AI
2. **Playing Phase:** Players alternate turns firing at opponent grids
3. **End Phase:** Game ends when all ships of one side are sunk

## 🐛 Bug Tracking

During development, I conducted thorough QA testing and documented several bugs that were found and fixed. See [BUGS.md](./BUGS.md) for detailed information about:
- AI targeting edge cases
- Ship placement failures
- Win condition timing issues
- UI interaction bugs

## 🎯 Game Rules

1. **Fleet Composition:** Each player has 5 ships:
   - Carrier (5 cells)
   - Battleship (4 cells)
   - Cruiser (3 cells)
   - Submarine (3 cells)
   - Destroyer (2 cells)

2. **Setup:** Ships are placed randomly and cannot overlap or extend off the board

3. **Gameplay:** 
   - Players take turns firing at opponent grids
   - Click on AI's grid to fire during your turn
   - AI fires automatically after a short delay

4. **Winning:** Sink all opponent ships to win

## 🔧 Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

## 🚀 Deployment

The project is automatically deployed to Vercel via GitHub integration. Pushing to the `main` branch triggers a new deployment.

## 📱 Mobile Support

The game is fully responsive and works on mobile devices. The boards stack vertically on smaller screens for optimal gameplay.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🔍 Known Limitations

- No sound effects or complex animations
- No manual ship placement (random only)
- No multiplayer or persistence features
- AI difficulty is fixed (no adjustable levels)

---

Built with ❤️ using React, TypeScript, and Tailwind CSS
