import express from 'express';
import session from 'express-session';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from '../lib/config.js';
import { BOT_NAME } from '../lib/branding.js';
import { SqliteSessionStore } from './sessionStore.js';
import { csrf } from './middleware.js';
import { avatarUrl } from './discordOAuth.js';
import authRoutes from './routes/auth.js';
import publicRoutes from './routes/public.js';
import dashboardRoutes from './routes/dashboard.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

export function startWeb(client) {
  const app = express();
  const secure = config.web.baseUrl.startsWith('https://');

  app.disable('x-powered-by');
  if (config.web.trustProxy) app.set('trust proxy', 1);
  app.set('view engine', 'ejs');
  app.set('views', join(__dirname, 'views'));

  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'https://cdn.discordapp.com'],
        formAction: ["'self'", 'https://discord.com'],
        frameAncestors: ["'none'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: secure ? [] : null,
      },
    },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    crossOriginEmbedderPolicy: false,
  }));
  app.use(rateLimit({ windowMs: 15 * 60_000, limit: 300, standardHeaders: 'draft-8', legacyHeaders: false }));
  app.use(express.urlencoded({ extended: false, limit: '32kb' }));
  app.use(express.static(join(__dirname, 'public'), { maxAge: '1d' }));

  app.use(session({
    name: 'meteor.sid',
    store: new SqliteSessionStore(client.db),
    secret: config.web.sessionSecret,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: { httpOnly: true, sameSite: 'lax', secure, maxAge: 7 * 86_400_000 },
  }));
  // Közös sablonváltozók
  app.use((req, res, next) => {
    res.locals.botName = BOT_NAME;
    res.locals.baseUrl = config.web.baseUrl;
    res.locals.user = req.session.user ?? null;
    res.locals.avatar = req.session.user ? avatarUrl(req.session.user) : null;
    res.locals.path = req.path;
    next();
  });

  app.use(csrf);

  app.use(authRoutes);
  app.use(publicRoutes(client));
  app.use('/dashboard', dashboardRoutes(client));

  app.use((req, res) => res.status(404).render('error', { title: 'Nem található', message: 'Ez az oldal nem létezik.' }));
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    console.error('Web hiba:', err);
    res.status(500).render('error', { title: 'Hiba', message: 'Váratlan hiba történt. Próbáld újra később.' });
  });

  const server = app.listen(config.web.port, () => console.log(`🌐 Weboldal: ${config.web.baseUrl} (port ${config.web.port})`));
  return server;
}
