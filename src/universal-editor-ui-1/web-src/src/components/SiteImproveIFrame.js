import React, { useEffect, useState } from 'react';
import { Flex, Text } from "@adobe/react-spectrum";
import { useSiteImprove } from "./hooks/useSiteImprove";

export default function SiteImproveIFrame(
    {
        sessionId,
        publishUrl,
        pageHTML,
        onElementHighlighted

    }) {
    const { isUserLoggedIn, initialized, started, canCheck, showContentCheckButton, hideContentCheckButton} = useSiteImprove(sessionId, publishUrl, pageHTML, onElementHighlighted);

    // automatically fire the content-check UI
    useEffect(() => {
        const hasPageHtml = !!pageHTML;
        if (canCheck && hasPageHtml && isUserLoggedIn) {
            showContentCheckButton();
        } else if(initialized && started && isUserLoggedIn){
            hideContentCheckButton();
        }
    }, [canCheck, pageHTML]);

    if (!started) {
        return (
            <Flex height="100%" direction="column" justifyContent="center" marginX="size-200">
                <Text>Loading SiteImprove…</Text>
                <Text>Please allow pop-ups.</Text>
            </Flex>
        );
    }
    return null; // SDK handles the iframe DOM
}