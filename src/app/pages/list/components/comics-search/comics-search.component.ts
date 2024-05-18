import { Component, ElementRef, NgZone, ViewChild } from '@angular/core';
import { AppDataService, ContextMenuEventService, DbControllerService, DbEventService, HistoryService, QueryEventService } from 'src/app/library/public-api';
import { DataService } from '../../services/data.service';
import { ActivatedRoute, NavigationStart, ParamMap, Router } from '@angular/router';
import { Subject, firstValueFrom, map, throttleTime } from 'rxjs';
import { NgxIndexedDBService } from 'ngx-indexed-db';
import { WebFileService } from 'src/app/library/web-file/web-file.service';
import { CurrentService } from '../../services/current.service';
import { ComicsListV2Service } from '../comics-list-v2/comics-list-v2.service';
import { ComicsSelectTypeService } from '../comics-select-type/comics-select-type.service';

@Component({
  selector: 'app-comics-search',
  templateUrl: './comics-search.component.html',
  styleUrl: './comics-search.component.scss'
})
export class ComicsSearchComponent {
  _keyword = "";
  get keyword() { return this._keyword };
  set keyword(value: string) {
    this._keyword = value;
  }
  async search() {

    this.router.navigate(['/search', this.origin, this.utf8_to_b64(this.keyword)]);
  }
  obj = {};
  key: string = '';
  @ViewChild('listbox') ListNode: ElementRef;
  _ctrl = false;
  page_num = 1;
  page_size = 20;
  list = [];


  query = {
    id: "",
    default_index: 0,
    list: [],
    name: ""
  }
  query_option = {};
  origin = '';
  menu_id = '';

  id = null;
  type = null;

  value = '';
  is_destroy = false;

  constructor(
    public data: DataService,
    public current: CurrentService,
    public ContextMenuEvent: ContextMenuEventService,
    public router: Router,
    public WebFile: WebFileService,
    private zone: NgZone,
    public route: ActivatedRoute,
    public DbController: DbControllerService,
    public webDb: NgxIndexedDBService,
    public DbEvent: DbEventService,
    public ComicsListV2: ComicsListV2Service,
    public ComicsSelectType: ComicsSelectTypeService,
    public history: HistoryService,
    public App: AppDataService
  ) {

    this.router.events.subscribe(event => {

      if (event instanceof NavigationStart) {

      }

    })
    let id$ = this.route.paramMap.pipe(map((params: ParamMap) => params));
    id$.subscribe(async (params) => {
      if (this.id) await this.put()
      const origin = params.get('id')
      const value = this.b64_to_utf8(params.get('sid'))

      this.id=`${origin}_${value}`
      this.origin = origin;
      this.value = value;
      this.keyword=value;
      this.App.setOrigin(origin)
      const obj = this.DbEvent.Configs[origin].menu.find(x => x.id == 'search');
     if( obj.query.page_size) this.page_size = obj.query.page_size;


      const data: any = await this.get(this.id);
      if (data) {
        this.page_num = data.page_num;
        this.list = data.list;
        if (this.list.length == 0) {
          this.page_num = 0;
        }

        this.zone.run(() => {
          setTimeout(() => {
            this.ListNode.nativeElement.scrollTop = data.scrollTop;
            this.overflow()
          })

        })

      } else {
        this.init();

      }

    })
  }
  private utf8_to_b64 = (str: string) => {
    return window.btoa(encodeURIComponent(str));
  }
  private b64_to_utf8 = (str: string) => {
    return decodeURIComponent(window.atob(str));
  }
  async on_list($event: MouseEvent) {
    const node = $event.target as HTMLElement;
    if (node.getAttribute("id") == 'comics_list') {
      this.list.forEach(x => x.selected = false)
    } else {
      const getTargetNode = (node: HTMLElement): HTMLElement => {
        if (node.getAttribute("region") == "comics_item") {
          return node
        } else {
          return getTargetNode(node.parentNode as HTMLElement)
        }
      }

      const target_node = getTargetNode(node);
      const index = parseInt(target_node.getAttribute("index") as string);
      const data = this.list[index]
      if (this.data.is_edit || this._ctrl) {
        this.list[index].selected = !this.list[index].selected;
      } else {
        localStorage.setItem('list_url', window.location.href)
        const nodec: any = $event.target
        if (nodec.getAttribute("router_reader")) {

          this.current.routerReader(this.origin, data.id)
        } else {
          this.current.routerDetail(this.origin, data.id)
        }
      }

    }
  }


  async put() {
    let obj = {
      id: this.id,
      query: this.query,
      list: this.list,
      page_num: this.page_num,
      scrollTop: this.ListNode.nativeElement.scrollTop
    }

    return await firstValueFrom(this.webDb.update("data", obj))
  }

  async get(id) {
    const res = await firstValueFrom(this.webDb.getByKey("data", id))
    if (res) {
      return res
    } else {
      return null
    }
  }


  ngAfterViewInit() {
    this.ListNode.nativeElement.addEventListener('scroll', (e: any) => {
      this.scroll$.next(e)
    }, true)
    this.scroll$.pipe(throttleTime(300)).subscribe(e => {
      this.handleScroll(e);
    })

  }

  async initFiast(obj) {
    if (this.value == '') return []
    console.log({ keyword: this.value, ...obj }, { origin: this.origin });

    return await this.DbController.Search({ keyword: this.value, ...obj }, { origin: this.origin });
  }

  async add(obj) {
    if (this.value == '') return []

    console.log({ keyword: this.value, ...obj }, { origin: this.origin });
    return await this.DbController.Search({ keyword: this.value, ...obj }, { origin: this.origin });
  }

  async init() {
    this.page_num = 1;
    this.ListNode.nativeElement.scrollTop = 0;
    this.list = await this.initFiast({ page_num: this.page_num,page_size:this.page_size });
    console.log(this.list);

    this.overflow()
  }
  async overflow() {
    setTimeout(async () => {
      const node = this.ListNode.nativeElement.querySelector(`[index='${this.list.length - 1}']`)
      if (node && this.ListNode.nativeElement.clientHeight < node.getBoundingClientRect().y) {

      } else {
        await this.add_pages();
        this.overflow();
      }
    }, 50)
  }
  scroll$ = new Subject();
  getData() {
    if (this.list.length) {
      this.add_pages();
    } else {
      setTimeout(() => {
        this.getData()
      }, 10)
    }
  }
  async handleScroll(e: any) {
    const node: any = this.ListNode.nativeElement;
    let scrollHeight = Math.max(node.scrollHeight, node.scrollHeight);
    let scrollTop = e.target.scrollTop;
    let clientHeight = node.innerHeight || Math.min(node.clientHeight, node.clientHeight);
    if (clientHeight + scrollTop + 50 >= scrollHeight) {
      await this.add_pages();
    }
  }
  ngOnDestroy() {
    this.put();
    this.is_destroy = true;
    this.scroll$.unsubscribe();
  }
  is_end = false;
  async add_pages() {
    if (this.is_destroy) return
    this.page_num++;
    const list = await this.add({ page_num: this.page_num,page_size:this.page_size });
    if (list.length == 0) {
      this.page_num--;
      return
    }
    this.list = [...this.list, ...list]
  }
}
