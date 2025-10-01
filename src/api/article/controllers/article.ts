/**
 *  article controller
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::article.article', ({ strapi }) => ({
  async create(ctx) {
    const tokenTenant = ctx.state?.tenantIdFromToken || ctx.state?.jwtPayload?.tenant_id || ctx.state?.user?.tenant_id;
    if (!tokenTenant) return ctx.badRequest('Missing tenant_id in token');

    ctx.request.body = ctx.request.body || {};
    ctx.request.body.data = ctx.request.body.data || {};
    ctx.request.body.data.tenant_id = tokenTenant;

    return await super.create(ctx);
  },

  async update(ctx) {
    const tokenTenant = ctx.state?.tenantIdFromToken || ctx.state?.jwtPayload?.tenant_id || ctx.state?.user?.tenant_id;
    const { id } = ctx.params || {};
    if (!id) return ctx.badRequest('Missing id');

    const existing = await strapi.entityService.findOne('api::article.article', id, { fields: ['tenant_id'] });
    if (!existing) return ctx.notFound('Article not found');
    if (typeof tokenTenant !== 'undefined' && existing.tenant_id !== tokenTenant) return ctx.forbidden('You are not allowed to modify this article');

    if (ctx.request?.body?.data) delete ctx.request.body.data.tenant_id;

    return await super.update(ctx);
  },

  async delete(ctx) {
    const tokenTenant = ctx.state?.tenantIdFromToken || ctx.state?.jwtPayload?.tenant_id || ctx.state?.user?.tenant_id;
    const { id } = ctx.params || {};
    if (!id) return ctx.badRequest('Missing id');

    const existing = await strapi.entityService.findOne('api::article.article', id, { fields: ['tenant_id'] });
    if (!existing) return ctx.notFound('Article not found');
    if (typeof tokenTenant !== 'undefined' && existing.tenant_id !== tokenTenant) return ctx.forbidden('You are not allowed to delete this article');

    return await super.delete(ctx);
  },
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
,

  async find(ctx) {
    const qs: any = ctx.query || {};
    const filters = qs.filters || {};
    const tenantFilter = filters?.tenant_id?.['$eq'] ?? filters?.tenant_id;
    if (typeof tenantFilter !== 'undefined' && (tenantFilter === '' || tenantFilter === null)) {
      return ctx.send({ data: [], meta: { pagination: { page: 1, pageSize: 0, pageCount: 0, total: 0 } } });
    }

    const tokenTenant = ctx.state?.tenantIdFromToken || ctx.state?.jwtPayload?.tenant_id || ctx.state?.user?.tenant_id;
    if (typeof tokenTenant !== 'undefined') {
      qs.filters = qs.filters || {};
      qs.filters.tenant_id = { $eq: tokenTenant };
      ctx.query = qs;
    }

    return await super.find(ctx);
  }
}));
