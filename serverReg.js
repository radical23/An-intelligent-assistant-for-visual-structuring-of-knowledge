const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const bodyParser = require("body-parser");
const fs = require("fs");

const app = express();
const dbPath = "C:/lab2_SAI/db/users.db";

// Проверяем наличие папки, если её нет, создаем
const dbDir = "C:/lab2_SAI/db";
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath);

// Настройка middlewares
app.use(bodyParser.json());
app.use(express.static(__dirname));

// Проверка наличия таблицы (она создается, если нет)
db.run(
    `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        login TEXT NOT NULL,
        fio TEXT NOT NULL,
        email TEXT NOT NULL,
        password TEXT NOT NULL
    )`
);

// Маршрут для отдачи HTML формы
app.get("/", (req, res) => {
    res.sendFile(__dirname + "/registerForm.html"); // Укажите путь к вашему HTML файлу
});

// Маршрут для регистрации
app.post("/register", (req, res) => {
    const { login, fio, email, password } = req.body;

    if (!login || !fio || !email || !password) {
        return res.status(400).json({ message: "Все поля обязательны!" });
    }

    const hashedPassword = password; // Здесь можно добавить хэширование пароля

    // Вставка данных в базу
    db.run(
        `INSERT INTO users (login, fio, email, password) VALUES (?, ?, ?, ?)`, [login, fio, email, hashedPassword],
        function(err) {
            if (err) {
                console.error("Ошибка при вставке данных:", err);
                return res.status(500).json({ message: "Ошибка сохранения данных." });
            }
            res.status(201).json({ message: "Регистрация успешна!" });
        }
    );
});

// Запуск сервера
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
});