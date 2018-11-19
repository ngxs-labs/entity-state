import {Component} from '@angular/core';
import {Select, Store} from '@ngxs/store';
import {AddOrReplace, ClearActive, Remove, RemoveActive, Reset, SetActive, SetError, SetLoading, Update, UpdateActive} from 'entity-state';
import {ToDo, TodoState} from './store/todo';
import {Observable} from 'rxjs';

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

  private counter = 0;
  private loading = false;
  private error = false;

  constructor(private store: Store) {
  }

  toggleLoading() {
    this.loading = !this.loading;
    this.store.dispatch(SetLoading(TodoState, this.loading));
  }

  removeToDo(title: string) {
    // this.store.dispatch(Remove(TodoState, title));
    this.store.dispatch(new TodoState.remove(title));
  }

  removeAllDones() {
    this.store.dispatch(new TodoState.remove(e => e.done));
  }

  setDone(toDo: ToDo) {
    this.store.dispatch(Update(TodoState, toDo.title, {
      done: true
    }));
  }

  setOddDone() {
    this.store.dispatch(Update(TodoState,
      (e => parseInt(e.title.substring(18), 10) % 2 === 1), // select all ToDos with odd suffix
      {done: true} // set them done
    ));
  }

  updateDescription() {
    this.store.dispatch(Update(TodoState,
      (e => e.done), // select all done ToDos
      (e => { // custom update function: Update their description
        e.description += ' -- This is done!';
        return e;
      })
    ));
  }

  closeDetails() {
    this.store.dispatch(ClearActive(TodoState));
  }

  toggleError() {
    this.error = !this.error;
    this.store.dispatch(SetError(TodoState, this.error ? new Error('Example error') : undefined));
  }

  setDoneActive() {
    this.store.dispatch(UpdateActive(TodoState, {
      done: true
    }));
  }

  open(title: string) {
    this.store.dispatch(SetActive(TodoState, title));
  }

  removeFirstThree(toDos: ToDo[]) {
    this.removeMultiple(toDos.slice(0, 3).map(t => t.title));
  }

  removeMultiple(titles: string[]) {
    this.store.dispatch(Remove(TodoState, titles));
  }

  clearEntities() {
    // TODO: select all with null ?
    // Akita does it this way. I like it because you have to explicitly say so
    this.store.dispatch(Remove(TodoState, null));
  }

  addToDo() {
    this.store.dispatch(AddOrReplace(TodoState, {
      title: 'NGXS Entity Store ' + (++this.counter),
      description: 'Some Descr' + this.counter,
      done: false
    }));
  }

  doneAll() {
    this.store.dispatch(Update(
      TodoState,
      null, // select all -- TODO: add alias?
      {done: true}
    ));
  }

  // --------- for tests ---------

  resetState() {
    this.store.dispatch(Reset(TodoState));
  }

  updateMultiple() {
    this.store.dispatch(Update(TodoState,
      ['NGXS Entity Store 1', 'NGXS Entity Store 2'],
      {done: true}
    ));
  }

  addMultiple() {
    this.store.dispatch(AddOrReplace(TodoState,
      [
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
      ]
    ));
  }

  updateActiveWithFn() {
    this.store.dispatch(UpdateActive(TodoState,
      (e => {
        e.description += ' -- Updated with Fn';
        return e;
      })
    ));
  }

  removeActive() {
    this.store.dispatch(RemoveActive(TodoState));
  }

}
