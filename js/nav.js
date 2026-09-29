(function () {
    /* Chromium browsers load a page as soon as a pointer settles on its link, so
       the fade opens onto a finished page instead of waiting on the network.
       Browsers without speculation rules ignore this. */
    if (window.HTMLScriptElement && HTMLScriptElement.supports &&
        HTMLScriptElement.supports('speculationrules')) {
        const rules = document.createElement('script');
        rules.type = 'speculationrules';
        rules.textContent = JSON.stringify({
            prerender: [{ where: { href_matches: '/*' }, eagerness: 'moderate' }]
        });
        document.head.append(rules);
    }

    /* The arrow goes back to wherever the visitor came from, another site
       included (the vault differs from the studio sites here; Greg,
       2026-09-29). With no referrer, a page opened fresh, the href takes over
       and sends them to the front. */
    const back = document.querySelector('.backmark');
    if (!back) return;

    back.addEventListener('click', function (e) {
        if (document.referrer && history.length > 1) {
            e.preventDefault();
            history.back();
        }
    });
})();
