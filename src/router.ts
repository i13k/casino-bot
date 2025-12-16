import { ButtonInteraction, MessageFlags, GuildMemberRoleManager, Interaction } from "discord.js";
import { BalanceClearCommand } from "./commands/clear";
import { BalanceCommand } from "./commands/money";
import { AddBalanceCommand } from "./commands/moneyadd";
import { SetBalanceCommand } from "./commands/moneyset";
import { BalanceRankingCommmand } from "./commands/ranking";
import { TransferCommand } from "./commands/transfer";
import { UserTransfersCommand } from "./commands/usertransfers";
import { LastTransfersCommand } from "./commands/lasttransfers";
import { VersionCommand } from "./commands/version";
import { errorString } from "./strings";
import Config from "./config";
import { AnyGame, GameMapMap } from "./map";

import * as BJ from "./interfaces/blackjack";
import * as BC from "./interfaces/baccarat";
import * as RO from "./interfaces/roulette";

type GameKeyMappingT = {
    [key: string]: typeof BJ | typeof BC | typeof RO;
};

const gameKeyMapping: GameKeyMappingT = {
    "bj": BJ,
    "bc": BC,
    "ro": RO
};

export const route = async (interaction: Interaction, gameMapMap: GameMapMap, usersInGame: Set<string>) => {
    const channelId = interaction.channelId!;
    if (interaction.isChatInputCommand()) {
        try {
            if (Config.DEALER_PRIVILEGED_COMMANDS.includes(interaction.commandName)) {
                if (!(interaction.member!.roles as GuildMemberRoleManager).cache.some(role => role.id === Config.DEALER_ROLE)) {
                    await interaction.reply({ content: errorString("D-01"), flags: MessageFlags.Ephemeral });
                    return;
                }
            } else if (Config.ADMIN_PRIVILEGED_COMMANDS.includes(interaction.commandName)) {
                if (!(interaction.member!.roles as GuildMemberRoleManager).cache.some(role => role.id === Config.ADMIN_ROLE)) {
                    await interaction.reply({ content: errorString("D-01"), flags: MessageFlags.Ephemeral });
                    return;
                }
            }
            
            if (interaction.commandName == "blackjack")
                await BJ.BlackjackGameCommand.execute(interaction, gameMapMap.get(BJ.GAME_KEY)!);
            else if (interaction.commandName == "baccarat")
                await BC.BaccaratGameCommand.execute(interaction, gameMapMap.get(BC.GAME_KEY)!);
            else if (interaction.commandName == "roulette")
                await RO.RouletteGameCommand.execute(interaction, gameMapMap.get(RO.GAME_KEY)!);
            else if (interaction.commandName == "money")
                await BalanceCommand.execute(interaction);
            else if (interaction.commandName == "addmoney")
                await AddBalanceCommand.execute(interaction, usersInGame);
            else if (interaction.commandName == "setmoney")
                await SetBalanceCommand.execute(interaction, usersInGame);
            else if (interaction.commandName == "ranking")
                await BalanceRankingCommmand.execute(interaction);
            else if (interaction.commandName == "clear")
                await BalanceClearCommand.execute(interaction);
            else if (interaction.commandName == "transfer")
                await TransferCommand.execute(interaction, usersInGame);
            else if (interaction.commandName == "lasttransfers")
                await LastTransfersCommand.execute(interaction);
            else if (interaction.commandName == "usertransfers")
                await UserTransfersCommand.execute(interaction);
            else if (interaction.commandName == "version")
                await VersionCommand.execute(interaction);
        } catch(e) {
            console.error(e);
        }
    } else {
        const buttonInteraction = interaction as ButtonInteraction;
        let id = buttonInteraction.customId;

        if (id.startsWith("a-")) {
            if (!(interaction.member!.roles as GuildMemberRoleManager).cache.some(role => role.id === Config.DEALER_ROLE)) {
                await buttonInteraction.reply({ content: errorString("D-01"), flags: MessageFlags.Ephemeral });
                return;
            }
            id = id.substring(2);
        }

        const gameKey = id.substring(0, 2);
        const gameMap = gameMapMap.get(gameKey)! as Map<string, AnyGame>;
        if (!gameMap.has(channelId)) {
            await buttonInteraction.reply({ content: errorString("D-04"), flags: MessageFlags.Ephemeral });
            return;
        }
        
        id = id.substring(3);

        try {
            if (interaction.isButton())
                await gameKeyMapping[gameKey].routeButtonInteraction(id, interaction, gameMap, usersInGame);
            else if (interaction.isModalSubmit())
                await gameKeyMapping[gameKey].routeModalInteraction(id, interaction, gameMap);
        } catch (e) {
            const err = e as Error;
            await buttonInteraction.reply({ content: errorString(err.message), flags: MessageFlags.Ephemeral });
        }
    }
};