const express = require('express');
const neo4j = require('neo4j-driver');
const fetch = require('node-fetch'); // Для взаимодействия с FastAPI
const bodyParser = require('body-parser'); // Для обработки POST-запросов

const app = express();
const port = 3000;

// Подключение к базе данных Neo4j
const driver = neo4j.driver('neo4j://localhost', neo4j.auth.basic('neo4j', '12345678'));
const session = driver.session();

// Использование bodyParser для обработки JSON
app.use(bodyParser.json());

// Маршрут для тестирования подключения
app.get('/', (req, res) => {
    res.send('Hello, world!');
});

// Маршрут для получения данных из Neo4j 
app.get('/nodes', async(req, res) => {
    try {
        const result = await session.run('MATCH (n) RETURN n LIMIT 10');
        const nodes = result.records.map(record => record.get('n'));
        res.json(nodes);
    } catch (error) {
        console.error('Error fetching data from Neo4j:', error);
        res.status(500).send('Error fetching data');
    }
});

// Маршрут для отправки текста на FastAPI и получения изображения
app.post('/generate-image', async(req, res) => {
    const { text } = req.body;

    if (!text) {
        return res.status(400).send({ error: 'Text must not be empty' });
    }

    try {
        const response = await fetch('http://127.0.0.1:8000/model-generate-map', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text }),
        });

        if (!response.ok) {
            throw new Error(`FastAPI server error: ${response.statusText}`);
        }

        const imageBuffer = await response.buffer();
        res.set('Content-Type', 'image/png');
        res.send(imageBuffer);
    } catch (error) {
        console.error('Error generating image:', error);
        res.status(500).send({ error: 'Error generating image' });
    }
});

// Запуск сервера
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});