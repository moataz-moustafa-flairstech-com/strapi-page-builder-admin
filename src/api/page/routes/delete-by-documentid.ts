export default {
  routes: [
    {
      method: 'DELETE',
      path: '/pages/:documentId/delete-by-documentid',
      handler: 'page.DeleteByDocumentId',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};