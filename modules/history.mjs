import * as util from './util.mjs'

export const HistoryComponent = {
    template: `
        <div class="clear-history">
            <button @click="clearHistory()">Clear</button>
        </div>
        <div class="games-container">
            <div class="game-container" v-for="game in games">
                <div class="card-history" v-for="card in game">
                    {{ toDutch(card) }}
                </div>
                <hr />
            </div>
        </div>
    `,
    data() {
        return {
            engToDutch: [],
            games: []
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
            let games = [];
            if (localStorage.games)
                games = JSON.parse(localStorage.games);

            this.games = games.reverse();
        },

        clearHistory() {
            if (confirm('This will clear all history. Are you sure?')) {
                localStorage.removeItem('games');
                this.games = [];
            }
        },

        toDutch(name) {
            if (!(name in this.engToDutch)) console.log('No translation for: ' + name);
            return name in this.engToDutch ? this.engToDutch[name] : name;
        },
    }
};

export function addGameToHistory(gameCards = []) {
    let games = [];
    if (localStorage.games)
        games = JSON.parse(localStorage.games);

    games.push(gameCards);

    localStorage.games = JSON.stringify(games);
}