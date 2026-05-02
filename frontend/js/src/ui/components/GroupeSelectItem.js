import { HTMLItems, RawHTMLItem } from "../grid/RowTemplates.js";
import { ListEvents } from "../../core/EventBus.js";
import {visualizerManifest} from '../visuals/graphs/Registry.js';

class Option extends HTMLItems {
    constructor() {
        super('option');
    }
}

class OptGroup extends HTMLItems {
    constructor(label = '') {
        super('optgroup');
        this.label(label);
        this.options = [];
    }

    label(value) {
        value = value ?? '';
        this.attribute('label', value);
        return this;
    }

    addOption(option) {
        this.options.push(option);
        return this;
    }

    appendOptions() {
        this.append(...this.options);
        return this;
    }
}

class SelectItem extends HTMLItems {
    constructor() {
        super('select');
        this.options = [];
    }

    addOption(option) {
        this.options.push(option);
        return this;
    }

    clearOptions() {
        this.options = [];
        this.clearChilds();
    }

    appendOptions() {
        this.append(...this.options);
        return this;
    }

    appendToElement(HtmlItem) {
        HtmlItem.append(this);
        return this;
    }

    onChange(cb) {
        this.addEventListener('change', cb);
    }
}

class SelectGroup extends SelectItem {
    constructor() {
        super('select');
        this.optgroups = [];
    }

    addOptGroup(optgroup) {
        this.optgroups.push(optgroup);
        return this;
    }

    appendOptGroups() {
        this.append(...this.optgroups.map(optgroup => optgroup.appendOptions()));
        return this;
    }

    clearOptions() {
        this.options = [];
        this.clearChilds();
    }
}


export class VisualizerDropdownComponent {
    constructor() {
        this.select = new SelectGroup();
    }

    buildFromManifest(manifest) {
        if (!manifest) return;

        Object.keys(manifest).forEach((key) => {
            const optGroup = new OptGroup(key);
            this.select.addOptGroup(optGroup);

            manifest[key].forEach((arr) => {
                const opt = new Option();
                opt.data('cat', key);
                opt.innerContent(arr[0]);
                opt.val(arr[1]);
                optGroup.addOption(opt);
            });
        });

        this.select.appendOptGroups();
    }

    appendAll() {
        this.select.appendOptGroups();
    }

    show() { this.select.css({ opacity: '1' }); }
    hide() { this.select.css({ opacity: '0' }); }

    onChange(cb) {
        this.select.onChange(cb);
    }

    hover(cbIn, cbOut) {
        this.select.hover(cbIn, cbOut);
    }

    appendToElement(htmlItem) {
        this.select.appendToElement(htmlItem);
    }
}

export class RendererSelectComponent {
    constructor() {
        this.select = new SelectItem();
        this.renderers = {
            'barchart': ['bar'],
            'waveform': ['horizontal', 'vertical', 'radial']
        }
    }

    build(renderers = []) {
        if (!renderers) return;
        this.select.clearOptions();
        this.addDefaultOption();
        renderers.forEach((renderer) => {
            const option = new Option();
            option.innerContent(renderer).val(renderer);
            this.select.addOption(option);
        });

        this.select.appendOptions();
    }

    buildByCategory(category) {
        this.build(this.renderers[category]);
    }

    appendToElement(htmlItem) {
        this.select.appendToElement(htmlItem);
    }

    addDefaultOption() {
        const option = new Option();
        option.innerContent(' ').val('default');
        this.select.addOption(option);
    }

    onChange(cb) {
        this.select.onChange(cb);
    }
}

export const VisualSelectManager = {
    init(parentItem) {
        this.visualizerSelect = new VisualizerDropdownComponent();
        this.rendererSelect = new RendererSelectComponent();
        this.events = new ListEvents();
        
        this.parentItem = parentItem;

        this.visualizerSelect.onChange((e) => {
            const target = e.target;
            this.category = target.options[target.selectedIndex].dataset.cat;
            this.graphName = target.value;
            this.rendererSelect.buildByCategory(this.category);
            this.rendererSelect.appendToElement(this.container);
        });

        this.rendererSelect.onChange((e) => {
            this.renderer = e.target.value;
            this.events.trigger('onCategoryChange', this.category, this.graphName, this.renderer);
        });

        this.container = new HTMLItems('div');

        this.container.classAdd('visualizer-selects');

        this.container.hover(e => this.container.css({
            backgroundColor: 'rgba(0,0,0,.7)',
        }), e => this.container.css({
            backgroundColor: 'rgba(0,0,0,.3)',
        }));

        this.parentItem.hover(e => this.container.css({
            opacity: '1',
        }), e => this.container.css({
            opacity: '0',
        }));

        this.visualizerSelect.buildFromManifest(visualizerManifest);

        this.visualizerSelect.appendAll();
        this.visualizerSelect.appendToElement(this.container);
        this.parentItem.append(this.container);
    },

    onCategoryChange(cb, subscriber) {
        this.events.onEventRegister({cb, subscriber}, 'onCategoryChange');
    }
}