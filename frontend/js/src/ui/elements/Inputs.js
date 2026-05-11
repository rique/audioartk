import { HTMLItems } from "../base/HTMLItem.js";

export class EditInput extends HTMLItems {
    constructor() {
        super('input');
        this.render().setAttribute('type', 'text');
        this.createCustomEvent('myInput')
        this.addEventListener('input', () => {            
            this.dispatchEvent('myInput');
        });
    }

    hidden(hidden) {
        if (hidden) {
            this.isHidden = true;
            this.render().setAttribute('type', 'hidden');
        } else {
            this.isHidden = false;
            this.render().setAttribute('type', 'text');
        }
    }

    onInput(cb) {
        this.addEventListener('myInput', cb);
    }

    value(value) {
        if (value)
            this.render().value = value;
        else
            return this.render().value;
    }

    blur() {
        this.render().blur();
    }

    focus() {
        this.render().focus();
    }

    select() {
        this.render().select();
    }

    onBlur(cb) {
        this.addEventListener('blur', cb);
    }

    onFocus(cb) {
        this.addEventListener('focus', cb);
    }
}