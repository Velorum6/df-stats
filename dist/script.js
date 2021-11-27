(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const Utils_1 = require("./utils/Utils");
const GraphQueries_1 = require("./utils/GraphQueries");
const createPlanetLevelsGraph = (playerPlanets) => {
    const planetTypesByLevel = {};
    const planetTypes = ['PLANET', 'SILVER_MINE', 'RUINS', 'TRADING_POST', 'SILVER_BANK'];
    for (const planetType of planetTypes) {
        const planetsWithType = playerPlanets.filter((p) => p.planetType === planetType);
        const byLevel = {};
        for (let i = 0; i <= 9; i++) {
            byLevel[i] = planetsWithType.filter((p) => p.planetLevel === i).length;
        }
        planetTypesByLevel[planetType] = Object.values(byLevel);
    }
    const canvas = document.querySelector('#planets-by-level canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx)
        throw new Error('Failed to get ctx');
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
const createArtifactsGraph = (artifacts) => {
    const canvas = document.querySelector('#artifacts-by-rarity canvas');
    const artifactRarities = ['COMMON', 'RARE', 'EPIC', 'LEGENDARY', 'MYTHIC'];
    const bgColors = {
        MONOLITH: '#d611ea',
        COLOSSUS: '#ee6194',
        SPACESHIP: '#ff5200',
        PYRAMID: '#ff8145',
        WORMHOLE: '#28939b',
        PLANETARYSHIELD: '#9c81ee',
        PHOTOIDCANNON: '#ff7dff',
        BLOOMFILTER: '#4baf37',
        BLACKDOMAIN: '#473f38',
    };
    const artifactTypes = Object.keys(bgColors);
    const ctx = canvas.getContext('2d');
    if (!ctx)
        throw new Error('Failed to get ctx');
    return new Chart.Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Common', 'Rare', 'Epic', 'Legendary', 'Mythic'],
            datasets: artifactTypes.map((artifactType) => ({
                label: artifactType,
                data: artifactRarities.map((r) => artifacts.filter((a) => a.artifactType === artifactType && a.rarity === r)
                    .length),
                backgroundColor: bgColors[artifactType],
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
const calculateEnergyCap = (playerPlanets) => {
    const totalEnergyCapContainer = document.getElementById('total-energy-cap');
    if (!totalEnergyCapContainer)
        return;
    const totalEnergyCap = playerPlanets.reduce((a, b) => a + b.milliEnergyCap / 1000, 0);
    (0, Utils_1.animateNumber)(totalEnergyCapContainer, totalEnergyCap, (i) => (0, Utils_1.formatNumber)(Math.round(i)));
};
const calculateAllArtifacts = (address) => __awaiter(void 0, void 0, void 0, function* () {
    const artifactsAmountContainer = document.getElementById('total-artifacts-amount');
    if (!artifactsAmountContainer)
        return;
    const playerArtifacts = yield (0, GraphQueries_1.getPlayerArtifacts)(address);
    (0, Utils_1.animateNumber)(artifactsAmountContainer, playerArtifacts.length, Math.round);
});
const calculateAmountOfMoves = (address) => __awaiter(void 0, void 0, void 0, function* () {
    const movesAmountContainer = document.getElementById('total-moves-made');
    if (!movesAmountContainer)
        return;
    const playerMoves = yield (0, GraphQueries_1.getPlayerMoves)(address);
    (0, Utils_1.animateNumber)(movesAmountContainer, playerMoves.length, Math.round);
});
const calculateRank = (address) => __awaiter(void 0, void 0, void 0, function* () {
    const rankContainer = document.getElementById('rank');
    if (!rankContainer)
        return;
    const leaderBoard = yield (0, GraphQueries_1.getLeaderBoard)({ major: 6, minor: 4 });
    const { rank } = (0, Utils_1.getRank)(address, leaderBoard);
    rankContainer.innerText = rank !== -1 ? rank.toString() : 'none';
});
//  Main Script
// Property 'family' does not exist on type
// '(ctx: ScriptableContext<keyof ChartTypeRegistry>, options: AnyObject) => Partial<FontSpec> | undefined'
// ts(2339)
// @ts-ignore ???
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
    const el = items[0].element;
    let xPos = 0;
    let yPos = 0;
    if (el && el.hasValue()) {
        const props = el.getProps(['x', 'y', 'horizontal', 'base']);
        const { base, horizontal, x, y } = props;
        if (horizontal) {
            xPos = (base + x) / 2;
            yPos = y;
        }
        else {
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
const player = ((_a = urlParams.get('player')) === null || _a === void 0 ? void 0 : _a.toLowerCase()) || '0x8459c6bebe2d53b4dcaa71499a1ae4274c0e4df9';
const mainInput = document.getElementById('player-input');
mainInput.addEventListener('input', () => {
    const { customError: isValidAddress } = mainInput.validity;
    if (!isValidAddress) {
        mainInput.title = 'Invalid address!!!!!!!!';
    }
});
mainInput.value = player;
(() => __awaiter(void 0, void 0, void 0, function* () {
    const playerPlanets = yield (0, GraphQueries_1.getPlayerPlanets)(mainInput.value);
    const playerArtifacts = yield (0, GraphQueries_1.getPlayerArtifacts)(player);
    calculateAllArtifacts(mainInput.value);
    calculateEnergyCap(playerPlanets);
    calculateAmountOfMoves(mainInput.value);
    calculateRank(mainInput.value);
    createPlanetLevelsGraph(playerPlanets);
    createArtifactsGraph(playerArtifacts);
}))();

},{"./utils/GraphQueries":2,"./utils/Utils":4}],2:[function(require,module,exports){
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLeaderBoard = exports.getPlayerMoves = exports.getPlayerArtifacts = exports.getPlayerPlanets = void 0;
const GraphUtils_1 = require("./GraphUtils");
const Utils_1 = require("./Utils");
const getPlayerPlanets = (playerAddress) => __awaiter(void 0, void 0, void 0, function* () {
    return (0, GraphUtils_1.graphEntitiesSkip)((i) => `{
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
      }`, (response) => response.data.planets);
});
exports.getPlayerPlanets = getPlayerPlanets;
const getPlayerArtifacts = (playerAddress) => __awaiter(void 0, void 0, void 0, function* () {
    return (0, GraphUtils_1.graphEntitiesSkip)((i) => `{
          artifacts(where: {discoverer: "${playerAddress}"}, first: 1000, skip: ${i * 1000}) {
            artifactType
            rarity
          }
        }`, (response) => response.data.artifacts);
});
exports.getPlayerArtifacts = getPlayerArtifacts;
const getPlayerMoves = (playerAddress) => __awaiter(void 0, void 0, void 0, function* () {
    return (0, GraphUtils_1.graphEntitiesId)((i) => `{
      arrivals(where: {player: "${playerAddress}",  arrivalId_gt: ${i}}, first: 1000, orderBy: arrivalId) {
        arrivalId
      } 
    }`, 
    // TODO: better way of typing this?
    (response) => {
        var _a;
        return ({
            data: response.data.arrivals,
            id: (_a = (0, Utils_1.lastItem)(response.data.arrivals)) === null || _a === void 0 ? void 0 : _a.arrivalId,
        });
    });
});
exports.getPlayerMoves = getPlayerMoves;
const getLeaderBoard = (round) => __awaiter(void 0, void 0, void 0, function* () {
    return (0, GraphUtils_1.graphEntitiesId)((i) => `{
          players(first: 1000, where: {initTimestamp_gt: ${i}}, orderBy: initTimestamp) {
              initTimestamp
              id
              score
          }
      }`, (response) => {
        var _a;
        return ({
            data: response.data.players,
            id: (_a = (0, Utils_1.lastItem)(response.data.players)) === null || _a === void 0 ? void 0 : _a.initTimestamp.toString(),
        });
    }, round);
});
exports.getLeaderBoard = getLeaderBoard;

},{"./GraphUtils":3,"./Utils":4}],3:[function(require,module,exports){
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRoundQueryUrl = exports.getRound = exports.graphEntitiesId = exports.graphEntitiesSkip = exports.getGraphQLData = exports.GRAPH_API_URL = void 0;
exports.GRAPH_API_URL = 'https://api.thegraph.com/subgraphs/name/darkforest-eth/dark-forest-v06-round-4';
const getGraphQLData = (query, round) => __awaiter(void 0, void 0, void 0, function* () {
    let graphApiUrl = exports.GRAPH_API_URL;
    if (round) {
        let roundQueryUrl = (0, exports.getRoundQueryUrl)(round);
        if (roundQueryUrl)
            graphApiUrl = roundQueryUrl;
    }
    const response = yield fetch(graphApiUrl, {
        method: 'POST',
        body: JSON.stringify({ query }),
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
        },
    });
    const json = yield response.json();
    return json;
});
exports.getGraphQLData = getGraphQLData;
// get around limit of only getting 1000 "things" at a time by sending requests over and over
// this function increases the "skip" by 1000 each iteration, so it only works for <=6000 objects
const graphEntitiesSkip = (query, getDataFromResponse) => __awaiter(void 0, void 0, void 0, function* () {
    const allEntities = [];
    for (let i = 0; i < 6; i++) {
        const graphResponse = yield (0, exports.getGraphQLData)(query(i));
        const entities = getDataFromResponse(graphResponse);
        if (entities === undefined || entities.length === 0) {
            break;
        }
        else {
            allEntities.push(...entities);
        }
    }
    return allEntities;
});
exports.graphEntitiesSkip = graphEntitiesSkip;
// this function uses id_gt, so it can theoretically get an infinite amount of objects
// (might need to limit as something like 20 so it doesn't take years)
const graphEntitiesId = (query, getDataFromResponse, round) => __awaiter(void 0, void 0, void 0, function* () {
    const allEntities = [];
    let i = 0;
    while (true) {
        const graphResponse = yield (0, exports.getGraphQLData)(query(i), round);
        const entities = getDataFromResponse(graphResponse);
        if (entities === undefined)
            break;
        const { data, id } = entities;
        if (data.length === 0 || id === undefined || id === null)
            break;
        allEntities.push(...data);
        i = parseInt(id) + 1;
    }
    return allEntities;
});
exports.graphEntitiesId = graphEntitiesId;
const getRound = () => {
    const searchParams = new URLSearchParams(window.location.search);
    const roundParam = searchParams.get('round');
    if (!roundParam)
        return 4;
    const parsedRound = parseInt(roundParam);
    if (!parsedRound || parsedRound < 0 || parsedRound > 4)
        return 4;
    return parsedRound;
};
exports.getRound = getRound;
const getRoundQueryUrl = (round) => {
    if (round.major === 6) {
        return `https://api.thegraph.com/subgraphs/name/darkforest-eth/dark-forest-v06-round-${round.minor}`;
    }
};
exports.getRoundQueryUrl = getRoundQueryUrl;

},{}],4:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lastItem = exports.getRank = exports.animateNumber = exports.getRandomActionId = exports.formatNumber = void 0;
const formatNumber = (num, smallDec = 0) => {
    if (num < 1000) {
        if (`${num}` === num.toFixed(0)) {
            return `${num.toFixed(0)}`;
        }
        else {
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
    if (log000 === 0)
        return `${Math.floor(num)}`;
    if (rem < 10)
        return `${rem.toFixed(1)}${suffixes[log000]}`;
    else if (rem < 100)
        return `${rem.toFixed(1)}${suffixes[log000]}`;
    else if (log000 < suffixes.length)
        return `${rem.toFixed(0)}${suffixes[log000]}`;
    else
        return `${rem.toFixed(0)}E${log000 * 3}`;
};
exports.formatNumber = formatNumber;
const getRandomActionId = () => {
    const hex = '0123456789abcdef';
    let ret = '';
    for (let i = 0; i < 10; i += 1) {
        ret += hex[Math.floor(hex.length * Math.random())];
    }
    return ret;
};
exports.getRandomActionId = getRandomActionId;
const animateNumber = (elem, num, formatNumber = (i) => i) => {
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
exports.animateNumber = animateNumber;
const getRank = (playerAddress, leaderBoard) => {
    const sortedLeaderBoard = leaderBoard
        .sort((a, b) => parseFloat(a.score) - parseFloat(b.score))
        .reverse();
    const playerIndex = sortedLeaderBoard.findIndex((p) => p.id === playerAddress);
    return { rank: playerIndex + 1, player: sortedLeaderBoard[playerIndex] };
};
exports.getRank = getRank;
const lastItem = (arr) => {
    return arr[arr.length - 1];
};
exports.lastItem = lastItem;

},{}]},{},[1]);
