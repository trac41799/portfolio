import { safeParseUIComponent, type UIComponent } from "@/lib/assistant/contracts";
import { Timeline } from "./ui/timeline";
import { Comparison } from "./ui/comparison";
import { ProjectCard } from "./ui/project-card";
import { MetricGrid } from "./ui/metric-grid";
import { SkillMatrix } from "./ui/skill-matrix";
import { PublicationList } from "./ui/publication-list";
import { ContactCard } from "./ui/contact-card";

function renderComponent(component: UIComponent): React.ReactElement {
  switch (component.component) {
    case "timeline":
      return <Timeline {...component.props} />;
    case "comparison":
      return <Comparison {...component.props} />;
    case "projectCard":
      return <ProjectCard {...component.props} />;
    case "metricGrid":
      return <MetricGrid {...component.props} />;
    case "skillMatrix":
      return <SkillMatrix {...component.props} />;
    case "publicationList":
      return <PublicationList {...component.props} />;
    case "contactCard":
      return <ContactCard {...component.props} />;
  }
}

export function GenerativeUIRenderer({ component }: { component: UIComponent }) {
  const parsed = safeParseUIComponent(component);
  if (!parsed) {
    return (
      <div className="text-muted text-sm">Unable to render this content.</div>
    );
  }
  return <div data-testid={`ui-${parsed.component}`}>{renderComponent(parsed)}</div>;
}
