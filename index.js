const startButton = document.getElementById('startButton');
const loader = document.getElementById('loader');

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

startButton.addEventListener('click', () => {
    loader.style.transition = 'opacity 0.5s';
    loader.style.opacity = '0';

    setTimeout(() => {
        window.location.href = 'register.html';
    }, 500); // Переход произойдет через 500 мс, после того как экран затемнится
});