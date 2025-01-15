const startButton = d3.select('#passButton');
const registerButton = d3.select('#registerButton');
const inputs = [d3.select('#nameInput'), d3.select('#emailInput'), d3.select('#passwordInput')];

let timeSpent = 0; // Время на странице в секундах
let visitCount = parseInt(localStorage.getItem('visitCount')) || 0; // Получаем счетчик из localStorage
let timerInterval;
let metricsInterval;

// Функция для отправки метрик на сервер
function sendMetrics() {
    const timeSpentInMs = timeSpent; // Переводим время в миллисекунды

    const body = {
        timeSpent: timeSpentInMs, // Отправляем время
        visits: visitCount // Отправляем количество посещений
    };

    console.log(`Sending metrics: Time spent: ${timeSpentInMs} ms, Visits: ${body.visits}`); // Отладочное сообщение
    fetch('http://localhost:3002/metrics', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body), // Отправляем метрики
    })
    .then(response => {
        if (!response.ok) {
            console.error('Failed to send metrics:', response.statusText);
        } else {
            console.log('Metrics sent successfully'); // Отладочное сообщение
        }
    })
    .catch(error => {
        console.error('Error sending metrics:', error);
    });
}

// Функция для обновления счетчика посещений
function updateVisitCount() {
    visitCount++;
    localStorage.setItem('visitCount', visitCount); // Сохраняем счетчик в localStorage
    sendMetrics(); // Отправляем метрики при открытии новой вкладки
}

// Запускаем таймер и счетчик при загрузке страницы
window.addEventListener('load', () => {
    console.log("Page loaded"); // Отладочное сообщение

    // Проверяем, была ли вкладка уже открыта в текущей сессии
    if (!sessionStorage.getItem('tabOpened')) {
        // Увеличиваем счетчик посещений при открытии новой вкладки
        updateVisitCount(); // Увеличиваем счетчик и отправляем метрики

        // Устанавливаем флаг, что вкладка была открыта
        sessionStorage.setItem('tabOpened', 'true');
    } else {
        console.log("Tab already opened in this session."); // Отладочное сообщение
    }

    // Запускаем таймер
    timerInterval = setInterval(() => {
        timeSpent++; // Увеличиваем время на 1 секунду
        sendMetrics(); // Отправляем метрики времени каждую секунду
    }, 1000);

    // Периодическая отправка метрик
    metricsInterval = setInterval(() => {
        sendMetrics(); // Отправляем метрики каждые 30 секунд
    }, 30000); // 30000 ms = 30 seconds
});

// Остановка таймера при закрытии вкладки
window.addEventListener('beforeunload', () => {
    clearInterval(timerInterval); // Останавливаем таймер
    clearInterval(metricsInterval); // Останавливаем периодическую отправку метрик

    // Удаляем флаг о том, что вкладка была открыта
    sessionStorage.removeItem('tabOpened');

    // Отправляем финальные метрики перед закрытием (если нужно)
    sendMetrics();
});

// Подсветка активного поля
inputs.forEach(input => {
    input.on('focus', function() {
        d3.select(this)
            .transition()
            .duration(200)
            .style('border', '2px solid #007bff');
    });

    input.on('blur', function() {
        d3.select(this)
            .transition()
            .duration(200)
            .style('border', '1px solid #ccc');
    });
});

// Эффект кнопки при наведении
startButton
    .on('mouseover', function() {
        d3.select(this)
            .transition()
            .duration(200)
            .style('background-color', '#0056b3');
    })
    .on('mouseout', function() {
        d3.select(this)
            .transition()
            .duration(200)
            .style('background-color', '#007bff');
    })
    .on('click', function() {
        // Проверка заполненности полей
        const isFormValid = inputs.every(input => input.node().value.trim() !== '');

        if (isFormValid) {
            // Изменение цвета кнопки и текста
            startButton
                .transition()
                .duration(1000)
                .style('background-color', '#28a745') // Зеленый цвет для успешной регистрации
                .text('Регистрация успешна'); // Изменение текста

            // Переход на главное меню через 2 секунды
            setTimeout(() => {
                window.location.href = 'main_menu.html'; // Переход на главное меню
            }, 2000);
        } else {
            // Тряска при ошибке
            d3.select('#registerForm')
                .transition()
                .duration(50)
                .style('transform', 'translateX(-5px)')
                .transition()
                .duration(50)
                .style('transform', 'translateX(5px)')
                .transition()
                .duration(50)
                .style('transform', 'translateX(-5px)')
                .transition()
                .duration(50)
                .style('transform', 'translateX(5px)')
                .transition()
                .duration(50)
                .style('transform', 'translateX(0px)');
        }
    });

// Переход на окно регистрации при нажатии кнопки "Зарегистрироваться"
registerButton.on('click', function() {
    window.location.href = 'registerForm.html'; // Переход на страницу регистрации
});