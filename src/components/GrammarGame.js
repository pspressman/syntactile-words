// src/components/GrammarGame.js
import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import WordTile from './WordTile';
import SentenceSlot from './SentenceSlot';
import './GrammarGame.css';

const MODES = {
    PASSIVE: 'Passive Voice',
    IMPERFECT: 'Imperfect Tense',
    OBJECT_CLEFT: 'Object Cleft',
    WH_QUESTION: 'Wh Questions'
};

const MAX_TRIES = 3;
const POINTS_PER_QUESTION = 10;
const PENALTY_PER_TRY = 3;

function GrammarGame() {
    // Game state
    const [mode, setMode] = useState(null);
    const [sentences, setSentences] = useState([]);
    const [availableSentences, setAvailableSentences] = useState([]);
    const [currentImage, setCurrentImage] = useState(null);
    const [correctOrderForCurrentSentence, setCorrectOrderForCurrentSentence] = useState([]);
    const [score, setScore] = useState(0);
    const [triesLeft, setTriesLeft] = useState(MAX_TRIES);
    const [feedback, setFeedback] = useState('');
    const [isError, setIsError] = useState(false);
    const [isComplete, setIsComplete] = useState(false);
    const [results, setResults] = useState([]);

    // Tiles and slots state
    const [wordTiles, setWordTiles] = useState([]);
    const [sentenceSlots, setSentenceSlots] = useState([]);
    const [selectedTile, setSelectedTile] = useState(null);

    // Load sentences from CSV
    useEffect(() => {
        loadSentences();
    }, []);

    const loadSentences = async () => {
        try {
            const response = await fetch('/sentences_corrected.csv');
            const csvText = await response.text();
            
            Papa.parse(csvText, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    // Store all sentences
                    setSentences(results.data);
                    // Also create a randomized copy for selection
                    setAvailableSentences(shuffleArray([...results.data]));
                }
            });
        } catch (error) {
            console.error('Error loading CSV:', error);
        }
    };

    // Map CSV columns to mode names
    const getModeColumn = (mode) => {
        switch(mode) {
            case MODES.PASSIVE:
                return "Passive";
            case MODES.IMPERFECT:
                return "Progressive Active";
            case MODES.OBJECT_CLEFT:
                return "Object Cleft";
            case MODES.WH_QUESTION:
                return "Wh Question";
            default:
                return "";
        }
    };

    // Get tile order based on mode and picture ID
    const getCorrectOrder = (gameMode, pictureId) => {
        const prefix = pictureId.charAt(0);
        const version2 = pictureId.includes("2");
        
        switch(gameMode) {
            case MODES.IMPERFECT:
                return version2 ? 
                    [`${prefix}2`, `${prefix}5`, `${prefix}3`, `${prefix}1`] :
                    [`${prefix}1`, `${prefix}5`, `${prefix}3`, `${prefix}2`];
            case MODES.PASSIVE:
                return version2 ?
                    [`${prefix}1`, `${prefix}5`, `${prefix}4`, `${prefix}6`, `${prefix}2`] :
                    [`${prefix}2`, `${prefix}5`, `${prefix}4`, `${prefix}6`, `${prefix}1`];
            case MODES.OBJECT_CLEFT:
                return version2 ?
                    [`${prefix}4`, `${prefix}2`, `${prefix}5`, `${prefix}3`, `${prefix}1`] :
                    [`${prefix}4`, `${prefix}1`, `${prefix}5`, `${prefix}3`, `${prefix}2`];
            case MODES.WH_QUESTION:
                return version2 ?
                    [`${prefix}5`, `${prefix}4`, `${prefix}2`, `${prefix}3`, `${prefix}6`] :
                    [`${prefix}5`, `${prefix}4`, `${prefix}1`, `${prefix}3`, `${prefix}6`];
            default:
                return [];
        }
    };

    // Setup a new trial when mode or availableSentences changes
    useEffect(() => {
        if (mode && availableSentences.length > 0) {
            setupNewTrial();
        }
    }, [mode, availableSentences]);

    const setupNewTrial = () => {
        if (availableSentences.length === 0) return;
        
        // Get a sentence from the randomized array
        const sentence = availableSentences[0];
        const pictureId = sentence.Picture.trim();
        
        const imagePath = `/images/Pic${pictureId}.jpg`;
        setCurrentImage(imagePath);
        
        // Get the correct tile order for this sentence
        const correctOrder = getCorrectOrder(mode, pictureId);
        console.log('Setting up trial for:', pictureId);
        console.log('Expected order:', correctOrder);
        setCorrectOrderForCurrentSentence(correctOrder);   

        // Map folders to modes
        const modeFolderMap = {
            "Passive Voice": "passive",
            "Imperfect Tense": "imperfect",
            "Object Cleft": "object_cleft",
            "Wh Questions": "wh_question"
        };
        
        const modeFolder = modeFolderMap[mode] || mode.toLowerCase();
        
        // Create tiles with the correct prefix
        const shuffledTiles = shuffleArray(
            correctOrder.map((tileId, index) => ({
                id: `tile-${index}`,
                tileId: tileId,
                imagePath: `/tiles/${modeFolder}/${tileId}.png`,
                isUsed: false
            }))
        );
        
        setWordTiles(shuffledTiles);
        
        // Create empty sentence slots
        const newSlots = correctOrder.map((_, index) => ({
            id: `slot-${index}`,
            position: index,
            tileId: null,
            wordTile: null
        }));
        
        setSentenceSlots(newSlots);
        setTriesLeft(MAX_TRIES);
        setFeedback('');
        setIsError(false);
        setSelectedTile(null);
    };

    // Handle tile selection
    const handleTileClick = (tileId) => {
        const tileIndex = wordTiles.findIndex(t => t.id === tileId);
        if (tileIndex !== -1 && !wordTiles[tileIndex].isUsed) {
            setSelectedTile(tileId);
        }
    };

    // Handle slot click - place a selected tile in a slot
    const handleSlotClick = (slotId) => {
        if (!selectedTile) return;
        
        const slotIndex = sentenceSlots.findIndex(s => s.id === slotId);
        
        // Only allow placement in empty slots
        if (slotIndex !== -1 && sentenceSlots[slotIndex].tileId === null) {
            // Find the tile
            const tileIndex = wordTiles.findIndex(t => t.id === selectedTile);
            
            // Update slots with the placed tile
            const newSlots = [...sentenceSlots];
            newSlots[slotIndex] = {
                ...newSlots[slotIndex],
                tileId: selectedTile,
                wordTile: wordTiles[tileIndex]
            };
            setSentenceSlots(newSlots);
            
            // Mark the tile as used
            const newTiles = [...wordTiles];
            newTiles[tileIndex] = {
                ...newTiles[tileIndex],
                isUsed: true
            };
            setWordTiles(newTiles);
            
            // Clear selection
            setSelectedTile(null);
            
            // Check if sentence is complete
            if (newSlots.every(slot => slot.wordTile !== null)) {
                checkSentence(newSlots);
            }
        }
    };

    // Remove a tile from a slot
    const handleSlotReset = (slotId) => {
        const slotIndex = sentenceSlots.findIndex(s => s.id === slotId);
        if (slotIndex !== -1 && sentenceSlots[slotIndex].tileId) {
            const tileId = sentenceSlots[slotIndex].tileId;
            
            // Clear the slot
            const newSlots = [...sentenceSlots];
            newSlots[slotIndex] = {
                ...newSlots[slotIndex],
                tileId: null,
                wordTile: null
            };
            setSentenceSlots(newSlots);
            
            // Mark the tile as available again
            const tileIndex = wordTiles.findIndex(t => t.id === tileId);
            const newTiles = [...wordTiles];
            newTiles[tileIndex] = {
                ...newTiles[tileIndex],
                isUsed: false
            };
            setWordTiles(newTiles);
        }
    };

    // Check if the sentence is correct
    const checkSentence = (currentSlots) => {
        // Compare the current order with the correct order that was 
        // stored during setupNewTrial
        
        // Extract tileIds from the slots
        const currentOrderIds = currentSlots.map(slot => slot.wordTile ? slot.wordTile.tileId : null);
        console.log('User arrangement:', currentOrderIds);
        console.log('Expected arrangement:', correctOrderForCurrentSentence);
        
        // Compare with the correct order for this sentence
        let isCorrect = true;
        for (let i = 0; i < correctOrderForCurrentSentence.length; i++) {
            if (currentOrderIds[i] !== correctOrderForCurrentSentence[i]) {
                isCorrect = false;
                break;
            }
        }

        if (isCorrect) {
            const trialScore = Math.max(
                POINTS_PER_QUESTION - ((MAX_TRIES - triesLeft) * PENALTY_PER_TRY), 
                0
            );
            setScore(score + trialScore);
            setFeedback('Correct! Moving to next image...');
            
            setResults([...results, {
                image: currentImage,
                mode,
                triesUsed: MAX_TRIES - triesLeft,
                score: trialScore,
                timestamp: new Date().toISOString()
            }]);

            setTimeout(() => {
                if (availableSentences.length > 1) {
                    // Remove the current sentence from available pool
                    const newAvailableSentences = [...availableSentences.slice(1)];
                    setAvailableSentences(newAvailableSentences);
                    setFeedback('');
                } else {
                    setIsComplete(true);
                }
            }, 1500);
        } else {
            setIsError(true);
            setTriesLeft(triesLeft - 1);
            
            if (triesLeft <= 1) {
                setFeedback('Out of tries. Moving to next question...');
                setTimeout(() => {
                    if (availableSentences.length > 1) {
                        // Remove the current sentence from available pool
                        const newAvailableSentences = [...availableSentences.slice(1)];
                        setAvailableSentences(newAvailableSentences);
                        setFeedback('');
                    } else {
                        setIsComplete(true);
                    }
                }, 1500);
            } else {
                setFeedback(`Incorrect! ${triesLeft - 1} tries left`);
                setTimeout(() => setIsError(false), 1000);
            }
        }
    };

    // Helper function to shuffle array
    const shuffleArray = (array) => {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    };

    // Function to download results as CSV
    const downloadResults = () => {
        const csv = [
            ['Image', 'Mode', 'Tries Used', 'Score', 'Timestamp'],
            ...results.map(r => [
                r.image, r.mode, r.triesUsed, r.score, r.timestamp
            ])
        ].map(row => row.join(',')).join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'grammar_game_results.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Game complete screen
    if (isComplete) {
        const averageTries = (results.reduce((sum, r) => sum + r.triesUsed, 0) / results.length).toFixed(1);
        return (
            <div className="game-container">
                <h1 className="game-title">Game Complete</h1>
                <p className="game-score">
                    Final Score: {score}
                    <br />
                    Average tries per question: {averageTries}
                </p>
                <button 
                    className="mode-button"
                    onClick={downloadResults}
                >
                    Download Results
                </button>
                <div className="back-to-hub">
                    <button 
                        className="back-button"
                        onClick={() => window.location.href = 'https://syntactic-hub.vercel.app'}
                    >
                        Back to Syntactic Hub
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="game-container">
            <button 
                onClick={() => window.location.href = 'https://syntactic-hub.vercel.app'}
                className="back-button"
            >
                Back to Syntactic Hub
            </button>
            <h1 className="game-title">Grammar Sentence Game</h1>
            
            {/* Mode selection */}
            {!mode ? (
                <div className="mode-selection">
                    <h2>Choose your practice mode:</h2>
                    {Object.values(MODES).map((modeOption) => (
                        <button
                            key={modeOption}
                            className={`mode-button ${mode === modeOption ? 'selected' : ''}`}
                            onClick={() => setMode(modeOption)}
                        >
                            {modeOption}
                        </button>
                    ))}
                </div>
            ) : (
                <>
                    <div className="game-score">
                        Score: {score}
                        <br />
                        Question {sentences.length - availableSentences.length + 1} of {sentences.length}
                    </div>
                    <div className="tries-counter">
                        Tries Left: {triesLeft}
                    </div>
                    
                    {/* Image prompt */}
                    <div className="image-container">
                        <img
                            src={currentImage}
                            alt="Scene to describe"
                            className="prompt-image"
                        />
                    </div>
                    
                    {/* Sentence slots */}
                    <div className="sentence-slots">
                        {sentenceSlots.map(slot => (
                            <SentenceSlot
                                key={slot.id}
                                id={slot.id}
                                tile={slot.wordTile}
                                isError={isError}
                                onClick={() => slot.wordTile 
                                    ? handleSlotReset(slot.id) 
                                    : handleSlotClick(slot.id)}
                            />
                        ))}
                    </div>
                    
                    {/* Word tiles */}
                    <div className="word-tiles">
                        {wordTiles.map(tile => (
                            <WordTile
                                key={tile.id}
                                id={tile.id}
                                imagePath={tile.imagePath}
                                isUsed={tile.isUsed}
                                isSelected={selectedTile === tile.id}
                                onClick={() => handleTileClick(tile.id)}
                            />
                        ))}
                    </div>
                    
                    {feedback && (
                        <div className={`feedback ${isError ? 'error' : 'success'}`}>
                            {feedback}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

export default GrammarGame;