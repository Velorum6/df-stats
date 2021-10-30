import { RankedPlayer } from './GraphQueries';

export const formatNumber = (num: number, smallDec = 0): string => {
  if (num < 1000) {
    if (`${num}` === num.toFixed(0)) {
      return `${num.toFixed(0)}`;
    } else {
      return `${num.toFixed(smallDec)}`;
    }
  }

  const suffixes = ['', 'K', 'M', 'B', 'T', 'q', 'Q'];
  let log000 = 0;
  let rem = num;
  while (rem / 1000 >= 1) {
    rem /= 1000;
    log000++;
  }

  if (log000 === 0) return `${Math.floor(num)}`;

  if (rem < 10) return `${rem.toFixed(1)}${suffixes[log000]}`;
  else if (rem < 100) return `${rem.toFixed(1)}${suffixes[log000]}`;
  else if (log000 < suffixes.length) return `${rem.toFixed(0)}${suffixes[log000]}`;
  else return `${rem.toFixed(0)}E${log000 * 3}`;
};

export const getRandomActionId = () => {
  const hex = '0123456789abcdef';

  let ret = '';
  for (let i = 0; i < 10; i += 1) {
    ret += hex[Math.floor(hex.length * Math.random())];
  }
  return ret;
};

export const animateNumber = (
  elem: HTMLElement,
  num: number,
  formatNumber: (num: number) => string | number = (i) => i
) => {
  let currentNum = 0;

  for (let i = 0; i < 100; i++) {
    setTimeout(() => {
      currentNum += (num - currentNum) / 3;
      elem.innerText = formatNumber(currentNum).toString();
    }, i * 25);
  }

  setTimeout(() => {
    elem.innerText = formatNumber(num).toString();
  }, 2500);
};

export const getRank = (playerAddress: string, leaderBoard: RankedPlayer[]) => {
  const sortedLeaderBoard = leaderBoard
    .sort((a, b) => parseFloat(a.score) - parseFloat(b.score))
    .reverse();

  const playerIndex = sortedLeaderBoard.findIndex((p) => p.id === playerAddress);

  return { rank: playerIndex + 1, player: sortedLeaderBoard[playerIndex] };
};

export const lastItem = <T>(arr: T[]): T | undefined => {
  return arr[arr.length - 1];
};
