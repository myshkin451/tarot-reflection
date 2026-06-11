import { defineConfig } from "astro/config";
import vue from "@astrojs/vue";

const repository = process.env.GITHUB_REPOSITORY?.split("/")[1];

export default defineConfig({
  output: "static",
  site: process.env.GITHUB_PAGES === "true" ? `https://${process.env.GITHUB_REPOSITORY_OWNER}.github.io` : "http://localhost:4321",
  base: repository && process.env.GITHUB_PAGES === "true" ? `/${repository}` : "/",
  integrations: [vue()]
});
