document.addEventListener('DOMContentLoaded', function() {
    loadSavedGraphs();
});

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

let cy; // Объявляем переменную для Cytoscape

function loadSavedGraphs() {
    let savedGraphs = JSON.parse(localStorage.getItem('savedGraphs')) || {};
    let graphList = document.getElementById('graphList');
    graphList.innerHTML = ''; // Очищаем список

    if (Object.keys(savedGraphs).length === 0) {
        graphList.innerHTML = '<li>Нет сохраненных графов.</li>'; // Показать сообщение, если графы не найдены
        return; // Прекращаем выполнение функции
    }

    Object.keys(savedGraphs).forEach((graphName) => {
        let listItem = document.createElement('li');
        listItem.textContent = graphName;

        // Кнопка для загрузки графа
        let loadButton = document.createElement('button');
        loadButton.textContent = 'Загрузить';
        loadButton.addEventListener('click', () => {
            if (cy) {
                cy.destroy(); // Уничтожаем старый экземпляр, если он существует
            }

            // Создаем новый экземпляр cytoscape для загрузки графа
            cy = cytoscape({
                container: document.getElementById('cy'), // Контейнер для графа
                elements: savedGraphs[graphName], // Загружаем элементы графа
                style: [ // Убедитесь, что стиль соответствует вашему графу
                    {
                        selector: 'node',
                        style: {
                            'background-color': 'lightblue',
                            'label': 'data(label)',
                            'text-valign': 'center',
                            'text-halign': 'center',
                            'width': '60px',
                            'height': '60px',
                            'border-width': 2,
                            'border-color': '#000'
                        }
                    },
                    {
                        selector: 'edge',
                        style: {
                            'width': 3,
                            'line-color': '#ccc',
                            'target-arrow-color': '#ccc',
                            'target-arrow-shape': 'triangle'
                        }
                    },
                    {
                        selector: 'node:selected',
                        style: {
                            'border-width': 4,
                            'border-color': 'orange'
                        }
                    },
                    {
                        selector: 'edge:selected',
                        style: {
                            'line-color': 'red',
                            'target-arrow-color': 'red',
                            'width': 5
                        }
                    }
                ],
                layout: {
                    name: 'cose',
                    animate: true,
                }
            });

            // Запускаем раскладку для обновления положения узлов
            cy.layout({ name: 'cose', animate: true }).run();
        });

        listItem.appendChild(loadButton);
        graphList.appendChild(listItem); // Добавляем элемент в список
    });
}