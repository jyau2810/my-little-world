"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import type { Article, Project, Story, Thought, WeatherType } from "./content";
import { RainLayer } from "./RainLayer";

type Scene = "home" | "story" | "writing" | "thoughts" | "projects";

type WorldPortalProps = {
  siteConfig: {
    name: string;
    title: string;
    description: string;
    welcome: string;
    sideNote: string;
  };
  stories: Story[];
  articles: Article[];
  thoughts: Thought[];
  projects: Project[];
};

type TransitionOrigin = { x: number; y: number };

const sceneHash: Record<Scene, string> = {
  home: "#首页",
  story: "#故事",
  writing: "#文字",
  thoughts: "#思考",
  projects: "#做过的事",
};

const assetPath = (path: string) => `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}${path}`;

const weatherImage: Record<WeatherType, string> = {
  sunny: assetPath("/world-home-v3.jpg"),
  cloudy: assetPath("/world-cloud-v1.jpg"),
  rainy: assetPath("/world-rain-v1.jpg"),
  dusk: assetPath("/world-home-v3.jpg"),
};

function sceneFromHash(hash: string): Scene {
  const decoded = decodeURIComponent(hash);
  if (decoded.includes("故事")) return "story";
  return "home";
}

export function WorldPortal({ siteConfig, stories, articles, thoughts, projects }: WorldPortalProps) {
  const [scene, setScene] = useState<Scene>("home");
  const [storyIndex, setStoryIndex] = useState(0);
  const [articleIndex, setArticleIndex] = useState(0);
  const [panelOpen, setPanelOpen] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [transitionOrigin, setTransitionOrigin] = useState<TransitionOrigin>({ x: 50, y: 50 });
  const [menuOpen, setMenuOpen] = useState(false);
  const transitionTimers = useRef<number[]>([]);
  const sceneHeadingRef = useRef<HTMLHeadingElement>(null);

  const story = stories[storyIndex];
  const article = articles[articleIndex];

  const weather = useMemo<WeatherType>(() => {
    if (scene === "story") return story.weather.type;
    if (scene === "writing" && panelOpen) return article.weather.type;
    if (scene === "thoughts") return "cloudy";
    if (scene === "projects") return "sunny";
    return "dusk";
  }, [article.weather.type, panelOpen, scene, story.weather.type]);

  const backgroundImage = useMemo(() => {
    if (scene === "projects") return assetPath("/world-dew-v1.jpg");
    if (scene === "story" && story.sceneImage) return assetPath(story.sceneImage.desktop);
    return weatherImage[weather];
  }, [scene, story.sceneImage, weather]);

  const mobileBackgroundImage = useMemo(() => {
    if (scene === "story" && story.sceneImage?.mobile) return assetPath(story.sceneImage.mobile);
    if (backgroundImage === assetPath("/world-home-v3.jpg")) return assetPath("/world-home-mobile-v1.jpg");
    return null;
  }, [backgroundImage, scene, story.sceneImage]);

  const clearTransitionTimers = () => {
    transitionTimers.current.forEach((timer) => window.clearTimeout(timer));
    transitionTimers.current = [];
  };

  const runTransition = (
    update: () => void,
    origin: TransitionOrigin,
    nextHash?: string,
  ) => {
    if (transitioning) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    clearTransitionTimers();
    setTransitionOrigin(origin);

    const commit = () => {
      update();
      setMenuOpen(false);
      if (nextHash) window.history.pushState(null, "", nextHash);
      window.requestAnimationFrame(() => sceneHeadingRef.current?.focus({ preventScroll: true }));
    };

    if (reducedMotion) {
      commit();
      return;
    }

    setTransitioning(true);
    transitionTimers.current.push(window.setTimeout(commit, 360));
    transitionTimers.current.push(window.setTimeout(() => setTransitioning(false), 860));
  };

  const enterScene = (
    nextScene: Scene,
    origin: TransitionOrigin,
    nextStoryIndex = 0,
  ) => {
    runTransition(() => {
      setScene(nextScene);
      if (nextScene === "story") setStoryIndex(nextStoryIndex);
      setPanelOpen(nextScene === "thoughts" || nextScene === "projects");
    }, origin, sceneHash[nextScene]);
  };

  const chooseStory = (index: number) => {
    runTransition(() => {
      setStoryIndex(index);
      setPanelOpen(false);
    }, { x: 22 + index * 15, y: 20 }, `${sceneHash.story}?叶=${index + 1}`);
  };

  const chooseArticle = (index: number) => {
    runTransition(() => {
      setArticleIndex(index);
      setPanelOpen(true);
    }, { x: 69, y: 38 }, `${sceneHash.writing}?篇=${index + 1}`);
  };

  const openStoryFromNavigation = (index: number) => {
    const origin = { x: 18 + index * 16, y: 10 };
    if (scene === "story") chooseStory(index);
    else enterScene("story", origin, index);
  };

  useEffect(() => {
    const initialFrame = window.requestAnimationFrame(() => {
      const initialScene = sceneFromHash(window.location.hash);
      if (initialScene !== "home") {
        setScene(initialScene);
        setPanelOpen(initialScene === "thoughts" || initialScene === "projects");
      }
    });

    const idleWindow = window as typeof window & {
      requestIdleCallback?: (callback: () => void) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    const preload = () => {
      [
        "/world-rain-v1.jpg",
        "/world-cloud-v1.jpg",
        "/world-dew-v1.jpg",
        "/world-sunny-dance-v1.jpg",
        "/world-sunny-dance-mobile-v1.jpg",
        "/world-dusk-horizon-v2.jpg",
        "/world-dusk-horizon-mobile-v2.jpg",
      ].map(assetPath).forEach((src) => {
        const image = new Image();
        image.decoding = "async";
        image.src = src;
      });
    };
    const idleId = idleWindow.requestIdleCallback?.(preload) ?? window.setTimeout(preload, 900);

    const handlePopState = () => {
      const nextScene = sceneFromHash(window.location.hash);
      setScene(nextScene);
      setPanelOpen(nextScene === "thoughts" || nextScene === "projects");
    };
    window.addEventListener("popstate", handlePopState);
    return () => {
      window.cancelAnimationFrame(initialFrame);
      clearTransitionTimers();
      if (idleWindow.cancelIdleCallback && typeof idleId === "number") idleWindow.cancelIdleCallback(idleId);
      else window.clearTimeout(idleId);
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (panelOpen) {
        setPanelOpen(false);
        return;
      }
      if (scene !== "home") {
        setScene("home");
        window.history.pushState(null, "", sceneHash.home);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [panelOpen, scene]);

  const rootStyle = {
    "--portal-x": `${transitionOrigin.x}%`,
    "--portal-y": `${transitionOrigin.y}%`,
  } as CSSProperties;

  return (
    <div
      className={`world ${transitioning ? "is-transitioning" : ""}`}
      data-scene={scene}
      data-story={scene === "story" ? storyIndex + 1 : undefined}
      data-weather={weather}
      style={rootStyle}
    >
      <div className="world-picture" key={`${backgroundImage}-${scene}-${storyIndex}-${panelOpen ? articleIndex : "closed"}`}>
        <picture>
          {mobileBackgroundImage ? (
            <source media="(max-width: 760px)" srcSet={mobileBackgroundImage} />
          ) : null}
          <img
            src={backgroundImage}
            alt=""
            width="1672"
            height="941"
            decoding="async"
            fetchPriority={scene === "home" ? "high" : "auto"}
          />
        </picture>
      </div>
      <div className="world-tone" aria-hidden="true" />
      <div className="weather-effect" aria-hidden="true" />
      <RainLayer active={weather === "rainy"} />

      <header className="world-header">
        <button className="world-brand" type="button" onClick={() => enterScene("home", { x: 8, y: 6 })}>
          {siteConfig.name}
        </button>
        <span className="world-header-line" aria-hidden="true" />
        <nav className="world-nav story-title-nav" aria-label="故事导航">
          {stories.map((item, index) => (
            <button
              type="button"
              key={item.title}
              className={scene === "story" && storyIndex === index ? "is-current" : ""}
              aria-current={scene === "story" && storyIndex === index ? "page" : undefined}
              onClick={() => openStoryFromNavigation(index)}
            >
              {item.title}
            </button>
          ))}
        </nav>
        <button
          className="world-menu-button"
          type="button"
          aria-label={menuOpen ? "收起导航" : "展开导航"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span /><span />
        </button>
        {menuOpen ? (
          <nav className="world-mobile-nav" aria-label="移动端故事导航">
            {stories.map((item, index) => (
              <button type="button" key={item.title} onClick={() => openStoryFromNavigation(index)}>
                {item.title}
              </button>
            ))}
          </nav>
        ) : null}
      </header>

      <main id="主要内容" className="world-main">
        {scene === "home" ? (
          <section className="home-scene" id="首页" aria-labelledby="world-title">
            <div className="home-copy">
              <p className="home-welcome">{siteConfig.welcome}</p>
              <h1 id="world-title" ref={sceneHeadingRef} tabIndex={-1}>
                我在这里，<br />收藏成为<br className="mobile-title-break" />自己的痕迹。
              </h1>
              <p className="home-description">{siteConfig.description}</p>
              <p className="home-guide">点一片叶，走进一段故事。</p>
            </div>

            <div className="leaf-entrances" aria-label="从树叶进入四段故事">
              {stories.map((item, index) => (
                <button
                  className={`leaf-entrance leaf-entrance-${index + 1}`}
                  type="button"
                  key={item.title}
                  aria-label={`第${index + 1}片叶子：${item.title}，天气${item.weather.label}`}
                  onClick={() => enterScene("story", { x: 7 + index * 7, y: 12 + index * 3 }, index)}
                >
                  <span className="entrance-pulse" aria-hidden="true" />
                  <span className="entrance-label"><small>{item.weather.label}</small>{item.title}</span>
                </button>
              ))}
            </div>

            <p className="home-side-note">{siteConfig.sideNote}</p>
            <footer className="home-footer">
              <p>如果这里有一句话让你停了一会儿，那我们已经相遇。</p>
            </footer>
          </section>
        ) : null}

        {scene === "story" ? (
          <section className="inside-scene story-world" id="故事" aria-labelledby="story-scene-title">
            <div className="scene-caption">
              <p>叶片里的坐标 · {story.weather.label}</p>
              <h1 id="story-scene-title" ref={sceneHeadingRef} tabIndex={-1}>{story.title}</h1>
              <span>{story.weather.note}</span>
            </div>
            <div className="story-switcher" aria-label="切换故事">
              {stories.map((item, index) => (
                <button
                  type="button"
                  key={item.title}
                  className={storyIndex === index ? "is-current" : ""}
                  aria-label={`阅读${item.title}，天气${item.weather.label}`}
                  onClick={() => chooseStory(index)}
                >
                  <b>{String(index + 1).padStart(2, "0")}</b>
                  <span>{item.title}</span>
                  <small>{item.weather.label}</small>
                </button>
              ))}
            </div>
            {!panelOpen ? (
              <button className="reopen-panel" type="button" onClick={() => setPanelOpen(true)}>读这片叶子里的故事</button>
            ) : null}
          </section>
        ) : null}

        {scene === "writing" ? (
          <section className="inside-scene writing-world" id="文字" aria-labelledby="writing-scene-title">
            <div className="scene-caption writing-caption">
              <p>顺着暮光 · 五篇文字</p>
              <h1 id="writing-scene-title" ref={sceneHeadingRef} tabIndex={-1}>我的文字</h1>
              <span>标题落在光经过的地方。选择一篇，天气会跟着文字改变。</span>
            </div>
            <div className="writing-index" aria-label="文章目录">
              {articles.map((item, index) => (
                <button
                  type="button"
                  key={item.slug}
                  className={panelOpen && articleIndex === index ? "is-current" : ""}
                  onClick={() => chooseArticle(index)}
                >
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <strong>{item.title}</strong>
                  <small>{item.weather.label} · {item.readingTime}</small>
                </button>
              ))}
            </div>
          </section>
        ) : null}

        {scene === "thoughts" ? (
          <section className="inside-scene thoughts-world" id="思考" aria-labelledby="thoughts-scene-title">
            <div className="scene-caption">
              <p>云下停一会儿</p>
              <h1 id="thoughts-scene-title" ref={sceneHeadingRef} tabIndex={-1}>一些思考</h1>
              <span>不必带走答案，只需要在某一句前停一下。</span>
            </div>
          </section>
        ) : null}

        {scene === "projects" ? (
          <section className="inside-scene projects-world" id="做过的事" aria-labelledby="projects-scene-title">
            <div className="scene-caption">
              <p>雨后的草尖 · 仍在生长</p>
              <h1 id="projects-scene-title" ref={sceneHeadingRef} tabIndex={-1}>做过的事</h1>
              <span>露水没有被画出来，它们原本就在草叶上。这里保存的是行动留下的痕迹。</span>
            </div>
          </section>
        ) : null}
      </main>

      {scene !== "home" ? (
        <button className="back-to-forest" type="button" onClick={() => enterScene("home", { x: 50, y: 50 })}>
          <span aria-hidden="true">←</span> 回到树林
        </button>
      ) : null}

      {panelOpen && scene === "story" ? (
        <aside className="reading-panel" aria-label={`${story.title}故事正文`}>
          <button className="panel-close" type="button" onClick={() => setPanelOpen(false)}>只看风景 <span aria-hidden="true">×</span></button>
          <div className="panel-scroll">
            <p className="panel-kicker">{story.time} · {story.weather.label}</p>
            <h2>{story.title}</h2>
            <p className="weather-note">{story.weather.note}</p>
            <div className="story-body">
              {story.body.map((line, index) => {
                if (line === "") {
                  return <span aria-hidden="true" className="story-gap" key={`${story.title}-${index}`} />;
                }

                const lineClassName = line.startsWith("“")
                  ? "story-line story-quote"
                  : line.startsWith("...")
                    ? "story-line story-ellipsis"
                    : "story-line";

                return <p className={lineClassName} key={`${story.title}-${index}`}>{line}</p>;
              })}
            </div>
            <p className="panel-end">第 {String(storyIndex + 1).padStart(2, "0")} 片叶子</p>
          </div>
        </aside>
      ) : null}

      {panelOpen && scene === "writing" ? (
        <aside className="reading-panel" aria-label={`${article.title}文章正文`}>
          <button className="panel-close" type="button" onClick={() => setPanelOpen(false)}>收起文字 <span aria-hidden="true">×</span></button>
          <div className="panel-scroll">
            <p className="panel-kicker">{article.category} · {article.date}</p>
            <h2>{article.title}</h2>
            <p className="weather-note">{article.weather.label} · {article.weather.note}</p>
            <p className="article-summary">{article.summary}</p>
            <div className="article-body">
              {article.content.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            </div>
            <p className="panel-end">{article.readingTime}</p>
          </div>
        </aside>
      ) : null}

      {panelOpen && scene === "thoughts" ? (
        <aside className="reading-panel" aria-label="一些思考">
          <button className="panel-close" type="button" onClick={() => setPanelOpen(false)}>只看风景 <span aria-hidden="true">×</span></button>
          <div className="panel-scroll thought-scroll">
            <p className="panel-kicker">一些思考</p>
            <h2>林间读到的几句话</h2>
            {thoughts.map((item) => (
              <blockquote key={item.text}>
                <p>“{item.text}”</p>
                <footer>{item.note}</footer>
              </blockquote>
            ))}
          </div>
        </aside>
      ) : null}

      {panelOpen && scene === "projects" ? (
        <aside className="reading-panel project-panel" aria-label="做过的事">
          <button className="panel-close" type="button" onClick={() => setPanelOpen(false)}>只看草地 <span aria-hidden="true">×</span></button>
          <div className="panel-scroll">
            <p className="panel-kicker">项目、实验与长期计划</p>
            <h2>做过的事</h2>
            <div className="project-index">
              {projects.map((item, index) => (
                <article key={item.name}>
                  <div>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <small>{item.category} · {item.year}</small>
                  </div>
                  <h3>{item.name}</h3>
                  <p>{item.description}</p>
                  {item.link ? <a href={item.link.href}>{item.link.label}</a> : null}
                </article>
              ))}
            </div>
          </div>
        </aside>
      ) : null}

      <div className="world-transition" aria-hidden="true" />
      <p className="scene-status" aria-live="polite">
        {scene === "home" ? "你在树林入口" : `已进入${scene === "story" ? "故事" : scene === "writing" ? "文字" : scene === "thoughts" ? "思考" : "做过的事"}场景`}
      </p>
    </div>
  );
}
