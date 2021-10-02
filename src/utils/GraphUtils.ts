export const GRAPH_API_URL =
  'https://api.thegraph.com/subgraphs/name/darkforest-eth/dark-forest-v06-round-4';

export const getGraphQLData = async (graphApiUrl: string, query: string) => {
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
export const getManyGraphEntities = async (
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
