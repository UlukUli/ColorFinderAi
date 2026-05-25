const router = require("express").Router();

const db = require("../database");

const auth = require("../middleware/auth");


router.delete("/delete/:id", auth, (req, res) => {
  const paletteId = req.params.id;
  const userId = req.user.id;

  db.run(
    `
      DELETE FROM palettes
      WHERE id = ? AND userId = ?
      `,
    [paletteId, userId],
    function (err) {
      if (err) {
        return res.status(500).json({ message: "Ошибка базы данных" });
      }

      if (this.changes === 0) {
        return res
          .status(44)
          .json({ message: "Палетка не найдена или у вас нет прав" });
      }

      res.json({ success: true, message: "Палетка удалена" });
    },
  );
});

router.post("/save", auth, (req, res) => {
  const { colors } = req.body;
  let { name } = req.body;
  const userId = req.user.id;

  db.get(
    `
      SELECT COUNT(*) as count 
      FROM palettes 
      WHERE userId = ?
      `,
    [userId],
    (err, row) => {
      if (err) {
        return res.status(500).json({ message: "Ошибка сервера" });
      }

      if (!name || name.trim() === "") {
        const nextNumber = (row ? row.count : 0) + 1;
        name = `Palette #${nextNumber}`;
      }

      db.run(
        `
          INSERT INTO palettes
          (userId, name, colors)
          VALUES (?, ?, ?)
          `,
        [userId, name, JSON.stringify(colors)],
        function (err) {
          if (err) {
            return res.status(500).json({ message: "Не удалось сохранить" });
          }

          res.json({
            success: true,
            palette: {
              id: this.lastID,
              name: name,
              colors: colors,
            },
          });
        },
      );
    },
  );
});

router.get("/my", auth, (req, res) => {
  db.all(
    `
SELECT *
FROM palettes
WHERE userId=?
ORDER BY id DESC
`,
    [req.user.id],

    (err, rows) => {
      res.json(
        rows.map((p) => ({
          ...p,

          colors: JSON.parse(p.colors),
        })),
      );
    },
  );
});

module.exports = router;
