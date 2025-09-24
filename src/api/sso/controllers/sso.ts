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

      // look up otp
      const [rows] = await conn.execute(
        'SELECT user_name, tenant_id FROM otp_expiry WHERE otp = ? LIMIT 1',
        [otp]
      );

      const otpRow = Array.isArray(rows) && rows.length ? rows[0] : null;
      if (!otpRow) {
        console.log('SSO: no matching otp', otp);
        await conn.end();
        return ctx.redirect('/admin');
      }

      const { user_name, tenant_id } = otpRow as any;

      // fetch tenant details
      const [tenantsRows] = await conn.execute(
        `SELECT
          id,
          tenant_name,
          domain,
          strapi_db_name,
          strapi_db_username,
          strapi_db_password,
          strapi_db_server,
          strapi_db_port,
          strapi_db_SSL,
          strapi_assets_api_url,
          app_db_name,
          app_db_username,
          app_db_password,
          app_db_server,
          app_db_port,
          app_db_SSL
        FROM tenants
        WHERE id = ? LIMIT 1`,
        [tenant_id]
      );

      const tenant = Array.isArray(tenantsRows) && tenantsRows.length ? tenantsRows[0] : null;

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
