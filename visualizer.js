document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('audioFile');
    const audioContainer = document.getElementById('audio-container');
    const container = document.getElementById('visualizer-container');
    const startButton = document.getElementById('startRecording');
    const stopButton = document.getElementById('stopRecording');

    // --- Глобальные переменные THREE.js ---
    let scene, camera, renderer;
    let cubes = []; 
    const NUM_CUBES = 64; 
    const BAR_SPACING = 0.5; 

    // Размеры контейнера
    const WIDTH = container.clientWidth;
    const HEIGHT = container.clientHeight;
    
    // --- Глобальные переменные AUDIO ---
    let audioContext = null;
    let analyser;
    let animationFrameId = null; 
    let bufferLength;
    let dataArray;
    let audioSourceElement = null; // Текущий <audio> элемент

    // --- Глобальные переменные RECORDING ---
    let mediaRecorder;
    let recordedChunks = [];


    // ------------------------------------------------------------------
    // A) ИНИЦИАЛИЗАЦИЯ 3D-СЦЕНЫ
    // ------------------------------------------------------------------
    function initScene() {
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x0f0f23); 

        camera = new THREE.PerspectiveCamera(75, WIDTH / HEIGHT, 0.1, 1000);
        camera.position.set(0, 0, 15); 
        camera.lookAt(0, 0, 0); 

        renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            preserveDrawingBuffer: true // ВАЖНО для MediaRecorder
        });
        renderer.setSize(WIDTH, HEIGHT);
        container.appendChild(renderer.domElement); 

        // Добавляем свет
        const ambientLight = new THREE.AmbientLight(0x404040, 2); 
        scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1); 
        directionalLight.position.set(10, 10, 10);
        scene.add(directionalLight);
        
        createVisualizerCubes();

        renderer.render(scene, camera); 
    }

    function createVisualizerCubes() {
        const totalWidth = NUM_CUBES * BAR_SPACING;
        let x = -totalWidth / 2;
        cubes = []; // Очистка массива

        for (let i = 0; i < NUM_CUBES; i++) {
            const geometry = new THREE.BoxGeometry(BAR_SPACING * 0.8, 0.1, 0.1); 
            const hue = i / NUM_CUBES; 
            const color = new THREE.Color().setHSL(hue, 1, 0.5); 
            const material = new THREE.MeshPhongMaterial({ 
                color: color,
                emissive: color, 
                emissiveIntensity: 0.5
            }); 

            const cube = new THREE.Mesh(geometry, material);
            cube.position.set(x, 0, 0); 

            scene.add(cube);
            cubes.push(cube);

            x += BAR_SPACING; 
        }
    }
    
    // ------------------------------------------------------------------
    // B) ОБРАБОТКА АУДИО И СЛУШАТЕЛИ
    // ------------------------------------------------------------------
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            audioContainer.innerHTML = ''; 
            if (animationFrameId !== null) {
                cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
            }

            const audioSource = new Audio();
            audioSource.controls = true;
            audioSource.loop = false;
            audioSource.src = URL.createObjectURL(file);
            audioSourceElement = audioSource; // Сохраняем ссылку
            
            audioContainer.appendChild(audioSource);
            startButton.disabled = false; // Активация кнопки записи

            // --- Инициализация Web Audio API при первом Play ---
            audioSource.addEventListener('play', () => {
                if (!audioContext) {
                    audioContext = new (window.AudioContext || window.webkitAudioContext)();
                    const source = audioContext.createMediaElementSource(audioSource);
                    
                    analyser = audioContext.createAnalyser();
                    analyser.fftSize = 128; 
                    bufferLength = analyser.frequencyBinCount; 
                    dataArray = new Uint8Array(bufferLength);
                    
                    source.connect(analyser);
                    analyser.connect(audioContext.destination);

                    draw(); 
                } 
                
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
                    animationFrameId = null; 
                }
            });
        }
    });

    // ------------------------------------------------------------------
    // C) ЦИКЛ РИСОВАНИЯ (СВЯЗЬ АУДИО И THREE.JS)
    // ------------------------------------------------------------------

    function draw() {
        animationFrameId = requestAnimationFrame(draw);

        if (analyser) {
            analyser.getByteFrequencyData(dataArray); 

            for (let i = 0; i < bufferLength; i++) {
                const barHeight = dataArray[i] / 255 * 10; 
                const cube = cubes[i];

                if (cube) {
                    cube.scale.y = barHeight > 0.1 ? barHeight : 0.1; 
                    cube.position.y = barHeight / 2; 

                    // Вращение в зависимости от частоты
                    cube.rotation.x += 0.01 + (dataArray[i] / 255) * 0.05;
                }
            }
        }
        
        // Анимация камеры
        camera.position.x = Math.sin(Date.now() * 0.0001) * 15;
        camera.position.z = Math.cos(Date.now() * 0.0001) * 15;
        camera.lookAt(0, 0, 0);

        renderer.render(scene, camera);
    }
    
    // ------------------------------------------------------------------
    // D) ЛОГИКА ЗАПИСИ ВИДЕО (MediaRecorder API)
    // ------------------------------------------------------------------

    startButton.addEventListener('click', () => {
        if (!audioSourceElement || audioSourceElement.paused) {
            alert('Сначала загрузите файл и нажмите Play!');
            return;
        }

        // Получаем поток из Canvas Three.js (renderer.domElement)
        const stream = renderer.domElement.captureStream(30); // 30 кадров/с
        
        recordedChunks = [];
        
        // Создаем MediaRecorder
        mediaRecorder = new MediaRecorder(stream, {
            mimeType: 'video/webm; codecs=vp9'
        });

        mediaRecorder.ondataavailable = function(e) {
            if (e.data.size > 0) {
                recordedChunks.push(e.data);
            }
        };

        mediaRecorder.onstop = function() {
            const blob = new Blob(recordedChunks, {
                type: 'video/webm'
            });

            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = 'visualizer_video_only.webm'; // Имя файла для скачивания
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            
            // Восстановление состояния кнопок
            startButton.disabled = false;
            stopButton.disabled = true;
        };

        mediaRecorder.start();
        
        // Запускаем музыку и меняем состояние кнопок
        audioSourceElement.play(); 
        startButton.disabled = true;
        stopButton.disabled = false;
    });

    stopButton.addEventListener('click', () => {
        if (mediaRecorder && mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
            audioSourceElement.pause(); 
        }
    });

    // ------------------------------------------------------------------
    // E) ОБРАБОТЧИК ИЗМЕНЕНИЯ РАЗМЕРА ОКНА
    // ------------------------------------------------------------------
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

    // Инициализация сцены при загрузке страницы
    initScene();
});
