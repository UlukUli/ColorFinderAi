const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({
      message: "Нет доступа",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "SECRET_KEY");

    req.user = decoded;

    next();
  } catch {
    res.status(401).json({
      message: "Токен невалидный",
    });
  }
};
