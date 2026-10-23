/**
 * USER.JS — Модель пользователя с сохранением в файл
 * 
 * Что делает:
 * - Хранит users и favorites в памяти (для скорости)
 * - При каждом изменении — сохраняет в users.json
 * - При старте — загружает из users.json
 * 
 * Почему файл:
 * - In-memory хранилище теряет данные при перезапуске
 * - Файл переживает перезапуск
 * - Для учебного проекта — достаточно
 * - В реальном — MongoDB/PostgreSQL
 */

const fs = require('fs');
const path = require('path');

/**
 * Путь до файла с данными.
 * __dirname — это папка, где лежит User.js (models/).
 * '..', 'data', 'users.json' — поднимаемся на уровень выше, в data/.
 */
const USERS_FILE = path.join(__dirname, '..', 'data', 'users.json');

/**
 * Данные в памяти.
 * Инициализируются из файла при старте.
 */
let users = [];
let favorites = {};

/**
 * Загружает данные из файла при старте модуля.
 * Если файла нет — создаёт пустой.
 */
function loadFromFile() {
    try {
        if (fs.existsSync(USERS_FILE)) {
            const raw = fs.readFileSync(USERS_FILE, 'utf-8');
            const data = JSON.parse(raw);
            users = data.users || [];
            favorites = data.favorites || {};
            console.log(`Загружено ${users.length} пользователей из файла`);
        } else {
            // Файла нет — создаём с пустой структурой
            users = [];
            favorites = {};
            saveToFile();
            console.log('Создан пустой users.json');
        }
    } catch (error) {
        console.error('Ошибка загрузки users.json:', error);
        users = [];
        favorites = {};
    }
}

/**
 * Сохраняет текущие данные в файл.
 * Вызывается после каждого изменения users/favorites.
 */
function saveToFile() {
    try {
        // Убеждаемся, что папка data/ существует
        const dataDir = path.dirname(USERS_FILE);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        
        const data = { users, favorites };
        fs.writeFileSync(USERS_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (error) {
        console.error('Ошибка сохранения users.json:', error);
    }
}

/**
 * Модель User.
 */
const User = {
    create: (username, password, email) => {
        const user = { username, password, email };
        users.push(user);
        favorites[username] = [];
        saveToFile();   // ← СОХРАНЯЕМ
        return user;
    },

    find: (username) => {
        return users.find((user) => user.username === username);
    },

    addFavorite: (username, trackId) => {
        if (favorites[username] && !favorites[username].includes(trackId)) {
            favorites[username].push(trackId);
            saveToFile();   // ← СОХРАНЯЕМ
        }
    },

    removeFavorite: (username, trackId) => {
        if (!favorites[username]) return;
        const index = favorites[username].indexOf(trackId);
        if (index > -1) {
            favorites[username].splice(index, 1);
            saveToFile();   // ← СОХРАНЯЕМ
        }
    },

    getFavorites: (username) => {
        return favorites[username] || [];
    },
};

// Загружаем данные при старте модуля
loadFromFile();

module.exports = User;