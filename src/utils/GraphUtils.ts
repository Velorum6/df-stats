import { Round } from './Utils';

export const GRAPH_API_URL =
    'https://api.thegraph.com/subgraphs/name/darkforest-eth/dark-forest-v06-round-4';

export const getGraphQLData = async (query: string, round?: Round) => {
    let graphApiUrl = GRAPH_API_URL;

    if (round) {
        let roundQueryUrl = getRoundQueryUrl(round);

        if (roundQueryUrl) graphApiUrl = roundQueryUrl;
    }

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

// get around limit of only getting 1000 "things" at a time by sending requests over and over
// this function increases the "skip" by 1000 each iteration, so it only works for <=6000 objects
export const graphEntitiesSkip = async (
    query: (i: number) => string,
    getDataFromResponse: (response: any) => any[] | undefined
) => {
    const allEntities = [];

    for (let i = 0; i < 6; i++) {
        const graphResponse = await getGraphQLData(query(i));
        const entities = getDataFromResponse(graphResponse);

        if (entities === undefined || entities.length === 0) {
            break;
        } else {
            allEntities.push(...entities);
        }
    }
    return allEntities;
};

// this function uses id_gt, so it can theoretically get an infinite amount of objects
// (might need to limit as something like 20 so it doesn't take years)
export const graphEntitiesId = async (
    query: (id: number) => string,
    getDataFromResponse: (response: any) => { data: any[]; id: string | undefined } | undefined,
    round?: Round
) => {
    const allEntities = [];

    let i = 0;
    while (true) {
        const graphResponse = await getGraphQLData(query(i), round);

        const entities = getDataFromResponse(graphResponse);
        if (entities === undefined) break;

        const { data, id } = entities;

        if (data.length === 0 || id === undefined || id === null) break;

        allEntities.push(...data);

        i = parseInt(id) + 1;
    }

    return allEntities;
};

export const getRound = () => {
    const searchParams = new URLSearchParams(window.location.search);
    const roundParam = searchParams.get('round');

    if (!roundParam) return 4;

    const parsedRound = parseInt(roundParam);
    if (!parsedRound || parsedRound < 0 || parsedRound > 4) return 4;

    return parsedRound;
};

export const getRoundQueryUrl = (round: Round) => {
    if (round.major === 6) {
        return `https://api.thegraph.com/subgraphs/name/darkforest-eth/dark-forest-v06-round-${round.minor}`;
    }
};
