/* --- stacker.js (FIXED) --- */

/* === GLOBAL SETUP & CONFIGURATION === */
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score');
const restartBtn = document.getElementById('restartBtn');

// The internal width and height of the game, used for logical calculations
const width = 400;
const height = 400;

let score = 0;
let gameState = 'playing'; // 'playing' or 'gameOver'

/* --- BLOCK & GAME MECHANICS CONFIGURATION --- */
const BLOCK_START_WIDTH = 100;
const BLOCK_HEIGHT = 20;

let currentBlock = {};
let placedBlocks = [];

let swingAngle = 0;
let swingSpeed = 0.05;

/* =========================================
   CORE GAME MECHANICS & LOGIC
   ========================================= */

/**
 * Initializes/Resets the game state and entities
 */
function initGame() {
    score = 0;
    scoreDisplay.innerText = score;
    gameState = 'playing';
    swingSpeed = 0.05; // Reset speed for new game
    restartBtn.style.display = 'none'; // Hide button while playing
    placedBlocks = []; // Clear existing blocks

    // Create the stable Base Block
    placedBlocks.push({
        x: (width / 2) - (BLOCK_START_WIDTH / 2),
        y: height - BLOCK_HEIGHT,
        w: BLOCK_START_WIDTH,
        h: BLOCK_HEIGHT,
        color: '#f39c12' // Brand Orange
    });

    startNewBlock();
}

/**
 * Creates a new swinging block, narrowing it if a previous block exists.
 * Also triggers the camera check.
 */
function startNewBlock() {
    // Get the previous top block to determine narrowness
    let previousTop = placedBlocks[placedBlocks.length - 1];
    
    // Narrowing Mechanic: New width is 96% of the block below it
    let newWidth = previousTop.w * 0.96;
    
    // Safety check: ensure the block doesn't disappear
    if (newWidth < 10) newWidth = 10;

    currentBlock = {
        // Position it centrally over the swing path
        x: width / 2, 
        y: (height - BLOCK_HEIGHT * 2) - (placedBlocks.length * BLOCK_HEIGHT),
        w: newWidth,
        h: BLOCK_HEIGHT,
        color: '#bdc3c7' // Silver Grey for unplaced block
    };

    // Before continuing, check if the tower is getting too high and trigger camera shift
    checkCameraShift();
}

/**
 * DYNAMIC CAMERA SHIFT MECHANIC
 * Ensures the game does not stop displaying blocks after score 20.
 * If the current unplaced block is too high, shift everything down by 1 block's height.
 */
function checkCameraShift() {
    const SHIFT_TRIGGER_Y = 150; // Threshold: if block is higher (smaller Y), shift.

    if (currentBlock.y < SHIFT_TRIGGER_Y) {
        // Shift all unplaced (placed) blocks down by the height of one block
        placedBlocks.forEach(block => block.y += BLOCK_HEIGHT);
        
        // Also shift the unplaced block down so its next target is the newly shifted top.
        currentBlock.y += BLOCK_HEIGHT;
    }
}

/**
 * Updates the logical state of the game (swinging block position).
 */
function update() {
    if (gameState !== 'playing') return; // STOP movement if game over

    // Animate the swinging block using a standard Sine curve path
    swingAngle += swingSpeed;
    currentBlock.x = (width / 2) + Math.sin(swingAngle) * 120; // 120 is the swing radius
}

/**
 * Renders the entire game state onto the canvas.
 */
function draw() {
    // Clear the canvas to draw a fresh frame
    ctx.clearRect(0, 0, width, height);

    // Render the Ground line
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, height - 5, width, 5);

    // Render all already Placed Blocks
    placedBlocks.forEach(block => {
        ctx.fillStyle = block.color;
        ctx.fillRect(block.x, block.y, block.w, block.h);
    });

    // Handle "Playing" vs "Game Over" rendering
    if (gameState === 'playing') {
        // 1. Render the Cable connecting the ceiling to the unplaced block
        ctx.strokeStyle = '#666'; // Dark Grey for cable
        ctx.beginPath();
        ctx.moveTo(width / 2, 0); // Origin at top center
        ctx.lineTo(currentBlock.x, currentBlock.y); // Path to unplaced block
        ctx.stroke();
        
        // 2. Render the Swinging Block (centered on its logic position)
        ctx.fillStyle = currentBlock.color;
        ctx.fillRect(currentBlock.x - currentBlock.w / 2, currentBlock.y, currentBlock.w, currentBlock.h);

    } else {
        // RENDER THE GAME OVER SCREEN
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'; // Dark semi-transparent overlay
        ctx.fillRect(0, 0, width, height);
        
        // Final message
        ctx.fillStyle = '#f39c12';
        ctx.font = 'bold 30px Arial';
        ctx.textAlign = 'center';
        ctx.fillText("TOWER COLLAPSED", width / 2, height / 2 - 20);
        
        // Score display
        ctx.fillStyle = 'white';
        ctx.font = '18px Arial';
        ctx.fillText("Final Score: " + score, width / 2, height / 2 + 20);
    }
}

/* =========================================
   USER INPUT & INTERACTION
   ========================================= */

/**
 * DROP LOGIC: Triggers when the user clicks/taps on the canvas.
 * Handles collision check, score update, narrowing, speed increase.
 */
window.addEventListener('mousedown', () => {
    // Exit immediately if the game is already over
    if (gameState !== 'playing') return;
    
    let topBlock = placedBlocks[placedBlocks.length - 1];
    let currentX = currentBlock.x - (currentBlock.w / 2); // logical position of left edge
    
    // Check if unplaced block lands ON the one below (overlap collision check)
    // If unplaced block left edge is greater than top block's right edge, or right edge is smaller than left edge, it misses.
    if (currentX > topBlock.x + topBlock.w || currentX + currentBlock.w < topBlock.x) {
        // MISS: Block collapses
        gameState = 'gameOver';
        restartBtn.style.display = 'inline-block'; // Show restart option CTA
    } else {
        // SUCCESS: Block placed
        placedBlocks.push({
            x: currentX, // Use logical position
            y: currentBlock.y,
            w: currentBlock.w,
            h: BLOCK_HEIGHT,
            color: '#f39c12' // Brand Orange
        });
        
        // Update score and speed
        score++;
        scoreDisplay.innerText = score;
        swingSpeed += 0.005; // Slightly faster each placement

        // Prepare for the next block (including camera shift check)
        startNewBlock();
    }
});

// Mobile Responsiveness and organizing: stop the click immediate action
// when clicking the restart button.
restartBtn.addEventListener('click', (e) => {
    e.stopPropagation(); // Prevents the click from triggering a "drop" immediately
    initGame();
});

/* =========================================
   GAME LOOP & INVOCATION
   ========================================= */

/**
 * The core game loop that orchestrates updating and drawing every frame.
 */
function gameLoop() {
    update();
    draw();
    // Schedule the next frame, leveraging browser optimization
    requestAnimationFrame(gameLoop);
}

// Start the organized game
initGame();
gameLoop();