// Файл script.js
let boysScore = 0;
let girlsScore = 0;

const gameScreen = document.getElementById('game-screen');
const resultsScreen = document.getElementById('results-screen');
const boysScoreEl = document.getElementById('boys-score');
const girlsScoreEl = document.getElementById('girls-score');
const finalWinnerEl = document.getElementById('final-winner');
const boysSummaryEl = document.getElementById('boys-summary');
const girlsSummaryEl = document.getElementById('girls-summary');


// Функция добавления очка
function addPoint(team) {
    if (team === 'boys') {
        boysScore++;
        boysScoreEl.textContent = boysScore;
    } else if (team === 'girls') {
        girlsScore++;
        girlsScoreEl.textContent = girlsScore;
    }
}

// Функция для переключения на экран результатов
function showResults() {
    // 1. Скрываем основной экран и показываем экран результатов
    gameScreen.classList.remove('active');
    resultsScreen.classList.add('active');

    // 2. Определяем победителя
    let winnerText;
    let winnerTeam;
    let winnerEmoji;

    if (boysScore > girlsScore) {
        winnerTeam = 'Мальчики';
        winnerEmoji = '🏆👦';
    } else if (girlsScore > boysScore) {
        winnerTeam = 'Девочки';
        winnerEmoji = '🏆👧';
    } else {
        winnerTeam = 'НИЧЬЯ';
        winnerEmoji = '🤝';
    }

    // 3. Формируем красивый вывод
    finalWinnerEl.innerHTML = `
        ${winnerEmoji} ${winnerTeam} ПОБЕЖДАЮТ! ${winnerEmoji}
    `;
    
    // 4. Заполняем статистику
    boysSummaryEl.innerHTML = `
        <h3>Мальчики 👦</h3>
        <p>Счет: <strong>${boysScore}</strong></p>
        <p>Результат: ${boysScore > girlsScore ? 'Победа!' : boysScore === girlsScore ? 'Ничья' : 'Поражение'}</p>
    `;
    
    girlsSummaryEl.innerHTML = `
        <h3>Девочки 👧</h3>
        <p>Счет: <strong>${girlsScore}</strong></p>
        <p>Результат: ${girlsScore > boysScore ? 'Победа!' : boysScore === girlsScore ? 'Ничья' : 'Поражение'}</p>
    `;
}


// Функция для сброса игры
function resetGame() {
    // Сброс счёта
    boysScore = 0;
    girlsScore = 0;
    boysScoreEl.textContent = 0;
    girlsScoreEl.textContent = 0;

    // Сброс экрана
    resultsScreen.classList.remove('active');
    gameScreen.classList.add('active');
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    // Начальный сброс для уверенности в старте
    resetGame(); 
});
