import * as util from './modules/util.mjs'
import SetsComponent from './modules/sets.mjs'
import { HistoryComponent, addGameToHistory } from './modules/history.mjs';

const AppMain = {
    template: `
        <div class="card-list-container">
            <div class="card-container" v-for="(card, i) in gameCards">
                <a :href="'http://wiki.dominionstrategy.com/index.php/' + card.Name.replace(' ', '_')">
                    <div class="card-name-container">
                        <div class="card-name">{{ card.DutchName }}</div>
                        <div class="card-cost">{{ card.Cost }}</div>
                        <div class="card-types">{{ card.Types }}</div>
                    </div>
                </a>
                <div class="card-replace"><button @click="replaceCard(i)">Replace</button></div>
            </div>
        </div>
        <div class="game-actions">
            <div class="randomize-cards">
                <button @click="randomizeCards()">Randomize</button>
            </div>
            <div class="add-history">
                <button @click="addHistory()">Add cards to history</button>
            </div>
        </div>
    `,
    data() {
        return {
            engToDutch: [],
            availibleCards: [],
            gameCards: []
        }
    },
    async mounted() {
        await this.initTranslations();
        await this.initAvailibleCards();
        this.initGameCards();
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

        async initAvailibleCards() {
            // All cards
            let availibleCards = await util.getCsv('data/cards.csv', true);

            // Filter out unchecked sets
            availibleCards = this.filterToChosenSets(availibleCards);

            // Filter out non-playable types
            let ignoreTypes = ['Artifact', 'Project', 'Event', 'Way', 'Landmark', 'Curse'];
            availibleCards = availibleCards.filter(card => !ignoreTypes.includes(card.Types));

            // Translate to dutch
            availibleCards.forEach(card => {
                card.DutchName = this.toDutch(card.Name);
                card.DutchSet = this.toDutch(card.Set);
            });

            this.availibleCards = availibleCards;
        },

        initGameCards() {
            const savedCards = this.getSavedCards();

            if (savedCards && savedCards.length) {
                console.log('Using saved cards');
                this.gameCards = savedCards;
            }
            else {
                console.log('Generating random cards');
                // Draw 10 random cards
                this.randomizeFirstTenCards(this.availibleCards);
                let gameCards = this.availibleCards.slice(0, 10);
                this.availibleCards = this.availibleCards.slice(10);

                this.sortCardsByDutchName(gameCards);

                this.setSavedCards(gameCards);
                this.gameCards = gameCards;
            }
        },

        /** 
         * Randomizes the first ten cards.
         * See also: https://blog.codinghorror.com/the-danger-of-naivete/
         */
        randomizeFirstTenCards(availibleCards = []) {
            const count = 10;
            if (availibleCards.length < count) throw 'Not enough cards to shuffle ' + count;

            for (let i = 0; i < count; i++) {
                let rnd = i + Math.floor(Math.random() * (availibleCards.length - i));
                [availibleCards[rnd], availibleCards[i]] = [availibleCards[i], availibleCards[rnd]];
            }
        },

        replaceCard(gameCardIndex) {
            // Randomly select new card from availible cards
            const rnd = Math.floor(Math.random() * (this.availibleCards.length));
            const cardToAdd = this.availibleCards[rnd];
            this.availibleCards.splice(rnd, 1);

            // Replace card with new card
            const cardToRemove = this.gameCards[gameCardIndex];
            this.gameCards[gameCardIndex] = cardToAdd;
            this.availibleCards.push(cardToRemove);
        },

        getSavedCards() {
            if (localStorage.savedCardNames) {
                const savedCardNames = JSON.parse(localStorage.savedCardNames);

                const savedCards = [];
                for (let i = 0; i < savedCardNames.length; i++) {
                    const name = savedCardNames[i];
                    const card = this.availibleCards.find(card => card.Name == name);
                    if (!card) throw `Could not match card {name} in saved cards`;
                    savedCards.push(card);
                }

                return savedCards;
            }
            return [];
        },

        setSavedCards(cards) {
            const savedCardsNames = cards.map(card => card.Name);
            localStorage.savedCardNames = JSON.stringify(savedCardsNames);
        },

        randomizeCards() {
            // TODO: implement

            localStorage.removeItem('savedCardNames');
            console.log('savedCardNames deleted');
        },

        addHistory() {
            if (this.gameCards.length == 0) throw 'No cards to add to history';
            const cards = this.gameCards.map(c => c.Name);
            addGameToHistory(cards);
        },

        toDutch(name) {
            if (!(name in this.engToDutch)) console.log('No translation for: ' + name);
            return name in this.engToDutch ? this.engToDutch[name] : name;
        },

        sortCardsByDutchName(cards) {
            cards.sort(function (a, b) {
                if (a.DutchName < b.DutchName) return -1;
                if (a.DutchName > b.DutchName) return 1;
                return 0;
            })
        },

        filterToChosenSets(cards) {
            let sets = cards.map(card => card.Set);
            sets = [...new Set(sets)];

            let checkedSets = sets;
            if (localStorage.checkedSets)
                checkedSets = JSON.parse(localStorage.checkedSets);

            return cards.filter(card => checkedSets.includes(card.Set));
        }
    }
}


const routes = [
    { path: '/', component: AppMain },
    { path: '/history', component: HistoryComponent },
    { path: '/settings', component: SetsComponent },
]

const router = VueRouter.createRouter({
    history: VueRouter.createWebHashHistory(),
    routes, // short for `routes: routes`
})

const app = Vue.createApp({});
app.use(router);

app.mount('#app-main');


window.addEventListener('load', (event) => {
    util.wakeLock(5 * 60);
});