const pluginPkg = require('../../package.json');
const pluginId = pluginPkg.strapi && pluginPkg.strapi.name ? pluginPkg.strapi.name : 'placeholder-picker';
module.exports = pluginId;
