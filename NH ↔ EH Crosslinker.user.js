// ==UserScript==
// @name         NH ↔ EH Crosslinker
// @namespace    github.com/longkidkoolstar
// @version      0.3.0
// @description  Adds cross-links between nhentai and e-hentai/exhentai galleries
// @author       longkidkoolstar
// @match        https://nhentai.net/g/*
// @match        https://e-hentai.org/g/*
// @match        https://exhentai.org/g/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// @license      MIT
// @icon         https://i.postimg.cc/fb6L0sx9/e-h.png
// ==/UserScript==
(function () {
    'use strict';
    const url = location.href;

    // --- Settings & Menu ---
    const PREF_KEY = 'search_title_type';
    const PREF_DISPLAY = {
        'english': 'English',
        'romanized': 'Romanized',
        'japanese': 'Japanese'
    };

    function getPreferredTitleType() {
        return GM_getValue(PREF_KEY, 'english');
    }

    function setPreferredTitleType(type) {
        GM_setValue(PREF_KEY, type);
        location.reload();
    }

    // Register Menu Commands
    const currentType = getPreferredTitleType();
    GM_registerMenuCommand(`Search with English Title ${currentType === 'english' ? '✅' : ''}`, () => setPreferredTitleType('english'));
    GM_registerMenuCommand(`Search with Romanized Title ${currentType === 'romanized' ? '✅' : ''}`, () => setPreferredTitleType('romanized'));
    GM_registerMenuCommand(`Search with Japanese Title ${currentType === 'japanese' ? '✅' : ''}`, () => setPreferredTitleType('japanese'));

    // --- Title Logic ---
    function getTitle(site) {
        const type = getPreferredTitleType();
        let title = '';

        if (site === 'nhentai') {
            const h1 = document.querySelector('#info h1'); // Pretty/English/Romanized
            const h2 = document.querySelector('#info h2'); // Original/Japanese

            if (type === 'japanese' && h2 && h2.innerText.trim()) {
                title = h2.innerText;
            } else if (h1) {
                title = h1.innerText;
            }
        } else if (site === 'ehentai') {
            const gn = document.querySelector('#gn'); // English/Romanized
            const gj = document.querySelector('#gj'); // Japanese

            if (type === 'japanese' && gj && gj.innerText.trim()) {
                title = gj.innerText;
            } else if (gn) {
                title = gn.innerText;
            } else if (gj) {
                title = gj.innerText;
            }
        }
        
        return cleanTitle(title, type);
    }

    /* ---------------- NHENTAI → E-HENTAI ---------------- */
    if (url.includes('nhentai.net/g/')) {
        const title = getTitle('nhentai');
        if (!title) return;

        const artistEl = document.querySelector(
            '.tag-container.field-name a[href^="/artist/"] .name'
        );
        const artist = artistEl ? artistEl.textContent.trim() : '';
        let query = title;
        if (artist) query += ` artist:${artist}`;
        const ehUrl = 'https://e-hentai.org/?f_search=' + encodeURIComponent(query);
        addButton('#info', `🔗 Search on e-hentai (${PREF_DISPLAY[currentType]})`, ehUrl);
        return;
    }

    /* ---------------- E / EXHENTAI → NHENTAI ---------------- */
    if (url.includes('e-hentai.org/g/') || url.includes('exhentai.org/g/')) {
        const title = getTitle('ehentai');
        if (!title) return;

        const artistEl = document.querySelector(
            '#taglist a[href^="https://e-hentai.org/tag/artist:"]'
        );
        const artist = artistEl ? artistEl.textContent.trim() : '';
        let query = title;
        if (artist) query += ` ${artist}`;
        const nhUrl =
            'https://nhentai.net/search/?q=' + encodeURIComponent(query);
        addButton('#gd2', `🔗 Search on nhentai (${PREF_DISPLAY[currentType]})`, nhUrl);
    }

    /* ---------------- SWITCH e-hentai → exhentai ---------------- */
    if (
        url.startsWith('https://e-hentai.org/?') ||
        url.startsWith('https://e-hentai.org/?f_search=')
    ) {
        const exhUrl = url.replace('https://e-hentai.org/', 'https://exhentai.org/');
        addFloatingButton('🔄 Switch to exhentai', exhUrl);
    }

    /* ---------------- Helpers ---------------- */
    function cleanTitle(title, type) {
        if (!title) return '';
        // If title contains |, take only the left part
        if (title.includes('|')) {
            if (type === 'english') {
                // For English, take the right part
                title = title.split('|')[1];
            } else {
                // For others (e.g. Romanized), take the left part
                title = title.split('|')[0];
            }
        }

        // Remove bracketed content
        title = title.replace(/\[[^\]]*\]/g, '');

        // Remove numbers (standalone digits and sequences)
        title = title.replace(/\b\d+\b/g, '');

        // Clean up extra whitespace
        title = title.replace(/\s+/g, ' ').trim();

        return title;
    }

    function addButton(parentSelector, text, link) {
        const parent = document.querySelector(parentSelector);
        if (!parent) return;
        const a = document.createElement('a');
        a.href = link;
        a.target = '_blank';
        a.textContent = text;
        a.style.display = 'block';
        a.style.marginTop = '10px';
        a.style.fontSize = '16px';
        parent.appendChild(a);
    }

    function addFloatingButton(text, link) {
        const a = document.createElement('a');
        a.href = link;
        a.textContent = text;
        a.style.position = 'fixed';
        a.style.bottom = '20px';
        a.style.right = '20px';
        a.style.padding = '10px 14px';
        a.style.background = '#34353b';
        a.style.color = '#fff';
        a.style.borderRadius = '6px';
        a.style.fontSize = '14px';
        a.style.zIndex = '9999';
        a.style.textDecoration = 'none';
        document.body.appendChild(a);
    }
})();