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

		const existing = await strapi.entityService.findOne('api::page-template.page-template', id, { fields: ['tenant_id'] });
		if (!existing) return ctx.notFound('Template not found');
		if (typeof tokenTenant !== 'undefined' && existing.tenant_id !== tokenTenant) return ctx.forbidden('You are not allowed to modify this template');

		if (ctx.request?.body?.data) delete ctx.request.body.data.tenant_id;

		return await super.update(ctx);
	},

	async delete(ctx) {
		const tokenTenant = ctx.state?.tenantIdFromToken || ctx.state?.jwtPayload?.tenant_id || ctx.state?.user?.tenant_id;
		const { id } = ctx.params || {};
		if (!id) return ctx.badRequest('Missing id');

		const existing = await strapi.entityService.findOne('api::page-template.page-template', id, { fields: ['tenant_id'] });
		if (!existing) return ctx.notFound('Template not found');
		if (typeof tokenTenant !== 'undefined' && existing.tenant_id !== tokenTenant) return ctx.forbidden('You are not allowed to delete this template');

		return await super.delete(ctx);
	},

	async find(ctx) {
		const qs: any = ctx.query || {};
		// if filters include tenant and it's empty -> return empty
		const filters = qs.filters || {};
		const tenantFilter = filters?.tenant_id?.['$eq'] ?? filters?.tenant_id;
		if (typeof tenantFilter !== 'undefined' && (tenantFilter === '' || tenantFilter === null)) {
			return ctx.send({ data: [], meta: { pagination: { page: 1, pageSize: 0, pageCount: 0, total: 0 } } });
		}

		// if token tenant present, ensure results are scoped
		const tokenTenant = ctx.state?.tenantIdFromToken || ctx.state?.jwtPayload?.tenant_id || ctx.state?.user?.tenant_id;
		if (typeof tokenTenant !== 'undefined') {
			qs.filters = qs.filters || {};
			qs.filters.tenant_id = { $eq: tokenTenant };
			ctx.query = qs;
		}

		return await super.find(ctx);
	}
}));