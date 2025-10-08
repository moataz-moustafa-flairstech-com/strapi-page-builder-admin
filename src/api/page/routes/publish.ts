/**
 * Route to publish a page document (tenant-aware)
 */

export default {
  routes: [
    {
      method: 'POST',
      path: '/pages/:id/publish',
      handler: 'api::page.page.publish',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
