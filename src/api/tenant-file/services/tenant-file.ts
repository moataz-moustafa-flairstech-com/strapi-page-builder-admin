import { factories } from '@strapi/strapi';

export default factories.createCoreService(('api::tenant-file.tenant-file') as any, ({ strapi }) => ({
  async findOne(id: any, params: any = {}) {
    return await (strapi.entityService as any).findOne('api::tenant-file.tenant-file', id, params);
  },

  async find(params: any = {}) {
    return await (strapi.entityService as any).findMany('api::tenant-file.tenant-file', params);
  }
}));
