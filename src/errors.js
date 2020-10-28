const getTextByState = (state, data, sym = '-') => `\n${sym.repeat(20)}\nGET ERROR during ${state} ${data}\n`;
const getTextByMsg = (msg, sym = '-') => `${sym.repeat(20)}\n${msg}\n${sym.repeat(20)}`;

export default (state, msg, data) => `${getTextByState(state, data)}${getTextByMsg(msg)}`;
