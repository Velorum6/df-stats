// The amount of things I had to do to get this npm module working is **too damn high**!

import Chart = require('chart.js');
import _ = require('lodash');

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
type PlayerPlanets = { data: { planets: Planet[] } };

const playerPlanetInfo = async (playerAddress: string): Promise<Planet[]> => {
  //FIXME: delete fallback later
  const response = await fetch('http://localhost:5500/src/data.json');
  return response.json();

  const allPlanets: Planet[] = [];

  for (let i = 0; ; i++) {
    const graphResponse = <PlayerPlanets>await getGraphQLData(
      GRAPH_API_URL,
      `{
        planets(where: {owner: "${playerAddress}"}, first: 1000, skip: ${i * 1000}) {
          id,
          planetLevel,
          planetType,
          milliEnergyCap
        }
      }`
    );

    const planets = graphResponse.data.planets;
    console.log({ planets });

    if (planets === undefined || planets.length === 0) {
      break;
    } else {
      allPlanets.push(...planets);
    }
  }

  console.log(allPlanets);
  return allPlanets;
};

//

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

  // ! important thing to consider: http://betweentwobrackets.com/data-graphics-and-colour-vision/
  return new Chart.Chart(ctx, {
    type: 'bar',
    data: {
      labels: _.range(10).map((i) => `Level ${i}`),
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

// const createPlanetTypesGraph = (playerPlanets: Planet[]) => {
//   const planetsByType: { [key: string]: number } = {};
//   const planetTypes = ['PLANET', 'SILVER_MINE', 'RUINS', 'TRADING_POST', 'SILVER_BANK'];
//   for (const planetType of planetTypes) {
//     planetsByType[planetType] = playerPlanets.filter((p) => p.planetType === planetType).length;
//   }

//   const canvas = <HTMLCanvasElement>document.querySelector('#planet-types canvas');
//   const ctx = canvas.getContext('2d');

//   if (!ctx) throw new Error('Failed to get ctx');

//   return new Chart.Chart(ctx, {
//     type: 'pie',
//     data: {
//       labels: ['Planet', 'Asteroid Field', 'Foundry', 'Spacetime Rip', 'Quasar'],
//       datasets: [
//         {
//           data: Object.values(planetsByType),
//           backgroundColor: [
//             '#ff5100',
//             'rgb(255, 221, 48)',
//             'rgb(193, 60, 255)',
//             'rgb(20, 70, 200)',
//             '#f30304',
//           ],

//           borderWidth: 2,
//         },
//       ],
//     },
//   });
// };

const populateBasicData = (playerPlanets: Planet[]) => {
  const totalEnergyCapContainer = <HTMLDivElement>document.getElementById('total-energy-cap');

  const totalEnergyCap = playerPlanets.reduce((a, b) => a + b.milliEnergyCap / 1000, 0);

  totalEnergyCapContainer.innerText = totalEnergyCap.toLocaleString();
};

//  Main Script

Chart.Chart.defaults.font.family = "'IBM Plex Mono', monospace";
Chart.Chart.defaults.aspectRatio = 3;
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

const mainInput = <HTMLInputElement>document.getElementById('player-input');

let charts: Chart.Chart[] = [];

const onchange = async () => {
  const playerPlanets = await playerPlanetInfo(mainInput.value);

  charts.forEach((c) => c.destroy());

  populateBasicData(playerPlanets);
  charts.push(createPlanetLevelsGraph(playerPlanets));
};

mainInput.onchange = onchange;

onchange();
