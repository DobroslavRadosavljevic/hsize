export const format = (bytes: number): string => `${bytes} B`;

export const parse = (str: string): number => Number.parseInt(str, 10);
