/**
 * page controller
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::page.page', ({ strapi }) => ({
  // Extend core controller with validation hook for create/update
  async create(ctx) {
    // No placeholder identifier validation required after removing placeholder components
    const tokenTenant = ctx.state?.tenantIdFromToken || ctx.state?.jwtPayload?.tenant_id || ctx.state?.user?.tenant_id;

    if (!tokenTenant) {
      return ctx.badRequest('Missing tenant_id in token');
    }

    // ensure tenant_id is set from token and mandatory
    ctx.request.body = ctx.request.body || {};
    ctx.request.body.data = ctx.request.body.data || {};
    ctx.request.body.data.tenant_id = tokenTenant;

    return await super.create(ctx);
  },

  async update(ctx) {
    // Update by documentId (draft) and ensure tenant matches. Also update published version if present.
    const tokenTenant = ctx.state?.tenantIdFromToken || ctx.state?.jwtPayload?.tenant_id || ctx.state?.user?.tenant_id;
    const { id: documentId } = ctx.params || {};

    if (!documentId) return ctx.badRequest('Missing document id');

    // Find draft document by documentId
    const draft = await strapi.documents('api::page.page').findOne({ documentId, status: 'draft', populate: {} as any });
    if (!draft) return ctx.notFound('Draft not found');

    const existingTenant = (draft as any)?.tenant_id;
    if (typeof tokenTenant !== 'undefined' && existingTenant !== tokenTenant) {
      return ctx.forbidden('You are not allowed to modify this entry');
    }

    // prevent tenant_id from changing
    if (ctx.request?.body?.data) {
      delete ctx.request.body.data.tenant_id;
    }

    // Ensure super.update updates the draft by setting ctx.params.id to internal id
    ctx.params = ctx.params || {};
    ctx.params.id = (draft as any).id;

    const updated = await super.update(ctx);

    // Also update the published version with the same data if it exists and belongs to the same tenant
    try {
      const published = await strapi.documents('api::page.page').findOne({ documentId, status: 'published', populate: {} as any });
      if (published) {
        const publishedTenant = (published as any)?.tenant_id;
        if (typeof tokenTenant === 'undefined' || publishedTenant === tokenTenant) {
          // update published document with the same payload (if any)
          const publishUpdateData = ctx.request?.body?.data ? ctx.request.body.data : {};
          await strapi.documents('api::page.page').update({ documentId, status: 'published', data: publishUpdateData as any });
        }
      }
    } catch (err) {
      // log but don't fail the whole request
      strapi.log.error('Error updating published document after draft update:', err);
    }

    return updated;
  },

  // Tenant-aware publish action
  async publish(ctx) {
    const { id: documentId } = ctx.params || {};
    const tokenTenant = ctx.state?.tenantIdFromToken || ctx.state?.jwtPayload?.tenant_id || ctx.state?.user?.tenant_id;

    if (!documentId) return ctx.badRequest('Missing document id');
    if (!tokenTenant) return ctx.badRequest('Missing tenant_id in token');

    try {
      // Ensure draft exists and belongs to tenant
      const draft = await strapi.documents('api::page.page').findOne({ documentId, status: 'draft', populate: {} as any });
      if (!draft) return ctx.notFound('Draft not found');

      const existingTenant = (draft as any)?.tenant_id;
      if (typeof tokenTenant !== 'undefined' && existingTenant !== tokenTenant) {
        return ctx.forbidden('You are not allowed to publish this entry');
      }

      const published = await strapi.documents('api::page.page').publish({ documentId });
      if (!published) return ctx.internalServerError('Publish failed');

      return this.transformResponse(published);
    } catch (err) {
      strapi.log.error('Error publishing page document:', err);
      return ctx.internalServerError('Error publishing page');
    }
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
                'shared.accordion-list': true,
                'shared.accordion-list-item': true,
                'shared.article-selector': true,
                'shared.bulleted-list': true,
                'shared.button-input': true,
                'shared.cards-list': true,
                'shared.check-box-input': true,
                'shared.drop-down-list': true,
                'shared.facebook-feed': true,
                'shared.form-file-input': true,
                'shared.form-selector': true,
                'shared.form-text-input': true,
                'shared.google-map-widget': true,
                'shared.grid': true,
                'shared.html-block': true,
                'shared.instagram-feed': true,
                'shared.layout-repeater': true,
                'shared.page-header-tag': true,
                'shared.place-holder': true,
                'shared.radio-buttons-list': true,
                'shared.selection-item': true,
                'shared.seo': true,
                'shared.social-media-link': true,
                'shared.tag-attribute': true,
                'shared.youtube-player': true,
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

        // Extract tenant filter from query filters if present
        const filters = qs.filters || {};
        const tenantFilter =
          filters?.tenant_id?.['$eq'] !== undefined
            ? filters.tenant_id['$eq']
            : filters?.tenant_id ?? undefined;

        // If tenant filter is provided but is empty string or null, return empty result
        if (typeof tenantFilter !== 'undefined' && (tenantFilter === '' || tenantFilter === null)) {
          return ctx.send({
            data: [],
            meta: { pagination: { page, pageSize, pageCount: 0, total: 0 } },
          });
        }

        // Build entityService filters if tenantFilter present
        const esFilters: any = {};
        if (typeof tenantFilter !== 'undefined') {
          esFilters.tenant_id = { $eq: tenantFilter };
        }

        // fetch items including drafts (apply tenant filter if present)
        const entities = await strapi.entityService.findMany('api::page.page', {
          publicationState: 'preview',
          populate,
          limit: pageSize,
          start,
          ...(Object.keys(esFilters).length ? { filters: esFilters } : {}),
        });

        // total count, respect tenant filter when present
        const total = typeof tenantFilter !== 'undefined'
          ? await strapi.db.query('api::page.page').count({ where: { tenant_id: tenantFilter } })
          : await strapi.db.query('api::page.page').count();

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