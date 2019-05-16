import { AfterViewInit, Component, ViewChildren, QueryList, ChangeDetectorRef, ChangeDetectionStrategy, ViewRef } from "@angular/core";
import { NgxDraggableDomDirective } from "../../projects/ngx-draggable-dom/src/public_api";

@Component({
  selector: "ngx-dd-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent implements AfterViewInit {

  @ViewChildren(NgxDraggableDomDirective) private draggableElements !: QueryList<NgxDraggableDomDirective>;

  constructor(private changeRef: ChangeDetectorRef) {
    this.changeRef.detach();
  }

  /**
   * Lifecycle hook for when the view is done initializing so we can update it for proper view display.
   */
  public ngAfterViewInit(): void {
    if (this.changeRef) {
      this.changeRef.detectChanges();
    }
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
