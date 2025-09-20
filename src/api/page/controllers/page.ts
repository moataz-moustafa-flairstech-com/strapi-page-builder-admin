/**
 * page controller
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::page.page', ({ strapi }) => ({
  // Extend core controller with validation hook for create/update
  async create(ctx) {
    // basic validation scaffold - ensure sections have a placeholder identifier
    const { sections = [], page_template } = ctx.request.body?.data || {};

    for (const sec of sections) {
      if (!sec.place_holder_ui_indentifier) {
        return ctx.badRequest('Each section must have a place_holder_ui_indentifier');
      }
    }

    // validate against the template's layout
    try {
      const res = await strapi.service('api::page.page').validateSectionsAgainstTemplate(page_template, sections || []);
      if (!res.ok) return ctx.badRequest(res.message);
    } catch (err) {
      strapi.log.error(err);
      return ctx.badRequest('Error validating page sections');
    }

    return await super.create(ctx);
  },

  async update(ctx) {
    const { sections = [], page_template } = ctx.request.body?.data || {};

    for (const sec of sections) {
      if (!sec.place_holder_ui_indentifier) {
        return ctx.badRequest('Each section must have a place_holder_ui_indentifier');
      }
    }

    try {
      const res = await strapi.service('api::page.page').validateSectionsAgainstTemplate(page_template, sections || []);
      if (!res.ok) return ctx.badRequest(res.message);
    } catch (err) {
      strapi.log.error(err);
      return ctx.badRequest('Error validating page sections');
    }

    return await super.update(ctx);
  }

}));