const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const db = new sqlite3.Database(path.join(__dirname, 'banco.sqlite'));
const porta = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

function validarTopico(dados) {
    const materia = typeof dados?.materia === 'string' ? dados.materia.trim() : '';
    const assunto = typeof dados?.assunto === 'string' ? dados.assunto.trim() : '';

    if (!materia || !assunto) {
        return { erro: 'Preencha a matéria e o assunto.' };
    }

    if (materia.length > 80 || assunto.length > 120) {
        return { erro: 'A matéria deve ter até 80 caracteres e o assunto até 120.' };
    }

    return { materia, assunto };
}

function validarId(req, res, next) {
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id < 1) {
        return res.status(400).json({ erro: 'Identificador inválido.' });
    }

    req.topicoId = id;
    next();
}

db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS topicos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            materia TEXT NOT NULL,
            assunto TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'Pendente'
        )
    `);
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/topicos', (req, res) => {
    db.all('SELECT * FROM topicos ORDER BY id DESC', [], (erro, linhas) => {
        if (erro) {
            return res.status(500).json({ erro: 'Não foi possível carregar as matérias.' });
        }

        res.json(linhas);
    });
});

app.post('/topicos', (req, res) => {
    const topico = validarTopico(req.body);

    if (topico.erro) {
        return res.status(400).json({ erro: topico.erro });
    }

    db.run(
        "INSERT INTO topicos (materia, assunto, status) VALUES (?, ?, 'Pendente')",
        [topico.materia, topico.assunto],
        function (erro) {
            if (erro) {
                return res.status(500).json({ erro: 'Não foi possível cadastrar a matéria.' });
            }

            res.status(201).json({ id: this.lastID, ...topico, status: 'Pendente' });
        }
    );
});

app.put('/topicos/:id', validarId, (req, res) => {
    const topico = validarTopico(req.body);

    if (topico.erro) {
        return res.status(400).json({ erro: topico.erro });
    }

    db.run(
        'UPDATE topicos SET materia = ?, assunto = ? WHERE id = ?',
        [topico.materia, topico.assunto, req.topicoId],
        function (erro) {
            if (erro) {
                return res.status(500).json({ erro: 'Não foi possível atualizar a matéria.' });
            }

            if (this.changes === 0) {
                return res.status(404).json({ erro: 'Matéria não encontrada.' });
            }

            db.get('SELECT * FROM topicos WHERE id = ?', [req.topicoId], (erroConsulta, linha) => {
                if (erroConsulta) {
                    return res.status(500).json({ erro: 'Não foi possível consultar a matéria atualizada.' });
                }

                res.json(linha);
            });
        }
    );
});

app.delete('/topicos/:id', validarId, (req, res) => {
    db.run('DELETE FROM topicos WHERE id = ?', [req.topicoId], function (erro) {
        if (erro) {
            return res.status(500).json({ erro: 'Não foi possível excluir a matéria.' });
        }

        if (this.changes === 0) {
            return res.status(404).json({ erro: 'Matéria não encontrada.' });
        }

        res.json({ mensagem: 'Matéria excluída com sucesso.' });
    });
});

app.listen(porta, () => {
    console.log(`Gerenciador de Estudos disponível em http://localhost:${porta}`);
});
