import { ChatInputCommandInteraction } from "discord.js";
import { TransferLog } from "../bank";

export const getUserHandle = (interaction: ChatInputCommandInteraction, userId: string): string => {
    const user = interaction.guild!.members.cache.find(u => u.id == userId);
    const defaultUsername = `<@${userId}>`;
    const username = user ? (("displayName" in user) ? user.displayName : defaultUsername) : defaultUsername;
    return username;
};

const padTo2Zeros = (s: string): string => (s.length == 2) ? s : ("0" + s);

const formatDate = (d: Date): string => {
    let result = padTo2Zeros(d.getDay().toString());
    result += "." + padTo2Zeros(d.getMonth().toString());
    result += "." + padTo2Zeros(d.getFullYear().toString());
    result += " " + padTo2Zeros(d.getHours().toString());
    result += ":" + padTo2Zeros(d.getMinutes().toString());
    result += ":" + padTo2Zeros(d.getSeconds().toString());

    return result;
}

export const transferLogToString = (log: TransferLog, interaction: ChatInputCommandInteraction): string => {
    let messageText = "";
    for (let i = 0; i < log.length; i++) {
        messageText += `${i + 1}. **${getUserHandle(interaction, log[i].fromUser)}** do **${getUserHandle(interaction, log[i].toUser)}**, $${log[i].amount}: *${log[i].description || ""}* o ${formatDate(new Date(log[i].timestamp * 1000))}\n`;
    }
    if (messageText.length == 0) messageText = "(brak)";
    return messageText;
};