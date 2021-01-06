const AppMain = {
    template: `
        <div class="card-list-container">
            <div class="card-container" v-for="(card, i) in gameCards">
                <div class="card-name-container">
                    <div class="card-name">{{ card.Name }}</div>
                    <div class="card-cost">{{ card.Cost }}</div>
                    <div class="card-types">{{ card.Types }}</div>
                </div>
                <div class="card-set">{{ card.Set }}</div>
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
            let engToDutchArray = await this.getCsv('translations_dutch', false);

            // Convert to dict
            let engToDutch = {};
            engToDutchArray.forEach((el, i) => engToDutch[el[0]] = el[1]);

            // Don't want these...
            delete engToDutch[undefined];
            delete engToDutch[''];

            this.engToDutch = engToDutch;
        },

        async initCards() {
            // Get 10 random cards
            let allCards = await this.getCsv('cards', true);
            let gameCards = this.shuffleAndSelectRandom(allCards, 10);

            // Translate to dutch
            gameCards.forEach((card, i) => this.toDutch(card));

            // Sort alphabetically
            gameCards.sort(function (a, b) {
                if (a.Name < b.Name) return -1;
                if (a.Name > b.Name) return 1;
                return 0;
            })

            console.log(gameCards[0]);
            this.gameCards = gameCards;
        },

        async getCsv(filename, hasHeader) {
            return new Promise((resolve, reject) => {
                Papa.parse(`data/${filename}.csv`, {
                    header: hasHeader,
                    download: true,
                    complete: function (results) {
                        resolve(results.data);
                    },
                    error: function (err) {
                        reject(err);
                    }
                });
            });
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

        toDutch(card) {
            if (!(card.Name in this.engToDutch)) console.log('No translation for: ' + card.Name);
            if (!(card.Set in this.engToDutch)) console.log('No translation for: ' + card.Set);
            card.Name = card.Name in this.engToDutch ? this.engToDutch[card.Name] : card.Name;
            card.Set = card.Set in this.engToDutch ? this.engToDutch[card.Set] : card.Set;
        }
    }
}


const Home = { template: '<div>Home</div>' }
const About = { template: '<div>About</div>' }

const routes = [
    { path: '/', component: AppMain },
    { path: '/about', component: About },
]

const router = VueRouter.createRouter({
    history: VueRouter.createWebHashHistory(),
    routes, // short for `routes: routes`
})

const app = Vue.createApp({});
app.use(router);

// const app = Vue.createApp(AppMain);
// const app = Vue.createApp({});
// app.component('asdf', AppMain);
app.mount('#app-main');