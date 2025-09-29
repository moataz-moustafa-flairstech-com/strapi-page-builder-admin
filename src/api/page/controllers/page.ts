/**
 * page controller
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::page.page', ({ strapi }) => ({
  // Extend core controller with validation hook for create/update
  async create(ctx) {
    // basic validation scaffold - ensure sections have a placeholder identifier
    const { sections = [], page_template } = ctx.request.body?.data || {};

    for (const sec of sections) {
      if (!sec.place_holder_ui_indentifier) {
        return ctx.badRequest('Each section must have a place_holder_ui_indentifier');
      }
    }

    // validate against the template's layout
    try {
      const res = await strapi.service('api::page.page').validateSectionsAgainstTemplate(page_template, sections || []);
      if (!res.ok) return ctx.badRequest(res.message);
    } catch (err) {
      strapi.log.error(err);
      return ctx.badRequest('Error validating page sections');
    }

    return await super.create(ctx);
  },

  async update(ctx) {
    const { sections = [], page_template } = ctx.request.body?.data || {};

    for (const sec of sections) {
      if (!sec.place_holder_ui_indentifier) {
        return ctx.badRequest('Each section must have a place_holder_ui_indentifier');
      }
    }

    try {
      const res = await strapi.service('api::page.page').validateSectionsAgainstTemplate(page_template, sections || []);
      if (!res.ok) return ctx.badRequest(res.message);
    } catch (err) {
      strapi.log.error(err);
      return ctx.badRequest('Error validating page sections');
    }

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
        page_template: {
          populate: {
            layout: {
              populate: {
                blocks: { populate: '*' }
              }
            }
          }
        }
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
  }

}));