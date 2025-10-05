import { factories } from '@strapi/strapi';

export default factories.createCoreController(('api::tenant-file.tenant-file') as any, ({ strapi }) => ({
  async create(ctx) {
    const tokenTenant = ctx.state?.tenantIdFromToken || ctx.state?.jwtPayload?.tenant_id || ctx.state?.user?.tenant_id;

    // set tenant_id from token or default
    ctx.request.body = ctx.request.body || {};
    ctx.request.body.data = ctx.request.body.data || {};
    ctx.request.body.data.tenant_id = tokenTenant || ctx.request.body.data.tenant_id || 'tenant24';

    return await super.create(ctx);
  },

  async update(ctx) {
    const tokenTenant = ctx.state?.tenantIdFromToken || ctx.state?.jwtPayload?.tenant_id || ctx.state?.user?.tenant_id;
    const { id } = ctx.params || {};

    if (!id) return ctx.badRequest('Missing id');

  const existing = await (strapi.entityService as any).findOne('api::tenant-file.tenant-file', id, { fields: ['tenant_id'] });
  if (!existing) return ctx.notFound('Tenant file not found');

  const existingTenant = (existing as any)?.tenant_id;
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

  const existing = await (strapi.entityService as any).findOne('api::tenant-file.tenant-file', id, { fields: ['tenant_id'] });
  if (!existing) return ctx.notFound('Tenant file not found');

  const existingTenant = (existing as any)?.tenant_id;
    if (typeof tokenTenant !== 'undefined' && existingTenant !== tokenTenant) {
      return ctx.forbidden('You are not allowed to delete this entry');
    }

    return await super.delete(ctx);
  },

  async find(ctx) {
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
      strapi.log.error('Error in tenant-file find:', err);
      return ctx.internalServerError('Error fetching tenant files');
    }
  },

  // Helper endpoint to fetch the upload file metadata by document id
  async uploadFile(ctx) {
    const { documentId } = ctx.params || {};
    if (!documentId) return ctx.badRequest('Missing documentId');

    try {
  const file = await (strapi.entityService as any).findOne('plugin::upload.file', documentId, { populate: '*' });
      if (!file) return ctx.notFound('Upload file not found');
      return ctx.send({ data: file });
    } catch (err) {
      strapi.log.error('Error fetching upload file:', err);
      return ctx.internalServerError('Error fetching upload file');
    }
  },


  // Upload a new binary file via the upload plugin and create a tenant-file mapping
  async UploadNewFile(ctx) {
    try {
      const tokenTenant = ctx.state?.tenantIdFromToken || ctx.state?.jwtPayload?.tenant_id || ctx.state?.user?.tenant_id || 'tenant24';

      // Koa/Strapi parses multipart/form-data into ctx.request.files
      const files = (ctx.request as any).files || (ctx.req as any).files;
      if (!files) {
        return ctx.badRequest('No file provided');
      }

      const uploadService = (strapi.plugin as any)('upload').service('upload');

      // Use upload service: it expects { data, files }
      const uploaded = await uploadService.upload({ data: {}, files });

      if (!uploaded || !Array.isArray(uploaded) || uploaded.length === 0) {
        return ctx.internalServerError('Upload failed');
      }

      const uploadedFile = uploaded[0];

      // Create tenant-file entry mapping to the upload file id
      const tenantFile = await (strapi.entityService as any).create('api::tenant-file.tenant-file', {
        data: {
          file_document_id: String(uploadedFile.id),
          tenant_id: tokenTenant,
        },
      });

      return ctx.send({ documentId: tenantFile.id, file: uploadedFile });
    } catch (err) {
      strapi.log.error('Error in UploadNewFile:', err);
      return ctx.internalServerError('Error uploading file');
    }
  }
}));
