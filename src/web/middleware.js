import { randomBytes, timingSafeEqual } from 'node:crypto';

export function requireLogin(req, res, next) {
  if (!req.session.user) {
    req.session.returnTo = req.originalUrl;
    return res.redirect('/login');
  }
  next();
}

/** A felhasználó kezelheti-e a szervert (OAuth guild lista alapján) és benne van-e a bot. */
export function requireGuildAccess(client) {
  return (req, res, next) => {
    const { guildId } = req.params;
    if (!/^\d{17,20}$/.test(guildId)) return res.status(404).render('error', { title: 'Nincs ilyen szerver', message: 'Érvénytelen szerver azonosító.' });
    const allowed = req.session.guilds?.some((g) => g.id === guildId);
    if (!allowed) return res.status(403).render('error', { title: 'Nincs jogosultság', message: 'Ezt a szervert nem kezelheted, vagy jelentkezz be újra.' });
    const guild = client.guilds.cache.get(guildId);
    if (!guild) return res.status(404).render('error', { title: 'A bot nincs a szerveren', message: 'Hívd meg a Meteor botot erre a szerverre, utána beállíthatod.' });
    req.guild = guild;
    next();
  };
}

/** CSRF: session-hez kötött token, minden POST-nál ellenőrzött (double-submit a űrlapban). */
export function csrf(req, res, next) {
  if (!req.session.csrf) req.session.csrf = randomBytes(24).toString('hex');
  res.locals.csrf = req.session.csrf;
  if (req.method === 'POST') {
    const sent = String(req.body?._csrf ?? '');
    const ok = sent.length === req.session.csrf.length && timingSafeEqual(Buffer.from(sent), Buffer.from(req.session.csrf));
    if (!ok) return res.status(403).render('error', { title: 'Érvénytelen kérés', message: 'A biztonsági token nem egyezik. Frissítsd az oldalt és próbáld újra.' });
  }
  next();
}
