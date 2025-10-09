export default {
  async localTenant(ctx) {
    const { identifier, password, tenant_id } = ctx.request.body || {};

    if (!identifier || !password || !tenant_id) {
      return ctx.badRequest('identifier, password and tenant_id are required');
    }

    const user = await strapi.query('plugin::users-permissions.user').findOne({
      where: {
        $or: [{ email: identifier }, { username: identifier }],
      },
    });

    if (!user) return ctx.badRequest('Invalid identifier or password');

    const valid = await strapi
      .plugin('users-permissions')
      .service('user')
      .validatePassword(password, user.password);

    if (!valid) return ctx.badRequest('Invalid identifier or password');

    const jwt = strapi
      .plugin('users-permissions')
      .service('jwt')
      .issue({ id: user.id, email: user.email, tenant_id });

    const { password: _p, ...safeUser } = user;
    strapi.log.info(`User ${user.email} logged in for tenant ${tenant_id}`);
    return ctx.send({ jwt, user: safeUser });
  },

  async register(ctx) {
    const { email, password, username, role } = ctx.request.body || {};

    if (!email || !password || !role) {
      return ctx.badRequest('email, password and role are required');
    }

    const roleMap: any = {
      Authenticated: 'Authenticated',
      Editors: 'Editors',
      Admins: 'Admins',
    };

    const roleName = roleMap[role] || 'Authenticated';

    const roleEntity = await strapi
      .query('plugin::users-permissions.role')
      .findOne({ where: { name: roleName } });

    const roleId = roleEntity ? roleEntity.id : undefined;

    const userService = strapi.plugin('users-permissions').service('user');

    const user = await userService.add({
      email,
      password,
      username: username || email,
      provider: 'local',
      confirmed: true,
      blocked: false,
      role: roleId,
    });

    const { password: _p, ...safeUser } = user;
    strapi.log.info(`New user registered: ${user.email} with role ${roleName}`);
    return ctx.send({ user: safeUser });
  },
};
