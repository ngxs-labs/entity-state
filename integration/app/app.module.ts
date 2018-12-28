import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { StoreModule } from './store';

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, StoreModule],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {}
