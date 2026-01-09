import { renderReport as coreRenderReport } from "../../../src/cli/report";

export type ExportFormat = "markdown" | "html" | "json";

export function renderReport(
  result: unknown,
  format: ExportFormat
): { content: string; extension: string } {
  return coreRenderReport(result as any, format as any);
}
