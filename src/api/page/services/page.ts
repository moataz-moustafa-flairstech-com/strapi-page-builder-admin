/**
 * page service
 */

import { factories } from '@strapi/strapi';

function collectUiIdentifiersFromTemplateLayout(layout) {
	const ids = new Set();

	if (!layout) return ids;

	// layout is an array of layout-repeaters
	for (const repeater of layout) {
		if (!repeater) continue;
		const blocks = repeater.blocks || [];
		for (const ph of blocks) {
			if (!ph) continue;
			if (ph.ui_identifier) ids.add(ph.ui_identifier);
		}
	}

	return ids;
}

export default factories.createCoreService('api::page.page', ({ strapi }) => ({
	async validateSectionsAgainstTemplate(templateId, sections) {
		if (!templateId) {
			return { ok: false, message: 'Missing page_template id' };
		}

				const template = (await strapi.entityService.findOne('api::page-template.page-template', templateId, {
						populate: '*',
					})) as any;

				if (!template) {
					return { ok: false, message: `page-template with id ${templateId} not found` };
				}

				// With layout and placeholder components removed, there are no specific
				// placeholder validations to perform at this time.
				return { ok: true };
	},
}));