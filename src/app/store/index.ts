import { NgModule } from '@angular/core';
import { NgxsModule } from '@ngxs/store';
import { TodoState } from './todo';
import { NgxsLoggerPluginModule } from '@ngxs/logger-plugin';

const states = [TodoState];

@NgModule({
  imports: [NgxsModule.forRoot(states), NgxsLoggerPluginModule.forRoot()],
  exports: [NgxsModule],
  declarations: [],
  providers: []
})
export class StoreModule {}
