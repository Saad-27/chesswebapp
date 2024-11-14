import React, { useState, useEffect } from 'react';
import { db } from './config';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { Trophy, Award } from 'lucide-react';
import './css/Scoreboard.css';

const Scoreboard = () => {
  const [players, setPlayers] = useState([]);

  useEffect(() => {
    const fetchPlayerData = async () => {
      try {
        const playersRef = collection(db, 'users');
        const q = query(playersRef, orderBy('points', 'desc'));
        const querySnapshot = await getDocs(q);

        const playerData = [];
        querySnapshot.forEach((doc) => {
          playerData.push({ id: doc.id, ...doc.data() });
        });

        setPlayers(playerData);
      } catch (error) {
        console.error('Error fetching player data:', error);
      }
    };

    fetchPlayerData();
  }, []);

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1:
        return <Trophy className="rank-icon gold" />;
      case 2:
        return <Trophy className="rank-icon silver" />;
      case 3:
        return <Trophy className="rank-icon bronze" />;
      default:
        return <span className="rank-number">{rank}</span>;
    }
  };

  return (
    <div className="leaderboard-container">
      <div className="leaderboard-header">
        <Award className="header-icon" />
        <h1>Chess Leaderboard</h1>
      </div>

      <div className="leaderboard-table">
        <table>
          <thead>
            <tr>
              <th className="rank-header">Rank</th>
              <th className="name-header">Name</th>
              <th className="rating-header">Rating</th>
            </tr>
          </thead>
          <tbody>
            {players.map((player, index) => (
              <tr key={player.id} className={index % 2 === 0 ? 'row-even' : 'row-odd'}>
                <td className="rank-cell">
                  {getRankIcon(index + 1)}
                </td>
                <td className="name-cell">{player.username}</td>
                <td className="rating-cell">{player.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Scoreboard;