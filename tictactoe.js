const board = document.getElementById('board');
const statusDiv = document.getElementById('status');
const resetBtn = document.getElementById('reset');
let squares = Array(9).fill(null);
let xIsNext = true;
let gameOver = false;

function render() {
  board.innerHTML = '';
  squares.forEach((val, idx) => {
    const square = document.createElement('div');
    square.className = 'square';
    square.textContent = val || '';
    square.onclick = () => handleClick(idx);
    board.appendChild(square);
  });
  statusDiv.textContent = gameOver ? getWinnerText() : `Next player: ${xIsNext ? 'X' : 'O'}`;
}

function handleClick(idx) {
  if (gameOver || squares[idx]) return;
  squares[idx] = xIsNext ? 'X' : 'O';
  xIsNext = !xIsNext;
  checkWinner();
  render();
}

function checkWinner() {
  const lines = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];
  for (const [a,b,c] of lines) {
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      gameOver = true;
      return;
    }
  }
  if (!squares.includes(null)) gameOver = true;
}

function getWinnerText() {
  const lines = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];
  for (const [a,b,c] of lines) {
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return `Winner: ${squares[a]}`;
    }
  }
  return 'Draw!';
}

resetBtn.onclick = () => {
  squares = Array(9).fill(null);
  xIsNext = true;
  gameOver = false;
  render();
};

render();
