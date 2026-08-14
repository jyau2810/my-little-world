import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("未找到", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("服务端渲染完整的中文个人网站", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /lang="zh-CN"/);
  assert.match(html, /我的小小世界/);
  assert.match(html, /我在这里/);
  assert.match(html, /收藏成为自己的痕迹/);
  assert.match(html, /未曾谋面的，也终将会相遇。/);
  assert.match(html, /点一片叶，走进一段故事/);
  assert.match(html, /第1片叶子：世界之初，天气多云/);
  assert.match(html, /aria-label="故事导航"/);
  assert.match(html, /把雨声变成我的声音/);
  assert.match(html, /继续成为/);
  assert.match(html, /写一封信/);
  assert.doesNotMatch(html, /沿着林间光束进入我的文字/);
  assert.doesNotMatch(html, /点击草尖上真实的露水进入做过的事/);
  assert.doesNotMatch(html, /mailto:/);
  assert.doesNotMatch(html, /Lorem ipsum|Your site is taking shape|codex-preview/i);
});

test("内容、天气和联系信息集中维护", async () => {
  const [content, page, portal, rain, styles, layout, packageJson] = await Promise.all([
    readFile(new URL("../app/content.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/WorldPortal.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/RainLayer.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(content, /export const siteConfig/);
  assert.match(content, /export const stories/);
  assert.match(content, /title: "世界之初"/);
  assert.match(content, /这个世界建造于，一个云层很低的阴天。/);
  assert.match(content, /这些声音落进很小的身体里，慢慢长成一种秩序。/);
  assert.match(content, /她也想被炫耀，她也想，成为世界的中心。/);
  assert.match(content, /title: "在世界穿行"/);
  assert.match(content, /有越来越多的光划过她的手心。/);
  assert.match(content, /我想，我开始拥有世界了。/);
  assert.match(content, /world-sunny-dance-v1\.jpg/);
  assert.match(content, /world-sunny-dance-mobile-v1\.jpg/);
  assert.match(content, /title: "把雨声变成我的声音"/);
  assert.match(content, /time: "有时候"/);
  assert.match(content, /但我不再因为一片乌云，害怕整个天空。/);
  assert.match(content, /export const articles/);
  assert.match(content, /WeatherType = "sunny" \| "cloudy" \| "rainy" \| "dusk"/);
  assert.match(content, /export const thoughts/);
  assert.match(content, /export const projects/);
  assert.match(page, /WorldPortal/);
  assert.match(portal, /\/api\/letters/);
  assert.match(portal, /letter-dialog/);
  assert.match(portal, /story-quote/);
  assert.match(portal, /world-home-v3\.jpg/);
  assert.match(portal, /world-home-mobile-v1\.jpg/);
  assert.match(portal, /world-rain-v1\.jpg/);
  assert.match(portal, /world-cloud-v1\.jpg/);
  assert.match(portal, /world-dew-v1\.jpg/);
  assert.match(portal, /从树叶进入四段故事/);
  assert.match(portal, /读这片叶子里的故事/);
  assert.match(portal, /RainLayer active=\{weather === "rainy"\}/);
  assert.match(rain, /requestAnimationFrame/);
  assert.match(rain, /prefers-reduced-motion/);
  assert.match(rain, /className="rain-canvas"/);
  assert.match(portal, /prefers-reduced-motion/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(styles, /color: var\(--cream\)/);
  assert.match(layout, /locale: "zh_CN"/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  assert.doesNotMatch(page, /_sites-preview|codex-preview/);
});
