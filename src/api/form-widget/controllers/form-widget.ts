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

	async tenantUpdate(ctx) {
		// TEMP DEBUG: log incoming request and context to help diagnose 404-like issues
		strapi.log.debug('form-widget tenantUpdate called');
		try {
			strapi.log.info('[tenantUpdate] url=' + (ctx.request?.url || ctx.url));
			strapi.log.info('[tenantUpdate] method=' + ctx.method);
			strapi.log.info('[tenantUpdate] params=' + JSON.stringify(ctx.params));
			strapi.log.info('[tenantUpdate] query=' + JSON.stringify(ctx.query));
			strapi.log.info('[tenantUpdate] headers.Authorization=' + String(ctx.request?.headers?.authorization || ctx.headers?.authorization || ''));
		} catch (e) {
			strapi.log.error('Error serializing ctx for debug log', e);
		}

		const tokenTenant = ctx.state?.tenantIdFromToken || ctx.state?.jwtPayload?.tenant_id || ctx.state?.user?.tenant_id;
		const { id } = ctx.params || {};
		if (!id) return ctx.badRequest('Missing id');

		// Low-level DB lookup to validate tenant. Request a full row so we can inspect DB columns.
		let existing: any = null;
		try {
			existing = await strapi.db.query('api::form-widget.form-widget').findOne({ where: { id } });
			strapi.log.info('[tenantUpdate] db.query.findOne result=' + JSON.stringify(existing));
		} catch (err) {
			strapi.log.error('Error looking up form-widget for tenantUpdate via db.query:', err);
			return ctx.internalServerError('Error looking up form-widget');
		}

		// Raw SQL fallback to inspect underlying table (temporary debug)
		try {
			const knex: any = (strapi.db as any).connection;
			if (knex && typeof knex.raw === 'function') {
				const tableName = 'form_widgets';
				const rawRes = await knex.raw('SELECT * FROM ?? WHERE id = ? LIMIT 1', [tableName, id]);
				strapi.log.info('[tenantUpdate] raw SQL result=' + JSON.stringify(rawRes && rawRes.rows ? rawRes.rows : rawRes));
			}
		} catch (err) {
			strapi.log.error('Error running raw SQL fallback for form-widget tenantUpdate:', err);
		}

		if (!existing) return ctx.notFound('Form widget not found');
		const existingTenant = existing?.tenant_id;
		if (typeof tokenTenant !== 'undefined' && existingTenant !== tokenTenant) return ctx.forbidden('You are not allowed to modify this entry');

		if (ctx.request?.body?.data) delete ctx.request.body.data.tenant_id;
		strapi.log.debug('form-widget tenantUpdate performing direct entity update');

		try {
			const data = ctx.request?.body?.data || {};
			const updated = await (strapi.entityService as any).update('api::form-widget.form-widget', id, { data });
			strapi.log.info('[tenantUpdate] entityService.update result=' + JSON.stringify(updated));
			return ctx.send(this.transformResponse(updated));
		} catch (err) {
			strapi.log.error('Error in entityService.update for tenantUpdate (form-widget):', err);
			// fallback to the core controller update if direct update fails
			try {
				return await super.update(ctx);
			} catch (err2) {
				strapi.log.error('super.update fallback failed for form-widget tenantUpdate:', err2);
				return ctx.internalServerError('Update failed');
			}
		}
	},

	async update(ctx) {
		// For form-widget we perform a simple tenant-scoped update on the entity
		const tokenTenant = ctx.state?.tenantIdFromToken || ctx.state?.jwtPayload?.tenant_id || ctx.state?.user?.tenant_id;
		const { id } = ctx.params || {};

		if (!id) return ctx.badRequest('Missing id');

		// Low-level DB lookup to validate tenant
		let existing: any = null;
		try {
			existing = await strapi.db.query('api::form-widget.form-widget').findOne({ where: { id }, select: ['id', 'tenant_id'] });
		} catch (err) {
			strapi.log.error('Error looking up form-widget for tenantUpdate via db.query:', err);
			return ctx.internalServerError('Error looking up form-widget');
		}

		if (!existing) return ctx.notFound('Form widget not found');

		const existingTenant = existing?.tenant_id;
		if (typeof tokenTenant !== 'undefined' && existingTenant !== tokenTenant) {
			return ctx.forbidden('You are not allowed to modify this entry');
		}

		if (ctx.request?.body?.data) delete ctx.request.body.data.tenant_id;

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
