document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('audioFile');
    const startButton = document.getElementById('startButton');
    const canvas = document.getElementById('visualizer');
    const ctx = canvas.getContext('2d');

    // Настройки Canvas (остаются прежними)
    const WIDTH = canvas.width = canvas.clientWidth;
    const HEIGHT = canvas.height = canvas.clientHeight;
    
    let audioContext;
    let analyser;
    let audioSource; // Объект для хранения аудиоисточника

    // --- Шаг 1: Обработка выбора файла ---
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            // Создаем временный URL для выбранного файла
            const fileURL = URL.createObjectURL(file);

            // Создаем новый аудио-элемент
            audioSource = new Audio(fileURL);
            audioSource.controls = true; // Добавляем контролы для управления
            audioSource.loop = false;
            
            // Вставляем элемент в DOM, чтобы пользователь мог нажать Play
            document.body.insertBefore(audioSource, canvas); 
            
            // Активируем кнопку для начала визуализации
            startButton.disabled = false;
        }
    });

    // --- Шаг 2: Инициализация Web Audio API при нажатии кнопки ---
    startButton.addEventListener('click', () => {
        if (!audioSource || !audioSource.paused) {
            alert("Пожалуйста, сначала выберите аудиофайл и остановите его.");
            return;
        }
        
        if (!audioContext) {
            // Создаем AudioContext
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Создаем источник из HTML-элемента <audio>
            const source = audioContext.createMediaElementSource(audioSource);
            
            // Создаем анализатор
            analyser = audioContext.createAnalyser();
            analyser.fftSize = 256; 
            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            
            // Соединяем узлы: Источник -> Анализатор -> Выход (динамики)
            source.connect(analyser);
            analyser.connect(audioContext.destination);

            // Запускаем цикл визуализации
            draw(analyser, dataArray, bufferLength, WIDTH, HEIGHT, ctx);
            
            // Можно сразу запустить воспроизведение после инициализации
            audioSource.play();
            startButton.textContent = "Визуализация активна";
            startButton.disabled = true;
        } else {
             // Если AudioContext уже есть, просто запускаем Play
             audioSource.play();
        }
    });

    // ... (Функция draw остается без изменений) ...
});


/**
 * Основной цикл рисования визуализации (эту функцию скопируйте из предыдущего ответа)
 */
function draw(analyser, dataArray, bufferLength, WIDTH, HEIGHT, ctx) {
    
    // Запускаем следующий кадр анимации
    requestAnimationFrame(() => draw(analyser, dataArray, bufferLength, WIDTH, HEIGHT, ctx));

    // Копируем данные частот в dataArray
    analyser.getByteFrequencyData(dataArray);

    // Очищаем Canvas
    ctx.fillStyle = 'rgb(15, 15, 35)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    const barWidth = (WIDTH / bufferLength) * 2.5;
    let x = 0;

    // Рисуем столбики (спектр)
    for(let i = 0; i < bufferLength; i++) {
        const barHeight = dataArray[i]; 
        const heightScale = barHeight / 255;
        const barScaledHeight = heightScale * HEIGHT; 

        const red = barHeight + (25 * (i/bufferLength));
        const green = 250 * (i/bufferLength);
        const blue = 50;
        
        ctx.fillStyle = `rgb(${red}, ${green}, ${blue})`;

        ctx.fillRect(x, HEIGHT - barScaledHeight, barWidth, barScaledHeight);

        x += barWidth + 1;
    }
}
