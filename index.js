import * as util from './modules/util.mjs'
import SetsComponent from './modules/sets.mjs'

const AppMain = {
    template: `
        <div class="card-list-container">
            <div class="card-container" v-for="(card, i) in gameCards">
                <div class="card-name-container">
                    <div class="card-name">{{ card.DutchName }}</div>
                    <div class="card-cost">{{ card.Cost }}</div>
                    <div class="card-types">{{ card.Types }}</div>
                </div>
                <div class="card-set">{{ card.DutchSet }}</div>
                <div class="card-replace"><button @click="replaceCard(i)">Replace</button></div>
            </div>
        </div>
    `,
    data() {
        return {
            engToDutch: [],
            gameCards: []
        }
    },
    async mounted() {
        await this.initTranslations();
        await this.initCards();
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

        async initCards() {
            // All cards
            let availibleCards = await util.getCsv('data/cards.csv', true);
            console.log(availibleCards.length);

            // Filter out unchecked sets
            availibleCards = this.filterToChosenSets(availibleCards);
            console.log(availibleCards.length);

            // Filter out non-playable types
            let ignoreTypes = ['Artifact', 'Project', 'Event', 'Way', 'Landmark', 'Curse'];
            availibleCards = availibleCards.filter(card => !ignoreTypes.includes(card.Types));
            console.log(availibleCards.length);

            // Get 10 random cards
            let gameCards = this.shuffleAndSelectRandom(availibleCards, 10);

            // Translate to dutch
            gameCards.forEach(card => {
                card.DutchName = this.toDutch(card.Name);
                card.DutchSet = this.toDutch(card.Set);
            });

            this.sortCardsByDutchName(gameCards);

            console.log(gameCards[0]);
            this.gameCards = gameCards;
        },

        /**
         * Returns an array of randomly selected cards.
         * Warning: has side effect of shuffling the cards array.
         */
        shuffleAndSelectRandom(cards = [], count = 10) {
            if (count > cards.length) throw 'Not enough cards to randomly select';
            if (count == cards.length) return cards.slice();

            // Select 'count' random cards by shuffling the first 'count' cards.
            for (let i = 0; i < count; i++) {
                let rnd = i + Math.floor(Math.random() * (cards.length - i));
                [cards[rnd], cards[i]] = [cards[i], cards[rnd]];
            }

            return cards.slice(0, count);
        },

        replaceCard(gameCardIndex) {
            console.log(gameCardIndex);

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


const Home = { template: '<div>Home</div>' }
const About = { template: '<div>About</div>' }

const routes = [
    { path: '/', component: AppMain },
    { path: '/about', component: SetsComponent },
]

const router = VueRouter.createRouter({
    history: VueRouter.createWebHashHistory(),
    routes, // short for `routes: routes`
})

const app = Vue.createApp({});
app.use(router);

app.mount('#app-main');