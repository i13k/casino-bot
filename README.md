# Kasyno
Bot ten umożliwia granie w gry kasynowe na platformie Discord. Obecnie jest to blackjack, bakarat i ruletka.
## Instalacja
1. `npm install`
2. ustaw odpowiednie wartości w `src/config.ts`
3. `npx tsc`
4. `node dist/updateCommands`
5. `node dist/main`
W pliku `bank.db` tworzona jest baza stanów kont graczy. Każdy gracz zaczyna mając $1000. Jeśli bot jest instalowany na wielu serwerach, stany kont są globalne (współdzielone przez graczy między serwerami).
Aby mogły wyświetlać się obrazki kart do gry, bot musi znajdować się w serwerze, w którym pod odpowiednimi nazwami zostały przesłane emoji z folderu `img`. Następnie należy ustawić ID tych emoji w pliku `src/cards.ts`.

## Konfiguracja
Przykład pliku `config.ts`:
```ts
export default {
    DEALER_ROLE: "1442973460950286537",
    ADMIN_ROLE: "1444374453718093998",
    CLIENT_ID: "1442574467091140710",
    BOT_TOKEN: "your.bot.token_goes_here",
    AMOUNT_MAX: 1048576,
    DEALER_PRIVILEGED_COMMANDS: ["blackjack", "baccarat", "roulette"],
    ADMIN_PRIVILEGED_COMMANDS: ["addmoney", "setmoney", "clear"]
};
```