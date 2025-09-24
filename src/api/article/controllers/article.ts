/**
 *  article controller
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::article.article', ({ strapi }) => ({
  // Custom preview method to handle both draft and published content
  async preview(ctx) {
    const { id } = ctx.params;
    const { status = 'draft' } = ctx.query;

    try {
      // Fetch the document with the specified status and full population
      const entity = await strapi.documents('api::article.article').findOne({
        documentId: id,
        status: status as 'draft' | 'published',
        populate: {
          cover: {
            populate: '*'
          },
          author: {
            populate: '*'
          },
          category: {
            populate: '*'
          },
          blocks: {
            populate: '*'
          }
        }
      });

      if (!entity) {
        return ctx.notFound('Article not found or not available in the requested status');
      }

      // Transform the data if needed
      const sanitizedEntity = await this.sanitizeOutput(entity, ctx);

      return this.transformResponse(sanitizedEntity);
    } catch (err) {
      strapi.log.error('Error in article preview:', err);
      return ctx.internalServerError('Error fetching article for preview');
    }
  }
}));
