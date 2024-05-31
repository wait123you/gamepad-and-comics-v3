import { Component, HostListener } from '@angular/core';
import { ImageService, GamepadEventService, GamepadControllerService, GamepadInputService, KeyboardEventService, PagesItem } from 'src/app/library/public-api';
import { CurrentService } from '../../services/current.service';
import { DataService } from '../../services/data.service';
import { ZoomService } from '../../services/zoom.service';
declare const Swiper: any;
@Component({
  selector: 'app-one-page-reader-v2-default',
  templateUrl: './one-page-reader-v2-default.component.html',
  styleUrl: './one-page-reader-v2-default.component.scss'
})
export class OnePageReaderV2DefaultComponent {
  swiper = null;
  @HostListener('window:resize', ['$event'])
  resize = (event: KeyboardEvent) => {
    document.documentElement.style.setProperty('--double-page-reader-v2-width', `${(250 / 353) * window.innerHeight }px`);
  }
  change$;
  event$;

  constructor(
    public current: CurrentService,
    public data: DataService,
    public image: ImageService,
    public GamepadEvent: GamepadEventService,
    public GamepadController: GamepadControllerService,
    public GamepadInput: GamepadInputService,
    public KeyboardEvent: KeyboardEventService,
    public zoom:ZoomService

  ) {
    GamepadEvent.registerAreaEventY("page_reader", {
      "LEFT_BUMPER": () => this.zoom.zoom(1),
      "RIGHT_BUMPER": () => this.zoom.zoom(2),
    })

    GamepadEvent.registerAreaEvent('page_reader', {
      "LEFT": () => {
        this.zoom.zoomSize <= 1 ? this.current._pagePrevious() : this.zoom.down("DPAD_LEFT");
      },
      "UP": () => {
        this.zoom.zoomSize <= 1 ? this.current._pagePrevious() : this.zoom.down("DPAD_UP");
      },
      "DOWN": () => {
        this.zoom.zoomSize <= 1 ? this.current._pageNext() : this.zoom.down("DPAD_DOWN");
      },
      "RIGHT": () => {
        this.zoom.zoomSize <= 1 ? this.current._pageNext() : this.zoom.down("DPAD_RIGHT");
      },
      "X": () => {
        this.pageToggle();
      },
      "A": () => {
        this.current._pageNext();
      },
      "LEFT_BUMPER": () => this.zoom.zoomOut(),
      "RIGHT_BUMPER": () => this.zoom.zoomIn(),
      LEFT_TRIGGER: () => {
        current._chapterPrevious();
      },
      RIGHT_TRIGGER: () => {
        current._chapterNext();
      },

    })
    // GamepadEvent.registerAreaEventY('double_page_reader', {
    //   "UP": () => {
    //     current._pagePrevious();
    //     // this.zoomSize <= 1 ? this.previous() : this.down("DPAD_UP");
    //   },
    //   "DOWN": () => {
    //     current._pageNext();
    //     // this.zoomSize <= 1 ? this.next() : this.down("DPAD_DOWN");
    //   },
    //   "LEFT": () => {
    //     current._pagePrevious();
    //     // this.zoomSize <= 1 ? this.previous() : this.down("DPAD_LEFT");
    //   },
    //   "RIGHT": () => {
    //     current._pageNext();
    //     // this.zoomSize <= 1 ? this.next() : this.down("DPAD_RIGHT");
    //   },
    //   X: () => {
    //     this.pageToggle();
    //   },
    //   A: () => {
    //     current._pageNext();
    //   },
    //   B: () => {
    //     window.history.back();
    //   },
    //   // "LEFT_BUMPER": () => this.zoomOut(),
    //   // "RIGHT_BUMPER": () => this.zoomIn(),
    //   // RIGHT_ANALOG_PRESS: () => {
    //   //   this.ReaderNavbarBar.isToggle();
    //   // },

    // })


    this.change$ = this.current.change().subscribe(x => {

      if (x.trigger == 'double_page_reader_v2') return
      if (x.type == "changePage") {
        this.change(x.chapter_id, x.pages, x.page_index)
      } else if (x.type == "changeChapter") {
        this.change(x.chapter_id, x.pages, x.page_index)
      } else if (x.type == "nextPage") {
        this.swiper.slidePrev();
      } else if (x.type == "previousPage") {
        this.swiper.slideNext();
      }
    })
    this.event$ = this.current.event().subscribe(x => {

    })

    this.event$ = this.current.event().subscribe(x => {
      if (x.key == "double_page_reader_FirstPageToggle") {
        this.firstPageToggle();
      } else if (x.key == "double_page_reader_togglePage") {
        this.pageToggle();
      }
    })

    this.init();

    document.documentElement.style.setProperty('--double-page-reader-v2-width', `${(250 / 353) * window.innerHeight }px`);
  }
  firstPageToggle() {
    this.is_first_page_cover = !this.is_first_page_cover;
    if (this.data.page_index == 0) {
      this.pageToggle();
      this.pageToggle();
    } else {

    }
  }

  ngOnDestroy() {
    this.change$.unsubscribe();
    this.event$.unsubscribe();
  }
  isSwitch = false;
  pageToggle() {
    if (this.data.page_index == 0) {
      this.current._pageChange(this.data.page_index);
    } else {
      if (this.data.page_index == this.data.pages.length - 1) {
        this.current._pageChange(this.isSwitch ? this.data.page_index - 1 : this.data.page_index - 1);
        // this.isSwitch = !this.isSwitch;
      } else {
        this.current._pageChange(this.isSwitch ? this.data.page_index - 1 : this.data.page_index + 1);
      }
    }
    this.isSwitch = !this.isSwitch;
  }
  async init() {
    await this.addNextSlide(this.data.chapter_id, this.data.pages, this.data.page_index);
    await this.next();
    await this.previous();
    setTimeout(async () => {
      await this.next();
    })
  }

  async change(chapter_id, pages, page_index) {
    this.objPreviousHtml = {};
    this.objNextHtml = {};
    this.swiper.removeAllSlides();
    await this.addNextSlide(chapter_id, pages, page_index);
    setTimeout(async () => {
      await this.next();
      await this.previous();
      setTimeout(async () => {
        await this.next();
      })
    })
  }
  async updata() {
    const nodes = this.swiper.slides[this.swiper.activeIndex].querySelectorAll("[current_page]");
    let indexs = [];
    for (let index = 0; index < nodes.length; index++) {
      const node = nodes[index];
      indexs.push(parseInt(node.getAttribute("index")))
    }
    const index = indexs.sort((a, b) => b - a)[0] - 1;
    const chapter_id = nodes[0].getAttribute("chapter_id");
    const list = await this.current._getChapter(chapter_id);
    this.current._change('changePage', {
      chapter_id: chapter_id,
      page_index: index,
      trigger: 'double_page_reader_v2'
    });
  }

  async next() {
    const nodes = this.swiper.slides[this.swiper.slides.length - 1].querySelectorAll("[current_page]");
    let indexs = [];
    for (let index = 0; index < nodes.length; index++) {
      const node = nodes[index];
      indexs.push(parseInt(node.getAttribute("index")))
    }
    const index = indexs.sort((a, b) => b - a)[0] + 1;
    const chapter_id = nodes[0].getAttribute("chapter_id");
    const pages = await this.current._getChapter(chapter_id);
    if (index >= pages.length - (nodes.length - 1)) {
      const next_chapter_id = await this.current._getNextChapterId(chapter_id);

      if (next_chapter_id) {
        const res = await this.current._getChapter(next_chapter_id);
        this.addNextSlide(next_chapter_id, res, 0);
        return
      } else {
        return
      }
    } else {
      this.addNextSlide(chapter_id, pages, index)
      return
    }
  }
  async previous() {
    const nodes = this.swiper.slides[0].querySelectorAll("[current_page]");
    let indexs = [];
    for (let index = 0; index < nodes.length; index++) {
      const node = nodes[index];
      indexs.push(parseInt(node.getAttribute("index")))
    }
    const index = indexs.sort((a, b) => a - b)[0] - 1;
    const chapter_id = nodes[0].getAttribute("chapter_id");
    const pages = await this.current._getChapter(chapter_id);

    if (index >= pages.length - (nodes.length - 1)) {
      const next_chapter_id = await this.current._getPreviousChapterId(chapter_id);

      if (next_chapter_id) {
        const res = await this.current._getChapter(next_chapter_id);
        this.addPreviousSlide(next_chapter_id, res, 0);
        return
      } else {
        return
      }
    } else {
      this.addPreviousSlide(chapter_id, pages, index)
      return
    }
  }
  objNextHtml = {};
  objPreviousHtml = {};
  isPageFirst = false;
  is_first_page_cover = true;

  is_1 = false;
  async addNextSlide(chapter_id, list, index: number) {
    if (index < 0) index = 0;

    if (this.objNextHtml[`${chapter_id}_${index}`]) return
    else this.objNextHtml[`${chapter_id}_${index}`] = true;
    const getNextPages = async (list: Array<PagesItem>, index: number) => {
      const total = list.length;
      let page = {
        primary: { src: "", id: null, index: null, width: 0, height: 0, end: false, start: false },
        secondary: { src: "", id: null, index: null, width: 0, height: 0, end: false, start: false }
      }
      const obj = await this.isWideImage(list[index], list[index + 1]);
      if (obj?.primary?.width == obj?.secondary?.width && !this.is_1) {
        document.documentElement.style.setProperty('--double-page-reader-v2-width', `${(obj.primary.width / res.primary.height) * window.innerHeight }px`);
        this.is_1 = true
      }
      obj.secondary = undefined;
      if (this.isPageFirst) {
        this.isPageFirst = false;
        if (this.is_first_page_cover == true && index == 0) {
          obj.secondary = undefined;
        }
      } else {
        if (index == 0 && !this.isSwitch && this.is_first_page_cover == true) {
          obj.secondary = undefined;
        }
        if (index == 0 && this.isSwitch && this.is_first_page_cover == false) {
          obj.secondary = undefined;
        }
      }
      if (index >= (total - 1) && !obj.secondary) {
        if (obj.primary.width < obj.primary.height) page.primary.end = true;
      }
      if (obj.secondary) page.secondary = { ...page.secondary, ...obj.secondary };
      if (obj.primary) page.primary = { ...page.primary, ...obj.primary };

      if (index == 0 && !obj.secondary) {
        if (obj.primary.width < obj.primary.height) page.primary.start = true;
      }
      return page
    }
    const res = await getNextPages(list, index);
    let current = "";
    const c = res.primary.end || res.primary.start || res.secondary.src;

    if (res.primary.src) current = current + `<img  style="width:100%;height: fit-content;margin: auto"  current_page chapter_id=${chapter_id} index=${res.primary.index}  page_id="${res.primary.id}" src="${res.primary.src}" />`;
    if (!!current) {
      this.objNextHtml[`${chapter_id}_${index}`] = current;
      this.prependSlide(current)
    }
  }
  async addPreviousSlide(chapter_id, list, index: number) {
    if (this.objPreviousHtml[`${chapter_id}_${index}`]) return
    else this.objPreviousHtml[`${chapter_id}_${index}`] = true;
    const getPreviousPages = async (list: Array<PagesItem>, index: number) => {
      const total = list.length;
      let page = {
        primary: { src: "", id: null, index: null, width: 0, height: 0, end: false, start: false },
        secondary: { src: "", id: null, index: null, width: 0, height: 0, end: false, start: false }
      }
      const obj = await this.isWideImage(list[index], list[index - 1]);
       obj.secondary = undefined;
      if (index == 0) obj.secondary = undefined;

      if (index >= (total - 1) && !obj.secondary) {
        if (obj.primary.width < obj.primary.height) page.primary.end = true;
      }
      if (obj.secondary) page.secondary = { ...page.secondary, ...obj.secondary };
      if (obj.primary) page.primary = { ...page.primary, ...obj.primary };
      if (index == 0 && !obj.secondary) {
        if (obj.primary.width < obj.primary.height) page.primary.start = true;
      }
      return page
    }
    const res = await getPreviousPages(list, index);
    let current = "";
    const c = res.primary.end || res.primary.start || res.secondary.src;
    if (res.primary.src) current = current + `<img  style="width:100%;height: fit-content;margin: auto"  current_page chapter_id=${chapter_id} index=${res.primary.index}  page_id="${res.primary.id}" src="${res.primary.src}" />`;
    if (!!current) {
      this.objPreviousHtml[`${chapter_id}_${index}`] = current;
      this.appendSlide(current)
    }
  }
  prependSlide(src: string) {
    if (
      !!src
    ) {
      this.swiper.prependSlide
        (`
     <div class="swiper-slide" style="display: flex;">
     ${src}
     </div>
    `)
    }

  }
  appendSlide(src: string) {
    if (!!src) {
      this.swiper.appendSlide
        (`
     <div class="swiper-slide" style="display: flex;">
     ${src}
     </div>
    `)
    }
  }

  loadImage = async (url: string) => {
    url = await this.image.getImageBase64(url)
    return new Promise<any>((resolve, reject) => {
      if (url) {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject({ width: 0, height: 0 });
        img.src = url;
      } else {
        resolve({ width: 0, height: 0 });
      }
    });
  }

  isWideImage = async (primary: any, secondary: any) => {
    if (primary) primary.src = await this.image.getImageBase64(primary.src)
    if (secondary) secondary.src = await this.image.getImageBase64(secondary.src)

    const [imgPrimary, imgSecondary] = await Promise.all([this.loadImage(primary?.src), this.loadImage(secondary?.src)]);

    if (imgPrimary.width > imgPrimary.height || imgSecondary.width > imgSecondary.height) {
      return {
        'primary': { ...primary, width: imgPrimary.width, height: imgPrimary.height },
        'secondary': undefined
      };
    } else {
      return {
        'primary': { ...primary, width: imgPrimary.width, height: imgPrimary.height },
        'secondary': { ...secondary, width: imgSecondary.width, height: imgSecondary.height }
      };
    }
  }

  ngAfterViewInit() {
    this.zoom.zoom(1);
    this.swiper = new Swiper(".mySwiper5", {
      speed:300,
      mousewheel: {
        thresholdDelta: 20,
        forceToAxis: false,
        thresholdTime: 500,
      },
      grabCursor: true,
      effect: "creative",
      creativeEffect: {
        prev: {
          shadow: true,
          translate: ["-20%", 0, -1],
        },
        next: {
          translate: ["100%", 0, 0],
        },
      },
    });
    // this.swiper.stop
    this.swiper.on('slidePrevTransitionEnd', async () => {

      if (!this.ccc) {
        this.ccc = true;

        await this.next()

        this.ccc = false;
        setTimeout(() => {
          this.next()
        }, 0)
      }
    });
    this.swiper.on('slideChange', async () => {
      if (!this.ppp) {
        this.ppp = true;

        await this.updata()
        this.zoom.zoom(1);
        this.ppp = false;
      }
    })

    this.swiper.on('slideNextTransitionEnd', async () => {
      if (!this.ccc) {
        this.ccc = true;

        await this.previous()

        this.ccc = false;
        setTimeout(() => {
          this.previous()
        }, 0)
      }
    });

  }

  ccc = false;
  bbb = false;
  ppp = false;
}
