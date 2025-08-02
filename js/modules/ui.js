const scrollableDiv = document.querySelector('#chip8code');

const createSelectableItem = (id) => {
    const item = document.createElement('div');
    item.innerHTML = `item ${id}`;
    item.id = `item-${id}`;
    return item;
}
for (let i = 0; i < 100; i++) {
    scrollableDiv.append(createSelectableItem(i));
}

const selectItem = (id, skipScroll = false) => {
    const previouslySelected = scrollableDiv.querySelector('.selected');
    if (previouslySelected) {
        previouslySelected.classList.remove('selected');
    }
    const selectedItem = scrollableDiv.querySelector(`#item-${id}`);
    if (selectedItem) {
        if (!skipScroll) {
            selectedItem.scrollIntoView();
        }
        selectedItem.classList.add('selected');
    }
};

window.selectItem = selectItem;
