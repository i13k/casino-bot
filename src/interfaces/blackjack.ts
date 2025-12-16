import { ButtonInteraction, ModalBuilder, LabelBuilder, TextInputBuilder, TextInputStyle, ModalSubmitInteraction, MessageFlags, SlashCommandBuilder, ChatInputCommandInteraction, TextChannel, ContainerBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { getBalance, setBalance, setBalances } from "../bank";
import { Player, Action, Game, Stage } from "../games/blackjack";
import { AnyGame } from "../map";
import { getString, errorString } from "../strings";

export const GAME_KEY = "bj";

const stageToString = (s: Stage): string => {
    switch (s) {
        case Stage.BETTING: return "Przerwa";
        case Stage.DEAL: return "Rozdawanie";
        case Stage.GAME: return "Gra";
        case Stage.DEALER_GAME: return "Gra krupiera";
        case Stage.CONCLUSION: return "Podsumowanie";
        case Stage.END: return "Koniec";
    }
};

const renderGame = (game: Game): ContainerBuilder[] => {
        let playerList = getString("ui.players");
        for (let i = 0; i < game.players.length; i++) {
            const player = game.players[i];
            playerList += "\n- ";
            if (game.currentPlayer == i && player.hands.length == 1) playerList += ":arrow_right: ";
            playerList += `**${player.name}**: $${player.money}, $${player.betSum} ${getString("ui.moneyInPlay")}`;
            if (player.surrendered) playerList += "; " + getString("ui.surrendered");
            for (let j = 0; j < player.hands.length; j++) {
                const hand = player.hands[j];
                playerList += "\n  - ";
                if (game.currentPlayer == i && game.currentHand == j && player.hands.length > 1) playerList += ":arrow_right: ";
                for (const card of hand.content) {
                    playerList += card.serializeAsEmoji() + " ";
                }
                playerList +=  ` =  \` ${hand.value()} \``;
            }
        }
        let gameInfo: string;
        if (game.dealerHand.content.length > 1) {
            gameInfo = getString("ui.dealerHand") + "\n- ";
            const hideDealerSecondCard = ![Stage.DEALER_GAME, Stage.CONCLUSION, Stage.END].includes(game.stage);
            for (let i = 0; i < game.dealerHand.content.length; i++) {
                if (i == 1 && hideDealerSecondCard) gameInfo += "<:bjSuitUnknown:1443250819397980200><:bjFaceUnknown:1442897972080939170> ";
                else gameInfo += `${game.dealerHand.content[i].serializeAsEmoji()} `;
            }
            if (!hideDealerSecondCard) gameInfo += ` =  \` ${game.dealerHand.value()} \``;
        } else gameInfo = getString("ui.dealerHasNoCards");

        let gameInfoInTitle = `${getString("ui.cardsInDeck")} **${game.deck.deck.length}**\n${getString("ui.gamePhase")} ${stageToString(game.stage)}`;
        
        const container1 = new ContainerBuilder()
            .setAccentColor(0x35654d)
            .addTextDisplayComponents(c => c.setContent(getString("ui.title")))
            .addSeparatorComponents(c => c)
            .addTextDisplayComponents(c => c.setContent(gameInfoInTitle))
            .addSeparatorComponents(c => c)
            .addActionRowComponents(c =>
                c.setComponents(
                    new ButtonBuilder().setCustomId("bj-sit").setLabel(getString("ui.button.sit")).setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder().setCustomId("bj-unsit").setLabel(getString("ui.button.unsit")).setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder().setCustomId("bj-bet").setLabel(getString("ui.button.bet")).setStyle(ButtonStyle.Secondary)
                )
            )
            .addSeparatorComponents(c => c)
            .addTextDisplayComponents(c => c.setContent(playerList))
            .addSeparatorComponents(c => c)
            .addTextDisplayComponents(c => c.setContent(gameInfo))
            .addSeparatorComponents(c => c)
            .addActionRowComponents(c =>
                c.setComponents(
                    new ButtonBuilder().setCustomId("bj-hit").setLabel(getString("ui.button.hit")).setStyle(ButtonStyle.Primary),
                    new ButtonBuilder().setCustomId("bj-stand").setLabel(getString("ui.button.stand")).setStyle(ButtonStyle.Primary),
                    new ButtonBuilder().setCustomId("bj-doubleDown").setLabel(getString("ui.button.doubleDown")).setStyle(ButtonStyle.Primary),
                    new ButtonBuilder().setCustomId("bj-split").setLabel(getString("ui.button.split")).setStyle(ButtonStyle.Primary),
                    new ButtonBuilder().setCustomId("bj-surrender").setLabel(getString("ui.button.surrender")).setStyle(ButtonStyle.Primary)
                )
            );
        
        const adminButtons = [new ButtonBuilder().setCustomId("a-bj-deal").setLabel(getString("ui.button.admin.deal")).setStyle(ButtonStyle.Secondary)];
        if (!game.options.autoDealerGame) adminButtons.push(new ButtonBuilder().setCustomId("a-bj-dealergame").setLabel(getString("ui.button.admin.dealerGame")).setStyle(ButtonStyle.Secondary));
        if (!game.options.autoConclude) adminButtons.push(new ButtonBuilder().setCustomId("a-bj-conclude").setLabel(getString("ui.button.admin.conclude")).setStyle(ButtonStyle.Secondary));

        const container2 = new ContainerBuilder()
            .setAccentColor(0xad1457)
            .addTextDisplayComponents(c => c.setContent(getString("ui.adminTitle")))
            .addActionRowComponents(c => c.setComponents(adminButtons))
            .addActionRowComponents(c =>
                c.setComponents(
                    new ButtonBuilder().setCustomId("a-bj-skip").setLabel(getString("ui.button.admin.skip")).setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder().setCustomId("a-bj-reset").setLabel(getString("ui.button.admin.reset")).setStyle(ButtonStyle.Danger),
                    new ButtonBuilder().setCustomId("a-bj-end").setLabel(getString("ui.button.admin.end")).setStyle(ButtonStyle.Danger)
                )
            );
        return [container1, container2];
};

export const routeButtonInteraction = async (id: string, interaction: ButtonInteraction, _gameMap: Map<string, AnyGame>, usersInGame: Set<string>) => {
    const gameMap = _gameMap as Map<string, Game>;
    const userId = interaction.user.id;
    const game = gameMap.get(interaction.channelId)!;
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
        case "hit": {
            game.action(index, Action.HIT);
            break;
        }
        case "stand": {
            game.action(index, Action.STAND);
            break;
        }
        case "bet": {
            const modal = new ModalBuilder().setCustomId("bj-m-bet").setTitle(getString("ui.betModalTitle"));
            modal.addLabelComponents(new LabelBuilder()
                .setLabel(getString("ui.betModalLabel"))
                .setTextInputComponent(new TextInputBuilder()
                        .setRequired(true)
                        .setCustomId("ti-bet")
                        .setValue("10")
                        .setMinLength(1).setMaxLength(32)
                        .setStyle(TextInputStyle.Short)
                    )
                );
            await interaction.showModal(modal);
            return;
        }
        case "doubleDown": {
            game.action(index, Action.DOUBLE_DOWN);
            break;
        }
        case "split": {
            game.action(index, Action.SPLIT);
            break;
        }
        case "surrender": {
            game.action(index, Action.SURRENDER);
            break;
        }
        case "deal": {
            game.dealCards();
            break;
        }
        case "dealergame": {
            game.dealerGame();
            break;
        }
        case "conclude": {
            game.conclude();
            break;
        }
        case "skip": {
            game.skip();
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
        if (Number.isNaN(bet)) {
            await interaction.reply({ content: errorString("D-05"), flags: MessageFlags.Ephemeral });
            return;
        } else if (bet <= 0) {
            await interaction.reply({ content: errorString("D-05"), flags: MessageFlags.Ephemeral });
            return;
        }
        game.bet(index, bet);
        await (interaction as unknown as ButtonInteraction).update({ components: renderGame(game) });
    }
};

export const BlackjackGameCommand = {
    data: new SlashCommandBuilder().setName("blackjack").setDescription("Rozpocznij grę w blackjacka."),
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