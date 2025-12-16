import { BurstHandlerMajorIdKey } from "discord.js";

// 0 is 0, -1 is 00
const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
const BLACK_NUMBERS = [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35];
const FIRST_COLUMN = [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34];
const SECOND_COLUMN = [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35];
const THIRD_COLUMN = [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36];


export const isRed = (n: number) => RED_NUMBERS.includes(n);
export const isBlack = (n: number) => BLACK_NUMBERS.includes(n);

export enum BetType {
    ONE, TWO, THREE, FOUR, SIX,
    FIRST_FOUR, TOP_LINE,
    MANQUE, PASSE, RED, BLACK, EVEN, ODD,
    DOZEN, COLUMN, SNAKE
};

export class Bet {
    type: BetType = BetType.ONE;
    amount: number = 0;
    content: number[] = [];
    constructor(type: BetType, content: number[], amount: number) {
        this.type = type;
        this.content = content;
        this.amount = amount;
    }
    winnings(n: number) {
        switch (this.type) {
            case BetType.ONE: {
                if (this.content[0] == n) return this.amount * 35;
                break;
            }
            case BetType.TWO: {
                if (this.content.includes(n)) return this.amount * 17;
                break;
            }
            case BetType.THREE: {
                if (this.content.includes(n)) return this.amount * 11;
                break;
            }
            case BetType.FOUR: {
                if (this.content.includes(n)) return this.amount * 8;
                break;
            }
            case BetType.TOP_LINE: { // double 0 only
                if ([-1, 0, 1, 2, 3].includes(n)) return 6 * this.amount;
                break;
            }
            case BetType.FIRST_FOUR: { // single 0 only
                if ([0, 1, 2, 3].includes(n)) return 8 * this.amount;
                break;
            }
            case BetType.SIX: {
                if (this.content.includes(n)) return this.amount * 5;
                break;
            }
            case BetType.DOZEN: {
                if (this.content[0] == 1 && n >= 1 && n <= 12) return this.amount * 2;
                else if (this.content[0] == 2 && n >= 13 && n <= 24) return this.amount * 2;
                else if (this.content[0] == 3 && n >= 25 && n <= 36) return this.amount * 2;
                break;
            }
            case BetType.COLUMN: {
                if (this.content[0] == 1 && FIRST_COLUMN.includes(n)) return this.amount * 2;
                else if (this.content[0] == 2 && SECOND_COLUMN.includes(n)) return this.amount * 2;
                else if (this.content[0] == 3 && THIRD_COLUMN.includes(n)) return this.amount * 2;
                break;
            }
            case BetType.EVEN: {
                if (n % 2 == 0 && n != 0 && n != -1) return this.amount;
                break;
            }
            case BetType.ODD: {
                if (n % 2 == 1 && n != 0 && n != -1) return this.amount;
                break;
            }
            case BetType.RED: {
                if (isRed(n)) return this.amount;
                break;
            }
            case BetType.BLACK: {
                if (isBlack(n)) return this.amount;
                break;
            }
            case BetType.MANQUE: {
                if (n >= 1 && n <= 18) return this.amount;
                break;
            }
            case BetType.PASSE: {
                if (n >= 19 && n <= 36) return this.amount;
                break;
            }
            case BetType.SNAKE: {
                if ([1, 5, 9, 12, 14, 16, 19, 23, 27, 30, 32, 34].includes(n)) return this.amount;
                break;
            }
        }
        return -this.amount;
    }
};

export class Player {
    userId: string = "";
    money: number = 0;
    name: string;
    bets: Bet[] = [];
    betSum: number = 0;

    constructor(money: number, userId: string, name: string) {
        this.userId = userId;
        this.money = money;
        this.name = name;
    }
};

export enum Stage {
    BETTING, SPIN, CONCLUSION, END
};

export enum LayoutType {
    SINGLE_ZERO, DOUBLE_ZERO
};

export class Game {
    players: Player[] = [];
    stage: Stage = Stage.BETTING;
    layout: LayoutType = LayoutType.DOUBLE_ZERO;
    result: number = -2;

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

    bet(index: number, bet: Bet) {
        if (this.stage != Stage.BETTING) throw new Error("G-01");
        if (index < 0 || index >= this.players.length) throw new Error("G-03");
        if (this.players[index].money < this.players[index].betSum + bet.amount) throw new Error("G-05");
        if (bet.amount <= 0) throw new Error("D-05");
        for (const num of bet.content) {
            if (num < 0 || num > 36) throw new Error("G-14");
        }
        switch (bet.type) {
            case BetType.ONE: {
                if (bet.content.length != 1) throw new Error("G-14");
                break;
            }
            case BetType.TWO: {
                if (bet.content.length != 2) throw new Error("G-14");
                const num1 = bet.content[0];
                const num2 = bet.content[1];
                if (FIRST_COLUMN.includes(num1)) {
                    if (num2 != num1 - 3 && num2 != num1 + 1 && num2 != num1 + 3) throw new Error("G-14");
                } else if (SECOND_COLUMN.includes(num1)) {
                    if (num2 != num1 - 3 && num2 != num1 + 1 && num2 != num1 - 1 && num2 != num1 + 3) throw new Error("G-14");
                } else if (THIRD_COLUMN.includes(num1)) {
                    if (num2 != num1 - 3 && num2 != num1 - 1 && num2 != num1 + 3) throw new Error("G-14");
                } else if (num1 == 0) {
                    if (this.layout == LayoutType.SINGLE_ZERO) {
                        if (![1, 2, 3].includes(num2)) throw new Error("G-14");
                    } else if (this.layout == LayoutType.DOUBLE_ZERO) {
                        if (![-1, 1, 2].includes(num2)) throw new Error("G-14");
                    }
                } else if (num1 == -1) {
                    if (this.layout == LayoutType.SINGLE_ZERO) throw new Error("G-14");
                    if (![0, 2, 3].includes(num2)) throw new Error("G-14");
                }
                break;
            }
            case BetType.THREE: {
                if (bet.content.length != 3) throw new Error("G-14");
                if (bet.content[0] == 0 || bet.content[0] == -1) {
                    if (this.layout == LayoutType.SINGLE_ZERO) {
                        if (bet.content.includes(-1)) throw new Error("G-14");
                        if (![[0, 1, 2], [0, 2, 3]].includes(bet.content)) throw new Error("G-14");
                    } else if (this.layout == LayoutType.DOUBLE_ZERO) {
                        if (![[0, -1, 2], [0, 1, 2], [-1, 2, 3]].includes(bet.content)) throw new Error("G-14");
                    }
                } else {
                    if (!FIRST_COLUMN.includes(bet.content[0])) throw new Error("G-14");
                    if (bet.content[1] != bet.content[0] + 1) throw new Error("G-14");
                    if (bet.content[2] != bet.content[1] + 1) throw new Error("G-14");
                }
                break;
            }
            case BetType.FOUR: {
                if (bet.content.length != 4) throw new Error("G-14");
                if (bet.content[1] != bet.content[0] + 1) throw new Error("G-14");
                if (bet.content[2] != bet.content[0] + 3) throw new Error("G-14");
                if (bet.content[3] != bet.content[0] + 4) throw new Error("G-14");
                if (THIRD_COLUMN.includes(bet.content[0]) || [-1, 0].includes(bet.content[0])) throw new Error("G-14");
                break;
            }
            case BetType.FIRST_FOUR: {
                if (this.layout != LayoutType.SINGLE_ZERO) throw new Error("G-14");
                if (bet.content.length != 0) throw new Error("G-14");
                break;
            }
            case BetType.TOP_LINE: {
                if (this.layout != LayoutType.DOUBLE_ZERO) throw new Error("G-14");
                if (bet.content.length != 0) throw new Error("G-14");
                break;
            }
            case BetType.SIX: {
                if (bet.content.length != 6) throw new Error("G-14");
                if (!FIRST_COLUMN.includes(bet.content[0])) throw new Error("G-14");
                if (bet.content[1] != bet.content[0] + 1) throw new Error("G-14");
                if (bet.content[2] != bet.content[1] + 1) throw new Error("G-14");
                if (bet.content[3] != bet.content[2] + 1) throw new Error("G-14");
                if (bet.content[4] != bet.content[3] + 1) throw new Error("G-14");
                if (bet.content[5] != bet.content[4] + 1) throw new Error("G-14");
                break;
            }
            case BetType.DOZEN: {
                if (bet.content.length != 1) throw new Error("G-14");
                if (![1, 2, 3].includes(bet.content[0])) throw new Error("G-14");
                break;
            }
            case BetType.COLUMN: {
                if (bet.content.length != 1) throw new Error("G-14");
                if (![1, 2, 3].includes(bet.content[0])) throw new Error("G-14");
                break;
            }
        }

        this.players[index].betSum += bet.amount;
        this.players[index].bets.push(bet);
    }

    unbet(index: number, betIndex: number) {
        if (this.stage != Stage.BETTING) throw new Error("G-01");
        if (index < 0 || index >= this.players.length) throw new Error("G-03");
        if (betIndex < 0 || betIndex > this.players[index].bets.length) throw new Error("D-05");
        this.players[index].betSum -= this.players[index].bets[betIndex].amount;
        this.players[index].bets.splice(betIndex, 1);
    }

    noMoreBets() {
        if (this.stage != Stage.BETTING) throw new Error("G-01");
        this.stage = Stage.SPIN;
    }

    enterNumber(n: number) {
        if (this.stage != Stage.SPIN) throw new Error("G-09");
        this.result = n;
        this.stage = Stage.CONCLUSION;
    }

    conclude() {
        if (this.stage != Stage.CONCLUSION) throw new Error("G-09");
        for (const player of this.players) {
            for (const bet of player.bets) {
                player.money += bet.winnings(this.result);
            }
            player.betSum = 0;
            player.bets = [];
        }
        this.stage = Stage.END;
    }

    reset() {
        for (const player of this.players) {
            player.betSum = 0;
            player.bets = [];
        }
        this.stage = Stage.BETTING;
        this.result = -2;
    }
};