import { ScrollViewStyleReset } from 'expo-router/html';
import { type PropsWithChildren } from 'react';

/**
 * This file is web-only and used to configure the root HTML for every web page during static rendering.
 * The contents of this function only run in Node.js environments and do not have access to the DOM or browser APIs.
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />

        {/*
          Disable body scrolling on web. This makes ScrollView components work closer to how they do on native.
          However, body scrolling is often nice to have for mobile web. If you want to enable it, remove this line.
        */}
        <ScrollViewStyleReset />

        {/* Using raw CSS styles as an escape-hatch to ensure the background color never flickers in dark-mode. */}
        <style dangerouslySetInnerHTML={{ __html: responsiveBackground }} />
        {/* Add any additional <head> elements that you want globally available on web... */}
        <style id="bootsplash-style"  dangerouslySetInnerHTML={{ __html: bootsplash }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

const responsiveBackground = `
body {
  background-color: #fff;
}
@media (prefers-color-scheme: dark) {
  body {
    background-color: #000;
  }
}`;

const bootsplash = `
#bootsplash {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    overflow: hidden;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: #101010;
}
#bootsplash-logo {
    content: url("data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz48IS0tIFVwbG9hZGVkIHRvOiBTVkcgUmVwbywgd3d3LnN2Z3JlcG8uY29tLCBHZW5lcmF0b3I6IFNWRyBSZXBvIE1peGVyIFRvb2xzIC0tPg0KPHN2ZyB3aWR0aD0iODAwcHgiIGhlaWdodD0iODAwcHgiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4NCjxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgY2xpcC1ydWxlPSJldmVub2RkIiBkPSJNOCAxNkwzLjU0MjIzIDEyLjMzODNDMS45MzI3OCAxMS4wMTYyIDEgOS4wNDI4NyAxIDYuOTYwMDVDMSAzLjExNjEyIDQuMTU2MDcgMCA4IDBDMTEuODQzOSAwIDE1IDMuMTE2MTIgMTUgNi45NjAwNUMxNSA5LjA0Mjg3IDE0LjA2NzIgMTEuMDE2MiAxMi40NTc4IDEyLjMzODNMOCAxNlpNMyA2SDVDNi4xMDQ1NyA2IDcgNi44OTU0MyA3IDhWOUwzIDcuNVY2Wk0xMSA2QzkuODk1NDMgNiA5IDYuODk1NDMgOSA4VjlMMTMgNy41VjZIMTFaIiBmaWxsPSIjMDAwMDAwIi8+DQo8L3N2Zz4=");
    width: 100px;
    height: 100px;
}`;