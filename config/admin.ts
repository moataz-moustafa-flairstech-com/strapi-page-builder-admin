
const getPreviewPathname = (uid, { locale, document }) => {
  const { slug } = document;
  switch (uid) {
    case "api::article.article": {
      if (!slug) {
        return "/articles"; // Article listing page
      }
      return `/articles/${slug}`; // Individual article page
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
      async handler(uid, { documentId, locale, status }) {
        const document = await strapi.documents(uid).findOne({ documentId });
        const pathname = getPreviewPathname(uid, { locale, document });
        if (!pathname) {
          return null;
        }
        const previewSecret = env("PREVIEW_SECRET");
        const clientUrl = env("CLIENT_URL");
        const urlSearchParams = new URLSearchParams({
          url: pathname,
          secret: previewSecret,
          status,
        });
        return `${clientUrl}/api/preview?${urlSearchParams}`;
      },
    },
  },
});
