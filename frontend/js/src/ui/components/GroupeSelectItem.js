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
    }

    appendOptions() {
        this.append(...this.options);
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
}

class SelectGroup extends HTMLItems {
    constructor() {
        super('select');
        this.optgroups = [];
    }

    addOptGroup(optgroup) {
        this.optgroups.append(optgroup);
        return this;
    }

    appendOptGroups() {
        this.append(...this.optgroups.map(optgroup => optgroup.appendOptions()));
        return this;
    }

    appendToElement(HtmlItem) {
        HtmlItem.append(this);
        return this;
    }
}


