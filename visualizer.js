document.addEventListener('DOMContentLoaded', () => {
    const audio = document.getElementById('audioElement');
    const canvas = document.getElementById('visualizer');
    const ctx = canvas.getContext('2d');

    // 1. Создание аудиоконтекста
    let audioContext;
    let analyser;

    // Сброс размеров Canvas для правильного отображения
    const WIDTH = canvas.width = canvas.clientWidth;
    const HEIGHT = canvas.height = canvas.clientHeight;
    
    // Инициализация при начале воспроизведения
    audio.addEventListener('play', () => {
        if (!audioContext) {
            // Создаем AudioContext при взаимодействии с пользователем
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Создаем источник из HTML-элемента <audio>
            const source = audioContext.createMediaElementSource(audio);
            
            // Создаем анализатор (AnalyserNode)
            analyser = audioContext.createAnalyser();
            
            // Настраиваем анализатор
            analyser.fftSize = 256; // Количество "корзин" частот
            const bufferLength = analyser.frequencyBinCount; // Половина fftSize (128)
            const dataArray = new Uint8Array(bufferLength); // Массив для хранения данных частот
            
            // Соединяем узлы: Источник -> Анализатор -> Выход (динамики)
            source.connect(analyser);
            analyser.connect(audioContext.destination);

            // Запускаем цикл визуализации
            draw(analyser, dataArray, bufferLength, WIDTH, HEIGHT, ctx);
        }
    });
});

/**
 * Основной цикл рисования визуализации
 * @param {AnalyserNode} analyser - Анализатор звука
 * @param {Uint8Array} dataArray - Массив для данных частот
 * @param {number} bufferLength - Длина массива данных
 * @param {number} WIDTH - Ширина Canvas
 * @param {number} HEIGHT - Высота Canvas
 * @param {CanvasRenderingContext2D} ctx - Контекст рисования Canvas
 */
function draw(analyser, dataArray, bufferLength, WIDTH, HEIGHT, ctx) {
    
    // Запускаем следующий кадр анимации
    requestAnimationFrame(() => draw(analyser, dataArray, bufferLength, WIDTH, HEIGHT, ctx));

    // Копируем данные частот в dataArray (значения от 0 до 255)
    analyser.getByteFrequencyData(dataArray); 

    // Очищаем Canvas
    ctx.fillStyle = 'rgb(15, 15, 35)'; // Фон
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    const barWidth = (WIDTH / bufferLength) * 2.5; // Ширина одного столбика
    let x = 0; // Начальная позиция X для рисования

    // Рисуем столбики (спектр)
    for(let i = 0; i < bufferLength; i++) {
        // Значение амплитуды (от 0 до 255)
        const barHeight = dataArray[i]; 

        // Вычисляем высоту на Canvas
        const heightScale = barHeight / 255;
        const barScaledHeight = heightScale * HEIGHT; 

        // Цвета (простой градиент)
        const red = barHeight + (25 * (i/bufferLength));
        const green = 250 * (i/bufferLength);
        const blue = 50;
        
        ctx.fillStyle = `rgb(${red}, ${green}, ${blue})`;

        // Рисуем прямоугольник (x, y, ширина, высота)
        // Начинаем рисовать снизу Canvas (HEIGHT - barScaledHeight)
        ctx.fillRect(x, HEIGHT - barScaledHeight, barWidth, barScaledHeight);

        // Перемещаемся вправо для следующего столбика
        x += barWidth + 1;
    }
}
