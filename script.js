document.addEventListener('DOMContentLoaded', function() {
    const gameBoard = document.getElementById('gameBoard');
    const mineCountElement = document.getElementById('mineCount');
    const timerElement = document.getElementById('timer');
    const faceElement = document.getElementById('face');
    const restartBtn = document.getElementById('restartBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const pauseOverlay = document.getElementById('pauseOverlay');
    const resumeBtn = document.getElementById('resumeBtn');
    const pauseTimerElement = document.getElementById('pauseTimer');
    const diffButtons = document.querySelectorAll('.diff-btn');
    
    let gameState = {
        rows: 10,
        cols: 10,
        mines: 10,
        board: [],
        revealedCount: 0,
        flaggedCount: 0,
        gameOver: false,
        gameStarted: false,
        gamePaused: false,
        timer: 0,
        timerInterval: null,
        difficulty: 'easy'
    };
    
    const difficulties = {
        easy: { rows: 10, cols: 10, mines: 10 },
        medium: { rows: 16, cols: 16, mines: 40 },
        hard: { rows: 16, cols: 30, mines: 99 }
    };
    
    function initGame() {
        clearInterval(gameState.timerInterval);
        gameState.gameOver = false;
        gameState.gameStarted = false;
        gameState.gamePaused = false;
        gameState.revealedCount = 0;
        gameState.flaggedCount = 0;
        gameState.timer = 0;
        timerElement.textContent = '000';
        faceElement.textContent = '😎';
        
        const diff = difficulties[gameState.difficulty];
        gameState.rows = diff.rows;
        gameState.cols = diff.cols;
        gameState.mines = diff.mines;
        
        mineCountElement.textContent = gameState.mines.toString().padStart(3, '0');
        
        createBoard();
        renderBoard();
        pauseOverlay.style.display = 'none';
    }
    
    function createBoard() {
        gameState.board = [];
        
        for (let row = 0; row < gameState.rows; row++) {
            gameState.board[row] = [];
            for (let col = 0; col < gameState.cols; col++) {
                gameState.board[row][col] = {
                    isMine: false,
                    isRevealed: false,
                    isFlagged: false,
                    isQuestion: false,
                    neighborMines: 0
                };
            }
        }
        
        let minesPlaced = 0;
        while (minesPlaced < gameState.mines) {
            const randomRow = Math.floor(Math.random() * gameState.rows);
            const randomCol = Math.floor(Math.random() * gameState.cols);
            
            if (!gameState.board[randomRow][randomCol].isMine) {
                gameState.board[randomRow][randomCol].isMine = true;
                minesPlaced++;
                
                for (let r = Math.max(0, randomRow - 1); r <= Math.min(gameState.rows - 1, randomRow + 1); r++) {
                    for (let c = Math.max(0, randomCol - 1); c <= Math.min(gameState.cols - 1, randomCol + 1); c++) {
                        if (!(r === randomRow && c === randomCol)) {
                            gameState.board[r][c].neighborMines++;
                        }
                    }
                }
            }
        }
    }
    
    function renderBoard() {
        gameBoard.innerHTML = '';
        gameBoard.style.gridTemplateColumns = `repeat(${gameState.cols}, 1fr)`;
        
        for (let row = 0; row < gameState.rows; row++) {
            for (let col = 0; col < gameState.cols; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                const cellData = gameState.board[row][col];
                
                if (cellData.isRevealed) {
                    cell.classList.add('revealed');
                    
                    if (cellData.isMine) {
                        cell.classList.add('mine');
                    } else if (cellData.neighborMines > 0) {
                        cell.textContent = cellData.neighborMines;
                        cell.classList.add(`number-${cellData.neighborMines}`);
                    }
                } else {
                    if (cellData.isFlagged) {
                        cell.classList.add('flagged');
                    } else if (cellData.isQuestion) {
                        cell.classList.add('question');
                    }
                }
                
                cell.addEventListener('click', () => handleCellClick(row, col));
                cell.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    handleRightClick(row, col);
                });
                cell.addEventListener('mousedown', (e) => {
                    if (e.button === 1) {
                        e.preventDefault();
                        handleMiddleClick(row, col);
                    }
                });
                
                gameBoard.appendChild(cell);
            }
        }
    }
    
    function handleCellClick(row, col) {
        if (gameState.gameOver || gameState.gamePaused) return;
        
        const cell = gameState.board[row][col];
        
        if (!gameState.gameStarted) {
            gameState.gameStarted = true;
            startTimer();
        }
        
        if (cell.isFlagged || cell.isQuestion || cell.isRevealed) return;
        
        if (cell.isMine) {
            revealAllMines();
            gameState.gameOver = true;
            faceElement.textContent = '💀';
            clearInterval(gameState.timerInterval);
            return;
        }
        
        revealCell(row, col);
        
        if (gameState.revealedCount === gameState.rows * gameState.cols - gameState.mines) {
            gameState.gameOver = true;
            faceElement.textContent = '🏆';
            clearInterval(gameState.timerInterval);
            markAllMines();
        }
    }
    
    function handleRightClick(row, col) {
        if (gameState.gameOver || gameState.gamePaused) return;
        
        const cell = gameState.board[row][col];
        
        if (cell.isRevealed) return;
        
        if (!cell.isFlagged && !cell.isQuestion) {
            cell.isFlagged = true;
            gameState.flaggedCount++;
        } else if (cell.isFlagged) {
            cell.isFlagged = false;
            cell.isQuestion = true;
            gameState.flaggedCount--;
        } else if (cell.isQuestion) {
            cell.isQuestion = false;
        }
        
        mineCountElement.textContent = (gameState.mines - gameState.flaggedCount).toString().padStart(3, '0');
        renderBoard();
    }
    
    function handleMiddleClick(row, col) {
        if (gameState.gameOver || gameState.gamePaused) return;
        
        const cell = gameState.board[row][col];
        
        if (!cell.isRevealed) {
            if (!cell.isFlagged && !cell.isQuestion) {
                cell.isQuestion = true;
            } else if (cell.isQuestion) {
                cell.isQuestion = false;
            }
            renderBoard();
        }
    }
    
    function revealCell(row, col) {
        if (row < 0 || row >= gameState.rows || col < 0 || col >= gameState.cols) return;
        
        const cell = gameState.board[row][col];
        
        if (cell.isRevealed || cell.isFlagged || cell.isQuestion) return;
        
        cell.isRevealed = true;
        gameState.revealedCount++;
        
        if (cell.neighborMines === 0) {
            for (let r = row - 1; r <= row + 1; r++) {
                for (let c = col - 1; c <= col + 1; c++) {
                    revealCell(r, c);
                }
            }
        }
        
        renderBoard();
    }
    
    function revealAllMines() {
        for (let row = 0; row < gameState.rows; row++) {
            for (let col = 0; col < gameState.cols; col++) {
                if (gameState.board[row][col].isMine) {
                    gameState.board[row][col].isRevealed = true;
                }
            }
        }
        renderBoard();
    }
    
    function markAllMines() {
        for (let row = 0; row < gameState.rows; row++) {
            for (let col = 0; col < gameState.cols; col++) {
                if (gameState.board[row][col].isMine) {
                    gameState.board[row][col].isFlagged = true;
                }
            }
        }
        gameState.flaggedCount = gameState.mines;
        mineCountElement.textContent = '000';
        renderBoard();
    }
    
    function startTimer() {
        clearInterval(gameState.timerInterval);
        gameState.timer = 0;
        
        gameState.timerInterval = setInterval(() => {
            if (!gameState.gamePaused) {
                gameState.timer++;
                timerElement.textContent = gameState.timer.toString().padStart(3, '0');
            }
        }, 1000);
    }
    
    function togglePause() {
        gameState.gamePaused = !gameState.gamePaused;
        
        if (gameState.gamePaused) {
            pauseOverlay.style.display = 'flex';
            pauseTimerElement.textContent = timerElement.textContent;
            pauseBtn.innerHTML = '<i class="fas fa-play"></i><span>Продолжить</span>';
        } else {
            pauseOverlay.style.display = 'none';
            pauseBtn.innerHTML = '<i class="fas fa-pause"></i><span>Пауза</span>';
        }
    }
    
    restartBtn.addEventListener('click', initGame);
    
    pauseBtn.addEventListener('click', togglePause);
    
    resumeBtn.addEventListener('click', togglePause);
    
    diffButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            diffButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            gameState.difficulty = this.dataset.difficulty;
            initGame();
        });
    });
    
    initGame();
});