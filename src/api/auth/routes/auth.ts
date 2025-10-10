export default {
  routes: [
    {
      method: 'POST',
      path: '/auth/local-tenant',
      handler: 'auth.localTenant',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/auth/register',
      handler: 'auth.register',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
  ],
};
