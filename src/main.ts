import { Client, Events, GatewayIntentBits } from "discord.js";
import Config from "./config";
import { route } from "./router";
import { GameMapMap, initGameMapMap } from "./map";

const client: Client<boolean> = new Client({ intents: [GatewayIntentBits.Guilds] });

const gameMapMap: GameMapMap = new Map();
const usersInGame: Set<string> = new Set();

initGameMapMap(gameMapMap);

/*
TODO:
* Add blackjack and baccarat custom rules and options (eg. different payouts), add dialog to choose options
* pay 3/2 on split natural blackjack, 3/2 or 6/5, allow double down on split hand[allow double down on split aces]
* Allow switch between fully autonomous games and human-led games.
* [!!] FIX: usersInGame (use counter instead)
* Allow changing amount of money during a game
* store more strings in strings file
*/

// Games/game keys/commands are used in: router.ts, map.ts, config.ts, main.ts

client.on(Events.InteractionCreate, async interaction => {
    await route(interaction, gameMapMap, usersInGame);
});

client.once(Events.ClientReady, readyClient => {
    console.log(`Logged in as: ${readyClient.user.tag}`);
});

client.login(Config.BOT_TOKEN);
