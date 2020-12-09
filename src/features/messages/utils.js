export function addMessage(state, message, peer, refs) {
  message.id = state.nextMessageId;

  if (refs !== undefined) {
    const originalMessage = state.byId[refs];
    if (originalMessage) {
      originalMessage.responseId = message.id;
    }
  }

  state.byId[message.id] = message;
  state.nextMessageId += 1;

  let idList = state.uavIdsToMessageIds[peer];
  if (!idList) {
    idList = [];
    state.uavIdsToMessageIds[peer] = idList;
  }

  idList.push(message.id);

  return message.id;
}
