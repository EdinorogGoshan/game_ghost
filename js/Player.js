class Player {
    constructor(x, y, width = 64, height = 64) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        
        this.velocityX = 0;             // Скорость по горизонтали
        this.velocityY = 0;             // Скорость по вертикали
        this.speed = 5;                 // Базовая скорость героя
        this.jumpForce = 15;            // Силы прыжка
        this.gravity = 0.8;             // Гравитация
        
        this.isOnGround = false;        // Стоит ли на земле
        this.isJumping = false;         // В прыжке ли
        this.facing = 'right';          // Направление взгляда
        this.isAlive = true;            // Жив ли
        this.isDying = false;           // В процессе смерти

        this.deathAnimationTime = 0;
        this.invincible = false;        // Неуязвмость
        this.invincibleTime = 0;        // Длительность неуязвимости в кадрах
        
        this.deathX = 0;                // Место где произошла смерть
        this.deathY = 0;
        
        this.animationState = 'idle';   //Текущее состояние анимации
        this.animationFrame = 0;        //Текущий кадр анимации
        this.animationSpeed = 0.15;     // Скорость смены кадров
        this.animationTime = 0;         // Счетчик времени для анимации
        
        this.sprites = {
            idle: [],
            walkRight: [],
            walkLeft: [],
            death: []
        };
        
        this.spritesLoaded = false;     // флаг все ли спрайты загружены
        this.loadSprites();
        
        this.showHitbox = false;
    }

    // Загрузка спрайтов
    // async позволяет использовать await для асинхронной загрузки
    async loadSprites() {
        try {
            for (let i = 1; i <= 4; i++) {
                const sprite = await this.loadImage(`assets/images/stay/ghost_${i}.png`);
                this.sprites.idle.push(sprite);
            }
            
            for (let i = 1; i <= 3; i++) {
                const sprite = await this.loadImage(`assets/images/walk_right/ghost_right_${i}.png`);
                this.sprites.walkRight.push(sprite);
            }
            
            for (let i = 1; i <= 3; i++) {
                const sprite = await this.loadImage(`assets/images/walk_left/ghost_left_${i}.png`);
                this.sprites.walkLeft.push(sprite);
            }
            
            for (let i = 1; i <= 7; i++) {
                const sprite = await this.loadImage(`assets/images/deadly_dead/ghost_dead_${i}.png`);
                this.sprites.death.push(sprite);
            }
            
            this.spritesLoaded = true;
            console.log('Все спрайты игрока загружены!');
            
            // если ошибка - создаем запасные спрайты
        } catch (error) {
            console.error('Ошибка загрузки спрайтов:', error);
            this.createFallbackSprites();
        }
    }

    // Загрузка изображения
    loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
        });
    }

    // создание запасных спрайтов
    createFallbackSprites() {
        for (let i = 0; i < 4; i++) {
            this.sprites.idle.push(this.createColoredSprite('#00b4d8'));
        }
        for (let i = 0; i < 3; i++) {
            this.sprites.walkRight.push(this.createColoredSprite('#0096c7'));
            this.sprites.walkLeft.push(this.createColoredSprite('#0077b6'));
        }
        for (let i = 0; i < 7; i++) {
            this.sprites.death.push(this.createColoredSprite('#ff0000'));
        }
        this.spritesLoaded = true;
    }

    // Отрисовка запасных спрайтов
    createColoredSprite(color) {
        const canvas = document.createElement('canvas');
        canvas.width = 64;      // Размеры как у запасных
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        
        // Тело призрака - круг
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(32, 32, 24, 0, Math.PI * 2);
        ctx.fill();
        
        // белые глаза
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(20, 24, 6, 0, Math.PI * 2);
        ctx.arc(44, 24, 6, 0, Math.PI * 2);
        ctx.fill();
        
        // черные зрачки
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(20, 24, 3, 0, Math.PI * 2);
        ctx.arc(44, 24, 3, 0, Math.PI * 2);
        ctx.fill();

        // Преобразуем canvas в Image
        const img = new Image();
        img.src = canvas.toDataURL();
        return img;
    }

    // Обновление состояния игрока
    // input - объект с состоянием клавиш (из InputHandler.js)
    // platforms - массив платформ для проверки столкновений
    update(input, platforms) {

        // 1. если спрайты не загружены - выходим
        if (!this.spritesLoaded) return;
        
        // 2. обработка неуязвимости (если активна)
        if (this.invincible) {
            this.invincibleTime--;          // уменьшаем таймер
            if (this.invincibleTime <= 0) {
                this.invincible = false;    // выключаем неуязвимость
            }
        }
        
        // 3. если игрок в процессе смерти - обновляем только анимацию смерти
        if (this.isDying) {
            this.updateDeathAnimation();
            return;
        }
        
        // 4. если игрок мертв - выходим
        if (!this.isAlive) return;
        
        // 5. обновление основного состояния
        this.handleInput(input);            // обработка нажатий клавиш
        this.applyGravity();                // применение гравитации
        
        // 6. перемещение игрока
        this.x += this.velocityX;           //двигаем по горизонтали
        this.y += this.velocityY;           //двигаем по вертикали
        
        // 7. обновление и проверки
        this.updateAnimation();             // смена кадров анимации
        this.checkCollisions(platforms);    // проверка столкновений с платформами
        this.checkBoundaries();             // проверка границ экрана
    }

    // обработка движений
    handleInput(input) {
        // если умирает, мертв или неуязвм - блокируем управление
        if (this.isDying || !this.isAlive) {
            this.velocityX = 0;
            return;
        }
        
        // движение влево
        if (input.left) {
            this.velocityX = -this.speed;   // отриц скорость = влево
            this.facing = 'left';           // смотрим влево
            this.animationState = 'walking';// меняем состояние анимации
        }
        // движение вправо
        else if (input.right) {
            this.velocityX = this.speed;    // положит скорость = вправо
            this.facing = 'right';
            this.animationState = 'walking';
        }
        // стоим на месте
        else {
            this.velocityX = 0;             // обнуляем горизонтальную скорость
            // если на земле - состояние покой
            if (this.isOnGround) {
                this.animationState = 'idle';
            }
        }

        // прыжок
        if (input.jump && this.isOnGround) {
            this.velocityY = -this.jumpForce;   // отриц скорость = вверх
            this.isOnGround = false;            // в воздухе
            this.isJumping = true;              // в состоянии прыжка
            this.animationState = 'jumping';    // анимация прыжка
            this.animationTime = 0;             // сброс таймера анимации
        }
    }

    // гравитация
    applyGravity() {
        // если не на земле - применяем гравитацию
        if (!this.isOnGround) {
            this.velocityY += this.gravity;     // увеличиваем скорость падения
            
            // ограничиваем макс скорость падения
            if (this.velocityY > 20) {
                this.velocityY = 20;
            }
            
            // если падаем вниз (не прыжок) - состояние падения
            if (this.velocityY > 0 && !this.isJumping) {
                this.animationState = 'falling';
            }
        } 
        else {
            this.velocityY = 0;                 // если на земле - обнуляем вертик скорость
            this.isJumping = false;
        }
    }

    // проверка коллизии
    checkCollisions(platforms) {
        this.isOnGround = false;
        
        // проверяем каждую платформу
        for (const platform of platforms) {
            // УСЛОВИЯ СТОЛКНОВЕНИЯ С ВЕРХОМ ПЛАТФОРМЫ:
            // 1. Игрок падает вниз (velocityY >= 0)
            // 2. Ноги игрока ВЫШЕ верхнего края платформы
            // 3. Следующий кадр: ноги игрока будут НИЖЕ или НА УРОВНЕ платформы
            // 4. Игрок находится над платформой по горизонтали (с отступами)

            if (this.velocityY >= 0 &&           // падает вниз
                this.y + this.height <= platform.y + 15 &&  // ноги выше платформы
                this.y + this.height + this.velocityY >= platform.y - 5 &&      //будет на/ниже платформы
                this.x + this.width > platform.x + 5 &&     // пересечение по х слева
                this.x < platform.x + platform.width - 5) { // пересечение по х справа
                
                // столкновение произошло 
                this.y = platform.y - this.height;      // ставим игрока точно на платформу
                this.isOnGround = true;                 // теперь на земле
                this.velocityY = 0;                     // обнуляем вертик скорость
                
                // если падали - переключаем на состояние покоя
                if (this.animationState === 'falling') {
                    this.animationState = 'idle';
                }
            }
        }
    }

    // проверка границ
    checkBoundaries() {
        const canvasWidth = 800;
        const canvasHeight = 600;
        
        // левая граница - не выходим за 0
        if (this.x < 0) this.x = 0;
        // правая граница - не выходим за правый край
        if (this.x + this.width > canvasWidth) this.x = canvasWidth - this.width;
        
        // нижняя граница
        if (this.y > canvasHeight && !this.isDying) {
            this.die();
        }
    }

    // система анимации
    updateAnimation() {
        if (!this.spritesLoaded) return;    // если спрайты не загружены - выходим
        
        this.animationTime++;               // увеличиваем счетчик времени
        
        switch(this.animationState) {
            case 'idle':                    // анимация покоя
                // меняем кадр каждые 15 обновлений 
                // % this.sprites.idle.length - зацикливаем анимацию
                this.animationFrame = Math.floor(this.animationTime / 15) % this.sprites.idle.length;
                break;

            case 'walking':                 // анимация ходьбы
                if (this.facing === 'right') {
                    // Ходьба вправо: меняем кадр каждые 8 обновлений
                    this.animationFrame = Math.floor(this.animationTime / 8) % this.sprites.walkRight.length;
                } else {
                    // Ходьба влево - аналогично
                    this.animationFrame = Math.floor(this.animationTime / 8) % this.sprites.walkLeft.length;
                }
                break;

            case 'jumping':                 // прыжок

            case 'falling':                 // падение
                this.animationFrame = 0;    // Статичный кадр (первый кадр ходьбы)
                break;

            case 'death':                   // анимация смерти 
                // Особенная логика: проигрывается один раз
                const framesPerSprite = 20; // Каждый кадр показываем 20 обновлений
                const spriteIndex = Math.floor(this.deathAnimationTime / framesPerSprite);
                
                if (spriteIndex < this.sprites.death.length) {
                    this.animationFrame = spriteIndex;      // Переключаем на следующий кадр
                } else {
                    // Если прошли все кадры - остаемся на последнем
                    this.animationFrame = this.sprites.death.length - 1;
                }
                break;
        }
    }

    // анимация смерти
    updateDeathAnimation() {
        if (!this.isDying) return;  // если не умираем - выходим (прикольно звучит)
        
        this.deathAnimationTime++;  // увеличиваем таймер смерти
        
        this.updateAnimation();     // обновляем анимацию (для смены кадров)
        
        // фикс позиции (игрок не двигается во время смерти)
        this.x = this.deathX;
        this.y = this.deathY;
        
        // обнуляем скорости
        this.velocityX = 0;
        this.velocityY = 0;
        
        // Если анимация завершилась (140 кадров = ~2.3 секунды при 60fps)
        if (this.deathAnimationTime >= 140) {
            this.isAlive = false;   // Помечаем как мертвого
            this.isDying = false;   // Завершаем анимацию смерти
        }
    }

    // смэрть
    die() {
        // Если уже умирает или мертв - выходим
        if (this.isDying || !this.isAlive) return;
        
        this.isDying = true;            // Запускаем анимацию смерти
        this.deathAnimationTime = 0;    // Сбрасываем таймер
        this.animationState = 'death';  // Меняем состояние анимации
        this.animationFrame = 0;        // Начинаем с первого кадра
        
        // Сохраняем позицию смерти
        this.deathX = this.x;
        this.deathY = this.y;
        
        this.isOnGround = false;        // Теперь в воздухе (для физики)
    }

    // урон
    takeDamage() {
        // Если неуязвим, умирает или мертв - урон не принимаем
        if (this.invincible || this.isDying || !this.isAlive) return false;
        
        // активируем неуязвимость
        this.invincible = true;         // Включаем неуязвимость
        this.invincibleTime = 90;       // На 90 кадров (~1.5 секунды)
        
        // эффект отталкивания
        this.velocityY = -8;            // Подбрасываем вверх
        this.velocityX = 0;             // Останавливаем горизонтальное движение
        this.isOnGround = false;        // Теперь в воздухе
        this.isJumping = true;          // В состоянии "прыжка" (для анимации)
        
        return true;                    // Возвращаем true = урон успешно нанесен
    }

    // сброс позиции
    // вызывается при рестарте игры или при респавне после смерти
    resetPosition() {
        this.x = 100;
        this.y = 100;
        this.velocityX = 0;
        this.velocityY = 0;
        this.isOnGround = false;
        this.isAlive = true;
        this.isDying = false;
        this.deathAnimationTime = 0;
        this.invincible = false;
        this.invincibleTime = 0;
        this.animationState = 'idle';
        this.animationFrame = 0;
        this.animationTime = 0;
    }

    // получение текущего спрайта
    getCurrentSprite() {
        if (!this.spritesLoaded) return null;       // Если спрайты не загружены
        
        let spriteArray;                            // Массив спрайтов для текущего состояния
        switch(this.animationState) {
            case 'idle':
                spriteArray = this.sprites.idle;
                break;

            case 'walking':
                // Выбираем массив в зависимости от направления
                spriteArray = this.facing === 'right' ? this.sprites.walkRight : this.sprites.walkLeft;
                break;

            case 'jumping':

            case 'falling':
                // Используем первый кадр анимации ходьбы
                spriteArray = this.facing === 'right' ? this.sprites.walkRight : this.sprites.walkLeft;
                return spriteArray[0];              // Всегда первый кадр
            case 'death':

                spriteArray = this.sprites.death;
                // Если уже мертв - возвращаем последний кадр
                if (!this.isAlive && spriteArray.length > 0) {
                    return spriteArray[spriteArray.length - 1];
                }
                break;
            default:
                spriteArray = this.sprites.idle;            // Запасной вариант
        }
        
        // Возвращаем текущий кадр или первый, если что-то пошло не так
        return spriteArray[this.animationFrame] || spriteArray[0];
    }

    // отрисовка игрока
    // ctx - контекст Canvas для рисования
    draw(ctx) {
        // 1. если спрайты не загружены
        if (!this.spritesLoaded) {
            ctx.fillStyle = '#666666';
            ctx.fillRect(this.x, this.y, this.width, this.height);
            ctx.fillStyle = '#ffffff';
            ctx.fillText('Загрузка...', this.x, this.y - 10);
            return;
        }
        
        // 2. получаем текущий спрайт
        const sprite = this.getCurrentSprite();
        if (sprite) {
            // 3. если умирает или мертв
            if (this.isDying || !this.isAlive) {
                ctx.save();                 // Сохраняем текущее состояние контекста
                
                ctx.globalAlpha = 1.0;      // Полная непрозрачность
                
                // Если уже мертв (анимация завершилась) - мерцание
                if (!this.isAlive) {
                    // Мерцание: каждый 8-й кадр меняем прозрачность
                    if (Math.floor(this.deathAnimationTime / 8) % 2 === 0) {
                        ctx.globalAlpha = 0.3;      // Почти прозрачный
                    } else {
                        ctx.globalAlpha = 0.7;      // Полупрозрачный
                    }
                }
                
                // Рисуем спрайт с примененными эффектами
                ctx.drawImage(sprite, this.x, this.y, this.width, this.height);
                ctx.restore();                      // Восстанавливаем состояние контекста
            } 

            // 4. если неуязвим (получил урон)
            else if (this.invincible) {
                ctx.save();
                // Мерцание: каждые 3 кадра меняем прозрачность
                if (Math.floor(this.invincibleTime / 3) % 2 === 0) {
                    ctx.globalAlpha = 0.4;          // Полупрозрачный
                }
                ctx.drawImage(sprite, this.x, this.y, this.width, this.height);
                ctx.restore();
            } 
            // 5. нормальное состояние
            else {
                ctx.drawImage(sprite, this.x, this.y, this.width, this.height);
            }
        }
        
        // 6. отладочный режим
        if (this.showHitbox || window.debugMode) {
            // Цвет хитбокса зависит от состояния
            ctx.strokeStyle = this.invincible ? 'rgba(0, 255, 255, 0.5)' : 'rgba(255, 255, 0, 0.5)';
            ctx.lineWidth = 2;
            ctx.strokeRect(this.x, this.y, this.width, this.height);        // рисуем рамку
            
            // Дополнительная отладочная информация
            if (window.debugMode) {
                ctx.fillStyle = '#ffffff';
                ctx.font = '10px Arial';
                ctx.fillText(`State: ${this.animationState}`, this.x, this.y - 5);
                ctx.fillText(`Invincible: ${this.invincible}`, this.x, this.y - 15);
            }
        }
    }
}