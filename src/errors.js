const getTextByState = (state, url) => `get Error during ${state} ${url}`;
const getTextByMessage = (msg, sym)  => `\n${sym.repeat(6)}\n${msg}\n${sym.repeat(6)}`;

export default (state, url, msg, sym = '-') => `${getTextByState(state, url)}${getTextByMessage(msg, sym)}`;
