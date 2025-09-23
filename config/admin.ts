
const getPreviewPathname = (uid, { locale, document }) => {
  const { slug } = document;
  switch (uid) {
    case "api::article.article": {
      if (!slug) {
        return "/articles"; // Article listing page
      }
      return `/articles/${slug}`; // Individual article page
    }
    case "api::page.page": {
      // Pages use a simple slug-based route in the example frontend.
      // If a page has no slug, return the home page path.
      if (!slug) {
        return '/pages';
      }
      // You can customize this to match your frontend routing (e.g. /pages/:slug or /:slug)
      return `/pages/${slug}`;
    }
    default:
      return null;
  }
};

export default ({ env }) => ({
  auth: {
    secret: env('ADMIN_JWT_SECRET'),
  },
  apiToken: {
    salt: env('API_TOKEN_SALT'),
  },
  transfer: {
    token: {
      salt: env('TRANSFER_TOKEN_SALT'),
    },
  },
  secrets: {
    encryptionKey: env('ENCRYPTION_KEY'),
  },
  flags: {
    nps: env.bool('FLAG_NPS', true),
    promoteEE: env.bool('FLAG_PROMOTE_EE', true),
  },
  preview: {
    enabled: true,
    config: {
      allowedOrigins: env("CLIENT_URL"),
      async handler(uid, { documentId, locale }) {
        try {
          
          // First, try to fetch the document to determine its actual status and locale
          // We'll try both draft and published to see what exists
          let document = null;
          let actualStatus = null;
          let actualLocale = locale || 'en';
          
            try {
              document = await strapi.documents(uid).findOne({ 
                documentId,
                locale: actualLocale,
                status: 'published'
              });
              if (document) {
                actualStatus = 'published';
                actualLocale = document.locale || 'en';                  
              }
            } catch (err) {
              strapi.log.debug('Published version not found, trying draft');
            }
            
            if (!document) {
              try {
                document = await strapi.documents(uid).findOne({ 
                  documentId,
                  locale: actualLocale,
                  status: 'draft'
                });
                if (document) {
                  actualStatus = 'draft';
                  actualLocale = document.locale || 'en';                  
                }
              } catch (err) {
                strapi.log.debug('Draft version not found');
              }
            }
          
          // If we still don't have a document, try without locale/status constraints
          if (!document) {
            document = await strapi.documents(uid).findOne({ documentId });
            if (document) {
              // Extract status and locale from the document
              actualStatus = document.publishedAt ? 'published' : 'draft';
              actualLocale = document.locale || 'en';
            }
          }
          
          if (!document) {
            strapi.log.warn(`Preview: Document not found - UID: ${uid}, DocumentID: ${documentId}`);
            return null;
          }
          
          // Use actual values or fallbacks
          const finalStatus = actualStatus || 'draft';
          const finalLocale = actualLocale || document.locale || 'en';
          
          strapi.log.info(`Final preview parameters - UID: ${uid}, DocumentID: ${documentId}, Locale: ${finalLocale}, Status: ${finalStatus}`);
          
          const pathname = getPreviewPathname(uid, { locale: finalLocale, document });
          if (!pathname) {
            strapi.log.warn(`Preview: No pathname generated for UID: ${uid}`);
            return null;
          }
          
          const previewSecret = env("PREVIEW_SECRET");
          const clientUrl = env("CLIENT_URL");
          
          if (!previewSecret || !clientUrl) {
            strapi.log.error('Preview: Missing PREVIEW_SECRET or CLIENT_URL environment variables');
            return null;
          }
          
          const urlSearchParams = new URLSearchParams({
            url: pathname,
            secret: previewSecret,
            status: finalStatus,
            documentId,
            locale: finalLocale,
            uid,
          });
          
          const previewUrl = `${clientUrl}/api/preview?${urlSearchParams}`;
          strapi.log.info(`Preview URL generated: ${previewUrl}`);
          
          return previewUrl;
        } catch (error) {
          strapi.log.error('Preview handler error:', error);
          return null;
        }
      },
    },
  },
});
