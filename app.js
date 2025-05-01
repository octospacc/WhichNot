window.appMain = () => {

const html = htm.bind(h);
const AppContext = createContext();

localforage.config({ name: "WhichNot" });
navigator.storage.persist();

// Custom Markdown rendering
marked.use({ renderer: {
  // Open all [external (TODO: exclude internal ones once implemented)] links in a new tab
  link({ href, title, tokens }) {
    const text = this.parser.parseInline(tokens);
    let out = `<a target="_blank" href="${escapeHtml(href)}"`;
    if (title) {
      out += ` title="${escapeHtml(title)}"`;
    }
    out += `>${text}</a>`;
    return out;
  },
  // image({ href, title, text }) { // allow embedding any media with ![]()
  //   title = (title ? ` title="${escapeHtml(title)}"` : '');
  //   return `<object data="${href}" alt="${text}" title="${title}">
  //     <embed src="${href}" alt="${text}" title="${title}" />
  //     ${text}
  //   </object>`;
  // }
} });

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

const uuidv7 = () => {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  const time = BigInt(Date.now());
  bytes[0] = Number((time >> 40n) & 0xffn);
  bytes[1] = Number((time >> 32n) & 0xffn);
  bytes[2] = Number((time >> 24n) & 0xffn);
  bytes[3] = Number((time >> 16n) & 0xffn);
  bytes[4] = Number((time >> 8n) & 0xffn);
  bytes[5] = Number(time & 0xffn);
  bytes[6] = (bytes[6] & 0x0f) | 0x70;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const chars = Array.from(bytes).map(byte => byte.toString(16).padStart(2, '0'));
  [10, 8, 6, 4].forEach(pos => chars.splice(pos, 0, '-'));
  return chars.join('');
};
const generateUUID = () => uuidv7(); // crypto.randomUUID();
const genAesKey = async () => await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
// const genEcdsaP256 = async () => await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
const genHmacKey = async () => await crypto.subtle.generateKey({ name: 'HMAC', hash: 'SHA-256' }, true, ['sign']);
const exportJwk = async (key) => btoa(JSON.stringify(await crypto.subtle.exportKey('jwk', key)));
const importJwk = async (b64, alg, usages) => await crypto.subtle.importKey('jwk', JSON.parse(atob(b64)), alg, true, usages);
const randBytes = (len) => {
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  return bytes;
};
const bufToB64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const b64ToBuf = (str) => Uint8Array.from(atob(str), (c => c.charCodeAt(0)));
const deriveMsgKey = async (rawKey, salt) => crypto.subtle.deriveKey(
  { name: 'HKDF', salt, info: new TextEncoder().encode('msg'), hash: 'SHA-256' },
  await crypto.subtle.importKey('raw', rawKey, 'HKDF', false, ['deriveKey']),
  { name: 'AES-GCM', length: 256 },
  true, ['encrypt', 'decrypt']);
const getAesRawKey = async (aesKeyB64) => await crypto.subtle.exportKey('raw', await importJwk(aesKeyB64, { name: 'AES-GCM' }, ['encrypt', 'decrypt']));
// const getEcdsaSignKey = async (ecdsaPrivB64) => await importJwk(ecdsaPrivB64, { name: 'ECDSA', namedCurve: 'P-256' }, ['sign']);
// const signEcdsaSha256 = async (ecdsaPrivB64, data) => await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, await getEcdsaSignKey(ecdsaPrivB64), new TextEncoder().encode(data));
// const getHmacRawKey = async (hmacKeyB64) => await crypto.subtle.exportKey('raw', await importJwk(hmacKeyB64, { name: 'HMAC', hash: 'SHA-256' }, ['sign']));
const hmacSha256B64 = async (hmacKeyB64, msg) => await crypto.subtle.sign('HMAC', await importJwk(hmacKeyB64, { name: 'HMAC', hash: 'SHA-256' }, ['sign']), new TextEncoder().encode(msg));

const encryptMessage = async (message, rawKey) => {
  const salt = randBytes(12);
  const iv = randBytes(12);
  const key = await deriveMsgKey(rawKey, salt);
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(message.text));
  const encrypted = { ...message,
    salt: bufToB64(salt),
    iv: bufToB64(iv),
    ciphertext: bufToB64(ct),
  };
  delete encrypted.text;
  return encrypted;
};
const decryptMessage = async (encrypted, rawKey) => {
  const salt = b64ToBuf(encrypted.salt);
  const iv = b64ToBuf(encrypted.iv);
  const key = await deriveMsgKey(rawKey, salt);
  const ct = b64ToBuf(encrypted.ciphertext);
  const dec = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct);
  return { ...encrypted, text: new TextDecoder().decode(dec) };
};

const escapeHtml = text => {
  const node = document.createElement('p');
  node.appendChild(document.createTextNode(text));
  return node.innerHTML;
};
const makeParagraph = text => `<p>${text.replaceAll('\n', '<br />')}</p>`
const linkify = text => text.replace(/(\bhttps?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>');
const getFirstLink = html => Object.assign(document.createElement('div'), { innerHTML: html }).querySelector('a[href]')?.getAttribute('href');
const renderTextMessage = (text, notebook) => {
  const parseMode = notebook.parseMode || UNSPECIFIEDS.parseMode;
  switch (parseMode) {
    case 'plaintext':
      return makeParagraph(linkify(escapeHtml(text)));
    case 'markdown':
      return marked.parse(escapeHtml(text));
  }
};

const EMOJIS = ['📒','📓','📔','📕','📖','📗','📘','📙','📚','✏️','📝'];
const randomEmoji = () => EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
const randomColor = () => ('#' + Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(6, '0'));
const deleteKeys = (obj, keys) => {
  keys.forEach(key => (delete obj[key]));
  return obj;
};

const closedContextMenu = s => ({ contextMenu: { ...s.contextMenu, visible: false } });
const clickOnEnter = ev => (ev.key==='Enter' && ev.target.click());
const focusElement = (target) => (typeof target==='string' ? document.querySelector(target) : target)?.focus();
const scrollToMessage = messageId => {
  const message = Array.from(document.querySelectorAll(`.Message[data-message-id${messageId ? `="${messageId}"` : ''}]`)).slice(-1)[0];
  if (message) {
    message.scrollIntoView({ behavior: 'smooth', block: 'start' });    
    messageId && message.focus({ preventScroll: true });
  }
};
const makeTextareaHeight = text => {
  let lines = text.split('\n').length;
  if (lines > 10) {
    lines = 10;
  }
  return `${lines + 2}em`;
};
const textareaInputHandler = el => (el.style.minHeight = makeTextareaHeight(el.value));

function App() {
  const [state, setState] = useState({
    notebooks: [], encrypteds: {}, messages: {}, prefs: {},
    selectedNotebookId: null, scrollToMessageId: null,
    showNotebookSettings: false, showAppSettings: false,
    createModal: false, dateTimeModal: null,
    crossReplyModal: false, crossReplySource: null,
    contextMenu:{ visible: false, messageId: null, x: 0, y: 0 },
    searchModal: { visible: false, global: false, query: '' },
    editingMessage: null, replyingTo: null, reactionInputFor: null,
    debugMode: false,
  });
  const isFirstHashPush = useRef(true);
  const messageInputRef = useRef();
  const [loading, setLoading] = useState(true);

  // Get UI strings by user-set language
  (get => (STRINGS.get = useCallback(((name, lang=state.prefs.language) => get(name, lang)), [state.prefs.language])))(STRINGS.get);

  const callApi = useCallback(async (method, path, notebookId, body) => {
    try {
      body &&= JSON.stringify(body);
      const query = `${path}?time=${Date.now()}`;
      //const signed = bufToB64(await signEcdsaSha256(getNotebook(notebookId).ecdsaPrivB64, `${method} ${query}|${body || ''}`));
      const hash = bufToB64(await hmacSha256B64(getNotebook(notebookId).hmacKeyB64, `${method} ${query}|${body || ''}`));
      const data = await (await fetch(`https://hlb0.octt.eu.org/WhichNot-API.php/${query}`, { method, body, headers: { /* 'X-Signed': signed */ 'X-Request-Hash': hash } })).json();
      if (data.error) {
        console.error(data.error);
        alert(data.error);
      }
      return data;
    } catch (err) {
      console.error(err);
      alert(err);
    }
  });

  // Load data from storage
  useEffect(() => {
    (async () => {
      const prefs = await localforage.getItem('preferences') || {};
      const notebooksList = await localforage.getItem('notebooks') || [];
      const notebooks = [];
      const [messagesStore, encryptedsStore] = [{}, {}];
      await Promise.all(notebooksList.map(async notebook => {
        notebooks.push(notebook = await localforage.getItem(`notebooks/${notebook}`));
        const [messages, encrypteds] = [{}, {}];
        const messagesList = await localforage.getItem(`messages/${notebook.id}`);
        const rawKey = await getAesRawKey(notebook.aesKeyB64);
        await Promise.all(messagesList.map(async messageId => (encrypteds[messageId] = await localforage.getItem(`messages/${notebook.id}/${messageId}`))));
        await Promise.all(Object.values(encrypteds).map(async encrypted => (messages[encrypted.id] = await decryptMessage(encrypted, rawKey))));
        encryptedsStore[notebook.id] = encrypteds;
        messagesStore[notebook.id] = messages;
      }));
      setState(s => ({ ...s, notebooks, encrypteds: encryptedsStore, messages: messagesStore, prefs }));
      setLoading(false);
    })();
  }, []);

  // TODO fix that messageId is not handled while the notebook is loading (the url hash gets overridden by the notebook loading itself)
  const navigateHash = useCallback(() => {
    const params = new URLSearchParams(location.hash.slice(2));
    const [notebookId, messageId] = (params.get('notebook') || '#').split('#');
    setState(s => ({ ...s,
      selectedNotebookId: notebookId,
      scrollToMessageId: (notebookId && parseInt(messageId) || null),
      showNotebookSettings: (messageId === 'settings'),
    }));
  }, []);

  const pushHistory = useCallback(hash => {
    if (isFirstHashPush.current) {
      isFirstHashPush.current = false;
    } else {
      location.hash = hash;
    }
  }, []);

  // Listen for URL navigation
  useEffect(() => {
    navigateHash(); // Initial sync
    window.addEventListener('hashchange', navigateHash);
    return () => window.removeEventListener('hashchange', navigateHash);
  }, [navigateHash]);

  // Set URL navigation hashes
  useEffect(() => pushHistory(`#?${state.selectedNotebookId ? `notebook=${state.selectedNotebookId}` : ''}`), [state.selectedNotebookId, pushHistory]);
  // useEffect(() => (state.selectedNotebookId && pushHistory(`#?notebook=${state.selectedNotebookId}${state.showNotebookSettings ? '#settings' : ''}`)), [state.showNotebookSettings]);

  // Persist notebooks meta
  useEffect(() => {
    if (!loading) {
      for (const notebook of state.notebooks) {
        localforage.setItem(`notebooks/${notebook.id}`, notebook);
      }
      localforage.setItem('notebooks', state.notebooks.map(notebook => notebook.id));
    }
  }, [state.notebooks]);

  // Persist encrypted store
  useEffect(() => {
    if (!loading) {
      for (const notebookId in state.encrypteds) {
        const messages = state.encrypteds[notebookId];
        if (!messages) return;
        localforage.setItem(`messages/${notebookId}`, Object.keys(messages));
        for (const message of Object.values(messages)) {
          localforage.setItem(`messages/${notebookId}/${message.id}`, message);
        }
      }
    }
  }, [state.encrypteds]);

  // Persist prefs
  useEffect(() => {
    if (!loading) {
      localforage.setItem('preferences', state.prefs);
    }
  }, [state.prefs]);

  // Close context on click-away
  useEffect(() => {
    const handler = ev => {
      if (state.contextMenu.visible) {
        const menu = document.querySelector('.ContextMenu');
        if (menu && !menu.contains(ev.target)) {
          setState(s => ({ ...s, ...closedContextMenu(s) }));
        }
      }
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [state.contextMenu.visible]);

  // Focus menus and modals on open
  useEffect(() => {
    if (state.showAppSettings) {
      focusElement('.AppSettingsModal');
    } else if (state.showNotebookSettings) {
      focusElement('.NotebookSettingsModal');
    } else if (state.contextMenu.visible) {
      const menu = document.querySelector('.ContextMenu');
      if (menu) {
        (menu.children.length > 1 ? menu : menu.children[0]).focus();
      };
    } else if (state.selectedNotebookId) {
      messageInputRef.current?.focus();
    }
  }, [state.showAppSettings, state.showNotebookSettings, state.contextMenu.visible, state.selectedNotebookId]);

  // Handle closables on ESC press
  useEffect(() => {
    const handler = ev => {
      if (ev.key==='Escape') {
        if (state.showAppSettings) {
          setState(s => ({ ...s, showAppSettings: false }));
        } else if (state.contextMenu.visible) {
          setState(s => ({ ...s, ...closedContextMenu(s) }));
        } else if (state.showNotebookSettings) {
          setState(s => ({ ...s, showNotebookSettings: false }));
        } else if (state.selectedNotebookId) {
          setState(s => ({ ...s, selectedNotebookId: null }));
        }
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [state.showAppSettings, state.showNotebookSettings, state.selectedNotebookId, state.contextMenu.visible]);

  // Set CSS theme
  useEffect(() => (document.documentElement.dataset.theme = state.prefs.colorScheme), [state.prefs.colorScheme]);

  // Set message textarea CSS
  useEffect(() => (messageInputRef.current && Object.assign(messageInputRef.current.style, state.prefs.messageInput)), [state.prefs.messageInput, state.selectedNotebookId, messageInputRef.current]);

  const createNotebook = useCallback(async (type) => {
    let id = /* (type === 'local' ? */ generateUUID(); /* : prompt('Remote ID:')); */
    // if (!id) return;
    const now = Date.now();
    //const ecdsa = await genEcdsaP256();
    const notebook = {
      id, name: `${STRINGS.get('Notebook')} ${now}`, description: '',
      emoji: randomEmoji(), color: randomColor(),
      parseMode: "markdown", // sourceType: type,
      nextMessageId: 1, created: now,
      aesKeyB64: await exportJwk(await genAesKey()),
      ...(state.debugMode && { hmacKeyB64: await exportJwk(await genHmacKey()) }),
      //...(state.debugMode && { ecdsaPrivB64: await exportJwk(ecdsa.privateKey), ecdsaPubB64: await exportJwk(ecdsa.publicKey) }),
    };
    setState(s => ({ ...s,
      notebooks: [ ...s.notebooks, notebook ],
      encrypteds: { ...s.encrypteds, [id]: {} },
      messages: { ...s.messages, [id]: {} },
      createModal: false,
    }));
    // if (type==='remote') {
    //   await fetch(`/notebook/${id}`, {
    //     method: 'POST', headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({ publicKey: pubB64 }),
    //   });
    // }
  }, [state.notebooks]);

  const setNotebook = useCallback(newNotebook => setState(s => ({ ...s, notebooks: s.notebooks.map(oldNotebook => (oldNotebook.id===newNotebook.id ? newNotebook : oldNotebook)) })));
  const getNotebook = useCallback(notebookId => (state.notebooks.find(notebook => (notebook.id === notebookId)) || NOTEBOOKS[notebookId]), [state.notebooks]);
  const deleteNotebook = useCallback(async (notebookId) => {
    const messagesList = Object.keys(getMessages(notebookId));
    setState(s => {
      delete s.messages[notebookId];
      delete s.encrypteds[notebookId];
      return ({ ...s,
        notebooks: s.notebooks.filter(notebook => (notebook.id !== notebookId)),
      });
    });
    await Promise.all([
      localforage.removeItem(`notebooks/${notebookId}`),
      localforage.removeItem(`messages/${notebookId}`),
      ...messagesList.map(messageId => localforage.removeItem(`messages/${notebookId}/${messageId}`)),
    ]);
  });
  const upsyncNotebook = useCallback(notebookId => callApi('PUT', `notebook/${notebookId}`, notebookId, deleteKeys(getNotebook(notebookId), ['aesKeyB64'])));

  const getMessages = useCallback((notebookId) => (state.messages[notebookId] || NOTEBOOKS[notebookId]?.messages || {}), [state.messages]);
  const getMessage = useCallback((notebookId, messageId) => getMessages(notebookId)[messageId], [state.messages]);

  const saveMessage = async (notebookId, message) => await persistMessages(notebookId, { ...getMessages(notebookId), [message.id]: message });
  const deleteMessage = async (notebookId, messageId) => {
    const messages = getMessages(notebookId);
    delete messages[messageId];
    await persistMessages(notebookId, messages);
    localforage.removeItem(`messages/${notebookId}/${messageId}`);
  };
  const copyMessage = message => navigator.clipboard.writeText(message.text);

  const persistMessages = useCallback(async (notebookId, messages) => {
    const notebook = getNotebook(notebookId);
    // if (!notebook) return;
    const rawKey = await getAesRawKey(notebook.aesKeyB64);
    const encrypteds = {};
    await Promise.all(Object.values(messages).map(async message => (encrypteds[message.id] = await encryptMessage(message, rawKey))));
    setState(s => ({ ...s,
      encrypteds: { ...s.encrypteds, [notebookId]: encrypteds },
      messages: { ...s.messages, [notebookId]: messages },
    }));
    // if (notebook.sourceType==='remote') {
    //   const priv = await importJwk(notebook.edPrivB64, { name: 'Ed25519', namedCurve: 'Ed25519' }, ['sign']),
    //         payload = new TextEncoder().encode(JSON.stringify(encArr)),
    //         sig = bufToB64(await crypto.subtle.sign('Ed25519', priv, payload));
    //   await fetch(`/notebook/${nbId}/sync`, {
    //     method: 'PUT', headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({ encryptedArr: encArr, signature: sig, publicKey: notebook.edPubB64 }),
    //   });
    // }
  }, [state.notebooks]);

  const addReaction = useCallback(messageId => setState(s => ({ ...s, reactionInputFor: messageId })), []); // TODO focus input box
  const confirmReaction = useCallback(async (messageId, emoji) => {
    setState(s => ({ ...s, reactionInputFor: null }));
    if (!emoji) return;
    const notebookId = state.selectedNotebookId;
    const message = getMessage(notebookId, messageId);
    if (!(emoji in message.reactions)) {
      message.reactions[emoji] = true;
      saveMessage(notebookId, message);
    }
  }, [state.selectedNotebookId, state.messages, persistMessages]);
  const removeReaction = useCallback(async (messageId, emoji) => {
    const notebookId = state.selectedNotebookId;
    const message = getMessage(notebookId, messageId);
    if (emoji in message.reactions) {
      delete message.reactions[emoji];
      saveMessage(notebookId, message);
    }
  }, [state.selectedNotebookId, state.messages, persistMessages]);
  useEffect(() => setState(s => ({ ...s, reactionInputFor: null })), [state.selectedNotebookId]);

  // Editing effect: prefill textarea when entering edit mode
  useEffect(() => {
    if (state.editingMessage!=null && messageInputRef.current) {
      const message = state.messages[state.selectedNotebookId]?.[state.editingMessage];
      if (message) {
        messageInputRef.current.value = message.text;
        textareaInputHandler(messageInputRef.current);
      }
    }
  }, [state.editingMessage, state.selectedNotebookId]);

  // Focus reaction input area on click
  useEffect(() => (state.reactionInputFor && focusElement(`.Message[data-message-id="${state.reactionInputFor}"] .ReactionInput`)), [state.reactionInputFor]);

  // Scroll to last sent messagge on opening notebook
  useEffect(() => (!loading && state.selectedNotebookId!=null && state.scrollToMessageId==null && scrollToMessage()), [state.selectedNotebookId, loading]);

  const sendMessage = useCallback(async () => {
    const notebookId = state.selectedNotebookId;
    //if (!notebookId) return;
    const text = messageInputRef.current.value.trim();
    if (!text) return;
    const notebook = getNotebook(notebookId);
    let message = getMessage(notebookId, state.editingMessage);
    if (!message) {
      message = {
        id: notebook.nextMessageId,
        created: Date.now(),
        replyTo: state.replyingTo,
        reactions: {},
      };
    }
    message = { ...message, text, edited: (state.editingMessage!=null ? (text !== message.text ? Date.now() : message.edited) : false) };
    // update nextMessageId if new
    setState(s => ({ ...s, notebooks: s.notebooks.map(notebook => notebook.id===notebookId
      ? { ...notebook, nextMessageId: (state.editingMessage==null ? notebook.nextMessageId+1 : notebook.nextMessageId) }
      : notebook
    ) }));
    await saveMessage(notebookId, message);
    setState(s => ({ ...s, editingMessage: null, replyingTo: null }));
    messageInputRef.current.value = '';
    messageInputRef.current.style.minHeight = null;
    scrollToMessage(message.id);
  }, [state.selectedNotebookId, state.editingMessage, state.replyingTo, state.messages, state.notebooks]);

  // Keep message input area focused
  useEffect(() => {
    if (state.selectedNotebookId && messageInputRef.current) {
      messageInputRef.current.focus();
    }
  }, [state.editingMessage, state.replyingTo, state.selectedNotebookId, loading, sendMessage]);

  return html`
    <${AppContext.Provider} value=${{
      state, setState, callApi,
      createNotebook, getNotebook, setNotebook, deleteNotebook, upsyncNotebook,
      getMessages, getMessage, sendMessage, persistMessages,
      saveMessage, deleteMessage, copyMessage,
      addReaction, confirmReaction, removeReaction,
    }}>
      <div class="App ${state.selectedNotebookId ? 'show-chat' : ''}">
        <${ChatList} />
        <${ChatScreen} messageInputRef=${messageInputRef} />
        ${state.createModal && html`<${CreateModal} />`}
        ${state.crossReplyModal && html`<${CrossReplyModal} />`}
        ${state.showNotebookSettings && html`<${NotebookSettingsModal} />`}
        ${state.showAppSettings && html`<${AppSettingsModal} />`}
        ${state.contextMenu.visible && html`<${ContextMenu} />`}
        ${state.dateTimeModal!==null && html`<${DateTimeModal} />`}
        ${state.searchModal.visible && html`<${SearchModal} />`}
      </div>
    <//>
  `;
}

function ChatList() {
  const {state, setState, getMessages} = useContext(AppContext);
  const sortNotebook = (notebook) => Math.max(notebook.created, ...Object.values(getMessages(notebook.id) || []).map(message => message.created));
  return html`
    <div class="ChatList">
      <div class="ChatList-header">
        <button onClick=${() => setState(s => ({ ...s, createModal: true }))}>＋</button>
        <!-- <button onClick=${() => setState(s => ({ ...s, searchModal: { visible: true, global: true, query: '' } }))}>🔍</button> -->
        <button onClick=${() => setState(s => ({ ...s, showAppSettings: true }))}>⚙️</button>
      </div>
      ${[ ...state.notebooks.sort((a, b) => (sortNotebook(b) - sortNotebook(a))), ...Object.values(NOTEBOOKS) ].map(notebook => html`
        <button class="NotebookButton" key=${notebook.id} onClick=${() => setState(s => ({ ...s, selectedNotebookId: notebook.id }))}>
          <div class="NotebookTitle">
            <div class="NotebookEmoji" style=${{ background: notebook.color }}>${notebook.emoji}</div>
            <h4 class="NotebookName">${notebook.name}</h4>
          </div>
          <div class="NotebookDescription">${escapeHtml(notebook.description) || html`<i>${STRINGS.get('No description')}</i>`}</div>
          <div class="NotebookPreview">
            ${Object.values(getMessages(notebook.id)).slice(-1)[0]?.text || html`<i>${STRINGS.get('No notes')}</i>`}
          </div>
        </button>
      `)}
    </div>
  `;
}

function ChatScreen({messageInputRef}) {
  const {state, setState, sendMessage, getMessage, getMessages, getNotebook} = useContext(AppContext);
  const notebook = getNotebook(state.selectedNotebookId);
  if (!notebook) return null;
  const messages = Object.values(getMessages(notebook.id)).sort((a, b) => (a.created - b.created));
  // Scroll on request
  useEffect(() => {
    if (state.scrollToMessageId != null) {
      scrollToMessage(state.scrollToMessageId);
      setState(s => ({ ...s, scrollToMessageId: null }));
    }
  }, [state.scrollToMessageId, state.selectedNotebookId]);
  return html`
    <div class="ChatScreen">
      <div class="ChatHeader" onClick=${() => setState(s => ({ ...s, showNotebookSettings: true }))} onKeyDown=${clickOnEnter} tabindex=0 role="button">
        <button class="BackButton"
          onClick=${ev => {
            ev.stopPropagation();
            setState(s => ({ ...s, selectedNotebookId: null, showNotebookSettings: false }));
          }}>
          ←
        </button>
        <div class="NotebookEmoji" style=${{ background: notebook.color }}>${notebook.emoji}</div>
        <h3>${notebook.name}</h3>
        <!-- <button class="SearchButton"
          onClick=${ev => {
            ev.stopPropagation();
            setState(s => ({ ...s, searchModal: { visible: true, global: false, query: '' }}));
          }}>
          🔍
        </button> -->
      </div>
      <div class="Messages">
        ${messages.map(message => html`<${Message} message=${message} notebook=${notebook} />`)}
      </div>
      ${!notebook.readonly && html`<div class="SendBar">
        ${state.replyingTo && html`
          <div class="ReplyPreview">
            <span class="ReplyPreviewText">${STRINGS.get('Reply to')}: "${
              getMessage(state.replyingTo.notebookId, state.replyingTo.messageId)?.text || ''
            }"</span>
            <button onClick=${() => setState(s => ({ ...s, replyingTo: null }))}>×</button>
          </div>`}
        <textarea ref=${messageInputRef} class="EditArea" autofocus onKeyDown=${ev => {
          const hasFine = matchMedia('(pointer: fine)').matches;
          const hasCoarse = matchMedia('(pointer: coarse)').matches;
          const isMobile = hasCoarse && !hasFine;
          if (!isMobile && ev.key==='Enter' && !ev.shiftKey) {
            ev.preventDefault();
            sendMessage();
          }
        }} onInput=${ev => textareaInputHandler(ev.target)} />
        <button onClick=${sendMessage}>${state.editingMessage!=null ? STRINGS.get('Save') : STRINGS.get('Send')}</button>
      </div>`}
    </div>
  `;
}

function Message({message, notebook}) {
  const {
    state, setState, getMessage, getNotebook,
    addReaction, confirmReaction, removeReaction
  } = useContext(AppContext);
  const rendered = renderTextMessage(message.text, notebook);
  return html`
    <div class="Message" data-message-id=${message.id} tabindex=0
      onKeyDown=${ev => (ev.key==='Enter' && ev.target.dispatchEvent(new MouseEvent('contextmenu', { clientX: (window.innerWidth / 2), clientY: (window.innerHeight / 2) })))}
      onContextMenu=${ev => {
        ev.preventDefault();
        setState(s => ({ ...s, contextMenu: { visible: true, messageId: message.id, x: ev.clientX, y: ev.clientY } }));
      }}>
      ${message.replyTo && html`
        <div class="ReplyIndicator" onKeyDown=${clickOnEnter} tabindex=0
          onClick=${() => setState(s => ({ ...state,
            selectedNotebookId: message.replyTo.notebookId,
            scrollToMessageId: (message.replyTo.messageId || message.replyTo.id),
          }))}>
          ${STRINGS.get('Reply to')}: "${
            getMessage(message.replyTo.notebookId, (message.replyTo.messageId || message.replyTo.id))?.text || ''
          }"
        </div>`}
      <div dangerouslySetInnerHTML=${{ __html: rendered }} />
      ${(() => {
        const url = getFirstLink(rendered);
        if (url) {
          return html`<div class="embed">
            <iframe src=${url} sandbox=""></iframe>
          </div>`;
        }
      })()}
      <div class="reactions">
        ${Object.keys(message.reactions || {}).map(reaction => html`
          <button onClick=${() => removeReaction(message.id, reaction)} disabled=${notebook.readonly}>${reaction}</button>
        `)}
        ${!notebook.readonly && (state.reactionInputFor===message.id
          ? html`<input type="text" class="ReactionInput" maxlength=2 autofocus enterkeyhint="done" onKeyDown=${ev => {
              if (ev.key==='Enter') {
                confirmReaction(message.id, ev.target.value);
                ev.target.value = '';
              }
            }} />`
          : html`<button class="AddReactionBtn" onClick=${() => addReaction(message.id)}>➕</button>`
        )}
      </div>
      <div class="Timestamp">${new Date(message.created).toLocaleString()}${message.edited ? ` (${STRINGS.get('Edited').toLowerCase()})` : ''}</div>
    </div>
  `
}

function CreateModal() {
  const {createNotebook, setState} = useContext(AppContext);
  createNotebook('local');
  return '';
  // return html`
  //   <div class="CreateModal">
  //     <h3>Create Notebook</h3>
  //     <button onClick=${() => createNotebook('local')}>Local Notebook</button>
  //     <button onClick=${() => createNotebook('remote')}>Remote Notebook</button>
  //     <button onClick=${() => setState(s => ({ ...s, createModal: false }))}>Cancel</button>
  //   </div>
  // `;
}

function CrossReplyModal() {
  const {state, setState} = useContext(AppContext);
  return html`
    <div class="CrossReplyModal">
      <h3>${STRINGS.get('Reply in Another Notebook')}</h3>
      ${state.notebooks.filter(notebook => notebook.id!==state.crossReplySource.notebookId).map(notebook => html`
        <button onClick=${() => setState(s => ({ ...s,
          selectedNotebookId: notebook.id,
          replyingTo: s.crossReplySource,
          crossReplyModal: false,
        }))}>${notebook.emoji} ${notebook.name}</button>
      `)}
      <button onClick=${() => setState(s => ({ ...s, crossReplyModal: false }))}>${STRINGS.get('Cancel')}</button>
    </div>
  `;
}

function ContextMenu() {
  const {state, setState, getNotebook, getMessage, copyMessage, deleteMessage} = useContext(AppContext);
  const messageId = state.contextMenu.messageId;
  const notebook = getNotebook(state.selectedNotebookId);
  if (!notebook) return;
  const message = getMessage(notebook.id, messageId);
  const setFinalState = state => setState(s => ({ ...s, ...state, ...closedContextMenu(s) }));
  const handle = action => {
    switch (action) {
      case 'reply':
        return setFinalState({ replyingTo: { notebookId: notebook.id, messageId: message.id } });
      case 'cross-reply':
        return setFinalState({ crossReplyModal: true, crossReplySource: { notebookId: notebook.id, messageId: message.id } });
      case 'copy':
        copyMessage(message);
        return setFinalState();
      case 'edit':
        return setFinalState({ editingMessage: messageId });
      case 'datetime':
        return setFinalState({ dateTimeModal: messageId });
      case 'delete':
        if (confirm(STRINGS.get('Delete?'))) {
          deleteMessage(notebook.id, messageId);
        }
        return setFinalState();
    }
  };
  return html`
    <div class="ContextMenu" style=${`left: ${state.contextMenu.x}px; top: ${state.contextMenu.y}px;`} tabindex=-1>
      <button class="ContextMenuItem" onClick=${() => handle('copy')}>📜 ${STRINGS.get('Copy to Clipboard')}</button>
      ${!notebook.readonly && html`
        <button class="ContextMenuItem" onClick=${() => handle('reply')}>🔁 ${STRINGS.get('Reply')}</button>
        <button class="ContextMenuItem" onClick=${() => handle('cross-reply')}>🔂 ${STRINGS.get('Reply in Another Notebook')}</button>
        <button class="ContextMenuItem" onClick=${() => handle('edit')}>📝 ${STRINGS.get('Edit')}</button>
        <!--<button class="ContextMenuItem" onClick=${() => handle('move')}>📦 ${STRINGS.get('Move')}</button>-->
        <button class="ContextMenuItem" onClick=${() => handle('datetime')}>⏰ ${STRINGS.get('Set Date/Time')}</button>
        <button class="ContextMenuItem" onClick=${() => handle('delete')}>❌ ${STRINGS.get('Delete')}</button>
      `}
    </div>
  `;
}

function DateTimeModal() {
  const {state, setState, getMessage, saveMessage} = useContext(AppContext);
  const messageId = state.dateTimeModal;
  const notebookId = state.selectedNotebookId;
  const message = getMessage(notebookId, messageId);
  const [dt, setDt] = useState('');
  useEffect(() => (message && setDt(new Date(message.created).toISOString().slice(0, 16))), [message]);
  const save = () => {
    const timestamp = new Date(dt).getTime();
    if (!isNaN(timestamp)) {
      saveMessage(notebookId, { ...message, created: timestamp });
      setState(s => ({ ...s, dateTimeModal: null }));
    }
  };
  return html`
    <div class="DateTimeModal">
      <h3>${STRINGS.get('Set Date/Time')}</h3>
      <input type="datetime-local" value=${dt} onChange=${ev => setDt(ev.target.value)}/>
      <button onClick=${save}>${STRINGS.get('Save')}</button>
      <button onClick=${() => setState(s => ({ ...s, dateTimeModal: null }))}>${STRINGS.get('Cancel')}</button>
    </div>
  `;
}

function NotebookSettingsModal() {
  const {state, setState, callApi, getNotebook, setNotebook, deleteNotebook, upsyncNotebook, getMessages, saveMessage} = useContext(AppContext);
  const notebook = getNotebook(state.selectedNotebookId);
  if (!notebook) return;
  const [form, setForm] = useState({ ...notebook });
  useEffect(() => {
    setForm({ ...notebook });
  }, [notebook.id]);
  const save = () => {
    setNotebook(form);
    setState(s => ({ ...s, showNotebookSettings: false }));
  };
  const del = () => {
    if (confirm(STRINGS.get('Delete?'))) {
      // if (notebook.sourceType==='local') {
      deleteNotebook(notebook.id);
      setState(s => ({ ...s, selectedNotebookId: null, showNotebookSettings: false }));
    }
  };
  const [accesses, setAccesses] = useState([]);
  if (state.debugMode) {
    useEffect(() => {
      let cancelled = false;
      setAccesses([]);
      callApi('GET', `access/${notebook.id}`, notebook.id).then(data => (!cancelled && data?.accesses && setAccesses(Object.entries(data.accesses).map(([key, values]) => ({ id: key, ...values })))));
      return () => { cancelled = true };
    }, []);
  }
  return html`
    <div class="NotebookSettingsModal" tabindex=-1>
      <div class="ModalHeader">
        <h3>${STRINGS.get('Info/Settings')}</h3>
        <button onClick=${() => setState(s => ({ ...s, showNotebookSettings: false }))}>${STRINGS.get('Close')}</button>
      </div>
      <p><label>${STRINGS.get('Name')}: <input type="text" value=${form.name} onChange=${ev => setForm(f => ({ ...f, name: ev.target.value }))} disabled=${notebook.readonly} /></label></p>
      <p><label>Emoji: <input type="text" value=${form.emoji} maxLength=2 onChange=${ev => setForm(f => ({ ...f, emoji: ev.target.value }))} disabled=${notebook.readonly} /></label></p>
      <p><label>${STRINGS.get('Color')}: <input type="color" value=${form.color || 'transparent'} onChange=${ev => setForm(f => ({ ...f, color: ev.target.value }))} disabled=${notebook.readonly} /></label></p>
      <p><label>${STRINGS.get('Description')}: <textarea style=${{ minHeight: makeTextareaHeight(form.description) }} onChange=${ev => setForm(f => ({ ...f, description: ev.target.value }))} onInput=${ev => textareaInputHandler(ev.target)} disabled=${notebook.readonly}>${form.description}</textarea></label></p>
      <p><label>Parse Mode: <select value=${form.parseMode || UNSPECIFIEDS.parseMode} onChange=${ev => setForm(f => ({ ...f, parseMode: ev.target.value }))} disabled=${notebook.readonly}>
        <option value="plaintext">Plaintext</option>
        <option value="markdown">Markdown</option>
      </select></label></p>
      ${state.debugMode && html`
        <h4>Debug Experiments</h4>
        <p>
          <input type="text" placeholder="Notebook ID" value=${form.id} onChange=${ev => setForm(f => ({ ...f, id: ev.target.value }))} />
          <button onClick=${() => setState(s => ({ ...s, notebooks: [...s.notebooks, form], selectedNotebookId: null }))}>Move Notebook to ID</button>
        </p>
        <p>
          <button onClick=${() => callApi('POST', 'notebook', notebook.id, notebook)}>Create Remote Notebook</button>
          <button onClick=${() => callApi('DELETE', `notebook/${notebook.id}`, notebook.id)}>Delete Remote Notebook</button>
        </p>
        <p>
          <button onClick=${() => upsyncNotebook(notebook.id)}>Upsync Notebook Details</button>
          <button onClick=${() => callApi('GET', `notebook/${notebook.id}`, notebook.id).then(data => setNotebook({ ...notebook, ...data.notebook }))}>Downsync Notebook details</button>
        </p>
        <p>
          <button onClick=${() => Object.values(getMessages(notebook.id)).map(message => callApi('PUT', `message/${notebook.id}/${message.id}`, notebook.id, message))}>Upsync All Messages</button>
          <button onClick=${() => callApi('GET', `notebook/${notebook.id}`, notebook.id).then(data => data.messages.forEach(messageId => callApi('GET', `message/${notebook.id}/${messageId}`, notebook.id).then(data => saveMessage(notebook.id, data.message))))}>Downsync All Messages</button>
        </p>
        ${accesses.map(access => html`
          <p>
            ${access.id}
            <button onClick=${() => callApi('DELETE', `access/${notebook.id}/${access.id}`, notebook.id)}>Delete</button>
            <input type="text" disabled value="${location.href.split('#')[0]}#?notebook=${notebook.id}&key=${notebook.aesKeyB64}&token=${access.id}" />
          </p>
        `)}
        <button onClick=${() => callApi('POST', `access/${notebook.id}`, notebook.id)}>Create New Access</button>
      `}
      <p>
        ${' '}<button onClick=${save} disabled=${notebook.readonly}>${STRINGS.get('Save')}</button>
        ${' '}<button onClick=${del} style="color:red" disabled=${notebook.readonly}>${STRINGS.get('Delete')}</button>
      </p>
    </div>
  `;
}

function SearchModal() {
  const {state, setState, getNotebook} = useContext(AppContext);
  const {query, global} = state.searchModal;
  const results = (global
    ? state.notebooks.flatMap(notebook => (state.messages[notebook.id] || []).map(message => ({ ...message, notebook })))
    : (state.messages[state.selectedNotebookId] || []).map(message => ({ ...message, notebook: getNotebook(state.selectedNotebookId) }))
  ).filter(message => message.text.toLowerCase().includes(query.toLowerCase()));
  const select = (notebookId, messageId) => setState(s => ({ ...s, selectedNotebookId: notebookId, searchModal: { ...s.searchModal, visible: false }, scrollToMessageId: messageId }));
  return html`
    <div class="SearchModal">
      <h3>${global ? 'Global' : 'Notebook'} Search</h3>
      <input placeholder="Search..." value=${query} onInput=${ev => setState(s => ({ ...s, searchModal: { ...s.searchModal, query: ev.target.value }}))}/>
      ${results.map(result => html`
        <div class="SearchResult" onClick=${() => select(result.notebook.id, result.id)}>
          ${global && html`<div class="NotebookTitle">
            <div class="NotebookEmoji" style=${{ background: result.notebook.color }}>${result.notebook.emoji}</div>
            <strong>${result.notebook.name}</strong>
          </div>`}
          <div>${result.text}</div><em>${new Date(result.created).toLocaleString()}</em>
        </div>
      `)}
      <button onClick=${() => setState(s => ({ ...s, searchModal: { ...s.searchModal, visible: false }}))}>${STRINGS.get('Close')}</button>
    </div>
  `;
}

function AppSettingsModal() {
  const {state, setState} = useContext(AppContext);
  const [importTxt, setImportTxt] = useState('');
  const exportData = () => JSON.stringify({
    preferences: state.prefs,
    notebooks: state.notebooks,
    messages: Object.fromEntries(Object.entries(state.encrypteds).map(([key, values]) => ([key, Object.values(values)]))),
  }, null, 2);
  const doImport = () => {
    try {
      const obj = JSON.parse(importTxt);
      if (obj.notebooks && obj.messages) {
        setState(s => ({ ...s,
          prefs: obj.preferences,
          notebooks: obj.notebooks,
          encrypteds: Object.fromEntries(Object.entries(obj.messages).map(([notebookId, messages]) => ([notebookId, Object.fromEntries(messages.map(message => [message.id, message]))]))),
        }));
        // window.location.reload();
        setState(s => ({ ...s, showAppSettings: false }));
      } else {
        alert(STRINGS.get('Invalid data format'));
      }
    } catch (err) {
      console.error(err);
      alert(STRINGS.get('Invalid JSON syntax'));
    }
  };
  return html`
    <div class="AppSettingsModal" tabindex=-1>
      <div class="ModalHeader">
        <h3>${STRINGS.get('App Settings')}</h3>
        <button onClick=${() => setState(s => ({ ...s, showAppSettings: false }))}>${STRINGS.get('Close')}</button>
      </div>
      <h4>${STRINGS.get('Aesthetics')}</h4>
      <p><label>${STRINGS.get('Color Scheme')}: <select value=${state.prefs.colorScheme} onChange=${ev => setState(s => ({ ...s, prefs: { ...s.prefs, colorScheme: ev.target.value } }))}>
        <option value="system" default>Auto (${STRINGS.get('System')})</option>
        <option value="light">${STRINGS.get('Light')}</option>
        <option value="dark">${STRINGS.get('Dark')}</option>
      </select></label></p>
      <p>
        <label>${STRINGS.get('Message Input Font')}:</label> <select value=${state.prefs.messageInput?.fontFamily} onChange=${ev => setState(s => ({ ...s, prefs: { ...s.prefs, messageInput: { ...s.prefs.messageInput, fontFamily: ev.target.value } } }))}>
          <option value="" default>${STRINGS.get('Default')} (Browser)</option>
          <option value="monospace">Monospace</option>
          <option value="serif">Serif</option>
          <option value="sans-serif">Sans-Serif</option>
          <option value="cursive">Cursive</option>
          <option value="fantasy">Fantasy</option>
        </select> <input type=number placeholder="${STRINGS.get('Size')} (pt)" min=6 max=20 value=${state.prefs.messageInput?.fontSize?.slice(0, -2)} onChange=${ev => setState(s => ({ ...s, prefs: { ...s.prefs, messageInput: { ...s.prefs.messageInput, fontSize: (ev.target.value ? `${ev.target.value}pt` : '') } } }))} onInput=${ev => ev.target.dispatchEvent(new InputEvent('change'))} />
      </p>
      <p><label>${STRINGS.get('Language')}: <select value=${state.prefs.language} onChange=${ev => setState(s => ({ ...s, prefs: { ...s.prefs, language: ev.target.value }}))}>
        <option value="" default>Auto (${STRINGS.get('System')})</option>
        <option value="en">🇬🇧 English</option>
        <option value="it">🇮🇹 Italiano</option>
      </select></label></p>
      <h4>${STRINGS.get('Export Data')}</h4>
      <textarea readonly rows=8>${exportData()}</textarea>
      <h4>${STRINGS.get('Import Data')}</h4>
      <textarea rows=8 placeholder=${STRINGS.get('Paste JSON')} onInput=${ev => setImportTxt(ev.target.value)} />
      <button onClick=${doImport}>${STRINGS.get('Import Data')}</button>
      <!--<h4>Other</h4>
      <label><input type="checkbox" checked=${state.debugMode} onChange=${ev => setState(s => ({ ...s, debugMode: ev.target.checked }))} /> Experimental/Debug features ${state.debugMode && html`(resets on restart)`}</label>-->
      <br /><br />
    </div>
  `;
}

document.querySelector('body > noscript').remove();
render(html`<${App} />`, document.body);

};