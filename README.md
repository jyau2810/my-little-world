# 我的小小世界

一个以暮色树林为入口的中文个人网站。首页不是目录，而是一幅可以探索的自然场景：点亮树叶上的光点，进入不同天气里的四段故事。

## 本地运行

需要 Node.js 22.13 或更新版本。

```bash
pnpm install
pnpm dev
```

打开终端显示的本地地址即可预览。提交或发布前运行：

```bash
pnpm lint
pnpm build
```

## 日常更新内容

所有需要经常修改的文字都集中在 `app/content.ts`：

- `siteConfig`：网站名称、首屏文案与背景音乐
- `stories`：人生章节与每段故事的天气
- `articles`：文章正文与阅读时的天气
- `thoughts`：短句与阶段思考
- `projects`：项目、实验与长期计划

新增一项时复制同类数据结构并替换中文内容即可。

## 场景结构

- `app/page.tsx`：网站入口与数据注入
- `app/WorldPortal.tsx`：树叶、光束、露水入口，换场逻辑与场景内阅读面板
- `app/RainLayer.tsx`：铺满雨天场景的轻量画布雨效
- `app/globals.css`：色彩、排版、真实场景布局、响应式与克制动效
- `app/PaperPlaneCursor.tsx`：桌面端线条纸飞机光标
- `public/og.png`：链接分享封面
- `public/world-home-v3.jpg`：清晰的桌面首页场景
- `public/world-home-mobile-v1.jpg`：为手机竖屏单独生成的首页场景
- `public/world-rain-v1.jpg`、`world-cloud-v1.jpg`、`world-dew-v1.jpg`：雨天、多云与雨后露水场景

故事与文章可在 `weather` 中选择晴、多云、小雨或晚晴。进入故事时会先只看风景，再由访客主动展开正文；小雨会启用全屏雨效。所有露水都来自真实场景图，不再使用 CSS 绘制的玻璃球。触屏设备不会启用纸飞机光标；系统开启“减少动态效果”后，雨效、轨迹和换场动画会自动关闭。

首页入口位置集中在 `app/globals.css` 的 `.leaf-entrance-*`、`.light-entrance` 和 `.dew-entrance`。以后替换场景图时，只需要在这里微调百分比坐标。

## GitHub Pages 发布

推送到 `main` 分支后，`.github/workflows/deploy-pages.yml` 会自动构建并发布。工作流同时兼容个人主页仓库和普通项目仓库，并自动修正图片、音乐与脚本的路径。
