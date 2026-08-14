import type { Metadata } from "next";
import "./globals.css";

const siteUrl = new URL(
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
);
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const assetPath = (path: string) => `${basePath}${path}`;

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: "我的小小世界｜收藏成为自己的痕迹",
  description: "一座缓慢生长的中文个人网站，收藏故事、文字、思考和做过的事。",
  keywords: ["个人网站", "中文写作", "生活记录", "个人思考"],
  authors: [{ name: "我的小小世界" }],
  openGraph: {
    type: "website",
    locale: "zh_CN",
    url: siteUrl,
    siteName: "我的小小世界",
    title: "我在这里，收藏成为自己的痕迹。",
    description: "欢迎你叩开这扇门，进入这个世界。",
    images: [{ url: "/og.png", width: 1536, height: 1024, alt: "我的小小世界，暮色森林中的个人网站" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "我在这里，收藏成为自己的痕迹。",
    description: "欢迎你叩开这扇门，进入这个世界。",
    images: ["/og.png"],
  },
  icons: {
    icon: assetPath("/favicon.svg"),
    shortcut: assetPath("/favicon.svg"),
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <head>
        <link rel="preload" as="image" href={assetPath("/world-home-v3.jpg")} media="(min-width: 761px)" fetchPriority="high" />
        <link rel="preload" as="image" href={assetPath("/world-home-mobile-v1.jpg")} media="(max-width: 760px)" fetchPriority="high" />
      </head>
      <body>{children}</body>
    </html>
  );
}
