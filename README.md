---
title: Z3D Discord Bot
description: Discord bot with ticket and reaction role support
tags:
  - nodejs
  - discord.js
---

# Z3dTickets

This repository contains a Discord bot for the Z3D community using [discord.js](https://discord.js.org/) with ticket and reaction role functionality.

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new)
Use Railway's "Deploy from GitHub" option to deploy this repository. Railway will
prompt you for required environment variables such as `DISCORD_TOKEN` when you

deploy. The admin interface will be served from your Railway domain at `/admin`.
Railway automatically assigns a public domain and allows custom domains on paid
plans.


## ✨ Features

- Ticket system with open/close buttons
- Reaction role assignment
- Node.js using discord.js
- Web-based admin interface for reaction roles and debug


## 💁‍♀️ How to use

- Install packages using `npm install`

- Set the `DISCORD_TOKEN` environment variable 

- Start both the bot and admin interface using `npm start`. You'll be
  prompted for the token if the environment variable is unset.
- To run just the bot use `npm run bot`.
- The admin UI alone can still be launched with `npm run admin` and then visit
  <http://localhost:3000/admin> (or your Railway domain `/admin`).


## 📝 Notes

This is a basic bot that relies on slash commands. For more details on extending the bot see the [discord.js documentation](https://discord.js.org/#/docs/main/stable/general/welcome).
The Discord token should be configured as an environment variable (e.g. when deploying on Railway) and cannot be edited through the admin UI.
