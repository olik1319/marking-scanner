document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('audioFile');
    const canvas = document.getElementById('visualizer');
    const audioContainer = document.getElementById('audio-container');
    const ctx = canvas.getContext('2d');

    // Настройки Canvas
    // Важно: Эти переменные нужно установить после загрузки страницы
    const WIDTH = canvas.width = canvas.clientWidth;
    const HEIGHT = canvas.height = canvas.clientHeight;
    
    let audioContext = null;
    let analyser;
    let animationFrameId = null; // ID для управления циклом requestAnimationFrame

    // --- Обработка выбора файла ---
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            // Очистка предыдущего состояния
            audioContainer.innerHTML = ''; 
            if (animationFrameId !== null) {
                cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
            }
            // Сброс Canvas
            ctx.fillStyle = 'rgb(15, 15, 35)';
            ctx.fillRect(0, 0, WIDTH, HEIGHT); 

            // Создаем новый аудио-элемент
            const audioSource = new Audio();
            audioSource.controls = true;
            audioSource.loop = false;
            audioSource.src = URL.createObjectURL(file);
            
            // Добавляем элемент в DOM
            audioContainer.appendChild(audioSource);

            // --- Инициализация Web Audio API при первом Play ---
            audioSource.addEventListener('play', () => {
                // Инициализируем AudioContext только один раз
                if (!audioContext) {
                    audioContext = new (window.AudioContext || window.webkitAudioContext)();
                    const source = audioContext.createMediaElementSource(audioSource);
                    
                    analyser = audioContext.createAnalyser();
                    analyser.fftSize = 256; 
                    const bufferLength = analyser.frequencyBinCount;
                    const dataArray = new Uint8Array(bufferLength);
                    
                    // Соединяем узлы: Источник -> Анализатор -> Выход (динамики)
                    source.connect(analyser);
                    analyser.connect(audioContext.destination);

                    // Запускаем цикл визуализации
                    draw(analyser, dataArray, bufferLength, WIDTH, HEIGHT, ctx);
                } 
                
                // Возобновление AudioContext, если он был приостановлен (например, при смене вкладки)
                if (audioContext && audioContext.state === 'suspended') {
                    audioContext.resume();
                }
                
                // Возобновление цикла рисования, если он был остановлен (после паузы)
                if (analyser && animationFrameId === null) {
                    const bufferLength = analyser.frequencyBinCount;
                    const dataArray = new Uint8Array(bufferLength);
                    draw(analyser, dataArray, bufferLength, WIDTH, HEIGHT, ctx);
                }

            });
            
            // --- Остановка цикла рисования при паузе ---
            audioSource.addEventListener('pause', () => {
                if (animationFrameId !== null) {
                    cancelAnimationFrame(animationFrameId); 
                    animationFrameId = null; // Сброс ID
                }
            });
        }
    });

    /**
     * Основной цикл рисования визуализации (спектр)
     */
    function draw(analyser, dataArray, bufferLength, WIDTH, HEIGHT, ctx) {
        
        // Запоминаем ID кадра для управления паузой/возобновлением
        animationFrameId = requestAnimationFrame(() => draw(analyser, dataArray, bufferLength, WIDTH, HEIGHT, ctx));
        
        // Копируем данные частот в dataArray (значения от 0 до 255)
        analyser.getByteFrequencyData(dataArray); 

        // Очищаем Canvas
        ctx.fillStyle = 'rgb(15, 15, 35)';
        ctx.fillRect(0, 0, WIDTH, HEIGHT);

        const barWidth = (WIDTH / bufferLength) * 2.5;
        let x = 0;

        // Рисуем столбики (спектр)
        for(let i = 0; i < bufferLength; i++) {
            const barHeight = dataArray[i]; // Амплитуда
            
            // Масштабирование высоты
            const heightScale = barHeight / 255;
            const barScaledHeight = heightScale * HEIGHT; 

            // Цвета
            const red = barHeight + (25 * (i/bufferLength));
            const green = 250 * (i/bufferLength);
            const blue = 50;
            
            ctx.fillStyle = `rgb(${red}, ${green}, ${blue})`;

            // Рисуем прямоугольник. Начинаем снизу Canvas
            ctx.fillRect(x, HEIGHT - barScaledHeight, barWidth, barScaledHeight);

            // Перемещаемся вправо для следующего столбика
            x += barWidth + 1;
        }
    }
});