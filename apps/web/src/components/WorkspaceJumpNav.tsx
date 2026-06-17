import { FileCode2, ListTree, Send, Upload, Wand2 } from "lucide-react";

const items = [
  { href: "#import", label: "Import", icon: Upload },
  { href: "#endpoints", label: "Endpoints", icon: ListTree },
  { href: "#generate", label: "Generate", icon: Wand2 },
  { href: "#request", label: "Request", icon: Send },
  { href: "#generated-files", label: "Files", icon: FileCode2 }
] as const;

export const WorkspaceJumpNav = () => (
  <nav className="jump-nav" aria-label="Workspace sections">
    <div className="jump-nav-inner">
      {items.map(({ href, label, icon: Icon }) => (
        <a key={href} className="jump-link" href={href}>
          <Icon size={15} aria-hidden="true" />
          <span>{label}</span>
        </a>
      ))}
    </div>
  </nav>
);
