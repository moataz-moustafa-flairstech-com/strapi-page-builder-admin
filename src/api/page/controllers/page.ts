/**
 * page controller
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::page.page', ({ strapi }) => ({
  // Extend core controller with validation hook for create/update
  async create(ctx) {
    // No placeholder identifier validation required after removing placeholder components
    const { sections = [], page_template } = ctx.request.body?.data || {};

    return await super.create(ctx);
  },

  async update(ctx) {
    // No placeholder identifier validation required after removing placeholder components
    // keep page_template and sections available for other logic

    return await super.update(ctx);
  },

  // Custom preview method to handle both draft and published content
  async preview(ctx) {
    const { id } = ctx.params;
    const { status = 'draft' } = ctx.query;

    try {
      strapi.log.info(`Page preview request - ID: ${id}, Status: ${status}`);
      
    // Fetch the page document (draft or published)
    const entity = await strapi.documents('api::page.page').findOne({
      documentId: id,
      status: status as 'draft' | 'published',
      populate: {
        sections: {
          populate: {
            blocks: {
              on: {
                'shared.external-content': true,
                'shared.media': { populate: { file: true } },
                'shared.quote': true,
                'shared.rich-text': true,
                'shared.slider': { populate: { files: true } },
              },
            },
            style: {
              populate: {
                background_image: true
              }
            }
          },
        },
        style: {
          populate: {
            background_image: true
          }
        },
        // request only minimal info so we can hydrate later
        page_template: true
      }
    });

    if (!entity) {
      strapi.log.warn(`Page not found - ID: ${id}, Status: ${status}`);
      return ctx.notFound('Page not found or not available in the requested status');
    }

    //strapi.log.info(`Fetched page entity for preview: ${JSON.stringify(entity)}`);
    // Hydrate page_template if present
    // const templateId =      entity?.page_template?.id || entity?.page_template?.documentId;
    // const templateId = entity?.page_template?.documentId;

    // if (templateId) {
    //   const template = await strapi.entityService.findOne(
    //     'api::page-template.page-template',
    //     templateId,
    //     {
    //       populate: {
    //         layout: {
    //           populate: {
    //             blocks: true,
    //           },
    //         },
    //       },
    //     }
    //   );
    //   entity.page_template = template;
    // }



      // Transform the data if needed
      //const sanitizedEntity = await this.sanitizeOutput(entity, ctx);


      //strapi.log.info(`sanitizedEntity: ${JSON.stringify(sanitizedEntity)}`);

      const transformedResponse = this.transformResponse(entity);
      strapi.log.info(`transformedResponse for preview: ${JSON.stringify(transformedResponse)}`);

      return transformedResponse;
    } catch (err) {
      strapi.log.error('Error in page preview:', err);
      return ctx.internalServerError('Error fetching page for preview');
    }
  },

  // Update only the layout_structure for a specific document (draft or published)
  async updateLayoutStructure(ctx) {
    // Expecting route: PUT /api/pages/:id/updateLayoutStructure?status=<draft|published>
    if (ctx.method !== 'PUT') return ctx.methodNotAllowed('Only PUT allowed');

    const { id } = ctx.params || {};
    const { status = 'draft' } = ctx.query || {};

    if (!id) return ctx.badRequest('Missing document id');
    if (status !== 'draft' && status !== 'published') return ctx.badRequest('Invalid status, expected "draft" or "published"');

    const layout_structure = ctx.request?.body?.data?.layout_structure;
    if (typeof layout_structure === 'undefined') {
      return ctx.badRequest('Missing layout_structure in request body (expected { data: { layout_structure: ... } })');
    }

    try {
      const updated = await strapi.documents('api::page.page').update({
        documentId: id,
        status: status as 'draft' | 'published',
        data: { layout_structure },
      });

      if (!updated) return ctx.notFound('Page not found for the given document id and status');

      // Return the transformed response for consistency with other controllers
      return this.transformResponse(updated);
    } catch (err) {
      strapi.log.error('Error updating layout_structure:', err);
      return ctx.internalServerError('Error updating layout_structure');
    }
  },

  // Override find to support publicationState=preview (include drafts)
  async find(ctx) {
    const qs: any = ctx.query || {};
    try {
      if (qs.publicationState === 'preview') {
        // pagination
        const page = qs['pagination[page]'] ? parseInt(String(qs['pagination[page]']), 10) || 1 : 1;
        const pageSize = qs['pagination[pageSize]'] ? parseInt(String(qs['pagination[pageSize]']), 10) || 25 : 25;
        const start = (page - 1) * pageSize;

        // populate
        const populate = qs.populate || '*';

        // fetch items including drafts
        const entities = await strapi.entityService.findMany('api::page.page', {
          publicationState: 'preview',
          populate,
          limit: pageSize,
          start,
        });

        // total count
        const total = await strapi.db.query('api::page.page').count();
        const pageCount = pageSize > 0 ? Math.ceil(total / pageSize) : 0;

        return ctx.send({
          data: entities,
          meta: {
            pagination: {
              page,
              pageSize,
              pageCount,
              total,
            },
          },
        });
      }

      // Otherwise fall back to default behavior
      return await super.find(ctx);
    } catch (err) {
      strapi.log.error('Error in custom find for pages:', err);
      return ctx.internalServerError('Error fetching pages');
    }
  }

}));