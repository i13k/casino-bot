import { SlashCommandBuilder, ChatInputCommandInteraction, MessageFlags } from "discord.js";

export const VersionCommand = {
    data: new SlashCommandBuilder().setName("version").setDescription("Wyświetl informacje o bocie"),
    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.reply({ content: "Wersja **1.2.5** z dnia 2025-12-16.\nKod źródłowy i changelog: https://github.com/i13k/casino-bot", flags: MessageFlags.Ephemeral });
    }
};