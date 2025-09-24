import { Context } from 'koa';

const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');

export default {
  async sso(ctx: Context) {
    try {
      const otp = ctx.request.query?.otp as string;
      if (!otp) {
        console.log('SSO: missing otp');
        return ctx.redirect('/admin');
      }

      // Read DB connection params from env with defaults
      const DB_CLIENT = process.env.MULTITENANT_DATABASE_CLIENT || 'mysql';
      const DB_HOST = process.env.MULTITENANT_DATABASE_HOST || '127.0.0.1';
      const DB_PORT = Number(process.env.MULTITENANT_DATABASE_PORT || 3306);
      const DB_NAME = process.env.MULTITENANT_DATABASE_NAME || 'leaguesuite-main';
      const DB_USER = process.env.MULTITENANT_DATABASE_USERNAME || 'root';
      const DB_PASS = process.env.MULTITENANT_DATABASE_PASSWORD || '1234';

      // create connection
      const conn = await mysql.createConnection({
        host: DB_HOST,
        port: DB_PORT,
        user: DB_USER,
        password: DB_PASS,
        database: DB_NAME,
      });

      // look up otp - ensure it's not marked expired and that now is within 5 minutes of expire_at
      const [rows] = await conn.execute(
        'SELECT * FROM otp_expiry WHERE is_expired = 0 AND otp = ? AND NOW() <= expire_at LIMIT 1',
        [otp]
      );

      const otpRow = Array.isArray(rows) && rows.length ? rows[0] : null;
      if (!otpRow) {
        console.log('SSO: no matching otp', otp);
        await conn.end();
        return ctx.redirect('/admin');
      }

      // detect username column
      const usernameKeys = ['user_email'];
      const tenantKeys = ['tenant_id'];

      const userKey = usernameKeys.find((k) => Object.prototype.hasOwnProperty.call(otpRow, k));
      const tenantKey = tenantKeys.find((k) => Object.prototype.hasOwnProperty.call(otpRow, k));

      if (!userKey) {
        console.log('SSO: otp_expiry row does not contain a recognized username column. Columns:', Object.keys(otpRow));
        await conn.end();
        return ctx.redirect('/admin');
      }
      if (!tenantKey) {
        console.log('SSO: otp_expiry row does not contain a recognized tenant id column. Columns:', Object.keys(otpRow));
        // continue without tenant
      }

      const user_name = otpRow[userKey];
      const tenant_id = tenantKey ? otpRow[tenantKey] : null;

      // mark OTP as used (set is_expired = 1)
      try {
        if (Object.prototype.hasOwnProperty.call(otpRow, 'id')) {
          await conn.execute('UPDATE otp_expiry SET is_expired = 1 WHERE id = ?', [otpRow.id]);
        } else {
          // fallback: update matching otp row
          await conn.execute('UPDATE otp_expiry SET is_expired = 1 WHERE otp = ? LIMIT 1', [otp]);
        }
      } catch (e) {
        console.log('SSO: failed to mark otp as expired', e.message || e);
      }

      // fetch tenant details
      let tenant = null;
      if (tenant_id) {
        try {
          const [tenantsRows] = await conn.execute(
            `SELECT * FROM tenants WHERE id = ? LIMIT 1`,
            [tenant_id]
          );
          tenant = Array.isArray(tenantsRows) && tenantsRows.length ? tenantsRows[0] : null;
        } catch (e) {
          console.log('SSO: error fetching tenant row', e.message || e);
        }
      }

      // save tenant to session
      try {
        if (ctx.session) {
          ctx.session.tenant = tenant;
        } else {
          // @ts-ignore
          ctx.request.session = ctx.request.session || {};
          // @ts-ignore
          ctx.request.session.tenant = tenant;
        }
      } catch (e) {
        console.log('SSO: failed to set session', e);
      }

      // create a simple JWT token and set as cookie to attempt bypass
      try {
        const secret = process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET || 'change-me';
  const token = jwt.sign({ username: user_name }, secret, { expiresIn: '1d' });

        // set cookie (httpOnly)
        ctx.cookies.set('strapi_jwt', token, {
          httpOnly: true,
          secure: false,
          sameSite: 'lax',
          path: '/',
          maxAge: 24 * 60 * 60 * 1000,
        });
      } catch (e) {
        console.log('SSO: failed to create token', e);
      }

      await conn.end();

      // redirect to admin
      return ctx.redirect('/admin');
    } catch (err) {
      console.log('SSO error', err);
      try {
        return ctx.redirect('/admin');
      } catch (e) {
        console.log('SSO redirect failed', e);
      }
    }
  },
};
