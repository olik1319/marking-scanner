document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('audioFile');
    const audioContainer = document.getElementById('audio-container');
    const container = document.getElementById('visualizer-container');

    // --- Глобальные переменные THREE.js ---
    let scene, camera, renderer;
    let cubes = []; // Массив для хранения всех 3D-столбиков
    const NUM_CUBES = 64; // Количество столбиков для визуализации
    const BAR_SPACING = 0.5; // Расстояние между столбиками

    // Размеры контейнера
    const WIDTH = container.clientWidth;
    const HEIGHT = container.clientHeight;
    
    // --- Глобальные переменные AUDIO ---
    let audioContext = null;
    let analyser;
    let animationFrameId = null; 
    let bufferLength;
    let dataArray;

    // Вызываем инициализацию 3D-сцены сразу
    initScene();

    // ------------------------------------------------------------------
    // A) ИНИЦИАЛИЗАЦИЯ 3D-СЦЕНЫ
    // ------------------------------------------------------------------
    function initScene() {
        // Сцена
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x0f0f23); // Темный фон

        // Камера (Угол обзора, Соотношение сторон, Ближнее/Дальнее расстояние)
        camera = new THREE.PerspectiveCamera(75, WIDTH / HEIGHT, 0.1, 1000);
        
        // Камеру ставим по центру и немного приподнимаем
        camera.position.set(0, 0, 15); 
        camera.lookAt(0, 0, 0); // Смотрим в центр сцены

        // Рендерер
        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(WIDTH, HEIGHT);
        container.appendChild(renderer.domElement); // Добавляем рендер в контейнер

        // Добавляем свет
        const ambientLight = new THREE.AmbientLight(0x404040, 2); // Мягкий рассеянный свет
        scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1); // Направленный свет
        directionalLight.position.set(10, 10, 10);
        scene.add(directionalLight);
        
        // Создание 3D-столбиков
        createVisualizerCubes();

        // Первая отрисовка (чтобы сцена была видна до запуска аудио)
        renderer.render(scene, camera); 
    }

    // Создание массива 3D-объектов
    function createVisualizerCubes() {
        // Общая ширина, которую займут все кубы
        const totalWidth = NUM_CUBES * BAR_SPACING;
        // Начальная позиция X для центрирования
        let x = -totalWidth / 2;

        for (let i = 0; i < NUM_CUBES; i++) {
            // Геометрия: Куб (ширина, высота, глубина)
            const geometry = new THREE.BoxGeometry(BAR_SPACING * 0.8, 0.1, 0.1); 
            
            // Материал (задаем цвет на основе индекса, чтобы было красиво)
            const hue = i / NUM_CUBES; // От 0 до 1
            const color = new THREE.Color().setHSL(hue, 1, 0.5); // Красивый градиент
            const material = new THREE.MeshPhongMaterial({ 
                color: color,
                emissive: color, // Свечение того же цвета
                emissiveIntensity: 0.5
            }); 

            const cube = new THREE.Mesh(geometry, material);
            
            // Размещение по сцене
            cube.position.set(x, 0, 0); 

            scene.add(cube);
            cubes.push(cube);

            x += BAR_SPACING; // Сдвиг к следующему столбику
        }
    }

    // ------------------------------------------------------------------
    // B) ОБРАБОТКА АУДИО И СЛУШАТЕЛИ
    // ------------------------------------------------------------------

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            // Очистка предыдущего состояния
            audioContainer.innerHTML = ''; 
            if (animationFrameId !== null) {
                cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
            }

            // Создаем новый аудио-элемент
            const audioSource = new Audio();
            audioSource.controls = true;
            audioSource.loop = false;
            audioSource.src = URL.createObjectURL(file);
            
            // Добавляем элемент в DOM
            audioContainer.appendChild(audioSource);

            // --- Инициализация Web Audio API при первом Play ---
            audioSource.addEventListener('play', () => {
                if (!audioContext) {
                    audioContext = new (window.AudioContext || window.webkitAudioContext)();
                    const source = audioContext.createMediaElementSource(audioSource);
                    
                    analyser = audioContext.createAnalyser();
                    analyser.fftSize = 128; // Используем меньше FFT, так как у нас только 64 столбика
                    bufferLength = analyser.frequencyBinCount; // 64
                    dataArray = new Uint8Array(bufferLength);
                    
                    // Соединяем узлы
                    source.connect(analyser);
                    analyser.connect(audioContext.destination);

                    // Запускаем цикл визуализации
                    draw(); 
                } 
                
                // Возобновление AudioContext и цикла рисования
                if (audioContext && audioContext.state === 'suspended') {
                    audioContext.resume();
                }
                if (analyser && animationFrameId === null) {
                    draw();
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

    // ------------------------------------------------------------------
    // C) НОВЫЙ ЦИКЛ РИСОВАНИЯ (СВЯЗЬ АУДИО И THREE.JS)
    // ------------------------------------------------------------------

    function draw() {
        animationFrameId = requestAnimationFrame(draw);

        if (analyser) {
            // Получаем данные о частотах
            analyser.getByteFrequencyData(dataArray); 

            // Обновляем 3D-объекты
            for (let i = 0; i < bufferLength; i++) {
                const barHeight = dataArray[i] / 255 * 10; // Масштабируем амплитуду (0-255) до высоты (0-10)
                const cube = cubes[i];

                if (cube) {
                    // 1. Изменяем высоту объекта
                    cube.scale.y = barHeight > 0.1 ? barHeight : 0.1; // Минимальная высота, чтобы объект не исчез

                    // 2. Смещаем объект, чтобы он рос из центра (или снизу, если 0 на уровне Y=0)
                    // (barHeight / 2) для центрирования роста
                    cube.position.y = barHeight / 2; 

                    // 3. Дополнительный эффект: Вращение в зависимости от частоты
                    cube.rotation.x += 0.01 + (dataArray[i] / 255) * 0.05;
                }
            }
        }
        
        // Анимация камеры (для динамичности)
        // Камера медленно вращается вокруг центра сцены
        camera.position.x = Math.sin(Date.now() * 0.0001) * 15;
        camera.position.z = Math.cos(Date.now() * 0.0001) * 15;
        camera.lookAt(0, 0, 0);

        // РЕНДЕР СЦЕНЫ
        renderer.render(scene, camera);
    }
    
    // Обработчик изменения размера окна (для адаптивности)
    window.addEventListener('resize', () => {
        const newWidth = container.clientWidth;
        const newHeight = container.clientHeight;
        
        if (camera) {
            camera.aspect = newWidth / newHeight;
            camera.updateProjectionMatrix();
        }
        
        if (renderer) {
            renderer.setSize(newWidth, newHeight);
        }
    });
    
}); // Конец DOMContentLoaded
