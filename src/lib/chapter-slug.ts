export type ChapterRef = { volume: number; order: number };

export function slugOf(volume: number, order: number): string {
  if (volume === 1) {
    return order === 0 ? 'prologue' : String(order);
  }
  return order === 0 ? 'vol2-prologue' : `vol2-${order}`;
}

export function sortChapters<T extends { data: ChapterRef }>(entries: T[]): T[] {
  return [...entries].sort((a, b) => {
    if (a.data.volume !== b.data.volume) return a.data.volume - b.data.volume;
    return a.data.order - b.data.order;
  });
}

export function volumeLabel(volume: number): string {
  return volume === 1 ? 'Echo · Vol. 1' : 'Echo · Vol. 2';
}

const VOL1_ORDINALS: string[] = [
  'Prologue', 'Chapter One', 'Chapter Two', 'Chapter Three', 'Chapter Four',
  'Chapter Five', 'Chapter Six', 'Chapter Seven', 'Chapter Eight', 'Chapter Nine',
  'Chapter Ten', 'Chapter Eleven', 'Chapter Twelve', 'Chapter Thirteen',
  'Chapter Fourteen', 'Chapter Fifteen', 'Chapter Sixteen', 'Chapter Seventeen',
  'Chapter Eighteen', 'Chapter Nineteen', 'Chapter Twenty', 'Chapter Twenty-One',
  'Chapter Twenty-Two', 'Chapter Twenty-Three', 'Chapter Twenty-Four',
  'Chapter Twenty-Five', 'Chapter Twenty-Six', 'Chapter Twenty-Seven',
  'Chapter Twenty-Eight', 'Chapter Twenty-Nine', 'Chapter Thirty',
  'Chapter Thirty-One', 'Chapter Thirty-Two', 'Chapter Thirty-Three',
  'Chapter Thirty-Four', 'Coda · Five Years Later',
];

export function ordinalOf(volume: number, order: number): string {
  if (volume === 1) {
    return VOL1_ORDINALS[order] ?? `Chapter ${order}`;
  }
  if (order === 0) return 'Vol. 2 · Prologue';
  return `Vol. 2 · Chapter ${order}`;
}

export function ruleLabelOf(order: number): string {
  if (order === 0) return 'Prologue';
  return `Ch. ${String(order).padStart(2, '0')}`;
}
