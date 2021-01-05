const AppMain = {
    data() {
        return {
            gameCards: []
        }
    },
    async mounted() {
        let cards = await this.getCards();

        let gameCards = this.shuffleAndSelectRandom(cards, 10);
        console.log(gameCards[0]);
        this.gameCards = gameCards;
    },
    methods: {
        async getCards() {
            return new Promise((resolve, reject) => {
                Papa.parse("data/cards.csv", {
                    header: true,
                    download: true,
                    complete: function (results) {
                        console.log('getCards complete');
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

        }
    }
}

const app = Vue.createApp(AppMain)

// app.component('game-card', {
//     props: ['fooBar'],
//     template: `<tr>{{ fooBar.Name }}</li>`
// })

app.mount('#app-main')