export const GRAPH_API_URL =
  'https://api.thegraph.com/subgraphs/name/darkforest-eth/dark-forest-v06-round-4';

export const getGraphQLData = async (query: string, graphApiUrl: string = getRoundQueryUrl()) => {
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
  getDataFromResponse: (response: any) => { data: any[]; id: string | undefined } | undefined
) => {
  const allEntities = [];

  let i = 0;
  while (true) {
    console.log(i);
    console.log(query(i));
    const graphResponse = await getGraphQLData(query(i));

    const entities = getDataFromResponse(graphResponse);
    if (entities === undefined) break;

    const { data, id } = entities;

    debugger;
    if (data.length === 0 || typeof id !== 'number') break;

    allEntities.push(...data);

    console.log({ id });
    i = parseInt(id) + 1;
  }

  return allEntities;
};

export const getRoundQueryUrl = () => {
  const searchParams = new URLSearchParams(window.location.search);
  const roundParam = searchParams.get('round');

  if (!roundParam) return GRAPH_API_URL;

  const parsedRound = parseInt(roundParam);

  if (!parsedRound || parsedRound < 0 || parsedRound > 4) return GRAPH_API_URL;

  return `https://api.thegraph.com/subgraphs/name/darkforest-eth/dark-forest-v06-round-${parsedRound}`;
};
