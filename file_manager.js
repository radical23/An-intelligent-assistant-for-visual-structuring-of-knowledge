// Функция для отображения сохраненных графов
function displaySavedMaps() {
    // Получаем данные из localStorage
    let savedGraphs = localStorage.getItem('savedGraphs');

    // Проверяем, есть ли сохранённые графы
    if (savedGraphs) {
        // Парсим их в массив
        savedGraphs = JSON.parse(savedGraphs);

        // Получаем элемент списка для отображения
        const thoughtsList = document.getElementById('thoughtsList');

        // Очищаем список перед добавлением новых элементов
        thoughtsList.innerHTML = '';

        // Проходим по каждому сохранённому графу и создаем элемент списка
        savedGraphs.forEach((graph, index) => {
            const listItem = document.createElement('li');

            // Создаем текстовое название для графа
            const graphTitle = document.createElement('span');
            graphTitle.textContent = graph.name || `Ментальная карта ${index + 1}`;

            // Кнопка для загрузки графа
            const loadButton = document.createElement('button');
            loadButton.textContent = 'Загрузить';
            loadButton.addEventListener('click', () => {
                // Загрузить граф при клике на кнопку
                loadGraph(index);
            });

            // Добавляем название и кнопку в элемент списка
            listItem.appendChild(graphTitle);
            listItem.appendChild(loadButton);

            // Добавляем элемент в список
            thoughtsList.appendChild(listItem);
        });
    } else {
        console.log('Нет сохраненных графов в localStorage.');
    }
}

// Функция для загрузки графа
function loadGraph(index) {
    // Получаем сохраненные графы из localStorage
    let savedGraphs = JSON.parse(localStorage.getItem('savedGraphs'));

    if (savedGraphs && savedGraphs[index]) {
        // Логика для загрузки графа по индексу
        const selectedGraph = savedGraphs[index];
        console.log('Загружаем граф:', selectedGraph);

        // Здесь можно добавить код для загрузки графа в редактор или другую страницу
        // window.location.href = `editor.html?graph=${encodeURIComponent(JSON.stringify(selectedGraph))}`;
    } else {
        console.log('Граф не найден.');
    }
}