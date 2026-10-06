# ☄️ Meteor bot

Teljes értékű, **globális** Discord bot: egyszer regisztrálod, minden szerveren működik, ahová meghívják.

- 💰 **Globális gazdaság** – a kreditegyenleg minden szerveren közös: `/daily`, `/work`, `/pay`, `/shop`, `/buy`, `/inventory`, `/coinflip`, `/slots`, `/history`, `/leaderboard`
- 🛡️ **Szervervédelem** – anti-spam automatikus timeouttal, anti-raid (tömeges belépés), meghívó-/link-/szószűrő, minimum fiókkor
- ⚖️ **Moderáció** – `/ban`, `/unban`, `/kick`, `/timeout`, `/untimeout`, `/warn` (3. figyelmeztetés → 1 óra timeout, 5. → kick), `/warnings`, `/purge`, `/lock`, `/modlog`, log csatorna
- ⭐ **Szintrendszer** – XP az üzenetekért, szintlépés-értesítés, `/rank`, `/levels`
- 👋 **Üdvözlő üzenet** – testreszabható, `{user} {server} {count}` változókkal
- 🌐 **Weboldal + vezérlőpult** – Discord-bejelentkezéssel minden beállítás böngészőből, moderációs napló, szintek, nyilvános toplista, JSON API
- 🗄️ **SQLite adatbázis** – minden adat egy fájlban (`data/meteor.sqlite`), WAL móddal, tranzakciókkal
- 🔒 **Biztonság** – CSRF-védelem, rate limit, helmet fejlécek, session rotáció, jogosultság-ellenőrzés minden moderációs műveletnél, `/admin` csak a bot tulajdonosának

## Parancsok (30)

| Kategória | Parancsok |
|---|---|
| 💰 Gazdaság | `balance` `daily` `work` `pay` `shop` `buy` `inventory` `history` `coinflip` `slots` `leaderboard` `admin` |
| 🛡️ Moderáció | `ban` `unban` `kick` `timeout` `untimeout` `warn` `warnings` `purge` `lock` `modlog` |
| ⚙️ Beállítások | `setup view/logchannel/welcome/antispam/filters/badwords/antiraid/xp` |
| 🔧 Egyéb | `ping` `help` `userinfo` `serverinfo` `rank` `levels` `dashboard` |

## Beüzemelés

### 1. Discord alkalmazás
1. [Discord Developer Portal](https://discord.com/developers/applications) → **New Application** → nevezd el: *Meteor bot*.
2. **Bot** fül → **Reset Token** → másold ki (`DISCORD_TOKEN`).
3. Ugyanitt a **Privileged Gateway Intents** alatt kapcsold be: **Server Members Intent** és **Message Content Intent** (ezek nélkül az anti-spam, a szűrők, az XP és az anti-raid nem működik).
4. **General Information** → **Application ID** (`CLIENT_ID`).
5. **OAuth2** → **Client Secret** → Reset (`CLIENT_SECRET`), és a **Redirects** listához add hozzá: `<BASE_URL>/callback` (pl. `http://localhost:3000/callback`).

### 2. Telepítés
```bash
npm install
cp .env.example .env
# töltsd ki: DISCORD_TOKEN, CLIENT_ID, CLIENT_SECRET, OWNER_IDS, SESSION_SECRET
# SESSION_SECRET generálása: openssl rand -hex 32
```

### 3. Parancsok regisztrálása és indítás
```bash
npm run deploy   # globálisan (GUILD_ID nélkül) – kb. 1 órán belül jelenik meg minden szerveren
npm start
```
Teszteléshez add meg a `GUILD_ID`-t a `.env`-ben, így a parancsok azonnal megjelennek azon a szerveren.

### 4. Meghívás
A weboldal főoldalán a **Meghívás** gomb a megfelelő jogokkal generált linket adja. Kézzel: OAuth2 → URL Generator → `bot` + `applications.commands` scope, jogok: Kick, Ban, Manage Channels, Manage Messages, Moderate Members, Send Messages, Embed Links, Read Message History.

### 5. Weboldal
Alapból a `http://localhost:3000` címen fut. Nyilvános címhez állítsd a `BASE_URL`-t (és a Discord Redirects listát), reverse proxy mögött `TRUST_PROXY=true`. Kikapcsolás: `WEB_ENABLED=false`.

| Útvonal | Leírás |
|---|---|
| `/` | Főoldal, statisztika, meghívó |
| `/commands` | Parancslista |
| `/leaderboard` | Globális top 50 |
| `/dashboard` | Szerverek, ahol van „Szerver kezelése” jogod |
| `/dashboard/:id` | Beállítások szerkesztése |
| `/dashboard/:id/modlog`, `/levels` | Napló, szintek |
| `/api/stats`, `/api/leaderboard`, `/health` | JSON |

## Ellenőrzés token nélkül
```bash
npm run check
```
Szintaxisellenőrzés, az adatbázis-réteg egységtesztje (kreditek, bolt, beállítások, figyelmeztetések, XP, sessionök), a parancsok betöltése és a weboldal smoke-tesztje (biztonsági fejlécek, CSRF, átirányítások, API).

## Szerkezet
```
src/
  index.js              # belépési pont: kliens, intents, események, web indítása
  deploy-commands.js    # slash parancsok regisztrálása (globális vagy guild)
  commands/
    economy/            # balance, daily, work, pay, shop, buy, inventory, history, coinflip, slots, leaderboard, admin
    moderation/         # ban, unban, kick, timeout, untimeout, warn, warnings, purge, lock, modlog
    config/setup.js     # szerverbeállítások Discordból
    utility/            # ping, help, userinfo, serverinfo, rank, levels, dashboard
  events/               # ready, interactionCreate (cooldown, autocomplete), guildCreate, messageCreate, guildMemberAdd
  protection/           # antispam.js, filters.js, antiraid.js
  lib/
    db.js               # SQLite (better-sqlite3): séma, lekérdezések, tranzakciók
    config.js           # .env beolvasás és ellenőrzés
    modlog.js           # moderációs napló (DB + log csatorna embed)
    modutil.js          # jogosultság- és hierarchia-ellenőrzés
    cooldowns.js, format.js, branding.js, loadCommands.js, selftest.js
  web/
    server.js           # Express, helmet, rate limit, session, CSRF
    discordOAuth.js     # OAuth2 bejelentkezés, meghívó link
    sessionStore.js     # express-session tároló SQLite-ban
    middleware.js       # requireLogin, requireGuildAccess, csrf
    routes/             # auth, public, dashboard
    views/              # EJS sablonok
    public/style.css
data/meteor.sqlite      # adatbázis (gitignore-ban)
```

**Új parancs:** hozz létre egy fájlt a megfelelő `src/commands/<kategória>/` mappában `data` (SlashCommandBuilder), `execute(interaction)` és opcionális `cooldown` (mp) / `autocomplete` exporttal, majd `npm run deploy`.

## Futtatás állandóan
```bash
npm i -g pm2
pm2 start src/index.js --name meteor-bot
pm2 save
```
Railway/Render/VPS mind működik; a `data/` mappa legyen perzisztens kötet, mert ott az adatbázis.
