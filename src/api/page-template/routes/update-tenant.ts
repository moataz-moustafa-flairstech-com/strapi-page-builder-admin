export default {
  routes: [
    {
      method: 'PUT',
      path: '/page-templates/:id/tenant-update',
      handler: 'page-template.tenantUpdate',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
