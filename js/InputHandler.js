class InputHandler {
    constructor() {
        this.keys = {
            'left': false,
            'right': false,
            'jump': false,
            'pause': false,
            'start': false,
            'restart': false
        };
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Разделяем на 4 части:
        // 1. Обработка нажатия клавиш (keydown)
        // 2. Обработка отпускания клавиш (keyup)  
        // 3. Обработка кликов по кнопкам
        // 4. Получение свойств (геттеры)
        window.addEventListener('keydown', (event) => {
            // event - объект события клавиатуры
            // event.key - нажатая клавиша (например: 'ArrowLeft', 'a', ' ')

            const key = event.key.toLowerCase();        // Приводим к нижнему регистру
            
            switch(key) {
                case 'arrowleft':
                case 'a':
                case 'ф':
                    this.keys['left'] = true;
                    break;
                
                case 'arrowright':
                case 'd':
                case 'в':
                    this.keys['right'] = true;
                    break;
                
                case ' ':
                case 'w':
                case 'ц':
                case 'arrowup':
                    this.keys['jump'] = true;
                    event.preventDefault();
                    break;
                
                case 'p':
                case 'з':
                    this.keys['pause'] = true;
                    break;
            }
        });

        window.addEventListener('keyup', (event) => {
            const key = event.key.toLowerCase();
            
            switch(key) {
                case 'arrowleft':
                case 'a':
                case 'ф':
                    this.keys['left'] = false;
                    break;

                case 'arrowright':
                case 'd':
                case 'в':
                    this.keys['right'] = false;
                    break;
                
                case ' ':
                case 'w':
                case 'arrowup':
                case 'ц':
                    this.keys['jump'] = false;
                    break;

                case 'p':
                case 'з':
                    this.keys['pause'] = false;
                    break;
            }
        });

        document.getElementById('startBtn').addEventListener('click', () => {
            this.keys['start'] = true;
            setTimeout(() => this.keys['start'] = false, 100);
            // Зачем setTimeout?
            // Проблема: Если кнопка просто устанавливает флаг в true,
            // то в следующем кадре игры он останется true.

            // Решение: Устанавливаем в true, затем через 100мс сбрасываем в false.

            //Пример работы:
            //1. Игрок кликает кнопку Старт (0мс)
            //2. this.keys['start'] = true
            //3. Игра видит true и запускается
            //4. Через 100мс: this.keys['start'] = false (автоматически)
            //5. В следующий раз можно снова нажать

            // Без setTimeout пришлось бы вручную сбрасывать флаг в Game.js
        });

        document.getElementById('pauseBtn').addEventListener('click', () => {
            this.keys['pause'] = true;
            setTimeout(() => this.keys['pause'] = false, 100);
        });

        document.getElementById('restartBtn').addEventListener('click', () => {
            this.keys['restart'] = true;
            setTimeout(() => this.keys['restart'] = false, 100);
        });
    }

    // Геттер - специальный метод, который выглядит как свойство
    get left() {
        return this.keys['left'] || false;
    }

    get right() {
        return this.keys['right'] || false;
    }

    get jump() {
        return this.keys['jump'] || false;
    }

    get pause() {
        return this.keys['pause'] || false;
    }

    clearKeys() {
        this.keys = {
            'left': false,
            'right': false,
            'jump': false, 
            'pause': false,
            'start': false,
            'restart': false
        };
    }
}