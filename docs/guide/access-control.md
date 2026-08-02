# Access Control

The admin UI (`/_/admin/*`) ships **without built-in authentication**. Protecting it is your responsibility. The app makes no assumptions about which method you use, but we recommend [Cloudflare Access](https://developers.cloudflare.com/cloudflare-one/applications/) for most deployments. Other options include IP allowlists, firewall rules, Cloudflare Tunnel, or running on a private network.

::: danger Do not skip this step
An unprotected admin UI means anyone who knows the address can manage your links. Configure access control immediately after deploying.
:::

## Recommended: Cloudflare Access

Cloudflare Access handles login, sessions, and SSO at the edge before requests reach your Worker. It supports Google, GitHub, Microsoft, Okta, SAML, OIDC, and a built-in one-time PIN.

1. Open **Zero Trust** in the [Cloudflare dashboard](https://one.dash.cloudflare.com/).
2. Go to **Access > Applications > Add an application**.
3. Choose **Self-hosted**.
4. Set the application domain to your short domain (e.g. `oddb.it`) with path `_/admin/*`.
5. Add a policy, for example:
   - **Action:** Allow
   - **Include rule:** Emails ending in `@yourcompany.com`
6. Under **Authentication**, enable at least one login method. "One-time PIN" works out of the box with no external IdP.

Visit `https://yourdomain.com` and Cloudflare Access will prompt you to log in before reaching the admin dashboard. See [Cloudflare's IdP guides](https://developers.cloudflare.com/cloudflare-one/identity/idp-integration/) for setup.

## Enable JWT verification in the Worker

By default the Worker trusts whatever Cloudflare Access lets through (network-layer protection). For defense-in-depth, enable cryptographic JWT verification so the Worker validates every request independently:

1. In Zero Trust, go to your application's **Overview** tab and copy the **Application Audience (AUD) Tag**.
2. Set it as a Worker secret:

```bash
bunx wrangler secret put ACCESS_AUD
bunx wrangler secret put ACCESS_JWKS_URL
```

`ACCESS_JWKS_URL` follows the pattern:

```
https://<your-team-name>.cloudflareaccess.com/cdn-cgi/access/certs
```

When `ACCESS_AUD` is set, the Worker validates the JWT signature and audience claim on every admin and MCP request. When absent (local dev), it skips verification and falls back to dev mode.

## Related Worker secrets

| Secret            | Purpose                                                                       |
| ----------------- | ----------------------------------------------------------------------------- |
| `ACCESS_AUD`      | AUD tag of the admin application, enabling JWT verification on admin requests |
| `ACCESS_JWKS_URL` | JWKS certificate URL for Cloudflare Access                                    |
| `MCP_ACCESS_AUD`  | AUD tag of the MCP Access application, see [MCP Server](/integrations/mcp)    |

The relevant implementation lives in `src/access.ts` and `src/auth.ts`.
