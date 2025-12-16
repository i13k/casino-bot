import { SlashCommandBuilder, ChatInputCommandInteraction, MessageFlags } from "discord.js";
import { addBalance } from "../bank";
import { errorString } from "../strings";
import Config from "../config";

export const AddBalanceCommand = {
    data: new SlashCommandBuilder().setName("addmoney")
        .setDescription("Dodaj pieniądze graczowi.")
        .addUserOption(o => o.setName("user").setDescription("Gracz").setRequired(true))
        .addNumberOption(o => o.setName("money").setDescription("Ile pieniędzy dodać (może być ujemne)").setRequired(true).setMinValue(-Config.AMOUNT_MAX).setMaxValue(Config.AMOUNT_MAX)),
    async execute(interaction: ChatInputCommandInteraction, usersInGame: Set<string>) {
        const targetUserId = interaction.options.getUser("user")!.id;
        if (usersInGame.has(targetUserId)) {
            await interaction.reply({ content: errorString("D-03"), flags: MessageFlags.Ephemeral });
            return;
        }
        const money = interaction.options.getNumber("money")!;
        addBalance(targetUserId, money);
        await interaction.reply({ content: "OK", flags: MessageFlags.Ephemeral });
    }
};