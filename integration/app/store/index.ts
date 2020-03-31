import { NgModule } from '@angular/core';
import { NgxsModule } from '@ngxs/store';
import { TodoState, AnotherState } from './todo';
import { NgxsLoggerPluginModule } from '@ngxs/logger-plugin';

const states = [TodoState, AnotherState];

@NgModule({
  imports: [
    NgxsModule.forRoot(states, { developmentMode: true }),
    NgxsLoggerPluginModule.forRoot()
  ],
  exports: [NgxsModule],
  declarations: [],
  providers: []
})
export class StoreModule {}
