import { payout } from "../bank";
import { SlashCommandBuilder, ChatInputCommandInteraction, GuildMemberRoleManager, MessageFlags } from "discord.js";
import { errorString, getString } from "../strings";
import Config from "../config";

export const BalanceClearCommand = {
    data: new SlashCommandBuilder().setName("payout").setDescription("Wypłać wszystkim $250."),
    async execute(interaction: ChatInputCommandInteraction) {
        if (!(interaction.member!.roles as GuildMemberRoleManager).cache.some(role => role.name === Config.ADMIN_ROLE)) {
            await interaction.reply({ content: errorString("D-01"), flags: MessageFlags.Ephemeral });
            return;
        }
        payout();
        await interaction.reply({ content: getString("driver.paidout"), flags: MessageFlags.Ephemeral });
    }
};