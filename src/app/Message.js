function Message({message, notebook, ctx}) {
  const {html, AppContext, STRINGS, UNSPECIFIEDS, escapeHtml, getFirstLink, makeParagraph, linkify, clickOnEnter} = ctx;
  const {state, setState, getMessage, addReaction, confirmReaction, removeReaction} = useContext(AppContext);

  const renderTextMessage = (text, notebook) => {
    const parseMode = notebook.parseMode || UNSPECIFIEDS.parseMode;
    switch (parseMode) {
      case 'plaintext':
        return makeParagraph(linkify(escapeHtml(text)));
      case 'markdown':
        return marked.parse(escapeHtml(text));
    }
  };

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
      <div>
        <span class="Timestamp">${new Date(message.created).toLocaleString()}${message.edited ? ` (${STRINGS.get('Edited').toLowerCase()})` : ''}</span>
        ${state.prefs.debugMode && html`
          <span> </span>
          <span>${message.synced ? '✔' : '⏱'}</span>
        `}
      </div>
    </div>
  `
}