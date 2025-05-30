window.appMain = () => {

const html = htm.bind(h);
const AppContext = createContext();
const SchemaContext = createContext(null);

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

const {STRINGS, UNSPECIFIEDS, NOTEBOOKS} = initSystemData();

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
const generateUUID = () => uuidv7();
const genAesKey = async () => await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
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
  if (message instanceof HTMLElement) {
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

const ctx = {
  html, AppContext, SchemaContext, STRINGS, UNSPECIFIEDS,
  makeTextareaHeight, textareaInputHandler, clickOnEnter, escapeHtml, getFirstLink, makeParagraph, linkify,
};

function App() {
  const [state, setState] = useState({
    notebooks: [], encrypteds: {}, messages: {},
    prefs: { debugMode: false },
    selectedNotebookId: null, scrollToMessageId: null,
    showNotebookSettings: false, showAppSettings: false,
    createModal: false, dateTimeModal: null,
    crossReplyModal: false, crossReplySource: null,
    contextMenu:{ visible: false, messageId: null, x: 0, y: 0 },
    searchModal: { visible: false, global: false, query: '' },
    editingMessage: null, replyingTo: null, reactionInputFor: null,
  });
  const isFirstHashPush = useRef(true);
  const messageInputRef = useRef();
  const [loading, setLoading] = useState(true);

  // Get UI strings by user-set language
  (get => (STRINGS.get = useCallback(((name, lang=state.prefs.language) => get(name, lang)), [state.prefs.language])))(STRINGS.get);

  const callApi = useCallback(async (method, path, notebookId, body) => {
    try {
      if (body) {
        delete body.aesKeyB64;
        body = JSON.stringify(body);
      }
      const query = `${path}?time=${Date.now()}`;
      const hash = bufToB64(await hmacSha256B64(getNotebook(notebookId).hmacKeyB64, `${method} ${query}|${body || ''}`));
      const data = await (await fetch(`https://whichnot.octt.eu.org/api/${query}`, { method, body, headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "X-WhichNot-Request-Hash": hash,
      } })).json();
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
      await setState(s => ({ ...s, notebooks, encrypteds: encryptedsStore, messages: messagesStore, prefs }));
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (state.prefs.debugMode) {
      state.notebooks.forEach(async notebook => {
        if (!notebook.hmacKeyB64) {
          setNotebook({ ...notebook, hmacKeyB64: await exportJwk(await genHmacKey()) });
        }
      });
    }
  }, [loading]);

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
        // @ts-ignore
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
      ...(state.prefs.debugMode && { hmacKeyB64: await exportJwk(await genHmacKey()) }),
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
        ${state.showNotebookSettings && html`<${NotebookSettingsModal} ctx=${ctx} />`}
        ${state.showAppSettings && html`<${AppSettingsModal} ctx=${ctx} />`}
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
        ${messages.map(message => html`<${Message} message=${message} notebook=${notebook} ctx=${ctx} />`)}
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

window.ModalHeader = function ModalHeader({title, children}) {
  return html`<div class="ModalHeader">
    <h3>${STRINGS.get(title)}</h3>
    ${children}
  </div>`;
}

window.SchemaForm = function SchemaForm({schema, children}) {
  return html`<${SchemaContext.Provider} value=${schema}>${children}<//>`;
}

window.SchemaField = function SchemaField(props) {
  const schema = useContext(SchemaContext).properties[props.name];
  const elem = (props.type === 'textarea' ? html`<textarea><//>` : html`<input />`);
  Object.assign(elem.props, props, schema);
  return elem;
}

document.querySelector('body > noscript')?.remove();
render(html`<${App} />`, document.body);

};