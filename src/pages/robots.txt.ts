import type { APIRoute } from "astro";

const robotsTxt = `
User-agent: *
Disallow: /_astro/

Sitemap: ${new URL("sitemap-index.xml", import.meta.env.SITE).href}
`.trim();

export const GET: APIRoute = () => {
	return new Response(robotsTxt, {
		headers: {
			"Content-Type": "text/plain; charset=utf-8",
		},
	});
};

<script src="https://giscus.app/client.js"
        data-repo="SETIX-A/Fuwari"
        data-repo-id="R_kgDOPhxhVA"
        data-category="General"
        data-category-id="DIC_kwDOPhxhVM4CujcW"
        data-mapping="pathname"
        data-strict="0"
        data-reactions-enabled="1"
        data-emit-metadata="0"
        data-input-position="bottom"
        data-theme="preferred_color_scheme"
        data-lang="zh-CN"
        crossorigin="anonymous"
        async>
</script>