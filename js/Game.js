class Game {
    constructor(canvas, options = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
        
        // Игровые объекты
        this.player = null;
        this.platforms = [];
        this.collectibles = [];
        this.enemies = [];
        this.input = null;
        this.tileSystem = null;
        
        // Игровое состояние
        this.isRunning = false;
        this.isPaused = false;
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.gameTime = 0;
        this.gameOver = false;
        this.waitingForRespawn = false;
        this.justDied = false;
        
        // Конфигурация уровней
        this.levelConfigs = this.createLevelConfigs();                  // настройки всех уровней
        this.currentLevelConfig = this.levelConfigs[this.level];        // текущий уровень
        
        // Игровой цикл
        this.lastTime = 0;                                              // время предыдущего кадра
        
        // инициализация игры   
        this.init();
    }

    // конфигурация уровней
    createLevelConfigs() {
        return {
            1: { // Уровень 1 - обучающий
                name: "Начальный уровень",
                enemyCount: 2,
                enemySpeed: 1.2,
                collectibleCount: 5,
                background: '#2c1810'
            },
            2: { // Уровень 2 - нормальный
                name: "Средний уровень", 
                enemyCount: 3,
                enemySpeed: 1.5,
                collectibleCount: 8,
                background: '#1a0f0a'
            },
            3: { // Уровень 3 - сложный
                name: "Сложный уровень",
                enemyCount: 4,
                enemySpeed: 1.8,
                collectibleCount: 10,
                background: '#0f0a1a'
            }
        };
    }

    // инициализация игры
    async init() {
        // 1. создаем обработчик ввода
        this.input = new InputHandler();
        
        // 2. загружаем систему текстур
        this.tileSystem = new TileSystem();
        await this.tileSystem.loadAll();  // Ждем загрузки текстур
        
        // 3. создаем игрока
        this.player = new Player(100, 100);  // Начальная позиция (100, 100)
        
        // 4. загружаем первый уровень
        this.loadLevel(this.level);
        
        // 5. настраиваем обработчики событий
        this.setupEventListeners();
        
        // 6. запускаем игру
        this.start();
    }

    // загрузка уровней
    loadLevel(levelNumber) {
        // 1. устанавливаем текущий уровень
        this.level = levelNumber;
        this.currentLevelConfig = this.levelConfigs[this.level] || this.levelConfigs[1];
        
        console.log(`=== Загрузка уровня ${this.level}: ${this.currentLevelConfig.name} ===`);
        console.log(`Врагов: ${this.currentLevelConfig.enemyCount}, Скорость: ${this.currentLevelConfig.enemySpeed}`);
        
        // 2. Полностью очищаем предыдущий уровень
        this.platforms = [];
        this.collectibles = [];
        this.enemies = [];
        
        // 3. Создаем новый уровень
        this.createPlatformsForLevel();
        this.createCollectibles();
        this.createEnemies();
        
        // 4. Сбрасываем позицию игрока
        if (this.player) {
            this.player.resetPosition();
        }
        
        // 5. Сбрасываем игровое состояние
        this.justDied = false;
        this.waitingForRespawn = false;
        this.gameOver = false;
        
        // 6. обновляем интерфейс
        this.updateUI();
    }

    // создание платформ уровня
    createPlatformsForLevel() {
        this.platforms = [];
        
        // 1. Базовые платформы (общие для всех уровней) - пол
        this.platforms.push(new Platform(0, 550, 800, 32, {
            type: 'ground'
        }));
        
        // 2. Уровень 1
        if (this.level === 1) {
            this.platforms.push(new Platform(100, 400, 150, 32));   // низкая
            this.platforms.push(new Platform(300, 320, 150, 32));   // чуть выше
            this.platforms.push(new Platform(500, 240, 150, 32));   // еще выше
            this.platforms.push(new Platform(200, 150, 150, 32));   // самая высокая
            this.platforms.push(new Platform(50, 300, 80, 32));     // маленькая слева
            this.platforms.push(new Platform(670, 200, 80, 32));    // маленькая справа
            this.platforms.push(new Platform(400, 450, 80, 32));    // посередине снизу
        }

        // 3. Уровень 2
        else if (this.level === 2) {
            // платформы с шипами и цепями
            this.platforms.push(new Platform(100, 400, 180, 32, {
                type: 'hanging',
                isHanging: true,        // висячая платформа
                chainLength: 80         // длина цепи
            }));
            
            // Центральные платформы для продвижения вверх
            this.platforms.push(new Platform(350, 350, 120, 32)); 
            this.platforms.push(new Platform(550, 280, 150, 32, { 
                type: 'dangerous',
                hasThorns: true,        
                thornsOnTop: true,      
                damage: 1
            }));
            
            // Платформы для подъема в правую часть
            this.platforms.push(new Platform(200, 200, 100, 32));
            this.platforms.push(new Platform(450, 150, 120, 32));
            
            // 4. Правый нижний угол
            this.platforms.push(new Platform(650, 400, 100, 32));
            
            // 5. Левая средняя платформа
            this.platforms.push(new Platform(50, 280, 80, 32)); 
            
            // 6. Правый верхний угол - опасная платформа с шипами снизу
            this.platforms.push(new Platform(600, 100, 120, 32, {
                type: 'dangerous',
                hasThorns: true,
                thornsOnTop: false, // Шипы снизу
                damage: 1
            }));
            
            // 7. Дополнительная платформа для сложного маршрута
            this.platforms.push(new Platform(300, 450, 100, 32));
        }
        // 4. Уровень 3
        else if (this.level === 3) {
            this.platforms.push(new Platform(100, 450, 120, 32));
            this.platforms.push(new Platform(300, 400, 100, 32, {
                type: 'dangerous',
                hasThorns: true,
                thornsOnTop: true,
                damage: 1
            }));
            this.platforms.push(new Platform(500, 380, 150, 32, {
                type: 'hanging',
                isHanging: true,
                chainLength: 120
            }));
            this.platforms.push(new Platform(150, 300, 180, 32));
            this.platforms.push(new Platform(400, 250, 120, 32, {
                type: 'dangerous',
                hasThorns: true,
                thornsOnTop: false,
                damage: 1
            }));
            this.platforms.push(new Platform(600, 200, 100, 32));
            this.platforms.push(new Platform(250, 150, 150, 32));
            this.platforms.push(new Platform(500, 100, 120, 32));
            this.platforms.push(new Platform(50, 350, 60, 32));
            this.platforms.push(new Platform(700, 300, 60, 32));
            this.platforms.push(new Platform(350, 180, 60, 32));
        }
    }

    // создание огоньков
    createCollectibles() {
        this.collectibles = [];
        const config = this.currentLevelConfig;
        
        // Размещаем огоньки на платформах (исключая опасные)
        const safePlatforms = this.platforms.filter(p => 
            !p.hasThorns && p.type !== 'ground'
        );
        
        if (safePlatforms.length === 0) {
            console.warn('Нет безопасных платформ для огоньков!');
            return;
        }
        
        // Распределяем огоньки по платформам
        for (let i = 0; i < config.collectibleCount; i++) {
            const platformIndex = i % safePlatforms.length;
            const platform = safePlatforms[platformIndex];
            
            // Равномерное распределение по платформе
            const sectionCount = Math.ceil(config.collectibleCount / safePlatforms.length);
            const sectionWidth = platform.width / (sectionCount + 1);
            const section = Math.floor(i / safePlatforms.length);
            
            const x = platform.x + (section + 1) * sectionWidth - 16;
            const y = platform.y - 40;
            
            this.collectibles.push(new Collectible(x, y));
        }
        
    }

    // создание врагов
    createEnemies() {
        this.enemies = [];
        const config = this.currentLevelConfig;
        
        // Находим подходящие платформы для врагов
        const suitablePlatforms = this.platforms.filter(platform => {
            if (platform.y >= 550) return false;
            if (platform.width < 100) return false;
            if (platform.hasThorns) return false;
            if (platform.isHanging && platform.chainLength > 150) return false;
            
            return true;
        });
        
        if (suitablePlatforms.length === 0) {
            console.warn('Нет подходящих платформ для врагов!');
            return;
        }
        
        // Распределяем врагов по платформам
        for (let i = 0; i < config.enemyCount; i++) {
            const platformIndex = i % suitablePlatforms.length;
            const platform = suitablePlatforms[platformIndex];
            
            const enemiesOnThisPlatform = Math.ceil(config.enemyCount / suitablePlatforms.length);
            const sectionWidth = platform.width / (enemiesOnThisPlatform + 1);
            const section = Math.floor(i / suitablePlatforms.length);
            
            const x = platform.x + (section + 1) * sectionWidth;
            const y = platform.y - 64;
            
            const enemy = new Enemy(x, y, 64, 64, {
                speed: config.enemySpeed,
                startX: x,
                moveRange: Math.min(sectionWidth * 0.6, 120)
            });
            
            this.enemies.push(enemy);
        }
    }

    setupEventListeners() {
        document.getElementById('startBtn').addEventListener('click', () => {
            this.start();
        });

        document.getElementById('pauseBtn').addEventListener('click', () => {
            this.togglePause();
        });

        document.getElementById('restartBtn').addEventListener('click', () => {
            this.restart();
        });

        // Кнопки для переключения уровней
        document.getElementById('level1Btn')?.addEventListener('click', () => {
            this.loadLevel(1);
        });

        document.getElementById('level2Btn')?.addEventListener('click', () => {
            this.loadLevel(2);
        });

        document.getElementById('level3Btn')?.addEventListener('click', () => {
            this.loadLevel(3);
        });

        window.addEventListener('keydown', (event) => {
            if (event.key === 'p' || event.key === 'P') {
                this.togglePause();
            }
            
            if (event.key === 'h' || event.key === 'H') {
                window.debugMode = !window.debugMode;
                this.player.showHitbox = window.debugMode;
                this.enemies.forEach(enemy => enemy.showHitbox = window.debugMode);
                console.log('Debug mode:', window.debugMode);
            }
            
            if (event.key === '1') this.loadLevel(1);
            if (event.key === '2') this.loadLevel(2);
            if (event.key === '3') this.loadLevel(3);
        });
    }

    // начало игры
    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.isPaused = false;
            this.gameLoop();
        }
    }

    // пауза
    togglePause() {
        this.isPaused = !this.isPaused;
        if (!this.isPaused && this.isRunning) {
            this.gameLoop();
        }
    }

    // перезапуск
    restart() {
        console.log('=== ПЕРЕЗАПУСК ИГРЫ ===');
        
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.gameTime = 0;
        this.gameOver = false;
        this.waitingForRespawn = false;
        this.justDied = false;
        
        this.currentLevelConfig = this.levelConfigs[this.level];
        this.loadLevel(this.level);
        
        if (this.input && this.input.clearKeys) {
            this.input.clearKeys();
        }
        
        if (!this.isRunning) {
            this.start();
        }
    }

    // игровой цикл
    gameLoop(currentTime = 0) {
        if (!this.isPaused && this.isRunning) {
            this.update();
            this.render();
            requestAnimationFrame((time) => this.gameLoop(time));
        }
    }

    // все обновления состояния
    update() {
        if (this.gameOver || this.waitingForRespawn) return;
        
        if (this.player.invincible) {
            this.player.invincibleTime--;
            if (this.player.invincibleTime <= 0) {
                this.player.invincible = false;
            }
        }
        
        this.player.update(this.input, this.platforms);
        
        this.updateEnemies();
        
        this.checkEnemyCollisions();
        
        if (!this.player.invincible && !this.player.isDying && !this.justDied) {
            this.checkThornsDamage();
        }
        
        this.updateCollectibles();
        
        if (this.player.y > 600 && !this.player.isDying && !this.justDied) {
            this.handlePlayerDeathFromFall();
        }
        
        this.updateUI();
    }

    updateEnemies() {
        this.enemies.forEach(enemy => {
            if (enemy.isAlive) {
                enemy.update(this.platforms);
            }
        });
        
        this.enemies = this.enemies.filter(enemy => enemy.isAlive);
    }

    checkEnemyCollisions() {
        let enemyJumpedOn = null;  // Враг, на которого прыгнули
        
        // 1. проверка прыжков сверху
        for (const enemy of this.enemies) {
            if (enemy.checkPlayerJumpCollision(this.player)) {
                enemyJumpedOn = enemy;  // Запоминаем врага
                break;  // Достаточно одного
            }
        }
        
        // 2. если прыгнули на враща
        if (enemyJumpedOn) {
            
            if (enemyJumpedOn.takeDamage()) {
                // 2.1. начисляем очки
                const points = 200 + (this.level * 50);  // 250, 300, 350 очков
                this.addScore(points);
                
                // 2.2. отскок игрока вверх
                this.player.velocityY = -8;
                this.player.isOnGround = false;
                this.player.isJumping = true;
                
                // 2.3. короткая неуязвимость
                this.player.invincible = true;
                this.player.invincibleTime = 3;
                
                // 2.4. обновляем интерфейс
                this.updateUI();
            }
            return;  // Выходим - прыжок обработан
        }
        
        // 3. проверка ударов сбоку
        for (const enemy of this.enemies) {
            if (enemy.checkPlayerSideCollision(this.player) && 
                !this.player.invincible && 
                !this.player.isDying) {
                
                if (this.player.takeDamage()) {
                    // 3.1. штраф
                    const penalty = 50 + (this.level * 20);  // 70, 90, 110 очков
                    this.score = Math.max(0, this.score - penalty);
                    
                    // 3.2. теряем жизнь
                    this.lives--;
                    
                    // 3.3. обновляем интерфейс
                    this.updateUI();
                    
                    // 3.4. нет жизней = смерть
                    if (this.lives <= 0) {
                        this.justDied = true;
                        this.player.die();
                        
                        // Через 1.4 секунды - игра окончена
                        setTimeout(() => {
                            this.gameOver = true;
                            this.justDied = false;
                        }, 1400);
                    }
                }
                break;  // Достаточно одного столкновения
            }
        }
    }

    checkThornsDamage() {
        if (this.player.isDying) return;  // Если уже умирает - выходим
        
        // Проверяем все платформы с шипами
        for (const platform of this.platforms) {
            if (platform.hasThorns && platform.checkThornsCollision(this.player)) {
                
                if (this.player.takeDamage()) {
                    // Штраф и потеря жизни (аналогично удару врага)
                    const penalty = 50 + (this.level * 10);
                    this.score = Math.max(0, this.score - penalty);
                    this.lives--;
                    
                    // Обновляем интерфейс
                    this.updateUI();
                    
                    // Если жизни кончились
                    if (this.lives <= 0) {
                        this.justDied = true;
                        this.player.die();
                        
                        setTimeout(() => {
                            this.gameOver = true;
                            this.justDied = false;
                        }, 1400);
                    }
                }
                break;  // Достаточно одного столкновения
            }
        }
    }

    handlePlayerDeathFromFall() {
        this.justDied = true;  // Флаг "только что умер"
        
        // Запускаем анимацию смерти
        this.player.die();
        
        // Через 1.4 секунды обрабатываем смерть
        setTimeout(() => {
            // Теряем жизнь
            this.lives--;
            
            // Если жизни кончились - игра окончена
            if (this.lives <= 0) {
                this.gameOver = true;
                this.justDied = false;
            } else {
                // Если еще есть жизни - респавн через 0.3 секунды
                setTimeout(() => {
                    this.player.resetPosition();      // На стартовую позицию
                    this.player.invincible = true;    // Временная неуязвимость
                    this.player.invincibleTime = 90;  // 90 кадров (~1.5 сек)
                    this.justDied = false;            // Сброс флага
                }, 300);
            }
            
            // Обновляем интерфейс
            this.updateUI();
        }, 1400);
    }

    updateCollectibles() {
        let collectedCount = 0;  // Счетчик собранных огоньков
        
        // Обходим все огоньки
        this.collectibles.forEach(collectible => {
            if (!collectible.collected) {
                // 1. обновляем анимацию
                collectible.update();
                
                // 2. проверяем столкновение с игроком
                if (collectible.checkCollision(this.player)) {
                    // 3. собираем огонек
                    const points = collectible.collect();  // +100 очков
                    this.addScore(points);
                    collectedCount++;
                    this.updateUI();
                }
            } 
            else {
                // Огонек уже собран
                collectedCount++;
            }
        });
        
        // 4. если все огоньки собраны - след уровень
        if (collectedCount > 0 && collectedCount === this.collectibles.length) {
            this.nextLevel();
        }
    }

    nextLevel() {
        const nextLevel = this.level + 1;
        
        // 1. проверяем есть ли след уровент
        if (!this.levelConfigs[nextLevel]) {
            this.showVictoryScreen();  // Экран победы
            return;
        }
        
        // 2. Сохраняем текущие жизни и очки
        const currentLives = this.lives;
        const currentScore = this.score;
        
        // 3. Сбрасываем флаги
        this.justDied = false;
        this.waitingForRespawn = false;
        this.gameOver = false;
        
        // 4. Загружаем новый уровень
        this.loadLevel(nextLevel);
        
        // 5. Восстанавливаем жизни и очки
        this.lives = currentLives;
        this.score = currentScore;
        
        // 6. Бонус за прохождение уровня
        const bonus = 500 * this.level;  // 500, 1000, 1500 очков
        this.addScore(bonus);
        
        // 7. Обновляем интерфейс
        this.updateUI();
    }

    showVictoryScreen() {
        const restart = confirm(
            `ПОБЕДА! 🎉\n\n` +
            `Вы прошли все уровни!\n` +
            `Итоговый счет: ${this.score}\n` +
            `Оставшиеся жизни: ${this.lives}\n\n` +
            `Начать заново?`
        );
        
        if (restart) {
            this.restart();
        }
    }

    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('lives').textContent = this.lives;
        document.getElementById('level').textContent = this.level;
        
        const levelNameElement = document.getElementById('levelName');
        if (levelNameElement) {
            levelNameElement.textContent = this.currentLevelConfig.name;
        }
    }

    render() {
        // 1. очистка
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        // 2. Фон
        if (this.tileSystem) {
            this.tileSystem.drawBackground(this.ctx, this.width, this.height);
            this.tileSystem.drawTorches(this.ctx, 50, 100, 3, 200);  // Декоративные факелы
        } else {
            this.drawFallbackBackground();  // Цветной градиент
        }
        
        // 3. платформы
        this.platforms.forEach(platform => {
            platform.draw(this.ctx, this.tileSystem);
        });
        
        // 4. враги
        this.enemies.forEach(enemy => enemy.draw(this.ctx));
        
        // 5. огоньки
        this.collectibles.forEach(collectible => collectible.draw(this.ctx));
        
        // 6. игрок
        this.player.draw(this.ctx);
        
        // 7. Эффект урона (красное мерцание)
        if (this.player.invincible && this.player.invincibleTime > 0 && !this.player.isDying) {
            this.drawDamageEffect();
        }
        
        // 8. Интерфейс
        this.drawUI();
        
        // 9. Экран паузы
        if (this.isPaused) {
            this.drawPauseScreen();
        }
        
        // 10. Экран GAME OVER
        if (this.gameOver && !this.player.isDying) {
            this.drawGameOverScreen();
        }
    }

    drawDamageEffect() {
        this.ctx.save();
        
        if (Math.floor(this.player.invincibleTime / 5) % 2 === 0) {
            this.ctx.fillStyle = 'rgba(255, 0, 0, 0.15)';
            this.ctx.fillRect(0, 0, this.width, this.height);
        }
        
        this.ctx.restore();
    }

    drawFallbackBackground() {
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
        gradient.addColorStop(0, this.currentLevelConfig.background || '#2c1810');
        gradient.addColorStop(1, '#1a0f0a');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);
    }

    drawUI() {
        this.ctx.save();  // Сохраняем состояние контекста
        
        // 1. Фон для статистики
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(10, 10, 220, 118);
        
        // 2. Текст статистики
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 18px Arial';
        this.ctx.textAlign = 'left';
        
        this.ctx.fillText(`Очки: ${this.score}`, 20, 40);
        this.ctx.fillText(`Жизни: ${this.lives}`, 20, 70);
        this.ctx.fillText(`Уровень: ${this.level}`, 20, 100);
        
        // 3. Название уровня
        this.ctx.font = '14px Arial';
        this.ctx.fillText(this.currentLevelConfig.name, 20, 120);
        
        // 4. Подсказки внизу
        this.ctx.font = '12px Arial';
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        this.ctx.fillText('P - Пауза, H - Отладка, 1-3 - Уровни', 10, this.height - 10);
        
        // 5. Счетчик огоньков
        const collected = this.collectibles.filter(c => c.collected).length;
        const total = this.collectibles.length;
        if (total > 0) {
            this.ctx.fillText(`Огоньки: ${collected}/${total}`, this.width - 100, 30);
        }
        
        this.ctx.restore();  // Восстанавливаем состояние
    }

    drawPauseScreen() {
        this.ctx.save();
        
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('ПАУЗА', this.width / 2, this.height / 2);
        
        this.ctx.font = '24px Arial';
        this.ctx.fillText('Нажмите P чтобы продолжить', this.width / 2, this.height / 2 + 50);
        
        this.ctx.font = '18px Arial';
        this.ctx.fillText(`Уровень: ${this.level} - ${this.currentLevelConfig.name}`, this.width / 2, this.height / 2 + 100);
        
        this.ctx.restore();
    }

    drawGameOverScreen() {
        this.ctx.save();
        
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        this.ctx.fillStyle = '#ff0000';
        this.ctx.font = 'bold 64px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('GAME OVER', this.width / 2, this.height / 2 - 50);
        
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '24px Arial';
        this.ctx.fillText(`Счет: ${this.score}`, this.width / 2, this.height / 2);
        this.ctx.fillText(`Уровень: ${this.level}`, this.width / 2, this.height / 2 + 40);
        
        this.ctx.font = '20px Arial';
        this.ctx.fillStyle = '#ffff00';
        this.ctx.fillText('Нажмите RESTART для новой игры', this.width / 2, this.height / 2 + 100);
        
        this.ctx.restore();
    }
    
    addScore(points) {
        const newScore = this.score + points;
        
        if (newScore > 999999) {
            this.score = 999999;
        } else {
            this.score = newScore;
        }
        
        this.updateUI();
    }
}