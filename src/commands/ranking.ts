import { SlashCommandBuilder, ChatInputCommandInteraction, MessageFlags } from "discord.js";
import { getRanking } from "../bank";
import { getUserHandle } from "../interfaces/bank";

export const BalanceRankingCommmand = {
    data: new SlashCommandBuilder().setName("ranking").setDescription("Pokaż ranking (top 10) stanów konta."),
    async execute(interaction: ChatInputCommandInteraction) {
        const ranking = getRanking();
        let message = "";
        for (let i = 0; i < ranking.length; i++) {
            const entry = ranking[i];
            message += `\n${i + 1}. **${getUserHandle(interaction, entry.userId)}**: $${entry.money}`;
        }
        await interaction.reply({ content: message, flags: MessageFlags.Ephemeral });
    }
};