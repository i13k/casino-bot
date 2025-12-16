import { SlashCommandBuilder, ChatInputCommandInteraction, MessageFlags } from "discord.js";
import { transferLogForUser } from "../bank";
import { transferLogToString } from "../interfaces/bank";

export const UserTransfersCommand = {
    data: new SlashCommandBuilder().setName("usertransfers").setDescription("Pokaż 16 ostatnich transakcji danego użytkownika.")
        .addUserOption(o => o.setName("user").setDescription("Użytkownik do sprawdzenia").setRequired(true)),
    async execute(interaction: ChatInputCommandInteraction) {
        const userId = interaction.options.getUser("user")!.id;
        await interaction.reply({ content: transferLogToString(transferLogForUser(16, userId), interaction), flags: MessageFlags.Ephemeral });
    }
};