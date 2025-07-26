const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

const filePath = 'data.json';

const kingdomCaps = {
  Baratheon: 30,
  Nytheris: 25,
  Dwarven: 15,
  Lannister: 15,
  Blackfyre: 15
};

function readData() {
  try {
    const raw = fs.readFileSync(filePath);
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function writeData(data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function calculatePercentages(data) {
  const total = data.length;
  const counts = {};
  for (const kingdom of Object.keys(kingdomCaps)) counts[kingdom] = 0;
  data.forEach(entry => {
    if (counts[entry.kingdom] !== undefined) counts[entry.kingdom]++;
  });

  const percentages = {};
  for (const kingdom in counts) {
    percentages[kingdom] = total > 0 ? (counts[kingdom] / total) * 100 : 0;
  }
  return percentages;
}

app.get('/api/data', (req, res) => {
  const data = readData();
  const percentages = calculatePercentages(data);
  res.json({ data, percentages });
});

app.post('/api/submit', (req, res) => {
  const { name, kingdom } = req.body;
  if (!name || !kingdom) return res.status(400).send('Missing fields');
  const data = readData();
  const percentages = calculatePercentages(data);

  if (percentages[kingdom] >= kingdomCaps[kingdom]) {
    return res.status(403).send('Kingdom is full.');
  }

  data.push({ name, kingdom });
  writeData(data);
  res.status(200).send('Submitted');
});

app.post('/api/remove', (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).send('Missing name');
  const data = readData();
  const filtered = data.filter(entry => entry.name !== name);
  writeData(filtered);
  res.status(200).send('Removed');
});

app.get('/admin', (req, res) => {
  if (req.query.password !== 'IHATESWEM') {
    return res.status(401).send('Unauthorized');
  }
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
