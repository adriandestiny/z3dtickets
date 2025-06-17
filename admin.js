const fs = require('fs');
const path = require('path');
const express = require('express');
require('dotenv').config();

const app = express();
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
// middleware ─────────────────────────────────────────
app.use(express.urlencoded({ extended: true }));

// helpers ─────────────────────────────────────────────
function loadConfig() {
  return JSON.parse(fs.readFileSync('./config.json', 'utf8'));
}

function saveConfig(config) {
  fs.writeFileSync('./config.json', JSON.stringify(config, null, 2));
}

function loadEnv() {
  const env = {};
  if (fs.existsSync('.env')) {
    fs.readFileSync('.env', 'utf8')
      .split(/\r?\n/)
      .filter(Boolean)
      .forEach(line => {
        const [key, ...rest] = line.split('=');
        if (key) env[key] = rest.join('=');
      });
  }
  return env;
}

function saveEnv(env) {
  fs.writeFileSync(
    '.env',
    Object.entries(env)
      .map(([k, v]) => `${k}=${v}`)
      .join('\n')
  );
}

// routes ──────────────────────────────────────────────

// admin dashboard
app.get('/admin', (req, res) => {
  const config = loadConfig();
  const env    = loadEnv();
  res.render('admin', { config, env });
});

// update bot credentials (.env)
app.post('/admin/credentials', (req, res) => {
  const env = loadEnv();
  env.DISCORD_TOKEN = (req.body.DISCORD_TOKEN || '').trim();
  saveEnv(env);
  res.redirect('/admin');
});

// update reaction-role mapping
app.post('/admin/reaction-roles', (req, res) => {
  const config = loadConfig();
  config.reactionRoles = {
    messageId: '',
    messageContent: req.body.messageContent
      || 'React to assign yourself a role:',
    emojiRoleMap: {}
  };

  const emojis  = (req.body.emojis   || '').split(',');
  const roleIds = (req.body.roleIds  || '').split(',');

  emojis.forEach((emoji, idx) => {
    if (emoji && roleIds[idx]) {
      config.reactionRoles.emojiRoleMap[emoji.trim()] = roleIds[idx].trim();
    }
  });

  saveConfig(config);
  res.redirect('/admin');
});

// quick debug dump
app.get('/admin/debug', (req, res) => {
  let logs = [];
  if (fs.existsSync('./logs/tickets.json')) {
    logs = JSON.parse(fs.readFileSync('./logs/tickets.json', 'utf8'));
  }
  res.json({ env: loadEnv(), config: loadConfig(), logs });
});

// server bootstrap ───────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Admin interface running on http://localhost:${PORT}/admin`);
});