import { ComponentFixture, ComponentFixtureAutoDetect, TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { AppModule } from './app.module';
import { Store } from '@ngxs/store';
import { defaultEntityState, NoActiveEntityError } from 'entity-state';

describe('AppComponent', () => {
  let fixture: ComponentFixture<AppComponent>;
  let component: AppComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AppModule],
      providers: [{ provide: ComponentFixtureAutoDetect, useValue: true }]
    });

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;

    const store = TestBed.get(Store);
    store.reset({ todo: defaultEntityState() });
  });

  it('should add a todo', () => {
    component.addToDo();

    component.toDos$.subscribe(state => {
      expect(state.length).toBe(1);
    });
    component.latestId$.subscribe(state => {
      expect(state).toBe('NGXS Entity Store 1');
    });
    component.latest$.subscribe(state => {
      expect(state.description).toBe('Some Descr1');
    });
  });

  it('should update a todo', () => {
    component.addToDo();
    component.setDone({
      title: 'NGXS Entity Store 1',
      description: "Doesn't matter. Just need title for ID",
      done: false
    });

    component.toDos$.subscribe(([state]) => {
      expect(state.title).toBe('NGXS Entity Store 1');
      expect(state.done).toBeTruthy();
    });
  });

  it('should remove a todo', () => {
    component.addToDo();
    component.addToDo();
    component.open('NGXS Entity Store 1');
    component.removeToDo('NGXS Entity Store 1');

    component.toDos$.subscribe(state => {
      expect(state.length).toBe(1);
      expect(state[0].title).toBe('NGXS Entity Store 2');
    });

    component.activeId$.subscribe(state => {
      expect(state).toBeUndefined();
    });

    component.latestId$.subscribe(state => {
      expect(state).toBe('NGXS Entity Store 2');
    });
  });

  it('should add multiple todos', () => {
    component.addMultiple(); // adds 'NGXS Entity Store 1' and 'NGXS Entity Store 2'

    component.toDos$.subscribe(state => {
      expect(state.length).toBe(2);
    });
    component.latestId$.subscribe(state => {
      expect(state).toBe('NGXS Entity Store 2');
    });
  });

  it('should update multiple todos', () => {
    component.addToDo();
    component.addToDo();
    component.addToDo();
    component.updateMultiple(); // updates 1 and 2

    component.toDos$.subscribe(([first, second, third]) => {
      expect(first.title).toBe('NGXS Entity Store 1');
      expect(first.done).toBeTruthy();
      expect(second.title).toBe('NGXS Entity Store 2');
      expect(second.done).toBeTruthy();
      expect(third.title).toBe('NGXS Entity Store 3');
      expect(third.done).toBeFalsy();
    });
  });

  it('should update all todos', () => {
    component.addToDo();
    component.addToDo();
    component.addToDo();
    component.doneAll();

    component.toDos$.subscribe(([first, second, third]) => {
      expect(first.title).toBe('NGXS Entity Store 1');
      expect(first.done).toBeTruthy();
      expect(second.title).toBe('NGXS Entity Store 2');
      expect(second.done).toBeTruthy();
      expect(third.title).toBe('NGXS Entity Store 3');
      expect(third.done).toBeTruthy();
    });
  });

  it('should update multiple todos by selector fn', () => {
    component.addToDo();
    component.addToDo();
    component.addToDo();

    component.setOddDone();

    component.toDos$.subscribe(([first, second, third]) => {
      expect(first.title).toBe('NGXS Entity Store 1');
      expect(first.done).toBeTruthy();
      expect(second.title).toBe('NGXS Entity Store 2');
      expect(second.done).toBeFalsy();
      expect(third.title).toBe('NGXS Entity Store 3');
      expect(third.done).toBeTruthy();
    });
  });

  it('should update multiple todos with update fn', () => {
    component.addToDo();
    component.addToDo();
    component.addToDo();

    component.open('NGXS Entity Store 2');
    component.setDoneActive();
    component.updateDescription();

    component.toDos$.subscribe(([first, second, third]) => {
      expect(first.title).toBe('NGXS Entity Store 1');
      expect(first.description.includes(' -- This is done!')).toBeFalsy();
      expect(second.title).toBe('NGXS Entity Store 2');
      expect(second.description.includes(' -- This is done!')).toBeTruthy();
      expect(third.title).toBe('NGXS Entity Store 3');
      expect(third.description.includes(' -- This is done!')).toBeFalsy();
    });
  });

  it('should throw an error if invalid active id', () => {
    component.addToDo();
    component.addToDo();
    component.addToDo();

    component.open('NGXS Entity Store 5');

    component.updateActiveWithFn().subscribe({
      error: e => expect(e.message).toBe(new NoActiveEntityError().message)
    });
  });

  it('should update active todo with update fn', () => {
    component.addToDo();
    component.addToDo();
    component.addToDo();

    component.open('NGXS Entity Store 2');
    component.updateActiveWithFn();

    component.toDos$.subscribe(([first, second, third]) => {
      expect(first.title).toBe('NGXS Entity Store 1');
      expect(first.description.includes(' -- Updated with Fn')).toBeFalsy();
      expect(second.title).toBe('NGXS Entity Store 2');
      expect(second.description.includes(' -- Updated with Fn')).toBeTruthy();
      expect(third.title).toBe('NGXS Entity Store 3');
      expect(third.description.includes(' -- Updated with Fn')).toBeFalsy();
    });
  });

  it('should remove active', () => {
    component.addToDo();
    component.addToDo();
    component.addToDo();

    component.open('NGXS Entity Store 2');
    component.removeActive();

    component.toDos$.subscribe(([first, second]) => {
      expect(first.title).toBe('NGXS Entity Store 1');
      expect(second.title).toBe('NGXS Entity Store 3');
    });

    component.activeId$.subscribe(id => {
      expect(id).toBeUndefined();
    });
  });

  it('should remove multiple todos', () => {
    component.addToDo(); // NGXS Entity Store 1
    component.open('NGXS Entity Store 1');
    component.addToDo(); // NGXS Entity Store 2
    component.addToDo(); // NGXS Entity Store 3
    component.addToDo(); // NGXS Entity Store 4
    component.addToDo(); // NGXS Entity Store 5
    component.removeMultiple(['NGXS Entity Store 1', 'NGXS Entity Store 2', 'NGXS Entity Store 3']);

    component.toDos$.subscribe(([first]) => {
      expect(first.title).toBe('NGXS Entity Store 4');
    });

    component.activeId$.subscribe(state => {
      expect(state).toBeUndefined();
    });
    component.latestId$.subscribe(state => {
      expect(state).toBe('NGXS Entity Store 5');
    });
  });

  it('should remove multiple todos by function', () => {
    component.addToDo();
    component.open('NGXS Entity Store 1');
    component.setDoneActive();

    component.addToDo();

    component.addToDo();
    component.open('NGXS Entity Store 3');
    component.setDoneActive();

    component.addToDo();
    component.addToDo();
    component.removeAllDones();

    component.toDos$.subscribe(([first]) => {
      expect(first.title).toBe('NGXS Entity Store 2');
    });

    component.count$.subscribe(count => {
      expect(count).toBe(3);
    });
  });

  it('should toggle loading', () => {
    component.toggleLoading();

    component.loading$.subscribe(state => {
      expect(state).toBeTruthy();
    });
  });

  it('should toggle error', () => {
    component.toggleError();

    component.error$.subscribe(state => {
      expect(state instanceof Error).toBeTruthy();
    });
  });

  it('should set active entity', () => {
    component.addToDo();
    component.open('NGXS Entity Store 1');

    component.active$.subscribe(state => {
      expect(state).toBeTruthy();
    });
  });

  it('should update active entity', () => {
    component.addToDo();
    component.addToDo();
    component.addToDo();
    component.open('NGXS Entity Store 2');
    component.setDoneActive();

    component.active$.subscribe(state => {
      expect(state.title).toBe('NGXS Entity Store 2');
      expect(state.done).toBeTruthy();
    });
  });

  it('should clear active entity', () => {
    component.addToDo();
    component.open('NGXS Entity Store 1');
    component.closeDetails();

    component.active$.subscribe(state => {
      expect(state).toBeUndefined();
    });
  });

  it('should remove all entities', () => {
    component.addToDo();
    component.addToDo();
    component.open('NGXS Entity Store 2');
    component.addToDo();
    component.toggleLoading();
    component.toggleError();
    component.clearEntities();

    component.toDos$.subscribe(state => {
      expect(state.length).toBe(0);
    });

    component.activeId$.subscribe(state => {
      expect(state).toBeUndefined();
    });

    component.error$.subscribe(state => {
      expect(state instanceof Error).toBeTruthy();
    });

    component.loading$.subscribe(state => {
      expect(state).toBeTruthy();
    });

    component.latestId$.subscribe(state => {
      expect(state).toBeUndefined();
    });
  });

  it('should completely reset store', () => {
    component.addToDo();
    component.addToDo();
    component.open('NGXS Entity Store 2');
    component.addToDo();
    component.toggleLoading();
    component.toggleError();
    component.resetState();

    component.toDos$.subscribe(state => {
      expect(state.length).toBe(0);
    });

    component.activeId$.subscribe(state => {
      expect(state).toBeUndefined();
    });

    component.error$.subscribe(state => {
      expect(state).toBeUndefined();
    });

    component.loading$.subscribe(state => {
      expect(state).toBeFalsy();
    });

    component.latestId$.subscribe(state => {
      expect(state).toBeUndefined();
    });
  });
});
