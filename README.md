# Credits – globális Discord bot

Node.js + discord.js alapú Discord bot **globális slash parancsokkal**. Egyszer regisztrálod, és minden szerveren működik, ahová meghívod. A kreditek is globálisak: egy felhasználó egyenlege minden szerveren ugyanaz.

## Parancsok

| Parancs | Leírás |
|---|---|
| `/ping` | Késleltetés mérése |
| `/help` | Parancslista |
| `/balance [user]` | Saját vagy másik felhasználó egyenlege |
| `/daily` | Napi kreditjutalom (24 óránként) |
| `/pay <user> <amount>` | Kredit küldése |
| `/leaderboard` | Globális top 10 |
| `/admin add/remove <user> <amount>` | Kreditkezelés (csak adminisztrátoroknak) |

## Beüzemelés

1. **Bot létrehozása**: [Discord Developer Portal](https://discord.com/developers/applications) → *New Application* → *Bot* fül → *Reset Token*, és másold ki a tokent. Az *Application ID* a *General Information* oldalon van.
2. **Beállítás**:
   ```bash
   cp .env.example .env
   # töltsd ki a DISCORD_TOKEN és CLIENT_ID értékeket
   npm install
   ```
3. **Parancsok regisztrálása** (egyszer, illetve minden parancsmódosítás után):
   ```bash
   npm run deploy
   ```
   `GUILD_ID` nélkül globálisan regisztrál (minden szerverre, kb. 1 óra alatt frissül). Teszteléshez add meg a `GUILD_ID`-t a `.env`-ben, ekkor azonnal megjelennek azon a szerveren.
4. **Indítás**:
   ```bash
   npm start
   ```
5. **Meghívás szerverre**: Developer Portal → *OAuth2* → *URL Generator* → pipáld be a `bot` és `applications.commands` scope-ot, a jogok közül elég a *Send Messages* és *Embed Links*. A kapott linkkel bárki meghívhatja a botot a saját szerverére.

## Ellenőrzés token nélkül

```bash
npm run check
```
Szintaxisellenőrzés, a kreditrendszer egységtesztje és a parancsok betöltése.

## Szerkezet

```
src/
  index.js            # belépési pont, kliens + eseménykezelők
  deploy-commands.js  # slash parancsok regisztrálása (globális vagy guild)
  commands/           # egy fájl = egy parancs ({ data, execute })
  events/             # Discord események (ready, interactionCreate, guildCreate)
  lib/
    config.js         # .env beolvasás
    db.js             # fájl alapú JSON kredit-adatbázis (data/credits.json)
    format.js         # formázó segédfunkciók
    loadCommands.js   # parancsbetöltő
    selftest.js       # önellenőrzés
```

Új parancs: hozz létre egy fájlt a `src/commands/` mappában `data` (SlashCommandBuilder) és `execute(interaction)` exporttal, majd futtasd az `npm run deploy` parancsot.

## Futtatás állandóan

Hosztolható bármilyen Node.js-t támogató gépen vagy szolgáltatón (Railway, Render, VPS, Raspberry Pi). Példa `pm2`-vel:
```bash
npm i -g pm2
pm2 start src/index.js --name credits-bot
```
