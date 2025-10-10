export default {
  routes: [
    {
      method: 'PUT',
      path: '/form-widgets/:id/tenant-update',
      handler: 'form-widget.tenantUpdate',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
