const express = require("express");
const { Client } = require("pg"); // Импортируем клиент PostgreSQL
const config = require("config");
const PORT = 5000; // Исправили регистр переменной

const app = express();

// Создаем подключение к PostgreSQL, забирая строку соединения из конфига
// const client = new Client({
//   connectionString: config.get("dbUrl"), 
// });

const start = async () => {
  try {
    // Подключаемся к базе данных PostgreSQL
    // await client.connect();
    // console.log("Успешное подключение к PostgreSQL");

    app.listen(PORT, () => {
      console.log("Сервер запустился на порту:", PORT);
    });
  } catch (e) {
    console.log("Ошибка при запуске:", e);
  }
};

start();