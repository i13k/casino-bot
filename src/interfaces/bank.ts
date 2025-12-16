import { ChatInputCommandInteraction } from "discord.js";
import { TransferLog } from "../bank";

export const getUserHandle = (interaction: ChatInputCommandInteraction, userId: string): string => {
    const user = interaction.guild!.members.cache.find(u => u.id == userId);
    const defaultUsername = `<@${userId}>`;
    const username = user ? (("displayName" in user) ? user.displayName : defaultUsername) : defaultUsername;
    return username;
};

export const transferLogToString = (log: TransferLog, interaction: ChatInputCommandInteraction): string => {
    let messageText = "";
    for (let i = 0; i < log.length; i++) {
        messageText += `${i + 1}. **${getUserHandle(interaction, log[i].fromUser)}** do **${getUserHandle(interaction, log[i].toUser)}**, $${log[i].amount}: *${log[i].description || "brak tytułu"}* o ${new Date(log[i].timestamp * 1000).toISOString()}\n`;
    }
    if (messageText.length == 0) messageText = "(brak)";
    return messageText;
};