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

	async tenantUpdate(ctx) {
		// TEMP DEBUG: log incoming request and context to help diagnose 404
		strapi.log.debug('page-template tenantUpdate called');
		try {
			strapi.log.info('[tenantUpdate] url=' + (ctx.request?.url || ctx.url));
			strapi.log.info('[tenantUpdate] method=' + ctx.method);
			strapi.log.info('[tenantUpdate] params=' + JSON.stringify(ctx.params));
			strapi.log.info('[tenantUpdate] query=' + JSON.stringify(ctx.query));
			strapi.log.info('[tenantUpdate] headers.Authorization=' + String(ctx.request?.headers?.authorization || ctx.headers?.authorization || ''));
		} catch (e) {
			strapi.log.error('Error serializing ctx for debug log', e);
		}
		// page-template has no draft/published states; perform tenant-scoped update on the published entity
		const tokenTenant = ctx.state?.tenantIdFromToken || ctx.state?.jwtPayload?.tenant_id || ctx.state?.user?.tenant_id;
		const { id } = ctx.params || {};
		if (!id) return ctx.badRequest('Missing id');

		// Low-level DB lookup to validate tenant. Request a full row so we can inspect DB columns.
		let existing: any = null;
		try {
			existing = await strapi.db.query('api::page-template.page-template').findOne({ where: { id } });
			strapi.log.info('[tenantUpdate] db.query.findOne result=' + JSON.stringify(existing));
		} catch (err) {
			strapi.log.error('Error looking up page-template for tenantUpdate via db.query:', err);
			return ctx.internalServerError('Error looking up page-template');
		}

		// Raw SQL fallback to inspect underlying table (temporary debug)
		try {
			const knex: any = (strapi.db as any).connection;
			if (knex && typeof knex.raw === 'function') {
				const tableName = 'page_templates';
				const rawRes = await knex.raw('SELECT * FROM ?? WHERE id = ? LIMIT 1', [tableName, id]);
				// knex returns results in different shapes depending on DB; stringify generically
				strapi.log.info('[tenantUpdate] raw SQL result=' + JSON.stringify(rawRes && rawRes.rows ? rawRes.rows : rawRes));
			}
		} catch (err) {
			strapi.log.error('Error running raw SQL fallback for tenantUpdate:', err);
		}

		if (!existing) return ctx.notFound('Template not found');
		const existingTenant = existing?.tenant_id;
		if (typeof tokenTenant !== 'undefined' && existingTenant !== tokenTenant) return ctx.forbidden('You are not allowed to modify this template');

		if (ctx.request?.body?.data) delete ctx.request.body.data.tenant_id;
		if (ctx.request?.body?.data) delete ctx.request.body.data.tenant_id;
		strapi.log.debug('page-template tenantUpdate performing direct entity update');

		try {
			const data = ctx.request?.body?.data || {};
			const updated = await (strapi.entityService as any).update('api::page-template.page-template', id, { data });
			strapi.log.info('[tenantUpdate] entityService.update result=' + JSON.stringify(updated));
			return ctx.send(this.transformResponse(updated));
		} catch (err) {
			strapi.log.error('Error in entityService.update for tenantUpdate:', err);
			// fallback to the core controller update if direct update fails
			try {
				return await super.update(ctx);
			} catch (err2) {
				strapi.log.error('super.update fallback failed:', err2);
				return ctx.internalServerError('Update failed');
			}
		}
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