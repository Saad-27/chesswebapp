import React, { useState, useEffect, useCallback } from 'react';
import Chessboard from 'chessboardjsx';
import { Chess } from 'chess.js';
import { io } from 'socket.io-client';
import { doc, updateDoc, increment, getDoc, setDoc } from 'firebase/firestore';
import Cookies from 'js-cookie';
import { auth, db } from './config.js';
import { useNavigate } from 'react-router-dom';
import './css/ChessGame.css';
import {
  
  Trophy,Users, RotateCcw,
  
} from 'lucide-react';
export default function GameScreen() {
  const POINTS_CONFIG = {
    WIN: 10,
    DRAW: 5,
    RESIGN: -2,
  };
  const [socket, setSocket] = useState(null);
  const [game, setGame] = useState(new Chess());
  const [fen, setFen] = useState('start');
  const [isWhiteTurn, setIsWhiteTurn] = useState(true);
  const [gameOver, setGameOver] = useState(false);
  const [gameOverMessage, setGameOverMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [moveHistory, setMoveHistory] = useState([]);
  const [gameState, setGameState] = useState('idle'); // idle, searching, playing
  const [playerColor, setPlayerColor] = useState(() => {
    // Initialize playerColor from cookie if it exists
    return Cookies.get('playerColor') || null;
  });
  const [roomId, setRoomId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null); // Initialize as null
  const [showGameOverModal, setShowGameOverModal] = useState(false);

  // Function to set player color and save to cookie
  const setAndSavePlayerColor = (color) => {
    setPlayerColor(color);
    Cookies.set('playerColor', color, { expires: 1 }); // Cookie expires in 1 day
    console.log('Set player color to:', color);
  };

  const clearPlayerColorCookie = () => {
    Cookies.remove('playerColor');
    setPlayerColor(null);
  };

  useEffect(() => {
    console.log('Player Color changed:', playerColor);
  }, [playerColor]);

  const navigate = useNavigate();

  const updatePlayerPoints = async (userEmail, pointsToAdd) => {
    try {
      console.log('Attempting to update points for:', userEmail);
      console.log('Points to add:', pointsToAdd);

      const userRef = doc(db, 'users', userEmail);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        console.log('Creating new user document');
        await setDoc(userRef, {
          email: userEmail,
          points: pointsToAdd,
          createdAt: new Date(),
        });
      } else {
        console.log('Updating existing user document');
        console.log('Current points:', userDoc.data().points);
        await updateDoc(userRef, {
          points: increment(pointsToAdd),
        });
      }

      // Verify the update
      const updatedDoc = await getDoc(userRef);
      console.log('Updated points:', updatedDoc.data()?.points);
    } catch (error) {
      console.error('Error in updatePlayerPoints:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
    }
  };

  // Combined useEffect for authentication check and loading state
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        navigate('/login');
      } else {
        setCurrentUser(user); // Store the entire user object
        console.log('Auth state changed - current user:', user);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io('http://localhost:3001');
    setSocket(newSocket);

    return () => {
      if (newSocket) newSocket.disconnect();
    };
  }, []);

  // Socket event handlers
  useEffect(() => {
    if (!socket) return;

    socket.on('matchFound', ({ color, room }) => {
      console.log('Match found, playing as:', color);
      // Immediately set the player color
      setPlayerColor(color);
      setRoomId(room);
      setGameState('playing');
      setAndSavePlayerColor(color); // Save color to cookie
      setGame(new Chess());
      setFen('start');
      setIsWhiteTurn(true);
      setGameOver(false);
      setGameOverMessage('');
      setMoveHistory([]);
      setMessages([]);
      addMessage(
        'system',
        `Match found! You are playing as ${color}. ${
          color === 'white' ? "It's your turn!" : "Waiting for white's move..."
        }`
      );
    });

    socket.on(
      'opponentMove',
      ({
        from,
        to,
        promotion,
        isWhiteTurn: newTurn,
        fen: newFen,
        gameOver: gameOverData,
      }) => {
        console.log('Opponent moved:', from, 'to', to);

        setGame((prevGame) => {
          const gameCopy = new Chess(prevGame.fen());
          const moveResult = gameCopy.move({
            from,
            to,
            promotion: promotion || 'q',
          });

          if (moveResult) {
            setFen(gameCopy.fen());
            setIsWhiteTurn(newTurn);
            setMoveHistory((prev) => [...prev, moveResult.san]);
            addMessage('system', `Opponent moved ${moveResult.san}`);

            if (gameOverData) {
              console.log(gameOverData);
              console.log('another: ', playerColor);
              handleGameOver(gameOverData);
            }
          }

          return gameCopy;
        });
      }
    );

    socket.on(
      'moveSuccess',
      ({
        from,
        to,
        promotion,
        isWhiteTurn: newTurn,
        fen: newFen,
        gameOver: gameOverData,
      }) => {
        setGame((prevGame) => {
          const gameCopy = new Chess(prevGame.fen());
          const moveResult = gameCopy.move({
            from,
            to,
            promotion: promotion || 'q',
          });

          if (moveResult) {
            setFen(gameCopy.fen());
            setIsWhiteTurn(newTurn);
            setMoveHistory((prev) => [...prev, moveResult.san]);
            addMessage('system', `You moved ${moveResult.san}`);

            if (gameOverData) {
              handleGameOver(gameOverData);
            }
          }

          return gameCopy;
        });
      }
    );

    socket.on('gameOver', ({ winner, reason }) => {
      handleGameOver({ winner, reason });
    });

    socket.on('error', (message) => {
      addMessage('system', `Error: ${message}`);
    });

    socket.on('chat', ({ sender, message }) => {
      addMessage(sender, message);
    });

    socket.on('disconnect', () => {
      addMessage(
        'system',
        'Disconnected from server. Please refresh the page.'
      );
      setGameState('idle');
      setGameOver(true);
    });

    return () => {
      socket.off('matchFound');
      socket.off('opponentMove');
      socket.off('moveSuccess');
      socket.off('gameOver');
      socket.off('error');
      socket.off('chat');
      socket.off('disconnect');
    };
  }, [socket]);

  const handleGameOver = async (gameOverData) => {
    try {
      console.log('Game Over Data:', gameOverData);
      console.log('Current User:', currentUser?.email);

      // Get player color from cookie as backup
      const storedPlayerColor = Cookies.get('playerColor');
      const finalPlayerColor = playerColor || storedPlayerColor;

      console.log('Player Color (from state):', playerColor);
      console.log('Player Color (from cookie):', storedPlayerColor);
      console.log('Final Player Color used:', finalPlayerColor);
      console.log('Winner Color from Server:', gameOverData.winnerColor);

      setGameOver(true);
      setGameState('idle');
      setShowGameOverModal(true);

      if (!finalPlayerColor) {
        console.error('Could not determine player color');
        return;
      }

      let points = 0;
      let gameOverMessage = '';

      if (gameOverData.reason === 'checkmate') {
        if (gameOverData.winnerColor === finalPlayerColor) {
          points = POINTS_CONFIG.WIN;
          gameOverMessage = '🏆 Congratulations! You win by checkmate!';
        } else {
          points = -POINTS_CONFIG.WIN;
          gameOverMessage = '❌ Checkmate! Your opponent wins.';
        }
      } else if (
        gameOverData.reason === 'draw' ||
        gameOverData.reason === 'stalemate'
      ) {
        points = POINTS_CONFIG.DRAW;
        gameOverMessage = '🤝 Game ended in a draw.';
      } else if (gameOverData.reason === 'resign') {
        if (gameOverData.winnerColor === finalPlayerColor) {
          points = POINTS_CONFIG.WIN;
          gameOverMessage = '🏆 Your opponent resigned. You win!';
        } else {
          points = POINTS_CONFIG.RESIGN;
          gameOverMessage = '❌ You resigned. Game over.';
        }
      }

      console.log('Points calculation:', {
        finalPlayerColor,
        winnerColor: gameOverData.winnerColor,
        points,
        reason: gameOverData.reason,
      });

      setGameOverMessage(gameOverMessage);
      addMessage('system', gameOverMessage);

      if (currentUser?.email) {
        console.log(
          'Updating points for user:',
          currentUser.email,
          'Points:',
          points
        );
        await updatePlayerPoints(currentUser.email, points);
      }

      // Clear the player color cookie after game ends
      clearPlayerColorCookie();
    } catch (error) {
      console.error('Error in handleGameOver:', error);
    }
  };

  const addMessage = useCallback((sender, text) => {
    setMessages((prev) => [
      ...prev,
      {
        sender,
        text,
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);
  }, []);

  const handleMove = useCallback(
    (sourceSquare, targetSquare) => {
      // Check if game is active
      if (gameOver || gameState !== 'playing') {
        console.log('Game is not in playing state');
        return false;
      }

      // Verify it's the player's turn
      const isPlayersTurn =
        (isWhiteTurn && playerColor === 'white') ||
        (!isWhiteTurn && playerColor === 'black');

      if (!isPlayersTurn) {
        addMessage('system', "It's not your turn!");
        return false;
      }

      try {
        const move = {
          from: sourceSquare,
          to: targetSquare,
          promotion: 'q',
        };

        // Validate move locally
        const testGame = new Chess(game.fen());
        const isValidMove = testGame.move(move);

        if (!isValidMove) {
          console.log('Invalid move attempted');
          addMessage('system', 'Invalid move attempted.');
          return false;
        }

        // Check game ending conditions
        const gameEndInfo = {
          isCheckmate: testGame.isCheckmate(),
          isStalemate: testGame.isStalemate(),
          isDraw: testGame.isDraw(),
          isInsufficientMaterial: testGame.isInsufficientMaterial(),
          isThreefoldRepetition: testGame.isThreefoldRepetition(),
          isInCheck: testGame.isCheck(),
          turn: testGame.turn(), // 'w' for white, 'b' for black
          winnerColor: testGame.isCheckmate()
            ? testGame.turn() === 'w'
              ? 'black'
              : 'white' // If it's white's turn and checkmate, black won
            : null,
        };

        // Create move info for server
        const moveInfo = {
          room: roomId,
          ...move,
          gameEndInfo,
          fen: testGame.fen(),
          pgn: testGame.pgn(),
          moveNumber: Math.floor((testGame.moveNumber() + 1) / 2),
          lastMove: {
            from: sourceSquare,
            to: targetSquare,
            piece: game.get(sourceSquare).type,
            color: game.get(sourceSquare).color,
            isCapture: testGame.history({ verbose: true }).slice(-1)[0].captured
              ? true
              : false,
          },
        };

        // Send move to server
        socket.emit('move', moveInfo);

        return true;
      } catch (error) {
        console.error('Error in handleMove:', error);
        addMessage('system', 'An error occurred while making the move.');
        return false;
      }
    },
    [
      game,
      gameOver,
      gameState,
      isWhiteTurn,
      playerColor,
      roomId,
      socket,
      addMessage,
    ]
  );

  const startMatchmaking = useCallback(() => {
    if (socket && gameState === 'idle') {
      socket.emit('findMatch');
      setGameState('searching');
      addMessage('system', 'Searching for opponent...');
      setMessages([]);
      setGame(new Chess());
      setFen('start');
      setMoveHistory([]);
      setPlayerColor(null);
      setRoomId(null);
      setGameOver(false);
      clearPlayerColorCookie(); // Clear any existing player color

      setGameOverMessage('');
    }
  }, [socket, gameState, addMessage]);

  const handleResign = useCallback(() => {
    if (gameState === 'playing' && socket && roomId) {
      socket.emit('resign', { room: roomId });
      addMessage('system', 'You resigned. Game over.');
      setGameOver(true);
      setGameState('idle');
      setGameOverMessage('You resigned!');
    }
  }, [gameState, socket, roomId, addMessage]);

  const handleSendMessage = useCallback(
    (e) => {
      e.preventDefault();
      const input = e.target.elements.input;
      const message = input.value.trim();

      if (message && socket && roomId) {
        socket.emit('chat', { room: roomId, message });
        addMessage('you', message);
        input.value = '';
      }
    },
    [socket, roomId, addMessage]
  );
  useEffect(() => {
    return () => {
      clearPlayerColorCookie();
    };
  }, []);
  if (loading)
    return <p>Loading...</p>; // Display loading message while checking auth
  else
  return (
    <div className="game-container">
      <div className="game-content">
        <div className="title-container">
          <Users className="title-icon" />
          <h1>Play Against Human</h1>
        </div>

        {/* Game Status */}
        {(gameState === 'searching' || gameOverMessage) && (
          <div className="game-status">
            <span>
              {gameState === 'searching' 
                ? 'Searching for opponent...' 
                : gameOverMessage}
            </span>
            {gameOver && (
              <button onClick={() => window.location.reload()} className="restart-button">
                <RotateCcw className="restart-icon" />
                Play Again
              </button>
            )}
          </div>
        )}

        {/* Player One Info */}
        {gameState === 'playing' && (
          <div className="player-info opponent">
            <span>Opponent</span>
            <div className="timer"></div>
          </div>
        )}

        {/* Chess Board */}
        <div className="board-wrapper">
          <div className="board-container">
            <Chessboard
              position={fen}
              onDrop={({ sourceSquare, targetSquare }) => 
                handleMove(sourceSquare, targetSquare)}
              orientation={playerColor || 'white'}
              draggable={!gameOver && gameState === 'playing' && 
                ((isWhiteTurn && playerColor === 'white') || 
                (!isWhiteTurn && playerColor === 'black'))}
              width={560}
              darkSquareStyle={{ backgroundColor: '#b7c0d8' }}
              lightSquareStyle={{ backgroundColor: '#f8fafc' }}
              boardStyle={{
                borderRadius: '12px',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
              }}
              dropSquareStyle={{
                boxShadow: 'inset 0 0 1px 4px #8b5cf6',
              }}
            />
          </div>
        </div>

        {/* Player Two Info */}
        {gameState === 'playing' && (
          <div className="player-info you">
            <span>You</span>
            <div className="timer"></div>
          </div>
        )}

        {/* Instructions or Game Controls */}
        {gameState === 'idle' ? (
          <div className="controls-container">
            <button onClick={startMatchmaking} className="find-match-btn">
              <Users className="match-icon" />
              Find Match
            </button>
          </div>
        ) : gameState === 'playing' && (
          <div className="instructions">
            <p>You play as <span className="highlight">{playerColor}</span> pieces</p>
            <p>Make your move by dragging and dropping pieces</p>
          </div>
        )}

        {/* Chat Section */}
        {(gameState === 'playing' || messages.length > 0) && (
          <div className="chat-section">
            <div className="chat-messages">
              {messages.map((msg, index) => (
                <div key={index} className={`chat-message ${msg.sender}-message`}>
                  <span className="message-content">{msg.text}</span>
                  <span className="message-time">{msg.timestamp}</span>
                </div>
              ))}
            </div>
            <form onSubmit={handleSendMessage} className="chat-input-container">
              <input
                type="text"
                id="input"
                placeholder={gameState === 'playing' ? 'Type a message...' : 'Join a game to chat...'}
                disabled={gameState !== 'playing'}
              />
              <button type="submit" disabled={gameState !== 'playing'}>
                Send
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}