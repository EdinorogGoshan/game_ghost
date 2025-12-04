class Collectible {
    constructor(x, y, width = 32, height = 32) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.collected = false;
        
        // Сохраняем начальные позиции
        this.initialX = x;
        this.initialY = y;

        // Разные параметры для каждого огонька
        this.floatSpeed = 0.02 + Math.random() * 0.02; // 0.02-0.04
        this.floatRange = 10 + Math.random() * 15;    // 10-25 пикселей
        this.floatTime = Math.random() * Math.PI * 2; // Случайная начальная фаза
    
        // Разная скорость анимации
        this.animationSpeed = 10 + Math.random() * 8; // 10-18
        
        // Параметры для вертикального плавания
        this.floatSpeed = 0.03; // Скорость плавания
        this.floatRange = 15;   // Размах плавания по Y (высота)
        this.floatTime = Math.random() * Math.PI * 2; // Начальная фаза
        
        // Анимация
        this.sprites = [];
        this.currentFrame = 0;
        this.animationSpeed = 12; // Каждые 12 обновлений меняем кадр
        this.spritesLoaded = false;
        this.animationTime = 0;
        
        this.loadSprites();
    }

    async loadSprites() {
        try {
            for (let i = 1; i <= 3; i++) {
                const sprite = await this.loadImage(`assets/images/fire/fire_${i}.png`);
                this.sprites.push(sprite);
            }
            this.spritesLoaded = true;
        } catch (error) {
            console.error('Ошибка загрузки спрайтов огонька:', error);
            this.createFallbackSprite();
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

    createFallbackSprite() {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        
        const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
        gradient.addColorStop(0, '#ffff00');
        gradient.addColorStop(1, '#ff8800');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(16, 16, 12, 0, Math.PI * 2);
        ctx.fill();
        
        const img = new Image();
        img.src = canvas.toDataURL();
        this.sprites = [img, img, img];
        this.spritesLoaded = true;
    }

    update() {
        if (this.collected) return;
        
        // Обновляем анимацию
        this.animationTime++;
        this.currentFrame = Math.floor(this.animationTime / this.animationSpeed) % this.sprites.length;
        
        // Обновляем плавание по вертикали
        this.floatTime += this.floatSpeed;
        
        // Только вертикальное движение (по синусоиде)
        const offsetY = Math.sin(this.floatTime) * this.floatRange;
        
        // X остается постоянным
        this.x = this.initialX;
        this.y = this.initialY + offsetY;
    }

    draw(ctx) {
        if (this.collected || !this.spritesLoaded) return;
        
        const sprite = this.sprites[this.currentFrame];
        if (sprite) {
            // Легкое свечение
            ctx.save();
            
            if (!window.debugMode) {
                ctx.shadowColor = '#ff9900';
                ctx.shadowBlur = 10;
            }
            
            ctx.drawImage(sprite, this.x, this.y, this.width, this.height);
            ctx.restore();
        }
        
        if (window.debugMode) {
            // Хитбокс
            ctx.strokeStyle = 'rgba(255, 255, 0, 0.3)';
            ctx.lineWidth = 1;
            ctx.strokeRect(this.x, this.y, this.width, this.height);
            
            // Линия траектории вертикального движения
            ctx.beginPath();
            ctx.moveTo(this.x - 10, this.initialY - this.floatRange);
            ctx.lineTo(this.x - 10, this.initialY + this.floatRange);
            ctx.strokeStyle = 'rgba(255, 200, 0, 0.3)';
            ctx.stroke();
            
            // Точка центра
            ctx.beginPath();
            ctx.arc(this.x, this.initialY, 3, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 100, 0, 0.5)';
            ctx.fill();
            
            // Отладочная информация
            ctx.fillStyle = '#ffffff';
            ctx.font = '8px Arial';
            ctx.fillText(`Y: ${Math.round(this.y)}`, this.x - 15, this.y - 10);
        }
    }

    checkCollision(player) {
        if (this.collected) return false;
        
        // Увеличиваем зону коллизии для движущихся огоньков
        const collisionPadding = 8;
        
        return player.x < this.x + this.width - collisionPadding &&
               player.x + player.width > this.x + collisionPadding &&
               player.y < this.y + this.height - collisionPadding &&
               player.y + player.height > this.y + collisionPadding;
    }

    collect() {
        if (this.collected) {
            console.warn(`Огонёк ${this.id} уже собран!`);
            return 0;
        }
        
        this.collected = true;
        console.log(`Огонёк ${this.id} собран!`);
        return 100;
    }
}