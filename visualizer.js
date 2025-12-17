document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('audioFile');
    const canvas = document.getElementById('visualizer');
    const audioContainer = document.getElementById('audio-container');
    const ctx = canvas.getContext('2d');

    // Настройки Canvas (остаются прежними)
    const WIDTH = canvas.width = canvas.clientWidth;
    const HEIGHT = canvas.height = canvas.clientHeight;
    
    let audioContext = null; // Будет инициализирован только при первом воспроизведении
    let analyser;
    let animationFrameId; // Для остановки цикла draw при смене песни

    // --- Шаг 1: Обработка выбора файла ---
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            // Очищаем предыдущий аудиоэлемент и его URL
            audioContainer.innerHTML = ''; 
            
            // Если есть активный цикл визуализации, останавливаем его
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
                // Очищаем Canvas
                ctx.fillRect(0, 0, WIDTH, HEIGHT); 
            }

            // Создаем новый аудио-элемент
            const audioSource = new Audio();
            audioSource.controls = true;
            audioSource.loop = false;
            
            // Создаем временный URL для выбранного файла и присваиваем его элементу
            audioSource.src = URL.createObjectURL(file);
            
            // Добавляем элемент в DOM
            audioContainer.appendChild(audioSource);

            // --- Шаг 2: Инициализация Web Audio API при первом Play ---
            // Слушаем событие 'play' только один раз
            audioSource.addEventListener('play', () => {
                if (!audioContext) {
                    // Инициализация AudioContext и AnalyserNode
                    audioContext = new (window.AudioContext || window.webkitAudioContext)();
                    const source = audioContext.createMediaElementSource(audioSource);
                    
                    analyser = audioContext.createAnalyser();
                    analyser.fftSize = 256; 
                    const bufferLength = analyser.frequencyBinCount;
                    const dataArray = new Uint8Array(bufferLength);
                    
                    // Соединяем узлы: Источник -> Анализатор -> Выход
                    source.connect(analyser);
                    analyser.connect(audioContext.destination);

                    // Запускаем цикл визуализации
                    draw(analyser, dataArray, bufferLength, WIDTH, HEIGHT, ctx);
                }
            }, { once: true }); // Инициализируем AudioContext только один раз
            
            // При последующих паузах/воспроизведениях просто возобновляем AudioContext, если он был приостановлен
            audioSource.addEventListener('play', () => {
                 if (audioContext && audioContext.state === 'suspended') {
                    audioContext.resume();
                }
                 // Запускаем цикл draw снова, если он был остановлен
                 draw(analyser, new Uint8Array(analyser.frequencyBinCount), analyser.frequencyBinCount, WIDTH, HEIGHT, ctx);
            });
            
            audioSource.addEventListener('pause', () => {
                if (animationFrameId) {
                    cancelAnimationFrame(animationFrameId); // Останавливаем рисование при паузе
                }
            });
        }
    });

    /**
     * Основной цикл рисования визуализации (НЕМНОГО МОДИФИЦИРОВАН)
     */
    function draw(analyser, dataArray, bufferLength, WIDTH, HEIGHT, ctx) {
        
        // Запоминаем ID кадра для последующей остановки
        animationFrameId = requestAnimationFrame(() => draw(analyser, dataArray, bufferLength, WIDTH, HEIGHT, ctx));

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

            // Цвета
            const red = barHeight + (25 * (i/bufferLength));
            const green = 250 * (i/bufferLength);
            const blue = 50;
            
            ctx.fillStyle = `rgb(${red}, ${green}, ${blue})`;

            ctx.fillRect(x, HEIGHT - barScaledHeight, barWidth, barScaledHeight);

            x += barWidth + 1;
        }
    }
});
