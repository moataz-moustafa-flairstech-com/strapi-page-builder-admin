export default {
  routes: [
    {
      method: 'PUT',
      path: '/pages/:id/tenant-update',
      handler: 'page.tenantUpdate',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
