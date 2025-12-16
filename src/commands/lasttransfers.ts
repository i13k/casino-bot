import { SlashCommandBuilder, ChatInputCommandInteraction, MessageFlags } from "discord.js";
import { transferLog } from "../bank";
import { transferLogToString } from "../interfaces/bank";

export const LastTransfersCommand = {
    data: new SlashCommandBuilder().setName("lasttransfers").setDescription("Pokaż 16 ostatnich transakcji."),
    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.reply({ content: transferLogToString(transferLog(16), interaction), flags: MessageFlags.Ephemeral });
    }
};