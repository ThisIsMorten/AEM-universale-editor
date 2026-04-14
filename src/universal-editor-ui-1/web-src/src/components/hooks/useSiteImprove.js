import {useState, useEffect, useCallback, useRef} from 'react';
import { siteImprove } from "../sdk/siteImproveClient";

export function useSiteImprove(sessionId, publishUrl, pageHTML, onElementHighlighted) {
    const [initialized,setInitialized] = useState(false);
    const [started,setStarted]= useState(false);
    const [loaded,setLoaded]= useState(false);
    const [isUserLoggedIn, setUserIsLoggedIn] = useState(false);
    const [canCheck,setCanCheck] = useState(false);
    const iframeRef = useRef(null);


    useEffect(() => {
        (async ()=>{
            await siteImprove.loadSdk()
            setLoaded(true)
        })()
    }, []);

    // sdk init
    useEffect(() => {
        if(initialized || !loaded) {
            return
        }
        try{
            siteImprove.init({
                pluginVersion: 'aem_6.5.20',
                showLogs: false,
                onCapabilitiesChanged: caps => {
                    // console.log('caps',caps)
                    const isLoggedIn = !!caps.hasContentCheck || !!caps.hasEmailCheck || !!caps.canContentCheck || !!caps.canEmailCheck
                    // console.log('caps hasLoggedIn: ',isLoggedIn)
                    setUserIsLoggedIn(isLoggedIn)
                    setCanCheck(!!caps.canContentCheck)
                },
                onStateChanged: () => {},
                onLogout: () => {
                    // console.log('onLogout()')
                    setStarted(false)

                    // this is a fix for if the user logs in and out multiple times. SiteImprove SDK doesn't remove or readd any iframes after the first login/logout.
                    const numberOfIframes = document.querySelectorAll("iframe[id^='siteimprove-iframe-']").length;
                    if(numberOfIframes > 0){
                        const frames = document.querySelectorAll("iframe[id^='siteimprove-iframe-']");
                        frames.forEach(f => f.remove());
                    }
                },
                onCreateIframe: url => {
                    // console.log('onCreateIframe() url:', url, 'existing iframe:', iframeRef.current);
                    if (!url) {
                        return null
                        // return iframeRef.current // this is basically null or the iframe ref
                    }
                    const iframe = document.createElement('iframe');

                    // random 5 digit number
                    const rand5 = Math.floor(Math.random() * 90000) + 10000;
                    iframe.id = `siteimprove-iframe-${rand5}`;
                    iframe.src = url;
                    Object.assign(iframe.style, {
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        border: 'none'
                    });
                    document.body.appendChild(iframe);
                    iframeRef.current = iframe;
                    return iframe;
                }
            })
            setInitialized(true)
        } catch(e) {
            console.log('error initialising: ', e)
        }
    }, [initialized, loaded]);

    // start session
    useEffect(() => {
        if (!(initialized && sessionId && !started)) return;

        const startAndOpen = async () => {
            try {
                const ok = await siteImprove.start(sessionId);
                if (ok) {
                    await siteImprove.open();
                    setStarted(true);

                    // this is a bit of a hack/fix because SI doesn't load it a second time. If no iframes exist, add one. Normally open() will create one.
                    const numberOfIframes = document.querySelectorAll("iframe[id^='siteimprove-iframe-']").length;
                    if(numberOfIframes === 0){
                        // TODO check if close() is a better idea
                        document.body.appendChild(iframeRef.current);
                    }
                }
            } catch (err) {
                console.error(err);
            }
        };

        startAndOpen();
    }, [initialized, sessionId, started]);


    // set preview URL (first tab)
    useEffect(() => {
        if (started && publishUrl) {
            const u = new URL(publishUrl);
            u.search = '';
            siteImprove.setPublicUrl(u.toString());
        }
    }, [started, publishUrl]);

    // setting default highlighter
    useEffect(() => {
        if (initialized && canCheck && !!pageHTML) {
            siteImprove.setDefaultHighlighting(pageHTML, {
                // canApply?: (highlights: Highlight[]) => boolean;
                clear: () => {},
                apply: els => {
                    if (els.length) onElementHighlighted(els[0].selector);
                }
            })
        }
    }, [initialized, canCheck, pageHTML]);
    // trigger content check when allowed
    const showContentCheckButton = useCallback(() => {
        if (initialized && canCheck) {
            siteImprove.readyForContentCheck([{
                name: null,
                dataType: 'fullPage',
                getDom: async () => {
                    hideContentCheckButton(); // this is hacky but it runs after the user clicks check, so it works.
                    return pageHTML
                },
                customHighlighter: {
                    // canApply?: (highlights: Highlight[]) => boolean;
                    clear: () => {},
                    apply: els => {
                        if (els.length) onElementHighlighted(els[0].selector);
                    }
                }
            }]);
        }
    }, [canCheck, pageHTML, onElementHighlighted, initialized]);

    const hideContentCheckButton = useCallback(() => {
        siteImprove.readyForContentCheck([]);
    }, []);

    return { initialized, started, canCheck, showContentCheckButton, hideContentCheckButton, isUserLoggedIn };
}
