// https://graph-optimism.gnosischain.com/subgraphs/name/dfdao/arena-v1/graphql

const createTable = (header: string[], columns: (HTMLElement | string)[][]) => {
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

const zip = <Elem>(...arr: Elem[][]) =>
    Array(Math.max(...arr.map((a) => a.length)))
        .fill('')
        .map((_, i) => arr.map((a) => a[i]));

const getGraphQLData = async <T extends Object>(
    query: string,
    graphApiUrl: string
): Promise<{ data: Record<keyof T, T[keyof T] | null> } | { errors: any[] }> => {
    const response = await fetch(graphApiUrl, {
        method: 'POST',
        body: JSON.stringify({ query, operationName: null, variables: null }),
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
        },
    });

    const json = await response.json();
    return json;
};

interface Arena {
    id: string;
    firstMover: { id: string };
    creationTime: number;
}

const getIncompleteLobbies = async (): Promise<Arena[]> => {
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

    const response = await getGraphQLData<{ arenas: Arena[] }>(
        query,
        'https://graph-optimism.gnosischain.com/subgraphs/name/dfdao/arena-v1'
    );

    if ('errors' in response) {
        throw new Error(`error when fetching data, ${JSON.stringify(response)}`);
    }

    const { arenas } = response.data;

    if (arenas === null) {
        throw new Error(`error when fetching data, ${JSON.stringify(response)}`);
    }

    return arenas;
};

const lobbiesTable = (lobbies: Arena[]) => {
    const sortedLobbies = lobbies.sort((a, b) => a.creationTime - b.creationTime).reverse();

    const table = createTable(
        ['player', 'lobby', 'creationTime'],
        [
            sortedLobbies.map((l) => l.firstMover.id.split('-')[1]),
            sortedLobbies.map((l) => l.id),
            sortedLobbies.map((l) => {
                const creationDate = new Date(l.creationTime * 1000);

                const msDifference = new Date().getTime() - creationDate.getTime();

                return Math.round(msDifference / 1000).toString();
            }),
        ]
    );

    return table;
};

const main = async () => {
    const lobbies = await getIncompleteLobbies();
    const lobbyContainer = document.getElementById('lobby-container');

    if (lobbyContainer === null) {
        throw new Error("Couldn't find lobbyContainer");
    }

    lobbyContainer.innerText = '';
    lobbyContainer.append(lobbiesTable(lobbies));
};

main();
