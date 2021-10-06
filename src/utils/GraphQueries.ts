import { graphEntitiesId, graphEntitiesSkip } from './GraphUtils';
import { lastItem } from './Utils';

export type PlanetType = 'PLANET' | 'SILVER_MINE' | 'RUINS' | 'TRADING_POST' | 'SILVER_BANK';
export type Planet = {
  id: string;
  planetLevel: number;
  planetType: PlanetType;
  milliEnergyCap: number;
};
export type Artifact = { artifactType: string; rarity: string };
export type Arrival = { arrivalId: string };

export const getPlayerPlanets = async (playerAddress: string): Promise<Planet[]> => {
  return graphEntitiesSkip(
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
    (response) => response.data.planets
  );
};

export const getPlayerArtifacts = async (playerAddress: string): Promise<Artifact[]> => {
  return graphEntitiesSkip(
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
  return graphEntitiesId(
    (i) => `{
      arrivals(where: {player: "${playerAddress}",  arrivalId_gt: ${i}}, first: 1000, orderBy: arrivalId) {
        arrivalId
      } 
    }`,
    // TODO: better way of typing this?
    (response: { data: { arrivals: Arrival[] } }) => ({
      data: response.data.arrivals,
      id: lastItem(response.data.arrivals)?.arrivalId,
    })
  );
};
