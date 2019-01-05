import { Component } from '@angular/core';
import { Select, Store } from '@ngxs/store';
import {
  Add,
  ClearActive,
  CreateOrReplace,
  GoToPage,
  Remove,
  RemoveActive,
  Reset,
  SetActive,
  SetError,
  SetLoading,
  SetPageSize,
  Update,
  UpdateActive
} from '@ngxs-labs/entity-state';
import { Observable } from 'rxjs';
import { ToDo, TodoState } from './store/todo';
import { mergeMap } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  @Select(TodoState.size) count$: Observable<number>;
  @Select(TodoState.entities) toDos$: Observable<ToDo[]>;
  @Select(TodoState.active) active$: Observable<ToDo>;
  @Select(TodoState.activeId) activeId$: Observable<string>;
  @Select(TodoState.keys) keys$: Observable<string[]>;
  @Select(TodoState.loading) loading$: Observable<boolean>;
  @Select(TodoState.error) error$: Observable<Error | undefined>;
  @Select(TodoState.latestId) latestId$: Observable<string>;
  @Select(TodoState.latest) latest$: Observable<ToDo>;

  private counter = 0;
  private loading = false;
  private error = false;

  constructor(private store: Store) {}

  toggleLoading() {
    this.loading = !this.loading;
    this.store.dispatch(new SetLoading(TodoState, this.loading));
  }

  removeToDo(title: string) {
    this.store.dispatch(new Remove(TodoState, title));
  }

  removeAllDones() {
    this.store.dispatch(new Remove(TodoState, e => e.done));
  }

  setDone(toDo: ToDo) {
    this.store.dispatch(
      new Update(TodoState, toDo.title, {
        done: true
      })
    );
  }

  setOddDone() {
    this.store.dispatch(
      new Update(
        TodoState,
        e => parseInt(e.title.substring(18), 10) % 2 === 1, // select all ToDos with odd suffix
        { done: true } // set them done
      )
    );
  }

  updateDescription() {
    this.store.dispatch(
      new Update(
        TodoState,
        e => e.done, // select all done ToDos
        e => {
          // custom update function: Update their description
          return { ...e, description: e.description + ' -- This is done!' };
        }
      )
    );
  }

  closeDetails() {
    this.store.dispatch(new ClearActive(TodoState));
  }

  toggleError() {
    this.error = !this.error;
    this.store.dispatch(
      new SetError(TodoState, this.error ? new Error('Example error') : undefined)
    );
  }

  setDoneActive() {
    this.store.dispatch(
      new UpdateActive(TodoState, {
        done: true
      })
    );
  }

  open(title: string) {
    this.store.dispatch(new SetActive(TodoState, title));
  }

  removeFirstThree(toDos: ToDo[]) {
    this.removeMultiple(toDos.slice(0, 3).map(t => t.title));
  }

  removeMultiple(titles: string[]) {
    this.store.dispatch(new Remove(TodoState, titles));
  }

  clearEntities() {
    // TODO: select all with null ?
    // Akita does it this way. I like it because you have to explicitly say so
    this.store.dispatch(new Remove(TodoState, null));
  }

  addToDo() {
    this.store.dispatch(
      new Add(TodoState, {
        title: 'NGXS Entity Store ' + ++this.counter,
        description: 'Some Descr' + this.counter,
        done: false
      })
    );
  }

  doneAll() {
    this.store.dispatch(
      new Update(
        TodoState,
        null, // select all -- TODO: add alias?
        { done: true }
      )
    );
  }

  // --------- for tests ---------

  createOrReplace(title: string) {
    this.store.dispatch(
      new CreateOrReplace(TodoState, {
        title,
        description: 'Some Descr' + title,
        done: false
      })
    );
  }

  resetState() {
    this.store.dispatch(new Reset(TodoState));
  }

  updateMultiple() {
    this.store.dispatch(
      new Update(TodoState, ['NGXS Entity Store 1', 'NGXS Entity Store 2'], { done: true })
    );
  }

  addMultiple() {
    this.store.dispatch(
      new Add(TodoState, [
        {
          title: 'NGXS Entity Store 1',
          description: 'Some Descr 1',
          done: false
        },
        {
          title: 'NGXS Entity Store 2',
          description: 'Some Descr 2',
          done: false
        }
      ])
    );
  }

  updateActiveWithFn(): Observable<any> {
    return this.store.dispatch(
      new UpdateActive(TodoState, e => ({
        ...e,
        description: e.description + ' -- Updated with Fn'
      }))
    );
  }

  removeActive() {
    this.store.dispatch(new RemoveActive(TodoState));
  }

  getPaginatedEntities(size: number, page: number): Observable<ToDo[]> {
    return this.store
      .dispatch([new SetPageSize(TodoState, size), new GoToPage(TodoState, { page })])
      .pipe(mergeMap(() => this.store.selectOnce(TodoState.paginatedEntities)));
  }

  getNthEntity(index: number): ToDo {
    return this.store.selectSnapshot(TodoState.nthEntity(index));
  }
}
