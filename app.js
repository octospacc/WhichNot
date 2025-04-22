window.appMain = () => {

const html = htm.bind(h);
const AppContext = createContext();

localforage.config({ name: "WhichNot" });
navigator.storage.persist();

// marked.use({ renderer: {
//   image({ href, title, text }) { // allow embedding any media with ![]()
//     title = (title ? ` title="${escapeHtml(title)}"` : '');
//     return `<object data="${href}" alt="${text}" title="${title}">
//       <embed src="${href}" alt="${text}" title="${title}" />
//       ${text}
//     </object>`;
//   }
// } });

const STRINGS = {
  "Notebook": { it: "Quaderno" },
  "Copy": { it: "Copia" },
  "Reply": { it: "Rispondi" },
  "Reply in Another Notebook": { it: "Rispondi in un Altro Quaderno" },
  "Reply to": { it: "Risposta a" },
  "Edit": { it: "Modifica" },
  "Edited": { it: "Modificato" },
  "Set Date/Time": { it: "Imposta Data/Ora" },
  "Send": { it: "Invia" },
  "Save": { it: "Salva" },
  "Delete": { it: "Elimina" },
  "Cancel": { it: "Annulla" },
  "Close": { it: "Chiudi" },
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
      {
        text: "**WhichNot is finally released and REAL!!!** BILLIONS MUST ENJOY!!!",
        created: "2025-04-20T23:00",
        reactions: { "💝": true },
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
}
const generateUUID = () => uuidv7(); // crypto.randomUUID();
const genAESKey = async () => crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
// const genEd25519 = async () => crypto.subtle.generateKey({ name: 'Ed25519', namedCurve: 'Ed25519' }, true, ['sign', 'verify']);
const exportJWK = async (key) => btoa(JSON.stringify(await crypto.subtle.exportKey('jwk', key)));
const importJWK = async (b64, alg, usages) => crypto.subtle.importKey('jwk', JSON.parse(atob(b64)), alg, true, usages);
const randBytes = (n=12) => {
  const b = new Uint8Array(n);
  crypto.getRandomValues(b);
  return b;
}
const bufToB64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const b64ToBuf = (str) => Uint8Array.from(atob(str), (c => c.charCodeAt(0)));
const deriveMsgKey = async (rawKey, salt) => crypto.subtle.deriveKey(
  { name: 'HKDF', salt, info: new TextEncoder().encode('msg'), hash: 'SHA-256' }, 
  await crypto.subtle.importKey('raw', rawKey, 'HKDF', false, ['deriveKey']), 
  { name: 'AES-GCM', length: 256 }, 
  true, ['encrypt', 'decrypt']);
const getAesRawKey = async (aesKeyB64) => await crypto.subtle.exportKey('raw', await importJWK(aesKeyB64, { name: 'AES-GCM' }, ['encrypt','decrypt']));

const encryptMessage = async (message, rawKey) => {
  const salt = randBytes();
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
}
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

const closedContextMenu = s => ({ contextMenu: { ...s.contextMenu, visible: false } });

function App() {
  const [state, setState] = useState({
    notebooks: [], encrypteds: {}, messages: {},
    selectedNotebookId: null, scrollToMessageId: null,
    showNotebookSettings: false, showAppSettings: false,
    createModal: false, dateTimeModal: null,
    crossReplyModal: false, crossReplySource: null,
    contextMenu:{ visible: false, messageId: null, x: 0, y: 0 },
    searchModal: { visible: false, global: false, query: '' },
    editingMessage: null, replyingTo: null, reactionInputFor: null,
  });
  const messageInputRef = useRef();
  const [loading, setLoading] = useState(true);

  // Load data from storage
  useEffect(() => {
    (async () => {
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
      setState(s => ({ ...s, notebooks, encrypteds: encryptedsStore, messages: messagesStore }));
      setLoading(false);
    })();
  }, []);

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

  const createNotebook = useCallback(async (type) => {
    let id = /* (type === 'local' ? */ generateUUID(); /* : prompt('Remote ID:')); */
    // if (!id) return;
    const now = Date.now();
    // const ed = await genEd25519();
    const notebook = {
      id, name: `${STRINGS.get('Notebook')} ${now}`, description: '',
      emoji: randomEmoji(), color: randomColor(),
      parseMode: "markdown", // sourceType: type,
      nextMessageId: 1, created: now,
      aesKeyB64: await exportJWK(await genAESKey()), // edPrivB64: await exportJWK(ed.privateKey), edPubB64: await exportJWK(ed.publicKey),
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

  const getNotebook = useCallback(notebookId => (state.notebooks.find(notebook => (notebook.id === notebookId)) || NOTEBOOKS[notebookId]), [state.notebooks]);
  const deleteNotebook = (notebookId) => {
    const messagesList = Object.keys(getMessages(notebookId));
    setState(s => ({ ...s,
      notebooks: s.notebooks.filter(notebook => (notebook.id !== notebookId)),
      messages: { ...s.messages, [notebookId]: undefined },
      encrypteds: { ...s.encrypteds, [notebookId]: undefined },
    }));
    localforage.removeItem(`notebooks/${notebookId}`);
    localforage.removeItem(`messages/${notebookId}`);
    for (const messageId of messagesList) {
      localforage.removeItem(`messages/${notebookId}/${messageId}`);
    }
  };

  const getMessages = useCallback((notebookId) => (state.messages[notebookId] || NOTEBOOKS[notebookId]?.messages || {}), [state.messages]);
  const getMessage = useCallback((notebookId, messageId) => getMessages(notebookId)[messageId], [state.messages]);

  const saveMessage = (notebookId, message) => persistMessages(notebookId, { ...getMessages(notebookId), [message.id]: message });
  const deleteMessage = (notebookId, messageId) => {
    const messages = getMessages(notebookId);
    delete messages[messageId];
    persistMessages(notebookId, messages);
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
    //   const priv = await importJWK(notebook.edPrivB64, { name: 'Ed25519', namedCurve: 'Ed25519' }, ['sign']),
    //         payload = new TextEncoder().encode(JSON.stringify(encArr)),
    //         sig = bufToB64(await crypto.subtle.sign('Ed25519', priv, payload));
    //   await fetch(`/notebook/${nbId}/sync`, {
    //     method: 'PUT', headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({ encryptedArr: encArr, signature: sig, publicKey: notebook.edPubB64 }),
    //   });
    // }
  }, [state.notebooks]);

  const addReaction = useCallback(messageId => setState(s => ({ ...s, reactionInputFor: messageId })), []);
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
      }
    }
  }, [state.editingMessage, state.selectedNotebookId, state.messages]);

  useEffect(() => (state.scrollToMessageId==null && Array.from(document.querySelectorAll('.Message[data-message-id]')).slice(-1)[0]?.scrollIntoView({ behavior: 'smooth', block: 'start' })), [state.selectedNotebookId]);

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
    message = { ...message, text, edited: (state.editingMessage!=null ? Date.now() : false), };
    messageInputRef.current.value = '';
    // update nextMessageId if new
    setState(s => ({ ...s, notebooks: s.notebooks.map(notebook => notebook.id===notebookId
      ? { ...notebook, nextMessageId: (state.editingMessage==null ? notebook.nextMessageId+1 : notebook.nextMessageId) }
      : notebook
    ) }));
    saveMessage(notebookId, message);
    setState( s => ({ ...s, editingMessage: null, replyingTo: null }));
  }, [state.selectedNotebookId, state.editingMessage, state.replyingTo, state.messages, state.notebooks]);

  return html`
    <${AppContext.Provider} value=${{
      state, setState, createNotebook,
      getNotebook, deleteNotebook,
      getMessages, getMessage,
      sendMessage, persistMessages,
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
      document.querySelector(`.Message[data-message-id="${state.scrollToMessageId}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setState(s => ({ ...s, scrollToMessageId: null }));
    }
  }, [state.scrollToMessageId, state.selectedNotebookId]);
  return html`
    <div class="ChatScreen">
      <div class="ChatHeader" onClick=${() => setState(s => ({ ...s, showNotebookSettings: true }))} onKeyDown=${ev => (ev.key==='Enter' && ev.target.click())} tabindex=0 role="button">
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
            <span>${STRINGS.get('Reply to')}: "${
              getMessage(state.replyingTo.notebookId, state.replyingTo.messageId)?.text || ''
            }"</span>
            <button onClick=${() => setState(s => ({ ...s, replyingTo: null }))}>×</button>
          </div>`}
        <textarea ref=${messageInputRef} class="EditArea" onKeyDown=${ev => ev.key==='Enter' && !ev.shiftKey && sendMessage()}/>
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
    <div class="Message" data-message-id=${message.id}
      onContextMenu=${ev => {
        ev.preventDefault();
        setState(s => ({ ...s, contextMenu: { visible: true, messageId: message.id, x: ev.clientX, y: ev.clientY } }));
      }}>
      ${message.replyTo && html`
        <div class="ReplyIndicator"
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
          ? html`<input class="ReactionInput" maxlength="2" autofocus onKeyPress=${e => e.key==='Enter' && (confirmReaction(message.id, e.target.value), e.target.value='')} />`
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
        deleteMessage(notebook.id, messageId);
        return setFinalState();
    }
  };
  return html`
    <div class="ContextMenu" style=${`left: ${state.contextMenu.x}px; top: ${state.contextMenu.y}px;`}>
      <div class="ContextMenuItem" onClick=${() => handle('copy')}>📜 ${STRINGS.get('Copy')}</div>
      ${!notebook.readonly && html`
        <div class="ContextMenuItem" onClick=${() => handle('reply')}>🔁 ${STRINGS.get('Reply')}</div>
        <div class="ContextMenuItem" onClick=${() => handle('cross-reply')}>🔂 ${STRINGS.get('Reply in Another Notebook')}</div>
        <div class="ContextMenuItem" onClick=${() => handle('edit')}>📝 ${STRINGS.get('Edit')}</div>
        <div class="ContextMenuItem" onClick=${() => handle('datetime')}>⏰ ${STRINGS.get('Set Date/Time')}</div>
        <div class="ContextMenuItem" onClick=${() => handle('delete')}>❌ ${STRINGS.get('Delete')}</div>
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
  const {state, setState, getNotebook, deleteNotebook} = useContext(AppContext);
  const notebook = getNotebook(state.selectedNotebookId);
  if (!notebook) return;
  const [form, setForm] = useState({ ...notebook });
  useEffect(() => {
    setForm({ ...notebook });
  }, [notebook.id]);
  const save = () => setState(s => ({ ...s, notebooks: s.notebooks.map(n => (n.id===notebook.id ? form : n)), showNotebookSettings: false }));
  const del = () => {
    if (confirm('Delete?')) {
      // if (notebook.sourceType==='local') {
      deleteNotebook(notebook.id);
      setState(s => ({ ...s, selectedNotebookId: null, showNotebookSettings: false }));
    }
  };
  return html`
    <div class="NotebookSettingsModal">
      <h3>${STRINGS.get('Info/Settings')}</h3>
      <p><label>${STRINGS.get('Name')}: <input value=${form.name} onChange=${ev => setForm(f => ({ ...f, name: ev.target.value }))} disabled=${notebook.readonly} /></label></p>
      <p><label>Emoji: <input value=${form.emoji} maxLength="2" onChange=${ev => setForm(f => ({ ...f, emoji: ev.target.value }))} disabled=${notebook.readonly} /></label></p>
      <p><label>${STRINGS.get('Color')}: <input type="color" value=${form.color || 'transparent'} onChange=${ev => setForm(f => ({ ...f, color: ev.target.value }))} disabled=${notebook.readonly} /></label></p>
      <p><label>${STRINGS.get('Description')}: <textarea onChange=${ev => setForm(f => ({ ...f, description: ev.target.value }))} disabled=${notebook.readonly}>${form.description}</textarea></label></p>
      <p><label>Parse Mode: <select value=${form.parseMode || UNSPECIFIEDS.parseMode} onChange=${ev => setForm(f => ({ ...f, parseMode: ev.target.value }))} disabled=${notebook.readonly}>
        <option value="plaintext">Plaintext</option>
        <option value="markdown">Markdown</option>
      </select></label></p>
      <p>
        ${' '}<button onClick=${save} disabled=${notebook.readonly}>${STRINGS.get('Save')}</button>
        ${' '}<button onClick=${del} style="color:red" disabled=${notebook.readonly}>${STRINGS.get('Delete')}</button>
        ${' '}<button onClick=${() => setState(s => ({ ...s, showNotebookSettings: false }))}>${STRINGS.get('Close')}</button>
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
  const exportData = () => JSON.stringify({ notebooks: state.notebooks, messages: Object.fromEntries(Object.entries(state.encrypteds).map(([key, values]) => ([key, Object.values(values)]))) }, null, 2);
  const doImport = () => {
    try {
      const obj = JSON.parse(importTxt);
      if (obj.notebooks && obj.messages) {
        setState(s => ({ ...s,
          notebooks: obj.notebooks,
          encrypteds: Object.fromEntries(Object.entries(obj.messages).map(([notebookId, messages]) => ([notebookId, Object.fromEntries(messages.map(message => [message.id, message]))]))),
        }));
        // window.location.reload();
        setState(s => ({ ...s, showAppSettings:false }));
      } else {
        alert(STRINGS.get('Invalid data format'));
      }
    } catch (err) {
      console.error(err);
      alert(STRINGS.get('Invalid JSON syntax'));
    }
  };
  return html`
    <div class="AppSettingsModal">
      <h3>${STRINGS.get('App Settings')}</h3>
      <h4>${STRINGS.get('Export Data')}</h4><textarea readonly rows="8">${exportData()}</textarea>
      <h4>${STRINGS.get('Import Data')}</h4>
      <textarea rows="6" placeholder=${STRINGS.get('Paste JSON')} onInput=${ev => setImportTxt(ev.target.value)} />
      <button onClick=${doImport}>${STRINGS.get('Import Data')}</button>
      <br /><br />
      <button onClick=${() => setState(s => ({ ...s, showAppSettings:false }))}>${STRINGS.get('Close')}</button>
    </div>
  `;
}

render(html`<${App} />`, document.body);

};