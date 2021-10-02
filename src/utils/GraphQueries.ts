import { getManyGraphEntities } from './GraphUtils';

export type PlanetType = 'PLANET' | 'SILVER_MINE' | 'RUINS' | 'TRADING_POST' | 'SILVER_BANK';
export type Planet = {
  id: string;
  planetLevel: number;
  planetType: PlanetType;
  milliEnergyCap: number;
};
export type Artifact = { artifactType: string; rarity: string };
export type Arrival = { id: string };

export const getPlayerPlanets = async (playerAddress: string): Promise<Planet[]> => {
  return getManyGraphEntities(
    (i) => `{
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
      }`,
    (respone) => respone.data.planets
  );
};

export const getPlayerArtifacts = async (playerAddress: string): Promise<Artifact[]> => {
  return getManyGraphEntities(
    (i) => `{
          artifacts(where: {discoverer: "${playerAddress}"}, first: 1000, skip: ${i * 1000}) {
            artifactType
            rarity
          }
        }`,
    (response) => response.data.artifacts
  );
};

export const getPlayerMoves = async (playerAddress: string): Promise<Arrival[]> => {
  return getManyGraphEntities(
    (i) => `{
      arrivals(where: {player: "${playerAddress}"}, first: 1000, skip: ${i * 1000}) {
        id
      }
    }`,
    (response) => response.data.arrivals
  );
};
