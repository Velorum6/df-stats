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
    startTime: number;
}

const getIncompleteLobbies = async (): Promise<Arena[]> => {
    const query = `
    query {
        arenas(first: 1000, where: {configHash: "0x58975a691f8765ef71b7ffd9f6d64fa3d22aa1bb046265984a07fb30f7ddad33", gameOver: false, firstMover_not: null}) {
        firstMover {
          id
        },
        id
        startTime
      }
    }`;

    const response = await getGraphQLData<{ arenas: Arena[] }>(
        query,
        'https://bc0d-137-184-52-141.ngrok.io/subgraphs/name/df'
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

const getAllTwitters = async (): Promise<{ [key: string]: string }> => {
    const res = await fetch('https://api.zkga.me/twitter/all-twitters');

    return res.json();
};

const lobbiesTable = (lobbies: Arena[], twitters: { [key: string]: string }) => {
    const sortedLobbies = lobbies.sort((a, b) => a.startTime - b.startTime).reverse();

    const table = createTable(
        ['player', 'lobby', 'start'],
        [
            sortedLobbies.map((l) => {
                const address = l.firstMover.id.split('-')[1];
                let formatted = '';

                if (address in twitters) {
                    formatted = `${address} (@${twitters[address]})`;
                } else {
                    formatted = `${address}`;
                }

                return formatted;
            }),
            sortedLobbies.map((l) => {
                const link = document.createElement('a');
                link.innerText = l.id;
                link.href = `https://arena.dfdao.xyz/play/${l.id}`;
                link.target = '_blank';
                link.rel = 'noopener noreferrer';

                return link;
            }),
            sortedLobbies.map((l) => {
                const creationDate = new Date(l.startTime * 1000);

                const spanContainer = document.createElement('span');

                const update = () => {
                    const sDifference = (new Date().getTime() - creationDate.getTime()) / 1000;

                    let formatted = '';
                    if (sDifference <= 3600) {
                        const minutes = Math.floor(sDifference / 60);
                        const seconds = Math.floor(sDifference % 60);
                        formatted = `${minutes}:${seconds.toString().padStart(2, '0')}`;
                    } else {
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
        ]
    );

    return table;
};

const main = async () => {
    const lobbies = await getIncompleteLobbies();
    const lobbyContainer = document.getElementById('lobby-container');
    const twitters = await getAllTwitters();

    if (lobbyContainer === null) {
        throw new Error("Couldn't find lobbyContainer");
    }

    lobbyContainer.innerText = '';
    lobbyContainer.append(lobbiesTable(lobbies, twitters));
};

main();
