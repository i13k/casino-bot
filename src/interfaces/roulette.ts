import { ButtonInteraction, ModalBuilder, LabelBuilder, TextInputBuilder, TextInputStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ModalSubmitInteraction, MessageFlags, SlashCommandBuilder, ChatInputCommandInteraction, TextChannel, ContainerBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { getBalance, setBalance, setBalances } from "../bank";
import { Stage, Game, Player, Bet, BetType, isRed, isBlack } from "../games/roulette";
import { AnyGame } from "../map";
import { getString, errorString } from "../strings";

export const GAME_KEY = "ro";

const stageToString = (s: Stage): string => {
    switch (s) {
        case Stage.BETTING: return "Przerwa";
        case Stage.SPIN: return "Losowanie";
        case Stage.CONCLUSION: return "Podsumowanie";
        case Stage.END: return "Koniec";
    }
};

const betToString = (bet: Bet): string => {
    switch (bet.type) {
        case BetType.ONE: return bet.content[0].toString();
        case BetType.TWO: return `${bet.content[0]}/${bet.content[1]}`;
        case BetType.THREE: return `${bet.content[0]}/${bet.content[1]}/${bet.content[2]}`;
        case BetType.FOUR: return `${bet.content[0]}/${bet.content[1]}/${bet.content[2]}/${bet.content[3]}`;
        case BetType.TOP_LINE: return "00/0/1/2/3";
        case BetType.FIRST_FOUR: return "0/1/2/3";
        case BetType.SIX: return `${bet.content[0]}/${bet.content[1]}/${bet.content[2]}/${bet.content[3]}/${bet.content[4]}/${bet.content[5]}`;
        case BetType.DOZEN: {
            if (bet.content[0] == 1) return "1-12";
            if (bet.content[0] == 2) return "13-24";
            if (bet.content[0] == 3) return "25-36";
        }
        case BetType.COLUMN: {
            if (bet.content[0] == 1) return "I kol.";
            if (bet.content[0] == 2) return "II kol.";
            if (bet.content[0] == 3) return "III kol.";
        }
        case BetType.EVEN: return "parzyste";
        case BetType.ODD: return "nieparzyste";
        case BetType.RED: return "czerwone";
        case BetType.BLACK: return "czarne";
        case BetType.MANQUE: return "*manque* (1-18)";
        case BetType.PASSE: return "*passe* (19-36)";
        case BetType.SNAKE: return "węża";
    }
    return "(nieznany zakład)";
};

const getCircle = (n: number): string => {
    if (isRed(n)) return ":red_circle:";
    else if (isBlack(n)) return ":black_circle:";
    else return ":green_circle:";
};

const renderGame = (game: Game): ContainerBuilder[] => {
    let gameInfo = `${getString("ui.gamePhase")} ${stageToString(game.stage)}`;
    if (game.result != -2) {
        gameInfo += `\nWynik: ${getCircle(game.result)} ${game.result == -1 ? "00" : game.result}`
    }

    let playerInfo = getString("ui.players");
    for (const player of game.players) {
        playerInfo += `\n- **${player.name}**: $${player.money}, $${player.betSum} ${getString("ui.moneyInPlay")}`;
        for (let i = 0; i < player.bets.length; i++) {
            playerInfo += `\n  ${i+1}. $${player.bets[i].amount} na ${betToString(player.bets[i])}`;
        }
    }

    const container1 = new ContainerBuilder()
        .setAccentColor(0x35654d)
        .addTextDisplayComponents(c => c.setContent("## Ruletka"))
        .addSeparatorComponents(c => c)
        .addTextDisplayComponents(c => c.setContent(gameInfo))
        .addSeparatorComponents(c => c)
        .addTextDisplayComponents(c => c.setContent(playerInfo))
        .addSeparatorComponents(c => c)
        .addActionRowComponents(c =>
            c.setComponents(
                new ButtonBuilder().setCustomId("ro-sit").setLabel(getString("ui.button.sit")).setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId("ro-unsit").setLabel(getString("ui.button.unsit")).setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId("ro-betin").setLabel("Inside bet").setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId("ro-betout").setLabel("Outside bet").setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId("ro-unbet").setLabel("Cofnij").setStyle(ButtonStyle.Danger)
            )
        );
    
    const container2 = new ContainerBuilder()
        .setAccentColor(0xad1457)
        .addTextDisplayComponents(c => c.setContent(getString("ui.adminTitle")))
        .addActionRowComponents(c =>
            c.setComponents(
                new ButtonBuilder().setCustomId("a-ro-nmb").setLabel("No more bets").setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId("a-ro-enternum").setLabel("wpisz wynik").setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId("a-ro-conclude").setLabel(getString("ui.button.admin.conclude")).setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId("a-ro-reset").setLabel(getString("ui.button.admin.reset")).setStyle(ButtonStyle.Danger),
                new ButtonBuilder().setCustomId("a-ro-end").setLabel(getString("ui.button.admin.end")).setStyle(ButtonStyle.Danger)
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
            usersInGame.add(userId);
            game.addPlayer(new Player(getBalance(userId), userId, interaction.user.displayName));
            break;
        }
        case "unsit": {
            usersInGame.delete(userId);
            if (index != -1) setBalance(userId, game.players[index].money);
            game.removePlayer(userId);
            break;
        }
        case "betin": {
            const modal = new ModalBuilder().setCustomId("ro-m-betin").setTitle("Nowy inside bet");
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
                    .setLabel("Na co?")
                    .setStringSelectMenuComponent(
                        new StringSelectMenuBuilder()
                            .setCustomId("s-betType")
                            .setPlaceholder("Na co?")
                            .setRequired(true)
                            .setMinValues(1)
                            .setMaxValues(1)
                            .addOptions(
                                new StringSelectMenuOptionBuilder()
                                    .setLabel("Straight up")
                                    .setDescription("35 do 1; jedna liczba")
                                    .setValue("0")
                                    .setDefault(true),
                                new StringSelectMenuOptionBuilder()
                                    .setLabel("Split")
                                    .setDescription("17 do 1; dwie liczby")
                                    .setValue("1"),
                                new StringSelectMenuOptionBuilder()
                                    .setLabel("Street")
                                    .setDescription("11 do 1; trzy liczby")
                                    .setValue("2"),
                                new StringSelectMenuOptionBuilder()
                                    .setLabel("Square")
                                    .setDescription("8 do 1; cztery liczby")
                                    .setValue("3"),
                                new StringSelectMenuOptionBuilder()
                                    .setLabel("Double street")
                                    .setDescription("5 do 1; sześć liczb")
                                    .setValue("4")
                            )
                    ),
                new LabelBuilder()
                    .setLabel("Podaj liczby, oddziel przecinkami")
                    .setTextInputComponent(new TextInputBuilder()
                            .setRequired(false)
                            .setCustomId("ti-nums")
                            .setMinLength(1).setMaxLength(32)
                            .setStyle(TextInputStyle.Short)
                            .setPlaceholder("wymagana kolejność rosnąca (np. 1,2,4,5)")
                    )
            );
            await interaction.showModal(modal);
            return;
        }
        case "betout": {
            const modal = new ModalBuilder().setCustomId("ro-m-betout").setTitle("Nowy outside bet");
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
                    .setLabel("Na co?")
                    .setStringSelectMenuComponent(
                        new StringSelectMenuBuilder()
                            .setCustomId("s-betType")
                            .setPlaceholder("Na co?")
                            .setRequired(true)
                            .setMinValues(1)
                            .setMaxValues(1)
                            .addOptions(
                                new StringSelectMenuOptionBuilder()
                                    .setLabel("Czerwone")
                                    .setDescription("1 do 1; liczba czerwona")
                                    .setValue("0")
                                    .setDefault(true),
                                new StringSelectMenuOptionBuilder()
                                    .setLabel("Czarne")
                                    .setDescription("1 do 1; liczba czarna")
                                    .setValue("1"),
                                new StringSelectMenuOptionBuilder()
                                    .setLabel("Parzyste")
                                    .setDescription("1 do 1; liczba parzysta (nie 0/00).")
                                    .setValue("2"),
                                new StringSelectMenuOptionBuilder()
                                    .setLabel("Nieparzyste")
                                    .setDescription("1 do 1; liczba nieparzysta.")
                                    .setValue("3"),
                                new StringSelectMenuOptionBuilder()
                                    .setLabel("Manque")
                                    .setDescription("1 do 1; liczba z zakresu 1-18")
                                    .setValue("4"),
                                new StringSelectMenuOptionBuilder()
                                    .setLabel("Passe")
                                    .setDescription("1 do 1; liczba z zakresu 19-36")
                                    .setValue("5"),
                                new StringSelectMenuOptionBuilder()
                                    .setLabel("I kol.")
                                    .setDescription("2 do 1; liczba z I kolumny")
                                    .setValue("6"),
                                new StringSelectMenuOptionBuilder()
                                    .setLabel("II kol.")
                                    .setDescription("2 do 1; liczba z II kolumny")
                                    .setValue("7"),
                                new StringSelectMenuOptionBuilder()
                                    .setLabel("III kol.")
                                    .setDescription("2 do 1; liczba z III kolumny")
                                    .setValue("8"),
                                new StringSelectMenuOptionBuilder()
                                    .setLabel("1-12")
                                    .setDescription("2 do 1; liczba z zakresu 1-12")
                                    .setValue("9"),
                                new StringSelectMenuOptionBuilder()
                                    .setLabel("13-24")
                                    .setDescription("2 do 1; liczba z zakresu 13-24")
                                    .setValue("A"),
                                new StringSelectMenuOptionBuilder()
                                    .setLabel("25-36")
                                    .setDescription("2 do 1; liczba z zakresu 25-36")
                                    .setValue("B"),
                                new StringSelectMenuOptionBuilder()
                                    .setLabel("First four")
                                    .setDescription("8 do 1; liczby 0/1/2/3; tylko w grze z jednym zerem")
                                    .setValue("D"),
                                new StringSelectMenuOptionBuilder()
                                    .setLabel("Top line")
                                    .setDescription("6 do 1; liczy 00/0/1/2/3; tylko w grze z dwoma zerami")
                                    .setValue("E"),
                                new StringSelectMenuOptionBuilder()
                                    .setLabel("Wąż")
                                    .setDescription("1 do 1; liczba 1/5/9/12/14/16/19/23/27/30/32/34")
                                    .setValue("C")
                            )
                    )
            );
            await interaction.showModal(modal);
            return;
        }
        case "unbet": {
            const modal = new ModalBuilder().setCustomId("ro-m-unbet").setTitle("Wycofaj zakład");
            modal.addLabelComponents(new LabelBuilder()
                .setLabel("Podaj numer zakładu do wycofania")
                .setTextInputComponent(new TextInputBuilder()
                        .setRequired(true)
                        .setCustomId("ti-bet")
                        .setMinLength(1).setMaxLength(6)
                        .setStyle(TextInputStyle.Short)
                    )
                );
            await interaction.showModal(modal);
            return;
        }
        case "nmb": {
            game.noMoreBets();
            break;
        }
        case "enternum": {
            const modal = new ModalBuilder().setCustomId("a-ro-m-enternum").setTitle("Podaj wynik");
            modal.addLabelComponents(new LabelBuilder()
                .setLabel("Podaj wynik ruletki")
                .setTextInputComponent(new TextInputBuilder()
                        .setRequired(true)
                        .setCustomId("ti-num")
                        .setMinLength(1).setMaxLength(6)
                        .setStyle(TextInputStyle.Short)
                    )
                );
            await interaction.showModal(modal);
            return;
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
}

export const routeModalInteraction = async (id: string, interaction: ModalSubmitInteraction, gameMap: Map<string, AnyGame>) => {
    const game = gameMap.get(interaction.channelId!)! as Game;
    const index = game.players.findIndex(p => p.userId == interaction.user.id);
    if (id == "m-unbet") {
        const betIdxString = interaction.fields.getTextInputValue("ti-bet");
        const betIndex = parseInt(betIdxString);
        if (Number.isNaN(betIndex)) {
            await interaction.reply({ content: errorString("D-05"), flags: MessageFlags.Ephemeral });
            return;
        } else if (betIndex <= 0) {
            await interaction.reply({ content: errorString("D-05"), flags: MessageFlags.Ephemeral });
            return;
        }
        game.unbet(index, betIndex - 1);
    } else if (id == "m-enternum") {
        const resultString = interaction.fields.getTextInputValue("ti-num");
        let result;
        if (resultString == "00") {
            result = -1;
        } else {
            result = parseInt(resultString);
            if (Number.isNaN(result)) {
                await interaction.reply({ content: errorString("D-05"), flags: MessageFlags.Ephemeral });
                return;
            } else if (result < 0) {
                await interaction.reply({ content: errorString("D-05"), flags: MessageFlags.Ephemeral });
                return;
            }
        }
        game.enterNumber(result);
    } else if (id == "m-betout") {
        const betTypeString = interaction.fields.getStringSelectValues("s-betType")[0];
        const betString = interaction.fields.getTextInputValue("ti-bet");
        const bet = parseInt(betString);
        if (Number.isNaN(bet)) {
            await interaction.reply({ content: errorString("D-05"), flags: MessageFlags.Ephemeral });
            return;
        } else if (bet <= 0) {
            await interaction.reply({ content: errorString("D-05"), flags: MessageFlags.Ephemeral });
            return;
        }
        let betType: BetType = BetType.RED, content: number[] = [];
        switch (betTypeString) {
            case "0": betType = BetType.RED; break;
            case "1": betType = BetType.BLACK; break;
            case "2": betType = BetType.EVEN; break;
            case "3": betType = BetType.ODD; break;
            case "4": betType = BetType.MANQUE; break;
            case "5": betType = BetType.PASSE; break;
            case "6": betType = BetType.COLUMN; content = [1]; break;
            case "7": betType = BetType.COLUMN; content = [2]; break;
            case "8": betType = BetType.COLUMN; content = [3]; break;
            case "9": betType = BetType.DOZEN; content = [1]; break;
            case "A": betType = BetType.DOZEN; content = [2]; break;
            case "B": betType = BetType.DOZEN; content = [3]; break;
            case "C": betType = BetType.SNAKE; break;
            case "D": betType = BetType.FIRST_FOUR; break;
            case "E": betType = BetType.TOP_LINE; break;
        }
        game.bet(index, new Bet(betType, content, bet));
    } else if (id == "m-betin") {
        const betTypeString = interaction.fields.getStringSelectValues("s-betType")[0];
        const betString = interaction.fields.getTextInputValue("ti-bet");
        const bet = parseInt(betString);
        if (Number.isNaN(bet)) {
            await interaction.reply({ content: errorString("D-05"), flags: MessageFlags.Ephemeral });
            return;
        } else if (bet <= 0) {
            await interaction.reply({ content: errorString("D-05"), flags: MessageFlags.Ephemeral });
            return;
        }
        const numbersString = interaction.fields.getTextInputValue("ti-nums").split(",");
        let betType: BetType = BetType.RED, content: number[] = [];
        for (const element of numbersString) {
            const elementNum = parseInt(element);
            if (Number.isNaN(elementNum)) {
                await interaction.reply({ content: errorString("D-05"), flags: MessageFlags.Ephemeral });
                return;
            }
            content.push(elementNum);
        }
        switch (betTypeString) {
            case "0": betType = BetType.ONE; break;
            case "1": betType = BetType.TWO; break;
            case "2": betType = BetType.THREE; break;
            case "3": betType = BetType.FOUR; break;
            case "4": betType = BetType.SIX; break;
        }
        game.bet(index, new Bet(betType, content, bet));
    }
    await (interaction as unknown as ButtonInteraction).update({ components: renderGame(game) });
};

export const RouletteGameCommand = {
    data: new SlashCommandBuilder().setName("roulette").setDescription("Rozpocznij grę w ruletkę."),
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