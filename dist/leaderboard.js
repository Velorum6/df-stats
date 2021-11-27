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
Object.defineProperty(exports, "__esModule", { value: true });
const GraphQueries_1 = require("./utils/GraphQueries");
const createTable = (header, data) => {
    const table = document.createElement('table');
    const tableHeader = document.createElement('thead');
    const titleRow = document.createElement('tr');
    table.appendChild(tableHeader);
    tableHeader.appendChild(titleRow);
    for (const title of header) {
        const tableCell = document.createElement('th');
        tableCell.innerText = title;
        titleRow.appendChild(tableCell);
    }
    const tableBody = document.createElement('tbody');
    for (const row of data) {
        const tableRow = document.createElement('tr');
        tableBody.appendChild(tableRow);
        row.forEach((i) => {
            const tableCell = document.createElement('th');
            tableCell.append(i);
            tableRow.appendChild(tableCell);
        });
    }
    table.appendChild(tableHeader);
    table.appendChild(tableBody);
    return table;
};
const getRoundFromUrl = ({ defaultRound }) => {
    const urlParams = new URLSearchParams(window.location.search);
    const roundParam = urlParams.get('round');
    if (roundParam) {
        // turns "6.4" into ["6", 4]
        const roundVersionParts = roundParam.split('.').slice(0, 2);
        // assumes that by default you want round 4
        // so ?round=3 turns into v4.3
        if (roundVersionParts.length === 1) {
            roundVersionParts.unshift('4');
        }
        const version = roundVersionParts.map((p) => parseInt(p));
        // if every single part of the version is a valid number...
        if (version.every((v) => !isNaN(v))) {
            const [major, minor] = version;
            // set the round to the specified version
            return { major, minor };
        }
    }
    return defaultRound;
};
const loadingAnimation = (container) => {
    function* nextFrame() {
        let chars = '╱─╲│╱─';
        for (let i = 0;; i++) {
            yield chars[i % chars.length];
        }
    }
    const animation = nextFrame();
    const animationFrame = () => {
        const frame = 'Loading ' + animation.next().value;
        container.innerText = frame;
    };
    const interval = window.setInterval(() => {
        animationFrame();
    }, 200);
    return {
        clearAnimation: () => {
            window.clearInterval(interval);
            container.innerText = '';
        },
    };
};
// https://www.sitepoint.com/cache-fetched-ajax-requests/
const cachedFetch = (url, key, options) => __awaiter(void 0, void 0, void 0, function* () {
    // Use the URL as the cache key to sessionStorage
    // if `key` is not provided, use the url as a key
    let cacheKey = key ? key : url;
    let cached = sessionStorage.getItem(cacheKey);
    if (cached !== null) {
        // it was in sessionStorage! Yay!
        let response = new Response(new Blob([cached]));
        return Promise.resolve(response);
    }
    const response = yield fetch(url, options);
    // let's only store in cache if the content-type is
    // JSON or something non-binary
    if (response.status === 200) {
        let ct = response.headers.get('Content-Type');
        if (ct && (ct.match(/application\/json/i) || ct.match(/text\//i))) {
            sessionStorage.setItem(cacheKey, yield response.clone().text());
        }
    }
    return response;
});
const getAllTwitters = () => __awaiter(void 0, void 0, void 0, function* () {
    let response = yield cachedFetch('https://api.zkga.me/twitter/all-twitters', 'twitter');
    return yield response.json();
});
const addressTwitter = (allTwitters, address) => {
    if (allTwitters.hasOwnProperty(address)) {
        const twitter = allTwitters[address];
        const twitterElement = document.createElement('a');
        twitterElement.href = `https://twitter.com/${twitter}`;
        twitterElement.innerText = '@' + allTwitters[address];
        twitterElement.target = '_blank';
        twitterElement.rel = 'noreferrer noopener';
        return twitterElement;
    }
    else {
        return address;
    }
};
const handleError = (message, error) => {
    const errorContainer = document.createElement('div');
    errorContainer.classList.add('error');
    const errMessage = document.createElement('p');
    errMessage.classList.add('error-message');
    errMessage.innerText = message;
    errorContainer.appendChild(errMessage);
    if (error) {
        const errDetails = document.createElement('p');
        errDetails.classList.add('error-details');
        errDetails.innerText = `${error.name}: ${error.message}`;
        errorContainer.appendChild(errDetails);
    }
    document.getElementsByTagName('main')[0].appendChild(errorContainer);
};
const main = () => __awaiter(void 0, void 0, void 0, function* () {
    const mainElement = document.getElementsByTagName('main')[0];
    const loadingContainer = document.createElement('div');
    loadingContainer.classList.add('loading');
    mainElement.appendChild(loadingContainer);
    const { clearAnimation } = loadingAnimation(loadingContainer);
    let round = getRoundFromUrl({ defaultRound: { major: 6, minor: 4 } });
    // cache leaderboards
    const stringifiedVersion = `${round.major}.${round.minor}`;
    let cachedLeaderboard = sessionStorage.getItem(stringifiedVersion);
    let leaderBoard = [];
    if (cachedLeaderboard) {
        // success! found a cached leaderboard
        try {
            leaderBoard = JSON.parse(cachedLeaderboard);
        }
        catch (e) {
            console.warn('ignoring cache bc of', e);
            cachedLeaderboard = null;
            sessionStorage.clear();
        }
    }
    if (!cachedLeaderboard) {
        // requesting the leaderboard for the 1st time and caching it
        leaderBoard = (yield (0, GraphQueries_1.getLeaderBoard)(round))
            .sort((a, b) => parseInt(a.score) - parseInt(b.score))
            .reverse()
            .map((p, idx) => [idx.toString() + '.', p.id, parseInt(p.score).toLocaleString()]);
        try {
            sessionStorage.setItem(stringifiedVersion, JSON.stringify(leaderBoard));
        }
        catch (e) {
            // possibly exceeded storage limits
            console.warn(`could not cache leaderboard: ${e}; version=\`${stringifiedVersion}\``);
        }
    }
    let table;
    try {
        const allTwitters = yield getAllTwitters();
        table = createTable(['place', 'player', 'score'], leaderBoard.map(([place, id, score]) => [place, addressTwitter(allTwitters, id), score]));
    }
    catch (e) {
        console.error('Error when creating table');
        // cached leaderboard is possibly corrupted, try to clear it
        handleError('Leaderboard is possibly corrupted. reload and try again!', e);
        sessionStorage.clear();
        return;
    }
    finally {
        clearAnimation();
    }
    mainElement.appendChild(table);
});
main().catch((e) => {
    // if something reaches to here, there's nothing that can be done
    handleError(`error: ${e}\n\ncheck console for more details`);
    console.error(e);
});

},{"./utils/GraphQueries":2}],2:[function(require,module,exports){
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
