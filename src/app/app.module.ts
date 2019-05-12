import { BrowserModule } from "@angular/platform-browser";
import { NgModule } from "@angular/core";
import { AppComponent } from "./app.component";
import { NgxDraggableDomModule } from "../../projects/ngx-draggable-dom/src/public_api";

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
