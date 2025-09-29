export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const toNumberOrDefault = (
  value: any,
  defaultValue: number | null = null
) =>
  typeof value === "number" && Number.isFinite(value) ? value : defaultValue;
