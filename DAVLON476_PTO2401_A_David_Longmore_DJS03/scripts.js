import { books, authors, genres, BOOKS_PER_PAGE } from './data.js';

let page = 1;
let matches = books;

/** Utility Functions **/

// Create and return an element with specified attributes and content
// This function abstracts the element creation process, making it reusable.
function createElement(tag, attributes = {}, innerHTML = '') {
    const element = document.createElement(tag);
    for (const [key, value] of Object.entries(attributes)) {
        element.setAttribute(key, value);
    }
    element.innerHTML = innerHTML;
    return element;
}

// Append a list of elements to a parent
// This function abstracts the process of appending multiple elements, making it reusable.
function appendElements(parent, elements) {
    const fragment = document.createDocumentFragment();
    elements.forEach(element => fragment.appendChild(element));
    parent.appendChild(fragment);
}

/** Specific UI Generation Functions **/

// Generate book preview buttons
// This function abstracts the logic for generating book previews, improving modularity.
function createBookPreviews(books, authors) {
    return books.map(({ author, id, image, title }) => createElement(
        'button',
        { class: 'preview', 'data-preview': id },
        `
            <img class="preview__image" src="${image}" />
            <div class="preview__info">
                <h3 class="preview__title">${title}</h3>
                <div class="preview__author">${authors[author]}</div>
            </div>
        `
    ));
}

// Generate options for a dropdown
// This function abstracts the generation of dropdown options, making it reusable for different data sets.
function createOptions(data, defaultOptionText) {
    const options = [createElement('option', { value: 'any' }, defaultOptionText)];
    for (const [id, name] of Object.entries(data)) {
        options.push(createElement('option', { value: id }, name));
    }
    return options;
}

/** Theme Handling **/

// Set the theme based on user preference
// This function abstracts the theme application logic, making it reusable.
function applyTheme() {
    const prefersDarkScheme = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = prefersDarkScheme ? 'night' : 'day';
    document.querySelector('[data-settings-theme]').value = theme;

    const colorDark = theme === 'night' ? '255, 255, 255' : '10, 10, 20';
    const colorLight = theme === 'night' ? '10, 10, 20' : '255, 255, 255';

    document.documentElement.style.setProperty('--color-dark', colorDark);
    document.documentElement.style.setProperty('--color-light', colorLight);
}

/** Event Listeners **/

// Setup all event listeners
// All event listener setup code is moved into this function for better organization and modularity.
function setupEventListeners() {
    document.querySelector('[data-search-cancel]').addEventListener('click', () => {
        document.querySelector('[data-search-overlay]').open = false;
    });

    document.querySelector('[data-settings-cancel]').addEventListener('click', () => {
        document.querySelector('[data-settings-overlay]').open = false;
    });

    document.querySelector('[data-header-search]').addEventListener('click', () => {
        document.querySelector('[data-search-overlay]').open = true;
        document.querySelector('[data-search-title]').focus();
    });

    document.querySelector('[data-header-settings]').addEventListener('click', () => {
        document.querySelector('[data-settings-overlay]').open = true;
    });

    document.querySelector('[data-list-close]').addEventListener('click', () => {
        document.querySelector('[data-list-active]').open = false;
    });

    document.querySelector('[data-settings-form]').addEventListener('submit', (event) => {
        event.preventDefault();
        const formData = new FormData(event.target);
        const { theme } = Object.fromEntries(formData);
        document.querySelector('[data-settings-theme]').value = theme;
        applyTheme();
        document.querySelector('[data-settings-overlay]').open = false;
    });

    document.querySelector('[data-search-form]').addEventListener('submit', handleSearch);

    document.querySelector('[data-list-button]').addEventListener('click', handleShowMore);

    document.querySelector('[data-list-items]').addEventListener('click', handleBookClick);
}

/** Handlers **/

// Handle search submissions
// This function abstracts the search form submission logic, making it more modular and reusable.
function handleSearch(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const filters = Object.fromEntries(formData);
    matches = books.filter(book => {
        const genreMatch = filters.genre === 'any' || book.genres.includes(filters.genre);
        const titleMatch = filters.title.trim() === '' || book.title.toLowerCase().includes(filters.title.toLowerCase());
        const authorMatch = filters.author === 'any' || book.author === filters.author;
        return genreMatch && titleMatch && authorMatch;
    });

    page = 1;
    const newItems = createBookPreviews(matches.slice(0, BOOKS_PER_PAGE), authors);
    document.querySelector('[data-list-items]').innerHTML = '';
    appendElements(document.querySelector('[data-list-items]'), newItems);

    const listButton = document.querySelector('[data-list-button]');
    listButton.disabled = matches.length <= BOOKS_PER_PAGE;
    listButton.innerHTML = `
        <span>Show more</span>
        <span class="list__remaining"> (${Math.max(matches.length - BOOKS_PER_PAGE, 0)})</span>
    `;

    if (matches.length < 1) {
        document.querySelector('[data-list-message]').classList.add('list__message_show');
    } else {
        document.querySelector('[data-list-message]').classList.remove('list__message_show');
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.querySelector('[data-search-overlay]').open = false;
}

// Handle show more button click
// This function abstracts the "Show more" button logic, improving code modularity.
function handleShowMore() {
    const start = page * BOOKS_PER_PAGE;
    const end = (page + 1) * BOOKS_PER_PAGE;
    const newItems = createBookPreviews(matches.slice(start, end), authors);
    appendElements(document.querySelector('[data-list-items]'), newItems);
    page += 1;

    const listButton = document.querySelector('[data-list-button]');
    listButton.disabled = matches.length <= end;
    listButton.innerHTML = `
        <span>Show more</span>
        <span class="list__remaining"> (${Math.max(matches.length - end, 0)})</span>
    `;
}

// Handle book click event
// This function abstracts the book preview click event logic, making the code more modular and easier to understand.
function handleBookClick(event) {
    const pathArray = Array.from(event.composedPath());
    const active = pathArray.find(node => node.dataset?.preview)?.dataset.preview;
    const book = books.find(book => book.id === active);

    if (book) {
        document.querySelector('[data-list-active]').open = true;
        document.querySelector('[data-list-blur]').src = book.image;
        document.querySelector('[data-list-image]').src = book.image;
        document.querySelector('[data-list-title]').innerText = book.title;
        document.querySelector('[data-list-subtitle]').innerText = `${authors[book.author]} (${new Date(book.published).getFullYear()})`;
        document.querySelector('[data-list-description]').innerText = book.description;
    }
}

/** Initialization **/

// Initialize the app by rendering initial UI and setting up event listeners
// This function ties everything together, ensuring that all components are initialized properly.
function initialize() {
    // Initial Book Previews
    const initialPreviews = createBookPreviews(matches.slice(0, BOOKS_PER_PAGE), authors);
    appendElements(document.querySelector('[data-list-items]'), initialPreviews);

    // Genre Options
    const genreOptions = createOptions(genres, 'All Genres');
    appendElements(document.querySelector('[data-search-genres]'), genreOptions);

    // Author Options
    const authorOptions = createOptions(authors, 'All Authors');
    appendElements(document.querySelector('[data-search-authors]'), authorOptions);

    // Apply Theme
    applyTheme();

    // Setup Event Listeners
    setupEventListeners();
}

// Start the app
initialize();
