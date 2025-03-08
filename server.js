const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public'))); // Теперь статические файлы только из public

// Простая база данных в памяти
let requests = [];
let nextId = 1;

// Учетные данные администратора из переменных окружения
const ADMIN_CREDENTIALS = {
    username: process.env.ADMIN_USERNAME,
    password: process.env.ADMIN_PASSWORD
};

// Middleware для проверки JWT токена
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Требуется авторизация' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Недействительный токен' });
        }
        req.user = user;
        next();
    });
};

// Маршруты аутентификации
app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;

    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
        const token = jwt.sign({ username }, process.env.JWT_SECRET, { expiresIn: '24h' });
        res.json({ token });
    } else {
        res.status(401).json({ error: 'Неверные учетные данные' });
    }
});

app.get('/api/auth/check', authenticateToken, (req, res) => {
    res.json({ valid: true });
});

// Маршруты для работы с заявками
app.post('/api/requests', (req, res) => {
    const request = {
        id: nextId++,
        ...req.body,
        status: 'new',
        date: new Date().toISOString()
    };
    requests.push(request);
    res.status(201).json(request);
});

app.get('/api/requests', authenticateToken, (req, res) => {
    res.json({
        requests: requests,
        total: requests.length
    });
});

app.patch('/api/requests/:id', authenticateToken, (req, res) => {
    const id = parseInt(req.params.id);
    const requestIndex = requests.findIndex(r => r.id === id);

    if (requestIndex === -1) {
        return res.status(404).json({ error: 'Заявка не найдена' });
    }

    requests[requestIndex] = {
        ...requests[requestIndex],
        ...req.body
    };

    res.json(requests[requestIndex]);
});

app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
}); 