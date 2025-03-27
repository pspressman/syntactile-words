// src/WordTile.js
import React from 'react';
import './WordTile.css';

function WordTile({ id, imagePath, isUsed, isSelected, onClick }) {
  return (
    <div
      className={`word-tile ${isUsed ? 'used' : ''} ${isSelected ? 'selected' : ''}`}
      onClick={!isUsed ? onClick : undefined}
    >
      {!isUsed && (
        <img 
          src={imagePath} 
          alt="Word tile" 
          className="word-tile-image"
        />
      )}
    </div>
  );
}

export default WordTile;
