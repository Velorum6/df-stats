// The amount of things I had to do to get this npm module working is **too damn high**!

import Chart = require('chart.js');

import { animateNumber, formatNumber, getLeaderBoard, getRank } from './utils/Utils';
import { getPlayerArtifacts, getPlayerMoves, getPlayerPlanets } from './utils/GraphQueries';

type PlanetType = 'PLANET' | 'SILVER_MINE' | 'RUINS' | 'TRADING_POST' | 'SILVER_BANK';
type Planet = { id: string; planetLevel: number; planetType: PlanetType; milliEnergyCap: number };

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
      scales: { x: { stacked: true }, y: { stacked: true } },
      plugins: {
        tooltip: {
          // @ts-ignore
          position: 'middle',
        },
      },
    },
  });
};

// populating the data in the grid

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

const calculateRank = async (address: string) => {
  const rankContainer = document.getElementById('rank');
  if (!rankContainer) return;

  const leaderBoard = getLeaderBoard();
  const { rank } = getRank(address, await leaderBoard);

  rankContainer.innerText = rank !== -1 ? rank.toString() : 'none';
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
const player =
  urlParams.get('player')?.toLowerCase() || '0x0797846bdb85e3303ad745e9d4e7d563a8ca1702';

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
  const playerPlanets = await getPlayerPlanets(mainInput.value);

  charts.forEach((c) => c.destroy());

  calculateAllArtifacts(mainInput.value);
  calculateEnergyCap(playerPlanets);
  calculateAmountOfMoves(mainInput.value);
  calculateRank(mainInput.value);
  charts.push(createPlanetLevelsGraph(playerPlanets));
})();
