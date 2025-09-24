export default () => ({
  'color-picker': {
    enabled: true,
    config: {
      // Enable color picker for all string fields with the plugin option
      consentNeeded: false,
    },
  },
  'placeholder-picker': {
    enabled: true,
    // Tell Strapi where the local plugin lives so it can be loaded during develop
    resolve: './src/plugins/placeholder-picker',
  },
});
