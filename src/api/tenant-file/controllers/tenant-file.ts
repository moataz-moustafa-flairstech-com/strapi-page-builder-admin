/**
 * tenant-file controller
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::tenant-file.tenant-file', ({ strapi }) => ({
		async find(ctx) {

      strapi.log.info('Custom tenant-file find called');
			// Enforce tenant filter from token if present
			const qs: any = ctx.query || {};
			const tokenTenant = ctx.state?.tenantIdFromToken || ctx.state?.jwtPayload?.tenant_id || ctx.state?.user?.tenant_id;

			if (!qs.filters) qs.filters = {};
			if (typeof tokenTenant !== 'undefined') {
				qs.filters.tenant_id = { $eq: tokenTenant };
				ctx.query = qs;
			}
      strapi.log.info('Query after tenant enforcement:', tokenTenant);
			// Call core implementation
			const result = await super.find(ctx);

      strapi.log.info('Query after tenant enforcement:', tokenTenant);


			try {
				const items = Array.isArray(result?.data) ? result.data : [];
			const docIds = items
				.map((entry: any) => {
					if (entry?.attributes && entry.attributes.file_document_id) return entry.attributes.file_document_id;
					if (entry?.file_document_id) return entry.file_document_id;
					return null;
				})
				.filter(Boolean);

			if (docIds.length === 0) return result;

			// Fetch upload files by their documentId
					const uploadFiles = await (strapi.entityService as any).findMany('plugin::upload.file', {
						filters: { documentId: { $in: docIds } },
						populate: '*',
					});

			const uploadByDocumentId = new Map(uploadFiles.map((f: any) => [String(f.documentId), f]));

			// Attach upload metadata to each item as `upload`
			result.data = items.map((entry: any) => {
				const docId = entry?.attributes?.file_document_id ?? entry?.file_document_id;
				const upload = docId ? uploadByDocumentId.get(String(docId)) ?? null : null;
				if (entry?.attributes) {
					entry.attributes.upload = upload;
				} else {
					entry.upload = upload;
				}
				return entry;
			});
		} catch (err) {
			strapi.log.error('Error enriching tenant-file find with upload files:', err);
		}

		return result;
	},

	async findOne(ctx) {
		// Enforce tenant ownership when fetching a single item
		const tokenTenant = ctx.state?.tenantIdFromToken || ctx.state?.jwtPayload?.tenant_id || ctx.state?.user?.tenant_id;

		const requestedId = ctx.params?.id;
		strapi.log.info(`tenant-file.findOne called id=${requestedId}, tokenTenant=${tokenTenant}`);

		// Try to resolve the requested identifier to an actual DB row.
		// Accept either a numeric PK or a file_document_id (documentId) passed in the URL.
		let rawRow: any = null;
		try {
			// First try by primary id (as passed)
			rawRow = await strapi.db.query('api::tenant-file.tenant-file').findOne({ where: { id: requestedId } });

			// If not found and requestedId looks like a non-numeric documentId, try lookup by file_document_id
			if (!rawRow && requestedId && isNaN(Number(requestedId))) {
				rawRow = await strapi.db.query('api::tenant-file.tenant-file').findOne({ where: { file_document_id: requestedId } });
				if (rawRow) {
					// Rewrite params.id so that the core controller will fetch the correct entity by PK
					ctx.params = ctx.params || {};
					ctx.params.id = rawRow.id;
				}
			}

			strapi.log.info('tenant-file.rawRow=' + JSON.stringify(rawRow));
		} catch (err) {
			strapi.log.error('Error running raw DB lookup for tenant-file.findOne', err);
		}

		const result = await super.findOne(ctx);

		try {
				const entry = result?.data || result;
				// Check tenant ownership
				const existingTenant = entry?.attributes?.tenant_id ?? entry?.tenant_id;
				if (typeof tokenTenant !== 'undefined' && existingTenant !== tokenTenant) {
					return ctx.forbidden('You are not allowed to view this entry');
				}
			const docId = entry?.attributes?.file_document_id ?? entry?.file_document_id;
			if (!docId) return result;

					const uploadFiles = await (strapi.entityService as any).findMany('plugin::upload.file', {
						filters: { documentId: { $eq: docId } },
						populate: '*',
					});

			const upload = Array.isArray(uploadFiles) && uploadFiles.length ? uploadFiles[0] : null;

			if (entry?.attributes) {
				entry.attributes.upload = upload;
				result.data = entry;
			} else if (result?.data) {
				result.data.upload = upload;
			} else {
				// fallback shape
				result.upload = upload;
			}
		} catch (err) {
			strapi.log.error('Error enriching tenant-file findOne with upload file:', err);
		}

		return result;
	},

	async create(ctx) {
		const tokenTenant = ctx.state?.tenantIdFromToken || ctx.state?.jwtPayload?.tenant_id || ctx.state?.user?.tenant_id;

		if (!tokenTenant) {
			return ctx.badRequest('Missing tenant_id in token');
		}

		// Ensure tenant_id is set from token and cannot be overridden by client
		ctx.request.body = ctx.request.body || {};
		ctx.request.body.data = ctx.request.body.data || {};
		ctx.request.body.data.tenant_id = tokenTenant;

		return await super.create(ctx);
	},


	async delete(ctx) {
		const tokenTenant = ctx.state?.tenantIdFromToken || ctx.state?.jwtPayload?.tenant_id || ctx.state?.user?.tenant_id;
		const { id } = ctx.params || {};

		if (!id) return ctx.badRequest('Missing id');

		const existing = await strapi.entityService.findOne('api::tenant-file.tenant-file', id, { fields: ['tenant_id'] } as any);
		if (!existing) return ctx.notFound('Tenant-file not found');

		const existingTenant = existing?.tenant_id;
		if (typeof tokenTenant !== 'undefined' && existingTenant !== tokenTenant) {
			return ctx.forbidden('You are not allowed to delete this entry');
		}

		// Log existing entry for debugging
		strapi.log.info(`Deleting tenant-file id=${id}, tenant_id=${existingTenant}`);

		// Use entityService.delete directly to ensure deletion and inspect result
		try {
			const deleted = await strapi.entityService.delete('api::tenant-file.tenant-file', id as any);
			strapi.log.info('Tenant-file deleted result: ' + JSON.stringify(deleted));
			// Return 204 No Content on successful deletion
			ctx.status = 204;
			ctx.body = null;
			return;
		} catch (err) {
			strapi.log.error('Error deleting tenant-file via entityService:', err);
			return ctx.internalServerError('Error deleting tenant-file');
		}
	},
}));
