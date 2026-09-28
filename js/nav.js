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

    /* The arrow goes back a page, but only within the site. history.length counts
       entries from anywhere, so testing it alone would walk visitors out to
       whatever they arrived from. No same-origin referrer, and the href takes
       over and sends them to the front. */
    const back = document.querySelector('.backmark');
    if (!back) return;

    back.addEventListener('click', function (e) {
        let internal = false;
        try {
            internal = !!document.referrer &&
                new URL(document.referrer).origin === location.origin;
        } catch (err) {}
        if (internal && history.length > 1) {
            e.preventDefault();
            history.back();
        }
    });
})();
