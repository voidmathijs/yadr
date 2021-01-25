export function getSavedCards(availibleCards) {
    if (localStorage.savedCardNames) {
        const savedCardNames = JSON.parse(localStorage.savedCardNames);

        // Map saved names to cards
        const savedCards = [];
        for (let i = 0; i < savedCardNames.length; i++) {
            const name = savedCardNames[i];
            const card = availibleCards.find(card => card.Name == name);
            if (!card) throw `Could not match card ${name} in saved cards`;
            savedCards.push(card);
        }

        return savedCards;
    }
    return [];
}

export function setSavedCards(cards) {
    const savedCardsNames = cards.map(card => card.Name);
    localStorage.savedCardNames = JSON.stringify(savedCardsNames);
}

export function clearSavedCards() {
    localStorage.removeItem('savedCardNames');
}