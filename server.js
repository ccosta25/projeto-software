const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();

const app = express();
app.use(cors());
app.use(express.json());

const db = new sqlite3.Database('./banco.sqlite');

db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS topicos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            materia TEXT,
            assunto TEXT,
            status TEXT
        )
    `);
});

app.post('/topicos', (req, res) => {
    const { materia, assunto } = req.body;
    db.run(
        `INSERT INTO topicos (materia, assunto, status) VALUES (?, ?, 'Pendente')`,
        [materia, assunto],
        function (err) {
            if (err) {
                return res.status(500).json({ erro: err.message });
            }
            res.json({ id: this.lastID, materia, assunto, status: 'Pendente' });
        }
    );
});

app.get('/topicos', (req, res) => {
    db.all(`SELECT * FROM topicos`, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ erro: err.message });
        }
        res.json(rows);
    });
});

app.delete('/topicos/:id', (req, res) => {
    const { id } = req.params;
    db.run("DELETE FROM topicos WHERE id = ?", id, function(err) {
        if (err) {
            return res.status(500).json({ erro: err.message });
        }
        res.json({ mensagem: "Excluído" });
    });
});

app.listen(3000, () => {
    console.log("Servidor rodando na porta 3000");
});