import React, { useEffect, useRef, useState } from 'react';
import { attach } from '@adobe/uix-guest';
import { defaultTheme, Flex, Provider } from '@adobe/react-spectrum';
import { extensionId } from '../Constants';
import actions from '../../config.json';
import actionWebInvoke from '../../utils';
import { removeFooter, removeHeader, getFormattedCorrectPagePath } from "../../../../actions/utils";
import SiteImproveIFrame from "../SiteImproveIFrame";
import { getProgramIdFromDomain } from "./utils";


/*
 * Removes head and footer from string
 * Converts HTML from string to DOM object
 */
const formatHTMLForSiteImproveIframe = (inputHtml) => {
  // remove header and footer before sending, so it's just the body
  const withoutHeader = removeHeader(inputHtml);
  const formattedHTML = removeFooter(withoutHeader);

  // converts the HTML string to a DOM object
  const parser = new DOMParser();
  const parsedDoc = parser.parseFromString(formattedHTML, "text/html");

  return parsedDoc
}

const TOTAL_NUMBER_OF_SECONDS_TO_WAIT = 10;
const REACT_APP_ALLOWED_LOADING_TIME = 3 * 1000;

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function extractIframeHtml(iframe, cancelRef) {
  let checkCount = 0;

  if (!iframe) return null;

  while (checkCount < TOTAL_NUMBER_OF_SECONDS_TO_WAIT && !cancelRef.current) {
    // console.log('loop number: ', checkCount)
    const doc = iframe.contentDocument || iframe.contentWindow.document;
    if (doc) {
      const root = doc.getElementById('root');
      if (root && root.hasChildNodes()) {
        console.log('react app has loaded');

        await wait(REACT_APP_ALLOWED_LOADING_TIME);

        if (cancelRef.current) return null;

        const extractedHtml = doc.documentElement.outerHTML;
        return formatHTMLForSiteImproveIframe(extractedHtml);
      }
    }
    checkCount++;
    await wait(1000);
  }

  if (!cancelRef.current) {
    console.log('hidden iframe DOM not loaded, proceeding anyways');
    const doc = iframe.contentDocument || iframe.contentWindow.document;
    const extractedHtml = doc.documentElement.outerHTML;
    // console.log('returning: ',extractedHtml)
    return formatHTMLForSiteImproveIframe(extractedHtml);
  }

  return null;
}


export default function SiteimproveRail() {
  const [guestConnection, setGuestConnection] = useState();
  const guestConnectionRef = useRef(guestConnection);
  const [sessionId, setSessionId] = useState(null);
  const [publishUrl, setPublishUrl] = useState('');
  const hiddenIframeRef = useRef(null);
  const [isHiddenIframeLoaded, setIsHiddenIframeLoaded] = useState(false);

  // this is the DOM of the current page when its first returned from AEM
  const [currentAEMPageInitialDOM, setCurrentAEMPageInitialDOM] = useState('');
  // this is the rendered pages HTML after it's been loaded.
  const [currentPageHTML, setCurrentPageHTML] = useState(null)

  useEffect(() => {
    guestConnectionRef.current = guestConnection;
  }, [guestConnection]);

    useEffect(() => {
        // for some reason, AEM loads 2 iframes of this extension. So using this as a bridge between
        // since the other iframe gets the events. (it's hidden in the top left-hand side of the screen).
        const bc = new BroadcastChannel('si-bridge');
        bc.onmessage = ({ data: { eventName, data } }) => {
            if (eventName === 'aue:content-update') {
                (async()=> {
                  setCurrentAEMPageInitialDOM('');
                  setCurrentPageHTML(null);
                  setIsHiddenIframeLoaded(false);
                  await check(guestConnectionRef.current);
                })()
            }
        };
        return () => bc.close();
    }, []);

  useEffect(() => {
    (async () => {
      const guestConnection = await attach({ id: extensionId });
      setGuestConnection(guestConnection);
      await check(guestConnection);
      const userToken = guestConnection.sharedContext.get('token');
      // making it shorter as it's used as a key for this specific user and in a url, doesn't need to be long
      const newCacheKey = userToken.substring(0,8);
      setSessionId(newCacheKey)
      // clean-up when the rail unmounts
    })();
  }, []);

  // this loads the hidden iframe with the current AEM pages HTML content, to get the client side rendered HTML
  useEffect(() => {
    if (hiddenIframeRef.current && currentAEMPageInitialDOM) {
      const doc = hiddenIframeRef.current.contentDocument || hiddenIframeRef.current.contentWindow.document;
      doc.open();
      doc.write(currentAEMPageInitialDOM);
      doc.close();
      setIsHiddenIframeLoaded(true);
    }
  }, [currentAEMPageInitialDOM]);

  // then once this iframe is loaded, we wait for the HTML to load within that iframe
  useEffect(() => {
    if (!isHiddenIframeLoaded || !hiddenIframeRef.current) {
      return;
    }

    const cancelRef = { current: false };

    (async () => {
      const html = await extractIframeHtml(hiddenIframeRef.current, cancelRef);
      if (html && !cancelRef.current) {
        setCurrentPageHTML(html);
      }
    })();

    return () => {
      cancelRef.current = true;
    };
  }, [isHiddenIframeLoaded]);

  useEffect(()=> {
    (async ()=> {
      try {
        if (!!guestConnectionRef && guestConnectionRef.current) {

          const editorState = await guestConnectionRef.current?.host.editorState.get();
          const currentDomain = editorState.connections.aemconnection;
          const programId = getProgramIdFromDomain(currentDomain);

          const fullUrl = editorState.location;
          const parsedUrl = new URL(fullUrl);
          const pagePath = parsedUrl.pathname + parsedUrl.search;

          const token = await guestConnectionRef.current?.sharedContext.get('token');
          const authScheme = await guestConnectionRef.current?.sharedContext.get('authScheme');
          const bearerToken = authScheme + ' ' + token;
          const { publishDomain} = await actionWebInvoke(
              actions['get-publish-domain'],
              { Authorization: bearerToken },
              {
                programId
              }
          );

          let formattedCorrectPagePath = ''
          try {
            formattedCorrectPagePath = getFormattedCorrectPagePath(pagePath)
          } catch(e) {
            console.log('error getting page path: ',e)
          }

          if(!!publishDomain){
            const newPublishUrl = `https://${publishDomain}/${formattedCorrectPagePath}`
            setPublishUrl(newPublishUrl);
          } else {
            console.log('No publish domain set for programId: ', programId)
            setPublishUrl('');
          }
        }
      } catch(e) {
        console.log('error getting publish publishDomain')
      }
    })()
  },[guestConnectionRef, guestConnectionRef.current])

  async function check(guestConnection) {
    try {
      const editorState = await guestConnection.host.editorState.get();
      const token = await guestConnection.sharedContext.get('token');
      const authScheme = await guestConnection.sharedContext.get('authScheme');
      const bearerToken = authScheme + ' ' + token;

      const content = await actionWebInvoke(
          actions['get-page-content'],
          { Authorization: bearerToken },
          {
            url: editorState.location,
            aemAccessToken: bearerToken
          }
      );
      setCurrentAEMPageInitialDOM(content.html);
    } catch (error) {
      console.error('Error fetching page content:', error);
    }
  }

  const handleElementHighlighted = (selector) => {
    // console.log('selector',selector)
    if(!selector){
      // console.log('no selectable: ', selector)
      return
    }

    // console.log('selector: ', selector);
    try {
      if (hiddenIframeRef.current) {
        const doc = hiddenIframeRef.current.contentDocument || hiddenIframeRef.current.contentWindow.document;
        if (doc) {
          const element = doc.querySelector(selector);
          if (element) {
            (async () => {
              const editorState = await guestConnectionRef.current?.host.editorState.get();

              let currentElement = element;
              let dataAueResourceValue = null;
              while (currentElement && !dataAueResourceValue) {
                dataAueResourceValue = currentElement.getAttribute('data-aue-resource');
                if (!dataAueResourceValue) {
                  // console.log('getting parent')
                  // console.log('new element', currentElement)
                  // console.log('dataAueResourceValue',dataAueResourceValue)
                  currentElement = currentElement.parentElement;
                }
                // console.log('new element', currentElement)
              }
              if (dataAueResourceValue) {
                const selectedElementAsEditable = editorState.editables.filter(editable => {
                  return editable.resource === dataAueResourceValue;
                });

                if (selectedElementAsEditable.length > 0) {
                  // console.log('editable found, selecting');
                  await guestConnectionRef.current?.host.editorActions.selectEditables(selectedElementAsEditable);
                } else {
                  console.log('No matching editable found for resource:', dataAueResourceValue);
                }
              } else {
                console.log('No data-aue-resource found in hierarchy for selector:', selector);
              }
            })();
          } else {
            console.log('Element not found for selector:', selector);
          }
        }
      }
    } catch (e) {
      console.log('error selecting editable on the page');
      console.log(e);
    }
  };

  return (
    <Provider theme={defaultTheme} colorScheme='light'>
      <Flex justifyContent='center' direction='column' alignItems='center' height='100vh'>
        <iframe
            ref={hiddenIframeRef}
            onLoad={() => setIsHiddenIframeLoaded(true)}
            style={{
              width: '1200px',
              height: '1800px',
              border: 'none',
              position: 'fixed',
              top: '-9999px',
              left: '-9999px',
              visibility: 'hidden',
            }}
            aria-hidden='true'
        />
        <SiteImproveIFrame
            onElementHighlighted={handleElementHighlighted}
            publishUrl={publishUrl}
            sessionId={sessionId}
            pageHTML={currentPageHTML}
        />
      </Flex>
    </Provider>
  );
}
