import { State, StateContext, Action } from '@ngxs/store';

export class UpdateAnotherState {
    static type = 'UpdateAnotherState';
}

@State<number>({
  name: 'another',
  defaults: 0
})
export class AnotherState {
    @Action(UpdateAnotherState)
    update(ctx: StateContext<number>) {
        ctx.setState(Math.random()) ;
    }
}
