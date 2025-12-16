import { Game as bjGame } from "./games/blackjack";
import { Game as bcGame } from "./games/baccarat";
import { Game as roGame } from "./games/roulette";
import { GAME_KEY as bcGameKey } from "./interfaces/baccarat";
import { GAME_KEY as bjGameKey } from "./interfaces/blackjack";
import { GAME_KEY as roGameKey } from "./interfaces/roulette";

export type AnyGame = bjGame | bcGame | roGame;
export type GameMapMap = Map<string, Map<string, AnyGame>>;

export const initGameMapMap = (gameMapMap: GameMapMap) => {
    gameMapMap.set(bjGameKey, new Map<string, bjGame>());
    gameMapMap.set(bcGameKey, new Map<string, bcGame>());
    gameMapMap.set(roGameKey, new Map<string, roGame>());
};