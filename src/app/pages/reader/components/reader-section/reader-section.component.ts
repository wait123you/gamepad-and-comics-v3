import { Component } from '@angular/core';
import {  CurrentService } from '../../services/current.service';
import { ReaderSectionService } from './reader-section.service';
import { DataService } from '../../services/data.service';

@Component({
  selector: 'app-reader-section',
  templateUrl: './reader-section.component.html',
  styleUrls: ['./reader-section.component.scss']
})
export class ReaderSectionComponent {
  is_locked=true;
  constructor(
    public current:CurrentService,
    public data:DataService,
    public readerSection:ReaderSectionService
    ){

      if (this.data.chapters[0].is_locked === undefined) this.is_locked = false;
  }
  ngAfterViewInit() {
   const node:any=document.querySelector(`#_${this.data.chapter_id}`);
   setTimeout(()=>{
    node.focus()
   },0)
  }
  on(data:any) {
    this.readerSection.close();
    this.current._chapterChange(data.id)
    this.current.readerNavbarBar$.next(false)
  }
}
