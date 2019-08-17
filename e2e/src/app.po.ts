import { browser, by, element } from "protractor";

export class AppPage {
  public navigateTo(): Promise<any> {
    return browser.get(browser.baseUrl) as Promise<any>;
  }

  public getTitleText(): Promise<string> {
    return element(by.css("ngx-dd-root h1")).getText() as Promise<string>;
  }
}
