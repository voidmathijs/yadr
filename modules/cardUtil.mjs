export const ALCHEMY_DONTCARE = 0;
export const ALCHEMY_FORCE = 1;
export const ALCHEMY_FORCENOT = 2;

/** 
* Randomizes the first ten cards.
* See also: https://blog.codinghorror.com/the-danger-of-naivete/
*/
export function randomizeFirstTenCards(availibleCards = []) {
    const count = 10;
    if (availibleCards.length < count) {
        console.warn('Not enough cards to shuffle ' + count);
        return;
    }

    // Roll the dice to see if we're using alchemy cards or not
    const alchemyCards = availibleCards.filter(card => isAlchemy(card));
    //const odds = (alchemyCards.length * alchemyCards.length) / (availibleCards.length * availibleCards.length);
    const odds = alchemyCards.length / availibleCards.length;
    const r = Math.random();
    console.log(`odds: ${odds}, r: ${r}, cards: ${availibleCards.length}, alch: ${alchemyCards.length}`);

    if (r > odds) {
        // Shuffle 10 random cards, all non-alchemy
        for (let i = 0; i < count; i++) {
            const rnd = getRandomCardIndex(availibleCards, i, ALCHEMY_FORCENOT);
            [availibleCards[rnd], availibleCards[i]] = [availibleCards[i], availibleCards[rnd]];
        }
    }
    else {
        // Shuffle 10 random cards, with a minimum of 3 alchemy cards
        let alchCount = 0;
        for (let i = 0; i < count; i++) {
            let rnd = -1;
            if (alchCount < 3) {
                rnd = getRandomCardIndex(availibleCards, i, ALCHEMY_FORCE);
                alchCount++
            }
            else {
                rnd = getRandomCardIndex(availibleCards, i, ALCHEMY_DONTCARE);
            }
            [availibleCards[rnd], availibleCards[i]] = [availibleCards[i], availibleCards[rnd]];
        }
    }
}

function getRandomCardIndex(cards = [], startIndex = 0, alchemyOption = ALCHEMY_DONTCARE) {
    for (let i = 0; i < 1000; i++) {
        const rnd = startIndex + Math.floor(Math.random() * (cards.length - startIndex));

        if (alchemyOption == ALCHEMY_DONTCARE) {
            return rnd;
        }
        else if (alchemyOption == ALCHEMY_FORCE && isAlchemy(cards[rnd])) {
            return rnd;
        }
        else if (alchemyOption == ALCHEMY_FORCENOT && !isAlchemy(cards[rnd])) {
            return rnd;
        }
    }
    console.log(cards);
    console.log(startIndex);
    console.log(alchemyOption);
    throw 'Failed to get random card after 1000 tries';
}

export function isAlchemy(card) {
    return card.Cost.endsWith('P');
}