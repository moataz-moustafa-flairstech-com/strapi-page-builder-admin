// Minimal ambient declarations for Strapi admin helper modules used in the custom field.
// These silence editor/TS errors when the dedicated type packages are not available.

declare module '@strapi/helper-plugin' {
  // export anything used to avoid type errors in admin plugin code
  export const prefixPluginTranslations: any;
  export function useCMEditViewDataManager(...args: any[]): any;
  export function useFetchClient(...args: any[]): any;
  export const request: any;
  const _default: any;
  export default _default;
}

declare module '@strapi/design-system' {
  // design system exports used in the plugin - typed as any to keep things simple
  export const Box: any;
  export const Button: any;
  export const Typography: any;
  export const Stack: any;
  export const Flex: any;
  const _default: any;
  export default _default;
}

declare module '@strapi/helper-plugin/dist' {
  const _default: any;
  export default _default;
}
