class Platform {
    constructor(x, y, width, height, options = {}) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height || 32;
        
        this.type = options.type || 'normal';
        this.hasThorns = options.hasThorns || false;
        this.thornsOnTop = options.thornsOnTop !== undefined ? options.thornsOnTop : true;
        this.hasChain = options.hasChain || false;
        this.chainLength = options.chainLength || 50;
        this.isHanging = options.isHanging || false;
        
        this.damage = options.damage || 1;
    }

    draw(ctx, tileSystem) {
        tileSystem.drawPlatform(ctx, this.x, this.y, this.width, this.height);
        
        if (this.hasThorns) {
            tileSystem.drawThorns(
                ctx, 
                this.x, 
                this.thornsOnTop ? this.y : this.y + this.height, 
                this.width, 
                3, 
                this.thornsOnTop
            );
        }
        
        if (this.hasChain || this.isHanging) {
            tileSystem.drawChain(ctx, this.x, this.y + this.height, this.width, 2, this.chainLength);
        }
        
        if (window.debugMode) {
            ctx.strokeStyle = 'rgba(255, 255, 0, 0.5)';
            ctx.lineWidth = 1;
            ctx.strokeRect(this.x, this.y, this.width, this.height);
            
            if (this.hasThorns) {
                ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
                if (this.thornsOnTop) {
                    ctx.strokeRect(this.x, this.y - 32, this.width, 32);
                } else {
                    ctx.strokeRect(this.x, this.y + this.height, this.width, 32);
                }
            }
        }
    }

    checkThornsCollision(player) {
        if (!this.hasThorns) return false;
        
        let thornsRect;
        
        if (this.thornsOnTop) {
            thornsRect = {
                x: this.x,
                y: this.y - 32,
                width: this.width,
                height: 32
            };
        }
        else {
            thornsRect = {
                x: this.x,
                y: this.y + this.height,
                width: this.width,
                height: 32
            };
        }
        
        const collision = player.x < thornsRect.x + thornsRect.width &&
                          player.x + player.width > thornsRect.x &&
                          player.y < thornsRect.y + thornsRect.height &&
                          player.y + player.height > thornsRect.y;
        
        return collision;
    }
}