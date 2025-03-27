// src/SentenceSlot.js
import React from 'react';
import './SentenceSlot.css';

function SentenceSlot({ id, tile, isError, onClick }) {
  return (
    <div 
      className={`sentence-slot ${tile ? 'filled' : 'empty'} ${isError ? 'error' : ''}`}
      onClick={onClick}
    >
      {tile && (
        <img 
          src={tile.imagePath} 
          alt="Word" 
          className="slot-image"
        />
      )}
    </div>
  );
}

export default SentenceSlot;
