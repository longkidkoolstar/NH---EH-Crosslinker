// ==UserScript==
// @name         NH ↔ EH Crosslinker
// @namespace    github.com/longkidkoolstar
// @version      0.3.2
// @description  Adds cross-links and re-adds them if the site removes them.
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
    const PREF_KEY = 'search_title_type';
    const PREF_DISPLAY = { 'english': 'English', 'romanized': 'Romanized', 'japanese': 'Japanese' };
 
    function getPreferredTitleType() { return GM_getValue(PREF_KEY, 'english'); }
    function setPreferredTitleType(type) { GM_setValue(PREF_KEY, type); location.reload(); }
 
    const currentType = getPreferredTitleType();
    GM_registerMenuCommand(`Search with English Title ${currentType === 'english' ? '✅' : ''}`, () => setPreferredTitleType('english'));
    GM_registerMenuCommand(`Search with Romanized Title ${currentType === 'romanized' ? '✅' : ''}`, () => setPreferredTitleType('romanized'));
    GM_registerMenuCommand(`Search with Japanese Title ${currentType === 'japanese' ? '✅' : ''}`, () => setPreferredTitleType('japanese'));
 
    function getTitle(site) {
        const type = getPreferredTitleType();
        let title = '';
        if (site === 'nhentai') {
            const h1 = document.querySelector('#info h1.title');
            const h2 = document.querySelector('#info h2.title');
            title = (type === 'japanese' && h2 && h2.innerText.trim()) ? h2.innerText : (h1 ? h1.innerText : '');
        } else if (site === 'ehentai') {
            const gn = document.querySelector('#gn');
            const gj = document.querySelector('#gj');
            title = (type === 'japanese' && gj && gj.innerText.trim()) ? gj.innerText : (gn ? gn.innerText : (gj ? gj.innerText : ''));
        }
        return cleanTitle(title, type);
    }
 
    function cleanTitle(title, type) {
        if (!title) return '';
        if (title.includes('|')) title = (type === 'english') ? title.split('|')[1] : title.split('|')[0];
        return title.replace(/\[[^\]]*\]/g, '').replace(/\b\d+\b/g, '').replace(/\s+/g, ' ').trim();
    }
 
    function initInfection() {
        if (url.includes('nhentai.net/g/')) {
            const title = getTitle('nhentai');
            if (!title) return;
            const artistEl = document.querySelector('.tag-container a[href^="/artist/"] .name');
            const query = title + (artistEl ? ` artist:${artistEl.textContent.trim()}` : '');
            const ehUrl = 'https://e-hentai.org/?f_search=' + encodeURIComponent(query);
            addButton('#info', `🔗 Search on e-hentai (${PREF_DISPLAY[currentType]})`, ehUrl, 'cross-eh');
        } else if (url.includes('e-hentai.org/g/') || url.includes('exhentai.org/g/')) {
            const title = getTitle('ehentai');
            if (!title) return;
            const artistEl = document.querySelector('#taglist a[href*="/tag/artist:"]');
            const query = title + (artistEl ? ` ${artistEl.textContent.trim()}` : '');
            const nhUrl = 'https://nhentai.net/search/?q=' + encodeURIComponent(query);
            addButton('#gd2', `🔗 Search on nhentai (${PREF_DISPLAY[currentType]})`, nhUrl, 'cross-nh');
        }
    }
 
    function addButton(parentSelector, text, link, id) {
        const parent = document.querySelector(parentSelector);
        if (!parent || document.getElementById(id)) return;
 
        const a = document.createElement('a');
        a.id = id;
        a.href = link;
        a.target = '_blank';
        a.textContent = text;
        a.style.cssText = 'display:inline-block; margin-top:15px; padding:5px 10px; background:#ed2553; color:#fff; border-radius:4px; font-size:14px; text-decoration:none; font-weight:bold;';
        parent.appendChild(a);
    }
 
    // Initial run
    initInfection();
 
    // Re-check every 1 second — if the button got removed, put it back
    setInterval(initInfection, 1000);
})();