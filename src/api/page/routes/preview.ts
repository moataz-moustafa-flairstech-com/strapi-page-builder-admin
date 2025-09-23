/**
 * Custom preview routes for pages
 */

export default {
  routes: [
    {
      method: 'GET',
      path: '/pages/:id/preview',
      handler: 'page.preview',
      config: {
        auth: false, // Allow public access for preview
        policies: [],
        middlewares: [],
      },
    },
  ],
};