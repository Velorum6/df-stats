// The amount of things I had to do to get this npm module working is **too damn high**!

import Chart = require('chart.js');

// GraphQL utils

const GRAPH_API_URL =
  'https://api.thegraph.com/subgraphs/name/darkforest-eth/dark-forest-v06-round-3';

const getGraphQLData = async (graphApiUrl: string, query: string) => {
  const response = await fetch(graphApiUrl, {
    method: 'POST',
    body: JSON.stringify({ query }),
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });

  const json = await response.json();
  return json;
};

type PlanetType = 'PLANET' | 'SILVER_MINE' | 'RUINS' | 'TRADING_POST' | 'SILVER_BANK';
type Planet = { id: string; planetLevel: number; planetType: PlanetType; milliEnergyCap: number };

// get around limit of only getting 1000 "things" at a time by sending requests over and over
const getManyGraphEntities = async (
  query: (i: number) => string,
  getDataFromResponse: (response: any) => any[] | undefined
) => {
  const allEntities = [];

  for (let i = 0; i < 6; i++) {
    const graphResponse = await getGraphQLData(GRAPH_API_URL, query(i));
    const entities = getDataFromResponse(graphResponse);

    if (entities === undefined || entities.length === 0) {
      break;
    } else {
      allEntities.push(...entities);
    }
  }
  return allEntities;
};

const playerPlanetInfo = async (playerAddress: string): Promise<Planet[]> => {
  return getManyGraphEntities(
    (i) => `{
      planets(where: {owner: "${playerAddress}"},
              first: 1000,
              skip: ${i * 1000},
              orderBy: planetLevel,
              orderDirection: desc) {
        id,
        planetLevel,
        planetType,
        milliEnergyCap
      }
    }`,
    (respone) => respone.data.planets
  );
};

type Artifact = { artifactType: string; rarity: string };

const getPlayerArtifacts = async (playerAddress: string): Promise<Artifact[]> => {
  return getManyGraphEntities(
    (i) => `{
        artifacts(where: {discoverer: "${playerAddress}"}, first: 1000, skip: ${i * 1000}) {
          artifactType
          rarity
        }
      }`,
    (respone) => respone.data.artifacts
  );
};

type Arrival = { id: string };
const getPlayerMoves = async (playerAddress: string): Promise<Arrival[]> => {
  return getManyGraphEntities(
    (i) => `{
    arrivals(where: {player: "${playerAddress}"}, first: 1000, skip: ${i * 1000}) {
      id
    }
  }`,
    (response) => response.data.arrivals
  );
};

const createPlanetLevelsGraph = (playerPlanets: Planet[]) => {
  const planetTypesByLevel: { [key: string]: number[] } = {};
  const planetTypes = ['PLANET', 'SILVER_MINE', 'RUINS', 'TRADING_POST', 'SILVER_BANK'];
  for (const planetType of planetTypes) {
    const planetsWithType = playerPlanets.filter((p) => p.planetType === planetType);
    const byLevel: { [key: number]: number } = {};

    for (let i = 0; i <= 9; i++) {
      byLevel[i] = planetsWithType.filter((p) => p.planetLevel === i).length;
    }

    planetTypesByLevel[planetType] = Object.values(byLevel);
  }

  const canvas = <HTMLCanvasElement>document.querySelector('#planets-by-level canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) throw new Error('Failed to get ctx');

  return new Chart.Chart(ctx, {
    type: 'bar',
    data: {
      labels: [...Array(10).keys()].map((i) => `Level ${i}`),
      datasets: Object.values(planetTypesByLevel).map((planets, i) => ({
        data: planets,
        backgroundColor: [
          '#ff5100',
          'rgb(255, 221, 48)',
          'rgb(193, 60, 255)',
          'rgb(20, 70, 200)',
          '#f30304',
        ][i],
        label: ['Planet', 'Asteroid Field', 'Foundry', 'Spacetime Rip', 'Quasar'][i],
      })),
    },
    options: {
      scales: {
        x: {
          stacked: true,
        },
        y: {
          stacked: true,
        },
      },
      plugins: {
        tooltip: {
          // @ts-ignore
          position: 'middle',
        },
        title: {
          text: 'Celestial Bodies by level',
        },
      },
    },
  });
};

// populating the data in the grid

const formatNumber = (num: number, smallDec = 0): string => {
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

const animateNumber = (
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

const calculateEnergyCap = (playerPlanets: Planet[]) => {
  const totalEnergyCapContainer = document.getElementById('total-energy-cap');
  if (!totalEnergyCapContainer) return;

  const totalEnergyCap = playerPlanets.reduce((a, b) => a + b.milliEnergyCap / 1000, 0);

  animateNumber(totalEnergyCapContainer, totalEnergyCap, (i) => formatNumber(Math.round(i)));
};

const calculateAllArtifacts = async (address: string) => {
  const artifactsAmountContainer = document.getElementById('total-artifacts-amount');
  if (!artifactsAmountContainer) return;

  const playerArtifacts = await getPlayerArtifacts(address);

  animateNumber(artifactsAmountContainer, playerArtifacts.length, Math.round);
};

const calculateAmountOfMoves = async (address: string) => {
  const movesAmountContainer = document.getElementById('total-moves-made');
  if (!movesAmountContainer) return;

  const playerMoves = await getPlayerMoves(address);

  animateNumber(movesAmountContainer, playerMoves.length, Math.round);
};

type LeaderBoard = { entries: { ethAddress: string; score?: number; twitter?: string }[] };
const calculateRanking = async (address: string) => {
  const rankContainer = document.getElementById('rank');
  if (!rankContainer) return;

  const response = await fetch('https://api.zkga.me/leaderboard');
  const leaderBoard = <LeaderBoard>await response.json();
  const sortedLeaderBoard = leaderBoard.entries
    .filter(
      (p): p is { ethAddress: string; twitter?: string; score: number } => p.score !== undefined
    )
    .sort((a, b) => a.score - b.score);

  const playerIndex = sortedLeaderBoard.findIndex((p) => p.ethAddress === address);

  rankContainer.innerText = playerIndex === -1 ? 'none' : '#' + (playerIndex + 1).toString();
};

//  Main Script

Chart.Chart.defaults.font.family = "'IBM Plex Mono', monospace";
Chart.Chart.defaults.aspectRatio = 3;
Chart.Chart.defaults.borderColor = 'rgb(232, 230, 227, 0.1)';
Chart.Chart.defaults.color = 'rgb(232, 230, 227)';
Chart.Chart.defaults.plugins.legend.display = false;
Chart.Tooltip.positioners.middle = (items, eventPosition) => {
  if (items.length !== 1) {
    // For more than 1 item, just show at the nearest
    return Chart.Tooltip.positioners.average(items, eventPosition);
  }

  const el = <Chart.BarElement>(<unknown>items[0].element);
  let xPos = 0;
  let yPos = 0;

  if (el && el.hasValue()) {
    const props = el.getProps(['x', 'y', 'horizontal', 'base']);
    const { base, horizontal, x, y } = props;
    if (horizontal) {
      xPos = (base + x) / 2;
      yPos = y;
    } else {
      xPos = x;
      yPos = (base + y) / 2;
    }
  }

  return {
    x: xPos,
    y: yPos,
  };
};

const urlParams = new URLSearchParams(window.location.search);
const player = urlParams.get('player') || '0xe8d3dd97cd3a33b7b8f94e3195e98d3912ac50e9';

const mainInput = <HTMLInputElement>document.getElementById('player-input');

mainInput.addEventListener('input', () => {
  const { customError: isValidAddress } = mainInput.validity;

  if (!isValidAddress) {
    mainInput.title = 'Invalid address!!!!!!!!';
  }
});

mainInput.value = player;

let charts: Chart.Chart[] = [];

(async () => {
  const playerPlanets = await playerPlanetInfo(mainInput.value);

  charts.forEach((c) => c.destroy());

  calculateAllArtifacts(mainInput.value);
  calculateEnergyCap(playerPlanets);
  calculateAmountOfMoves(mainInput.value);
  calculateRanking(mainInput.value);
  charts.push(createPlanetLevelsGraph(playerPlanets));
})();
