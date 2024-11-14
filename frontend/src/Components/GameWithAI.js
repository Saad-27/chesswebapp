import React, { useState } from 'react';
import Stockfish from './Stockfish';
import Chessboard from 'chessboardjsx';
import { Trophy, RotateCcw } from 'lucide-react';
import './css/GameWithAI.css';

export default function GameWithAI() {
  const [gameStatus, setGameStatus] = useState('');
  const [hasGameStarted, setHasGameStarted] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);

  const handleGameUpdate = (status) => {
    if (status) {
      setGameStatus(status);
      setIsGameOver(true);
    }
  };

  const handleMove = () => {
    if (!hasGameStarted) {
      setHasGameStarted(true);
    }
  };

  const handleRestart = () => {
    setGameStatus('');
    setIsGameOver(false);
    setHasGameStarted(true);
    window.location.reload();
  };

  return (
    <div className="game-container">
      <div className="game-content">
        <div className="title-container">
          <Trophy className="title-icon" />
          <h1>Play Against AI</h1>
        </div>
        
        {gameStatus && (
          <div className="game-status">
            <span>{gameStatus}</span>
            {isGameOver && (
              <button onClick={handleRestart} className="restart-button">
                <RotateCcw className="restart-icon" />
                Play Again
              </button>
            )}
          </div>
        )}
        
        <div className="board-wrapper">
          <div className="board-container">
            <Stockfish onGameUpdate={handleGameUpdate}>
              {({ position, onDrop }) => (
                <Chessboard
                  id="stockfish"
                  position={position}
                  onDrop={(move) => {
                    handleMove();
                    return onDrop(move);
                  }}
                  width={560}
                  darkSquareStyle={{ backgroundColor: '#b7c0d8' }}
                  lightSquareStyle={{ backgroundColor: '#f8fafc' }}
                  boardStyle={{
                    borderRadius: '12px',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
                    backgroundColor: '#fff',
                  }}
                  dropSquareStyle={{
                    boxShadow: 'inset 0 0 1px 4px #8b5cf6',
                  }}
                  orientation="white"
                />
              )}
            </Stockfish>
          </div>
        </div>

        {!hasGameStarted && (
          <div className="instructions">
            <p>You play as <span className="highlight">white</span> pieces</p>
            <p>Make your move by dragging and dropping pieces</p>
          </div>
        )}
      </div>
    </div>
  );
}