import { Card, Value, Deck } from "../cards";

export enum BetType {
    PLAYER,
    BANKER,
    TIE
};

export enum Stage {
    BETTING,
    DEAL,
    CONCLUSION,
    END
};

export class Player {
    money: number;
    userId: string = "";
    name: string;
    bet: number = 0;
    betType: BetType = BetType.PLAYER;
    winnings: number = 0;

    constructor(money: number, userId: string, name: string) {
        this.money = money;
        this.userId = userId;
        this.name = name;
    }
};

export const handValue = (hand: Card[]): number => {
    let value = 0;
    for (const card of hand) {
        if (card.value != Value.JACK && card.value != Value.QUEEN && card.value != Value.KING)
            value += card.value;
    }
    return value % 10;
};

export class Game {
    players: Player[] = [];
    deck: Deck;
    currentPlayer: number = 0;
    nDecks: number = 6;
    playerHand: Card[] = [];
    bankerHand: Card[] = [];
    stage: Stage = Stage.BETTING;
    tieWinRatio: number = 8;
    bankerWinRatio: number = 0.95;
    playerWinRatio: number = 1;
    
    constructor() {
        this.deck = new Deck(this.nDecks);
    }

    addPlayer(player: Player) {
        if (this.stage != Stage.BETTING) throw new Error("G-01");
        const index = this.players.findIndex(p => p.userId == player.userId);
        if (index != -1) throw new Error("G-02");
        this.players.push(player);
    }

    removePlayer(userId: string) {
        if (this.stage != Stage.BETTING) throw new Error("G-01");
        const oldPlayerLength = this.players.length;
        this.players = this.players.filter(p => p.userId != userId);
        if (this.players.length == oldPlayerLength) throw new Error("G-16");
    }

    bet(index: number, bet: number, betTypeString: string) {
        if (index >= this.players.length || index < 0) throw new Error("G-03");
        if (this.stage != Stage.BETTING) throw new Error("G-04");
        if (this.players[index].money < bet) throw new Error("G-05");
        this.players[index].bet = bet;
        switch (betTypeString) {
            case "P": this.players[index].betType = BetType.PLAYER; break;
            case "B": this.players[index].betType = BetType.BANKER; break;
            case "T": this.players[index].betType = BetType.TIE; break;
        }
    }

    dealCards() {
        if (this.stage != Stage.BETTING) throw new Error("G-09");
        this.stage = Stage.DEAL;
        if (this.players.length == 0) {
            this.stage = Stage.CONCLUSION;
            return;
        }
        this.playerHand = [this.deck.getCard(), this.deck.getCard()];
        this.bankerHand = [this.deck.getCard(), this.deck.getCard()];
        const playerValue = handValue(this.playerHand);
        const bankerValue = handValue(this.bankerHand);

        if (playerValue > 7 || bankerValue > 7) {
            this.stage = Stage.CONCLUSION;
            return;
        }

        if (playerValue > 5) {
            if (bankerValue < 6) {
                this.bankerHand.push(this.deck.getCard());
            }
        } else {
            const playerCard = this.deck.getCard();
            this.playerHand.push(playerCard);
            if (bankerValue < 3) {
                this.bankerHand.push(this.deck.getCard());
            } else if (bankerValue == 3 && playerCard.value != Value.EIGHT) {
                this.bankerHand.push(this.deck.getCard());
            } else if (bankerValue == 4 && [Value.TWO, Value.THREE, Value.FOUR, Value.FIVE, Value.SIX, Value.SEVEN].includes(playerCard.value)) {
                this.bankerHand.push(this.deck.getCard());
            } else if (bankerValue == 5 && [Value.FOUR, Value.FIVE, Value.SIX, Value.SEVEN].includes(playerCard.value)) {
                this.bankerHand.push(this.deck.getCard());
            } else if (bankerValue == 6 && (playerCard.value == Value.SIX || playerCard.value == Value.SEVEN)) {
                this.bankerHand.push(this.deck.getCard());
            } else if (bankerValue == 7) {
                this.bankerHand.push(this.deck.getCard());
            }
        }
        this.stage = Stage.CONCLUSION;
    }

    conclude() {
        if (this.stage != Stage.CONCLUSION) throw new Error("G-09");
        const playerValue = handValue(this.playerHand);
        const bankerValue = handValue(this.bankerHand);
        for (const player of this.players) {
            if (playerValue > bankerValue) {
                if (player.betType == BetType.PLAYER) player.winnings = Math.floor(player.bet * this.playerWinRatio);
                else player.winnings = -player.bet;
            } else if (playerValue == bankerValue) {
                if (player.betType == BetType.TIE) player.winnings = Math.floor(player.bet * this.tieWinRatio);
                else player.winnings = -player.bet;
            } else {
                if (player.betType == BetType.BANKER) player.winnings = Math.floor(player.bet * this.bankerWinRatio);
                else player.winnings = -player.bet;
            }
            player.money += player.winnings;
            player.bet = 0;
        }
        this.stage = Stage.END;
    }

    reset() {
        this.playerHand = [];
        this.bankerHand = [];
        this.stage = Stage.BETTING;
        this.currentPlayer = 0;
        for (const player of this.players) {
            player.winnings = 0;
            player.bet = 0;
        }
    }
};
