export default {
  routes: [
    {
      method: 'PUT',
      path: '/pages/:id/copy/:id2',
      handler: 'page.CopyPage',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};