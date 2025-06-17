const fs = require('fs');
const path = require('path');
const express = require('express');
require('dotenv').config();

const app = express();
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));

function loadConfig() {
  return JSON.parse(fs.readFileSync('./config.json', 'utf8'));
}

function saveConfig(config) {
  fs.writeFileSync('./config.json', JSON.stringify(config, null, 2));
}

function loadEnv() {
  let env = {};
  if (fs.existsSync('.env')) {
    fs.readFileSync('.env', 'utf8').split(/\r?\n/).forEach(line => {
      const [key, ...rest] = line.split('=');
      if (key) env[key] = rest.join('=');
    });
  }
  return env;
}

app.get('/admin', (req, res) => {
  const config = loadConfig();
  res.render('admin', { config });
});

app.post('/admin/reaction-roles', (req, res) => {
  const config = loadConfig();
  config.reactionRoles = {
    messageId: '',
    messageContent: req.body.messageContent || 'React to assign yourself a role:',
    emojiRoleMap: {}
  };
  (req.body.emojis || '').split(',').forEach((emoji, idx) => {
    const roleId = (req.body.roleIds || '').split(',')[idx];
    if (emoji && roleId) config.reactionRoles.emojiRoleMap[emoji.trim()] = roleId.trim();
  });
  saveConfig(config);
  res.redirect('/admin');
});

app.get('/admin/debug', (req, res) => {
  let logs = [];
  if (fs.existsSync('./logs/tickets.json')) {
    logs = JSON.parse(fs.readFileSync('./logs/tickets.json', 'utf8'));
  }
  res.json({ env: loadEnv(), config: loadConfig(), logs });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Admin interface running on http://localhost:${PORT}/admin`);
});
