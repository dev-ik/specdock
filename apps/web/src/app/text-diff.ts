export type TextDiffLineKind = "added" | "removed" | "unchanged";

export type TextDiffLine = {
  kind: TextDiffLineKind;
  value: string;
};

export const diffTextLines = (previous = "", current = ""): TextDiffLine[] => {
  const previousLines = previous.split("\n");
  const currentLines = current.split("\n");
  const table = buildLcsTable(previousLines, currentLines);
  const lines: TextDiffLine[] = [];
  let previousIndex = 0;
  let currentIndex = 0;

  while (previousIndex < previousLines.length && currentIndex < currentLines.length) {
    if (previousLines[previousIndex] === currentLines[currentIndex]) {
      lines.push({ kind: "unchanged", value: previousLines[previousIndex] ?? "" });
      previousIndex += 1;
      currentIndex += 1;
      continue;
    }

    const removeScore = table[previousIndex + 1]?.[currentIndex] ?? 0;
    const addScore = table[previousIndex]?.[currentIndex + 1] ?? 0;

    if (removeScore >= addScore) {
      lines.push({ kind: "removed", value: previousLines[previousIndex] ?? "" });
      previousIndex += 1;
      continue;
    }

    lines.push({ kind: "added", value: currentLines[currentIndex] ?? "" });
    currentIndex += 1;
  }

  while (previousIndex < previousLines.length) {
    lines.push({ kind: "removed", value: previousLines[previousIndex] ?? "" });
    previousIndex += 1;
  }

  while (currentIndex < currentLines.length) {
    lines.push({ kind: "added", value: currentLines[currentIndex] ?? "" });
    currentIndex += 1;
  }

  return lines;
};

const buildLcsTable = (previousLines: string[], currentLines: string[]): number[][] => {
  const table = Array.from({ length: previousLines.length + 1 }, () =>
    Array.from({ length: currentLines.length + 1 }, () => 0)
  );

  for (let previousIndex = previousLines.length - 1; previousIndex >= 0; previousIndex -= 1) {
    for (let currentIndex = currentLines.length - 1; currentIndex >= 0; currentIndex -= 1) {
      table[previousIndex]![currentIndex] =
        previousLines[previousIndex] === currentLines[currentIndex]
          ? table[previousIndex + 1]![currentIndex + 1]! + 1
          : Math.max(table[previousIndex + 1]![currentIndex]!, table[previousIndex]![currentIndex + 1]!);
    }
  }

  return table;
};
