import { payout } from "../bank";
import { SlashCommandBuilder, ChatInputCommandInteraction, MessageFlags } from "discord.js";
import { getString } from "../strings";

export const BalanceClearCommand = {
    data: new SlashCommandBuilder().setName("payout").setDescription("Wypłać wszystkim $250."),
    async execute(interaction: ChatInputCommandInteraction) {
        payout();
        await interaction.reply({ content: getString("driver.paidout"), flags: MessageFlags.Ephemeral });
    }
};