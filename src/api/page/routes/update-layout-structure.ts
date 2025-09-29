/**
 * Route to update only layout_structure for a page document
 */

export default {
  routes: [
    {
      method: 'PUT',
      path: '/pages/:id/updateLayoutStructure',
      handler: 'page.updateLayoutStructure',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
