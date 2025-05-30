function initSystemData() {

const STRINGS = {
  "Notebook": { it: "Quaderno" },
  "Copy": { it: "Copia" },
  "Copy to Clipboard": { it: "Copia negli Appunti" },
  "Reply": { it: "Rispondi" },
  "Reply in Another Notebook": { it: "Rispondi in un Altro Quaderno" },
  "Reply to": { it: "Risposta a" },
  "Edit": { it: "Modifica" },
  "Edited": { it: "Modificato" },
  "Set Date/Time": { it: "Imposta Data/Ora" },
  "Send": { it: "Invia" },
  "Save": { it: "Salva" },
  "Delete": { it: "Elimina" },
  "Delete?": { it: "Eliminare?" },
  "Cancel": { it: "Annulla" },
  "Close": { it: "Chiudi" },
  "System": { it: "Sistema" },
  "Default": { it: "Predefinito" },
  "Name": { it: "Nome" },
  "Color": { it: "Colore" },
  "Description": { it: "Descrizione" },
  "Info/Settings": { it: "Info/Impostazioni" },
  "App Settings": { it: "Impostazioni App" },
  "Export Data": { it: "Esporta Dati" },
  "Import Data": { it: "Importa Dati" },
  "Reset Data on Import": { it: "Resetta Dati" },
  "Paste JSON": { it: "Incolla JSON" },
  "Invalid data format": { it: "Formato dati invalido" },
  "Invalid JSON syntax": { it: "Sintassi JSON invalida" },
  "No description": { it: "Nessuna descrizione" },
  "No notes": { it: "Nessuna nota" },
  "Info and Demo": { it: "Info e Demo" },
  "Aesthetics": { it: "Estetica" },
  "Color Scheme": { it: "Schema di Colori" },
  "Light": { it: "Chiaro" },
  "Dark": { it: "Scuro" },
  "Message Input Font": { it: "Font Input Messaggi" },
  "Size": { it: "Dimensione" },
  "Language": { it: "Lingua" },
  "Full": { it: "Completo" },
};
STRINGS.get = (name, lang=navigator.language.split('-')[0]) => (STRINGS[name]?.[lang] || STRINGS[name]?.en || name);

const UNSPECIFIEDS = {
  parseMode: "plaintext",
};
  
const NOTEBOOKS = {
  "WhichNot": {
    emoji: "ℹ️",
    description: STRINGS.get('Info and Demo'),
    parseMode: "markdown",
    readonly: true,
    messages: [
      { text: "**WhichNot is finally released and REAL!!!** BILLIONS MUST ENJOY!!!",
        created: "2025-04-20T23:00",
        reactions: { "💝": true },
      },
      { text: "Official first release devlog post: https://octospacc.altervista.org/2025/04/21/whichnot-rilasciato-in-tarda-annunciata-app-di-note-come-messaggi/",
        created: "2025-04-21T21:00"
      },
      { text: `
For the greatest benefit of everyone's retinas, **OBSCURE MODE IS HERE!**
Yes indeed, it's not just dark, but as a matter of fact obscure: it uses the cutting-edge [CSS \`light-dark()\` function](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/light-dark) to ensure a pleasant experience for the users (including setting the colors automatically based on the browser's settings) and limited pain for the developer (me). 🌚
\n![](https://windog.octt.eu.org/api/v1/FileProxy/?url=telegram:AgACAgEAAxkBAAIWzWgIq6JoJl57iYVamdd2TmtUYpVMAAJSrzEbpcRBRN2mi5RO7WqiAQADAgADeQADNgQ&type=image/jpeg&timestamp=1745395090&token=hhwBcamZvd6KoSpTZbQi1j-N-7FbQprjv1UFHvozbcg=)
        `,
        created: "2025-04-22T20:00",
      },
      { text: `
From the suffering I just felt now that I actually tried to use the app on mobile for a bit, **an hotfix is born**: 
While behavior on desktop remains unchanged, **pressing Enter in the message editing area on mobile now correctly makes a newline, instead of sending**, as one would expect from a chat UI. ↩️
        `,
        created: "2025-04-23T10:30",
        reactions: { "🔥": true },
      },
      { text: "Yet another quick fix: since I've just now written the previous message, I've only now witnessed the tragic default state of **Markdown links; I adjusted the parser to make it so that external links open in a new tab**. ↗️",
        created: "2025-04-23T11:00",
        reactions: { "🔥": true },
      },
      // TODO post about URL hash navigation
      { text: `
JUST IN: **the app is now officially released as blessed Free (Libre) Software under the terms of the AGPL-3.0 license**!!! 👼
Proprietarytards as well as OSS-LARPers could literally never.
Official Git source repos are as follows:
* https://gitlab.com/octospacc/WhichNot
* https://github.com/octospacc/WhichNot
        `,
        created: "2025-04-24T01:00",
      },
      { text: `
Some AMAZING (even if quick) **improvements have been made to text input fields!**
* The textarea for message input now dynamically resizes vertically to accomodate multiple lines of text, up to about 10 lines on screen (currently just by counting the newlines in the text).
* Fixed a bug for the reaction input area, where previously on mobile pressing Enter to confirm or close the input wouldn't register if the message to react was the very last one, and instead focus would be passed to the message input field below.
`,
        created: "2025-04-25T02:00",
      },
      { text: `
Finally the supremacy of WhichNot really becomes clear as day:
Thanks to [service workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API),
**the app itself now gets cached locally after the first run, allowing it to be started faster and also work offline**, including if my server explodes!!!
This is truly THE GREATEST note-taking experience for everyone!!! 🕸️
        `,
        created: "2025-04-30T10:00",
      },
      { text: `
Great, **STUPENDOUS KEYBOARD NAVIGATION IS HERE!**
Practically everything in the app is now usable with just the keyboard, after having implemented the most basic standard web accessibility practices.
* Modals and menus are automatically focused when they appear on screen, as they should. Also, all sections can now be closed by pressing ESC.
* The message input textarea is now always automatically focused when needed; right after opening a notebook, selecting reply or edit on a message, and so on.
* Messages themselves are now focusable, and pressing Enter on them brings up their context menu. The menu options themselves are now also selectable with Tab.
* When a message is scrolled to, it's focused to allow this keyboard interaction. Message reply indicators are now also clickable with the keyboard.
        `,
        created: "2025-05-01T15:00",
      },
      { text: `
It's also **just about time for Ａｅｓｔｈｅｔｉｃｓ** (also called "UI")... More crazy options coming soon, but for now:
* The color scheme of the app can be overriden in the settings, from the default option of following system preferences to always light or dark.
* App language can now also be overridden, from the default of following system preferences to any of the supported languages.
* Font size and family of the message text input can be customized, respectively at will and by choosing from a list of the default categories.
        `,
        created: "2025-05-01T17:00",
      },
    ],
  },
};
Object.entries(NOTEBOOKS).forEach(([name, values]) => (NOTEBOOKS[name] = { id: name, name, ...values, messages: values.messages.map((message, id) => ({ id, ...message })) }));

return {STRINGS, UNSPECIFIEDS, NOTEBOOKS};

}