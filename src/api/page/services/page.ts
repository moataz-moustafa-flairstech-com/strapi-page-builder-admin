/**
 * page service
 */

import { factories } from '@strapi/strapi';

function collectUiIdentifiers(placeHolder) {
	const ids = new Set();
	function walk(node) {
		if (!node) return;
		if (node.ui_identifier) ids.add(node.ui_identifier);
		if (node.blocks && Array.isArray(node.blocks)) {
			for (const child of node.blocks) {
				// if child is a place-holder component it will have ui_identifier or nested blocks
				walk(child);
			}
		}
	}
	walk(placeHolder);
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

			const allowed = collectUiIdentifiers(template.layout);

		for (const s of sections || []) {
			if (!s.place_holder_ui_indentifier) {
				return { ok: false, message: `Section ${s.name || 'unknown'} missing place_holder_ui_indentifier` };
			}
			if (!allowed.has(s.place_holder_ui_indentifier)) {
				return { ok: false, message: `Unknown placeholder identifier: ${s.place_holder_ui_indentifier}` };
			}
		}

		return { ok: true };
	},
}));