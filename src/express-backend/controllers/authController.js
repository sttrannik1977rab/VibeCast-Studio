const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const secretKey = "your_secret_key";

/**
 * Регистрация нового пользователя.
 * 
 * Принимает: { username, password, email }
 * Возвращает: { message, user: { username, email } }
 */
const register = (req, res) => {
  const { username, password, email } = req.body;   // ← добавили email
  const existingUser = User.find(username);

  if (existingUser) {
    return res.status(400).json({ message: "пользователь уже существует" });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  const newUser = User.create(username, hashedPassword, email);   // ← передаём email

  return res
    .status(201)
    .json({ 
      message: "пользователь успешно добавлен", 
      user: { username: newUser.username, email: newUser.email },   // ← не возвращаем password
    });
};

/**
 * Логин пользователя.
 * 
 * Принимает: { username, password }
 * Возвращает: { message, token }
 * 
 * В JWT payload: { username, email }
 */
const login = (req, res) => {
  const { username, password } = req.body;
  const user = User.find(username);

  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res
      .status(400)
      .json({ message: "произошла ошибка при авторизации - неверные данные" });
  }

  // Кладём в payload username И email
  const token = jwt.sign(
    { username: user.username, email: user.email },   // ← добавили email
    secretKey, 
    { expiresIn: "1h" }
  );
  
  return res.json({ message: "авторизация прошла успешно", token });
};

module.exports = { register, login };