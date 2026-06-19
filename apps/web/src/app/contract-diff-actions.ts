import {
  renderOpenApiDiffJson,
  renderOpenApiDiffMarkdown,
  type OpenApiDiffReport
} from "@specdock/core";
import { createContractDiffReport } from "./contract-diff.js";
import { downloadTextFile } from "./controller-helpers.js";

export type ContractDiffActionsState = {
  contractDiffReport?: OpenApiDiffReport;
  setContractDiffReport(report: OpenApiDiffReport): void;
  setStatus(value: string): void;
};

export const createContractDiffActions = (state: ContractDiffActionsState) => {
  const compareContractDiff = (previousText: string, currentText: string) => {
    try {
      const report = createContractDiffReport({ previousText, currentText });
      state.setContractDiffReport(report);
      state.setStatus(`Compared ${report.counts.total} contract changes`);
    } catch (error) {
      state.setStatus(error instanceof Error ? error.message : "Contract diff failed.");
    }
  };

  const exportContractDiff = (format: "markdown" | "json") => {
    if (!state.contractDiffReport) {
      state.setStatus("Compare two specs before exporting a diff report.");
      return;
    }

    const content =
      format === "markdown"
        ? renderOpenApiDiffMarkdown(state.contractDiffReport)
        : renderOpenApiDiffJson(state.contractDiffReport);
    const extension = format === "markdown" ? "md" : "json";
    downloadTextFile(`specdock-contract-diff.${extension}`, content);
    state.setStatus(`Exported contract diff ${format.toUpperCase()}`);
  };

  return { compareContractDiff, exportContractDiff };
};
