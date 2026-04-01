export type ToastType = 'success' | 'error' | 'info';

export interface ToastDetail {
  message: string;
  type: ToastType;
  id: number;
}

let _counter = 0;

export function showToast(message: string, type: ToastType = 'info'): void {
  window.dispatchEvent(
    new CustomEvent<ToastDetail>('app:toast', {
      detail: { message, type, id: ++_counter },
    }),
  );
}
