import jwt from 'jsonwebtoken';

/**
 * Middleware that decodes Authorization: Bearer <token> and exposes
 * ctx.state.jwtPayload and ctx.state.tenantIdFromToken (if present).
 */
export default (config, { strapi }) => {
  return async (ctx, next) => {
    try {
      const auth = ctx.get('Authorization') || ctx.get('authorization') || '';
      const token = auth.startsWith('Bearer ') ? auth.replace(/^Bearer\s+/i, '') : null;
      if (token) {
        const secret = process.env.JWT_SECRET || process.env.ADMIN_JWT_SECRET || '';
        try {
          const payload: any = jwt.verify(token, secret);
          ctx.state.jwtPayload = payload;
          if (payload.tenant_id) ctx.state.tenantIdFromToken = payload.tenant_id;
          if (payload.email) ctx.state.userEmailFromToken = payload.email;
        } catch (e) {
          // invalid token - do not throw, let auth handle it
          strapi.log.debug('Invalid JWT in tenant middleware');
        }
      }
    } catch (err) {
      strapi.log.error('Error in tenant middleware', err);
    }

    await next();
  };
};
