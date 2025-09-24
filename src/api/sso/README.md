SSO endpoint

GET /sso?otp=<otp>

This endpoint looks up the OTP in a central MySQL database using env vars prefixed by MULTITENANT_DATABASE_*, retrieves tenant info, stores it in session, creates a JWT cookie and redirects to /admin.

Note: This implementation creates a simple JWT and sets it as `strapi_jwt` cookie to allow bypassing login; depending on Strapi auth and plugins, additional server-side user session creation / tokens may be required.
