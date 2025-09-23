# Preview Setup Documentation

## Overview
This Strapi application now supports preview functionality for both draft and published content for Pages and Articles.

## Features
- ✅ Preview both draft and published pages
- ✅ Preview both draft and published articles  
- ✅ Automatic public permissions setup for preview endpoints
- ✅ Enhanced error handling and logging
- ✅ Frontend integration with status parameter

## Configuration

### Environment Variables
Make sure these are set in your `.env` file:
```
CLIENT_URL=http://localhost:3000
PREVIEW_SECRET=your_secret_here
```

### Content Types with Preview Support
- **Pages** (`api::page.page`) - Has `draftAndPublish: true`
- **Articles** (`api::article.article`) - Has `draftAndPublish: true`

## Preview URLs

### From Strapi Admin
When you click the preview button in the Strapi admin panel, it will generate URLs like:
```
http://localhost:3000/api/preview?url=/pages/home-example&secret=your_secret&status=draft&documentId=123&locale=en&uid=api::page.page
```

### Direct API Access
You can also access the preview endpoints directly:

**Pages:**
```
GET /api/pages/:documentId/preview?status=draft
GET /api/pages/:documentId/preview?status=published
```

**Articles:**
```
GET /api/articles/:documentId/preview?status=draft  
GET /api/articles/:documentId/preview?status=published
```

## Frontend Integration

The preview handler passes the following parameters to your frontend:
- `url` - The page path (e.g., `/pages/home-example`)
- `secret` - Security token for verification
- `status` - Either 'draft' or 'published'
- `documentId` - The document ID
- `locale` - The content locale
- `uid` - The content type UID

### Example Frontend Preview API Route
```javascript
// pages/api/preview.js
export default async function handler(req, res) {
  const { secret, url, status, documentId, uid } = req.query;
  
  // Verify the secret
  if (secret !== process.env.PREVIEW_SECRET) {
    return res.status(401).json({ message: 'Invalid token' });
  }
  
  // Fetch the content based on status
  const apiUrl = `${process.env.STRAPI_URL}/api${uid.replace('api::', '').replace('.', 's/')}/${documentId}/preview?status=${status}`;
  
  // Enable preview mode and redirect
  res.setPreviewData({
    status,
    documentId,
    uid
  });
  
  res.redirect(url);
}
```

## Permissions
The bootstrap function automatically sets up public permissions for:
- `api::page.page.preview`
- `api::article.article.preview`

## Logging
Preview activities are logged with INFO level. Check your Strapi logs for:
- Preview URL generation
- Permission setup
- Error handling

## Troubleshooting

### Preview Button Not Working
1. Check that `CLIENT_URL` and `PREVIEW_SECRET` are set
2. Verify the frontend preview API route exists
3. Check Strapi logs for errors

### Permission Denied
1. Restart Strapi to run the bootstrap permissions setup
2. Manually check public role permissions in admin panel

### Content Not Found
1. Verify the document exists in the requested status
2. Check if the content type has `draftAndPublish: true`
3. Ensure the document ID is correct