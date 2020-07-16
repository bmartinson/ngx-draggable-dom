import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, QueryList, ViewChildren, ViewRef } from '@angular/core';
import {
  NgxDraggableDomBoundsCheckEvent,
  NgxDraggableDomDirective,
  NgxDraggableDomMoveEvent,
} from '../../projects/ngx-draggable-dom/src/public_api';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
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

  /**
   * Event handler that prints a move event's name and the data contained in the event.
   *
   * @param name The name of the event we are executing for.
   * @param event The event to print data for.
   */
  public onPrintMoveEvent(name: string, event: NgxDraggableDomMoveEvent): void {
    console.log(name, event.position);
  }

  /**
   * Event handler that prints an edge event's name and the data contained in the event.
   *
   * @param name The name of the event we are executing for.
   * @param event The event to print data for.
   */
  public onPrintEdgeEvent(name: string, event: NgxDraggableDomBoundsCheckEvent): void {
    console.log(name, event);
  }

}
