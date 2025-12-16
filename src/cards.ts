export enum Suit {
    CLUBS = 0,
    DIAMONDS = 1,
    HEARTS = 2,
    SPADES = 3
};

export enum Value {
    ACE = 1, TWO = 2, THREE = 3, FOUR = 4, FIVE = 5, SIX = 6, SEVEN = 7,
    EIGHT = 8, NINE = 9, TEN = 10, JACK = 11, QUEEN = 12, KING = 13
};

export const FACE_UNKNOWN = "<:bjFaceUnknown:1442897972080939170>";
export const SUIT_UNKNOWN = "<:bjSuitUnknown:1443250819397980200>";

export class Card {
    value: Value;
    suit: Suit;

    constructor(value: Value, suit: Suit) {
        this.value = value;
        this.suit = suit;
    }

    serialize(): string {
        // bjSuitHearts, Spades, Clubs, Diamonds // TODO: make bjSuitUnknown
        // bjFaceA, 2, ..., 10, K, Q, J [R/B], Unknown
        let result = "[";
        switch (this.suit) {
            case Suit.CLUBS: result += "C"; break;
            case Suit.DIAMONDS: result += "D"; break;
            case Suit.HEARTS: result += "H"; break;
            case Suit.SPADES: result += "S"; break;
        }
        switch (this.value) {
            case Value.ACE: result += "A"; break;
            case Value.TWO: result += "2"; break;
            case Value.THREE: result += "3"; break;
            case Value.FOUR: result += "4"; break;
            case Value.FIVE: result += "5"; break;
            case Value.SIX: result += "6"; break;
            case Value.SEVEN: result += "7"; break;
            case Value.EIGHT: result += "8"; break;
            case Value.NINE: result += "9"; break;
            case Value.TEN: result += "10"; break;
            case Value.JACK: result += "J"; break;
            case Value.QUEEN: result += "Q"; break;
            case Value.KING: result += "K"; break;
        }
        result += "]";
        return result;
    }

    serializeAsEmoji(): string {
        let result = "";
        const red = this.suit == Suit.DIAMONDS || this.suit == Suit.HEARTS;
        switch (this.suit) {
            case Suit.CLUBS: result += "<:bjSuitClubs:1442898076669968384>"; break;
            case Suit.DIAMONDS: result += "<:bjSuitDiamonds:1442897975658418267>"; break;
            case Suit.HEARTS: result += "<:bjSuitHearts:1442898078960189582>"; break;
            case Suit.SPADES: result += "<:bjSuitSpades:1442897980607959206>"; break;
        }
        switch (this.value) {
            case Value.ACE: result += red ? "<:bjFaceAR:1442897952053133433>" : "<:bjFaceAB:1442898073390157875>"; break;
            case Value.TWO: result += red ? "<:bjFace2R:1442897914019188887>" : "<:bjFace2B:1442897912496652418>"; break;
            case Value.THREE: result += red ? "<:bjFace3R:1442897919291293726>" : "<:bjFace3B:1442897916200095885>"; break;
            case Value.FOUR: result += red ? "<:bjFace4R:1442897922495877211>": "<:bjFace4B:1442897920931401798>"; break;
            case Value.FIVE: result += red ? "<:bjFace5R:1442897927059017861>" : "<:bjFace5B:1442897924194439339>"; break;
            case Value.SIX: result += red ? "<:bjFace6R:1442897931186213027>" : "<:bjFace6B:1442897929776926740>"; break;
            case Value.SEVEN: result += red ? "<:bjFace7R:1442897935208677428>" : "<:bjFace7B:1442897932947820544>"; break;
            case Value.EIGHT: result += red ? "<:bjFace8R:1442897938777899018>" : "<:bjFace8B:1442898070823108760>"; break;
            case Value.NINE: result += red ? "<:bjFace9R:1442897944096538837>" : "<:bjFace9B:1442897941848260790>"; break;
            case Value.TEN: result += red ? "<:bjFace10R:1442897948336848949>" : "<:bjFace10B:1442898071695396999>"; break;
            case Value.JACK: result += red ? "<:bjFaceJR:1442897956561752155>" : "<:bjFaceJB:1442898075017281648>"; break;
            case Value.QUEEN: result += red ? "<:bjFaceQR:1442897970575048907>" : "<:bjFaceQB:1442897968662581459>"; break;
            case Value.KING: result += red ? "<:bjFaceKR:1442897966590333259>" : "<:bjFaceKB:1442897958243930143>"; break;
        }
        return result;
    }
};

const randomNumber = (m: number) => Math.floor(Math.random() * m);

export const shuffle = (deck: Card[]): Card[] => {
    let array = deck.slice(0);
    let currentIndex = array.length;
    let temp: Card, randomIndex: number;
    while (currentIndex != 0) {
        randomIndex = randomNumber(currentIndex);
        currentIndex--;
        temp = array[currentIndex] ;
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temp;
    }
    return array;
};

const makeDeck = (): Card[] => {
    let deck = [];
    for (let i = 0; i <= 3; i++) {
        for (let j = 1; j <= 13; j++) {
            deck.push(new Card(j, i));
        }
    }
    return deck;
};

export const makeDecks = (n: number): Card[] => {
    let decks: Card[] = [];
    for (let i = 0; i < n; i++) {
        decks = makeDeck().concat(decks);
    }
    return decks;
};

export class Deck {
    deck: Card[] = [];
    nDecks: number = 0;

    constructor(nDecks: number) {
        this.nDecks = nDecks;
        this.deck = shuffle(makeDecks(nDecks));
    }

    getCard(): Card {
        const c = this.deck.pop();
        if (c) return c;

        this.deck = shuffle(makeDecks(this.nDecks));
        const c2 = this.deck.pop();
        if (c2) return c2;

        return new Card(1, 0); // this should never happen!
    }
};
