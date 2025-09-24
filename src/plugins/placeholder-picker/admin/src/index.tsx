import React from 'react';
// @ts-ignore: the Strapi admin helper types are not installed in this workspace; treat as any for editor
import { prefixPluginTranslations } from '@strapi/helper-plugin';
import PlaceholderPicker from './components/PlaceholderPicker';
const pluginId = require('./pluginId');

export default {
  register(app: any) {
    app.customFields.register({
      name: 'placeholder',
      pluginId: pluginId,
      type: 'string',
      intlLabel: {
        id: 'placeholder-picker.field.label',
        defaultMessage: 'Placeholder'
      },
      intlDescription: {
        id: 'placeholder-picker.field.description',
        defaultMessage: 'Pick a placeholder from the selected page template layout'
      },
      icon: () => null,
      components: {
        Input: PlaceholderPicker,
      },
    });
  },
  bootstrap(app: any) {
    // nothing
  },
  async registerTrads({ locales }: any) {
    const importedTrads = await Promise.all(
      locales.map((locale: any) => import(`./translations/${locale}.json`).catch(() => ({})))
    );

    return Promise.resolve(
      importedTrads.map((trad, index) => ({
        data: prefixPluginTranslations(trad.default || trad, locales[index]),
        locale: locales[index],
      }))
    );
  },
};