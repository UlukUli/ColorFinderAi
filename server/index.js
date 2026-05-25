require("dotenv").config();
const express = require("express");
const cors = require("cors");

require("./database");

const authRoutes    = require("./routes/auth.routes");
const paletteRoutes = require("./routes/palette.routes");
const aiRouter      = require("./routes/ai");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/auth",    authRoutes);
app.use("/palette", paletteRoutes);
app.use("/ai",      aiRouter);

const PORT = process.env.PORT || 5000; // Render сам задаёт PORT

app.listen(PORT, () => {
  console.log("server started");
});