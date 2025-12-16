import { SlashCommandBuilder, ChatInputCommandInteraction, MessageFlags } from "discord.js";
import { setBalance } from "../bank";
import { errorString } from "../strings";
import Config from "../config";

export const SetBalanceCommand = {
    data: new SlashCommandBuilder().setName("setmoney")
        .setDescription("Ustaw stan konta gracza.")
        .addUserOption(o => o.setName("user").setDescription("Gracz").setRequired(true))
        .addNumberOption(o => o.setName("money").setDescription("Nowy stan konta gracza").setRequired(true).setMinValue(0).setMaxValue(Config.AMOUNT_MAX)),
    async execute(interaction: ChatInputCommandInteraction, usersInGame: Set<string>) {
        const targetUserId = interaction.options.getUser("user")!.id;
        if (usersInGame.has(targetUserId)) {
            await interaction.reply({ content: errorString("D-03"), flags: MessageFlags.Ephemeral });
            return;
        }
        const money = interaction.options.getNumber("money")!;
        setBalance(targetUserId, money);
        await interaction.reply({ content: "OK", flags: MessageFlags.Ephemeral });
    }
};