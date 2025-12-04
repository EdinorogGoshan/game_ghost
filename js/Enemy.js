class Enemy {
    constructor(x, y, width = 64, height = 64, options = {}) {
        // options = {} - параметры по умолчанию пустой объект
        // Это позволяет вызывать: new Enemy(100, 100) или new Enemy(100, 100, 64, 64, {speed: 2})
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        
        // Физика и движение
        this.velocityX = 0;
        this.speed = options.speed || 1.5;          // Базовая скорость (из options или 1.5)
        this.direction = options.direction || (Math.random() > 0.5 ? 1 : -1);
        // direction: 1 = вправо, -1 = влево
        // Если direction не задан - случайно выбираем направление
        this.moveRange = options.moveRange || 100;  // Дистанция патрулирования
        this.startX = options.startX || x;          // Начальная точка для патрулирования
        
        // Состояние
        this.isAlive = true;
        this.isDying = false;
        this.deathAnimationTime = 0;
        
        // Анимация
        this.animationFrame = 0;
        this.animationTime = 0;
        this.animationSpeed = 15;
        
        // Спрайты
        this.sprites = {
            walkRight: []
        };
        
        this.spritesLoaded = false;
        this.loadSprites();
        
        this.showHitbox = false;
    }

    // загрузка спрайтов
    async loadSprites() {
        try {
            // Загрузка анимации ходьбы вправо (6 кадров)
            for (let i = 1; i <= 6; i++) {
                const sprite = await this.loadImage(`assets/images/enemy_right/enemy_right_${i}.png`);
                this.sprites.walkRight.push(sprite);
            }
            
            this.spritesLoaded = true;
            console.log('Спрайты врага загружены!');
            
        } catch (error) {
            console.error('Ошибка загрузки спрайтов врага:', error);
            this.createFallbackSprites();
        }
    }

    loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
        });
    }

    createFallbackSprites() {
        // Создаем простые цветные спрайты для отладки
        for (let i = 0; i < 6; i++) {
            const canvas = document.createElement('canvas');
            canvas.width = 64;
            canvas.height = 64;
            const ctx = canvas.getContext('2d');
            
            // Разные цвета для разных кадров
            const colors = ['#ff0000', '#cc0000', '#aa0000', '#880000', '#660000', '#440000'];
            ctx.fillStyle = colors[i];
            ctx.fillRect(16, 16, 32, 32);
            
            // Номер кадра
            ctx.fillStyle = '#ffffff';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`${i+1}`, 32, 35);
            
            const img = new Image();
            img.src = canvas.toDataURL();
            this.sprites.walkRight.push(img);
        }
        this.spritesLoaded = true;
    }

    // обновление
    update(platforms) {
        // platforms - массив всех платформ уровня

        // 1. Если враг мертв или спрайты не загружены - выходим
        if (!this.isAlive || !this.spritesLoaded) return;
        
        // 2. Если враг умирает - обновляем только анимацию смерти
        if (this.isDying) {
            this.updateDeathAnimation();
            return;                 // Выходим, не двигаем умирающего врага
        }
        
        // 3. Патрулирование
        this.velocityX = this.direction * this.speed;       // Направление × скорость
        this.x += this.velocityX;                           // Двигаем врага
        
        // 4. Проверяем границы патрулирования
        // Если дошли до правой границы
        if (this.x > this.startX + this.moveRange) {
            this.direction = -1;                            // Разворачиваемся налево
            this.x = this.startX + this.moveRange;          // Не выходим за границу
        } 
        // Если дошли до левой границы
        else if (this.x < this.startX - this.moveRange) {
            this.direction = 1;                             // Разворачиваемся направо
            this.x = this.startX - this.moveRange;          // Не выходим за границу
        }
        
        // 5. Обновляем анимацию только если двигаемся
        if (Math.abs(this.velocityX) > 0) {
            this.updateAnimation();
        }
        
        // 6. Проверяем, стоит ли на платформе
        this.checkPlatformPosition(platforms);
    }

    checkPlatformPosition(platforms) {
        let onPlatform = false;      // Стоит ли на платформе?
        let platformBelow = null;    // Какая платформа под ногами?
        
        // 1. Ищем платформу под врагом
        for (const platform of platforms) {
            // Проверяем, находится ли враг над платформой по X (с отступами 10px)
            if (this.x + this.width > platform.x + 10 &&
                this.x < platform.x + platform.width - 10) {
                
                // Вычисляем расстояние до платформы по вертикали
                const distanceToPlatform = platform.y - (this.y + this.height);
                // distanceToPlatform = координата верха платформы - координата низа врага
                // Если положительное - платформа ниже врага
                // Если отрицательное - платформа выше врага
                
                // Если враг близко к платформе сверху (-5px до +5px)
                if (distanceToPlatform >= -5 && distanceToPlatform <= 5) {
                    onPlatform = true;           // Стоит на платформе!
                    platformBelow = platform;    // Запоминаем платформу
                    break;  // Выходим из цикла - нашли платформу
                }
            }
        }
        
        // 2. Если НЕ на платформе - падаем
        if (!onPlatform) {
            // Простая гравитация для врагов
            this.y += 3;  // Падаем со скоростью 3px/кадр
            
            // Проверяем, не упал ли за экран
            if (this.y > 600) {  // Высота canvas = 600
                this.isAlive = false;  // Враг упал за экран - умирает
            }
        } 
        // 3. Если на платформе - выравниваем позицию
        else if (platformBelow) {
            // Ставим врага точно на платформу:
            // this.y = верх платформы - высота врага
            this.y = platformBelow.y - this.height;
        }
        
        // 4. Проверяем, нет ли обрыва впереди
        this.checkForEdges(platforms);
    }

    checkForEdges(platforms) {
        // Проверяем, есть ли платформа впереди по направлению движения
        const checkAheadDistance = 30;  // На 30px вперед
        
        // Вычисляем точку проверки:
        // Если движемся вправо: проверяем справа от врага
        // Если движемся влево: проверяем слева от врага
        const checkX = this.direction > 0 ? 
            this.x + this.width + checkAheadDistance :  // Вправо
            this.x - checkAheadDistance;               // Влево
        
        let platformAhead = false;  // Есть ли платформа впереди?
        
        // Проверяем все платформы
        for (const platform of platforms) {
            // Проверяем по X: точка checkX должна быть над платформой
            if (checkX > platform.x && 
                checkX < platform.x + platform.width) {
                
                // Проверяем по Y: платформа должна быть примерно на том же уровне
                const platformTop = platform.y;           // Верх платформы
                const enemyBottom = this.y + this.height; // Ноги врага
                
                // Если разница по Y меньше 50px - платформа "впереди"
                if (Math.abs(enemyBottom - platformTop) < 50) {
                    platformAhead = true;  // Платформа есть!
                    break;  // Выходим из цикла
                }
            }
        }
        
        // Если впереди НЕТ платформы и мы близко к краю - разворачиваемся
        if (!platformAhead) {
            // Вычисляем расстояние до края патрулирования
            const distanceToEdge = this.direction > 0 ? 
                (this.startX + this.moveRange) - this.x :  // До правого края
                this.x - (this.startX - this.moveRange);   // До левого края
            
            // Если до края меньше 20px - разворачиваемся
            if (distanceToEdge < 20) {
                this.direction *= -1;  // Меняем направление на противоположное
            }
        }
    }

    updateAnimation() {
        if (!this.spritesLoaded) return;  // Если спрайты не загружены - выходим
        
        this.animationTime++;  // Увеличиваем счетчик времени
        
        // Меняем кадр каждые animationSpeed обновлений
        // % this.sprites.walkRight.length - зацикливаем анимацию
        this.animationFrame = Math.floor(this.animationTime / this.animationSpeed) % 
                            this.sprites.walkRight.length;
    }

    updateDeathAnimation() {
        if (!this.isDying) return;  // Если не умирает - выходим
        
        this.deathAnimationTime++;  // Увеличиваем таймер смерти
        
        // Анимация исчезновения: мерцание и уменьшение за 45 кадров (~0.75 сек)
        if (this.deathAnimationTime > 45) {
            this.isAlive = false;   // Помечаем как мертвого
            this.isDying = false;   // Завершаем анимацию
        }
    }

    // === РАЗДЕЛЕННАЯ ЛОГИКА КОЛЛИЗИЙ ===
    
    checkPlayerJumpCollision(player) {
        // Проверка ТОЛЬКО прыжка игрока сверху на врага
        
        // 1. Быстрая проверка на возможность коллизии
        if (!this.isAlive || this.isDying || player.isDying || !player.isAlive) {
            return false;  // Нельзя столкнуться
        }
        
        // 2. Игрок должен быть над врагом по горизонтали (с отступами 15px)
        const horizontalOverlap = 
            player.x + player.width - 15 > this.x + 15 &&  // Правая сторона игрока > левая сторона врага
            player.x + 15 < this.x + this.width - 15;      // Левая сторона игрока < правая сторона врага
        
        if (!horizontalOverlap) return false;  // Не над врагом
        
        // 3. Игрок должен ПАДАТЬ ВНИЗ (velocityY > 0)
        if (player.velocityY <= 0) return false;  // Не падает (может прыгать вверх)
        
        // 4. Ноги игрока должны касаться головы врага (узкая зона 20px)
        const playerBottom = player.y + player.height;  // Координата ног игрока
        const enemyTop = this.y;                        // Координата головы врага
        
        const verticalOverlap = 
            playerBottom >= enemyTop &&           // Ноги игрока на уровне головы врага или ниже
            playerBottom <= enemyTop + 20;        // Но не ниже чем на 20px
        
        return verticalOverlap;  // true = прыжок сверху успешен!
}
    
    checkPlayerSideCollision(player) {
        // Проверка ТОЛЬКО удара игрока сбоку/снизу
        
        // 1. Быстрая проверка
        if (!this.isAlive || this.isDying || player.isDying || !player.isAlive) {
            return false;
        }
        
        // 2. Исключаем случай прыжка сверху!
        if (this.checkPlayerJumpCollision(player)) {
            return false;  // Это прыжок сверху, а не удар сбоку
        }
        
        // 3. Проверяем обычную коллизию с отступами 5px
        const collisionPadding = 5;
        const collision = 
            player.x + player.width - collisionPadding > this.x + collisionPadding &&
            player.x + collisionPadding < this.x + this.width - collisionPadding &&
            player.y + player.height - collisionPadding > this.y + collisionPadding &&
            player.y + collisionPadding < this.y + this.height - collisionPadding;
        
        return collision;
}
    
    checkPlayerCollision(player) {
        // Устаревший метод, использует новую логику, нужен для обратной совместимости
        
        // 1. Проверяем прыжок сверху
        if (this.checkPlayerJumpCollision(player)) {
            return { 
                collides: true, 
                type: 'player_jumps_on_enemy',
                damageToEnemy: true  // Враг получает урон
            };
        }
        
        // 2. Проверяем удар сбоку
        if (this.checkPlayerSideCollision(player)) {
            return { 
                collides: true, 
                type: 'enemy_hits_player',
                damageToPlayer: true,  // Игрок получает урон
                damage: 1  // Количество урона
            };
        }
        
        // 3. Нет столкновения
        return { collides: false };
    }

    takeDamage() {
        // Вызывается когда игрок прыгает на врага сверху
        
        if (this.isDying || !this.isAlive) return false;  // Уже умирает или мертв
        
        console.log('Враг получает урон от прыжка игрока!');
        
        this.isDying = true;           // Запускаем анимацию смерти
        this.deathAnimationTime = 0;   // Сбрасываем таймер
        
        return true;  // Успешно получил урон
    }

    draw(ctx) {
        // ctx - контекст Canvas
        
        // 1. Если спрайты не загружены или враг мертв - не рисуем
        if (!this.spritesLoaded || !this.isAlive) return;
        
        ctx.save();  // Сохраняем текущее состояние контекста
        
        // 2. ЭФФЕКТ ДЛЯ УМИРАЮЩЕГО ВРАГА:
        if (this.isDying) {
            // Мерцание: каждые 5 кадров меняем прозрачность
            if (Math.floor(this.deathAnimationTime / 5) % 2 === 0) {
                ctx.globalAlpha = 0.5;  // Полупрозрачный
            }
            
            // Уменьшение: масштабируем от 1.0 до 0.0 за 60 кадров
            const scale = 1.0 - (this.deathAnimationTime / 60);
            ctx.translate(this.x + this.width/2, this.y + this.height/2);
            ctx.scale(scale, scale);  // Уменьшаем
            ctx.translate(-(this.x + this.width/2), -(this.y + this.height/2));
        }
        
        // 3. ПОЛУЧАЕМ ТЕКУЩИЙ СПРАЙТ:
        const spriteIndex = Math.min(this.animationFrame, this.sprites.walkRight.length - 1);
        const sprite = this.sprites.walkRight[spriteIndex];
        
        if (sprite) {
            // 4. ЕСЛИ ДВИЖЕМСЯ ВЛЕВО - ОТЗЕРКАЛИВАЕМ:
            if (this.direction < 0) {
                ctx.save();
                ctx.scale(-1, 1);  // Отзеркаливаем по горизонтали
                // Рисуем отзеркаленный спрайт:
                // x координата становится отрицательной
                ctx.drawImage(sprite, -this.x - this.width, this.y, this.width, this.height);
                ctx.restore();
            } 
            else {
                // 5. ДВИЖЕМСЯ ВПРАВО - рисуем как есть
                ctx.drawImage(sprite, this.x, this.y, this.width, this.height);
            }
        } 
        else {
            // 6. ЗАПАСНОЙ ВАРИАНТ - цветной квадрат
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(this.x, this.y, this.width, this.height);
            ctx.fillStyle = '#ffffff';
            ctx.font = '10px Arial';
            ctx.fillText(`Enemy`, this.x + 5, this.y + 20);
        }
        
        ctx.restore();  // Восстанавливаем состояние контекста
        
        // 7. ОТЛАДОЧНЫЙ РЕЖИМ:
        if (this.showHitbox || window.debugMode) {
            // Хитбокс врага
            ctx.strokeStyle = this.isDying ? 
                'rgba(255, 0, 0, 0.3)' :    // Красный прозрачный если умирает
                'rgba(255, 0, 0, 0.5)';     // Красный если жив
            ctx.lineWidth = 2;
            ctx.strokeRect(this.x, this.y, this.width, this.height);
            
            // Направление движения
            ctx.fillStyle = '#ff0000';
            ctx.font = '10px Arial';
            ctx.fillText(`${this.direction > 0 ? '→' : '←'} ${this.animationFrame+1}/6`, 
                        this.x, this.y - 5);
            
            // Дополнительная отладка
            if (window.debugMode) {
                // Зона прыжка сверху (зеленая)
                ctx.strokeStyle = 'rgba(0, 255, 0, 0.3)';
                ctx.strokeRect(this.x + 15, this.y, this.width - 30, 20);
                
                // Зона удара сбоку (красная)
                ctx.strokeStyle = 'rgba(255, 0, 0, 0.3)';
                ctx.strokeRect(this.x + 5, this.y + 5, this.width - 10, this.height - 10);
            }
        }
    }
}