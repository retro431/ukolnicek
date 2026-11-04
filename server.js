// ===== Úkolníček – backend (Express + MongoDB/Mongoose) =====
const express = require('express');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;
// Adresa databáze – lokální MongoDB, nebo si sem dej odkaz z MongoDB Atlas
   const MONGODB_URI = 'mongodb+srv://adamkratochvil29_db_user:TGMk71Zi6CtIwbhU@cluster0.rsfjazu.mongodb.net/ukolnicek';
TGMk71Zi6CtIwbhU
// ----- Middleware -----
app.use(express.json());            // parsování JSON v těle požadavku
app.use(express.static('public'));  // servírování frontendu ze složky public

// ----- Model (schéma) úkolu -----
const ukolSchema = new mongoose.Schema(
  {
    nazev: { type: String, required: true, trim: true },
    priorita: { type: String, enum: ['nizka', 'stredni', 'vysoka'], default: 'stredni' },
    splneno: { type: Boolean, default: false }
  },
  { timestamps: true } // automaticky přidá createdAt a updatedAt
);

const Ukol = mongoose.model('Ukol', ukolSchema);

// ----- API endpointy -----

// GET – vrátí všechny úkoly (nejnovější nahoře)
app.get('/api/ukoly', async (req, res) => {
  try {
    const ukoly = await Ukol.find().sort({ createdAt: -1 });
    res.json(ukoly);
  } catch (err) {
    console.error(err);
    res.status(500).json({ chyba: 'Nepodařilo se načíst úkoly.' });
  }
});

// POST – vytvoří nový úkol (s validací)
app.post('/api/ukoly', async (req, res) => {
  try {
    const { nazev, priorita } = req.body;

    // Validace – název nesmí být prázdný
    if (!nazev || nazev.trim() === '') {
      return res.status(400).json({ chyba: 'Název úkolu nesmí být prázdný.' });
    }
    // Validace – priorita musí být jedna z povolených hodnot
    const povolenePriority = ['nizka', 'stredni', 'vysoka'];
    if (priorita && !povolenePriority.includes(priorita)) {
      return res.status(400).json({ chyba: 'Neplatná priorita.' });
    }

    const novyUkol = await Ukol.create({ nazev: nazev.trim(), priorita });
    res.status(201).json(novyUkol);
  } catch (err) {
    console.error(err);
    res.status(500).json({ chyba: 'Nepodařilo se uložit úkol.' });
  }
});

// PATCH – přepne stav splnění úkolu (bonus)
app.patch('/api/ukoly/:id', async (req, res) => {
  try {
    const { splneno } = req.body;
    if (typeof splneno !== 'boolean') {
      return res.status(400).json({ chyba: 'Hodnota "splneno" musí být true nebo false.' });
    }
    const ukol = await Ukol.findByIdAndUpdate(req.params.id, { splneno }, { returnDocument: 'after' });
    if (!ukol) return res.status(404).json({ chyba: 'Úkol nenalezen.' });
    res.json(ukol);
  } catch (err) {
    console.error(err);
    res.status(500).json({ chyba: 'Nepodařilo se upravit úkol.' });
  }
});

// DELETE – smaže úkol (bonus)
app.delete('/api/ukoly/:id', async (req, res) => {
  try {
    const ukol = await Ukol.findByIdAndDelete(req.params.id);
    if (!ukol) return res.status(404).json({ chyba: 'Úkol nenalezen.' });
    res.json({ zprava: 'Úkol smazán.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ chyba: 'Nepodařilo se smazat úkol.' });
  }
});

// ----- Připojení k databázi a spuštění serveru -----
async function start() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Připojeno k MongoDB');
    app.listen(PORT, () => {
      console.log(`🚀 Server běží na http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('❌ Nepodařilo se připojit k MongoDB:', err.message);
    process.exit(1);
  }
}

start();