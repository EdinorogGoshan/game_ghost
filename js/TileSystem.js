class TileSystem {
    constructor() {
        this.tiles = {};
        this.decorations = {};
        this.tileSize = 32;
    }

    async loadAll() {
        try {
            // Загружаем тайлы
            this.tiles.platform = await this.loadImage('assets/images/other/platform.png');
            this.tiles.bricks = await this.loadImage('assets/images/other/bricks.png');
            
            // Загружаем декорации
            this.decorations.chain = await this.loadImage('assets/images/other/chain.png');
            this.decorations.thorns = await this.loadImage('assets/images/other/thorns.png');
            this.decorations.torch = await this.loadImage('assets/images/other/torch.png');
            
            return true;
        } catch (error) {
            console.error('Ошибка загрузки тайлов:', error);
            return false;
        }
    }

    loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => {
                console.warn(`Не удалось загрузить: ${src}`);
                resolve(this.createFallbackTile(src));
            };
            img.src = src;
        });
    }

    createFallbackTile(name) {
        const canvas = document.createElement('canvas');
        canvas.width = this.tileSize;
        canvas.height = this.tileSize;
        const ctx = canvas.getContext('2d');
        
        let color;
        if (name.includes('platform')) color = '#8B4513';
        else if (name.includes('bricks')) color = '#B22222';
        else if (name.includes('chain')) color = '#708090';
        else if (name.includes('thorns')) color = '#228B22';
        else if (name.includes('torch')) color = '#FF8C00';
        else color = '#666666';
        
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, this.tileSize, this.tileSize);
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        for (let i = 0; i < this.tileSize; i += 4) {
            ctx.fillRect(i, 0, 1, this.tileSize);
            ctx.fillRect(0, i, this.tileSize, 1);
        }
        
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '8px Arial';
        ctx.textAlign = 'center';
        const shortName = name.split('/').pop().split('.')[0];
        ctx.fillText(shortName, this.tileSize/2, this.tileSize/2);
        
        const img = new Image();
        img.src = canvas.toDataURL();
        return img;
    }

    drawBackground(ctx, width, height) {
        if (!this.tiles.bricks) return;
        
        const pattern = ctx.createPattern(this.tiles.bricks, 'repeat');
        ctx.fillStyle = pattern;
        ctx.fillRect(0, 0, width, height);
        
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0.3)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.1)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
    }

    drawPlatform(ctx, x, y, width, height) {
        if (!this.tiles.platform) {
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(x, y, width, height);
            return;
        }
        
        // Рисуем углы
        ctx.drawImage(this.tiles.platform, 0, 0, this.tileSize, this.tileSize, x, y, this.tileSize, this.tileSize);
        ctx.drawImage(this.tiles.platform, 0, 0, this.tileSize, this.tileSize, x + width - this.tileSize, y, this.tileSize, this.tileSize);
        ctx.drawImage(this.tiles.platform, 0, 0, this.tileSize, this.tileSize, x, y + height - this.tileSize, this.tileSize, this.tileSize);
        ctx.drawImage(this.tiles.platform, 0, 0, this.tileSize, this.tileSize, x + width - this.tileSize, y + height - this.tileSize, this.tileSize, this.tileSize);
        
        // Рисуем середину
        const pattern = ctx.createPattern(this.tiles.platform, 'repeat');
        ctx.fillStyle = pattern;
        ctx.fillRect(
            x + this.tileSize, 
            y + this.tileSize, 
            width - this.tileSize * 2, 
            height - this.tileSize * 2
        );
    }

    drawThorns(ctx, x, y, width, count = 3, isOnTop = true) {
        if (!this.decorations.thorns) {
            // Заглушка
            ctx.fillStyle = '#FF0000';
            const thornWidth = width / count;
            for (let i = 0; i < count; i++) {
                const thornX = x + i * thornWidth;
                ctx.beginPath();
                if (isOnTop) {
                    // Шипы сверху - пики вверх
                    ctx.moveTo(thornX + thornWidth/2, y - 16);
                    ctx.lineTo(thornX, y);
                    ctx.lineTo(thornX + thornWidth, y);
                } else {
                    // Шипы снизу - пики вниз (отзеркаленные)
                    ctx.moveTo(thornX + thornWidth/2, y + 16);
                    ctx.lineTo(thornX, y);
                    ctx.lineTo(thornX + thornWidth, y);
                }
                ctx.closePath();
                ctx.fill();
            }
            return;
        }
        
        const thornWidth = width / count;
        for (let i = 0; i < count; i++) {
            const thornX = x + i * thornWidth;
            
            if (isOnTop) {
                // Шипы сверху - обычная отрисовка
                ctx.drawImage(
                    this.decorations.thorns,
                    thornX,
                    y - 32,
                    thornWidth,
                    32
                );
            } else {
                // Шипы снизу - отзеркаливаем по вертикали
                ctx.save();
                ctx.translate(thornX + thornWidth/2, y + 16);
                ctx.scale(1, -1); // Отзеркаливание по вертикали
                ctx.drawImage(
                    this.decorations.thorns,
                    -thornWidth/2,
                    -16,
                    thornWidth,
                    32
                );
                ctx.restore();
            }
        }
    }

    drawChain(ctx, x, y, platformWidth, chainCount = 2, chainLength = 50) {
        if (!this.decorations.chain) return;
        
        const spacing = platformWidth / (chainCount + 1);
        
        for (let i = 1; i <= chainCount; i++) {
            const chainX = x + spacing * i - 8;
            for (let j = 0; j < chainLength; j += 16) {
                ctx.drawImage(
                    this.decorations.chain,
                    chainX,
                    y + j,
                    16,
                    16
                );
            }
        }
    }

    drawTorches(ctx, x, y, count = 1, spacing = 200) {
        if (!this.decorations.torch) return;
        
        for (let i = 0; i < count; i++) {
            const torchX = x + i * spacing;
            ctx.drawImage(
                this.decorations.torch,
                torchX,
                y,
                32,
                64
            );
        }
    }
}