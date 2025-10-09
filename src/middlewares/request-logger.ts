/**
 * Request logger middleware
 * Logs method, url, headers and (when safe) the body for each request.
 */
export default (config, { strapi }) => {
  return async (ctx, next) => {
    try {
      const { method, url, headers } = ctx.request;
      // Clone body safely (could be stream) and stringify if possible
      let bodyPreview = undefined;
      try {
        // prefer ctx.request.body but avoid heavy objects
        bodyPreview = ctx.request?.body ? JSON.stringify(ctx.request.body) : undefined;
      } catch (e) {
        bodyPreview = '[unserializable body]';
      }

      strapi.log.info(`[request-logger] ${method} ${url}`);
      strapi.log.info(`[request-logger] headers: ${JSON.stringify(headers)}`);
      if (typeof bodyPreview !== 'undefined') {
        strapi.log.info(`[request-logger] body: ${bodyPreview}`);
      }
    } catch (err) {
      strapi.log.info('Error in request-logger middleware', err);
    }

    await next();
  };
};
