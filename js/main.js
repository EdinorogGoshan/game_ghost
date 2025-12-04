window.addEventListener('DOMContentLoaded', () => {

    const canvas = document.getElementById('gameCanvas');
    if (!canvas) {
        console.error('Canvas не найден!');
        return;
    }
    
    try {
        if (!canvas.getContext) {
            throw new Error('Canvas не поддерживается браузером');
        }
        
        const game = new Game(canvas);
        window.game = game;
        
        window.addEventListener('keydown', (e) => {
            if (e.key === 'F1') {
                e.preventDefault();
                window.debugMode = !window.debugMode;
                console.log('Debug mode:', window.debugMode);
            }
        });
        
    } catch (error) {
        console.error('Ошибка при создании игры:', error);
        
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            color: white;
            background: rgba(255, 0, 0, 0.8);
            padding: 20px;
            margin: 20px;
            border-radius: 10px;
            text-align: center;
            font-family: Arial, sans-serif;
        `;
        errorDiv.innerHTML = `
            <h2>Ошибка загрузки игры</h2>
            <p>${error.message}</p>
            <p>Проверьте консоль браузера (F12) для подробностей.</p>
            <p>Или попробуйте обновить страницу.</p>
        `;
        document.querySelector('.game-container').appendChild(errorDiv);
    }
});