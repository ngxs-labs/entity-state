export type EntitySelector<T> = string | string[] | ((T) => boolean) | null;
export interface Payload<T> {
  payload: T;
}
export type Updater<T> = Partial<T> | ((entity: T) => Partial<T>);
