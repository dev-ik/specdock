import type { OpenApiDiffReport } from "@specdock/core";
import { createOpenApiDiffReport } from "@specdock/core";
import { buildProjectFromSpecText } from "../workspace.js";

export type ContractDiffInput = {
  previousText: string;
  currentText: string;
};

export const createContractDiffReport = ({
  previousText,
  currentText
}: ContractDiffInput): OpenApiDiffReport => {
  const previousProject = buildProjectFromSpecText(previousText, { type: "raw" });
  const currentProject = buildProjectFromSpecText(currentText, { type: "raw" });

  return createOpenApiDiffReport(previousProject, currentProject);
};

export const projectSpecText = (spec: unknown): string =>
  JSON.stringify(spec, null, 2);
