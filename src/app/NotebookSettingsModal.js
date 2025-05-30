function NotebookSettingsModal({ctx}) {
  const {html, AppContext, STRINGS, UNSPECIFIEDS, makeTextareaHeight, textareaInputHandler} = ctx;
  const {state, setState, callApi, getNotebook, setNotebook, deleteNotebook, upsyncNotebook, getMessages, saveMessage} = useContext(AppContext);
  const notebook = getNotebook(state.selectedNotebookId);
  if (!notebook) return;

  const [form, setForm] = useState({ ...notebook });
  useEffect(() => setForm({ ...notebook }), [notebook.id]);

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

  if (state.prefs.debugMode) {
    useEffect(() => {
      let cancelled = false;
      setAccesses([]);
      callApi('GET', `access/${notebook.id}`, notebook.id).then(data => (!cancelled && data?.accesses && setAccesses(Object.entries(data.accesses).map(([key, values]) => ({ id: key, ...values })))));
      return () => { cancelled = true };
    }, []);
  }

  return html`
    <div class="NotebookSettingsModal" tabindex=-1>
      <${ModalHeader} title="Info/Settings">
        <button onClick=${() => setState(s => ({ ...s, showNotebookSettings: false }))}>${STRINGS.get('Close')}</button>
      <//>

      <${SchemaForm} schema=${SCHEMA.definitions.notebook}>
        <p><label>
          ${STRINGS.get('Name')}:
          <${SchemaField} type="text" name="name" value=${form.name} disabled=${notebook.readonly}
            onChange=${ev => setForm(f => ({ ...f, name: ev.target.value }))} />
        </label></p>

        <p><label>
          Emoji:
          <${SchemaField} type="text" name="emoji" value=${form.emoji} maxLength=2
            onChange=${ev => setForm(f => ({ ...f, emoji: ev.target.value }))} disabled=${notebook.readonly} />
        </label></p>

        <p><label>
          ${STRINGS.get('Color')}:
          <input type="color" value=${form.color || 'transparent'} disabled=${notebook.readonly}
            onChange=${ev => setForm(f => ({ ...f, color: ev.target.value }))} />
        </label></p>

        <p><label>
          ${STRINGS.get('Description')}:
          <${SchemaField} type="textarea" name="description" style=${{ minHeight: makeTextareaHeight(form.description) }}
            onChange=${ev => setForm(f => ({ ...f, description: ev.target.value }))}
            onInput=${ev => textareaInputHandler(ev.target)} disabled=${notebook.readonly} value=${form.description} />
        </label></p>

        <p><label>Parse Mode: <select value=${form.parseMode || UNSPECIFIEDS.parseMode} onChange=${ev => setForm(f => ({ ...f, parseMode: ev.target.value }))} disabled=${notebook.readonly}>
          <option value="plaintext">Plaintext</option>
          <option value="markdown">Markdown</option>
        </select></label></p>
      <//>

      ${state.prefs.debugMode && html`
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
          <button onClick=${() => Object.values(getMessages(notebook.id)).map(message => callApi('PUT', `message/${notebook.id}/${message.id}`, notebook.id, message).then(data => saveMessage(notebook.id, { ...message, ...data.message })))}>Upsync All Messages</button>
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