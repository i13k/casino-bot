interface StringTranslationObject { [key: string]: string; };

const STRINGS_EN: StringTranslationObject = {
    "G-01": "This game is in progress.",
    "G-02": "You are already seated at this game.",
    "G-03": "You are not seated at this game.",
    "G-04": "Betting is not possible at this time.",
    "G-05": "You do not have enough money.",
    "G-06": "You cannot play at this time.",
    "G-07": "It is not your turn to play.",
    "G-08": "The dealer's turn has not yet started.",
    "G-09": "This action cannot be performed at this time."
};

const STRINGS_PL: StringTranslationObject = {
    "D-01": "Brak uprawnień.",
    "D-02": "Gra w tym kanale już istnieje.",
    "D-03": "Ten gracz aktualnie znajduje się w grze.",
    "D-04": "Nie ma gry w tym kanale.",
    "D-05": "Nieprawidłowa wartość.",
    "D-06": "Masz za mało pieniędzy.",
    "D-07": "Aby móc przelać pieniądze, żaden z graczy uczestniczących w transakcji nie może być w grze.",
    "D-08": "Już siedziesz przy innej grze.",

    "G-01": "Gra jest w toku.",
    "G-02": "Już siedzisz przy tym stole.",
    "G-03": "Nie siedzisz przy tym stole.",
    "G-04": "Nie można teraz stawiać pieniędzy.",
    "G-05": "Masz zbyt mało pieniędzy.",
    "G-06": "Nie można teraz grać.",
    "G-07": "Obecnie nie jest twoja kolej.",
    "G-08": "Kolej krupiera jeszcze się nie rozpoczęła.",
    "G-09": "Nie można obecnie wykonać tej czynności.",
    "G-10": "Nie możesz rozdzielić ręki.",
    "G-11": "Rozdzieliłeś już swoją rękę.",
    "G-12": "Aby wykonać akcję double down, Twoja ręka musi mieć 2 karty.",
    "G-13": "Możesz mieć maksymalnie cztery ręce.",
    "G-14": "Nieprawidłowe dane zakładu.",
    "G-15": "Ta czynność jest niedozwolona.",
    "G-16": "Nie siedzisz w tej grze.",

    "driver.balance": "Stan konta",
    "driver.cleared": "Wszystkie stany konta zostały wyczyszczone.",
    "driver.paidout": "Wypłacono każdemu $250.",

    "ui.title": "## Blackjack",
    "ui.adminTitle": "## Zarządzanie grą",
    "ui.players": "Gracze:",
    "ui.moneyInPlay": "w grze",
    "ui.dealerHand": "Krupier:",
    "ui.cardsInDeck": "Liczba kart w talii:",
    "ui.gamePhase": "Faza gry:",
    "ui.surrendered": "*surrender*",
    "ui.betModalTitle": "Wejdź do gry",
    "ui.betModalLabel": "Kwota ($)",
    "ui.dealerHasNoCards": "Krupier nie ma obecnie kart.",
    "ui.button.hit": "HIT",
    "ui.button.stand": "STAND",
    "ui.button.doubleDown": "DOUBLE DOWN",
    "ui.button.split": "SPLIT",
    "ui.button.surrender": "SURRENDER",
    "ui.button.sit": "Usiądź",
    "ui.button.unsit": "Wstań",
    "ui.button.bet": "Postaw",
    "ui.button.admin.bet": "rozpocznij grę",
    "ui.button.admin.deal": "rozdaj karty",
    "ui.button.admin.dealerGame": "rozgrywka krupiera",
    "ui.button.admin.conclude": "Podsumuj",
    "ui.button.admin.end": "ZAKOŃCZ",
    "ui.button.admin.reset": "RESET",
    "ui.button.admin.skip": "Przeskocz",
    "ui.baccarat.bet.banker": "Bankiera",
    "ui.baccarat.bet.banker.description": "Postaw na bankiera.",
    "ui.baccarat.bet.player": "Gracza",
    "ui.baccarat.bet.player.description": "Postaw na gracza.",
    "ui.baccarat.bet.tie": "Remis",
    "ui.baccarat.bet.tie.description": "Postaw na remis (gracz i bankier mają tyle samo punktów).",
};

const errorMessage = (key: string): string => {
    return `(${key}) ${STRINGS_PL[key]}`;
};

export const getString = (key: string): string => {
    return STRINGS_PL[key];
};

export const errorString = (key: string): string => {
    return `:x: ${errorMessage(key)}`;
};