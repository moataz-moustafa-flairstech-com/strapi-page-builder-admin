/**
 * Custom preview routes for articles
 */

export default {
  routes: [
    {
      method: 'GET',
      path: '/articles/:id/preview',
      handler: 'article.preview',
      config: {
        auth: false, // Allow public access for preview
        policies: [],
        middlewares: [],
      },
    },
  ],
};