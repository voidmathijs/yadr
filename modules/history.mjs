import * as util from './util.mjs'

export const HistoryComponent = {
    template: `
        <div class="clear-history">
            <button @click="clearHistory()">Clear</button>
        </div>
        <div class="games-container">
            <div class="game-container" v-for="game in historyCards">
                <div class="card-history" v-for="cardName in game">
                    <a :href="'http://wiki.dominionstrategy.com/index.php/' + cardName.replace(' ', '_')">
                            <div class="card-name">{{ toDutch(cardName) }}</div>
                    </a>
                </div>
                <hr />
            </div>
        </div>
    `,
    data() {
        return {
            engToDutch: [],
            historyCards: []
        }
    },
    async mounted() {
        await this.initTranslations();
        this.initHistory();
    },
    methods: {
        async initTranslations() {
            let engToDutchArray = await util.getCsv('data/translations_dutch.csv', false);

            // Convert to dict
            let engToDutch = {};
            engToDutchArray.forEach((el, i) => engToDutch[el[0]] = el[1]);

            // Don't want these...
            delete engToDutch[undefined];
            delete engToDutch[''];

            this.engToDutch = engToDutch;
        },

        initHistory() {
            const historyCards = getHistoryCards();

            this.historyCards = historyCards.reverse();
        },

        clearHistory() {
            if (confirm('This will clear all history. Are you sure?')) {
                localStorage.removeItem('historyCards');
                this.historyCards = [];
            }
        },

        toDutch(name) {
            if (!(name in this.engToDutch)) console.log('No translation for: ' + name);
            return name in this.engToDutch ? this.engToDutch[name] : name;
        },
    }
};

export function addGameToHistory(cardNames = []) {
    let historyCards = [];
    if (localStorage.historyCards)
        historyCards = JSON.parse(localStorage.historyCards);

    historyCards.push(cardNames);

    localStorage.historyCards = JSON.stringify(historyCards);
}

export function getHistoryCards() {
    let historyCards = [];
    if (localStorage.historyCards)
        historyCards = JSON.parse(localStorage.historyCards);

    return historyCards;
}