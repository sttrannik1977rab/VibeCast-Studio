const jwt = require("jsonwebtoken");
const secretKey = "your_secret_key";

const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    console.log('--- AUTH MIDDLEWARE ---');
    console.log('Authorization:', authHeader);
    
    const token = authHeader?.split(" ")[1];
    console.log('Token (first 30):', token ? token.slice(0, 30) : 'НЕТ');
    
    if (!token) {
        console.log('Нет токена → 403');
        return res.status(403).json({ message: "доступ запрещен" });
    }
    
    try {
        const decoded = jwt.verify(token, secretKey);
        console.log('Decoded:', decoded);
        req.user = decoded;
        next();
    } catch (error) {
        console.log('JWT ERROR:', error.name, '-', error.message);
        return res.status(400).json({ message: "токен некорректный" });
    }
};

module.exports = authenticate;