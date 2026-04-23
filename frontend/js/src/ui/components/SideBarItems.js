import { HTMLItems, RawHTMLItem } from "../grid/RowTemplates.js";

export class Button extends HTMLItems {
    constructor() {
        super('button');
    }
} 

export class SectionDiv extends HTMLItems {
    constructor() {
        super('div');
    }
}

export class BaseSideBarItem {
    constructor() {
        this.buttonItem = new Button();
    }

    classAdd(...classes) {
        this.buttonItem.classAdd(...classes);
        return this.buttonItem;
    }

    render() {
        return this.buttonItem.render();
    }
}

export class PlaylistItem extends BaseSideBarItem {
    constructor(playlistName, playlistUUID) {
        super();
        this.playlistName = playlistName;
        this.playlistUUID = playlistUUID;
        this.initComponent();
    }

    initComponent() {
        this.classAdd('open-playlist-edit', 'no-wrap-ellipsis')
            .data('playlistId', this.playlistUUID)
            .innerContent(this.playlistName);
    }
}

export class ActionButtonsItem extends BaseSideBarItem {
    constructor(name) {
        super();
        this.name = name;
        this.initComponent();
    }

    initComponent() {
        this.buttonItem.innerContent(this.name);
    }
}

export class SideBarSectionItem {
    constructor(id) {
        this.sectionItem = new SectionDiv();
        this.id(id);
        this.sectionItems = [];
    }

    addSectionItems(...items) {
        this.sectionItems.push(...items);
    }

    id(id) {
        this.sectionItem.id(id);
    }

    appendItems() {
        this.sectionItem.append(...this.sectionItems);
    }

    render() {
        return this.sectionItem.render();
    }
}

export class OpenMenuItem extends HTMLItems {
    constructor() {
        super('div');
        this.innerItem = new HTMLItems('i');
        this.initComponent();
    }

    initComponent() {
        this.innerItem.classAdd('fa-solid', 'fa-ellipsis-vertical');
        this.id('open-menu')
            .style('vertical-align', 'top')
            .classAdd('inline-block')
            .append(this.innerItem);
    }
}

export class MainSideBarItem extends HTMLItems {
    constructor() {
        super('div');
        this.openMenuItem = new OpenMenuItem();
        this.subMenuItem = new HTMLItems('div');
        this.controlsItem = new HTMLItems('div');
        this.fileBrowserActionItem = new HTMLItems('div');
        this.initComponent();
    }

    initComponent() {
        this.subMenuItem.id('left-menu')
            .style('vertical-align', 'top')
            .classAdd('inline-block');
        
        this.controlsItem.id('controls')
            .classAdd('inline-block');

        this.fileBrowserActionItem.id('file-browser-action');

        this.controlsItem.append(this.fileBrowserActionItem);
        this.subMenuItem.append(this.controlsItem);
        
        this.id('main-left-menu')
            .append(this.openMenuItem, this.subMenuItem);
    }

    addSection(sectionItem) {
        this.fileBrowserActionItem.append(sectionItem);
    }

    addOpenCloseEventCallback(cb) {
        this.openMenuItem.addEventListener('click', cb);
    }
}

export class SideBarItem {
    constructor() {
        this.MainSideBarItem = new MainSideBarItem();
        this.MainSideBarItem.addOpenCloseEventCallback(this.openClose.bind(this));
    }

    init(parentElement) {
        parentElement.append(this.MainSideBarItem.render());
    }

    openClose() {
        this.MainSideBarItem.classToggle('is-open');
    }

    addComponent(itemComponent) {
        this.MainSideBarItem.addSection(itemComponent);
    }
}

export class RawVolumeControlSection extends RawHTMLItem {
    constructor() {
        super(``)

        this.initComponent();
    }

    initComponent() {
        this.html = document.createElement('div');
        this.html.id = "volume-control";
        this.html.innerHTML = `
            VOL : <span class="vol-up">
              <i class="fa-solid fa-plus"></i>
            </span><span class="vol-down">
              <i class="fa-solid fa-minus"></i>
            </span><span class="vol-val">100</span>
            <div id="volume-bar-container">
              <div id="main-volume-bar"><div id="volume-bar"></div></div>
            </div>
        `
    }
}
