/**
 * page-template controller
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::page-template.page-template', ({ strapi }) => ({
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

		const existing = await (strapi.entityService as any).findOne('api::page-template.page-template', id, { fields: ['tenant_id'] });
		if (!existing) return ctx.notFound('Template not found');
		const existingTenant = (existing as any)?.tenant_id;
		if (typeof tokenTenant !== 'undefined' && existingTenant !== tokenTenant) return ctx.forbidden('You are not allowed to modify this template');

		if (ctx.request?.body?.data) delete ctx.request.body.data.tenant_id;

		return await super.update(ctx);
	},

	async delete(ctx) {
		const tokenTenant = ctx.state?.tenantIdFromToken || ctx.state?.jwtPayload?.tenant_id || ctx.state?.user?.tenant_id;
		const { id } = ctx.params || {};
		if (!id) return ctx.badRequest('Missing id');

		const existing = await (strapi.entityService as any).findOne('api::page-template.page-template', id, { fields: ['tenant_id'] });
		if (!existing) return ctx.notFound('Template not found');
		const existingTenant = (existing as any)?.tenant_id;
		if (typeof tokenTenant !== 'undefined' && existingTenant !== tokenTenant) return ctx.forbidden('You are not allowed to delete this template');

		return await super.delete(ctx);
	},

	// Optional preview support for page-template documents
	async preview(ctx) {
		const { id } = ctx.params;
		const { status = 'draft' } = ctx.query;

		try {
			const entity = await strapi.documents('api::page-template.page-template').findOne({
				documentId: id,
				status: status as 'draft' | 'published',
				populate: ctx.query.populate || '*',
			});

			if (!entity) return ctx.notFound('Template not found');

			return this.transformResponse(entity);
		} catch (err) {
			strapi.log.error('Error in page-template preview:', err);
			return ctx.internalServerError('Error fetching template for preview');
		}
	},

	async find(ctx) {
		const qs: any = ctx.query || {};
		try {
			if (qs.publicationState === 'preview') {
				const page = qs['pagination[page]'] ? parseInt(String(qs['pagination[page]']), 10) || 1 : 1;
				const pageSize = qs['pagination[pageSize]'] ? parseInt(String(qs['pagination[pageSize]']), 10) || 25 : 25;
				const start = (page - 1) * pageSize;
				const populate = qs.populate || '*';

				const filters = qs.filters || {};
				const tenantFilter =
					filters?.tenant_id?.['$eq'] !== undefined
						? filters.tenant_id['$eq']
						: filters?.tenant_id ?? undefined;

				if (typeof tenantFilter !== 'undefined' && (tenantFilter === '' || tenantFilter === null)) {
					return ctx.send({ data: [], meta: { pagination: { page, pageSize, pageCount: 0, total: 0 } } });
				}

				const esFilters: any = {};
				if (typeof tenantFilter !== 'undefined') {
					esFilters.tenant_id = { $eq: tenantFilter };
				}

				const entities = await (strapi.entityService as any).findMany('api::page-template.page-template', {
					publicationState: 'preview',
					populate,
					limit: pageSize,
					start,
					...(Object.keys(esFilters).length ? { filters: esFilters } : {}),
				});

				const total = typeof tenantFilter !== 'undefined'
					? await (strapi.db.query as any)('api::page-template.page-template').count({ where: { tenant_id: tenantFilter } })
					: await (strapi.db.query as any)('api::page-template.page-template').count();

				const pageCount = pageSize > 0 ? Math.ceil(total / pageSize) : 0;

				return ctx.send({ data: entities, meta: { pagination: { page, pageSize, pageCount, total } } });
			}

			// Otherwise, scope by token tenant if present
			const tokenTenant = ctx.state?.tenantIdFromToken || ctx.state?.jwtPayload?.tenant_id || ctx.state?.user?.tenant_id;
			if (typeof tokenTenant !== 'undefined') {
				qs.filters = qs.filters || {};
				qs.filters.tenant_id = { $eq: tokenTenant };
				ctx.query = qs;
			}

			return await super.find(ctx);
		} catch (err) {
			strapi.log.error('Error in custom find for page-templates:', err);
			return ctx.internalServerError('Error fetching page templates');
		}
	}
}));