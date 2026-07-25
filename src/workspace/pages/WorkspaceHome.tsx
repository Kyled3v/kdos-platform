import type { ReactElement } from "react";
import { Cpu, Boxes, RefreshCw, HardDrive } from "lucide-react";
import { SectionTitle } from "@/workspace/components/SectionTitle";
import { WorkspaceCard } from "@/workspace/components/WorkspaceCard";

interface WorkspaceHomeCard {
  readonly id: string;
  readonly icon: typeof Cpu;
  readonly title: string;
  readonly description: string;
}

const WORKSPACE_CARDS: readonly WorkspaceHomeCard[] = [
  {
    id: "system",
    icon: Cpu,
    title: "System",
    description: "Core runtime status and machine information.",
  },
  {
    id: "modules",
    icon: Boxes,
    title: "Modules",
    description: "Installed capabilities available to your workspace.",
  },
  {
    id: "updates",
    icon: RefreshCw,
    title: "Updates",
    description: "Track and apply new application versions.",
  },
  {
    id: "storage",
    icon: HardDrive,
    title: "Storage",
    description: "Local data kept on this device.",
  },
];

export function WorkspaceHome(): ReactElement {
  return (
    <div className="flex flex-col gap-8">
      <SectionTitle title="Workspace" subtitle="Manage your operating system from one place." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {WORKSPACE_CARDS.map((card) => (
          <WorkspaceCard
            key={card.id}
            title={card.title}
            description={card.description}
            icon={card.icon}
          />
        ))}
      </div>
    </div>
  );
}

