import { BackgroundMusic } from "./BackgroundMusic";
import { PaperPlaneCursor } from "./PaperPlaneCursor";
import { WorldPortal } from "./WorldPortal";
import { articles, projects, siteConfig, stories, thoughts } from "./content";

export default function Home() {
  return (
    <>
      <a className="skip-link" href="#主要内容">跳到主要内容</a>
      <PaperPlaneCursor />
      <BackgroundMusic {...siteConfig.music} />
      <WorldPortal
        siteConfig={siteConfig}
        stories={stories}
        articles={articles}
        thoughts={thoughts}
        projects={projects}
      />
    </>
  );
}
