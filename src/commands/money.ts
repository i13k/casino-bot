import { ChatInputCommandInteraction, MessageFlags, SlashCommandBuilder } from "discord.js";
import { getBalance } from "../bank";
import { getString } from "../strings";

export const BalanceCommand = {
    data: new SlashCommandBuilder().setName("money").setDescription("Sprawdź stan swojego konta.").addUserOption(o => o.setName("user").setDescription("Gracz (zostaw puste, aby sprawdzić swój stan konta)").setRequired(false)),
    async execute(interaction: ChatInputCommandInteraction) {
        const user = interaction.options.getUser("user");
        const userId = user ? user.id : interaction.user.id;
        const balance = getBalance(userId);
        await interaction.reply({ content: `${getString("driver.balance")}: **$${balance}**`, flags: MessageFlags.Ephemeral });
    }
};