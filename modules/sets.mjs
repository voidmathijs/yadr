import * as util from './util.mjs'
import { clearSavedCards } from './savedCards.mjs'

const SetsComponent = {
    template: `
        <div class="sets-list-container">
            <div class="set-container" v-for="set in sets">
                <input :id="set" :value="set" name="set" type="checkbox" 
                        v-model="checkedSets" @change="handleSet(set)" />
                <div class="card-name">{{ toDutch(set) }}</div>
            </div>
        </div>
        <hr />
        <div class="clear-all">
            <button @click="clearLocalStorage()">Nuke local storage</button>
        </div>
    `,
    data() {
        return {
            engToDutch: [],
            sets: [],
            checkedSets: []
        }
    },
    async mounted() {
        await this.initTranslations();
        await this.initSets();
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

        async initSets() {
            let allCards = await util.getCsv('data/cards.csv', true);

            // Get array of sets, translated
            let sets = allCards.map(card => card.Set);
            sets = [...new Set(sets)];

            // console.log(sets);
            this.sets = sets;
            if (localStorage.checkedSets)
                this.checkedSets = JSON.parse(localStorage.checkedSets);
            else
                this.checkedSets = sets;
        },

        toDutch(name) {
            if (!(name in this.engToDutch)) console.log('No translation for: ' + name);
            return name in this.engToDutch ? this.engToDutch[name] : name;
        },

        handleSet(set) {
            localStorage.checkedSets = JSON.stringify(this.checkedSets);
            clearSavedCards();
        },

        clearLocalStorage() {
            if (confirm('This will clear ALL data for this app! Are you sure?')) {
                localStorage.clear();
                this.historyCards = [];
            }
        },
    }
};

export default SetsComponent;