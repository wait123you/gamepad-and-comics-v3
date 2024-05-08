import { Injectable } from '@angular/core';
import { DataService } from '../../services/data.service';
import { NgxIndexedDBService } from 'ngx-indexed-db';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MenuService {

  key = "_gh_menu";
  opened = true;
  mode = 'side';

  constructor(public data: DataService,
    public webDb: NgxIndexedDBService,

  ) {


  }

  async init(){

    await this.get();
  }

  open() {
    if (!this.opened) this.opened = true;
  }
  isToggle() {
    this.opened = !this.opened;
  }
  close() {
    if (this.opened) this.opened = false;
  }

  async post() {
    return await firstValueFrom(this.webDb.update("data", {
      id: this.key,
      opened: this.opened,
      mode: this.mode
    }))
  }

  async get() {
    const res: any = await firstValueFrom(this.webDb.getByKey("data", this.key))
    console.log(res);

    if (res) {
      this.opened = res.opened;
      this.mode = res.mode;
    }
  }



}
