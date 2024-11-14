import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Chess } from 'chess.js';

class Stockfish extends Component {
  static propTypes = { 
    children: PropTypes.func,
    onGameUpdate: PropTypes.func 
  };

  constructor(props) {
    super(props);
    this.state = { fen: 'start' };
    this.game = new Chess();
  }

  componentDidMount() {
    // Load Stockfish
    this.initializeEngine();
  }

  componentWillUnmount() {
    if (this.engine) {
      this.engine.terminate();
    }
  }

  initializeEngine = async () => {
    try {
      // Load Stockfish from a CDN
      const stockfishUrl = 'https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.2/stockfish.js';
      const response = await fetch(stockfishUrl);
      const stockfishJs = await response.text();
      
      // Create a blob and worker from the stockfish code
      const blob = new Blob([stockfishJs], { type: 'text/javascript' });
      const workerUrl = URL.createObjectURL(blob);
      this.engine = new Worker(workerUrl);

      // Configure engine
      this.engine.onmessage = this.handleEngineMessage;
      this.engine.postMessage('uci');
      this.engine.postMessage('isready');

    } catch (error) {
      console.error('Failed to initialize Stockfish:', error);
      this.props.onGameUpdate?.('Failed to initialize chess engine');
    }
  };

  handleEngineMessage = (event) => {
    const line = event.data;
    
    if (line.startsWith('bestmove')) {
      const moves = line.split(' ');
      if (moves[1]) {
        const from = moves[1].slice(0, 2);
        const to = moves[1].slice(2, 4);
        const promotion = moves[1].length > 4 ? moves[1][4] : undefined;

        this.makeMove(from, to, promotion);
      }
    }
  };

  makeMove = (from, to, promotion) => {
    try {
      const move = this.game.move({
        from,
        to,
        promotion: promotion || 'q'
      });

      if (move) {
        this.setState({ fen: this.game.fen() }, this.checkGameStatus);
      }
    } catch (error) {
      console.error('Invalid move:', error);
    }
  };

  checkGameStatus = () => {
    if (this.game.isGameOver()) {
      let status = '';
      if (this.game.isCheckmate()) status = 'Checkmate!';
      else if (this.game.isDraw()) status = 'Draw!';
      else if (this.game.isStalemate()) status = 'Stalemate!';
      else if (this.game.isThreefoldRepetition()) status = 'Draw by repetition!';
      else if (this.game.isInsufficientMaterial()) status = 'Draw by insufficient material!';
      
      this.props.onGameUpdate?.(status);
    }
  };

  makeEngineMove = () => {
    const moves = this.game.history({ verbose: true })
      .map(move => move.from + move.to + (move.promotion || ''))
      .join(' ');

    this.engine.postMessage('position startpos moves ' + moves);
    this.engine.postMessage('go depth 15');
  };

  onDrop = ({ sourceSquare, targetSquare }) => {
    try {
      // Attempt to make the player's move
      const move = this.game.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q' // Always promote to queen for simplicity
      });

      // If move is invalid, return false to reset piece position
      if (!move) return false;

      // Update board position
      this.setState({ fen: this.game.fen() }, () => {
        // Check game status after player's move
        this.checkGameStatus();
        
        // If game isn't over, make engine's move
        if (!this.game.isGameOver()) {
          setTimeout(this.makeEngineMove, 300);
        }
      });

      return true;
    } catch (error) {
      console.error('Move error:', error);
      return false;
    }
  };

  render() {
    const { fen } = this.state;
    return this.props.children({ 
      position: fen, 
      onDrop: this.onDrop 
    });
  }
}

export default Stockfish;