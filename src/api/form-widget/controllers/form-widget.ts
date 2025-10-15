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
		strapi.log.debug('form-widget tenantUpdate called');

		const tokenTenant = ctx.state?.tenantIdFromToken || ctx.state?.jwtPayload?.tenant_id || ctx.state?.user?.tenant_id;
		const { id } = ctx.params || {};
		if (!id) return ctx.badRequest('Missing id');

		const documentId = id; // treat the route :id as the documentId

		// Try to find the form-widget via documents API by documentId
		let entry: any = null;
		try {
			entry = await strapi.documents('api::form-widget.form-widget').findOne({ documentId, populate: {} as any });
			strapi.log.debug('[tenantUpdate] documents.findOne result', entry);
		} catch (err) {
			strapi.log.info('[tenantUpdate] documents.findOne failed, will fallback to entityService lookup', err);
		}

		// // If documents API did not return, try to find any entry by documentId via entityService
		// if (!entry) {
		// 	try {
		// 		const item = await strapi.documents('api::form-widget.form-widget').findOne({ documentId });
		// 		if (item) entry = item;
		// 	} catch (err) {
		// 		strapi.log.error('[tenantUpdate] entityService.findMany fallback failed', err);
		// 	}
		// }

		if (!entry) return ctx.notFound('Form widget not found');

		// Determine tenant value (documents API returns attributes)
		const existingTenant = entry?.attributes?.tenant_id ?? entry?.tenant_id ?? entry?.attributes?.tenant ?? null;
		if (typeof tokenTenant !== 'undefined' && existingTenant !== tokenTenant) return ctx.forbidden('You are not allowed to modify this entry');

		// Prevent changing tenant via payload
		if (ctx.request?.body?.data && Object.prototype.hasOwnProperty.call(ctx.request.body.data, 'tenant_id')) {
			delete ctx.request.body.data.tenant_id;
		}

		const data = ctx.request?.body?.data || {};

		// Prefer documents.update when we found a documents entry, otherwise update by entity id
		try {
			if (entry?.attributes) {
				const updated = await strapi.documents('api::form-widget.form-widget').update({ documentId, data });
				return ctx.send(this.transformResponse(updated));
			} else {
				const idToUpdate = entry?.id;
				const updated = await (strapi.entityService as any).update('api::form-widget.form-widget', idToUpdate, { data });
				return ctx.send(this.transformResponse(updated));
			}
		} catch (err) {
			strapi.log.error('Error updating form-widget in tenantUpdate:', err);
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
			
			qs.populate = {
				blocks: {
					on: {
						'shared.form-text-input': true,
						'shared.form-file-input': true,			
						'shared.drop-down-list': { populate: { items: true } },
						'shared.radio-buttons-list': { populate: { items: true } },
						'shared.check-box-input': true,
						'shared.button-input': true
					}
			}};

			return await super.find(ctx);
		} catch (err) {
			strapi.log.error('Error in form-widget find:', err);
			return ctx.internalServerError('Error fetching form widgets');
		}
	},
	async findByDocumentId(ctx) {
		try{
			const { documentId } = ctx.params || {};
			if (!documentId) return ctx.badRequest('Missing documentId');
			const qs: any = ctx.query || {};
			qs.filters = { documentId: documentId };
			qs.populate = {
				blocks: {
					on: {	
						'shared.form-text-input': true,
						'shared.form-file-input': true,
						'shared.drop-down-list': { populate: { items: true } },
						'shared.radio-buttons-list': { populate: { items: true } },
						'shared.check-box-input': true,
						'shared.button-input': true
					}
				}
			};

			const results = await super.find(ctx);
			if (results?.data && Array.isArray(results.data) && results.data.length > 0) {
				return ctx.send({data: results.data[0]});
			}
			return null;
		} catch (err) {
			strapi.log.error('Error in form-widget find:', err);
			return ctx.internalServerError('Error fetching form widgets');
		}

	}
}));
