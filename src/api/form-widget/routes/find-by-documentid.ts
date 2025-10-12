export default {
  routes: [
    {
      method: 'GET',
      path: '/form-widgets/:documentId/detailed',
      handler: 'form-widget.findByDocumentId',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
