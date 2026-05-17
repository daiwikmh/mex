const WS = typeof globalThis !== "undefined" ? (globalThis as { WebSocket?: typeof WebSocket }).WebSocket : undefined;

export { WS as WebSocket };
export default WS;
