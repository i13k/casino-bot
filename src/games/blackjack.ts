import { Card, Value, Deck } from "../cards";

const TEN_CARDS = [Value.TEN, Value.JACK, Value.QUEEN, Value.KING];

export enum Stage {
    BETTING,
    DEAL,
    GAME,
    DEALER_GAME,
    CONCLUSION,
    END
};

export enum Action {
    HIT,
    STAND,
    DOUBLE_DOWN,
    SPLIT,
    SURRENDER
};

interface ValueType {
    value: number;
    isSoft: boolean;
};

class Hand {
    content: Card[] = [];
    bet: number;

    constructor(content: Card[], bet: number = 0) {
        this.content = content;
        this.bet = bet;
    }

    valueType(): ValueType {
        let value = 0;
        let aces = 0;
        let isSoft = false;
        for (const card of this.content) {
            if (card.value == Value.ACE) {
                ++aces;
            } else {
                if (card.value == Value.JACK || card.value == Value.QUEEN || card.value == Value.KING) {
                    value += 10;
                } else {
                    value += card.value;
                }
            }
        }
        for (let i = 0; i < aces; i++) {
            if (value < 11) {
                value += 11;
                isSoft = true;
            } else {
                value += 1;
            }
        }
        return { value, isSoft };
    }

    value(): number {
        return this.valueType().value;
    }
};

export class Player {
    money: number;
    userId: string = "";
    name: string;
    bet: number = 0;
    betSum: number = 0;
    hands: Hand[] = [];
    winnings: number = 0;
    surrendered: boolean = false;

    constructor(money: number, userId: string, name: string) {
        this.money = money;
        this.userId = userId;
        this.name = name;
    }
};

export class GameOptions {
    nDecks: number = 6;
    allowHitAfterSplittingAces: boolean = false;
    maxSplitHands: number = 4;
    allowSurrender: boolean = true;
    requireSameRankForSplit: boolean = false;
    removeCardsAfterSurrender: boolean = true;
    dealerStandOnSoft17: boolean = true;
    autoDealerGame: boolean = true;
    autoConclude: boolean = true;
};

export class Game {
    players: Player[] = [];
    deck: Deck;
    stage: Stage = Stage.BETTING;
    currentPlayer: number = -1;
    currentHand: number = -1;
    dealerHand: Hand = new Hand([]);
    options: GameOptions = new GameOptions();

    constructor() {
        this.deck = new Deck(this.options.nDecks);
    }

    nextPlayer() {
        this.currentHand++;
        if (this.currentHand >= this.players[this.currentPlayer].hands.length) {
            this.currentHand = 0;
            this.currentPlayer++;
            if (this.currentPlayer >= this.players.length) {
                this.stage = Stage.DEALER_GAME;
                if (this.options.autoDealerGame) this.dealerGame();
                return;
            }
        }

        if (this.players[this.currentPlayer].hands[this.currentHand].value() == 21)
            this.nextPlayer();
    }

    skip() {
        if (this.stage != Stage.GAME) throw new Error("G-09");
        this.nextPlayer();
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

    bet(index: number, bet: number) {
        if (index >= this.players.length || index < 0) throw new Error("G-03");
        if (this.stage != Stage.BETTING) throw new Error("G-04");
        if (this.players[index].money < bet) throw new Error("G-05");
        this.players[index].bet = bet;
        this.players[index].betSum = bet;
    }

    dealCards() {
        if (this.stage != Stage.BETTING) throw new Error("G-09");
        this.stage = Stage.DEAL;
        if (this.players.length == 0) {
            this.stage = Stage.CONCLUSION;
            return;
        }

        for (const player of this.players) {
            const hand = new Hand([this.deck.getCard(), this.deck.getCard()], player.bet);
            player.hands.push(hand);
        }

        this.dealerHand = new Hand([this.deck.getCard(), this.deck.getCard()]);
        if (this.dealerHand.value() == 21) {
            this.stage = Stage.CONCLUSION;
            return;
        }
        
        this.currentPlayer = 0;
        this.currentHand = 0;
        this.stage = Stage.GAME;
        if (this.players[this.currentPlayer].hands[0].value() == 21) this.nextPlayer();
    }

    action(index: number, action: Action) {
        if (index >= this.players.length || index < 0) throw new Error("G-03");
        if (this.stage != Stage.GAME) throw new Error("G-06");
        if (this.currentPlayer != index) throw new Error("G-07");
        const player = this.players[index];
        const hand = player.hands[this.currentHand];
        switch (action) {
            case Action.HIT: {
                if (!this.options.allowHitAfterSplittingAces && player.hands.length > 1 && hand.content[0].value == Value.ACE) {
                    this.nextPlayer();
                    break;
                }
                hand.content.push(this.deck.getCard());
                if (hand.value() >= 21) this.nextPlayer();
                break;
            }
            case Action.STAND: {
                this.nextPlayer();
                break;
            }
            case Action.SURRENDER: {
                if (!this.options.allowSurrender) throw new Error("G-15");
                if (player.hands.length > 1) throw new Error("G-11");
                player.surrendered = true;
                if (this.options.removeCardsAfterSurrender) player.hands = [];
                this.nextPlayer();
                break;
            }
            case Action.DOUBLE_DOWN: {
                if (player.money < player.betSum + hand.bet) throw new Error("G-05");
                if (hand.content.length != 2) throw new Error("G-12");
                player.betSum += hand.bet;
                hand.bet *= 2;
                const currHand = this.currentHand;
                this.action(index, Action.HIT);
                if (this.currentPlayer == index && this.currentHand == currHand && this.stage == Stage.GAME) this.nextPlayer();
                break;
            }
            case Action.SPLIT: {
                if (hand.content.length != 2) throw new Error("G-10");
                if (this.options.requireSameRankForSplit) { 
                    if (hand.content[0].value != hand.content[1].value) throw new Error("G-10");
                } else {
                    if (hand.content[0].value != hand.content[1].value &&
                        (!TEN_CARDS.includes(hand.content[0].value) || !TEN_CARDS.includes(hand.content[1].value))) throw new Error("G-10");
                }
                if (player.money < player.betSum + player.bet) throw new Error("G-05");
                if (player.hands.length == this.options.maxSplitHands) throw new Error("G-13");
                player.hands.push(new Hand([hand.content.pop()!, this.deck.getCard()], player.bet));
                player.betSum += player.bet;
                hand.content.push(this.deck.getCard());
                break;
            }
        }
    }

    dealerGame() {
        if (this.stage != Stage.DEALER_GAME) throw new Error("G-08");
        let value = this.dealerHand.valueType();
        while (value.value < 17 || (!this.options.dealerStandOnSoft17 && value.value == 17 && value.isSoft)) {
            this.dealerHand.content.push(this.deck.getCard());
            value = this.dealerHand.valueType();
        }
        this.stage = Stage.CONCLUSION;
        if (this.options.autoConclude) this.conclude();
    }

    conclude() {
        if (this.stage != Stage.CONCLUSION) throw new Error("G-09");
        this.stage = Stage.END;
        const dealerValue = this.dealerHand.value();
        for (const player of this.players) {
            if (player.surrendered) {
                player.winnings = -Math.floor(player.bet / 2);
            } else {
                player.winnings = 0;
                const hasSplit = player.hands.length > 1;
                for (const hand of player.hands) {
                    const value = hand.value();
                    if (value > 21 || (value < dealerValue && dealerValue <= 21)) {
                        player.winnings -= hand.bet;
                    } else if (value > dealerValue || dealerValue > 21 || (value == 21 && dealerValue == 21 && hand.content.length == 2 && this.dealerHand.content.length > 2)) {
                        player.winnings += hand.bet;
                        if (hand.content.length == 2 && value == 21 && !hasSplit) player.winnings += Math.floor(hand.bet / 2);
                    }
                }
            }
            player.money += player.winnings;
            player.bet = 0;
            player.betSum = 0;
            player.surrendered = false;
        }
    }

    reset() {
        this.dealerHand.content = [];
        this.currentPlayer = -1;
        this.stage = Stage.BETTING;
        for (const player of this.players) {
            player.hands = [];
            player.bet = 0;
            player.betSum = 0;
            player.winnings = 0;
            player.surrendered = false;
        }
    }
};