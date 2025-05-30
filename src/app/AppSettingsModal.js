function AppSettingsModal({ctx}) {
  const {html, AppContext, STRINGS} = ctx;
  const {state, setState, getNotebook} = useContext(AppContext);

  const mapMessages = (messages, mapper) => Object.fromEntries(Object.entries(messages).map(([notebookId, messages]) => ([notebookId, mapper(messages)])));

  const exportData = () => JSON.stringify({
    preferences: state.prefs,
    notebooks: state.notebooks,
    messages: mapMessages(state.encrypteds, messages => Object.values(messages)),
  }, null, 2);

  const exportDataNotebook = (notebook) => JSON.stringify({
    notebooks: [notebook],
    messages: {[notebook.id]: Object.values(state.encrypteds[notebook.id])},
  }, null, 2);

  const [exportTxt, setExportTxt] = useState(exportData());
  const [importTxt, setImportTxt] = useState('');
  const [importReset, setImportReset] = useState(false);

  const importData = () => {
    try {
      const obj = JSON.parse(importTxt);
      // TODO: decrypt messages on import, otherwise the notebooks will appear empty until a reload
      // TODO: delete duplicate notebooks when importing without reset
      // TODO: block the app until import is complete
      if (obj.notebooks && obj.messages) {
        if (importReset) {
          setState(s => ({ ...s,
            prefs: obj.preferences || {},
            notebooks: obj.notebooks,
            encrypteds: mapMessages(obj.messages, messages => Object.fromEntries(messages.map(message => [message.id, message]))),
          }));  
        } else {
          setState(s => ({ ...s,
            prefs: { ...s.prefs, ...obj.preferences },
            notebooks: [ ...s.notebooks, ...obj.notebooks ],
            encrypteds: { ...s.encrypteds, ...mapMessages(obj.messages, messages => Object.fromEntries(messages.map(message => [message.id, message]))) },
          }));  
        }
        setState(s => ({ ...s, showAppSettings: false }));
      } else {
        alert(STRINGS.get('Invalid data format'));
      }
    } catch (err) {
      console.error(err);
      alert(STRINGS.get('Invalid JSON syntax'));
    }
  };

  const AestheticsSettings = () => html`
    <h4>${STRINGS.get('Aesthetics')}</h4>

    <p><label>${STRINGS.get('Color Scheme')}: <select value=${state.prefs.colorScheme} onChange=${ev => setState(s => ({ ...s, prefs: { ...s.prefs, colorScheme: ev.target.value } }))}>
      <option value="system" default>Auto (${STRINGS.get('System')})</option>
      <option value="light">${STRINGS.get('Light')}</option>
      <option value="dark">${STRINGS.get('Dark')}</option>
    </select></label></p>

    <p>
      <label>${STRINGS.get('Message Input Font')}:
      </label> <select value=${state.prefs.messageInput?.fontFamily} onChange=${ev => setState(s => ({ ...s, prefs: { ...s.prefs, messageInput: { ...s.prefs.messageInput, fontFamily: ev.target.value } } }))}>
        <option value="" default>${STRINGS.get('Default')} (Browser)</option>
        <option value="monospace">Monospace</option>
        <option value="serif">Serif</option>
        <option value="sans-serif">Sans-Serif</option>
        <option value="cursive">Cursive</option>
        <option value="fantasy">Fantasy</option>
      </select> <input type=number placeholder="${STRINGS.get('Size')} (pt)" min=6 max=20 value=${state.prefs.messageInput?.fontSize?.slice(0, -2)}
        onChange=${ev => setState(s => ({ ...s, prefs: { ...s.prefs, messageInput: { ...s.prefs.messageInput, fontSize: (ev.target.value ? `${ev.target.value}pt` : '') } } }))}
        onInput=${ev => ev.target.dispatchEvent(new InputEvent('change'))} />
    </p>

    <p><label>${STRINGS.get('Language')}: <select value=${state.prefs.language} onChange=${ev => setState(s => ({ ...s, prefs: { ...s.prefs, language: ev.target.value }}))}>
      <option value="" default>Auto (${STRINGS.get('System')})</option>
      <option value="en">🇬🇧 English</option>
      <option value="it">🇮🇹 Italiano</option>
    </select></label></p>
  `;

  return html`
    <div class="AppSettingsModal" tabindex=-1>
      <${ModalHeader} title="App Settings">
        <button onClick=${() => setState(s => ({ ...s, showAppSettings: false }))}>${STRINGS.get('Close')}</button>
      <//>

      <${AestheticsSettings} />

      <h4>${STRINGS.get('Export Data')}</h4>
      <select onChange=${ev => setExportTxt(ev.target.value ? exportDataNotebook(getNotebook(ev.target.value)) : exportData())}>
        <option value="">${STRINGS.get('Full')}</option>
        ${state.notebooks.map(notebook => html`<option value="${notebook.id}">${notebook.emoji} ${notebook.name}</option>`)}
      </select>
      <textarea readonly rows=8 onFocus=${ev => ev.target.setSelectionRange(0, -1)}>${exportTxt}</textarea>

      <h4>${STRINGS.get('Import Data')}</h4>
      <textarea rows=8 placeholder=${STRINGS.get('Paste JSON')} onInput=${ev => setImportTxt(ev.target.value)} />
      <label><input type="checkbox" checked=${importReset} onChange=${ev => setImportReset(ev.target.checked)} />${STRINGS.get('Reset Data on Import')}</label>
      <span> </span>
      <button onClick=${importData}>${STRINGS.get('Import Data')}</button>

      <!--
      <h4>Other</h4>
      <label><input type="checkbox" checked=${state.prefs.debugMode} onChange=${ev => setState(s => ({ ...s, prefs: { ...s.prefs, debugMode: ev.target.checked } }))} /> ⚠ Dangerous Experimental/Debug Features</label>
      -->
    </div>
  `;
}