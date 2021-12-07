import { getLeaderBoard } from './utils/GraphQueries';
import { Round } from './utils/Utils';

const createTable = (header: string[], data: (HTMLElement | string)[][]) => {
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

const getRoundFromUrl = ({ defaultRound }: { defaultRound: Round }): Round => {
    const urlParams = new URLSearchParams(window.location.search);
    const roundParam = urlParams.get('round');

    if (roundParam) {
        // turns "6.4" into ["6", 4]
        const roundVersionParts = roundParam.split('.').slice(0, 2);

        // assumes that by default you want round 4
        // so ?round=3 turns into v4.3
        if (roundVersionParts.length === 1) {
            roundVersionParts.unshift('6');
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

const loadingAnimation = (container: HTMLElement) => {
    function* nextFrame() {
        let chars = '╱─╲│╱─';
        for (let i = 0; ; i++) {
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
const cachedFetch = async (url: string, key?: string, options?: Parameters<typeof fetch>[1]) => {
    // Use the URL as the cache key to sessionStorage

    // if `key` is not provided, use the url as a key
    let cacheKey = key ? key : url;

    let cached = sessionStorage.getItem(cacheKey);
    if (cached !== null) {
        // it was in sessionStorage! Yay!
        let response = new Response(new Blob([cached]));
        return Promise.resolve(response);
    }

    const response = await fetch(url, options);
    // let's only store in cache if the content-type is
    // JSON or something non-binary
    if (response.status === 200) {
        let ct = response.headers.get('Content-Type');
        if (ct && (ct.match(/application\/json/i) || ct.match(/text\//i))) {
            sessionStorage.setItem(cacheKey, await response.clone().text());
        }
    }
    return response;
};

const getAllTwitters = async (): Promise<{ [key: string]: string }> => {
    let response = await cachedFetch('https://api.zkga.me/twitter/all-twitters', 'twitter');

    return await response.json();
};

const addressTwitter = (allTwitters: Object & { [key: string]: string }, address: string) => {
    if (allTwitters.hasOwnProperty(address)) {
        const twitter = allTwitters[address];

        const twitterElement = document.createElement('a');
        twitterElement.href = `https://twitter.com/${twitter}`;
        twitterElement.innerText = '@' + allTwitters[address];
        twitterElement.target = '_blank';
        twitterElement.rel = 'noreferrer noopener';

        return twitterElement;
    } else {
        return address;
    }
};

const handleError = (message: string, error?: Error) => {
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

const main = async () => {
    // easier to test
    if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
        sessionStorage.clear();
        localStorage.clear();
    }

    const mainElement = document.getElementsByTagName('main')[0];

    const loadingContainer = document.createElement('div');
    loadingContainer.classList.add('loading');
    mainElement.appendChild(loadingContainer);
    const { clearAnimation } = loadingAnimation(loadingContainer);
    let round = getRoundFromUrl({ defaultRound: { major: 6, minor: 4 } });

    if ((round.major === 6 && round.minor === 1) || round.major < 6) {
        handleError(`error: round ${round.major}.${round.minor} is not supported`);
        clearAnimation();
        return;
    }

    if ((round.major === 6 && round.minor > 4) || round.major > 6) {
        handleError(`sorry, you will need a time machine to view that`);
        clearAnimation();
        return;
    }

    // cache leaderboards
    const stringifiedVersion = `${round.major}.${round.minor}`;

    (<HTMLInputElement>document.querySelector('input#round-name')).value = stringifiedVersion;

    let cachedLeaderboard = sessionStorage.getItem(stringifiedVersion);

    let leaderBoard: [string, string, string][] = [];

    if (cachedLeaderboard) {
        // success! found a cached leaderboard
        try {
            leaderBoard = JSON.parse(cachedLeaderboard);
        } catch (e) {
            console.warn('ignoring cache bc of', e);
            cachedLeaderboard = null;
            sessionStorage.clear();
        }
    }
    if (!cachedLeaderboard) {
        // requesting the leaderboard for the 1st time and caching it
        leaderBoard = (await getLeaderBoard(round))
            .sort((a, b) => parseInt(a.score) - parseInt(b.score))
            .reverse()
            .map((p, idx) => [`${idx + 1}.`, p.id, parseInt(p.score).toLocaleString()]);

        try {
            sessionStorage.setItem(stringifiedVersion, JSON.stringify(leaderBoard));
        } catch (e) {
            // possibly exceeded storage limits
            console.warn(`could not cache leaderboard: ${e}; version=\`${stringifiedVersion}\``);
        }
    }

    let table: HTMLTableElement;
    try {
        const allTwitters = await getAllTwitters();
        table = createTable(
            ['place', 'player', 'score'],
            leaderBoard.map(([place, id, score]) => [place, addressTwitter(allTwitters, id), score])
        );
    } catch (e) {
        console.error('Error when creating table');
        // cached leaderboard is possibly corrupted, try to clear it
        handleError('Leaderboard is possibly corrupted. reload and try again!', e as Error);
        sessionStorage.clear();
        return;
    } finally {
        clearAnimation();
    }

    mainElement.appendChild(table);
};

main().catch((e) => {
    // if something reaches to here, there's nothing that can be done
    handleError(`error: ${e}\n\ncheck console for more details`);
    console.error(e);
});
