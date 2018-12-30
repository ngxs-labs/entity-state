import { Payload } from './type-alias';
import { Type } from '@angular/core';
import { EntityState } from '../entity-state';
import { generateActionObject } from '../internal';

export type GoToPagePayload =
  | { page: number }
  | { next: true; wrap?: boolean }
  | { prev: true; wrap?: boolean }
  | { last: true }
  | { first: true };
export type GoToPageAction = Payload<GoToPagePayload & { wrap: boolean }>;

export class GoToPage {
  /**
   * Generates an action that changes the page index for pagination
   * @param target The targeted state class
   * @param payload Payload to change the page index
   */
  constructor(target: Type<EntityState<any>>, payload: GoToPagePayload) {
    return generateActionObject('goToPage', target, { wrap: false, ...payload });
  }
}

export type SetPageSizeAction = Payload<number>;

export class SetPageSize {
  /**
   * Generates an action that changes the page size
   * @param target The targeted state class
   * @param payload The page size
   */
  constructor(target: Type<EntityState<any>>, payload: number) {
    return generateActionObject('setPageSize', target, payload);
  }
}
