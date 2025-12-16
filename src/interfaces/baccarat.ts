import { ButtonInteraction, ModalBuilder, LabelBuilder, TextInputBuilder, TextInputStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ModalSubmitInteraction, MessageFlags, SlashCommandBuilder, ChatInputCommandInteraction, TextChannel, ContainerBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { getBalance, setBalance, setBalances } from "../bank";
import { Stage, Game, Player, BetType, handValue } from "../games/baccarat";
import { AnyGame } from "../map";
import { getString, errorString } from "../strings";

export const GAME_KEY = "bc";

const stageToString = (s: Stage): string => {
    switch (s) {
        case Stage.BETTING: return "Przerwa";
        case Stage.DEAL: return "Rozdawanie";
        case Stage.CONCLUSION: return "Podsumowanie";
        case Stage.END: return "Koniec";
    }
};

const renderGame = (game: Game): ContainerBuilder[] => {
    let gameInfoInTitle = `${getString("ui.cardsInDeck")} **${game.deck.deck.length}**\n${getString("ui.gamePhase")} ${stageToString(game.stage)}`;

    let gameInfo = `- **Gracz**: `;
    for (const card of game.playerHand) {
        gameInfo += card.serializeAsEmoji() + " ";
    }
    gameInfo += ` =  \` ${handValue(game.playerHand)} \`\n- **Bankier**: `;
    for (const card of game.bankerHand) {
        gameInfo += card.serializeAsEmoji() + " ";
    }
    gameInfo += ` =  \` ${handValue(game.bankerHand)} \`\n`;

    let playerInfo = getString("ui.players");
    for (const player of game.players) {
        let bet = "";
        switch (player.betType) {
            case BetType.PLAYER: bet = "gracza"; break;
            case BetType.BANKER: bet = "bankiera"; break;
            case BetType.TIE: bet = "remis"; break;
        }

        playerInfo += `\n- **${player.name}**: $${player.money}, $${player.bet} na ${bet}`;
    }
    
    const container1 = new ContainerBuilder()
        .setAccentColor(0x35654d)
        .addTextDisplayComponents(c => c.setContent("## Bakarat"))
        .addSeparatorComponents(c => c)
        .addTextDisplayComponents(c => c.setContent(gameInfoInTitle))
        .addSeparatorComponents(c => c)
        .addTextDisplayComponents(c => c.setContent(gameInfo))
        .addSeparatorComponents(c => c)
        .addTextDisplayComponents(c => c.setContent(playerInfo))
        .addSeparatorComponents(c => c)
        .addActionRowComponents(c =>
            c.setComponents(
                new ButtonBuilder().setCustomId("bc-sit").setLabel(getString("ui.button.sit")).setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId("bc-unsit").setLabel(getString("ui.button.unsit")).setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId("bc-bet").setLabel(getString("ui.button.bet")).setStyle(ButtonStyle.Secondary)
            )
        );
    
    const container2 = new ContainerBuilder()
        .setAccentColor(0xad1457)
        .addTextDisplayComponents(c => c.setContent(getString("ui.adminTitle")))
        .addActionRowComponents(c =>
            c.setComponents(
                new ButtonBuilder().setCustomId("a-bc-deal").setLabel(getString("ui.button.admin.deal")).setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId("a-bc-conclude").setLabel(getString("ui.button.admin.conclude")).setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId("a-bc-reset").setLabel(getString("ui.button.admin.reset")).setStyle(ButtonStyle.Danger),
                new ButtonBuilder().setCustomId("a-bc-end").setLabel(getString("ui.button.admin.end")).setStyle(ButtonStyle.Danger)
            )
        );
    
    return [container1, container2];
};

export const routeButtonInteraction = async (id: string, interaction: ButtonInteraction, _gameMap: Map<string, AnyGame>, usersInGame: Set<string>) => {
    const gameMap = _gameMap as Map<string, Game>;
    const game = gameMap.get(interaction.channelId)!;
    const userId = interaction.user.id;
    const index = game.players.findIndex(p => p.userId == userId);
    switch (id) {
        case "sit": {
            if (usersInGame.has(userId)) throw new Error("D-08");
            game.addPlayer(new Player(getBalance(userId), userId, interaction.user.displayName));
            usersInGame.add(userId);
            break;
        }
        case "unsit": {
            if (index != -1) setBalance(userId, game.players[index].money);
            game.removePlayer(userId);
            usersInGame.delete(userId);
            break;
        }
        case "bet": {
            const modal = new ModalBuilder().setCustomId("bc-m-bet").setTitle(getString("ui.betModalTitle"));
            modal.addLabelComponents(
                    new LabelBuilder()
                        .setLabel(getString("ui.betModalLabel"))
                        .setTextInputComponent(new TextInputBuilder()
                                .setRequired(true)
                                .setCustomId("ti-bet")
                                .setValue("10")
                                .setMinLength(1).setMaxLength(32)
                                .setStyle(TextInputStyle.Short)
                        ),
                    new LabelBuilder()
                        .setLabel("Na kogo?")
                        .setStringSelectMenuComponent(
                            new StringSelectMenuBuilder()
                                .setCustomId("s-betType")
                                .setPlaceholder("Na kogo?")
                                .setRequired(true)
                                .setMinValues(1)
                                .setMaxValues(1)
                                .addOptions(
                                    new StringSelectMenuOptionBuilder()
                                        .setLabel(getString("ui.baccarat.bet.player"))
                                        .setDescription(getString("ui.baccarat.bet.player.description"))
                                        .setValue("P")
                                        .setDefault(true),
                                    new StringSelectMenuOptionBuilder()
                                        .setLabel(getString("ui.baccarat.bet.banker"))
                                        .setDescription(getString("ui.baccarat.bet.banker.description"))
                                        .setValue("B"),
                                    new StringSelectMenuOptionBuilder()
                                        .setLabel(getString("ui.baccarat.bet.tie"))
                                        .setDescription(getString("ui.baccarat.bet.tie.description"))
                                        .setValue("T")
                                )
                        )
                );
            await interaction.showModal(modal);
            return;
        }
        case "deal": {
            game.dealCards();
            break;
        }
        case "conclude": {
            game.conclude();
            break;
        }
        case "end": {
            setBalances(game.players);
            for (const player of game.players) usersInGame.delete(player.userId);
            gameMap.delete(interaction.channelId);
            await interaction.message.delete();
            return;
        }
        case "reset": {
            game.reset();
            break;
        }
    }
    await interaction.update({ components: renderGame(game) });
};

export const routeModalInteraction = async (id: string, interaction: ModalSubmitInteraction, gameMap: Map<string, AnyGame>) => {
    const game = gameMap.get(interaction.channelId!)! as Game;
    const index = game.players.findIndex(p => p.userId == interaction.user.id);
    if (id == "m-bet") {
        const betString = interaction.fields.getTextInputValue("ti-bet");
        const bet = parseInt(betString);
        const betTypeString = interaction.fields.getStringSelectValues("s-betType")[0];
        if (Number.isNaN(bet)) {
            await interaction.reply({ content: errorString("D-05"), flags: MessageFlags.Ephemeral });
            return;
        } else if (bet <= 0) {
            await interaction.reply({ content: errorString("D-05"), flags: MessageFlags.Ephemeral });
            return;
        }
        game.bet(index, bet, betTypeString);
        await (interaction as unknown as ButtonInteraction).update({ components: renderGame(game) });
    }
};

export const BaccaratGameCommand = {
    data: new SlashCommandBuilder().setName("baccarat").setDescription("Rozpocznij grę w bakarata."),
    async execute(interaction: ChatInputCommandInteraction, gameMap: Map<string, AnyGame>) {
        const channel = interaction.channel as TextChannel;

        if (gameMap.has(interaction.channelId)) {
            await interaction.reply({ content: errorString("D-02"), flags: MessageFlags.Ephemeral });
            return;
        }

        const game = new Game();

        await channel.send({
            components: renderGame(game),
            flags: MessageFlags.IsComponentsV2
        });

        gameMap.set(interaction.channelId, game);
        
        await interaction.reply({ content: "OK", flags: MessageFlags.Ephemeral });
    }
};