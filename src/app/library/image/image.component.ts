import { Component, ElementRef, Input, ViewChild } from '@angular/core';
import { AppDataService, ImageService, MessageFetchService, WorkerService } from 'src/app/library/public-api';

@Component({
  selector: 'app-image',
  templateUrl: './image.component.html',
  styleUrls: ['./image.component.scss']
})
export class ImageComponent {
  @Input() src: string = "";
  @Input() origin: string = "";
  @Input() width: string | number | null = "";
  @Input() height: string | number | null = "";
  @Input() alt: string | number | null = "";
  url: string | undefined
  @ViewChild('box')
  box!: ElementRef;
  @Input() objectFit: string = ""
  constructor(public image: ImageService,
    public WebWorker: WorkerService,
    public App: AppDataService
  ) {
    // console.log(this.src);



  }

  isInViewPort(element) {
    const viewWidth = window.innerWidth || document.documentElement.clientWidth;
    const viewHeight =
      window.innerHeight || document.documentElement.clientHeight;
    const { top, right, bottom, left } = element.getBoundingClientRect();

    return top >= 0 && left >= 0 && right <= viewWidth && bottom <= viewHeight;
  }
  async getImage() {
    this.url = await this.image.getImageToLocalUrl(this.src)
  }

  async getImage2() {
    this.url = await this.WebWorker.UrlToBolbUrl(this.src)
  }

  ngAfterViewInit() {
    if (this.App.is_pwa && this.src.substring(7, 21) == "localhost:7700") {
      this.url = this.src;
    } else {
      if (this.App.is_web_worker && this.src.substring(7, 21) == "localhost:7700") {
         this.image.addTask(() => this.getImage2())
      }else{
        setTimeout(() => {
          this.image.addTask(() => this.getImage())
        })
      }
    }
  }
  ngOnDestroy() {


    // this.image.delBlobUrl(this.src,this.url as any);
  }
}
