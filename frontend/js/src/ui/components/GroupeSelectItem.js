import { HTMLItems, RawHTMLItem } from "../grid/RowTemplates.js";

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

        this.select.css({
            position: 'absolute',
            top: '4px',
            right: '20px',
            zIndex: '100',
            opacity: '0',
            transition: 'opacity 0.36s ease',
            cursor: 'pointer',
            padding: '8px',
            backgroundColor: 'rgba(0,0,0,0.3)',
            color: '#e3e3e3',
            border: '1px solid #444',
            borderRadius: '6px'
        });

        this.select.hover(e => this.select.css({
            backgroundColor: 'rgba(0,0,0,0.7)',
        }), e => this.select.css({
            backgroundColor: 'rgba(0,0,0,0.3)',
        }))
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