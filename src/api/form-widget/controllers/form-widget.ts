/**
 * form-widget controller
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreController(('api::form-widget.form-widget') as any, ({ strapi }) => ({
	async create(ctx) {
		const tokenTenant = ctx.state?.tenantIdFromToken || ctx.state?.jwtPayload?.tenant_id || ctx.state?.user?.tenant_id;

		if (!tokenTenant) {
			return ctx.badRequest('Missing tenant_id in token');
		}

		ctx.request.body = ctx.request.body || {};
		ctx.request.body.data = ctx.request.body.data || {};
		ctx.request.body.data.tenant_id = tokenTenant;

		return await super.create(ctx);
	},

	async update(ctx) {
		const tokenTenant = ctx.state?.tenantIdFromToken || ctx.state?.jwtPayload?.tenant_id || ctx.state?.user?.tenant_id;
		const { id } = ctx.params || {};

		if (!id) return ctx.badRequest('Missing id');

		const existing = await strapi.entityService.findOne('api::form-widget.form-widget', id, { fields: ['tenant_id'] });
		if (!existing) return ctx.notFound('Form widget not found');

		const existingTenant = existing?.tenant_id;
		if (typeof tokenTenant !== 'undefined' && existingTenant !== tokenTenant) {
			return ctx.forbidden('You are not allowed to modify this entry');
		}

		if (ctx.request?.body?.data) {
			delete ctx.request.body.data.tenant_id;
		}

		return await super.update(ctx);
	},

	async delete(ctx) {
		const tokenTenant = ctx.state?.tenantIdFromToken || ctx.state?.jwtPayload?.tenant_id || ctx.state?.user?.tenant_id;
		const { id } = ctx.params || {};

		if (!id) return ctx.badRequest('Missing id');

		const existing = await strapi.entityService.findOne('api::form-widget.form-widget', id, { fields: ['tenant_id'] });
		if (!existing) return ctx.notFound('Form widget not found');

		const existingTenant = existing?.tenant_id;
		if (typeof tokenTenant !== 'undefined' && existingTenant !== tokenTenant) {
			return ctx.forbidden('You are not allowed to delete this entry');
		}

		return await super.delete(ctx);
	},

	async find(ctx) {
		// Enforce tenant filter when listing
		const qs: any = ctx.query || {};
		try {
			const filters = qs.filters || {};
			const tenantFilter =
				filters?.tenant_id?.['$eq'] !== undefined
					? filters.tenant_id['$eq']
					: filters?.tenant_id ?? undefined;

			if (typeof tenantFilter !== 'undefined' && (tenantFilter === '' || tenantFilter === null)) {
				return ctx.send({ data: [], meta: { pagination: { page: 1, pageSize: 0, pageCount: 0, total: 0 } } });
			}

			if (typeof tenantFilter !== 'undefined') {
				qs.filters = { tenant_id: tenantFilter };
			}

			return await super.find(ctx);
		} catch (err) {
			strapi.log.error('Error in form-widget find:', err);
			return ctx.internalServerError('Error fetching form widgets');
		}
	},
}));
