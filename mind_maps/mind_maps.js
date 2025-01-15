    var minWidth = 150;
    var minHeight = 50;

    var width = window.innerWidth;
    var height = window.innerHeight;

    var nodes = []; // Массив для хранения всех узлов
    var links = []; // Массив для хранения всех связей

    var work_space = d3.select("body")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .style("border", "1px solid black");

    // Создаем элемент контекстного меню
    var contextMenu = d3.select("body").append("div")
        .attr("id", "context-menu")
        .style("position", "absolute")
        .style("display", "none")
        .style("background", "white")
        .style("border", "1px solid black")
        .style("padding", "5px")
        .style("z-index", 1000)
        .html(`
            <button id="record-button">Запись</button>
            <button id="play-button">Воспроизвести</button>
        `);

    // Обработчик для записи аудио
    d3.select("#record-button").on("click", function() {
        var node = d3.select("#context-menu").datum(); // Получаем узел из контекстного меню
        recordAudio(node);
    });

    // Обработчик для воспроизведения аудио
    d3.select("#play-button").on("click", function() {
        var node = d3.select("#context-menu").datum(); // Получаем узел из контекстного меню
        playAudio(node);
    });

    // Функция для создания контекстного меню
    function showContextMenu(x, y, node) {
        var menu = d3.select("#context-menu");
        menu.style("left", x + "px")
            .style("top", y + "px")
            .style("display", "block")
            .datum(node); // Сохраняем узел в меню для доступа к его данным

        d3.event.preventDefault(); // Предотвращаем стандартное меню браузера
    }

    // Функция для скрытия контекстного меню
    function hideContextMenu() {
        d3.select("#context-menu").style("display", "none");
    }


    async function recordAudio(node) {
        let mediaRecorder;
        let audioChunks = [];

        // Получение разрешения на использование микрофона
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);

        mediaRecorder.ondataavailable = (event) => {
            audioChunks.push(event.data);
        };

        mediaRecorder.start();

        // Меняем текст на кнопке и добавляем обработчик для "Стоп"
        d3.select("#record-button")
            .text("Стоп")
            .on("click", function() {
                mediaRecorder.stop(); // Останавливаем запись

                mediaRecorder.onstop = () => {
                    const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                    audioChunks = [];
                    const audioUrl = URL.createObjectURL(audioBlob);
                    node.audioUrl = audioUrl; // Сохраняем URL в узле
                    console.log("Запись завершена, URL:", audioUrl);
                    hideContextMenu(); // Скрываем меню после завершения записи
                };
            });

        // После остановки записи восстанавливаем текст кнопки
        mediaRecorder.onstop = () => {
            d3.select("#record-button").text("Запись");
        };
    }


    // Функция воспроизведения аудио
    function playAudio(node) {
        if (node.audioUrl) {
            const audio = new Audio(node.audioUrl);
            audio.play();
        } else {
            alert("Нет доступной записи.");
        }
        hideContextMenu(); // Скрываем меню после воспроизведения
    }

    function createNode(x, y) {
        var Rect_data = {
            x: x,
            y: y,
            width: 200,
            height: 50,
            text: "Напишите текст" // Добавляем свойство для текста
        };

        // Прямоугольник
        var rect = work_space.append("rect")
            .attr("x", Rect_data.x)
            .attr("y", Rect_data.y)
            .attr("width", Rect_data.width)
            .attr("height", Rect_data.height)
            .attr("fill", "#d3d3d3")
            .on("contextmenu", function() {
                showContextMenu(d3.event.pageX, d3.event.pageY, Rect_data);
            })
            .call(d3.behavior.drag()
                .on("drag", function() {
                    Rect_data.x = d3.event.x;
                    Rect_data.y = d3.event.y;
                    d3.select(this)
                        .attr("x", Rect_data.x)
                        .attr("y", Rect_data.y);
                    updateLinkedElements();
                })
            );

        // Текст внутри прямоугольника
        var text_rect = work_space.append("text")
            .attr("x", Rect_data.x + 10)
            .attr("y", Rect_data.y + 30)
            .attr("font-size", "20px")
            .attr("fill", "grey")
            .text(Rect_data.text) // Используем значение из Rect_data
            .on("click", function() {
                showInputField(d3.select(this), Rect_data); // Показываем поле ввода
            });

        // Кнопка изменения размера
        var resizable_rect = work_space.append("circle")
            .attr("cx", Rect_data.x + Rect_data.width)
            .attr("cy", Rect_data.y + Rect_data.height)
            .attr("r", 5)
            .attr("fill", "blue")
            .call(d3.behavior.drag()
                .on("drag", function() {
                    var newWidth = d3.event.x - Rect_data.x;
                    var newHeight = d3.event.y - Rect_data.y;

                    if (newWidth > minWidth && newHeight > minHeight) {
                        Rect_data.width = newWidth;
                        Rect_data.height = newHeight;

                        rect.attr("width", newWidth).attr("height", newHeight);
                        updateLinkedElements();
                    }
                })
            );

        // Кнопка для создания связи
        var addLinkButton = work_space.append("circle")
            .attr("cx", Rect_data.x + Rect_data.width)
            .attr("cy", Rect_data.y + Rect_data.height / 2)
            .attr("r", 5)
            .attr("fill", "red")
            .on("click", function() {
                var newX = Rect_data.x + Rect_data.width + 50;
                var newY = Rect_data.y;

                var newNode = createNode(newX, newY);

                // создаем линию, соединяющую исходный узел и новый узел
                var link = work_space.append("line")
                    .attr("x1", Rect_data.x + Rect_data.width)
                    .attr("y1", Rect_data.y + Rect_data.height / 2)
                    .attr("x2", newNode.x)
                    .attr("y2", newNode.y + newNode.height / 2)
                    .attr("stroke", "black")
                    .attr("stroke-width", 2);

                links.push({ source: Rect_data, target: newNode, line: link });
            });

        // Функция обновления связанных элементов
        function updateLinkedElements() {
            resizable_rect
                .attr("cx", Rect_data.x + Rect_data.width)
                .attr("cy", Rect_data.y + Rect_data.height);

            addLinkButton
                .attr("cx", Rect_data.x + Rect_data.width)
                .attr("cy", Rect_data.y + Rect_data.height / 2);

            text_rect
                .attr("x", Rect_data.x + 10)
                .attr("y", Rect_data.y + 30);

            // Обновляем все линии, связанные с этим узлом
            links.forEach(function(link) {
                if (link.source === Rect_data) {
                    link.line.attr("x1", Rect_data.x + Rect_data.width)
                        .attr("y1", Rect_data.y + Rect_data.height / 2);
                } else if (link.target === Rect_data) {
                    link.line.attr("x2", Rect_data.x)
                        .attr("y2", Rect_data.y + Rect_data.height / 2);
                }
            });
        }

        nodes.push(Rect_data);
        return Rect_data;
    }

    function showInputField(textElement, rectData) {
        // Получаем текущие координаты текста
        const bbox = textElement.node().getBBox();

        // Создаем элемент <input> поверх SVG
        const svgOffset = d3.select("svg").node().getBoundingClientRect(); // Вычисляем смещение SVG

        const input = d3.select("body")
            .append("input")
            .attr("type", "text")
            .attr("value", rectData.text || textElement.text()) // Используем текст из rectData, если он есть
            .style("position", "absolute")
            .style("left", (bbox.x + svgOffset.left) + "px") // Учитываем смещение SVG
            .style("top", (bbox.y + svgOffset.top) + "px") // Учитываем смещение SVG
            .style("width", Math.max(bbox.width, 150) + "px") // Увеличиваем ширину, если текст длиннее
            .style("font-size", "20px");

        // Устанавливаем фокус на поле ввода
        input.node().focus();

        // Обработчик завершения ввода (по нажатию Enter)

        input.on("keydown", function() {

            if (d3.event.key === "Enter") {
                const newText = input.node().value.trim(); // Получаем текст из поля ввода и обрезаем пробелы

                if (newText) {
                    rectData.text = newText; // Сохраняем текст в данных прямоугольника
                    textElement.text(newText); // Обновляем текст в элементе <text>
                } else {
                    alert("Текст не может быть пустым!"); // Защита от пустого ввода
                }

                input.remove(); // Удаляем поле ввода
                d3.event.preventDefault(); // Предотвращаем дальнейшую обработку события
            }
        });


    }

    // Создаем первый узел
    createNode(width / 2, height / 2);

    // Скрываем контекстное меню при клике в любом месте
    d3.select("body").on("click", hideContextMenu);

    // Функция для сохранения графа
    // Функция для сохранения графа
    async function saveGraph() {
        const graphData = {
            graphName: "Граф 1", // Добавляем имя графа
            nodes: nodes.map(node => ({
                x: node.x,
                y: node.y,
                width: node.width,
                height: node.height,
                text: node.text,
                audioUrl: node.audioUrl || null, // Добавляем audioUrl, если он есть
            })),
            links: links.map(link => ({
                source: nodes.indexOf(link.source), // Индексы узлов
                target: nodes.indexOf(link.target),
            }))
        };

        try {
            const response = await fetch("http://localhost:3000/save-graph", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(graphData),
            });

            if (response.ok) {
                alert("Граф успешно сохранён!");
            } else {
                const errorData = await response.json();
                alert("Ошибка сохранения: " + errorData.message);
            }
        } catch (error) {
            console.error("Ошибка при сохранении графа:", error);
            alert("Не удалось соединиться с сервером.");
        }
    }


    // Добавляем кнопку для сохранения графа
    const saveButton = d3.select("body")
        .append("button")
        .text("Сохранить граф")
        .style("position", "absolute")
        .style("top", "10px")
        .style("right", "10px")
        .on("click", saveGraph);