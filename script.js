// Файл script.js
let boysScore = 0;
let girlsScore = 0;
const winningScore = 10; // Цель, после которой объявляется победитель

function addPoint(team) {
    if (team === 'boys') {
        boysScore++;
        document.getElementById('boys-score').textContent = boysScore;
    } else if (team === 'girls') {
        girlsScore++;
        document.getElementById('girls-score').textContent = girlsScore;
    }
    
    checkWinner();
}

function checkWinner() {
    const winnerDisplay = document.getElementById('winner-display');
    winnerDisplay.textContent = ''; // Очищаем предыдущее сообщение

    if (boysScore >= winningScore) {
        winnerDisplay.innerHTML = '🎉 **ПОБЕДИТЕЛИ: МАЛЬЧИКИ!** 🎉';
        // Здесь можно добавить стили для особого выделения
        winnerDisplay.style.color = '#007BFF'; // Синий
    } else if (girlsScore >= winningScore) {
        winnerDisplay.innerHTML = '👑 **ПОБЕДИТЕЛИ: ДЕВОЧКИ!** 👑';
        winnerDisplay.style.color = '#FF4081'; // Розовый
    } else if (boysScore === girlsScore && boysScore > 0) {
         // Для отображения "Ничья" до достижения финального счета можно добавить условие.
         // Но обычно это не нужно, пока не достигнут лимит.
    }
}
