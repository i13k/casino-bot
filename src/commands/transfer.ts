import { SlashCommandBuilder, ChatInputCommandInteraction, MessageFlags } from "discord.js";
import { transfer } from "../bank";
import { errorString } from "../strings";
import Config from "../config";

export const TransferCommand = {
    data: new SlashCommandBuilder().setName("transfer").setDescription("Przelej pieniądze.")
        .addUserOption(o => o.setName("to").setDescription("Do kogo?").setRequired(true))
        .addNumberOption(o => o.setName("amount").setDescription("Ile?").setRequired(true).setMinValue(1).setMaxValue(Config.AMOUNT_MAX))
        .addStringOption(o => o.setName("description").setDescription("Tytuł (opcjonalnie)").setRequired(false)),
    async execute(interaction: ChatInputCommandInteraction, usersInGame: Set<string>) {
        const userId = interaction.options.getUser("to")!.id;
        const amount = interaction.options.getNumber("amount")!;
        const description = interaction.options.getString("description");

        if (usersInGame.has(userId) || usersInGame.has(interaction.user.id)) {
            await interaction.reply({ content: errorString("D-07"), flags: MessageFlags.Ephemeral });
            return;
        }

        if (userId == interaction.user.id) {
            await interaction.reply({ content: errorString("D-05"), flags: MessageFlags.Ephemeral });
            return;
        }

        if (!transfer(interaction.user.id, userId, amount, description))
            await interaction.reply({ content: errorString("D-06"), flags: MessageFlags.Ephemeral });
        else
            await interaction.reply({ content: "OK", flags: MessageFlags.Ephemeral });
    }
};