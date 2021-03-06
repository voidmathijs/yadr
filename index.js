import * as util from './modules/util.mjs';
import SetsComponent from './modules/sets.mjs';
import { HistoryComponent, addGameToHistory, getHistoryCards } from './modules/history.mjs';
import { getSavedCards, setSavedCards, clearSavedCards } from './modules/savedCards.mjs';
import * as cardUtil from './modules/cardUtil.mjs';

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
                <div class="card-replace"><button @click="onClickReplaceCard(i)">Replace</button></div>
            </div>
        </div>
        <div class="game-actions">
            <div class="randomize-cards">
                <button @click="onClickRandomizeCards()">Randomize</button>
            </div>
            <div class="add-history">
                <button @click="onClickAddHistory()">Add cards to history</button>
            </div>
            <div class="order-cards">
                <button @click="onClickOrderCards()">⇵</button>
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
        if ('addhistory' in this.$route.query) {
            const cards = this.$route.query['addhistory'].split(',');
            this.incomingUrlAddToHistory(cards);
        }

        await this.initTranslations();
        await this.initAvailibleCards();
        this.initGameCards();
    },
    methods: {
        incomingUrlAddToHistory(cardNames) {
            if (confirm('Add the cards specified in the url to the history?')) {
                addGameToHistory(cardNames);
            }
        },

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

            // Filter out all non pickables like Copper / Projects / Prizes etc.
            availibleCards = cardUtil.filterOutNonpickableCards(availibleCards);

            // Filter out history cards
            const historyCards = getHistoryCards().flat();
            availibleCards = availibleCards.filter(card => !historyCards.includes(card.Name));

            console.log('availibleCards: ' + availibleCards.length);

            // Translate to dutch
            availibleCards.forEach(card => {
                card.DutchName = this.toDutch(card.Name);
                card.DutchSet = this.toDutch(card.Set);
            });

            this.availibleCards = availibleCards;
        },

        filterToChosenSets(cards) {
            let sets = cards.map(card => card.Set);
            sets = [...new Set(sets)];

            let checkedSets = sets;
            if (localStorage.checkedSets)
                checkedSets = JSON.parse(localStorage.checkedSets);

            return cards.filter(card => checkedSets.includes(card.Set));
        },

        initGameCards() {
            let cards = [];
            // Try getting saved cards, ignore if fails
            try {
                cards = getSavedCards(this.availibleCards);
            }
            catch (error) {
                console.error(error);
            }

            // If needed, generate new cards
            if (!cards || !cards.length) {
                console.log('Generating random cards');

                // Draw 10 random cards
                cardUtil.randomizeFirstTenCards(this.availibleCards);
                cards = this.availibleCards.slice(0, 10);

                //console.log(cards.filter(card => cardUtil.isAlchemy(card)).length);

                this.sortCardsByDutchName(cards);
                setSavedCards(cards);
            }

            this.gameCards = cards;
            const names = cards.map(c => c.Name);
            this.availibleCards = this.availibleCards.filter(card => !names.includes(card.Name));
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
            });
        },

        onClickReplaceCard(gameCardIndex) {
            if (!this.availibleCards || !this.availibleCards.length) {
                console.warn('No cards availible for replacement');
                return;
            }

            // Randomly select new card from availible cards
            const rnd = Math.floor(Math.random() * (this.availibleCards.length));
            const cardToAdd = this.availibleCards[rnd];
            this.availibleCards.splice(rnd, 1);

            // Replace card with new card
            const cardToRemove = this.gameCards[gameCardIndex];
            this.gameCards[gameCardIndex] = cardToAdd;
            this.availibleCards.push(cardToRemove);

            // Don't forget to update the current saved cards
            setSavedCards(this.gameCards);
        },

        onClickRandomizeCards() {
            clearSavedCards();
            this.$router.go(0);
        },

        onClickAddHistory() {
            if (this.gameCards.length == 0) throw 'No cards to add to history';
            const cardNames = this.gameCards.map(c => c.Name);
            addGameToHistory(cardNames);
        },

        onClickOrderCards() {
            const cards = this.gameCards;
            cards.sort(function (a, b) {
                return a.DutchName.localeCompare(b.DutchName);
            });
            this.gameCards = cards;
        },
    }
}


const routes = [
    { path: '/', component: AppMain },
    { path: '/history', component: HistoryComponent },
    { path: '/settings', component: SetsComponent },
]

const router = VueRouter.createRouter({
    //history: VueRouter.createWebHistory(),
    history: VueRouter.createWebHistory('/yadr/'),
    routes, // short for `routes: routes`
})

const app = Vue.createApp({});
app.use(router);

app.mount('#app-main');

// Keep screen on for 5 minutes
function setWakeLock(event) {
    util.wakeLock(5 * 60);
}
window.addEventListener('load', setWakeLock);
window.addEventListener('focus', setWakeLock);