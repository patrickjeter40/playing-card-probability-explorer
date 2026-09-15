export interface Card { id: string; rank: string; suit: string; value: number }
export const deck: Card[] = ['clubs', 'diamonds', 'hearts', 'spades'].flatMap(suit =>
  ['A','2','3','4','5','6','7','8','9','10','J','Q','K'].map((rank, i) => ({ id: `${suit}-${rank}`, rank, suit, value: Math.min(i + 1, 10) })));
export const multiplicities = [4,4,4,4,4,4,4,4,4,16];
export const playSizes = [2,3,4,5] as const;
