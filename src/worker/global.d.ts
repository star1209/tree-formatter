// Web Worker 全局类型声明
interface WorkerGlobalScope {
  postMessage(message: any, transfer?: Transferable[]): void;
  onmessage: ((this: WorkerGlobalScope, ev: MessageEvent) => any) | null;
  addEventListener(type: string, listener: EventListenerOrEventListenerObject): void;
  removeEventListener(type: string, listener: EventListenerOrEventListenerObject): void;
}

declare const self: WorkerGlobalScope;

// 声明全局的 addEventListener 和 postMessage
declare function addEventListener(type: string, listener: EventListenerOrEventListenerObject): void;
declare function postMessage(message: any): void;