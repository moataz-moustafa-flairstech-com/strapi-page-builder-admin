export default {
  routes: [
    {
      method: 'GET',
      path: '/sso',
      handler: 'sso.sso',
      config: {
        auth: false,
      },
    },
  ],
};
