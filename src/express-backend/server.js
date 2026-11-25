const express = require("express");
const bodyParser = require("body-parser");
const routes = require("./routes");

const app = express();
const PORT = 8000;
/**
 * CORS-мидлварь.
 * 
 * Разрешает кросс-доменные запросы с других origin.
 * В нашем случае — с http://localhost:3000 (Vite dev-server).
 * 
 * Что делает:
 * 1. Разрешает любой origin (для разработки — ок)
 * 2. Разрешает нужные заголовки (Content-Type, Authorization)
 * 3. Разрешает нужные методы (GET, POST, DELETE, OPTIONS)
 * 4. Отвечает на preflight-запрос (OPTIONS) сразу
 */
app.use((req, res, next) => {
    // Разрешаем запросы с любого origin (в проде заменить на конкретные)
    res.header("Access-Control-Allow-Origin", "*");
    
    // Разрешаем заголовки
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    
    // Разрешаем методы
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    
    // Если это preflight-запрос (OPTIONS) — сразу отвечаем OK
    // (браузер отправляет его ПЕРЕД реальным запросом)
    if (req.method === "OPTIONS") {
        return res.sendStatus(200);
    }
    
    // Идём дальше
    next();
});

app.use(bodyParser.json());
app.use("/api", routes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
