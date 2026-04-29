// Copyright 2026 Oddbit (https://oddbit.id)
// SPDX-License-Identifier: Apache-2.0

import pkg from "../../package.json";
import { scalarResponse } from "./scalar";
import { createApiSubApp } from "./sub-app";
import { linksApp } from "./links";
import { slugsApp } from "./slugs";
import { bundlesApp } from "./bundles";

export const apiRouter = createApiSubApp();

apiRouter.openAPIRegistry.registerComponent("securitySchemes", "bearerAuth", {
  type: "http",
  scheme: "bearer",
  bearerFormat: "sk_*",
  description: "API key issued from the admin dashboard. Pass as `Authorization: Bearer sk_...`.",
});

apiRouter.doc31("/openapi.json", {
  openapi: "3.1.0",
  info: {
    title: "shrtnr API",
    version: pkg.version,
    description:
      "Public link-management API for shrtnr, a self-hosted URL shortener on Cloudflare Workers. " +
      "Authenticate with an API key issued from the admin dashboard. " +
      "Built and maintained by Oddbit (https://oddbit.id).",
    contact: { name: "Oddbit", url: "https://oddbit.id" },
    license: { name: "Apache 2.0", url: "https://www.apache.org/licenses/LICENSE-2.0" },
  },
  servers: [{ url: "/" }],
  security: [{ bearerAuth: [] }],
});

apiRouter.get("/docs", (_c) => scalarResponse());

apiRouter.route("/links", linksApp);
apiRouter.route("/slugs", slugsApp);
apiRouter.route("/bundles", bundlesApp);
