import { DatabaseSync } from "node:sqlite";
const DB_FILE_NAME = "bank.db";
const DEFAULT_MONEY = 1000;

const DB_PATH = __dirname + "/../" + DB_FILE_NAME;

interface CommonPlayer {
    money: number;
    userId: string;
};

export const getBalance = (userId: string): number => {
    const database = new DatabaseSync(DB_PATH);
    const query = database.prepare("SELECT money FROM balance WHERE userId = ?;");
    const result = query.get(userId);
    if (!result) {
        const query2 = database.prepare("INSERT INTO balance(userId, money) VALUES(?, ?);");
        query2.run(userId, DEFAULT_MONEY);
        database.close();
        return DEFAULT_MONEY;
    }
    database.close();
    return result["money"] as number;
};

export const transfer = (source: string, destination: string, amount: number, description?: string | null): boolean => {
    const database = new DatabaseSync(DB_PATH)
    const query = database.prepare("SELECT money FROM balance WHERE userId = ?;");
    const query2 = database.prepare("INSERT INTO balance(userId, money) VALUES(?, ?);");
    let result = query.get(source);
    let money1: number, money2: number;
    if (!result) {
        query2.run(source, DEFAULT_MONEY);
        money1 = 1000;
    } else money1 = result["money"] as number;
    let result2 = query.get(destination);
    if (!result2) {
        query2.run(destination, DEFAULT_MONEY);
        money2 = 1000;
    } else money2 = result2["money"] as number;
    if (money1 < amount) { database.close(); return false; }
    const query3 = database.prepare("UPDATE balance SET money = money - ? WHERE userId = ?;");
    query3.run(amount, source);
    const query4 = database.prepare("UPDATE balance SET money = money + ? WHERE userId = ?;");
    query4.run(amount, destination);
    const query5 = database.prepare("INSERT INTO transfer_log(fromUser, toUser, amount, description, timestamp) VALUES(?, ?, ?, ?, unixepoch());");
    query5.run(source, destination, amount, description || null);
    database.close();
    return true;
};

export type TransferLog = {
    fromUser: string;
    toUser: string;
    amount: number;
    description: string | null;
    timestamp: number;
}[];

export const transferLog = (howMany: number): TransferLog => {
    const database = new DatabaseSync(DB_PATH);
    const query = database.prepare("SELECT fromUser, toUser, amount, description, timestamp FROM transfer_log ORDER BY timestamp DESC LIMIT ?;");
    const result = query.all(howMany) as TransferLog;
    database.close();
    return result;
}; 

export const transferLogForUser = (howMany: number, userId: string): TransferLog => {
    const database = new DatabaseSync(DB_PATH);
    const query = database.prepare("SELECT fromUser, toUser, amount, description, timestamp FROM transfer_log WHERE fromUser = ? OR toUser = ? ORDER BY timestamp DESC LIMIT ?;");
    const result = query.all(userId, userId, howMany) as TransferLog;
    database.close();
    return result;
}; 

export const setBalance = (userId: string, balance: number): void => {
    const database = new DatabaseSync(DB_PATH);
    const query = database.prepare("UPDATE balance SET money = ? WHERE userId = ?;");
    query.run(balance, userId);
    database.close();
};

export const addBalance = (userId: string, balance: number): void => {
    const database = new DatabaseSync(DB_PATH);
    const query = database.prepare("UPDATE balance SET money = money + ? WHERE userId = ?;");
    query.run(balance, userId);
    database.close();
};

export const setBalances = (players: CommonPlayer[]): void => {
    const database = new DatabaseSync(DB_PATH);
    const query = database.prepare("UPDATE balance SET money = ? WHERE userId = ?;");
    for (const player of players) {
        query.run(player.money, player.userId);
    }
    database.close();
};

interface RankingData {
    userId: string;
    money: number;
};

export const getRanking = (): RankingData[] => {
    const database = new DatabaseSync(DB_PATH);
    const query = database.prepare("SELECT userId, money FROM balance WHERE money != 1000 ORDER BY money DESC LIMIT 10;");
    const result = query.all() as unknown as RankingData[];
    database.close();
    return result;
};

export const payout = (): void => {
    const database = new DatabaseSync(DB_PATH);
    database.exec("UPDATE balance SET money = money + 250;");
    database.close();
};