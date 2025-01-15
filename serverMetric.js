const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors'); // Импортируем cors
const app = express();
const port = 3002;

// Используем cors middleware
app.use(cors());

let metrics = {
    pageVisits: 0,
    totalTimeOnPage: 0,
};

app.use(bodyParser.json());

// Эндпоинт для получения метрик
app.post('/metrics', (req, res) => {
    const { timeSpent } = req.body;
    metrics.pageVisits++;
    metrics.totalTimeOnPage += timeSpent;
    res.sendStatus(200);
});

// Эндпоинт для Prometheus
app.get('/metrics', (req, res) => {
    res.set('Content-Type', 'text/plain');
    res.send(`page_visits ${metrics.pageVisits}\ntotal_time_on_page ${metrics.totalTimeOnPage}`);
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});