import { BlackjackGameCommand } from "./interfaces/blackjack";
import { BaccaratGameCommand } from "./interfaces/baccarat";
import { RouletteGameCommand } from "./interfaces/roulette";
import { AddBalanceCommand } from "./commands/moneyadd";
import { SetBalanceCommand } from "./commands/moneyset";
import { BalanceRankingCommmand } from "./commands/ranking";
import { BalanceClearCommand } from "./commands/clear";
import { TransferCommand } from "./commands/transfer";
import { BalanceCommand } from "./commands/money";
import { UserTransfersCommand } from "./commands/usertransfers";
import { LastTransfersCommand } from "./commands/lasttransfers";
import { VersionCommand } from "./commands/version";
import Config from "./config";
import { REST, Routes } from "discord.js";

const commands = [BlackjackGameCommand.data.toJSON(), BalanceCommand.data.toJSON(),
    AddBalanceCommand.data.toJSON(), SetBalanceCommand.data.toJSON(),
    BalanceRankingCommmand.data.toJSON(), BalanceClearCommand.data.toJSON(),
    TransferCommand.data.toJSON(), BaccaratGameCommand.data.toJSON(), RouletteGameCommand.data.toJSON(),
    UserTransfersCommand.data.toJSON(), LastTransfersCommand.data.toJSON(), VersionCommand.data.toJSON()];

const rest = new REST().setToken(Config.BOT_TOKEN);
(async () => {
    try {
        await rest.put(Routes.applicationCommands(Config.CLIENT_ID), { body: commands });
        console.log("Commands refreshed.");
    } catch(e) {
        console.error(e);
    }
})();