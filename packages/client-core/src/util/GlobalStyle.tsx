import { createGlobalStyle } from 'styled-components'
import { EditorTheme } from './theme'

/**
 * GlobalStyle component used to provide common styles all over application.
 *
 * @author Robert Long
 * @type {styled component}
 */
const GlobalStyle = createGlobalStyle<{ theme: EditorTheme }>`
  /*! minireset.css v0.0.4 | MIT License | github.com/jgthms/minireset.css */
  html,
  body,
  p,
  ol,
  ul,
  li,
  dl,
  dt,
  dd,
  blockquote,
  figure,
  fieldset,
  legend,
  textarea,
  pre,
  iframe,
  hr,
  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    margin: 0;
    padding: 0;
  }

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    font-size: 100%;
    font-weight: normal;
  }

  ul {
    list-style: none;
  }

  button,
  input,
  select,
  textarea {
    margin: 0;
  }

  html {
    box-sizing: border-box;
  }

  *, *:before, *:after {
    box-sizing: inherit;
  }

  img,
  embed,
  iframe,
  object,
  video {
    height: auto;
    max-width: 100%;
  }

  audio {
    max-width: 100%;
  }

  iframe {
    border: 0;
  }

  table {
    border-collapse: collapse;
    border-spacing: 0;
  }

  td,
  th {
    padding: 0;
    text-align: left;
  }

  /* scrollbar-width is not inherited so apply to all elements. */
  * {
    scrollbar-width: thin;
  }

  ::selection {
    color: ${(props) => props.theme.text};
    background-color: ${(props) => props.theme.selected};
  }

  a {
    color: ${(props) => props.theme.text};

    &:hover {
      color: ${(props) => props.theme.blueHover};
    }

    &:active {
      color: ${(props) => props.theme.bluePressed};
    }
  }

  html, body {
    width: 100%;
    height: 100%;
  }

  #app {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
  }

  main {
    display: flex;
    flex-direction: column;
    flex: 1;
  }

  body {
    font-family: ${(props) => props.theme.lato};
    font-size: 12px;
    color: ${(props) => props.theme.text};
    background-color: ${(props) => props.theme.background};
    scrollbar-color: #282c31 #5d646c;
  }

  .sentry-error-embed {
    .form-field {
      margin-top: 20px;
    }

    .form-field:not(:last-child) {
      display: none;
    }
  }
`
export default GlobalStyle
