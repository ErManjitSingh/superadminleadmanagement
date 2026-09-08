import type { User } from '@/src/types';
import { CRM_WEB_ORIGIN } from '@/src/constants/crmMenu';

export function buildCrmUrl(path: string) {
  const raw = Array.isArray(path) ? path[0] : path;
  const decoded = decodeURIComponent(String(raw || '/'));
  const clean = decoded.startsWith('/') ? decoded : `/${decoded}`;
  return `${CRM_WEB_ORIGIN.replace(/\/$/, '')}${clean}`;
}

export function buildAuthBridgeHtml(
  token: string,
  user: User,
  targetUrl: string,
  tenantSubdomain?: string
) {
  const expiresAt = Date.now() + 1000 * 60 * 60 * 12;
  const now = Date.now();
  const sessionUser = {
    _id: user._id || user.id,
    id: user.id || user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    roleName: user.roleName,
    companyId: user.companyId,
    permissions: user.permissions,
  };

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Signing in…</title>
  <style>
    body{font-family:-apple-system,Segoe UI,Roboto,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f8fafc;color:#334155}
    .box{text-align:center;padding:24px}
    .spin{width:36px;height:36px;border:3px solid #ddd6fe;border-top-color:#7c3aed;border-radius:50%;margin:0 auto 14px;animation:s 0.8s linear infinite}
    @keyframes s{to{transform:rotate(360deg)}}
  </style>
</head>
<body>
  <div class="box">
    <div class="spin"></div>
    <div>Signing into CRM…</div>
  </div>
  <script>
    (function () {
      try {
        localStorage.setItem('token', ${JSON.stringify(token)});
        localStorage.setItem('user', ${JSON.stringify(JSON.stringify(sessionUser))});
        localStorage.setItem('role', ${JSON.stringify(user.role || '')});
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('sessionExpiresAt', ${JSON.stringify(String(expiresAt))});
        localStorage.setItem('lastActivityAt', ${JSON.stringify(String(now))});
        ${
          tenantSubdomain
            ? `localStorage.setItem('tenant_subdomain', ${JSON.stringify(tenantSubdomain)});`
            : ''
        }
      } catch (e) {}
      window.location.replace(${JSON.stringify(targetUrl)});
    })();
  </script>
</body>
</html>`;
}

/** Keep session alive if SPA navigates within CRM */
export function buildAuthReinjectScript(token: string, user: User, tenantSubdomain?: string) {
  const sessionUser = {
    _id: user._id || user.id,
    id: user.id || user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    roleName: user.roleName,
    companyId: user.companyId,
    permissions: user.permissions,
  };
  const expiresAt = Date.now() + 1000 * 60 * 60 * 12;
  return `
    (function(){
      try {
        if (!localStorage.getItem('token')) {
          localStorage.setItem('token', ${JSON.stringify(token)});
          localStorage.setItem('user', ${JSON.stringify(JSON.stringify(sessionUser))});
          localStorage.setItem('role', ${JSON.stringify(user.role || '')});
          localStorage.setItem('isAuthenticated', 'true');
          localStorage.setItem('sessionExpiresAt', '${expiresAt}');
          localStorage.setItem('lastActivityAt', '${Date.now()}');
          ${
            tenantSubdomain
              ? `localStorage.setItem('tenant_subdomain', ${JSON.stringify(tenantSubdomain)});`
              : ''
          }
        }
      } catch (e) {}
      true;
    })();
  `;
}
