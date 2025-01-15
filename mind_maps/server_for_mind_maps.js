const express = require("express");
const { MongoClient } = require("mongodb");
const cors = require("cors"); // Импортируем CORS

const app = express();
const PORT = 3000;
const MONGO_URI = "mongodb://127.0.0.1:27017"; // Замените, если нужно
const DB_NAME = "my_database"; // Имя вашей базы данных
let db;

// Включаем CORS
app.use(cors()); // Разрешает все источники
app.use(express.json());

// Подключение к MongoDB
MongoClient.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(client => {
        console.log("Успешно подключено к MongoDB");
        db = client.db(DB_NAME);

        // Создаём индекс для поиска графов по имени
        db.collection("graphs").createIndex({ graphName: 1 }, (err, result) => {
            if (err) {
                console.error("Ошибка при создании индекса:", err);
            } else {
                console.log("Индекс создан:", result);
            }
        });

        // (Опционально) Добавляем валидацию для коллекции graphs
        db.command({
            collMod: "graphs",
            validator: {
                $jsonSchema: {
                    bsonType: "object",
                    required: ["graphName", "nodes", "links"],
                    properties: {
                        graphName: {
                            bsonType: "string",
                            description: "Название графа должно быть строкой"
                        },
                        nodes: {
                            bsonType: "array",
                            description: "Список узлов должен быть массивом"
                        },
                        links: {
                            bsonType: "array",
                            description: "Список связей должен быть массивом"
                        }
                    }
                }
            },
            validationLevel: "moderate"
        }, (err, result) => {
            if (err) {
                console.error("Ошибка при добавлении валидации:", err);
            } else {
                console.log("Валидация добавлена:", result);
            }
        });
    })
    .catch(err => console.error("Ошибка подключения к MongoDB:", err));

// Маршрут для сохранения графа
app.post("/save-graph", (req, res) => {
    const graphData = req.body;

    db.collection("graphs").insertOne(graphData)
        .then(result => {
            console.log("Граф успешно сохранён:", result.insertedId);
            res.status(201).send({ message: "Граф сохранён!", id: result.insertedId });
        })
        .catch(err => {
            console.error("Ошибка сохранения графа:", err);
            res.status(500).send({ error: "Ошибка сохранения графа" });
        });
});

// Новый маршрут для загрузки сохранённых графов
app.get("/load-graphs", (req, res) => {
    db.collection("graphs").find({}).toArray()
        .then(graphs => {
            res.status(200).json(graphs); // Возвращаем графы в формате JSON
        })
        .catch(err => {
            console.error("Ошибка получения графов:", err);
            res.status(500).send({ error: "Ошибка получения графов" });
        });
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
});