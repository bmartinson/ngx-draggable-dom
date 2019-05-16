import { Component, ViewChildren, QueryList, ChangeDetectorRef, ChangeDetectionStrategy } from "@angular/core";
import { NgxDraggableDomDirective } from "../../projects/ngx-draggable-dom/src/public_api";

@Component({
  selector: "ngx-dd-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent {

  @ViewChildren(NgxDraggableDomDirective) private draggableElements !: QueryList<NgxDraggableDomDirective>;

  constructor(private changeRef: ChangeDetectorRef) {
    this.changeRef.detach();
  }

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
