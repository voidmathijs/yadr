import * as util from './modules/util.mjs'
import SetsComponent from './modules/sets.mjs'
import { HistoryComponent, addGameToHistory, getHistoryCards } from './modules/history.mjs';
import { getSavedCards, setSavedCards, clearSavedCards } from './modules/savedCards.mjs'

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
                <button @click="buttonAddHistory()">Add cards to history</button>
            </div>
            <div class="order-cards">
                <button @click="orderCards()">⇵</button>
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
        console.log(this.$route);

        if ('addhistory' in this.$route.query) {
            const cards = this.$route.query['addhistory'].split(',');
            this.incomingUrlAddToHistory(cards);
        }

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

            // Filter out base cards
            const baseNames = ['Copper', 'Silver', 'Gold', 'Estate', 'Duchy', 'Province', 'Curse'];
            availibleCards = availibleCards.filter(card => !baseNames.includes(card.Name));

            // Filter out non-playable TYPES (not names)
            const ignoreTypes = ['Artifact', 'Project', 'Event', 'Way', 'Landmark'];
            availibleCards = availibleCards.filter(card => !ignoreTypes.includes(card.Types));

            // Filter out split piles
            const splitNames = ['Plunder', 'Emporium', 'Bustling Village', 'Rocks', 'Fortune', 'Avanto']
            availibleCards = availibleCards.filter(card => !splitNames.includes(card.Name));

            // Filter out Castles pile
            const castleNames = ['Humble Castle', 'Crumbling Castle', 'Small Castle', 'Haunted Castle', 'Opulent Castle', 'Sprawling Castle', 'Grand Castle', "King's Castle"];
            availibleCards = availibleCards.filter(card => !castleNames.includes(card.Name));

            // Filter out prizes
            const prizes = ['Bag of Gold', 'Diadem', 'Followers', 'Princess', 'Trusty Steed'];
            availibleCards = availibleCards.filter(card => !prizes.includes(card.Name));

            // Filter out miscellaneous
            const misc = ['Horse'];
            availibleCards = availibleCards.filter(card => !misc.includes(card.Name));

            // Filter out history cards
            const historyCards = getHistoryCards().flat();
            availibleCards = availibleCards.filter(card => !historyCards.includes(card.Name));

            console.log(availibleCards.length);

            // Translate to dutch
            availibleCards.forEach(card => {
                card.DutchName = this.toDutch(card.Name);
                card.DutchSet = this.toDutch(card.Set);
            });

            this.availibleCards = availibleCards;
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
                this.randomizeFirstTenCards(this.availibleCards);
                cards = this.availibleCards.slice(0, 10);

                this.sortCardsByDutchName(cards);
                setSavedCards(cards);
            }

            this.gameCards = cards;
            const names = cards.map(c => c.Name);
            this.availibleCards = this.availibleCards.filter(card => !names.includes(card.Name));
        },

        /** 
         * Randomizes the first ten cards.
         * See also: https://blog.codinghorror.com/the-danger-of-naivete/
         */
        randomizeFirstTenCards(availibleCards = []) {
            let count = 10;
            if (availibleCards.length < count) {
                console.warn('Not enough cards to shuffle ' + count);
                count = availibleCards.length;
            }

            for (let i = 0; i < count; i++) {
                let rnd = i + Math.floor(Math.random() * (availibleCards.length - i));
                [availibleCards[rnd], availibleCards[i]] = [availibleCards[i], availibleCards[rnd]];
            }
        },

        replaceCard(gameCardIndex) {
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

        randomizeCards() {
            clearSavedCards();
            this.$router.go(0);
        },

        buttonAddHistory() {
            if (this.gameCards.length == 0) throw 'No cards to add to history';
            const cardNames = this.gameCards.map(c => c.Name);
            addGameToHistory(cardNames);
        },

        orderCards() {
            const cards = this.gameCards;
            cards.sort(function (a, b) {
                return a.DutchName.localeCompare(b.DutchName);
            });
            this.gameCards = cards;
        },

        incomingUrlAddToHistory(cardNames) {
            if (confirm('Add the cards specified in the url to the history?')) {
                addGameToHistory(cardNames);
            }
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
    history: VueRouter.createWebHistory(),
    //history: VueRouter.createWebHistory('/yadr/'),
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