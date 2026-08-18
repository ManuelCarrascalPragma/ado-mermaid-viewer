export const MessageType = {
  RESCAN: 'RESCAN',
  GET_VERSION: 'GET_VERSION'
};

export function createMessage(type, payload = {}) {
  return { type, ...payload };
}

export function isMessage(msg, type) {
  return msg && msg.type === type;
}