import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { NgxDraggableDomModule } from '../../projects/ngx-draggable-dom/src/public_api';
import { AppComponent } from './app.component';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    NgxDraggableDomModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
