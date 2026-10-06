import { Router } from 'express';
import { randomBytes } from 'node:crypto';
import rateLimit from 'express-rate-limit';
import { authorizeUrl, exchangeCode, fetchProfile } from '../discordOAuth.js';

const router = Router();
const authLimiter = rateLimit({ windowMs: 15 * 60_000, limit: 20, standardHeaders: 'draft-8', legacyHeaders: false });

router.get('/login', authLimiter, (req, res) => {
  const state = randomBytes(16).toString('hex');
  req.session.oauthState = state;
  res.redirect(authorizeUrl(state));
});

router.get('/callback', authLimiter, async (req, res, next) => {
  try {
    const { code, state, error } = req.query;
    if (error) return res.redirect('/');
    if (!code || !state || state !== req.session.oauthState) {
      return res.status(400).render('error', { title: 'Hibás bejelentkezés', message: 'Az állapot-ellenőrzés sikertelen. Próbáld újra.' });
    }
    delete req.session.oauthState;
    const token = await exchangeCode(String(code));
    const profile = await fetchProfile(token.access_token);
    // Session rotáció bejelentkezéskor (session fixation ellen)
    const returnTo = req.session.returnTo;
    await new Promise((r) => req.session.regenerate(r));
    req.session.user = profile.user;
    req.session.guilds = profile.guilds;
    req.session.loginAt = Date.now();
    res.redirect(returnTo && returnTo.startsWith('/') ? returnTo : '/dashboard');
  } catch (err) {
    next(err);
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('meteor.sid');
    res.redirect('/');
  });
});

export default router;
