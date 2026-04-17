# Supabase Auth Email Templates

Paste these into **Supabase Dashboard > Authentication > Email Templates**.

All templates use the Palvento design system: cream background (#f3f0ea), white card, ink text (#0b0f1a), cobalt CTA (#1d5fdb), system fonts. The triangle mark is inlined as an SVG data URI so it renders without external image loading.

---

## Confirmation Email

**Subject:** `Confirm your email`

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<!--[if mso]>
<noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
<![endif]-->
<style>
  body, table, td, p, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
  table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
</style>
</head>
<body style="margin:0;padding:0;background-color:#f3f0ea;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#0b0f1a;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f0ea;">
<tr><td align="center" style="padding:40px 16px;">

<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
<tr><td style="padding:0 0 32px 0;">
  <table role="presentation" cellpadding="0" cellspacing="0"><tr>
    <td style="vertical-align:middle;padding-right:8px;">
      <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 20 20'%3E%3Cpath d='M10 2L18.66 18H1.34L10 2z' fill='%230b0f1a'/%3E%3C/svg%3E" width="20" height="20" alt="" style="display:block;" />
    </td>
    <td style="vertical-align:middle;font-size:14px;font-weight:600;color:#0b0f1a;letter-spacing:-0.01em;">Palvento</td>
  </tr></table>
</td></tr>

<tr><td style="background-color:#ffffff;border:1px solid #e8e5de;padding:40px 40px 36px;">
  <h1 style="font-family:'Instrument Serif',Georgia,serif;font-size:28px;font-weight:400;letter-spacing:-0.02em;line-height:1.2;margin:0 0 20px;color:#0b0f1a;">Confirm your email address.</h1>
  <p style="font-size:15px;line-height:1.65;color:#1c2233;margin:0 0 16px;">Click the button below to verify your email and activate your Palvento account.</p>
  <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:24px;">
  <tr><td align="center" style="background-color:#0b0f1a;border-radius:6px;">
    <!--[if mso]>
    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="{{ .ConfirmationURL }}" style="height:44px;v-text-anchor:middle;width:200px;" arcsize="14%" strokecolor="#0b0f1a" fillcolor="#0b0f1a">
    <w:anchorlock/><center style="color:#f3f0ea;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:14px;font-weight:500;">Confirm email</center>
    </v:roundrect>
    <![endif]-->
    <!--[if !mso]><!-->
    <a href="{{ .ConfirmationURL }}" style="display:inline-block;background-color:#0b0f1a;color:#f3f0ea;text-decoration:none;border-radius:6px;padding:12px 24px;font-size:14px;font-weight:500;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;line-height:1;">Confirm email</a>
    <!--<![endif]-->
  </td></tr></table>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;"><tr><td style="border-top:1px solid #e8e5de;font-size:0;line-height:0;">&nbsp;</td></tr></table>
  <p style="font-size:13px;line-height:1.6;color:#5a6171;margin:0;">If you did not create a Palvento account, you can ignore this email.</p>
</td></tr>

<tr><td style="padding:24px 0 0 0;font-size:12px;line-height:1.7;color:#5a6171;">
  <p style="margin:0 0 4px;">&copy; 2026 NPX Solutions Ltd &middot; <a href="https://palvento.com" style="color:#5a6171;text-decoration:none;">palvento.com</a></p>
  <p style="margin:0;color:#8a8f9c;">NPX Solutions Ltd, 71-75 Shelton Street, Covent Garden, London, WC2H 9JQ, United Kingdom</p>
</td></tr>
</table>

</td></tr></table>
</body>
</html>
```

---

## Password Reset

**Subject:** `Reset your password`

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<!--[if mso]>
<noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
<![endif]-->
<style>
  body, table, td, p, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
  table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
</style>
</head>
<body style="margin:0;padding:0;background-color:#f3f0ea;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#0b0f1a;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f0ea;">
<tr><td align="center" style="padding:40px 16px;">

<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
<tr><td style="padding:0 0 32px 0;">
  <table role="presentation" cellpadding="0" cellspacing="0"><tr>
    <td style="vertical-align:middle;padding-right:8px;">
      <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 20 20'%3E%3Cpath d='M10 2L18.66 18H1.34L10 2z' fill='%230b0f1a'/%3E%3C/svg%3E" width="20" height="20" alt="" style="display:block;" />
    </td>
    <td style="vertical-align:middle;font-size:14px;font-weight:600;color:#0b0f1a;letter-spacing:-0.01em;">Palvento</td>
  </tr></table>
</td></tr>

<tr><td style="background-color:#ffffff;border:1px solid #e8e5de;padding:40px 40px 36px;">
  <h1 style="font-family:'Instrument Serif',Georgia,serif;font-size:28px;font-weight:400;letter-spacing:-0.02em;line-height:1.2;margin:0 0 20px;color:#0b0f1a;">Reset your password.</h1>
  <p style="font-size:15px;line-height:1.65;color:#1c2233;margin:0 0 16px;">We received a request to reset the password for your Palvento account. Click the button below to choose a new password.</p>
  <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:24px;">
  <tr><td align="center" style="background-color:#0b0f1a;border-radius:6px;">
    <!--[if mso]>
    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="{{ .ConfirmationURL }}" style="height:44px;v-text-anchor:middle;width:200px;" arcsize="14%" strokecolor="#0b0f1a" fillcolor="#0b0f1a">
    <w:anchorlock/><center style="color:#f3f0ea;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:14px;font-weight:500;">Reset password</center>
    </v:roundrect>
    <![endif]-->
    <!--[if !mso]><!-->
    <a href="{{ .ConfirmationURL }}" style="display:inline-block;background-color:#0b0f1a;color:#f3f0ea;text-decoration:none;border-radius:6px;padding:12px 24px;font-size:14px;font-weight:500;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;line-height:1;">Reset password</a>
    <!--<![endif]-->
  </td></tr></table>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;"><tr><td style="border-top:1px solid #e8e5de;font-size:0;line-height:0;">&nbsp;</td></tr></table>
  <p style="font-size:13px;line-height:1.6;color:#5a6171;margin:0;">This link expires in 24 hours. If you did not request a password reset, you can safely ignore this email. Your password will not be changed.</p>
</td></tr>

<tr><td style="padding:24px 0 0 0;font-size:12px;line-height:1.7;color:#5a6171;">
  <p style="margin:0 0 4px;">&copy; 2026 NPX Solutions Ltd &middot; <a href="https://palvento.com" style="color:#5a6171;text-decoration:none;">palvento.com</a></p>
  <p style="margin:0;color:#8a8f9c;">NPX Solutions Ltd, 71-75 Shelton Street, Covent Garden, London, WC2H 9JQ, United Kingdom</p>
</td></tr>
</table>

</td></tr></table>
</body>
</html>
```

---

## Magic Link

**Subject:** `Your login link`

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<!--[if mso]>
<noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
<![endif]-->
<style>
  body, table, td, p, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
  table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
</style>
</head>
<body style="margin:0;padding:0;background-color:#f3f0ea;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#0b0f1a;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f0ea;">
<tr><td align="center" style="padding:40px 16px;">

<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
<tr><td style="padding:0 0 32px 0;">
  <table role="presentation" cellpadding="0" cellspacing="0"><tr>
    <td style="vertical-align:middle;padding-right:8px;">
      <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 20 20'%3E%3Cpath d='M10 2L18.66 18H1.34L10 2z' fill='%230b0f1a'/%3E%3C/svg%3E" width="20" height="20" alt="" style="display:block;" />
    </td>
    <td style="vertical-align:middle;font-size:14px;font-weight:600;color:#0b0f1a;letter-spacing:-0.01em;">Palvento</td>
  </tr></table>
</td></tr>

<tr><td style="background-color:#ffffff;border:1px solid #e8e5de;padding:40px 40px 36px;">
  <h1 style="font-family:'Instrument Serif',Georgia,serif;font-size:28px;font-weight:400;letter-spacing:-0.02em;line-height:1.2;margin:0 0 20px;color:#0b0f1a;">Your login link.</h1>
  <p style="font-size:15px;line-height:1.65;color:#1c2233;margin:0 0 16px;">Click the button below to sign in to Palvento. This link expires in 10 minutes.</p>
  <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:24px;">
  <tr><td align="center" style="background-color:#0b0f1a;border-radius:6px;">
    <!--[if mso]>
    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="{{ .ConfirmationURL }}" style="height:44px;v-text-anchor:middle;width:200px;" arcsize="14%" strokecolor="#0b0f1a" fillcolor="#0b0f1a">
    <w:anchorlock/><center style="color:#f3f0ea;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:14px;font-weight:500;">Sign in to Palvento</center>
    </v:roundrect>
    <![endif]-->
    <!--[if !mso]><!-->
    <a href="{{ .ConfirmationURL }}" style="display:inline-block;background-color:#0b0f1a;color:#f3f0ea;text-decoration:none;border-radius:6px;padding:12px 24px;font-size:14px;font-weight:500;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;line-height:1;">Sign in to Palvento</a>
    <!--<![endif]-->
  </td></tr></table>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;"><tr><td style="border-top:1px solid #e8e5de;font-size:0;line-height:0;">&nbsp;</td></tr></table>
  <p style="font-size:13px;line-height:1.6;color:#5a6171;margin:0;">If you did not request this link, you can ignore this email.</p>
</td></tr>

<tr><td style="padding:24px 0 0 0;font-size:12px;line-height:1.7;color:#5a6171;">
  <p style="margin:0 0 4px;">&copy; 2026 NPX Solutions Ltd &middot; <a href="https://palvento.com" style="color:#5a6171;text-decoration:none;">palvento.com</a></p>
  <p style="margin:0;color:#8a8f9c;">NPX Solutions Ltd, 71-75 Shelton Street, Covent Garden, London, WC2H 9JQ, United Kingdom</p>
</td></tr>
</table>

</td></tr></table>
</body>
</html>
```

---

## Invite

**Subject:** `You've been invited to Palvento`

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<!--[if mso]>
<noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
<![endif]-->
<style>
  body, table, td, p, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
  table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
</style>
</head>
<body style="margin:0;padding:0;background-color:#f3f0ea;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#0b0f1a;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f0ea;">
<tr><td align="center" style="padding:40px 16px;">

<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
<tr><td style="padding:0 0 32px 0;">
  <table role="presentation" cellpadding="0" cellspacing="0"><tr>
    <td style="vertical-align:middle;padding-right:8px;">
      <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 20 20'%3E%3Cpath d='M10 2L18.66 18H1.34L10 2z' fill='%230b0f1a'/%3E%3C/svg%3E" width="20" height="20" alt="" style="display:block;" />
    </td>
    <td style="vertical-align:middle;font-size:14px;font-weight:600;color:#0b0f1a;letter-spacing:-0.01em;">Palvento</td>
  </tr></table>
</td></tr>

<tr><td style="background-color:#ffffff;border:1px solid #e8e5de;padding:40px 40px 36px;">
  <h1 style="font-family:'Instrument Serif',Georgia,serif;font-size:28px;font-weight:400;letter-spacing:-0.02em;line-height:1.2;margin:0 0 20px;color:#0b0f1a;">You have been invited to Palvento.</h1>
  <p style="font-size:15px;line-height:1.65;color:#1c2233;margin:0 0 16px;">A teammate has invited you to join their Palvento workspace. Click the button below to accept the invitation and set up your account.</p>
  <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:24px;">
  <tr><td align="center" style="background-color:#0b0f1a;border-radius:6px;">
    <!--[if mso]>
    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="{{ .ConfirmationURL }}" style="height:44px;v-text-anchor:middle;width:200px;" arcsize="14%" strokecolor="#0b0f1a" fillcolor="#0b0f1a">
    <w:anchorlock/><center style="color:#f3f0ea;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:14px;font-weight:500;">Accept invitation</center>
    </v:roundrect>
    <![endif]-->
    <!--[if !mso]><!-->
    <a href="{{ .ConfirmationURL }}" style="display:inline-block;background-color:#0b0f1a;color:#f3f0ea;text-decoration:none;border-radius:6px;padding:12px 24px;font-size:14px;font-weight:500;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;line-height:1;">Accept invitation</a>
    <!--<![endif]-->
  </td></tr></table>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;"><tr><td style="border-top:1px solid #e8e5de;font-size:0;line-height:0;">&nbsp;</td></tr></table>
  <p style="font-size:13px;line-height:1.6;color:#5a6171;margin:0;">If you were not expecting this invitation, you can ignore this email.</p>
</td></tr>

<tr><td style="padding:24px 0 0 0;font-size:12px;line-height:1.7;color:#5a6171;">
  <p style="margin:0 0 4px;">&copy; 2026 NPX Solutions Ltd &middot; <a href="https://palvento.com" style="color:#5a6171;text-decoration:none;">palvento.com</a></p>
  <p style="margin:0;color:#8a8f9c;">NPX Solutions Ltd, 71-75 Shelton Street, Covent Garden, London, WC2H 9JQ, United Kingdom</p>
</td></tr>
</table>

</td></tr></table>
</body>
</html>
```
