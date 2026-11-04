// ===== Úkolníček – frontend =====
const formular = document.getElementById('formular');
const inputNazev = document.getElementById('nazev');
const selectPriorita = document.getElementById('priorita');
const seznam = document.getElementById('seznam');
const zprava = document.getElementById('zprava');

const nazvyPriorit = { nizka: 'Nízká', stredni: 'Střední', vysoka: 'Vysoká' };

// Zobrazí hlášku pod formulářem
function ukazZpravu(text, jeChyba = true) {
  zprava.textContent = text;
  zprava.className = 'zprava ' + (jeChyba ? 'chyba' : 'ok');
}

// Načte úkoly ze serveru (GET)
async function nactiUkoly() {
  try {
    const odpoved = await fetch('/api/ukoly');
    if (!odpoved.ok) throw new Error('Server vrátil chybu ' + odpoved.status);
    const ukoly = await odpoved.json();
    vykresliUkoly(ukoly);
  } catch (err) {
    console.error(err);
    ukazZpravu('Nepodařilo se načíst úkoly. Běží server?');
  }
}

// Vykreslí seznam úkolů do stránky
function vykresliUkoly(ukoly) {
  seznam.innerHTML = '';

  if (ukoly.length === 0) {
    seznam.innerHTML = '<li class="prazdne">Zatím žádné úkoly 🎉</li>';
    return;
  }

  for (const ukol of ukoly) {
    const li = document.createElement('li');
    li.className = 'ukol' + (ukol.splneno ? ' splneno' : '');

    // Checkbox pro splnění
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = ukol.splneno;
    checkbox.addEventListener('change', () => prepniSplneni(ukol._id, checkbox.checked));

    // Název (textContent = bezpečné proti vložení HTML)
    const nazev = document.createElement('span');
    nazev.className = 'nazev';
    nazev.textContent = ukol.nazev;

    // Štítek priority
    const stitek = document.createElement('span');
    stitek.className = 'stitek ' + ukol.priorita;
    stitek.textContent = nazvyPriorit[ukol.priorita];

    // Tlačítko smazat
    const smazat = document.createElement('button');
    smazat.className = 'smazat';
    smazat.textContent = '✕';
    smazat.title = 'Smazat úkol';
    smazat.addEventListener('click', () => smazUkol(ukol._id));

    li.append(checkbox, nazev, stitek, smazat);
    seznam.appendChild(li);
  }
}

// Odeslání formuláře – vytvoření úkolu (POST)
formular.addEventListener('submit', async (e) => {
  e.preventDefault(); // zabrání reloadu stránky

  const nazev = inputNazev.value.trim();
  if (nazev === '') {
    ukazZpravu('Napiš název úkolu.');
    return;
  }

  try {
    const odpoved = await fetch('/api/ukoly', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nazev, priorita: selectPriorita.value })
    });

    const data = await odpoved.json();
    if (!odpoved.ok) throw new Error(data.chyba || 'Chyba při ukládání');

    inputNazev.value = '';
    ukazZpravu('Úkol přidán ✔', false);
    await nactiUkoly(); // seznam se aktualizuje bez reloadu
  } catch (err) {
    console.error(err);
    ukazZpravu(err.message);
  }
});

// Přepnutí splnění (PATCH)
async function prepniSplneni(id, splneno) {
  try {
    const odpoved = await fetch('/api/ukoly/' + id, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ splneno })
    });
    if (!odpoved.ok) throw new Error('Nepodařilo se upravit úkol.');
    await nactiUkoly();
  } catch (err) {
    console.error(err);
    ukazZpravu(err.message);
  }
}

// Smazání úkolu (DELETE)
async function smazUkol(id) {
  try {
    const odpoved = await fetch('/api/ukoly/' + id, { method: 'DELETE' });
    if (!odpoved.ok) throw new Error('Nepodařilo se smazat úkol.');
    await nactiUkoly();
  } catch (err) {
    console.error(err);
    ukazZpravu(err.message);
  }
}

// Po načtení stránky hned načteme úkoly
nactiUkoly();