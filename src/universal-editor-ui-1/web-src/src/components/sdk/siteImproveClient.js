// siteImproveClient.js

class SiteImproveClient {
    /**
     * @param {{ debug?: boolean }} options
     */
    constructor({ debug = false } = {}) {
        this.sdk = null;
        this.loader = null;
        this.debug = debug;
    }

    /**
     * Enable or disable debug logging at runtime
     * @param {boolean} flag
     */
    setDebug(flag) {
        this.debug = flag;
    }

    // Internal logger
    _log(...args) {
        if (this.debug) console.log('[SiteImproveClient]', ...args);
    }
    _error(...args) {
        if (this.debug) console.error('[SiteImproveClient]', ...args);
    }

    /**
     * Load the external SDK script once
     * @returns {Promise<void>}
     */
    loadSdk() {
        if (this.loader) {
            this._log('SDK script already loading or loaded');
            return this.loader;
        }

        this._log('Creating <script> tag for SiteImprove SDK');
        this.loader = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.siteimprove.net/cms/overlay-v3.js';
            script.async = true;

            script.onload = () => {
                this._log('SDK script loaded in iframe');
                if (window._si) {
                    this.sdk = window._si;
                    this._log('got window._si');
                    resolve();
                } else {
                    this._error('window._si not found after load');
                    reject(new Error('SiteImprove global not found'));
                }
            };

            script.onerror = (err) => {
                this._error('Failed to load SDK script', err);
                reject(new Error('Failed to load SiteImprove SDK'));
            };

            document.body.appendChild(script);
        });

        return this.loader;
    }

    /**
     * Initialize the SDK with given options
     * @param {Object} options
     * @returns {Promise<void>}
     */
    init(options) {
        try {
            this._log('Calling sdk.init() with options:', options);
            this.sdk.init(options);
            this._log('SDK.init() called successfully');
        } catch (e) {
            this._error('Error during sdk.init()', e);
            throw e;
        }
    }

    /**
     * Start a session
     * @param {string} sessionId
     * @returns {Promise<boolean>}
     */
    start(sessionId) {
        this._log('Calling sdk.start() with sessionId:', sessionId);
        try {
            return this.sdk.start({ sessionId });
        } catch (e) {
            this._error('Error in sdk.start()', e);
            return Promise.reject(e);
        }
    }

    /**
     * Open the overlay
     * @returns {Promise<void>}
     */
    open() {
        this._log('Calling sdk.open()');
        try {
            return this.sdk.open();
        } catch (e) {
            this._error('Error in sdk.open()', e);
            return Promise.reject(e);
        }
    }

    /**
     * Set the preview URL for the live tab
     * @param {string} url
     */
    setPublicUrl(url) {
        this._log('calling sdk.setPublicUrl() with: ', url);
        try {
            this.sdk.setPublicUrl(url);
        } catch (e) {
            this._error('Error in sdk.setPublicUrl()', e);
        }
    }

    /**
     * Configure content-check routine
     * @param {Array} config
     */
    readyForContentCheck(config) {
        this._log('Calling sdk.readyForContentCheck() with config:', config);
        try {
            this.sdk.readyForContentCheck(config);
        } catch (e) {
            this._error('Error in sdk.readyForContentCheck()', e);
        }
    }

    setDefaultHighlighting(dom, customHighlighter) {
        this._log('Calling sdk.setDefaultHighlighting()');
        try {
            this.sdk.setDefaultHighlighting(dom, customHighlighter);
        } catch (e) {
            this._error('Error in sdk.setDefaultHighlighting()', e);
        }
    }
}

export const siteImprove = new SiteImproveClient({ debug: false });
