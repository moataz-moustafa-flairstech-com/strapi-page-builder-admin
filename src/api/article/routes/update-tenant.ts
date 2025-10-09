export default {
  routes: [
    {
      method: 'PUT',
      path: '/articles/:id/tenant-update',
      handler: 'article.tenantUpdate',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
