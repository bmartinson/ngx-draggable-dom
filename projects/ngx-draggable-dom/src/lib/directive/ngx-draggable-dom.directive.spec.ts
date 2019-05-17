import { TestBed } from "@angular/core/testing";

import { NgxDraggableDomDirective } from "./directive/ngx-draggable-dom.directive";

describe("NgxDraggableDomDirective", () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it("should be created", () => {
    const directive: NgxDraggableDomDirective = TestBed.get(NgxDraggableDomDirective);
    expect(directive).toBeTruthy();
  });
});
