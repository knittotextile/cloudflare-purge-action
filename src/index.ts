import * as core from "@actions/core";
import * as httpm from "@actions/http-client";
import type { OutgoingHttpHeaders } from "http";

const main = async () => {
  try {
    const CLOUDFLARE_ZONE = core.getInput("cloudflare_zone", { required: true });
    const CLOUDFLARE_TOKEN = core.getInput("cloudflare_token");
    const CLOUDFLARE_EMAIL = core.getInput("cloudflare_email");
    const CLOUDFLARE_KEY = core.getInput("cloudflare_key");
    const PURGE_TAGS = core.getInput("purge_tags")?.split?.(",")?.filter?.(Boolean) ?? [];
    const PURGE_HOSTS = core.getInput("purge_hosts")?.split?.(",")?.filter?.(Boolean) ?? [];
    const PURGE_PREFIXES = core.getInput("purge_prefixes")?.split?.(",")?.filter?.(Boolean) ?? [];

    const http: httpm.HttpClient = new httpm.HttpClient("http-client");
    const headers: OutgoingHttpHeaders = {
      [httpm.Headers.Accept]: "application/json",
      [httpm.Headers.ContentType]: "application/json",
    };

    // Check if we're using an API key or token
    if (CLOUDFLARE_KEY) {
      if (CLOUDFLARE_EMAIL) {
        headers["X-Auth-Email"] = CLOUDFLARE_EMAIL;
        headers["X-Auth-Key"] = CLOUDFLARE_KEY;
      } else {
        throw new Error("CLOUDFLARE_EMAIL is required when using a Global API Key. Quitting.");
      }
    } else if (CLOUDFLARE_TOKEN) {
      headers["Authorization"] = `Bearer ${CLOUDFLARE_TOKEN}`;
    } else {
      throw new Error("Looks like you haven't set the required authentication variables.");
    }

    if (!CLOUDFLARE_ZONE) {
      throw new Error("CLOUDFLARE_ZONE is not set. Quitting.");
    }

    const payload: Record<string, any> = {};

    if (PURGE_TAGS.length) payload.tags = PURGE_TAGS;
    if (PURGE_HOSTS.length) payload.hosts = PURGE_HOSTS;
    if (PURGE_PREFIXES.length) payload.prefixes = PURGE_PREFIXES;
    if (!payload.hosts && !payload.prefixes && !payload.tags) payload.purge_everything = true;

    await http.postJson(
      `https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE}/purge_cache`,
      payload,
      headers,
    );

    console.log("Purge request sent successfully.");
  } catch (error: any) {
    console.error(error.message);
    core.setFailed(error.message);
  }
};

main();
