import type { Core } from '@strapi/strapi';

export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/* { strapi }: { strapi: Core.Strapi } */) {},

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    // Set up public permissions for preview endpoints
    await setPublicPermissionsForPreview(strapi);
  },
};

async function setPublicPermissionsForPreview(strapi: Core.Strapi) {
  try {
    // Find the public role
    const publicRole = await strapi.query('plugin::users-permissions.role').findOne({
      where: { type: 'public' },
    });

    if (!publicRole) {
      strapi.log.warn('Public role not found, skipping preview permissions setup');
      return;
    }

    // Define the preview permissions needed
    const previewPermissions = [
      'api::page.page.preview',
      'api::article.article.preview'
    ];

    // Check which permissions already exist
    const existingPermissions = await strapi.query('plugin::users-permissions.permission').findMany({
      where: {
        role: publicRole.id,
        action: { $in: previewPermissions }
      }
    });

    const existingActions = existingPermissions.map(p => p.action);

    // Create missing permissions
    const permissionsToCreate = previewPermissions
      .filter(action => !existingActions.includes(action))
      .map(action => ({
        action,
        role: publicRole.id,
      }));

    if (permissionsToCreate.length > 0) {
      await Promise.all(
        permissionsToCreate.map(permission =>
          strapi.query('plugin::users-permissions.permission').create({ data: permission })
        )
      );
      strapi.log.info(`Created ${permissionsToCreate.length} preview permissions for public role`);
    } else {
      strapi.log.info('All preview permissions already exist for public role');
    }
  } catch (error) {
    strapi.log.error('Error setting up preview permissions:', error);
  }
}
