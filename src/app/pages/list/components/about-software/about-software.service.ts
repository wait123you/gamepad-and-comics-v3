import { Injectable } from '@angular/core';
import { AboutSoftwareComponent } from './about-software.component';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { GamepadEventService } from 'src/app/library/public-api';

@Injectable({
  providedIn: 'root'
})
export class AboutSoftwareService {

  public opened=false;
  constructor(
    public _dialog: MatDialog,
    public GamepadEvent:GamepadEventService
  ) {
    GamepadEvent.registerAreaEvent('menu_search', {
      B: () => setTimeout(() => this.close())
    })
    GamepadEvent.registerConfig('menu_search', {
      region: ['menu_search_input','menu_search_comics_item'],
    });
  }
  open(config:MatDialogConfig) {
    if (this.opened == false) {
      this.opened = true;

      const dialogRef = this._dialog.open(AboutSoftwareComponent, {
        panelClass: "_controller_settings",
        ...config
      });
      document.body.setAttribute("locked_region", "menu_search")
      dialogRef.afterClosed().subscribe(result => {
        if (document.body.getAttribute("locked_region") == "menu_search" && this.opened) document.body.setAttribute("locked_region",document.body.getAttribute("router"))
        this.opened = false;
      });
    }
  }


  close() {
    this._dialog.closeAll();
  }
}
