// Файл script.js
let boysScore = 0;
let girlsScore = 0;
const winningScore = 10; // Цель для победы

const boysScoreEl = document.getElementById('boys-score');
const girlsScoreEl = document.getElementById('girls-score');
const winnerDisplay = document.getElementById('winner-display');
const buttons = document.querySelectorAll('.scoreboard button');

// Функция для добавления очка
function addPoint(team) {
    if (winnerDisplay.hasAttribute('data-winner')) {
        // Если победитель уже объявлен, очки не добавляются
        return;
    }

    if (team === 'boys') {
        boysScore++;
        boysScoreEl.textContent = boysScore;
    } else if (team === 'girls') {
        girlsScore++;
        girlsScoreEl.textContent = girlsScore;
    }
    
    checkWinner();
}

// Функция проверки победителя и эффектного вывода
function checkWinner() {
    let winnerName = null;

    if (boysScore >= winningScore) {
        winnerName = 'Мальчики 👦';
    } else if (girlsScore >= winningScore) {
        winnerName = 'Девочки 👧';
    }

    if (winnerName) {
        // Устанавливаем атрибут, чтобы заблокировать добавление очков
        winnerDisplay.setAttribute('data-winner', winnerName); 
        
        // Красивый вывод
        winnerDisplay.innerHTML = `
            <span class="confetti">🎉</span> 
            ПОБЕДИТЕЛИ: ${winnerName}
            <span class="confetti">🎉</span>
        `;
        winnerDisplay.classList.add('active'); // Активируем стили победы
        disableButtons();
    }
}

// Функция для блокировки кнопок
function disableButtons() {
    buttons.forEach(button => {
        button.disabled = true;
    });
}

// Функция для сброса игры
function resetGame() {
    boysScore = 0;
    girlsScore = 0;
    boysScoreEl.textContent = 0;
    girlsScoreEl.textContent = 0;

    winnerDisplay.removeAttribute('data-winner');
    winnerDisplay.textContent = 'Кто наберёт 10 очков первым?';
    winnerDisplay.classList.remove('active');

    buttons.forEach(button => {
        button.disabled = false;
    });
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    // Устанавливаем начальный текст
    resetGame(); 
});
