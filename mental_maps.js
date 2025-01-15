document.addEventListener('DOMContentLoaded', function() {
    // Инициализация Cytoscape
    let cy = cytoscape({
        container: document.getElementById('cy'),
        elements: [],
        style: [{
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
                selector: 'node[type="изображение"]',
                style: {
                    'background-color': 'white',
                    'background-image': 'data(image)',
                    'background-fit': 'cover',
                    'background-clip': 'node',
                    'border-width': 2,
                    'border-color': '#000',
                    'width': '80px',
                    'height': '80px',
                    'label': ''
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
            padding: 10,
            randomize: true,
            componentSpacing: 100,
            idealEdgeLength: 100,
            nodeRepulsion: 4000
        }
    });

    let nodeIdCounter = 1;

    // Добавление узла с выбором типа содержимого
    document.getElementById('addNode').addEventListener('click', () => {
        let nodeId = 'node' + (nodeIdCounter++);
        let nodeType = prompt("Выберите тип узла: 'текст', 'изображение', 'аудио'");

        if (!['текст', 'изображение', 'аудио'].includes(nodeType)) {
            alert('Неверный тип узла!');
            return;
        }

        let nodeData = { id: nodeId, type: nodeType };

        if (nodeType === 'текст') {
            let textContent = prompt('Введите текст для узла');
            nodeData.label = textContent || 'Текстовый узел';
        }

        if (nodeType === 'изображение') {
            let imageUrl = prompt('Введите ссылку на изображение');
            nodeData.image = imageUrl || 'default-image.png';
            nodeData.label = '';
        }

        if (nodeType === 'аудио') {
            nodeData.label = 'Аудио узел';
        }

        cy.add({
            group: 'nodes',
            data: nodeData,
            position: { x: Math.random() * 500, y: Math.random() * 500 }
        });

        cy.layout({ name: 'cose', animate: true }).run();

        // Если узел типа "аудио", отображаем кнопки записи и воспроизведения
        if (nodeType === 'аудио') {
            displayAudioButtons(nodeId);
        }
    });

    // Удаление выбранного узла
    document.getElementById('removeNode').addEventListener('click', () => {
        let selectedNode = cy.$(':selected');
        if (selectedNode.length > 0) {
            cy.remove(selectedNode);
            cy.layout({ name: 'cose', animate: true }).run();
        } else {
            alert('Выберите узел для удаления');
        }
    });

    // Редактирование узла
    document.getElementById('editNode').addEventListener('click', () => {
        let selectedNode = cy.$(':selected');
        if (selectedNode.length === 1) {
            let newLabel = prompt('Введите новое название для узла:', selectedNode.data('label'));
            if (newLabel) {
                selectedNode.data('label', newLabel);
            }
        } else {
            alert('Выберите один узел для редактирования');
        }
    });

    // Добавление связи между двумя выделенными узлами
    document.getElementById('addEdge').addEventListener('click', () => {
        let selectedNodes = cy.$('node:selected');
        if (selectedNodes.length === 2) {
            let edgeType = prompt("Выберите тип связи: 'текст', 'изображение', 'аудио'");
            if (!['текст', 'изображение', 'аудио'].includes(edgeType)) {
                alert('Неверный тип связи!');
                return;
            }

            let edgeData = { source: selectedNodes[0].id(), target: selectedNodes[1].id(), type: edgeType };

            if (edgeType === 'текст') {
                let textContent = prompt('Введите текст для связи');
                edgeData.content = textContent || 'Текстовая связь';
            }

            if (edgeType === 'изображение') {
                let textContent = prompt('Введите ссылку на изображение');
                edgeData.content = textContent || 'default-image.png';
            }

            cy.add({
                group: 'edges',
                data: edgeData
            });

            cy.layout({ name: 'cose', animate: true }).run();
        } else {
            alert('Выберите два узла для создания связи');
        }
    });

    // Удаление выделенной связи (ребра)
    document.getElementById('removeEdge').addEventListener('click', () => {
        let selectedEdge = cy.$('edge:selected');
        if (selectedEdge.length > 0) {
            cy.remove(selectedEdge);
            cy.layout({ name: 'cose', animate: true }).run();
        } else {
            alert('Выберите связь для удаления');
        }
    });

    // Сохранение графа
    document.getElementById('saveGraph').addEventListener('click', () => {
        let graphName = prompt('Введите название для сохранения графа:');
        if (graphName) {
            const graphData = cy.json().elements;
            let savedGraphs = JSON.parse(localStorage.getItem('savedGraphs')) || {};
            savedGraphs[graphName] = graphData;
            localStorage.setItem('savedGraphs', JSON.stringify(savedGraphs));
            alert(`Граф "${graphName}" сохранен!`);
        }
    });

    // Загрузка сохраненных графов
    function loadSavedGraphs() {
        let savedGraphs = JSON.parse(localStorage.getItem('savedGraphs')) || {};
        let graphList = document.getElementById('graphList');
        graphList.innerHTML = '';

        Object.keys(savedGraphs).forEach((graphName) => {
            let listItem = document.createElement('li');
            listItem.textContent = graphName;

            // Кнопка загрузки графа
            let loadButton = document.createElement('button');
            loadButton.textContent = 'Загрузить';
            loadButton.addEventListener('click', () => {
                cy.json({ elements: savedGraphs[graphName] });
                cy.layout({ name: 'cose', animate: true }).run();
            });

            listItem.appendChild(loadButton);
            graphList.appendChild(listItem);
        });
    }
    loadSavedGraphs();

    // Функция для отображения кнопок записи и воспроизведения
    function displayAudioButtons(nodeId) {
        const recordButton = document.createElement('button');
        recordButton.textContent = 'Запись';
        recordButton.style.borderRadius = '10px';
        recordButton.style.padding = '5px 10px';
        recordButton.style.backgroundColor = 'lightgreen';
        recordButton.style.border = 'none';
        recordButton.style.cursor = 'pointer';
        recordButton.style.position = 'absolute';
        recordButton.style.zIndex = '1000';

        const playButton = document.createElement('button');
        playButton.textContent = 'Воспроизвести';
        playButton.style.borderRadius = '10px';
        playButton.style.padding = '5px 10px';
        playButton.style.backgroundColor = 'lightblue';
        playButton.style.border = 'none';
        playButton.style.cursor = 'pointer';
        playButton.style.position = 'absolute';
        playButton.style.zIndex = '1000';

        // Получаем узел Cytoscape
        const nodeElement = cy.getElementById(nodeId);

        // Функция для обновления позиции кнопок
        function updateButtonPositions() {
            const nodePosition = nodeElement.position();
            recordButton.style.left = (nodePosition.x - 30);
            recordButton.style.top = (nodePosition.y - 30);
            playButton.style.left = (nodePosition.x - 30);
            playButton.style.top = (nodePosition.y + 10);
        }

        // Обработчик записи аудио
        let mediaRecorder;
        let audioChunks = [];

        recordButton.addEventListener('click', async() => {
            if (!mediaRecorder || mediaRecorder.state === 'inactive') {
                // Начало записи
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                mediaRecorder = new MediaRecorder(stream);
                mediaRecorder.start();

                mediaRecorder.ondataavailable = (event) => {
                    audioChunks.push(event.data);
                };

                recordButton.textContent = 'Стоп';
            } else {
                // Остановка записи
                mediaRecorder.stop();
                mediaRecorder.onstop = () => {
                    const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                    audioChunks = []; // сбросить массив для следующей записи
                    const audioUrl = URL.createObjectURL(audioBlob);

                    // Сохраняем URL в узле
                    nodeElement.data('audio', audioUrl);
                };

                recordButton.textContent = 'Запись';
            }
            updateButtonPositions();
        });

        playButton.addEventListener('click', () => {
            const audioUrl = nodeElement.data('audio');
            if (audioUrl) {
                const audio = new Audio(audioUrl);
                audio.play();
            } else {
                alert('Запись не найдена!');
            }
        });

        // Добавляем кнопки в документ и обновляем их позицию
        document.body.appendChild(recordButton);
        document.body.appendChild(playButton);
        updateButtonPositions();

        // Удаление кнопок при выборе другого узла
        cy.on('tap', (event) => {
            if (!nodeElement.is(event.target)) {
                recordButton.remove();
                playButton.remove();
            }
        });

        // Обновление позиций кнопок при перемещении узла
        nodeElement.on('position', updateButtonPositions);
    }

    // Отображение кнопок при создании узла аудио
    cy.on('tap', 'node', (event) => {
        const nodeId = event.target.id();
        if (cy.getElementById(nodeId).data('type') === 'аудио') {
            displayAudioButtons(nodeId);
        }
    });
});