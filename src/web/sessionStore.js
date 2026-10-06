import session from 'express-session';

/** express-session tároló SQLite-ban (a bot adatbázisában), hogy újraindítás után is éljenek a bejelentkezések. */
export class SqliteSessionStore extends session.Store {
  constructor(db) {
    super();
    this.db = db;
    setInterval(() => this.db.sessionPurge(), 10 * 60_000).unref();
  }
  get(sid, cb) {
    try { cb(null, this.db.sessionGet(sid)); } catch (e) { cb(e); }
  }
  set(sid, sess, cb) {
    try {
      const maxAge = sess.cookie?.maxAge ?? 7 * 86_400_000;
      this.db.sessionSet(sid, sess, Date.now() + maxAge);
      cb?.(null);
    } catch (e) { cb?.(e); }
  }
  destroy(sid, cb) {
    try { this.db.sessionDel(sid); cb?.(null); } catch (e) { cb?.(e); }
  }
  touch(sid, sess, cb) { this.set(sid, sess, cb); }
}
