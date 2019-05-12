import { Component, ViewChildren, QueryList } from "@angular/core";
import { NgxDraggableDomDirective } from "../../projects/ngx-draggable-dom/src/public_api";

@Component({
  selector: "ngx-dd-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"]
})
export class AppComponent {


  @ViewChildren(NgxDraggableDomDirective) private draggableElements !: QueryList<NgxDraggableDomDirective>;

  /**
   * Event handler that shows the leverage of the directive reset.
   */
  public onResetTranslations(): void {
    if (!!this.draggableElements) {
      this.draggableElements.forEach((el: NgxDraggableDomDirective) => {
        el.reset();
      });
    }
  }

}
