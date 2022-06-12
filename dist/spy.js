(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
// https://graph-optimism.gnosischain.com/subgraphs/name/dfdao/arena-v1/graphql
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const createTable = (header, columns) => {
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
    for (const row of zip(...columns)) {
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
const zip = (...arr) => Array(Math.max(...arr.map((a) => a.length)))
    .fill('')
    .map((_, i) => arr.map((a) => a[i]));
const getGraphQLData = (query, graphApiUrl) => __awaiter(void 0, void 0, void 0, function* () {
    const response = yield fetch(graphApiUrl, {
        method: 'POST',
        body: JSON.stringify({ query, operationName: null, variables: null }),
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
        },
    });
    const json = yield response.json();
    return json;
});
const getIncompleteLobbies = () => __awaiter(void 0, void 0, void 0, function* () {
    const query = `
    query {
        arenas(first: 1000, where: {configHash: "0x38329f176da42d2c89b7e424175e8b0ab3c9008cb0d98f947857884d76c6d9d2", gameOver: false, firstMover_not: null}) {
        firstMover {
          id
        },
        id
        creationTime
      }
    }`;
    const response = yield getGraphQLData(query, 'https://graph-optimism.gnosischain.com/subgraphs/name/dfdao/arena-v1');
    if ('errors' in response) {
        throw new Error(`error when fetching data, ${JSON.stringify(response)}`);
    }
    const { arenas } = response.data;
    if (arenas === null) {
        throw new Error(`error when fetching data, ${JSON.stringify(response)}`);
    }
    return arenas;
});
const lobbiesTable = (lobbies) => {
    const sortedLobbies = lobbies.sort((a, b) => a.creationTime - b.creationTime).reverse();
    const table = createTable(['player', 'lobby', 'creationTime'], [
        sortedLobbies.map((l) => l.firstMover.id.split('-')[1]),
        sortedLobbies.map((l) => {
            const link = document.createElement('a');
            link.innerText = l.id;
            link.href = `https://arena.dfdao.xyz/play/${l.id}`;
            return link;
        }),
        sortedLobbies.map((l) => {
            const creationDate = new Date(l.creationTime * 1000);
            const spanContainer = document.createElement('span');
            const update = () => {
                const sDifference = (new Date().getTime() - creationDate.getTime()) / 1000;
                let formatted = '';
                if (sDifference <= 3600) {
                    const minutes = Math.floor(sDifference / 60);
                    const seconds = Math.floor(sDifference % 60);
                    formatted = `${minutes}:${seconds.toString().padStart(2, '0')}`;
                }
                else {
                    const hours = Math.floor(sDifference / 3600);
                    const minutes = Math.floor((sDifference % 3600) / 60);
                    const seconds = Math.floor(sDifference % 60);
                    formatted = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds
                        .toString()
                        .padStart(2, '0')}`;
                }
                spanContainer.innerText = formatted;
            };
            window.setInterval(update, 1000);
            update();
            return spanContainer;
        }),
    ]);
    return table;
};
const main = () => __awaiter(void 0, void 0, void 0, function* () {
    const lobbies = yield getIncompleteLobbies();
    const lobbyContainer = document.getElementById('lobby-container');
    if (lobbyContainer === null) {
        throw new Error("Couldn't find lobbyContainer");
    }
    lobbyContainer.innerText = '';
    lobbyContainer.append(lobbiesTable(lobbies));
});
main();

},{}]},{},[1]);
